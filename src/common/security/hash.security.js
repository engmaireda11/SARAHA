import { SALT } from "../../config.js";
import bcrypt from "bcrypt";
import { HashingApproachEnum } from "../enum/index.js";
import argon2 from "argon2";

export const hash = async ({
  plainText,
  salt_round = SALT,
  minor = "b",
  approach = HashingApproachEnum.BCRYPT,
} = {}) => {
  let cipherText = undefined;
  switch (approach) {
    case HashingApproachEnum.BCRYPT:
      const saltSignature = await bcrypt.genSalt(salt_round, minor);
      cipherText = await bcrypt.hash(plainText, saltSignature);
      break;
    case HashingApproachEnum.ARGON2:
      cipherText = await argon2.hash(plainText);
      break;
  }

  return cipherText;
};
export const compare = async (plainText, cipherText ,approach = HashingApproachEnum.BCRYPT={}) => {
    let match=false
    switch (approach) {
        case HashingApproachEnum.BCRYPT:
            match = await bcrypt.compare(plainText, cipherText);
            break;
        case HashingApproachEnum.ARGON2:
            match =await argon2.verify(cipherText,plainText)
            break;
        default:
            break;
    }


  return match;
};
