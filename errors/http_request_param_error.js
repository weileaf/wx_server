const HTTPBaseError = require('./http_base_error');

const ERRPR_CODE = 4000000;

class HTTPReqParamError extends HTTPBaseError {
  constructor(paramName, desc, msg) {
    super(400, `参数不合法: ${desc}`, ERRPR_CODE, `${paramName} wrong: ${msg}`);
  }
}

module.exports = HTTPReqParamError;
