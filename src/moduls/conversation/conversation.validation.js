import { z } from "zod";
import { constgeneralValidationFields } from "../../common/validation.js";

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listConversations = (lang) => {
  return z.object({
    query: z.strictObject(pagination),
  });
};

export const sendMessage = (lang) => {
  return z.object({
    params: z.strictObject({
      conversationId: constgeneralValidationFields.id(lang),
    }),
    body: z.strictObject({
      content: z.string().trim().min(1).max(5000),
    }),
  });
};

export const getMessages = (lang) => {
  return z.object({
    params: z.strictObject({
      conversationId: constgeneralValidationFields.id(lang),
    }),
    query: z.strictObject(pagination),
  });
};
