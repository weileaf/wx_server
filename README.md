### 微信小程序服务端实例

> 服务对象为微信小程序客户端，此实例为笔记小程序的服务端 因此提供简单笔记类app可能需要的部分接口

---

## 涉及技术栈

- node
- express
- mongodb
- redis
- axios
- bluebird

根据微信小程序提供的登录时序 结合本实例情况 实现以下流程：

##### 新用户注册登录

1. 客户端通过wx.login()获取到code并发送POST请求 **jscode2session** ( **appid secret code** ) 到服务端
2. 服务端接收到相应参数后发送GET请求( **appid secret code** )到微信服务器 返回 **openid session_key**
3. 服务端收到返回内容后生成一个随机字符串 **3rdsession** 并以 **3rdsession** 为key 返回内容为value 存入redis 并返回给客户端 **3rdsession**
4. 客户端收到 **3rdsession** 后存入storage 并调用 **wx.getUserInfo** ( **withCredentials** 为 **true** ) 获得 **encryptedData, iv** 之后发送POST请求 **decrypt** ( **appId,session { 这里是3rdsession，服务端将根据3rdsession在redis中查到对应sessionKey } ,encryptedData,iv** ) 之后服务端进行解密并将解密后的数据存数据库

## 存在问题

- 结构较乱 日后将进行精简整理

> ### 登录时序图
> ![image](https://mp.weixin.qq.com/debug/wxadoc/dev/image/login.png?t=2017127)

---

## ⊙ 接口简介

##### 1. /jscode2session

- method: POST

- 接受微信客户端传入的参数 利用这些参数请求微信服务器得到openid session_key

- ###### 传入参数 appid secret code

##### 2. /decrypt

- method: POST

- ##### 下方所有请求的前提条件 正确解密信息后才会从数据库添加用户信息

- 对收到的签名加密数据进行解密 返回用户明文信息

- ###### 传入参数 appID sessionKey encryptedData iv

##### 3. /create

- method: POST

- 客户端每次提交create请求 则会在数据库创建一个对象 用于存储文章的标题内容等等

- ###### 传入参数 session

##### 4. /delete

- method: POST

- 每次提交delete请求 则会将指定workId的数据删除

- ###### 传入参数 session workId

##### 5. /sub

- method: POST

- 每次提交sub请求 则会将用户传入的数据存入数据库

- ###### 传入参数 session workId work

##### 6. /download

- method: GET

- 编辑文章时需要下载图片/录音等文件

- ###### 传入参数 session workId filepath (header)

##### 7. /upshareimg

- method: POST

- 每次提交upshareimg请求 则会将用户传入的分享图片入库

- ###### 传入参数 session workId file

##### 8. /getworks

- method: POST

- 查询指定session的work内容

- ###### 传入参数 session workId

##### 9. /getuserbysession

- method: POST

- 查询指定session的内容 用于下拉刷新 上拉加载更多

- ###### 传入参数 session pagesize pagenum

##### 10./getuserbynickname

- method: POST

- 查询指定nickName的内容

- ###### 传入参数 nickName

##### 11. /getallusers

- method: POST

- 查询所有用户信息