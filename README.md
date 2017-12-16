### 微信小程序服务端实例

> 服务对象为微信小程序客户端，此实例为笔记小程序的服务端 因此提供简单笔记类app可能需要的部分接口

---

根据微信小程序提供的登录时序 实现以下：

1. 小程序通过wx.login()获取到code并发送POST请求 **jscode2session** ( **appid secret code** ) 到服务器
2. 服务器接收到相应参数后发送GET请求( **appid secret code** )到微信服务器 返回 **openid session_key**
3. 服务器将返回内容传回小程序端

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

- ###### 传入参数 openId

##### 4. /sub

- method: POST

- 每次提交sub请求 则会将用户传入的数据存入数据库

- ###### 传入参数 openId worksId works

##### 5. /download

- method: GET

- 编辑文章时需要下载图片/录音等文件

- ###### 传入参数 openId worksId filepath (header)

##### 6. /getworks

- method: POST

- 查询指定openId的works内容

- ###### 传入参数 openId worksId

##### 7. /getuserbyopenid

- method: POST

- 查询指定openId的内容

- ###### 传入参数 openId

7./getuserbynickname

- method: POST

- 查询指定nickName的内容

- ###### 传入参数 nickName

##### 8. /getallusers

- method: POST

- 查询所有用户信息