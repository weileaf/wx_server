// 获取指定workid的内容
async function getArrayContent(arr, workid) {
  for (let i of arr) {
    if (i.workId === workid) return i;
  }
}

// 获取数组内含有指定字段的对象
async function getArrayHasField(arr, field) {
  const array = [];
  for (let i of arr) {
    if (i[field].length) array.push(i);
  }
  return array;
}

module.exports = {
  getArrayContent,
  getArrayHasField,
};