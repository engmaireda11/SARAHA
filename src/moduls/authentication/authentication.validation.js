import { email, z } from "zod";
import { GenderEnum } from "../../common/enum/index.js";
import { constgeneralValidationFields } from "../../common/validation.js";

export const loginSchema = (lang) => {
  return z.strictObject({
    email: constgeneralValidationFields.email(lang),
    password: constgeneralValidationFields.password(lang),
  });
};

export const login = (lang) => {
  return z.object({
    body: loginSchema(lang),
    query: z.strictObject({
      lang: z.enum(["ar", "en"]).default("ar"),
      // darkMood:z.stringbool()
    }),
  });
};
export const signup = (lang) => {
  return z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: constgeneralValidationFields.username(lang),
        phone: constgeneralValidationFields.phone(lang),
        confirmPassword: constgeneralValidationFields.confirmPassword(lang),
        //gender:constgeneralValidationFields.gender(lang),
        //confirmEmail:constgeneralValidationFields.email(lang),
      })
      .superRefine((data, ctx) => {
        constgeneralValidationFields.matchFeild({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
        });
        // constgeneralValidationFields.matchFeild({original:"email",copy:"confirmEmail",data,ctx,lang})

        if (!data.username.includes(" ")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: "username must contain two parts",
          });
        }
      }),
  });
};

export const confirmEmail = (lang) => {
  return z.object({
    body: z.strictObject({
      email: constgeneralValidationFields.email(lang),
      otp: constgeneralValidationFields.otp(lang),
    }),
  });
};
export const resendConfirmEmail = (lang) => {
  return z.object({
    body: z.strictObject({
      email: constgeneralValidationFields.email(lang),
    }),
  });
};
export const resetForgotPassword = (lang) => {
  return z
    .object({
      body: z.strictObject({
        email: constgeneralValidationFields.email(lang),
        otp: constgeneralValidationFields.otp(lang),
        password: constgeneralValidationFields.password(lang),
        confirmPassword: constgeneralValidationFields.confirmPassword(lang),
      }),
    })
    .superRefine((data, ctx) => {
      constgeneralValidationFields.matchFeild({
        original: "password",
        copy: "confirmPassword",
        data,
        ctx,
        lang,
      });
    });
};
