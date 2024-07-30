import { z } from "zod";
export const statusCodeSchema = z.string().refine((code) => {
  return code.match(/^[1-5]\d{2}$/) !== null;
});
