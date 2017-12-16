const axios = require('axios');

async function httpsRequest(appid, secret, code, next) {
  const data = {
    appid: appid,
    secret: secret,
    js_code: code,
    grant_type: 'authorization_code',
  };

  const url = 'https://api.weixin.qq.com/sns/jscode2session';

  const result = await axios.get(url, { params: data })
    .then((r) => {
      return r.data;
    })
    .catch((e) => {
      next(e);
    });
  return result;
}

module.exports = { httpsRequest };
