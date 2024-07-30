import { z } from "zod";
import {
  extendZodWithOpenApi
} from "zod-openapi";
import { H3Error } from "h3";
import { ApiError, ValidationError, UnknownError, H3ErrorToValidationError, H3ErrorToApiError, errorIsIntentional } from "./error.mjs";
extendZodWithOpenApi(z);
export const doc = {
  openapi: "3.1.0",
  info: {
    title: "",
    version: "",
    description: ""
  },
  servers: [],
  paths: {}
};
export function addValidatedRoute(routeConfig) {
  const docHasPath = routeConfig.path in doc.paths;
  const lowercaseMethod = routeConfig.method?.toLowerCase();
  const method = lowercaseMethod ?? "get";
  const configuration = {
    summary: routeConfig.summary,
    tags: routeConfig.tags,
    requestParams: {
      path: routeConfig.params,
      query: routeConfig.query
    },
    requestBody: routeConfig.body && {
      content: {
        "application/json": { schema: routeConfig.body }
      }
    },
    responses: routeConfig.responses
  };
  if (!docHasPath) {
    doc.paths[routeConfig.path] = {
      [method]: configuration
    };
  } else {
    doc.paths[routeConfig.path][method] = configuration;
  }
  return eventHandler(async (event) => {
    const [params, query, body] = await Promise.all([
      getAndValidateParams(event, routeConfig.params),
      getAndValidateQuery(event, routeConfig.query),
      getAndValidateBody(event, routeConfig.body)
    ]);
    const eventWithTypedRequestData = addTypedRequestData(event, params, query, body);
    let statusCode;
    let response;
    const strictness = useRuntimeConfig(event).openapiStrictness;
    try {
      response = await routeConfig.handler(eventWithTypedRequestData);
      statusCode = eventWithTypedRequestData.node.res.statusCode.toString();
    } catch (err) {
      if (errorIsIntentional(err)) {
        const schema2 = getResponseSchema(routeConfig.responses, err.statusCode.toString());
        if (schema2) {
          const parsed = schema2.safeParse(err);
          if (!parsed.success) {
            switch (strictness) {
              case 1: {
                console.warn("Response did not match the OpenAPI schema for the given status code", parsed.error);
              }
              case 0: {
                throw err;
              }
              case 2:
              case 3:
              default: {
                throw new ValidationError({ internal: true, data: parsed.error });
              }
            }
          }
          throw parsed.data;
        }
        switch (strictness) {
          case 1:
          case 2: {
            console.warn("Could not find schema for response with the given status code", err);
          }
          case 0: {
            throw err;
          }
          case 3: {
            throw new ValidationError({ internal: true, data: err });
          }
          default: {
            throw err;
          }
        }
      }
      if (err instanceof Error) {
        throw new ApiError({ name: err.name, statusCode: 500, message: err.message, data: err.cause, stack: err.stack });
      }
      throw new UnknownError(err);
    }
    const schema = getResponseSchema(routeConfig.responses, statusCode);
    if (schema) {
      const parsed = schema.safeParse(response);
      if (!parsed.success) {
        switch (strictness) {
          case 1: {
            console.warn("Response did not match the OpenAPI schema for the given status code", parsed.error);
          }
          case 0: {
            throw response;
          }
          case 2:
          case 3:
          default: {
            throw new ValidationError({ internal: true, data: parsed.error });
          }
        }
      }
      return parsed.data;
    }
    switch (strictness) {
      case 1:
      case 2: {
        console.warn("Could not find schema for response with the given status code", response);
      }
      case 0: {
        return response;
      }
      case 3:
      default: {
        throw new ValidationError({ internal: true, data: response });
      }
    }
  });
}
async function getAndValidateParams(event, schema) {
  if (!schema)
    return void 0;
  try {
    return await getValidatedRouterParams(event, schema.parse);
  } catch (err) {
    if (err instanceof H3Error) {
      throw H3ErrorToValidationError(err, "Request route params validation failed");
    }
    return void 0;
  }
}
async function getAndValidateQuery(event, schema) {
  if (!schema) return void 0;
  try {
    return await getValidatedQuery(event, schema.parse);
  } catch (err) {
    if (err instanceof H3Error) {
      throw H3ErrorToValidationError(err, "Request query params validation failed");
    }
    return void 0;
  }
}
async function getAndValidateBody(event, schema) {
  if (!schema) return void 0;
  try {
    return await readValidatedBody(event, schema.parse);
  } catch (err) {
    if (err instanceof H3Error) {
      if (err.statusCode === 405) {
        throw H3ErrorToApiError(err, { name: "DisallowedMethodError" });
      }
      throw H3ErrorToValidationError(err, "Request body validation failed");
    }
    return void 0;
  }
}
function addTypedRequestData(event, params, query, body) {
  Object.assign(event, { params, query, body });
  return event;
}
function getResponseSchema(responses, statusCode) {
  if (responses[statusCode] && "content" in responses[statusCode] && responses[statusCode].content?.["application/json"]?.schema) {
    return responses[statusCode].content["application/json"].schema;
  }
  return void 0;
}
