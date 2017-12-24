const HTTPBaseError = require('./http_base_error');

const ERROR_CODE = 4000001;

class HTTPReqParamError extends HTTPBaseError {
  constructor(paramName, desc, msg) {
    super(400, `参数不合法: ${desc}`, ERROR_CODE, `${paramName} wrong: ${msg}`);
  }
}

module.exports = HTTPReqParamError;
