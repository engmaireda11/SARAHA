import { Router } from "express";
import {
  fileValidation,
  processFile,
  processMulterUpload,
  successResopnse,
  
} from "../../common/utils/index.js";
import {
  confirmEnableTwoStepVerification,
  logout,
  profile,
  requestEnableTwoStepVerification,
  rotateToken,
  update,
} from "./user.service.js";
import { authentication, authrization, uploadMiddleware, validation } from "../../middleware/index.js";
import * as validators from "./user.validation.js";
import { RoleEnum, TokenTypeEnum } from "../../common/enum/index.js";
import { localFileUpload } from "../../common/utils/index.js";

const router = Router();

router.get("/", authentication(), async (req, res, next) => {
  const data = await profile(req.user);
  return successResopnse({ res, message: "user", status: 200, data });
});

router.patch(
  "/",
  authentication(),
  authrization(RoleEnum.USER),
  async (req, res, next) => {
    const data = await update(req.user, req.body);
    return successResopnse({ res, message: "user", status: 200, data });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESS),
  async (req, res, next) => {
    const data = await rotateToken(
      req.payload,
      req.user,
      `${req.protocol}://${req.host}`,
    );
    return successResopnse({ res, message: "user", status: 200, data });
  },
);

router.post(
  "/enable-2step-verification",
  authentication(),
  async (req, res, next) => {
    await requestEnableTwoStepVerification(req.user);
    return successResopnse({
      res,
      message: "Verification code sent to your email",
      status: 200,
    });
  },
);

router.patch(
  "/confirm-enable-2step-verification",
  authentication(),
  validation(validators.confirmEnableTwoStepVerification),
  async (req, res, next) => {
    await confirmEnableTwoStepVerification(req.user, req.body);
    return successResopnse({
      res,
      message: "2-step verification enabled",
      status: 200,
    });
  },
);

router.post("/logout", authentication(), async (req, res, next) => {
  const data = await logout(req.payload, req.user, req.body);
  return successResopnse({ res, message: "user", status: 200, data });
});

router.patch(
  "/profile-image",
  authentication(),
  uploadMiddleware({
   multerMiddleware:localFileUpload({maxSize:5}).single("attachment"),
   customPath:"users",
   validation:fileValidation.image
  }),
//   localFileUpload({ maxSize: 3, validation: fileValidation.image })
//     //.any(),
//     //.fields([{name:"attachment",maxCount:5},{name:"cover",maxCount:5}]),
//     //.array("attachment",5),
//     .single("attachment"),
//   processMulterUpload({customPath:"users", validation: fileValidation.image }),
  async (req, res, next) => {
    req.user.image = req.file.finalPath;
    await req.user.save()
    return successResopnse({ res, data: {user:req.user} });
  },
);

export default router;
