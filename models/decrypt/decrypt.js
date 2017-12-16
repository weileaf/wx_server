const WXBizDataCrypt = require('./WXBizDataCrypt');

// 解密数据
async function Decrypt(appID, sessionKey, encryptedData, iv) {
  const pc = await new WXBizDataCrypt(appID, sessionKey).decryptData(encryptedData, iv);
  return pc;
}

module.exports = Decrypt;
