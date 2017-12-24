const ERROR_CODE = 4000003;

class HTTP3rdsessionError {
  constructor(desc, msg) {
    this.desc = desc;
    this.msg = msg;
    this.code = ERROR_CODE;
    const json = {
      desc: desc,
      msg: msg,
      code: ERROR_CODE,
    };
    return JSON.stringify(json);
  }
}

module.exports = HTTP3rdsessionError;
