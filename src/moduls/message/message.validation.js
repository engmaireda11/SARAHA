import { z } from "zod";
import { constgeneralValidationFields } from "../../common/validation.js";

export const createMessage = (lang) => {
  return z
    .object({
      body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        receiverId: constgeneralValidationFields.id(lang),
      }),
      files: z.array(constgeneralValidationFields.file(lang)).max(3).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.body.content && !data.files?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Missing Message Content",
        });
      }
    });
};

export const allMessages = (lang) => {
  return z.object({
    query: z.strictObject({
      type: z.enum(["0", "1", "2"]).default("0"),
      page:z.coerce.number().default(1),
      limit:z.coerce.number().default(5),
    }),
  });
};
export const deletaMessages = (lang) => {
  return z.object({
    params: z.strictObject({
      messageId:constgeneralValidationFields.id(lang),
  
    }),
  });
};
