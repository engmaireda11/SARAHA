import { z } from "zod";
import { constgeneralValidationFields } from "../../common/validation.js";

export const createRequest = (lang) => {
  return z.object({
    body: z.strictObject({
      messageId: constgeneralValidationFields.id(lang),
    }),
  });
};

export const getRequests = (lang) => {
  return z.object({
    query: z.strictObject({
      status: z.enum(["0", "1", "2"]).optional(), // 0 pending, 1 accepted, 2 rejected
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
    }),
  });
};

export const answerRequest = (lang) => {
  return z.object({
    params: z.strictObject({
      requestId: constgeneralValidationFields.id(lang),
    }),
    body: z.strictObject({
      action: z.enum(["accept", "reject"]),
    }),
  });
};
