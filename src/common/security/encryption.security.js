import crybto from "node:crypto";
import { ENC_KEY, IV_LENGTH } from "../../config.js";

export const encryotion = async (plainText) => {
  const iv = crybto.randomBytes(IV_LENGTH);
  const cipherIv = crybto.createCipheriv("aes-256-cbc", ENC_KEY, iv);
  let cipherText = cipherIv.update(plainText, "utf-8", "hex");
  cipherText += cipherIv.final("hex");

  console.log({ plainText, cipherText });

  return `${iv.toString("hex")}::${cipherText}`;
};

export const decryption = async (cipherText) => {
  const [hexIv, encryptedData] = cipherText.split("::");
  const iv = Buffer.from(hexIv, "hex");
  const decipherIv = crybto.createDecipheriv("aes-256-cbc", ENC_KEY, iv);
  let plainText = decipherIv.update(encryptedData, "hex", "utf-8");
  plainText += decipherIv.final("utf-8");
  console.log({ plainText });

  return plainText;
};
