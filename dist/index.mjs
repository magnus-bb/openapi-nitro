import { defu } from 'defu';
import { fileURLToPath } from 'node:url';
import { withLeadingSlash, withoutTrailingSlash, withBase } from 'ufo';
import { dirname, resolve } from 'pathe';

const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
const runtime = resolve(_dirname, "../runtime");
function index(spec) {
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
function openAPINitroOptions(nitro) {
  return {
    typescript: {
      strict: true
    },
    plugins: [resolve(runtime, "plugin.ts")],
    errorHandler: resolve(runtime, "error.ts"),
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

export { index as default };
