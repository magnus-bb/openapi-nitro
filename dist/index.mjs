import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const defu = require('file:///home/magnus/Development/openapi-nitro/node_modules/defu/dist/defu.mjs');
const node_url = require('node:url');
const index_mjs = require('file:///home/magnus/Development/openapi-nitro/node_modules/ufo/dist/index.mjs');
const sucrase = require('file:///home/magnus/Development/openapi-nitro/node_modules/@rollup/plugin-sucrase/dist/es/index.js');
const index_mjs$4 = require('file:///home/magnus/Development/openapi-nitro/node_modules/h3/dist/index.mjs');
const index_mjs$3 = require('file:///home/magnus/Development/openapi-nitro/node_modules/zod/lib/index.mjs');
const index_mjs$5 = require('file:///home/magnus/Development/openapi-nitro/node_modules/zod-openapi/dist/index.mjs');
const index_mjs$2 = require('file:///home/magnus/Development/openapi-nitro/node_modules/klona/dist/index.mjs');
const destr = require('file:///home/magnus/Development/openapi-nitro/node_modules/destr/dist/index.mjs');
const index_mjs$1 = require('file:///home/magnus/Development/openapi-nitro/node_modules/scule/dist/index.mjs');

function _nullishCoalesce$2(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain$1(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
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
      code = code.replace(/\b_routePath\b/g, JSON.stringify(route)).replace(/\b_routeMethod\b/g, _nullishCoalesce$2(JSON.stringify(method), () => "undefined"));
      return { map: null, code };
    }
  };
}
const suffixRegex = /\.(connect|delete|get|head|options|patch|post|put|trace)(\.(dev|prod|prerender))?$/;
function parseRouteFromFile(filepath, nitro) {
  let route = filepath.replace(/\.[A-Za-z]+$/, "").replace(/\[/g, "{").replace(/\]/g, "}");
  const apiDir = nitro.options.srcDir + index_mjs.withLeadingSlash(nitro.options.apiDir || "api");
  if (route.startsWith(apiDir)) {
    const apiBaseUrl = nitro.options.apiBaseURL || "/api";
    route = index_mjs.withoutTrailingSlash(index_mjs.withBase(removeBasePath(route, [apiDir]), apiBaseUrl));
  } else {
    const routesDir = nitro.options.srcDir + index_mjs.withLeadingSlash(nitro.options.routesDir || "routes");
    const scanDirs = nitro.options.scanDirs.map((d) => {
      return d.startsWith(nitro.options.srcDir) ? d : nitro.options.srcDir + index_mjs.withLeadingSlash(d);
    });
    const unprefixedDirs = [routesDir, ...scanDirs];
    route = index_mjs.withLeadingSlash(
      index_mjs.withoutTrailingSlash(index_mjs.withBase(removeBasePath(route, unprefixedDirs), "/"))
    );
  }
  const suffixMatch = route.match(suffixRegex);
  let method;
  let env;
  if (_optionalChain$1([suffixMatch, "optionalAccess", (_) => _.index])) {
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
    plugins: [node_url.fileURLToPath(new URL("plugin.ts", globalThis._importMeta_.url))],
    errorHandler: node_url.fileURLToPath(new URL("error.ts", globalThis._importMeta_.url)),
    esbuild: {
      options: {
        target: [
          "esnext"
          // makes globalThis._importMeta_ work
        ]
      }
    },
    inlineDynamicImports: true,
    // important to make sure routes in /routes are not lazily loaded (which will make addValidatedRoute not run before route is first hit)
    rollupConfig: {
      // input: './index.ts',
      input: node_url.fileURLToPath(new URL("index.ts", globalThis._importMeta_.url)),
      output: {
        dir: "./dist",
        format: "cjs",
        exports: "named"
      },
      plugins: [
        sucrase({
          exclude: ["node_modules/**"],
          transforms: ["typescript"]
        }),
        fileRouterPlugin(nitro)
      ]
    }
  };
}

