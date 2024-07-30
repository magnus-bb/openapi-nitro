import { ZodOpenApiOperationObject, ZodOpenApiObject, ZodOpenApiPathsObject } from 'zod-openapi';
import { NitroModule } from 'nitropack';

interface ZodOpenApiObjectWithPaths extends ZodOpenApiObject {
    paths: NonNullable<ZodOpenApiPathsObject>;
}
declare module 'zod-openapi' {
    interface ZodOpenApiPathItemObject {
        connect?: ZodOpenApiOperationObject;
    }
}

declare function export_default(spec?: Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>): NitroModule;

export { export_default as default };
