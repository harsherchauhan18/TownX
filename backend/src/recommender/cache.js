// tries to use redis if available, otherwise in-memory LRU-like fallback
const ttlDefault = 300; // sec
let client;
let useRedis = false;

try {
  // dynamic import so it doesn't crash if redis package is missing
  const redis = await import('redis'); 
  const { createClient } = redis.default || redis;
  
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL not set in .env');
  }

  client = createClient({ url: process.env.REDIS_URL });
  // suppress annoying logs for connection availability
  client.on('error', (err) => { 
      // only log if it was previously working or debug is on
      if (process.env.NODE_ENV === 'development') {
          // console.warn('redis connection error', err.message); 
      }
  });
  
  await client.connect();
  useRedis = true;
  console.log('Redis connected');
} catch (err) {
  console.warn('redis not available, using memory cache');
}

const memoryCache = new Map();

export async function get(key) {
  if (useRedis && client) {
    try {
      const r = await client.get(key);
      return r ? JSON.parse(r) : null;
    } catch (e) {
      // fallback if redis fails mid-flight
      return null;
    }
  }
  const meta = memoryCache.get(key);
  if (!meta) return null;
  const { value, exp } = meta;
  if (Date.now() > exp) {
    memoryCache.delete(key);
    return null;
  }
  return value;
}

export async function set(key, value, ttl = ttlDefault) {
  if (useRedis && client) {
    try {
      await client.set(key, JSON.stringify(value), { EX: ttl });
      return;
    } catch (e) {
      // ignore redis write errors
    }
  }
  memoryCache.set(key, { value, exp: Date.now() + ttl * 1000 });
}

