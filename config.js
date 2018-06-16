var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var config = {
    production: {
      session: {
        secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca",
        saveUninitialized: false, 
        resave: false,
        proxy : true,
        store: new MongoStore({ url: process.env.MONGODB_URI, ttl: 12 * 60 * 60 }),
        cookie: {
            path: "/",
            httpOnly: true,
            sameSite: 'strict',
            secure: true, //uncomment for PRO
            maxAge:  28800000  //8 hours
        },
        name: "id"    
      },
      database: 'mongodb://<user>:<pwd>@apollo.modulusmongo.net:27017/db',
      limiter: {
        windowMs: 15*60*1000, // 15 minutes 
        max: 30, // limit each IP to 30 requests per windowMs 
        delayMs: 0 // disable delaying - full speed until the max limit is reached 
      },
      cloudinary: { 
        cloud_name: 'hxxbdvyzc', 
        api_key: '971837284457376', 
        api_secret: process.env.CLOUDNARY_API_SECRET
      },
      loginLimiter: {
        windowMs: 60*60*1000, // 1 hour window 
        delayAfter: 3, // begin slowing down responses after the first request 
        delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request 
        max: 5, // start blocking after 5 requests 
        message: "You have tried to login more than 5 times, please try again after an hour"
      }
    },
    default: {
      session: {
        secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca",
        saveUninitialized: false, 
        resave: false,
        proxy : true,
        store: new MongoStore({ url: process.env.MONGODB_URI, ttl: 12 * 60 * 60 }),
        cookie: {
            path: "/",
            httpOnly: true,
            sameSite: 'strict',
            secure: true, //uncomment for PRO
            maxAge:  28800000  //8 hours
        },
        name: "id"    
      },
      database: 'mongodb://127.0.0.1:27017/db',
      limiter: {
        windowMs: 15*60*1000, // 15 minutes 
        max: 30, // limit each IP to 30 requests per windowMs 
        delayMs: 0 // disable delaying - full speed until the max limit is reached 
      },
      cloudinary: { 
        cloud_name: 'hxxbdvyzc', 
        api_key: '971837284457376', 
        api_secret: process.env.CLOUDNARY_API_SECRET
      },
      loginLimiter: {
        windowMs: 60*60*1000, // 1 hour window 
        delayAfter: 3, // begin slowing down responses after the first request 
        delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request 
        max: 5, // start blocking after 5 requests 
        message: "You have tried to login more than 5 times, please try again after an hour"
      }
    }
  }
  
  exports.get = function get(env) { 
    console.log("env"+env);
    return config[env] || config.default;
  }