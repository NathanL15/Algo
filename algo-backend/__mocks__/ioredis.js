const store = new Map();

const mockRedisInstance = {
    setex: jest.fn(async (key, _ttl, value) => {
        store.set(key, value);
        return 'OK';
    }),
    get: jest.fn(async (key) => store.get(key) ?? null),
    del: jest.fn(async (key) => {
        const existed = store.has(key);
        store.delete(key);
        return existed ? 1 : 0;
    }),
    hset: jest.fn(async () => 1),
    call: jest.fn(async (...args) => {
        const cmd = (args[0] || '').toUpperCase();
        if (cmd === 'FT.CREATE') return 'OK';
        if (cmd === 'FT.SEARCH') return [0];
        return null;
    }),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    _store: store,
    _reset: () => store.clear(),
};

const Redis = jest.fn(() => mockRedisInstance);
Redis.prototype = mockRedisInstance;

module.exports = Redis;
