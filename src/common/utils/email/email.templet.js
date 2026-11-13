import { EmailSubjectEnum } from "../../enum/index.js"

const buildOtpTemplet = ({ heading, intro, footerNote, code }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,sans-serif;">
    <div style="max-width:500px; margin:40px auto; background:#ffffff; padding:30px; border-radius:10px; text-align:center;">
        <h1 style="color:#2563eb; margin-top:0;">Saraha App</h1>
        <h2 style="color:#333333;">${heading}</h2>
        <p style="color:#666666; font-size:15px; line-height:1.6;">${intro}</p>
        <div style="margin:30px 0; padding:20px; background:#f1f5f9; border-radius:8px;">
            <h1 style="margin:0; color:#2563eb; letter-spacing:8px; font-size:32px;">${code}</h1>
        </div>
        <p style="color:#666666; font-size:14px;">
            This code is valid for <strong>2 minutes</strong> and can only be used once.
        </p>
        <p style="color:#999999; font-size:13px;">${footerNote}</p>
        <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">
        <p style="color:#999999; font-size:12px;">© 2026 Saraha App. All rights reserved.</p>
    </div>
</body>
</html>`

export const templets={
[EmailSubjectEnum.CONFIRM_EMAIL]:(data)=>{
        return ` 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,sans-serif;">

    <div style="max-width:600px; margin:40px auto; background:#ffffff; padding:30px; border-radius:10px; text-align:center;">

        <h1 style="color:#333333;">Welcome to Saraha ${data.title}!</h1>

        <p style="color:#666666; font-size:16px;">
            Thank you for creating an account.
            Please verify your email address using the code below.
        </p>

        <div style="margin:30px 0; padding:20px; background:#f0f4ff; border-radius:8px;">
            <h2 style="color:#2563eb; letter-spacing:8px; font-size:32px;">
                ${data.code}
            </h2>
        </div>

        <p style="color:#666666; font-size:14px;">
            This verification code will expire in 5 minutes.
        </p>

        <p style="color:#999999; font-size:13px;">
            If you did not create this account, please ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">

        <p style="color:#999999; font-size:12px;">
            © 2026 Saraha App. All rights reserved.
        </p>

    </div>

</body>
</html>` 
},
[EmailSubjectEnum.FORGET_PASSWORD]:(data)=>{
return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#f4f4f4; padding:40px 10px;">

        <tr>
            <td align="center">

                <table width="100%" cellpadding="0" cellspacing="0"
                    style="max-width:500px; background-color:#ffffff;
                    border-radius:10px; overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td align="center"
                            style="background-color:#2563eb; padding:30px; color:#ffffff;">

                            <h1 style="margin:0; font-size:26px;">
                                Saraha App
                            </h1>

                            <p style="margin:10px 0 0;">
                                Password Reset Request
                            </p>

                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:35px 30px; color:#333333;">

                          

                            <p style="font-size:15px; line-height:1.6;">
                                We received a request to reset your password.
                                Use the OTP below to reset your account password.
                            </p>

                            <!-- OTP -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center"
                                        style="background-color:#f1f5f9;
                                        padding:20px; border-radius:8px;">

                                        <h1 style="margin:0; color:#2563eb;
                                        letter-spacing:8px; font-size:32px;">
                                           ${data.code}
                                        </h1>

                                    </td>
                                </tr>
                            </table>

                            <p style="font-size:14px; line-height:1.6;
                            margin-top:25px;">
                                This OTP is valid for <strong>5 minutes</strong>
                                and can only be used once.
                            </p>

                            <p style="font-size:14px; line-height:1.6;">
                                If you didn't request a password reset,
                                please ignore this email.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center"
                            style="background-color:#f8fafc; padding:20px;
                            color:#888888; font-size:12px;">

                            <p>© 2026 Saraha App. All rights reserved.</p>

                            <p>Please do not reply to this email.</p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

</body>
</html>
`
}
,
[EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION]:(data)=>{
    return buildOtpTemplet({
        heading:"Enable 2-Step Verification",
        intro:"We received a request to enable 2-step verification on your account. Use the code below to confirm.",
        footerNote:"If you did not request this, please ignore this email and consider changing your password.",
        code:data.code
    })
},
[EmailSubjectEnum.LOGIN_CONFIRMATION]:(data)=>{
    return buildOtpTemplet({
        heading:"Confirm Your Login",
        intro:"Someone is trying to log in to your account. Use the code below to confirm it is you.",
        footerNote:"If this was not you, do not share this code and consider changing your password.",
        code:data.code
    })
}

}


export const verifyEmailTemplet =(data)=>{
    return templets[data.subject](data)
}