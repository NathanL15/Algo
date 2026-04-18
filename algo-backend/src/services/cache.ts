import Redis from 'ioredis';
import 'dotenv/config';

class CacheService {
    redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times: number): number => {
                return Math.min(times * 50, 2000);
            },
        });

        this.redis.on('error', (err: Error) => {
            console.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
            console.log('Redis connected successfully');
        });
    }

    async cacheHint(problemId: string, hint: unknown, expiry = 3600): Promise<void> {
        try {
            const key = `hint:${problemId}`;
            await this.redis.setex(key, expiry, JSON.stringify(hint));
        } catch (error) {
            console.error('Error caching hint:', error);
            throw error;
        }
    }

    async getCachedHint(problemId: string): Promise<unknown | null> {
        try {
            const key = `hint:${problemId}`;
            const hint = await this.redis.get(key);
            return hint ? JSON.parse(hint) : null;
        } catch (error) {
            console.error('Error getting cached hint:', error);
            throw error;
        }
    }

    async clearProblemCache(problemId: string): Promise<void> {
        try {
            const key = `hint:${problemId}`;
            await this.redis.del(key);
        } catch (error) {
            console.error('Error clearing problem cache:', error);
            throw error;
        }
    }
}

export default new CacheService();
