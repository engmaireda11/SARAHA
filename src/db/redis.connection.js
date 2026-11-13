import { createClient } from "redis"
import { REDIS_URL } from "../config.js";

 export const client = createClient({
  url:REDIS_URL
});

export async function connectionRedis() {
    try {
        await client.connect()
        console.log("Redis connection stablis successfully");
        
        
    } catch (error) {
          console.log("Fail to stablis Redis connection");
    }
}