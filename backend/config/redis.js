import { Redis } from '@upstash/redis';

// Create Redis client using the REST URL and Token from Upstash
const redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default redisClient;
