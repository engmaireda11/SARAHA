import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import axios from "axios";
import geoip from "geoip-lite";
import { successResopnse } from "./successResponse.js";
import { client } from "../../db/redis.connection.js";
import { NODE_ENV } from "../../config.js";

async function fromWhere(ip) {
  try {
    // const response = await axios.get(`https://ipapi.co/${ip}/json`)
    // return response.data

    return geoip.lookup(ip);
  } catch (error) {
    console.log(error);
  }
}


export const generateLimiter =({
    ttl=15,
    message="Too Many Requests",status=429,
      standardHeaders="draft-8",
      skipSuccessfulRequests,
      skipFailedRequests,
       legacyHeaders=true,
       limit=1000
})=>{
    return rateLimit({
  windowMs: ttl * 60 * 1000,
  standardHeaders,
limit: async function (req) {
  const data = await fromWhere(req.ip);

  console.log("IP:", req.ip);
  console.log("Country:", data?.country);

  if (NODE_ENV === "development") return limit;

  if (!data) return limit;

  return data.country === "EG" ? limit : 0;
},
   legacyHeaders,
   
  handler: function (req, res, next) {
    return successResopnse({ res, message, status });
  },
  keyGenerator: function (req) {
    const ip = ipKeyGenerator(req.ip, 52);
    return `${ip}::${req.path}`;
  },
  store: {
    localKeys: undefined,

    init(options) {
        this.windowMs = options.windowMs;
    },

    async increment(key) {
        const count = await client.incr(key);

        if (count === 1) {
            await client.expire(key, Math.ceil(this.windowMs / 1000));
        }

        const ttl = await client.ttl(key);

        return {
            totalHits: count,
            resetTime: new Date(Date.now() + ttl * 1000)
        };
    },

    async decrement(key) {
        await client.decr(key);
    },

    async resetKey(key) {
        await client.del(key);
    },

    async get(key) {
        const count = await client.get(key);

        if (count === null) return undefined;

        const ttl = await client.ttl(key);

        return {
            totalHits: Number(count),
            resetTime: new Date(Date.now() + ttl * 1000)
        };
    }
},
  // store:{
  //   async incr(key,cb){
  //       try {
  //           const count =await client.incr(key)
  //           if(count==1)
  //           {
  //               await client.expire(key,60*ttl)
  //           }
  //           cb(null,count)
  //       } catch (error) {
  //           cb(error)
  //       }
  //   },
  //   async decrement (key) {
  //       if(await client.exists(key)){
  //           await client.decr(key)
  //       }
  //   }

  // },
  skipSuccessfulRequests,
  skipFailedRequests
});
}