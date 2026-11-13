import { Router } from "express";
import { generateLimiter, successResopnse } from "../../common/utils/index.js";
import { confirmEmail, confirmLogin, login, requestForgotPasswordCode, resendConfirmEmail, resetForgotPassword, signup, signupWithGmail, verifyForgotPasswordCode } from "./authentication.service.js";
import * as validators from './authentication.validation.js'
import { validation } from "../../middleware/index.js";
import { del } from "../../common/services/cache.services.js";
const router =Router()

router.post("/signup",validation(validators.signup), async(req,res,next)=>{

const data =await signup(req.body)
    return successResopnse({res,status:201,data})
})



router.patch("/confirm-email",validation(validators.confirmEmail), async(req,res,next)=>{

const data =await confirmEmail(req.body)
    return successResopnse({res,status:200,data})
})
router.patch("/resend-confirm-email",validation(validators.resendConfirmEmail), async(req,res,next)=>{

const data =await resendConfirmEmail(req.body)
    return successResopnse({res,status:200,data})
})
router.post("/request-forget-password-code",validation(validators.resendConfirmEmail), async(req,res,next)=>{

const data =await requestForgotPasswordCode(req.body)
    return successResopnse({res,status:201,data})
})



const loginLimiter = generateLimiter({limit:7,ttl:5,skipSuccessfulRequests:true})
router.post("/login",loginLimiter,validation(validators.login), async(req,res,next)=>{
const data =await login(req.validate.data.body,`${req.protocol}://${req.host}`)
await del({key:req.rateLimit.key})
    return successResopnse({
        res,
        status:200,
        data,
        message:data.requiresTwoStepVerification ? "Verification code sent to your email" : undefined
    })
})

router.post("/confirm-login",validation(validators.confirmEmail), async(req,res,next)=>{

const data =await confirmLogin(req.body,`${req.protocol}://${req.host}`)
    return successResopnse({res,status:200,data})
})


router.post("/signup-with-gmail", async(req,res,next)=>{

const {status,data} =await signupWithGmail(req.body,`${req.protocol}://${req.host}`)
    return successResopnse({res,status,data})
})

router.post("/verify-forgot-password",validation(validators.confirmEmail), async(req,res,next)=>{

const data =await verifyForgotPasswordCode(req.body)
    return successResopnse({res,status:200,data})
})
router.patch("/reset-forgot-password",validation(validators.resetForgotPassword), async(req,res,next)=>{

const data =await resetForgotPassword(req.body)
    return successResopnse({res,status:200,data})
})



export default  router