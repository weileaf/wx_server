const mongoose = require('mongoose');

const multer = require('multer');
const upload = multer({ dest: './mongodb/db' });

const fs = require('fs');

const logger = require('../../utils/loggers/logger');

const { Schema } = mongoose;

const UserSchema = new Schema({
  openId: { type: String, required: true, index: 1 },
  nickName: { type: String, required: true, index: 1 },
  gender: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  language: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String, required: true },
  country: { type: String, required: true },
  watermark: { type: Object, required: true },
  works: { type: Object, required: false },
});

const UserModel = mongoose.model('user', UserSchema);

// 存储用户数据
async function insert(user) {
  const created = await UserModel.create(user);
  return created;
}

// 根据openId查询 返回用户全部数据
async function getOneByOpenid(id) {
  const user = await UserModel.findOne({ openId: id });
  return user;
}

// 根据openId worksId查询 返回用户指定worksId的作品数据
async function getOneByOpenidAndWorksid(id, worksid) {
  const user = await UserModel.findOne({ openId: id });
  return user.works[worksid];
}

// 根据openId查询并创建
async function getOneByOpenidAndCreate(id, datas) {
  const user = await UserModel.findOneAndUpdate({ openId: id }, { '$push': { works: datas } }, { new: true, });
  return user;
}

// 根据openId查询并更新
async function getOneByOpenidAndUpdate(id, worksid, datas, key, first) {
  if (first) {
    const user = await UserModel.findOneAndUpdate({ openId: id }, { '$set': { [`works.${worksid}.${key}`]: [] } }, { new: true, });
    return user;
  } else if (key) {
    const user = await UserModel.findOneAndUpdate({ openId: id }, { '$push': { [`works.${worksid}.${key}`]: datas } }, {
      new: true,
      upsert: true,
    });
    return user;
  } else {
    const user = await UserModel.findOneAndUpdate({ openId: id }, { '$set': { [`works.${worksid}`]: datas } }, { new: true, });
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
async function getFiles(id, worksid, originalname, path, type) {
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

  const fileName = `mongodb/db/${id}/${worksid}/${Date.now()}${lastName}`;

  /**
   * 递归判断是否存在目录 不存在则创建目录并改写相应文件名
   * 1.判断是否有openId下的worksId目录 有则直接改名写入
   * 2.如果没有则判断是否有openId目录 有则判断是否有worksId目录{有则改名并写入 无则创建worksId目录并改名写入}
   * 3.没有则创建openId目录 创建成功后再worksId目录并改名写入
   */
  fs.access(`mongodb/db/${id}/${worksid}`, (err) => {
    if (!err) {
      fs.rename(filePath, fileName, (err) => {
        if (err) return new Error('文件写入失败');
      });
    } else {
      fs.access(`mongodb/db/${id}`, (err) => {
        if (!err) {
          fs.access(`mongodb/db/${id}/${worksid}`, (err) => {
            if (!err) {
              fs.rename(filePath, fileName, (err) => {
                if (err) return new Error('文件写入失败');
              });
            } else {
              fs.mkdir(`mongodb/db/${id}/${worksid}`, (err) => {
                if (err) {
                  logger.error(err, "创建worksid目录失败");
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
              fs.mkdir(`mongodb/db/${id}/${worksid}`, (err) => {
                if (err) {
                  logger.error(err, "创建worksid目录失败");
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
  const newdata = await getOneByOpenidAndUpdate(id, worksid, datas, key);
  return newdata;
}

module.exports = {
  insert,
  getOneByOpenid,
  getOneByOpenidAndWorksid,
  getOneByOpenidAndCreate,
  getOneByOpenidAndUpdate,
  getOneByNickname,
  list,
  getFiles,
};
