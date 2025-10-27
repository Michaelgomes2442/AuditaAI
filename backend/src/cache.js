import Redis from 'ioredis';

// Simple Redis-backed cache helper.
// IMPORTANT: do not auto-connect to localhost when REDIS_URL is not set,
// because that causes repeated ECONNREFUSED logs in environments without Redis.
const redisUrl = process.env.REDIS_URL;
let client = null;

// In-process fallback cache (simple TTL-supporting Map) when Redis isn't configured.
const inMemoryCache = new Map();

if (redisUrl) {
  client = new Redis(redisUrl);
  client.on('error', (err) => {
    console.error('Redis error:', err && (err.stack || err.message) || err);
  });
} else {
  // Quiet info to help debugging when running locally without Redis
  console.info('REDIS_URL not set — using in-memory cache fallback. Set REDIS_URL to enable Redis.');
}

async function getCache(key) {
  if (client) {
    try {
      const v = await client.get(key);
      if (!v) return null;
      return JSON.parse(v);
    } catch (err) {
      console.warn('Cache get failed for', key, err && err.message);
      return null;
    }
  }

  // In-memory fallback
  try {
    const entry = inMemoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return entry.value;
  } catch (err) {
    console.warn('In-memory cache get failed for', key, err && err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 60) {
  if (client) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (err) {
      console.warn('Cache set failed for', key, err && err.message);
      return;
    }
  }

  // In-memory fallback
  try {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    inMemoryCache.set(key, { value, expiresAt });
  } catch (err) {
    console.warn('In-memory cache set failed for', key, err && err.message);
  }
}

export { client as redisClient, getCache, setCache };
