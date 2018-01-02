const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: './mongodb/db' });

const jscode2session = require('../services/jscode2session/jscode2session');
const generating3rdsession = require('../services/3rd_session/generating_3rd_session');
const redis3rdsession = require('../services/redis/3rd_session');
const getDecryptions = require('../services/decrypt/decrypt_service');
const mongo = require('../services/mongoose/mongodb_user');
const files = require('../services/file_operation/file_operation');

const HTTPParamError = require('../errors/http_request_param_error');
const HTTPReqWXServerError = require('../errors/requset_wxserver_error');
const HTTP3rdsessionError = require('../errors/3rdsession_error');
const logger = require('../utils/loggers/logger');
const util = require('../utils/util');

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
      if (data) {
        const sessionid = await generating3rdsession.generating3rdsession();
        const json_data = JSON.parse(data);
        await redis3rdsession.redisSet(sessionid, data, json_data['expires_in'] * 1000);
        return sessionid;
      } else {
        throw new HTTPReqWXServerError('请求微信服务器时发生错误');
      }
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
 * 传入参数 appID session encryptedData iv
 */
router.post('/decrypt', (req, res, next) => {
  (async () => {
    const existingParam = req.body.appId && req.body.session && req.body.encryptedData && req.body.iv;
    if (existingParam) {
      // 得到appID sessionKey encryptedData iv，然后调用解密并返回解密的信息
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      let after = await getDecryptions.getDecryption(
        req.body.appId,
        sessionKey['session_key'],
        req.body.encryptedData,
        req.body.iv,
      );
      // 判断是否已经存在用户 不存在则将解密后的用户信息after存入数据库
      const user = await mongo.getUserByOpenid(sessionKey['openid']);
      if (user) return user;
      return mongo.addNewUser(after);
    } else {
      throw new HTTPParamError('appID,session,encryptedData,iv', '解密请求错误 传入参数错误', 'decrypt wrong');
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
 * 传入参数 session
 */
router.post('/create', (req, res, next) => {
  (async () => {
    // 根据session查询workId 如果已经存在则workId++ 不存在则从1开始
    if (req.body.session) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      const user = await mongo.getUserByOpenid(sessionKey['openid']);
      let workId = new Date().valueOf().toString();
      const datas = {
        workId: workId,
        title: '',
        main: '',
        fontsize: 14,
        color: '#353535',
        shareImg: [],
        image: [],
        tape: [],
      };
      const created = await mongo.getUserByOpenidAndCreate(sessionKey['openid'], datas);
      const result = await util.getArrayContent(created.work, workId);
      return result;
    } else {
      throw new HTTPParamError('session', '创建请求错误 传入参数错误', 'create wrong');
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
 * 每次提交delete请求 则会将指定workId的数据删除
 * 传入参数 session workId
 */
router.post('/delete', (req, res, next) => {
  (async () => {
    let existingParam = req.body.session && req.body.workId;
    if (req.body.workId == 0 && req.body.session) {
      existingParam = true;
    }
    if (existingParam) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      // 先根据session workId查到文件的数组 如果有相应数据则删除
      const dataFilesUrl = `mongodb/db/datas/${sessionKey['openid']}/${req.body.workId}`;
      await files.deleteall(dataFilesUrl);
      const shareFilesUrl = `mongodb/db/shares/${sessionKey['openid']}/${req.body.workId}`;
      await files.deleteall(shareFilesUrl);
      const user = await mongo.getOneByOpenidWorkidAndDelete(sessionKey['openid'], req.body.workId);
      return user;
    } else {
      throw new HTTPParamError('session,workId', '删除请求错误 传入参数错误', 'delete wrong');
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
 * 传入参数 session workId work(非必填)
 */
router.post('/sub', upload.single('file'), (req, res, next) => {
  (async () => {
    let existingParam = req.body.session && req.body.workId;
    if (req.body.workId == 0 && req.body.session) {
      existingParam = true;
    }
    if (existingParam) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      // 如果有上传的文件则整理存储文件 没有则正常存储文字
      if (req.file) {
        // 上传文件需要客户端在header内加入键firstanddelete 如果此键值为1 则表明为第一次上传 将删除对应目录下所有文件 防止重复 值为1时则正常上传
        if (req.headers.firstanddelete === '1') {
          const filesUrl = `mongodb/db/datas/${sessionKey['openid']}/${req.body.workId}`;
          await files.deleteall(filesUrl);
          await mongo.getUserByOpenidAndUpdate(sessionKey['openid'], req.body.workId, req.body.work, 'image', true);
          await mongo.getUserByOpenidAndUpdate(sessionKey['openid'], req.body.workId, req.body.work, 'tape', true);
        }
        const file = await mongo.getFiles(sessionKey['openid'], req.body.workId, req.file.originalname, req.file.path, req.file.mimetype);
        return file;
      } else {
        // 只有文字 没有文件
        const filesUrl = `mongodb/db/datas/${sessionKey['openid']}/${req.body.workId}`;
        await files.deleteall(filesUrl);
        const user = await mongo.getUserByOpenidAndUpdate(sessionKey['openid'], req.body.workId, req.body.work);
        return user;
      }
    } else {
      throw new HTTPParamError('session,workId,work', '提交请求错误 传入参数错误', 'sub wrong');
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
 * 传入参数 session workId filepath (小程序限制 在header中传参)
 */
router.get('/download', (req, res, next) => {
  (async () => {
    let existingParam = req.headers.session && req.headers.workid && req.headers.filepath;
    if (existingParam) {
      const sessionKey = await redis3rdsession.redisGet(req.headers.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      // 先根据session workId查到文件的数组 如果有相应数据则返回文件
      const user = await mongo.getUserByOpenidAndWorkid(sessionKey['openid'], req.headers.workid);
      return user;
    } else {
      throw new HTTPParamError('session,workId,filepath', '下载请求错误 传入参数错误', 'download wrong');
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
 * 每次提交upshareimg请求 则会将用户传入的分享图片入库
 * 传入参数 session workId file
 */
router.post('/upshareimg', upload.single('file'), (req, res, next) => {
  (async () => {
    let existingParam = req.body.session && req.body.workId && req.file;
    if (req.body.workId == 0 && req.body.session) {
      existingParam = true;
    }
    if (existingParam) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;

      const filesUrl = `mongodb/db/shares/${sessionKey['openid']}/${req.body.workId}`;
      await files.deleteall(filesUrl, true);
      await mongo.getUserByOpenidAndUpdate(sessionKey['openid'], req.body.workId, req.body.work, 'shareimg', true);

      const file = await mongo.getFiles(sessionKey['openid'], req.body.workId, req.file.originalname, req.file.path, req.file.mimetype, true);
      return file;
    } else {
      throw new HTTPParamError('session,workId,file', '提交请求错误 传入参数错误', 'upshareimg wrong');
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
 * 查询指定session的work内容
 * 传入参数 session workId
 */
router.post('/getwork', (req, res, next) => {
  (async () => {
    let existingParam = req.body.session && req.body.workId;
    if (req.body.workId == 0 && req.body.session) {
      existingParam = true;
    }
    if (existingParam) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      const user = await mongo.getUserByOpenidAndWorkid(sessionKey['openid'], req.body.workId);
      return user;
    } else {
      throw new HTTPParamError('session,workId', 'getwork请求错误 传入参数错误', 'getwork wrong');
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
 * 查询指定session的内容 用于下拉刷新 上拉加载更多
 * 传入参数 session pagesize pagenum
 */
router.post('/getuserbysession', (req, res, next) => {
  (async () => {
    if (req.body.session) {
      const sessionKey = await redis3rdsession.redisGet(req.body.session).catch((e) => {
        return new HTTP3rdsessionError('3rdsession错误或已过期', e);
      });
      if (sessionKey.code === 4000003) return sessionKey;
      const user = await mongo.getPagingInfo(sessionKey['openid'], req.body.pagesize, req.body.pagenum);
      return user;
    } else {
      throw new HTTPParamError('session', 'getuserbysession请求错误 传入参数错误', 'getuserbysession wrong');
    }
  })()
    .then((r) => {
      res.status(r.code).send(r.work);
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
      throw new HTTPParamError('nickName', 'getuserbynickname请求错误 传入参数错误', 'getuserbynickName wrong');
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
