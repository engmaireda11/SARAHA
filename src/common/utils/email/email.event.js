import { EventEmitter } from "node:events";
import { sendEmail } from "./index.js";
import { verifyEmailTemplet } from "./email.templet.js";



export const eventEmail =new EventEmitter()


eventEmail.on("sendEmail",async({recipients,subject ,data})=>{
try {
    await sendEmail({
    ...recipients,
    subject,
    html:verifyEmailTemplet({code:data.code,subject,title:data?.title??subject})
})
} catch (error) {
    console.log(error);
    
}
})