import mongoose from "mongoose"
import { DB_URI } from "../config.js"
import { UserModel } from "./models/index.js"
import { connectionRedis } from "./redis.connection.js"

export const bootstarpDB = async (app,port)=>{
    try {

        await mongoose.connect(DB_URI,{serverSelectionTimeoutMS:30000})
        await UserModel.syncIndexes()
        console.log("DB connected Successfully")
        await connectionRedis()
        app.listen(port,()=>{
    console.log(`Sever is runnining`)
})
        
    } catch (error) {
        console.log(error);
        
        console.log("Fail to connect to DB");
        
    }
}