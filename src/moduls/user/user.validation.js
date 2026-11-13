import { z } from "zod";
import { constgeneralValidationFields } from "../../common/validation.js";

export const confirmEnableTwoStepVerification = (lang) => {
  return z.object({
    body: z.strictObject({
      otp: constgeneralValidationFields.otp(lang),
    }),
  });
};
