import { defu } from 'defu';
import { fileURLToPath } from 'node:url';
import { withLeadingSlash, withoutTrailingSlash, withBase } from 'ufo';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

const _routePathRegex = /\b_routePath\b/g;
const _routeMethodRegex = /\b_routeMethod\b/g;
function fileRouterPlugin(nitro) {
  return {
    name: "file-router",
    transform(code, id) {
      if (code.search(new RegExp(_routePathRegex.source + "|" + _routeMethodRegex.source)) === -1) {
        return { map: null, code };
      }
      const { route, method } = parseRouteFromFile(id, nitro);
      code = code.replace(/\b_routePath\b/g, JSON.stringify(route)).replace(/\b_routeMethod\b/g, JSON.stringify(method) ?? "undefined");
      return { map: null, code };
    }
  };
}
const suffixRegex = /\.(connect|delete|get|head|options|patch|post|put|trace)(\.(dev|prod|prerender))?$/;
function parseRouteFromFile(filepath, nitro) {
  let route = filepath.replace(/\.[A-Za-z]+$/, "").replace(/\[/g, "{").replace(/\]/g, "}");
  const apiDir = nitro.options.srcDir + withLeadingSlash(nitro.options.apiDir || "api");
  if (route.startsWith(apiDir)) {
    const apiBaseUrl = nitro.options.apiBaseURL || "/api";
    route = withoutTrailingSlash(withBase(removeBasePath(route, [apiDir]), apiBaseUrl));
  } else {
    const routesDir = nitro.options.srcDir + withLeadingSlash(nitro.options.routesDir || "routes");
    const scanDirs = nitro.options.scanDirs.map((d) => {
      return d.startsWith(nitro.options.srcDir) ? d : nitro.options.srcDir + withLeadingSlash(d);
    });
    const unprefixedDirs = [routesDir, ...scanDirs];
    route = withLeadingSlash(
      withoutTrailingSlash(withBase(removeBasePath(route, unprefixedDirs), "/"))
    );
  }
  const suffixMatch = route.match(suffixRegex);
  let method;
  let env;
  if (suffixMatch?.index) {
    route = route.slice(0, Math.max(0, suffixMatch.index));
    method = suffixMatch[1];
    env = suffixMatch[3];
  }
  route = route.replace(/\/index$/, "") || "/";
  return {
    route,
    method,
    env
  };
}
function removeBasePath(path, basePaths) {
  const sortedDirs = basePaths.sort((a, b) => b.length - a.length);
  for (const dir of sortedDirs) {
    if (path.startsWith(dir)) {
      return path.slice(dir.length);
    }
  }
  return path;
}

function openAPINitroOptions(nitro) {
  return {
    typescript: {
      strict: true
    },
    plugins: [fileURLToPath(new URL("plugin.ts", import.meta.url))],
    errorHandler: fileURLToPath(new URL("error.ts", import.meta.url)),
    esbuild: {
      options: {
        target: [
          "esnext"
          // makes import.meta work
        ]
      }
    },
    inlineDynamicImports: true,
    // important to make sure routes in /routes are not lazily loaded (which will make addValidatedRoute not run before route is first hit)
    rollupConfig: {
      plugins: [
        fileRouterPlugin(nitro)
      ]
    }
  };
}

function openAPIModule(spec) {
  return {
    name: "openapi",
    setup: (nitro) => {
      nitro.options = defu(openAPINitroOptions(nitro), nitro.options);
      if (!nitro.options.runtimeConfig.openapiStrictness) {
        nitro.options.runtimeConfig.openapiStrictness = 1;
      }
      if (spec) {
        if (!nitro.options.runtimeConfig.openapiSpec) {
          nitro.options.runtimeConfig.openapiSpec = spec;
        } else {
          nitro.options.runtimeConfig.openapiSpec = defu(spec, nitro.options.runtimeConfig.openapiSpec);
        }
      }
      console.info("Running OpenAPI module with strictness set to", nitro.options.runtimeConfig.openapiStrictness);
    }
  };
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Error extends Error {
  constructor(message, opts = {}) {
    super(message, opts);
    __publicField$2(this, "statusCode", 500);
    __publicField$2(this, "fatal", false);
    __publicField$2(this, "unhandled", false);
    __publicField$2(this, "statusMessage");
    __publicField$2(this, "data");
    __publicField$2(this, "cause");
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
__publicField$2(H3Error, "__h3_error__", true);

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
process.env.NODE_ENV === "development";
class ApiError {
  constructor(opts) {
    // @ts-ignore
    __publicField(this, "name");
    __publicField(this, "statusCode");
    // @ts-ignore
    __publicField(this, "message");
    // @ts-ignore
    __publicField(this, "data");
    __publicField(this, "stack");
    Object.assign(this, opts);
    this.statusCode = opts.statusCode.toString();
  }
  static schema(dataSchema) {
    return z.object({
      name: z.string(),
      statusCode: z.coerce.string(),
      message: z.string(),
      data: dataSchema,
      stack: z.union([z.string(), z.array(z.string())]).optional()
    });
  }
}
class ValidationError extends ApiError {
  constructor(opts) {
    const statusCode = opts.internal ? "500" : "400";
    let msg;
    if (opts.message) {
      msg = opts.message;
    } else {
      msg = opts.internal ? "Response validation failed" : "Request validation failed";
    }
    super({
      name: "ValidationError",
      statusCode,
      message: msg,
      data: opts.data,
      stack: opts.stack
    });
  }
}
class UnknownError extends ApiError {
  constructor(err) {
    super({
      name: "UnknownError",
      statusCode: 500,
      message: "An unknown error occurred",
      data: err
    });
  }
}
function H3ErrorToApiError(err, overrides) {
  const opts = Object.assign(
    {
      name: err.name,
      statusCode: err.statusCode,
      message: err.message,
      data: err.data,
      stack: err.stack
    },
    overrides
  );
  return new ApiError(opts);
}
function H3ErrorToValidationError(err, message) {
  return new ValidationError({
    internal: false,
    message: message ?? err.message,
    data: err.data,
    stack: err.stack
  });
}
function errorIsIntentional(err) {
  return err instanceof ApiError || err instanceof H3Error;
}

extendZodWithOpenApi(z);
const doc = {
  openapi: "3.1.0",
  info: {
    title: "",
    version: "",
    description: ""
  },
  servers: [],
  paths: {}
};
function addValidatedRoute(routeConfig) {
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
  if (!schema)
    return void 0;
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
  if (!schema)
    return void 0;
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

export { ApiError, H3ErrorToApiError, H3ErrorToValidationError, UnknownError, ValidationError, addValidatedRoute, openAPIModule as default, doc, errorIsIntentional };
