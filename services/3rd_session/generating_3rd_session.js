const session = require('../../models/3rd_session/generating_3rd_session');

async function generating3rdsession() {
  const s = await session.generating3rdsession();
  return s;
}

module.exports = {
  generating3rdsession,
};
