const HTTPBaseError = require('./http_base_error');

const ERRPR_CODE = 4000002;

class HTTPReqWXServerError extends HTTPBaseError {
  constructor(desc) {
    super(400, desc, ERRPR_CODE, `request wxserver wrong`);
  }
}

module.exports = HTTPReqWXServerError;
