const ERROR_CODE = 4000003;

function HTTP3rdsessionError(desc, msg) {
  const json = {
    desc: desc,
    msg: msg,
    code: ERROR_CODE,
  };
  return JSON.stringify(json);
}

module.exports = HTTP3rdsessionError;
