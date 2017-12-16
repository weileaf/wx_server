const fs = require('fs');
const logger = require('../../utils/loggers/logger');

function deleteall(path) {
  fs.access(path, (err) => {
      if (!err) {
        fs.readdir(path, 'utf8', (err, files) => {
          if (err) {
            logger.error(err,'读取目录失败');
          } else {
            files.forEach(function (file, index) {
              const curPath = path + "/" + file;
              fs.stat(curPath, (err, stats) => {
                if (stats.isDirectory()) {
                  deleteall(curPath);
                } else {
                  fs.unlink(curPath, (err) => {
                    if (err) logger.error(err,'删除文件失败');
                  });
                }
              });
            });
          }
        });
      }
    },
  );
};

module.exports = {
  deleteall,
};