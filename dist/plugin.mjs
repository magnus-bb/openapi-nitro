import {
  createDocument
} from "zod-openapi";
import createScalarPage from "./scalar/index.mjs";
import createSwaggerPage from "./swagger/index.mjs";
import { doc } from "./lib.mjs";
import { defu } from "defu";
export default (nitro) => {
  const spec = useRuntimeConfig().openapiSpec;
  nitro.router.get("/openapi", eventHandler((event) => {
    return createDocument(defu(spec, doc));
  }));
  nitro.router.get("/scalar", eventHandler((event) => {
    return createScalarPage(spec.info.title);
  }));
  nitro.router.get("/swagger", eventHandler((event) => {
    return createSwaggerPage(spec.info.title);
  }));
  nitro.hooks.hook("error", (error) => {
    console.error(error.cause ?? error);
  });
};
