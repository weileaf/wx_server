const User = require('../../models/mongoose/user');

async function addNewUser(data) {
  const user = await User.insert(data);
  return user;
}

async function getUserByOpenid(id) {
  const user = await User.getOneByOpenid(id);
  return user;
}

async function getUserByOpenidAndWorksid(id, worksid) {
  const user = await User.getOneByOpenidAndWorksid(id, worksid);
  return user;
}

async function getUserByOpenidAndCreate(id, datas) {
  const user = await User.getOneByOpenidAndCreate(id, datas);
  return user;
}

async function getUserByOpenidAndUpdate(id, worksid, datas, key, first) {
  const user = await User.getOneByOpenidAndUpdate(id, worksid, datas, key, first);
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

async function getFiles(id, worksid, originalname, path, type) {
  const file = await User.getFiles(id, worksid, originalname, path, type);
  return file;
}

module.exports = {
  addNewUser,
  getUserByOpenid,
  getUserByOpenidAndWorksid,
  getUserByOpenidAndCreate,
  getUserByOpenidAndUpdate,
  getUserByNickname,
  getAllUsers,
  getFiles,
};
