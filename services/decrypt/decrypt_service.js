const Decrypt = require('../../models/decrypt/decrypt');

module.exports.getDecryption = async function (appID, sessionKey, encryptedData, iv) {
  const data = await Decrypt(appID, sessionKey, encryptedData, iv);
  return data;
};
