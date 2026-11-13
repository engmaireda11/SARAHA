import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/index.js";


const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      minLength: 2,
      maxLength: 25,
      require: true,
    },
    lastname: {
      type: String,
      minLength: 2,
      maxLength: 25,
      require: true,
    },
    email: {
      type: String,
      unique: true,
      require: true,
    },
    password: {
      type: String,
      require: function (){
        return this.provider == ProviderEnum.SYSTEM
      },
    },
    phone:String,
    DOB:Date,
    confirmEmail:Date,
    twoStepVerification:{
        type:Boolean,
        default:false
    },
    coverImage:[String],
    image:String,
    changeCredentailsTime:Date,
    gender:{
        type:Number,
        enum:Object.values(GenderEnum),
        default:GenderEnum.MALE
    },
    role:{
        type:Number,
        enum:Object.values(RoleEnum),
        default:RoleEnum.USER
    }
    ,
    provider:{
        type:Number,
        enum:Object.values(ProviderEnum),
        default:ProviderEnum.SYSTEM
    }

  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    autoIndex:true
  },
);

userSchema.virtual("username").set(function (value){
    const [firstname,lastname]=value?.split(" ") || []
    this.set({firstname,lastname})
}).get(function(){
    return `${this.firstname} ${this.lastname}`
})


export const UserModel = mongoose.model.userModel || mongoose.model("User",userSchema)