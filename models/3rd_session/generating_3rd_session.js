const { exec } = require('child_process');

async function generating3rdsession() {
  const platform = process.platform;
  if (platform.indexOf('linux') === 0) {
    await exec('head -n 80 /dev/urandom | tr -dc A-Za-z0-9 | head -c 168', (err, stdout, stderr) => {
      return stdout;
    });
  } else {
    // 本地测试用
    const key = await randomWord(168);
    return key;
  }
}

async function randomWord(n) {
  let pos,
    str = "",
    range = n,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  for (let i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}

module.exports = {
  generating3rdsession,
};