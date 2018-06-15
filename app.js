"use strict";
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
require('dotenv').config();
var expressValidator = require('express-validator');
var moment = require('moment');
var helmet = require('helmet'); //Helmet helps you secure your Express apps by setting various HTTP headers

var index = require('./routes/index');

var app = express();
app.locals.moment = require('moment');

var config = require('./config.js').get(process.env.NODE_ENV);
console.log("env "+process.env.NODE_ENV)
console.log(app.get('env'))
app.use(helmet({
  frameguard: {
    action: 'deny'
  }
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (app.get('env') === 'production') {
  app.use(logger('combined'));
} else {
  app.use(logger('dev'));
}
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());

app.use(express.static(path.join(__dirname, 'public')));
app.use(session(config.session));
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//use in PRO
// var port = process.env.PORT || 3000;
// app.listen(port, "0.0.0.0", function() {
//   console.log("Listening on Port 3000");
// });

var RateLimit = require('express-rate-limit');
 
app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc) 
 
var limiter = new RateLimit(config.limiter);
 
//  apply to all requests 
app.use(limiter);

module.exports = app;
