const HTTPBaseError = require('./http_base_error');

const ERROR_CODE = 4040000;

class ResourceNotFoundError extends HTTPBaseError {
  constructor(resourceName, resourceId, httpMsg) {
    super(404, httpMsg, '服务器被老板搞坏啦，请稍后重试吧', ERROR_CODE, `${resourceName} not found, id: ${resourceId}`);
  }
}

module.exports = ResourceNotFoundError;
