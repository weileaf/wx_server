const fs = require('fs');
const Promise = require('bluebird');
Promise.promisifyAll(fs);

const logger = require('../../utils/loggers/logger');

async function deleteall(path, notdeldir) {
  await fs.readdirAsync(path, 'utf8')
    .then((r) => {
      for (let i in r) {
        const curPath = `${path}/${r[i]}`;
        if (i == r.length - 1) {
          fs.unlinkAsync(curPath)
            .then((r) => {
              if (!notdeldir) {
                fs.rmdirAsync(path)
                  .catch((e) => {
                    logger.error(e, '删除目录失败');
                  });
              }
            })
            .catch((e) => {
              logger.error(e, '删除文件失败');
            });
        } else {
          fs.unlinkAsync(curPath)
            .catch((e) => {
              logger.error(e, '删除文件失败');
            });
        }
      }
    })
    .catch((e) => {
      // console.log(e, '没有文件');
    });
};

async function mkdir(path) {
  fs.mkdirAsync(path)
    .then((r) => {
      console.log(r);
    });
}

module.exports = {
  deleteall,
  mkdir,
};