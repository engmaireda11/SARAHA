export const globleErrorHandeling =async (err,req,res,next)=>{
    return res.status(err.cause?.status ||500).json({
        error_message:err.message || "Server Error",
        issues:err.cause?.issues || [],
        err,
        stack: process.env.NODE_ENV === "development" ? err.stack : {}
    })

}