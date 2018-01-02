const files = require('../../models/file_operation/file_operation');

async function deleteall(path, notdeldir) {
  await files.deleteall(path, notdeldir);
}

async function mkdir(path) {
  await files.mkdir(path);
}

module.exports = {
  deleteall,
  mkdir,
};
