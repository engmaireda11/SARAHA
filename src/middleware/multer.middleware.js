import { BadRequestException } from "../common/expceptions/error.exception.js";
import { processMulterUpload } from "../common/utils/index.js";

export const uploadMiddleware = ({
  isRequird = true,
  multerMiddleware,
  customPath = "general",
  validation = [],
}) => {
  return async (req, res, next) => {
    multerMiddleware(req, res, async (error) => {
      if (error) {
        return next(
          new Error(error.message, {
            cause: { status: 400 },
          }),
        );
      }

      try {
        if (
          isRequird &&
          !req.file &&
          !(Array.isArray(req.files) && req.files.length) &&
          !(typeof req.files == "object" && Object.keys(req.files)?.length)
        ) {
          next(BadRequestException("File Is Required"));
          return;
        }
        await processMulterUpload({ customPath, validation, req });
        next();
      } catch (error) {
        next(new Error(error.message, { cause: { status: 400 } }));
      }
    });
  };
};
