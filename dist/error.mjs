import { H3Error } from "h3";
import { z } from "zod";
const isDev = process.env.NODE_ENV === "development";
export default (error, event) => {
  setResponseHeader(event, "Content-Type", "application/json");
  const err = error.cause ?? error;
  if (!isDev && typeof err === "object" && "stack" in err) {
    delete err.stack;
  }
  return send(event, JSON.stringify(err));
};
export class ApiError {
  static schema(dataSchema) {
    return z.object({
      name: z.string(),
      statusCode: z.coerce.string(),
      message: z.string(),
      data: dataSchema,
      stack: z.union([z.string(), z.array(z.string())]).optional()
    });
  }
  // @ts-ignore
  name;
  statusCode;
  // @ts-ignore
  message;
  // @ts-ignore
  data;
  stack;
  constructor(opts) {
    Object.assign(this, opts);
    this.statusCode = opts.statusCode.toString();
  }
}
export class ValidationError extends ApiError {
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
export class UnknownError extends ApiError {
  constructor(err) {
    super({
      name: "UnknownError",
      statusCode: 500,
      message: "An unknown error occurred",
      data: err
    });
  }
}
export function H3ErrorToApiError(err, overrides) {
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
export function H3ErrorToValidationError(err, message) {
  return new ValidationError({
    internal: false,
    message: message ?? err.message,
    data: err.data,
    stack: err.stack
  });
}
export function errorIsIntentional(err) {
  return err instanceof ApiError || err instanceof H3Error;
}
