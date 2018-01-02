// 获取指定workid的内容
async function getArrayContent(arr, workid) {
  for (let i of arr) {
    if (i.workId === workid) return i;
  }
}

module.exports = {
  getArrayContent,
};