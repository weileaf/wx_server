const fs = require('fs');
const Promise = require('bluebird');
Promise.promisifyAll(fs);

const logger = require('../../utils/loggers/logger');

async function deleteall(path) {
  await fs.readdirAsync(path, 'utf8')
    .then((r) => {
      for (let file of r) {
        const curPath = `${path}/${file}`;
        fs.unlinkAsync(curPath)
          .catch((e) => {
            logger.error(err, '删除文件失败');
          });
      }
    })
    .catch((e) => {
      logger.error(e, '读取目录失败');
    });
};

module.exports = {
  deleteall,
};