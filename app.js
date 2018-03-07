"use strict";
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var expressValidator = require('express-validator');
var jsdom = require('jsdom');
var async = require('async');
var moment = require('moment');
var helmet = require('helmet'); //Helmet helps you secure your Express apps by setting various HTTP headers

var mongo = require('mongodb');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.locals.moment = require('moment');

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
app.use(session({
  secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca",
  saveUninitialized: false, 
  resave: false,
  proxy : true,
  store: new MongoStore({ url: process.env.MONGODB_URI, ttl: 12 * 60 * 60 }),
  cookie: {
    path: "/",
    httpOnly: true,
    sameSite: 'strict',
    secure: true, 
    maxAge:  7200000  //2 hours
  },
  name: "id"
}));
app.use('/', index);
app.use('/users', users);

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
var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function() {
  console.log("Listening on Port 3000");
});

var RateLimit = require('express-rate-limit');
 
app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc) 
 
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes 
  max: 30, // limit each IP to 100 requests per windowMs 
  delayMs: 0 // disable delaying - full speed until the max limit is reached 
});
 
//  apply to all requests 
app.use(limiter);

module.exports = app;
