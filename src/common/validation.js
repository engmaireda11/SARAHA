import { size, z } from "zod";
import { GenderEnum, LangguageEnum } from "./enum/index.js";
import mongoose from "mongoose";

const matchFeild = ({ original, copy, data, ctx, lang }) => {
  if (data[original] != data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: ["copy"],
      message:
        lang == LangguageEnum.EN
          ? `Fail to match between ${original} and ${copy}`
          : `فشل التطابق بين كلا من ${original} و ${copy}`,
    });
  }
};

export const constgeneralValidationFields = {
  username: (lang) =>
    z.string().min(2, {
      message:
        lang == LangguageEnum.AR
          ? "عفوا لا يمكن ادخال اسم المستخدم اقل من حرفين"
          : "minimum length 2 chars",
    }),
  phone: (lang) => z.e164(),
  file: (lang) => z.strictObject({
    fieldname:z.string(),
    originalname:z.string(),
    encoding:z.string(),
    mimetype:z.string(),
    buffer:z.instanceof(Buffer),
    size:z.number(),
    path:z.string(),

  }),
  id: (lang) =>
    z.string().refine(
      (data) => {
        return mongoose.Types.ObjectId.isValid(data);
      },
      { message: "Invaild Receiver Id Formate" },
    ),

  confirmPassword: (lang) => z.string().min(8).max(16),
  //gender:(lang)=> z.union([z.literal(GenderEnum.FEMALE), z.literal(GenderEnum.MALE)]),
  email: (lang) =>
    z.email({
      message:
        lang == LangguageEnum.AR
          ? "هذا الايميل غي صحيح الرجاء ادخال ايميل يطابق هذا الشكل example@any.com"
          : "Invaild Email Format Please Add Vaild Email Like example@any.com",
    }),
  otp: (lang) =>
    z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  password: (lang) =>
    z
      .string()
      .min(8)
      .max(16)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
      ),
  matchFeild,
};
