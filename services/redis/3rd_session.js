const redis = require('../../models/redis/3rd_session');

async function redisSet(key, value, maxAge) {
  await redis.redisSet(key, value, maxAge);
}

async function redisGet(key) {
  const r = await redis.redisGet(key);
  return r;
}

module.exports = {
  redisSet,
  redisGet,
};