const User = require('../../models/mongoose/user');

async function addNewUser(data) {
  const user = await User.insert(data);
  return user;
}

async function getUserByOpenid(id) {
  const user = await User.getOneByOpenid(id);
  return user;
}

async function getUserByOpenidAndWorkid(id, workid) {
  const user = await User.getOneByOpenidAndWorkid(id, workid);
  return user;
}

async function getPagingInfo(id, pagesize, pagenum) {
  const user = await User.getPagingInfo(id, pagesize, pagenum);
  return user;
}

async function getUserByOpenidAndCreate(id, datas) {
  const user = await User.getOneByOpenidAndCreate(id, datas);
  return user;
}

async function getOneByOpenidWorkidAndDelete(id, workid) {
  const user = await User.getOneByOpenidWorkidAndDelete(id, workid);
  return user;
}

async function getUserByOpenidAndUpdate(id, workid, datas, key, first) {
  const user = await User.getOneByOpenidAndUpdate(id, workid, datas, key, first);
  return user;
}

async function getUserByNickname(name) {
  const user = await User.getOneByNickname(name);
  return user;
}

async function getAllUsers() {
  const users = await User.list();
  return users;
}

async function getFiles(id, workid, originalname, path, type, classify) {
  const file = await User.getFiles(id, workid, originalname, path, type, classify);
  return file;
}

module.exports = {
  addNewUser,
  getUserByOpenid,
  getUserByOpenidAndWorkid,
  getPagingInfo,
  getUserByOpenidAndCreate,
  getOneByOpenidWorkidAndDelete,
  getUserByOpenidAndUpdate,
  getUserByNickname,
  getAllUsers,
  getFiles,
};
