import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

// Create Redis client (uses local default if REDIS_URI is not provided)
const redisClient = createClient({
    url: process.env.REDIS_URI || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

// Helper to connect once
export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;
