const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.connect();
  }

  connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // Reconnect after 2 seconds
          return 2000;
        },
        maxRetriesPerRequest: 1, // Fail fast for requests
      });

      this.redis.on('connect', () => {
        console.log('✅ Connected to Redis');
        this.enabled = true;
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis connection error, caching disabled:', err.message);
        this.enabled = false;
      });
    } catch (e) {
      console.warn('⚠️ Redis init failed, running without cache');
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.enabled) return;
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (e) {
      // Ignore cache write errors
    }
  }
}

module.exports = new CacheService();