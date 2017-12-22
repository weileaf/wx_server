const mongoose = require('mongoose');

const multer = require('multer');
const upload = multer({ dest: './mongodb/db' });

const fs = require('fs');

const logger = require('../../utils/loggers/logger');

const { Schema } = mongoose;

const UserSchema = new Schema({
  openId: { type: String, required: true, index: 1 },
  nickName: { type: String, required: true },
  gender: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  language: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String, required: true },
  country: { type: String, required: true },
  watermark: { type: Object, required: true },
});

const WorkSchema = new Schema({
  openId: { type: String, required: true, index: 1 },
  work: { type: Object, required: true },
});

const UserModel = mongoose.model('user', UserSchema);

const WorkModel = mongoose.model('work', WorkSchema);

// 创建用户 存储用户数据
async function insert(user) {
  const created = await UserModel.create(user);
  const defaultWork = {
    'openId': user['openId'],
    'work': [],
  };
  await WorkModel.create(defaultWork);
  return created;
}

// 根据openId查询 返回用户全部数据
async function getOneByOpenid(id) {
  const user = await WorkModel.findOne({ openId: id });
  return user;
}

// 根据openId workid查询 返回用户指定workid的作品数据
async function getOneByOpenidAndWorkid(id, workid) {
  const user = await WorkModel.findOne({ openId: id });
  return user.work[workid];
}

// 根据openId查询并创建
async function getOneByOpenidAndCreate(id, datas) {
  const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$push': { work: datas } }, { new: true, });
  return user;
}

// 根据openId查询并更新
async function getOneByOpenidAndUpdate(id, workid, datas, key, first) {
  if (first) {
    // 第一次上传 先清除数据库文件内容防止重复
    const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$set': { [`work.${workid}.${key}`]: [] } }, { new: true, });
    return user;
  } else if (key) {
    // 上传文件
    const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$push': { [`work.${workid}.${key}`]: datas } }, {
      new: true,
      upsert: true,
    });
    return user;
  } else {
    // 上传文字
    const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$set': { [`work.${workid}`]: datas } }, { new: true, });
    return user;
  }
}

// 根据nickName查询
async function getOneByNickname(name) {
  const user = await UserModel.findOne({ nickName: name });
  return user;
}

// 列出所有用户
async function list(params) {
  const match = {};
  const flow = UserModel.find(match);
  const users = await flow.exec();
  return users;
}

// 获取用户上传的文件，分类、改名后将新/旧文件名存入数据库
async function getFiles(id, workid, originalname, path, type) {
  const filePath = path;
  const fileType = type;
  let key = '';
  let lastName = '';
  switch (fileType) {
    case 'image/png':
      lastName = '.png';
      key = 'image';
      break;
    case 'image/jpeg':
      lastName = '.jpg';
      key = 'image';
      break;
    case 'application/octet-stream':
      lastName = '.silk';
      key = 'tape';
      break;
    case 'audio/silk':
      lastName = '.silk';
      key = 'tape';
      break;
    default:
      lastName = '.png';
      key = 'image';
      break;
  }

  const fileName = `mongodb/db/${id}/${workid}/${Date.now()}${lastName}`;

  /**
   * 递归判断是否存在目录 不存在则创建目录并改写相应文件名
   * 1.判断是否有openId下的workid目录 有则直接改名写入
   * 2.如果没有则判断是否有openId目录 有则判断是否有workid目录{有则改名并写入 无则创建workid目录并改名写入}
   * 3.没有则创建openId目录 创建成功后再workid目录并改名写入
   */
  fs.access(`mongodb/db/${id}/${workid}`, (err) => {
    if (!err) {
      fs.rename(filePath, fileName, (err) => {
        if (err) return new Error('文件写入失败');
      });
    } else {
      fs.access(`mongodb/db/${id}`, (err) => {
        if (!err) {
          fs.access(`mongodb/db/${id}/${workid}`, (err) => {
            if (!err) {
              fs.rename(filePath, fileName, (err) => {
                if (err) return new Error('文件写入失败');
              });
            } else {
              fs.mkdir(`mongodb/db/${id}/${workid}`, (err) => {
                if (err) {
                  logger.error(err, "创建workid目录失败");
                } else {
                  fs.rename(filePath, fileName, (err) => {
                    if (err) return new Error('文件写入失败');
                  });
                }
              });
            }
          });
        } else {
          fs.mkdir(`mongodb/db/${id}`, (err) => {
            if (err) {
              logger.error(err, "创建openid目录失败");
            } else {
              fs.mkdir(`mongodb/db/${id}/${workid}`, (err) => {
                if (err) {
                  logger.error(err, "创建workid目录失败");
                } else {
                  fs.rename(filePath, fileName, (err) => {
                    if (err) return new Error('文件写入失败');
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  const datas = [originalname, fileName];
  const newdata = await getOneByOpenidAndUpdate(id, workid, datas, key);
  return newdata;
}

module.exports = {
  insert,
  getOneByOpenid,
  getOneByOpenidAndWorkid,
  getOneByOpenidAndCreate,
  getOneByOpenidAndUpdate,
  getOneByNickname,
  list,
  getFiles,
};
