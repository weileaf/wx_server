const files = require('../../models/file_operation/file_operation');

async function deleteall(path) {
  files.deleteall(path);
}

module.exports = {
  deleteall,
};
