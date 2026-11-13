import express from "express";
import { PORT } from "./config.js";
import crybto from "crypto";
import {
  userController,
  messageController,
  authenticationController,
  requestController,
  conversationController,
} from "./moduls/index.js";
import { globleErrorHandeling } from "./middleware/index.js";
import { bootstarpDB } from "./db/connectiondb.js";
import {
  decryption,
  encryotion,
} from "./common/security/encryption.security.js";
import cors from "cors";
import { client } from "./db/redis.connection.js";
import { exist, get, set, update } from "./common/services/index.js";
import {
  generateLimiter,
  sendEmail,
  successResopnse,
} from "./common/utils/index.js";
import { resolve } from "path";
import helmet from "helmet";

import { RedisClient } from "redis";
import morgan from "morgan";

console.log(crybto.randomBytes(16).toString("hex"));

const app = express();
var corsOptions = {
  origin: "https://127.0.0.1:5500",
  optionsSuccessStatus: 200,
};
const limiter = generateLimiter({ limit: 1000 });

app.set("trust proxy", true);
app.use(express.json());
app.use(helmet(), limiter, cors(), morgan("dev"));
app.use("/assets", express.static("./assets"));
await bootstarpDB(app, PORT);

// client.set("name" ,"mai",{EX:50})
// await set({key:"age",value:20,ttl:50})
// await set({key:"gender",value:{type:"female"}})
// console.log(await get({key:"gender"}));
// console.log(await get({key:"age"}));
// console.log(await exist({key:"age"}));
// console.log(await update({key:"age",value:60}));
// console.log(await get({key:"age"}));

app.all("/", (req, res, next) =>
  res.status(200).json({ message: "Hello Sarha App" }),
);
app.use("/auth", authenticationController);
app.use("/user", userController);
app.use("/message", messageController);
app.use("/request", requestController);
app.use("/conversation", conversationController);

app.all("{/*dummy}", (req, res, next) =>
  res.status(404).json({ message: "Invalid Application Route" }),
);

const cipherText = await encryotion("mai");
console.log({ cipherText });

await decryption(cipherText);
app.use(globleErrorHandeling);

// await sendEmail({subject:"text",to:"maireda017@gmail.com",cc:"blwqaffrvmykrcmwlo@onldm.net",html:`<h1>Hello</h1>`, attachments :[{
//     filename:"photo.png",
//     contentType:"image/png",
//     path:`${resolve("./photo.png")}`
// }]})
