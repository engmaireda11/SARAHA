import multer from "multer";
import { randomUUID } from "crypto";
import { resolve } from "path";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { BadRequestException } from "../../expceptions/error.exception.js";

export const fileValidation = {
  image: ["image/jpeg", "image/png"],
  files: ["application/pdf", "application/json"],
};

export const localFileUpload = ({ maxSize = 5 } = {}) => {
  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, "./assets");
  //   },
  //   filename: function (req, file, cb) {
  //     cb(null, randomUUID() + file.originalname);
  //   },
  // });

  const storage = multer.memoryStorage();
  // function fileFilter(req, file, cb) {
  //   if (validation.includes(file.mimetype)) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Inavaild Formate", { cause: { status: 400 } }), false);
  //   }
  // }

  return multer({
    storage,

    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};

export const processFile = async ({
  customPath = "general",
  file,
  validation = [],
}) => {
  const result = await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    throw BadRequestException("Invaild File Formate");
  } else {
    await mkdir(resolve(`./assets/${customPath}`), { recursive: true });
    const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;
    await writeFile(resolve(`./${uniqueFilePath}`), file.buffer);
    file.path = uniqueFilePath;
  }

  return file;
};
export const processFiles = async ({
  customPath,
  files = [],
  validation = [],
}) => {
  const assets = [];
  for (const file of files) {
    const uploadFile = await processFile({ customPath, file, validation });
    assets.push(uploadFile);
  }
  return assets;
};
export const processFields = async ({
  customPath,
  fields = {},
  validation = [],
}) => {
  const assets = [];
  for (const field of Object.keys(fields)) {
    const files = await processFiles({
      customPath,
      files: field[field],
      validation,
    });
    assets.push({ field, files });
  }
  return assets;
};

export const processMulterUpload = async ({
  req,
  customPath = "general",
  validation = [],
}) => {
  if (req.file) {
    await processFile({ customPath, file: req.file, validation });
  } else if (Array.isArray(req.files)) {
    await processFiles({ customPath, files: req.files, validation });
  } else if (typeof req.files == "object" && Object.keys(req.files)?.length) {
    await processFields({ customPath, fields: req.files, validation });
  }
};


// export const processFile = ({ validation = [] }) => {
//   return async (req, res, next) => {
//     const filePath = resolve(`./${req.file.path}`);
//     const fileBuffer = await readFile(filePath);
//     const result = await fileTypeFromBuffer(fileBuffer);

//     if (!result || !validation.includes(result.mime)) {
//       await unlink(filePath)
//       next(new Error("Invaild File Formate", { cause: { status: 409 } }));
//     }

//     next();
//   };
// };
