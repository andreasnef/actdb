var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var config = {
    production: {
      session: {
        secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca",
        saveUninitialized: false, 
        resave: false,
        proxy : true,
        store: new MongoStore({ url: 'mongodb://actadmin:TequilaMondays2017@localhost:27017,localhost:27018,localhost:27019/Act?replicaSet=mongo-repl&authSource=admin', ttl: 12 * 60 * 60 }),
        cookie: {
            path: "/",
            httpOnly: true,
            sameSite: 'strict',
            //secure: true, uncomment for PRO
            maxAge:  28800000  //8 hours
        },
        name: "id"    
      },
      database: 'mongodb://<user>:<pwd>@apollo.modulusmongo.net:27017/db',
      limiter: {
        windowMs: 15*60*1000, // 15 minutes 
        max: 30, // limit each IP to 30 requests per windowMs 
        delayMs: 0 // disable delaying - full speed until the max limit is reached 
      }
    },
    default: {
        session: {
            secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca",
            saveUninitialized: false, 
            resave: false,
            proxy : true,
            store: new MongoStore({ url: 'mongodb://actadmin:TequilaMondays2017@localhost:27017,localhost:27018,localhost:27019/Act?replicaSet=mongo-repl&authSource=admin', ttl: 12 * 60 * 60 }),
            cookie: {
                path: "/",
                httpOnly: true,
                sameSite: 'strict',
                //secure: true, uncomment for PRO
                maxAge:  28800000  //8 hours
            },
            name: "id"    
          },
      database: 'mongodb://127.0.0.1:27017/db',
      limiter: {
        windowMs: 15*60*1000, // 15 minutes 
        max: 30, // limit each IP to 30 requests per windowMs 
        delayMs: 0 // disable delaying - full speed until the max limit is reached 
      }
    }
  }
  
  exports.get = function get(env) {
    return config[env] || config.default;
  }