
import { LangguageEnum } from '../common/enum/index.js';
import { BadRequestException } from '../common/expceptions/error.exception.js';



export const validation =(schema)=>{
    return (req,res,next)=>{
        const lang =Number(req.headers['accept-language'] ?? LangguageEnum.EN)
        console.log({lang});
        
        const validationResult =schema(lang).safeParse({body:req.body,query:req.query,params:req.params,files:req.files,file:req.file})
        console.log({files:req.files})
        if(!validationResult.success){
            console.log({issues:validationResult.error.issues});
            throw BadRequestException("Validation Error",validationResult.error.issues)
        }
        req.validate=validationResult
        next()
    }
}