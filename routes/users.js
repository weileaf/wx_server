const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: './mongodb/db' });

const jscode2session = require('../services/jscode2session/jscode2session');
const getDecryptions = require('../services/decrypt/decrypt_service');
const mongo = require('../services/mongoose/mongodb_user');
const files = require('../services/file_operation/file_operation');

const HTTPParamError = require('../errors/http_request_param_error');
const logger = require('../utils/loggers/logger');

router.get('/', (req, res) => {
  res.send('what???');
});

/**
 * 接受微信客户端传入的参数 利用这些参数请求微信服务器得到openid session_key
 * 传入参数 appid secret code
 */
router.post('/jscode2session', (req, res, next) => {
  (async () => {
    const existingParam = req.body.appid && req.body.secret && req.body.code;
    if (existingParam) {
      const data = await jscode2session.request(req.body.appid, req.body.secret, req.body.code);
      return data;
    } else {
      throw new HTTPParamError('appid,secret,code', 'jscode2session请求错误 传入参数错误', 'jscode2session wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 下方所有请求的前提条件 正确解密信息后才会从数据库添加用户信息
 * 对收到的签名加密数据进行解密 返回用户明文信息
 * 传入参数 appID sessionKey encryptedData iv
 */
router.post('/decrypt', (req, res, next) => {
  (async () => {
    const existingParam = req.body.appId && req.body.sessionKey && req.body.encryptedData && req.body.iv;
    if (existingParam) {
      // 得到appID sessionKey encryptedData iv，然后调用解密并返回解密的信息
      let after = await getDecryptions.getDecryption(
        req.body.appId,
        req.body.sessionKey,
        req.body.encryptedData,
        req.body.iv,
      );
      after.works = [];
      // 判断是否已经存在用户 不存在则将解密后的用户信息after存入数据库
      const user = await mongo.getUserByOpenid(after.openId);
      if (user) return user;
      return mongo.addNewUser(after);
    } else {
      throw new HTTPParamError('appID,sessionKey,encryptedData,iv', '解密请求错误 传入参数错误', 'decrypt wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 客户端每次提交create请求 则会在数据库创建一个对象 用于存储文章的标题内容等等
 * 传入参数 openId
 */
router.post('/create', (req, res, next) => {
  (async () => {
    // 根据openId查询workId 如果已经存在则workId++ 不存在则从1开始
    if (req.body.openId) {
      const user = await mongo.getUserByOpenid(req.body.openId);
      let worksId = user.works.length;
      if (user.works.length) {
        worksId = user.works.length++;
        const datas = {
          title: '',
          main: '',
          fontsize: 14,
          color: '#353535',
          worksId: worksId,
        };
        const created = await mongo.getUserByOpenidAndCreate(req.body.openId, datas);
        return created;
      } else {
        const datas = {
          title: '',
          main: '',
          fontsize: 14,
          color: '#353535',
          worksId: 0,
        };
        const created = await mongo.getUserByOpenidAndCreate(req.body.openId, datas);
        return created;
      }
    } else {
      throw new HTTPParamError('openId', '创建请求错误 传入参数错误', 'create wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 每次提交sub请求 则会将用户传入的数据存入数据库
 * 传入参数 openId worksId works(非必填)
 */
router.post('/sub', upload.single('file'), (req, res, next) => {
  (async () => {
    let existingParam = req.body.openId && req.body.worksId;
    if (req.body.worksId == 0 && req.body.openId) {
      existingParam = true;
    }
    if (existingParam) {
      // 如果有上传的文件则整理存储文件 没有则正常存储文字
      if (req.file) {
        // 上传文件需要客户端在header内加入键firstanddelete 如果此键值为1 则表明为第一次上传 将删除对应目录下所有文件 防止重复 值为1时则正常上传
        if (req.headers.firstanddelete === '1') {
          const filesUrl = `mongodb/db/${req.body.openId}/${req.body.worksId}`;
          await files.deleteall(filesUrl);
          await mongo.getUserByOpenidAndUpdate(req.body.openId, req.body.worksId, req.body.works, 'image', true);
          await mongo.getUserByOpenidAndUpdate(req.body.openId, req.body.worksId, req.body.works, 'tape', true);
        }
        const file = await mongo.getFiles(req.body.openId, req.body.worksId, req.file.originalname, req.file.path, req.file.mimetype);
        return file;
      } else {
        const user = await mongo.getUserByOpenidAndUpdate(req.body.openId, req.body.worksId, req.body.works);
        return user;
      }
    } else {
      throw new HTTPParamError('openId,worksId,works', '提交请求错误 传入参数错误', 'sub wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 编辑文章时需要下载图片/录音等文件
 * 传入参数 openId worksId filepath (header)
 */
router.get('/download', (req, res, next) => {
  (async () => {
    let existingParam = req.headers.openid && req.headers.worksid && req.headers.filepath;
    if (req.body.worksId == 0 && req.body.openId) {
      existingParam = true;
    }
    if (existingParam) {
      // 先根据openId worksId查到文件的数组 如果有相应数据则返回文件
      const user = await mongo.getUserByOpenidAndWorksid(req.headers.openid, req.headers.worksid);
      return user;
    } else {
      throw new HTTPParamError('openId,worksId,filepath', '下载请求错误 传入参数错误', 'download wrong');
    }
  })()
    .then((r) => {
      if (r) {
        const path = `./${req.headers.filepath.split(',')[1]}`;
        const name = path.substr(-17);
        res.download(path, name, (err) => {
          if (err) {
            logger.error(err, "download fail");
          }
        });
      } else {
        res.send('have no access');
      }
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 查询指定openId的works内容
 * 传入参数 openId worksId
 */
router.post('/getworks', (req, res, next) => {
  (async () => {
    let existingParam = req.body.openId && req.body.worksId;
    if (req.body.worksId == 0 && req.body.openId) {
      existingParam = true;
    }
    if (existingParam) {
      const user = await mongo.getUserByOpenidAndWorksid(req.body.openId, req.body.worksId);
      return user;
    } else {
      throw new HTTPParamError('openId,worksId', 'getworks请求错误 传入参数错误', 'getworks wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 查询指定openId的内容
 * 传入参数 openId
 */
router.post('/getuserbyopenid', (req, res, next) => {
  (async () => {
    if (req.body.openId) {
      const user = await mongo.getUserByOpenid(req.body.openId);
      return user;
    } else {
      throw new HTTPParamError('openId', 'getuserbyopenid请求错误 传入参数错误', 'getuserbyopenid wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 查询指定nickName的内容
 * 传入参数 nickName
 */
router.post('/getuserbynickname', (req, res, next) => {
  (async () => {
    if (req.body.nickName) {
      const user = await mongo.getUserByNickname(req.body.nickName);
      return user;
    } else {
      throw new HTTPParamError('nickName', 'getuserbynickname请求错误 传入参数错误', 'getuserbyopenid wrong');
    }
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

/**
 * 查询所有用户信息
 */
router.post('/getallusers', (req, res, next) => {
  (async () => {
    const users = await mongo.getAllUsers();
    return users;
  })()
    .then((r) => {
      res.send(r);
    })
    .catch((e) => {
      next(e);
    });
});

module.exports = router;
