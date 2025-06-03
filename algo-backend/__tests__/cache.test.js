const cache = require('../src/services/cache');

describe('Redis Cache Service', () => {
  const testKey = 'test-problem-id';
  const testValue = { hint: 'This is a test hint.' };

  it('should cache and retrieve a hint', async () => {
    await cache.cacheHint(testKey, testValue, 10); // 10 seconds expiry
    const cached = await cache.getCachedHint(testKey);
    expect(cached).toEqual(testValue);
  });

  it('should clear the cached hint', async () => {
    await cache.clearProblemCache(testKey);
    const cached = await cache.getCachedHint(testKey);
    expect(cached).toBeNull();
  });

  afterAll(async () => {
    // Close the Redis connection to prevent open handles
    if (cache.redis && typeof cache.redis.quit === 'function') {
      await cache.redis.quit();
    } else if (cache.redis && typeof cache.redis.disconnect === 'function') {
      cache.redis.disconnect();
    }
  });
});
