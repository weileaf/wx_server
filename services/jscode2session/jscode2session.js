const jscode2session = require('../../models/jscode2session/jscode2session');

async function request(appid, secret, code) {
  const data = await jscode2session.httpsRequest(appid, secret, code);
  return data;
}

module.exports = { request };
