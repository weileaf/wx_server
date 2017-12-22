const HTTPBaseError = require('./http_base_error');

const ERRPR_CODE = 4000003;

class HTTP3rdsessionError extends HTTPBaseError {
  constructor(desc) {
    super(400, desc, ERRPR_CODE, `3rdsession wrong`);
  }
}

module.exports = HTTP3rdsessionError;
