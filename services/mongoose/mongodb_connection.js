const mongoose = require('mongoose');
const logger = require('../../utils/loggers/logger');

mongoose.Promise = Promise;

const uri = 'mongodb://localhost:27017/wx';
mongoose.connect(uri, { useMongoClient: true });
const db = mongoose.connection;

db.on('open', () => {
  logger.info('db connected!');
});

db.on('error', (e) => {
  logger.error(e, 'MongoDB connect fail');
});

module.exports = db;
