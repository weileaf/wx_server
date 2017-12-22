const Redis = require('ioredis');
const redis = Redis();

async function redisSet(key, value, maxAge) {
  await redis.set(key, value);
  await redis.expire(key, maxAge);
}

async function redisGet(key) {
  const r = await redis.get(key)
    .then((r) => {
      if (r) return JSON.parse(r);
      throw new Error('session wrong, please regenerate the session');
    });
  return r;
}

module.exports = {
  redisSet,
  redisGet,
};