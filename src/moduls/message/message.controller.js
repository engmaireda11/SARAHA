import { Router } from "express";
import {
  fileValidation,
  localFileUpload,
  successResopnse,
} from "../../common/utils/index.js";
import { createMessage, deleteMessage, getAllMessage, getMessage } from "./message.service.js";
import { authentication, bearerAuth, uploadMiddleware, validation } from "../../middleware/index.js";
import * as validators from './message.validation.js'

const router = Router();

const messageFolderName = "maessage";
router.post(
  "/",
async  (req,res,next)=>{
   if(req.headers['authorization']){
      await bearerAuth({req})
   }

   next()
  }
  ,
  uploadMiddleware({
    multerMiddleware: localFileUpload().any("attachments", 3),
    validation: fileValidation.image,
    customPath: messageFolderName,
    isRequird: false,
  }),
  validation(validators.createMessage)
  ,
  async (req, res, next) => {
    const data = await createMessage(req.body, req.files,req.user);
    return successResopnse({ res, status: 201, data });
  },
);

router.get("/",authentication(),  validation(validators.allMessages)
 ,async (req,res,next)=>{
 console.log({ v: req.validate})
   const data =await getAllMessage(req.validate.data.query,req.user)

     return successResopnse({ res, status: 200, data });
})
router.delete("/:messageId",authentication(),  validation(validators.deletaMessages)
 ,async (req,res,next)=>{
 console.log({ v: req.validate})
   const data =await deleteMessage(req.validate.data.params,req.user)


     return successResopnse({ res, status: 200, data });
})
router.get("/:messageId",authentication(),  validation(validators.deletaMessages)
 ,async (req,res,next)=>{
 console.log({ v: req.validate})
   const data =await getMessage(req.validate.data.params,req.user)


     return successResopnse({ res, status: 200, data });
})

router.post(
  "/by-account",
  authentication(),
  uploadMiddleware({
    multerMiddleware: localFileUpload().any("attachments", 3),
    validation: fileValidation.image,
    customPath: messageFolderName,
    isRequird: false,
  }),
  validation(validators.createMessage)
  ,
  async (req, res, next) => {
    const data = await createMessage(req.body, req.files,req.user);
    return successResopnse({ res, status: 201, data });
  },
);



export default router;
