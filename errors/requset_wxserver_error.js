const HTTPBaseError = require('./http_base_error');

const ERROR_CODE = 4000002;

class HTTPReqWXServerError extends HTTPBaseError {
  constructor(desc) {
    super(400, desc, ERROR_CODE, `request wxserver wrong`);
  }
}

module.exports = HTTPReqWXServerError;
