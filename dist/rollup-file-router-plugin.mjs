import {
  withLeadingSlash,
  withoutTrailingSlash,
  withBase
} from "ufo";
const _routePathRegex = /\b_routePath\b/g;
const _routeMethodRegex = /\b_routeMethod\b/g;
export default function(nitro) {
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
