const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const HTTPErrorHandler = require('./middlewares/http_error_handler');
const errorHandler = require('./middlewares/error_handler');

const winston = require('./utils/loggers/logger');

require('./services/mongoose/mongodb_connection');

const index = require('./routes/index');
const users = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/user', users);

// HTTP error handler
app.use(HTTPErrorHandler());

// error handler
app.use(errorHandler());

process.on('uncaughtException', (err) => {
  winston.error(err);
});

process.on('unhandledRejection', (reason, p) => {
  winston.error('Unhandled Rejection at:', p, 'reason:', reason);
});

module.exports = app;
