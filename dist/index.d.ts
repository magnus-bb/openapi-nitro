import type { ZodOpenApiObjectWithPaths } from './types';
import type { NitroModule } from 'nitropack';
export default function (spec?: Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>): NitroModule;
