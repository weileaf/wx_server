const mongoose = require('mongoose');

const multer = require('multer');
const upload = multer({ dest: './mongodb/db' });

const fs = require('fs');

const logger = require('../../utils/loggers/logger');

const util = require('../../utils/util');

const { Schema } = mongoose;

const UserSchema = new Schema({
  openId: { type: String, required: true, index: 1 },
  nickName: { type: String, required: true },
  gender: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  language: { type: String, required: false },
  city: { type: String, required: false },
  province: { type: String, required: false },
  country: { type: String, required: false },
  watermark: { type: Object, required: false },
});

const WorkSchema = new Schema({
  openId: { type: String, required: true, index: 1 },
  nickName: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  work: { type: Object, required: true },
});

const UserModel = mongoose.model('user', UserSchema);

const WorkModel = mongoose.model('work', WorkSchema);

// 创建用户 存储用户数据
async function insert(user) {
  const created = await UserModel.create(user);
  const defaultWork = {
    'openId': user['openId'],
    'nickName': user['nickName'],
    'avatarUrl': user['avatarUrl'],
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
  const user = await WorkModel.findOne({ openId: id, 'work.workId': workid });
  const works = await util.getArrayContent(user.work, workid);
  const result = {
    userInfo: {
      nickName: user['nickName'],
      avatarUrl: user['avatarUrl'],
    },
    ...works,
  };
  return result;
}

// 根据openId,pagenum查询 返回指定页码的内容
async function getPagingInfo(id, pagesize, pagenum) {
  const user = await WorkModel.findOne({ openId: id }).select('work')
    .then((res) => {
      res.work.reverse();
      const pages = res.work;

      if ((pagenum * pagesize + pagesize) > res.work.length) {
        return {
          work: pages.slice(pagenum * pagesize, res.work.length),
          code: 202,
        };
      } else {
        return {
          work: pages.slice(pagenum * pagesize, pagenum * pagesize + pagesize),
          code: 200,
        };
      }
    })
    .catch((err) => {
      const errInfo = {
        code: 404,
        errcode: 4040001,
        work: '还没有创建用户',
      };
      return errInfo;
    });
  return user;
}

// 根据openId,pagenum查询 返回指定页码的内容
async function getShareImg(id, pagesize, pagenum) {
  const user = await WorkModel.findOne({ openId: id }).select('work')
    .then((res) => {
      res.work.reverse();
      const result = util.getArrayHasField(res.work, 'shareImg');

      if ((pagenum * pagesize + pagesize) > result.length) {
        return {
          work: result.slice(pagenum * pagesize, result.length),
          code: 202,
        };
      } else {
        return {
          work: result.slice(pagenum * pagesize, pagenum * pagesize + pagesize),
          code: 200,
        };
      }
    })
    .catch((err) => {
      const errInfo = {
        code: 404,
        errcode: 4040001,
        work: '还没有创建用户',
      };
      return errInfo;
    });
  return user;
}

// 根据openId查询并创建
async function getOneByOpenidAndCreate(id, datas) {
  const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$push': { work: datas } }, { new: true, });
  return user;
}

async function getOneByOpenidWorkidAndDelete(id, workid) {
  const user = await WorkModel.findOneAndUpdate({ openId: id }, { '$pull': { work: { workId: workid } } }, { new: true, });
  return user;
}

// 根据openId查询并更新
async function getOneByOpenidAndUpdate(id, workid, datas, key, first) {
  if (first) {
    // 第一次上传 先清除数据库文件内容防止重复
    const user = await WorkModel.findOneAndUpdate({
      openId: id,
      'work.workId': workid,
    }, { '$set': { [`work.$.${key}`]: [] } }, { new: true, });
    return user;
  } else if (key) {
    // 上传文件
    const user = await WorkModel.findOneAndUpdate({
      openId: id,
      'work.workId': workid,
    }, { '$push': { [`work.$.${key}`]: datas } }, {
      new: true,
      upsert: true,
    });
    return user;
  } else {
    // 上传文字
    const user = await WorkModel.findOneAndUpdate({
      openId: id,
      'work.workId': workid,
    }, { '$set': { [`work.$`]: datas } }, { new: true, });
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
async function getFiles(id, workid, originalname, path, type, classify) {

  let fileClass = 'datas';
  if (classify) fileClass = 'shares';

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
    case 'audio/mpeg':
      lastName = '.mp3';
      key = 'tape';
      break;
    default:
      lastName = '.png';
      key = 'image';
      break;
  }

  let fileName = `mongodb/db/datas/${id}/${workid}/${new Date().valueOf()}${lastName}`;
  if (fileClass === 'shares') fileName = `mongodb/db/shares/${id}/${workid}/${new Date().valueOf()}${lastName}`;

  /**
   * 递归判断是否存在目录 不存在则创建目录并改写相应文件名
   * 1.判断是否有openId下的workid目录 有则直接改名写入
   * 2.如果没有则判断是否有openId目录 有则判断是否有workid目录{有则改名并写入 无则创建workid目录并改名写入}
   * 3.没有则创建openId目录 创建成功后再workid目录并改名写入
   */
  fs.access(`mongodb/db/${fileClass}/${id}/${workid}`, (err) => {
    if (!err) {
      fs.rename(filePath, fileName, (err) => {
        if (err) logger.error(err, '文件写入失败');
      });
    } else {
      fs.access(`mongodb/db/${fileClass}/${id}`, (err) => {
        if (!err) {
          fs.access(`mongodb/db/${fileClass}/${id}/${workid}`, (err) => {
            if (!err) {
              fs.rename(filePath, fileName, (err) => {
                if (err) logger.error(err, '文件写入失败');
              });
            } else {
              fs.mkdir(`mongodb/db/${fileClass}/${id}/${workid}`, (err) => {
                if (err) {
                  logger.error(err, "创建workid目录失败");
                } else {
                  fs.rename(filePath, fileName, (err) => {
                    if (err) logger.error(err, '文件写入失败');
                  });
                }
              });
            }
          });
        } else {
          fs.mkdir(`mongodb/db/${fileClass}/${id}`, (err) => {
            if (err) {
              logger.error(err, "创建openid目录失败");
            } else {
              fs.mkdir(`mongodb/db/${fileClass}/${id}/${workid}`, (err) => {
                if (err) {
                  logger.error(err, "创建workid目录失败");
                } else {
                  fs.rename(filePath, fileName, (err) => {
                    if (err) logger.error(err, '文件写入失败');
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  if (fileClass === 'shares') {
    const datas = [originalname, fileName];
    key = 'shareImg';
    const newdata = await getOneByOpenidAndUpdate(id, workid, datas, key);
    return newdata;
  } else {
    const datas = [originalname, fileName];
    const newdata = await getOneByOpenidAndUpdate(id, workid, datas, key);
    return newdata;
  }
}

module.exports = {
  insert,
  getOneByOpenid,
  getOneByOpenidAndWorkid,
  getPagingInfo,
  getShareImg,
  getOneByOpenidAndCreate,
  getOneByOpenidWorkidAndDelete,
  getOneByOpenidAndUpdate,
  getOneByNickname,
  list,
  getFiles,
};
