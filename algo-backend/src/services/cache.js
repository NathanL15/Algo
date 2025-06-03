const Redis = require('ioredis');
require('dotenv').config();

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
            console.log('Redis connected successfully');
        });
    }

    // Cache a hint response
    async cacheHint(problemId, hint, expiry = 3600) {
        try {
            const key = `hint:${problemId}`;
            await this.redis.setex(key, expiry, JSON.stringify(hint));
        } catch (error) {
            console.error('Error caching hint:', error);
            throw error;
        }
    }

    // Get a cached hint
    async getCachedHint(problemId) {
        try {
            const key = `hint:${problemId}`;
            const hint = await this.redis.get(key);
            return hint ? JSON.parse(hint) : null;
        } catch (error) {
            console.error('Error getting cached hint:', error);
            throw error;
        }
    }

    // Clear cache for a problem
    async clearProblemCache(problemId) {
        try {
            const key = `hint:${problemId}`;
            await this.redis.del(key);
        } catch (error) {
            console.error('Error clearing problem cache:', error);
            throw error;
        }
    }
}

module.exports = new CacheService(); 