function openAPIModule(spec) {
  return {
    name: "openapi",
    setup: (nitro) => {
      nitro.options = defu.defu(openAPINitroOptions(nitro), nitro.options);
      if (!nitro.options.runtimeConfig.openapiStrictness) {
        nitro.options.runtimeConfig.openapiStrictness = 1;
      }
      if (spec) {
        if (!nitro.options.runtimeConfig.openapiSpec) {
          nitro.options.runtimeConfig.openapiSpec = spec;
        } else {
          nitro.options.runtimeConfig.openapiSpec = defu.defu(spec, nitro.options.runtimeConfig.openapiSpec);
        }
      }
      console.info("Running OpenAPI module with strictness set to", nitro.options.runtimeConfig.openapiStrictness);
    }
  };
}

function getEnv(key, opts) {
  const envKey = index_mjs$1.snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /{{(.*?)}}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const inlineAppConfig = {};



const appConfig = defu.defuFn(inlineAppConfig);

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {}
  },
  "openapiStrictness": 3,
  "openapiSpec": {
    "info": {
      "title": "TEST",
      "version": "9.9.9",
      "description": "This is the API documentation for TEST"
    },
    "servers": [
      {
        "url": "/",
        "description": "Local Development Server",
        "variables": {}
      }
    ]
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(index_mjs$2.klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = index_mjs$2.klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(index_mjs$2.klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function _nullishCoalesce$1(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
class ApiError {
  static schema(dataSchema) {
    return index_mjs$3.z.object({
      name: index_mjs$3.z.string(),
      statusCode: index_mjs$3.z.coerce.string(),
      message: index_mjs$3.z.string(),
      data: dataSchema,
      stack: index_mjs$3.z.union([index_mjs$3.z.string(), index_mjs$3.z.array(index_mjs$3.z.string())]).optional()
    });
  }
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  constructor(opts) {
    Object.assign(this, opts);
    this.statusCode = opts.statusCode.toString();
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
    message: _nullishCoalesce$1(message, () => err.message),
    data: err.data,
    stack: err.stack
  });
}
function errorIsIntentional(err) {
  return err instanceof ApiError || err instanceof index_mjs$4.H3Error;
}

function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
index_mjs$5.extendZodWithOpenApi(index_mjs$3.z);
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
  const lowercaseMethod = _optionalChain([routeConfig, "access", (_) => _.method, "optionalAccess", (_2) => _2.toLowerCase, "call", (_3) => _3()]);
  const method = _nullishCoalesce(lowercaseMethod, () => "get");
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
  return index_mjs$4.eventHandler(async (event) => {
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
    return await index_mjs$4.getValidatedRouterParams(event, schema.parse);
  } catch (err) {
    if (err instanceof index_mjs$4.H3Error) {
      throw H3ErrorToValidationError(err, "Request route params validation failed");
    }
    return void 0;
  }
}
async function getAndValidateQuery(event, schema) {
  if (!schema)
    return void 0;
  try {
    return await index_mjs$4.getValidatedQuery(event, schema.parse);
  } catch (err) {
    if (err instanceof index_mjs$4.H3Error) {
      throw H3ErrorToValidationError(err, "Request query params validation failed");
    }
    return void 0;
  }
}
async function getAndValidateBody(event, schema) {
  if (!schema)
    return void 0;
  try {
    return await index_mjs$4.readValidatedBody(event, schema.parse);
  } catch (err) {
    if (err instanceof index_mjs$4.H3Error) {
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
  if (responses[statusCode] && "content" in responses[statusCode] && _optionalChain([responses, "access", (_4) => _4[statusCode], "access", (_5) => _5.content, "optionalAccess", (_6) => _6["application/json"], "optionalAccess", (_7) => _7.schema])) {
    return responses[statusCode].content["application/json"].schema;
  }
  return void 0;
}

exports.ApiError = ApiError;
exports.H3ErrorToApiError = H3ErrorToApiError;
exports.H3ErrorToValidationError = H3ErrorToValidationError;
exports.UnknownError = UnknownError;
exports.ValidationError = ValidationError;
exports.addValidatedRoute = addValidatedRoute;
exports.default = openAPIModule;
exports.doc = doc;
exports.errorIsIntentional = errorIsIntentional;
//# sourceMappingURL=index.mjs.map
