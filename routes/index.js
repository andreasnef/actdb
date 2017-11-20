var express = require('express');
var app = express();
var router = express.Router();
var mongodb = require('mongodb');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var moment = require('moment');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var async = require('async');
var xl = require('excel4node');
var multer  = require('multer');
var fs = require("fs");
 
var db;
var user;
var sessData;
var collectionsList;
var partiesList;
var locationsList;
var eventsList;
var sitesList;
var sitesResult;
var missingList;
var missingResult;
var contactsList;
var interviewsList;
var filesList;
var profile;
var filesArray = [];


var relPath = __dirname +"/../public/files/";
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, relPath)      //you tell where to upload the files,
    }
})

var upload = multer({ storage : storage}).any();


/* GET home page. */
router.get('/', function(req, res, next) {
    if(sessData.user && db) {
        res.redirect("missing");
    } else {
        res.render('index', { title: 'Login to Database'});   
    }
});

/*Log in*/
router.post('/login', function(req, res){
    
    user = req.body.user;
    var pass = req.body.pass;
    var ip = req.connection.remoteAddress;
    //var date = new Date(Date.UTC());
    var date = new Date().toISOString();
    var MongoClient = mongodb.MongoClient;
    // var url = process.env.MONGODB_URI || 'mongodb://'+user+':'+pass+'@cluster0-shard-00-00-tey75.mongodb.net:27017,cluster0-shard-00-01-tey75.mongodb.net:27017,cluster0-shard-00-02-tey75.mongodb.net:27017/Act?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
    var url = 'mongodb://'+user+':'+pass+'@cluster0-shard-00-00-tey75.mongodb.net:27017,cluster0-shard-00-01-tey75.mongodb.net:27017,cluster0-shard-00-02-tey75.mongodb.net:27017/Act?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
    app.use(sessions({
        secret: 'foo',
        store: new MongoStore({ url: url })
      }));
    //Validate Fields
    req.check('user', 'User cannot be empty').notEmpty();
    req.check('pass', 'Password cannot be empty').notEmpty();
    var errors = req.validationErrors();
                if (errors) {
                    res.render('index', {
                        "validationErrors" : errors
                    });
                } else {
                    /*Connect to the BD*/
                    MongoClient.connect(url, function(err,database){
                    if (err){
                        console.log("User:"+user+" Unable to connect to server", err);
                        res.render('index', {
                            "errormessage" : err
                        });
                    } else {
                        console.log('User:'+user+' Connected to server');
                        //Store the connection globally
                        db = database;
                        //save in session
                        app.use(session({
                            secret: "ewjdasnkqwiluyrfgbcnxaiureyfhbca", 
                            saveUninitialized: false, 
                            resave: false,
                            store: new MongoStore({ url: url, ttl: 1 * 24 * 60 * 60 })
                        }));
                        sessData = req.session;
                        //save in session
                        sessData.user = user;
                        console.log("sessdata "+sessData);
                        //save the login info in the db
                        var collection = db.collection('logins');
            
                        var newlongin = {user: req.body.user, ip: ip, date: date};
            
                        collection.insert([newlongin], function(err, result){
                            if (err){
                                console.log(err)
                            }else {
                                res.redirect("missing");
                            }
                        });
                     }
                        
                    })
                    
                }

    
    
    
});

/*View Home*/
router.get('/home', function(req, res){
    if (collectionsList){
        res.render('home', {
            "collections" : collectionsList, "user": user
            });   
    }else if (db) {
        db.listCollections().toArray(function (err, names){ 
            if (err){
                res.send(err);
            } else if (names.length) {
                    collectionsList = names;
                    res.render('home', {
                        "collections" : collectionsList, "user": user
                        });    
            } else {
                    res.send('No documents found');
            }
        });  
    } else {
        res.render('index', { title: 'Login to Database'});
    }
});

/*retrieve list of parties*/
function getParties(callback){ 
    if (db) {
        var partiesColl = db.collection('parties');
        partiesColl.find({},{'name': 1, code: 1}).sort({'name.en':1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    partiesList = result;
            }
            callback();
        });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }         
};

 /*retrieve list of Locations*/
function getLocations(callback){
    if (db) {
        var locationsColl = db.collection('locations');   
        locationsColl.find({},{code: 1, category: 1, 'name': 1, groups_responsible:1, 'location.district':1, 'location.governorate': 1}).sort({'name.en': 1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        locationsList = result;
                }
                callback();
            });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }       
};

 /*retrieve list of Events*/
function getEvents(callback){
    if (db) {
        var eventsColl = db.collection('events');

            eventsColl.find({},{'name': 1, code: 1, type: 1, 'location.district':1, 'location.governorate': 1, 'dates.beg': 1}).sort({'name.en':1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        eventsList = result;
                }
                callback();
            });     
    } else { 
        res.render('index', { title: 'Login to Database'});
    }                       
};   

/*retrieve list of Sites*/
function getSites(callback){
    if (db) {
        var sitesColl = db.collection('sites');
        sitesColl.find({},{'name.en': 1, code: 1, 'location.district':1,'location.governorate':1, 'exhumed.status': 1}).sort({'location.governorate':1, 'location.district':1, 'name.en': 1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        sitesList = result;
                }
                callback();
            }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
};

/*retrieve list of Missing*/
function getMissing(callback){
    if (db) {
        var missingColl = db.collection('missing');
        missingColl.find({},{'name': 1, code: 1, 'disappearance.place': 1, 'disappearance.date': 1}).sort({'name.ar.last':1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        missingList = result;
                        missingResult = result;
                }
                callback();
            }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
};

function getContacts(callback){ 
    if (db) {
        var contactsColl = db.collection('contacts');
        contactsColl.find({},{'name': 1, code: 1, confidential:1, category: 1}).sort({'name.en':1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    contactsList = result;
            }
            callback();
        });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }         
};

function getInterviews(callback){ 
    if (db) {
        var interviewsColl = db.collection('interviews');
        interviewsColl.find({},{'interviewee': 1, code: 1, subject:1, date:1}).sort({'code':1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    interviewsList = result;
            }
            callback();
        });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }         
};

function getFiles(callback){ 
    if (db) {
        var filesColl = db.collection('files');
        filesColl.find({},{code: 1, description:1, type:1, file: 1, date:1}).sort({'code':1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    filesList = result;
            }
            callback();
        });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }         
};

function renameFile(files, relPath, code, callback){
    var newName;
    files.forEach( function(f) {
        newName = code+'-'+f.originalname
        filesArray.push(newName);
        fs.rename(relPath +f.filename, relPath+newName, function(err) {
            if ( err ) {
                console.log('ERROR: ' + err); 
            } 
        });    
    });
    callback();
};

function calcLastRecord(list, type){
    var numbers = [];
    var number;
    var nextrecord;
    
    if (type == "locations"){
        var barracks = [];
        var sbarracks = [];
        var ibarracks = [];
        var checkpoints = [];
        var scheckpoints = [];
        var icheckpoints = [];
        var centers = [];
        var scenters = [];
        var icenters = [];
        list.forEach(function(doc) {
            if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "B"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                barracks.push(number);
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "SB"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                sbarracks.push(number);
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "IB"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                ibarracks.push(number);    
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "C"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                checkpoints.push(number); 
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "SC"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                scheckpoints.push(number); 
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "IC"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                icheckpoints.push(number);  
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "D"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                centers.push(number);
            }else if (doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0] == "SD"){
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                scenters.push(number);    
            }else {
                number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                icenters.push(number); 
            }
        })
        var nextbarrack = "B"+((Math.max.apply(null, barracks))+1);
        var nextsbarrack = "SB"+((Math.max.apply(null, sbarracks))+1);
        var nextibarrack = "IB"+((Math.max.apply(null, ibarracks))+1);
        var nextcheckpoint = "C"+((Math.max.apply(null, checkpoints))+1);
        var nextscheckpoint = "SC"+((Math.max.apply(null, scheckpoints))+1);
        var nexticheckpoint = "IC"+((Math.max.apply(null, icheckpoints))+1);
        var nextcenter = "D"+((Math.max.apply(null, centers))+1);
        var nextscenter = "SD"+((Math.max.apply(null, scenters))+1);
        var nexticenter = "ID"+((Math.max.apply(null, icenters))+1);
        nextrecord = [nextbarrack, nextsbarrack, nextibarrack, nextcheckpoint, nextscheckpoint, nexticheckpoint, nextcenter, nextscenter, nexticenter];
        
    }else {
        list.forEach(function(doc) {
            //console.log("doc: "+JSON.stringify(doc))
            number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
            numbers.push(number); 
        })
        nextrecord = (Math.max.apply(null, numbers))+1;
        return nextrecord;             
                     
    }
    return nextrecord;
};

function updateRelated(collection, codeUpdate, codePush, field){
    if(db){
        var collection = db.collection(collection);
        if(field == "mps"){
            collection.update({code: codeUpdate}, {$push: {'related.mps': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });    
        } else if(field == "events"){
            collection.update({code: codeUpdate}, {$push: {'related.events': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        }else if(field == "locations"){
            collection.update({code: codeUpdate}, {$push: {'related.locations': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "sites"){
            collection.update({code: codeUpdate}, {$push: {'related.sites': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "contacts"){
            collection.update({code: codeUpdate}, {$push: {'contacts': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "interviews"){
            collection.update({code: codeUpdate}, {$push: {'interviews': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
                if (typeof codeUpdate == "String") console.log(codeUpdate +"is string");
                console.log(codeUpdate);
                console.log(codePush);
            });      
        } else if(field == "files"){
            collection.update({code: codeUpdate}, {$push: {'files': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        }
        
    } else { 
        res.render('index', { title: 'Login to Database'});
    } 
    
};

function removeRelated(collection, codeUpdate, codePush, field){
    if(db){
        var collection = db.collection(collection);
        if(field == "mps"){
            collection.update({code: codeUpdate}, {$pull: {'related.mps': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });    
        } else if(field == "events"){
            collection.update({code: codeUpdate}, {$pull: {'related.events': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        }else if(field == "locations"){
            collection.update({code: codeUpdate}, {$pull: {'related.locations': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "sites"){
            collection.update({code: codeUpdate}, {$pull: {'related.sites': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "contacts"){
            collection.update({code: codeUpdate}, {$pull: {'contacts': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        } else if(field == "files"){
            collection.update({code: codeUpdate}, {$pull: {'files': codePush}}, function(err, result){
                if (err) console.log ("error :"+err);
            });      
        }
        
    } else { 
        res.render('index', { title: 'Login to Database'});
    } 
    
};

function createFileRecord(req, contactCode, relEvents, relSites, relLocations, relMPs, callback) {
    if(filesArray.length>0){
        var newFiles = [];
        var lastcode = calcLastRecord(filesList, "files");
        var i = -1;
        filesArray.forEach(function (f){
            i = i+1;
            var newcode =  lastcode+i; 
            var filenew = {
                "code" : "FILE"+newcode,
                "type": "Interview",
                "description": "Interview "+req.body.code,
                "file" : f,
                "date" : dateConverter(req.body.date_day,req.body.date_month, req.body.date_year),
                "format" : req.body.format,
                "language" : req.body.language,
                "notes": req.body.notes,
                "contacts": [contactCode],
                "interviews": [req.body.code],
                "related" : {
                    "events" : relEvents,
                    "sites" : relSites,
                    "locations" :relLocations,
                    "mps" : relMPs
                }
             };
            
             var filesCollection = db.collection('files')
             filesCollection.insert([filenew], function(err, result){
                if (err){
                    res.render('newfile', {
                        "errormessage" : err
                    });
                } else {
                    newFiles.push("FILE"+newcode);
                    //console.log("newFiles"+newFiles);
                }
             });                    
        });
        
    }  
    callback();
}

/* GET list of missing */
router.get('/missing', function(req, res){
    if (sessData.user){
        async.parallel([
            getMissing,
            getEvents,
            getLocations,
            getParties,
            getSites
        ], function(err){
            if (err) {
                return console.error(err);
            } else if (missingList.length) {
                    nextrecord = calcLastRecord(missingList, "missing");
                    res.render('missinglist', {
                        "collList" : missingList,
                        title: "List of Missing People",
                        nextrecord : nextrecord,
                        "user": user,
                        parties : partiesList,
                        locations: locationsList, 
                        events: eventsList, 
                        sites: sitesList
                    });   
    
                } else {
                        res.send('No Events found');
                }
        });
    } else {
        res.render('index', { title: 'Login to Database'});
    }
    
});

/* GET list of Events */
router.get('/events', function(req, res){      
        getEvents(function(){
            if (eventsList.length) {
                nextrecord = calcLastRecord(eventsList, "events");
                res.render('eventslist', {
                    "collList" : eventsList,
                    nextrecord : nextrecord,
                    user: user
                });   

            } else {
                    res.send('No Events found');
            }
        });
});

/* GET list of Locations */
router.get('/locations', function(req, res){
    getLocations(function(){
            if (locationsList.length) {
                nextrecord = calcLastRecord(locationsList, "locations");
                res.render('locationslist', {
                    "user": user,
                    "collList" : locationsList,
                    "nextbarrack" : nextrecord[0],
                    "nextsbarrack" : nextrecord[1],
                    "nextibarrack" : nextrecord[2],
                    "nextcheckpoint" : nextrecord[3],
                    "nextscheckpoint" : nextrecord[4],
                    "nexticheckpoint" : nextrecord[5],
                    "nextcenter" : nextrecord[6],
                    "nextscenter" : nextrecord[7],
                    "nexticenter" : nextrecord[8],
                });   

            } else {
                    res.send('No Events found');
            }
        }); 
});

/* GET list of Sites */
router.get('/sites', function(req, res){
    getSites(function(){
            if (sitesList.length) {
                nextrecord = calcLastRecord(sitesList, "sites");
                res.render('siteslist', {
                    "collList" : sitesList,
                    nextrecord : nextrecord,
                    parties : partiesList,
                    locations: locationsList, 
                    events: eventsList, 
                    sites: sitesList,
                    mps: missingList,
                    "user": user
                });   

            } else {
                    res.send('No Events found');
            }
        });     
});

/* GET list of Logins */
router.get('/logins', function(req, res){
    if (db) {
        var loginsColl = db.collection('logins');

        loginsColl.find({}, {user:1, ip:1, date:1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else if (result.length) {
                    res.render('loginslist', {
                        "collList" : result,
                        "user": user
                        });    
            } else {
                    res.send('No Sites found');
            }
        }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }     
});

/*GET mapping*/
router.get('/map', function(req, res){
    res.render('map', {
        "user": user
    });    
});

/* GET list of Parties */
router.get('/parties', function(req, res){
    getParties(function(){
            if (partiesList.length) {
                nextrecord = calcLastRecord(partiesList, "parties");
                res.render('partieslist', {
                    "collList" : partiesList,
                    nextrecord : nextrecord,
                    "user": user
                });   

            } else {
                    res.send('No Events found');
            }
        });       
});

/* GET list of Contacts */
router.get('/contacts', function(req, res){
    getContacts(function(){
            if (contactsList.length) {
                nextrecord = calcLastRecord(contactsList, "contacts");
                res.render('contactslist', {
                    "collList" : contactsList,
                    nextrecord : nextrecord,
                    "user": user
                });   

            } else {
                    res.send('No Events found');
            }
        });       
});

/* GET list of Interviews */
router.get('/interviews', function(req, res){
    getInterviews(function(){
            if (interviewsList.length) {
                nextrecord = calcLastRecord(interviewsList, "interviews");
                res.render('interviewslist', {
                    "collList" : interviewsList,
                    nextrecord : nextrecord,
                    "user": user
                });   

            } else {
                    res.send('No Interviews found');
            }
        });       
});

/* GET list of Files */
router.get('/files', function(req, res){
    getFiles(function(){
            if (filesList.length) {
                nextrecord = calcLastRecord(filesList, "files");
                res.render('fileslist', {
                    "collList" : filesList,
                    nextrecord : nextrecord,
                    "user": user
                });   

            } else {
                    res.send('No Files found');
            }
        });       
});

/* GET profile*/
router.get('/profile', function(req, res){
    if (db) {
            var collName = req.query.type;
            var collection = db.collection(collName);
            
            collection.find({code:req.query.code}).toArray(function(err, result){
            if (err){
                res.send(err);
            } else if (result.length) {
                profile = result;
                res.render(req.query.type+'profile', {    
                    "profile" : result,
                    });    
            } else {
                res.send('No data found');
            }
            }); 
        
    } else {
            res.render('index', { title: 'Login to Database'});
    }       
});

/* ADD or EDIT */
router.get('/newprofile', function(req, res){  
    async.parallel([
        getMissing,
        getEvents,
        getLocations,
        getParties,
        getSites,
        getContacts,
        getInterviews,
        getFiles
    ], function(err){
        if (err) {
            return console.error(err);
        }
        var type = req.query.type;
        if (req.query.nextrecord){
            res.render('new'+type, { title: 'Add New '+type, nextrecord : req.query.nextrecord, parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, interviewslist: interviewsList});
        } else {
            res.render('new'+type, { title: 'Edit '+type, editprofile : profile, parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, interviewslist: interviewsList});
        }
    });
});

function dateConverter(day, month, year) {
                var date;
                if (year != ""){ 
                    if (day == ""){day = "01"};
                    if (month == "") {month = "01"};
                    //date = new Date('"'+year+'-'+month+'-'+day+'"').toISOString();
                    date = new Date(Date.UTC(year, month-1, day));
                    //console.log("date :" +date);
                };
                return date;
};


/*INSERT or UPDATE Missing*/
router.post('/addmissing', function(req, res){
        if (db) {
            var collection = db.collection('missing');
            

            function ageCalculator(age, birth, disapp){
                if (age && age == "" && birth && birth!="" && disapp && disapp !=""){
                    var thisYear = 0;
                    if (disapp.getMonth() < birth.getMonth()) {
                        thisYear = 1;
                    } else if ((disapp.getMonth() == birth.getMonth()) && disapp.getDate() < birth.getDate()) {
                        thisYear = 1;
                    }
                    age = disapp.getFullYear() - birth.getFullYear() - thisYear;
                }
                return age;
                
            };
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_ar_last', 'Last name in Arabic cannot be empty').notEmpty();
            req.check('age','Age must be a number').isNumber;
            req.check('disappearance_location_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('disappearance_location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.validationErrors();
            if (errors) {
                res.render('newmissing', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "name_ar_first" : req.body.name_ar_first,
                    "name_ar_middle" : req.body.name_ar_middle,
                    "name_ar_last" : req.body.name_ar_last,
                    "name_ar_alt_name" : req.body.name_ar_alt_name,
                    "name_en_first" : req.body.name_en_first,
                    "name_en_middle" : req.body.name_en_middle,
                    "name_en_last" : req.body.name_en_last,
                    "name_en_alt_name" : req.body.name_en_alt_name,
                    "alias" : req.body.alias,
                    "mothers_name" : req.body.mothers_name,
                    "sex" : req.body.sex,
                    "birth_place" : req.body.birth_place,
                    "birth_date_day" : req.body.birth_date_day,
                    "birth_date_month": req.body.birth_date_month, 
                    "birth_date_year": req.body.birth_date_year,
                    "birth_alt_date_day" : req.body.birth_alt_date_day,
                    "birth_alt_date_month": req.body.birth_alt_date_month,
                    "birth_alt_date_year": req.body.birth_alt_date_year,
                    "birth_sejl" : req.body.birth_sejl,
                    "age" : req.body.age,
                    "residence" : req.body.residence,
                    "nationality" : req.body.nationality,
                    "marital_status" : req.body.marital_status,
                    "children" : req.body.children,
                    "profession" : req.body.profession,
                    "confession" : req.body.confession,
                    "political_affiliation" : req.body.political_affiliation,
                    "description" : req.body.description,
                    "disappearance_date_day": req.body.disappearance_date_day,
                    "disappearance_date_month": req.body.disappearance_date_month,
                    "disappearance_date_year": req.body.disappearance_date_year,
                    "disappearance_alt_date_day" : req.body.disappearance_alt_date_day,
                    "disappearance_alt_date_month" : req.body.disappearance_alt_date_month,
                    "disappearance_alt_date_year" : req.body.disappearance_alt_date_year,
                    "disappearance_place_en" : req.body.disappearance_place_en,
                    "disappearance_place_ar" : req.body.disappearance_place_ar,
                    "disappearance_place_district" : req.body.disappearance_place_district,
                    "disappearance_place_governorate" : req.body.disappearance_place_governorate,
                    "disappearance_place_alt_place" : req.body.disappearance_place_alt_place,
                    "disappearance_location_latitude" : req.body.disappearance_location_latitude,
                    "disappearance_location_longitude" : req.body.disappearance_location_longitude,
                    "disappearance_circumstances" : req.body.disappearance_circumstances,
                    "last_seen_reported" : req.body.last_seen_reported,
                    "last_seen_location" : req.body.last_seen_location,
                    "last_seen_country": req.body.last_seen_country,
                    "last_seen_date_day" : req.body.last_seen_date_day,
                    "last_seen_date_month" : req.body.last_seen_date_month,
                    "last_seen_date_year" : req.body.last_seen_date_year,
                    "itinerary" : req.body.itinerary,
                    "perpetrators" : req.body.perpetrators,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "fate" : req.body.fate,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "picture" : req.body.picture,
                    "lists_syria_2000" : req.body.lists_syria_2000,
                    "lists_syria_2002" : req.body.lists_syria_2002,
                    "lists_syria_2005" : req.body.lists_syria_2005,
                    "lists_israel_2005" : req.body.lists_israel_2005,
                    "fushatamal_published" : req.body.fushatamal_published,
                    "fushatamal_auth_type" : req.body.fushatamal_auth_type,
                    "fushatamal_auth_notes" : req.body.fushatamal_auth_notes,
                    "fushatamal_auth_name" : req.body.fushatamal_auth_name,
                    "fushatamal_auth_last" : req.body.fushatamal_auth_last,
                    "fushatamal_auth_email" : req.body.fushatamal_auth_email,
                    "fushatamal_auth_phone" : req.body.fushatamal_auth_phone,
                    "fushatamal_auth_relationship" : req.body.fushatamal_auth_relationship,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var long;
              var lat; 
            
              if (req.body.disappearance_location_longitude) {
                 long = parseFloat(req.body.disappearance_location_longitude);   
              } else long = 0;
              if (req.body.disappearance_location_latitude) {
                    lat = parseFloat(req.body.disappearance_location_latitude);   
              }else lat = 0;      
                 
              if (typeof relEvents == "string") relEvents = [relEvents]
              if (typeof relSites == "string") relSites = [relSites]
              if (typeof relLocations == "string") relLocations = [relLocations]
              if (typeof relMPs == "string") relMPs = [relMPs]
              if (typeof contacts == "string") contacts = [contacts]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = [];
              
              /*if its an edit*/   
              if (req.body._id){  
                var updateVal = {};                                                     
                if (profile[0].name.ar.first!= req.body.name_ar_first) updateVal['name.ar.first'] =  req.body.name_ar_first
                if (profile[0].name.ar.middle!= req.body.name_ar_middle) updateVal['name.ar.middle'] =  req.body.name_ar_middle
                if (profile[0].name.ar.last!= req.body.name_ar_last) updateVal['name.ar.last'] =  req.body.name_ar_last
                if (profile[0].name.ar.alt_name!= req.body.name_ar_alt_name) updateVal['name.ar.alt_name'] =  req.body.name_ar_alt_name
                if (profile[0].name.en.first!= req.body.name_en_first) updateVal['name.en.first'] =  req.body.name_en_first
                if (profile[0].name.en.middle!= req.body.name_en_middle) updateVal['name.en.middle'] =  req.body.name_en_middle
                if (profile[0].name.en.last!= req.body.name_en_last) updateVal['name.en.last'] = req.body.name_en_last
                if (profile[0].name.en.alt_name!= req.body.name_en_alt_name) updateVal['name.en.alt_name'] = req.body.name_en_alt_name 
                if (profile[0].alias!= req.body.alias) updateVal['alias'] =  req.body.alias
                if (profile[0].mothers_name!= req.body.mothers_name) updateVal['mothers_name'] = req.body.mothers_name 
                if (profile[0].sex!= req.body.sex) updateVal['sex'] =  req.body.sex  
                if (profile[0].birth.place!= req.body.birth_place) updateVal['birth.place'] =  req.body.birth_place
                if (profile[0].birth.date!= dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year)) updateVal['birth.date'] =  dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year)
                if (profile[0].birth.alt_date!= dateConverter(req.body.birth_alt_date_day,req.body.birth_alt_date_month, req.body.birth_alt_date_year)) updateVal['birth.alt_date'] =  dateConverter(req.body.birth_alt_date_day,req.body.birth_alt_date_month, req.body.birth_alt_date_year)
                if (profile[0].birth.sejl!= req.body.birth_sejl) updateVal['birth.sejl'] =  req.body.birth_sejl   
                if (profile[0].age!= req.body.age) updateVal['age'] =  ageCalculator(req.body.age,dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year))
                if (profile[0].residence!= req.body.residence) updateVal['residence'] =  req.body.residence
                if (profile[0].nationality!= req.body.nationality) updateVal['nationality'] =  req.body.nationality
                if (profile[0].marital_status!= req.body.marital_status) updateVal['marital_status'] =  req.body.marital_status
                if (profile[0].children!= req.body.children) updateVal['children'] =  req.body.children
                if (profile[0].profession!= req.body.profession) updateVal['profession'] =  req.body.profession
                if (profile[0].confession!= req.body.confession) updateVal['confession'] =  req.body.confession
                if (profile[0].political_affiliation!= req.body.political_affiliation) updateVal['political_affiliation'] =  req.body.political_affiliation
                if (profile[0].description!= req.body.description) updateVal['description'] =  req.body.description
                if (profile[0].disappearance.date!= dateConverter(req.body.disappearance_date_day,req.body.disappearance_date_month, req.body.disappearance_date_year)) updateVal['disappearance.date'] =  dateConverter(req.body.disappearance_date_day,req.body.disappearance_date_month, req.body.disappearance_date_year)
                if (profile[0].disappearance.alt_date!= dateConverter(req.body.disappearance_alt_date_day,req.body.disappearance_alt_date_month, req.body.disappearance_alt_date_year)) updateVal['disappearance.alt_date'] =  dateConverter(req.body.disappearance_alt_date_day,req.body.disappearance_alt_date_month, req.body.disappearance_alt_date_year)
                if (profile[0].disappearance.place.en!= req.body.disappearance_place_en) updateVal['disappearance.place.en'] =  req.body.disappearance_place_en
                if (profile[0].disappearance.place.ar!= req.body.disappearance_place_ar) updateVal['disappearance.place.ar'] =  req.body.disappearance_place_ar
                if (profile[0].disappearance.place.district!= req.body.disappearance_place_district) updateVal['disappearance.place.district'] =  req.body.disappearance_place_district
                if (profile[0].disappearance.place.governorate!= req.body.disappearance_place_governorate) updateVal['disappearance.place.governorate'] =  req.body.disappearance_place_governorate
                if (profile[0].disappearance.place.alt_place!= req.body.disappearance_place_alt_place) updateVal['disappearance.place.alt_place'] =  req.body.disappearance_place_alt_place
                if (profile[0].disappearance.location.latitude && profile[0].disappearance.location.longitude && (profile[0].disappearance.location.latitude!= req.body.disappearance_location_latitude || profile[0].disappearance.location.longitude!= req.body.disappearance_location_longitude)) {
                    updateVal['location.coordinates'] =  [long, lat]
                    updateVal['disappearance.location.latitude'] =  req.body.disappearance_location_latitude
                    updateVal['disappearance.location.longitude'] =  req.body.disappearance_location_longitude
                }  
                  
                if (profile[0].disappearance.circumstances!= req.body.disappearance_circumstances) updateVal['disappearance.circumstances'] =  req.body.disappearance_circumstances
                if (profile[0].last_seen.reported!= req.body.last_seen_reported) updateVal['last_seen.reported'] =  req.body.last_seen_reported
                if (profile[0].last_seen.location!= req.body.last_seen_location) updateVal['last_seen.location'] =  req.body.last_seen_location
                if (profile[0].last_seen.country!= req.body.last_seen_country) updateVal['last_seen.country'] =  req.body.last_seen_country 
                if (profile[0].last_seen.date!= dateConverter(req.body.last_seen_date_day,req.body.last_seen_date_month, req.body.last_seen_date_year)) updateVal['last_seen.date'] =  dateConverter(req.body.last_seen_date_day,req.body.last_seen_date_month, req.body.last_seen_date_year)
                if (profile[0].itinerary!= req.body.itinerary) updateVal['itinerary'] =  req.body.itinerary
                if (profile[0].perpetrators!= req.body.perpetrators) updateVal['perpetrators'] =  req.body.perpetrators
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].fate!= req.body.fate) updateVal['fate'] =  req.body.fate
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].sources!= req.body.sources) updateVal['sources'] =  [req.body.sources]
                if (profile[0].picture!= req.body.picture) updateVal['picture'] =  req.body.picture
                if (profile[0].lists.syria_2000!= req.body.lists_syria_2000) updateVal['lists.syria_2000'] =  req.body.lists_syria_2000
                if (profile[0].lists.syria_2002!= req.body.lists_syria_2002) updateVal['lists.syria_2002'] =  req.body.lists_syria_2002
                if (profile[0].lists.syria_2005!= req.body.lists_syria_2005) updateVal['lists.syria_2005'] =  req.body.lists_syria_2005 
                if (profile[0].lists.israel_2005!= req.body.lists_israel_2005) updateVal['lists.israel_2005'] =  req.body.lists_israel_2005
                if (profile[0].fushatamal.published!= req.body.fushatamal_published) updateVal['fushatamal.published'] =  req.body.fushatamal_published
                if (profile[0].fushatamal.auth_type!= req.body.fushatamal_auth_type) updateVal['fushatamal.auth_type'] =  req.body.fushatamal_auth_type
                if (profile[0].fushatamal.auth_notes!= req.body.fushatamal_auth_notes) updateVal['fushatamal.auth_notes'] =  req.body.fushatamal_auth_notes
                if (profile[0].fushatamal.auth_name!= req.body.fushatamal_auth_name) updateVal['fushatamal.auth_name'] =  req.body.fushatamal_auth_name
                if (profile[0].fushatamal.auth_last!= req.body.fushatamal_auth_last) updateVal['fushatamal.auth_last'] =  req.body.fushatamal_auth_last
                if (profile[0].fushatamal.auth_email!= req.body.fushatamal_auth_email) updateVal['fushatamal.auth_email'] =  req.body.fushatamal_auth_email
                if (profile[0].fushatamal.auth_phone!= req.body.fushatamal_auth_phone) updateVal['fushatamal.auth_phone'] =  req.body.fushatamal_auth_phone
                if (profile[0].fushatamal.auth_relationship!= req.body.fushatamal_auth_relationship) updateVal['fushatamal.auth_relationship'] =  req.body.fushatamal_auth_relationship
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts
                    
                  

                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                
                if (err){
                    console.log ("error :"+err);
                    res.render('newmissing', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                    });
                }else {
                    if (profile[0].related.events!= relEvents) {
                        relEvents.forEach( function (e){
                            if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "mps");
                        });
                        (profile[0].related.events).forEach( function (e){
                            if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "mps");
                        });
                    }
                    if (profile[0].related.sites!= relSites) {
                        relSites.forEach( function (e){
                            if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "mps");
                        });
                        (profile[0].related.sites).forEach( function (e){
                            if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "mps");
                        });
                    }
                    if (profile[0].related.locations != relLocations) {
                        relLocations.forEach( function (e){
                            if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "mps");
                        });
                        (profile[0].related.locations).forEach( function (e){
                            if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "mps");
                        });
                    }
                    if (profile[0].related.mps != relMPs) {
                        relMPs.forEach( function (e){
                            if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "mps");
                        });
                        (profile[0].related.mps).forEach( function (e){
                            if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "mps");
                        });
                    }
                    profile = null;
                    res.redirect('/missing');
                    
                    
                }
               });
                
             /*if its an insert*/    
             } else{
                
                var missingnew = {
                                "code" : req.body.code,
                                "name" : {
                                    "ar" : {
                                        "first" : req.body.name_ar_first,
                                        "middle" : req.body.name_ar_middle,
                                        "last" : req.body.name_ar_last,
                                        "alt_name" : req.body.name_ar_alt_name
                                    },
                                    "en" : {
                                        "first" : req.body.name_en_first,
                                        "middle" : req.body.name_en_middle,
                                        "last" : req.body.name_en_last,
                                        "alt_name" : req.body.name_en_alt_name
                                    }
                                },
                                "alias" : req.body.alias,
                                "mothers_name" : req.body.mothers_name,
                                "sex" : req.body.sex,
                                "birth" : {
                                    "place" : req.body.birth_place,
                                    "date" : dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year),
                                    "alt_date" : dateConverter(req.body.birth_alt_date_day,req.body.birth_alt_date_month, req.body.birth_alt_date_year),
                                    "sejl" : req.body.birth_sejl
                                },
                                "age" : ageCalculator(req.body.age,dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year), dateConverter(req.body.disappearance_date_day,req.body.disappearance_date_month, req.body.disappearance_date_year)),
                                "residence" : req.body.residence,
                                "nationality" : req.body.nationality,
                                "marital_status" : req.body.marital_status,
                                "children" : req.body.children,
                                "profession" : req.body.profession,
                                "confession" : req.body.confession,
                                "political_affiliation" : req.body.political_affiliation,
                                "description" : req.body.description,
                                "disappearance" : {
                                    "date" : dateConverter(req.body.disappearance_date_day,req.body.disappearance_date_month,req.body.disappearance_date_year),
                                    "alt_date" : dateConverter(req.body.disappearance_alt_date_day,req.body.disappearance_alt_date_month, req.body.disappearance_alt_date_year),
                                    "place" : {
                                        "en" : req.body.disappearance_place_en,
                                        "ar" : req.body.disappearance_place_ar,
                                        "district" : req.body.disappearance_place_district,
                                        "governorate" : req.body.disappearance_place_governorate,
                                        "alt_place" : req.body.disappearance_place_alt_place
                                    },
                                    "location" : {
                                        "latitude" : req.body.disappearance_location_latitude,
                                        "longitude" : req.body.disappearance_location_longitude
                                    },
                                    "circumstances" : req.body.disappearance_circumstances
                                },
                                "last_seen" : {
                                    "reported" : req.body.last_seen_reported,
                                    "location" : req.body.last_seen_location,
                                    "country" : req.body.last_seen_country,
                                    "date" : dateConverter(req.body.last_seen_date_day, req.body.last_seen_date_month, req.body.last_seen_date_year)
                                },
                                "itinerary" : req.body.itinerary,
                                "perpetrators" : req.body.perpetrators,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "fate" : req.body.fate,
                                "notes" : req.body.notes,
                                "sources" : req.body.sources,
                                "picture" : req.body.picture,
                                "files" : [],
                                "lists" : {
                                    "syria_2000" : req.body.lists_syria_2000,
                                    "syria_2002" : req.body.lists_syria_2002,
                                    "syria_2005" : req.body.lists_syria_2005,
                                    "israel_2005" : req.body.lists_israel_2005
                                },
                                "fushatamal" : {
                                    "published" : req.body.fushatamal_published,
                                    "auth_type" : req.body.fushatamal_auth_type,
                                    "auth_notes" : req.body.fushatamal_auth_notes,
                                    "auth_name" : req.body.fushatamal_auth_name,
                                    "auth_last" : req.body.fushatamal_auth_last,
                                    "auth_email" : req.body.fushatamal_auth_email,
                                    "auth_phone" : req.body.fushatamal_auth_phone,
                                    "auth_relationship" : req.body.fushatamal_auth_relationship
                                },
                                "contacts" : contacts,
                                "location" : {
                                    "coordinates" : [ long, lat ],
                                    "type" : "Point"
                                }
                             };
                collection.insert([missingnew], function(err, result){
                if (err){
                    res.render('newmissing', {
                        "errormessage" : err
                    });
                }else {
                    if (relEvents) {
                        relEvents.forEach( function (e){
                            updateRelated("events", e, req.body.code, "mps");
                        });
                    }
                    if (relSites) {
                        relSites.forEach( function (e){
                            updateRelated("sites", e, req.body.code, "mps");
                        });
                    }
                    if (relLocations) {
                        relLocations.forEach( function (e){
                            updateRelated("locations", e, req.body.code, "mps");
                        });
                    }
                    if (relMPs) {
                        relMPs.forEach( function (e){
                            updateRelated("missing", e, req.body.code, "mps");
                        });
                    }
                    
                    res.redirect('/missing');
                }
              });
                
            }
          }
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Event*/
router.post('/addevent', function(req, res){
        if (db) {
            var collection = db.collection('events');
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('location_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.validationErrors();
            if (errors) {
                res.render('newevent', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "type": req.body.type,
                    "name_ar" : req.body.name_ar,
                    "name_en" : req.body.name_en,
                    "location_place" : req.body.location_place,
                    "location_district" : req.body.location_district,
                    "location_governorate" : req.body.location_governorate,
                    "location_latitude" : req.body.location_latitude,
                    "location_longitude" : req.body.location_longitude,
                    "UNHCR_latitude" : req.body.UNHCR_latitude,
                    "UNHCR_longitude" : req.body.UNHCR_longitude,
                    "date_beg_day" : req.body.date_beg_day,
                    "date_beg_month": req.body.date_beg_month, 
                    "date_beg_year": req.body.date_beg_year,
                    "date_end_day" : req.body.date_end_day,
                    "date_end_month": req.body.date_end_month,
                    "date_end_year": req.body.date_end_year,
                    "groups_responsible" : req.body.groups_responsible,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var groups =  req.body.groups_responsible;      
              var long;
              var lat; 
            
              if (req.body.location_longitude) {
                 long = parseFloat(req.body.location_longitude);   
              } else long = 0;
              if (req.body.location_latitude) {
                    lat = parseFloat(req.body.location_latitude);   
              }else lat = 0;     
                 
              if (typeof relEvents == "string") relEvents = [relEvents]
              if (typeof relSites == "string") relSites = [relSites]
              if (typeof relLocations == "string") relLocations = [relLocations]
              if (typeof relMPs == "string") relMPs = [relMPs]
              if (typeof groups == "string") groups = [groups]
              if (typeof contacts == "string") contacts = [contacts]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = [];     
                 
              /*if its an edit*/   
              if (req.body._id){    
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type  
                if (profile[0].location.place!= req.body.location_place) updateVal['location.place'] =  req.body.location_place
                if (profile[0].location.district!= req.body.location_district) updateVal['location.district'] =  req.body.location_district
                if (profile[0].location.governorate!= req.body.location_governorate) updateVal['location.governorate'] =  req.body.location_governorate
                if (profile[0].location.latitude && profile[0].location.longitude && (profile[0].location.latitude!= req.body.location_latitude || profile[0].location.longitude!= req.body.location_longitude)) {
                    updateVal['location.coordinates'] =  [long, lat]
                    updateVal['specific.latitude'] =  req.body.location_latitude
                    updateVal['specific.longitude'] =  req.body.location_longitude
                }
                if (profile[0].UNHCR.latitude!= req.body.UNHCR_latitude) updateVal['UNHCR.latitude'] =  req.body.UNHCR_latitude
                if (profile[0].UNHCR.longitude!= req.body.UNHCR_longitude) updateVal['UNHCR.longitude'] =  req.body.UNHCR_longitude  
                if (profile[0].dates.beg!= dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)) updateVal['dates.beg'] =  dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)
                if (profile[0].dates.end!= dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)) updateVal['dates.end'] =  dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)
                if (profile[0].groups_responsible!= groups)updateVal['groups_responsible'] = groups
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].sources!= req.body.sources) updateVal['sources'] =  [req.body.sources]
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts

                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                
                if (err){
                    console.log ("error :"+err);
                    res.render('newevent', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                    });
                }else {
                    if (profile[0].related.events!= relEvents) {
                        relEvents.forEach( function (e){
                            if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "events");
                        });
                        (profile[0].related.events).forEach( function (e){
                            if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "events");
                        });
                    }
                    if (profile[0].related.sites!= relSites) {
                        relSites.forEach( function (e){
                            if(!profile[0].related.sites || (profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "events");
                        });
                        (profile[0].related.sites).forEach( function (e){
                            if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "events");
                        });
                    }
                    if (profile[0].related.locations != relLocations) {
                        relLocations.forEach( function (e){
                            if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "events");
                        });
                        (profile[0].related.locations).forEach( function (e){
                            if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "events");
                        });
                    }
                    if (profile[0].related.mps != relMPs) {
                        relMPs.forEach( function (e){
                            if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "events");
                        });
                        (profile[0].related.mps).forEach( function (e){
                            if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "events");
                        });
                    }
                    profile = null;
                    res.redirect('/events');
                    
                    
                }
               });
                
             /*if its an insert*/    
             } else{
                var eventnew = {
                                "code" : req.body.code,
                                "type" : req.body.type,
                                "name" : {
                                    "ar" : req.body.name_ar,
                                    "en" : req.body.name_en
                                },
                                "location" : {
                                    "place" : req.body.location_place,
                                    "district" : req.body.location_district,
                                    "governorate" : req.body.location_governorate,
                                    "coordinates" : [long, lat],
                                    "type" : "Point"
                                },
                                "UNHCR" : {
		                              "latitude" : req.body.UNHCR_latitude,
		                              "longitude" : req.body.UNHCR_longitude
	                           },
                                "specific" : {
		                              "latitude" : req.body.location_latitude,
		                              "longitude" : req.body.location_longitude
	                           },
                                "dates" : {
                                    "beg" : dateConverter(req.body.date_beg_day,req.body.date_beg_month,req.body.date_beg_year),
                                    "end" : dateConverter(req.body.date_end_day,req.body.date_end_month,req.body.date_end_year)
                                },
                                "groups_responsible" : groups,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "notes" : req.body.notes,
                                "sources" : req.body.sources,
                                "contacts" : contacts,    
                                "files" : []
                             };
                collection.insert([eventnew], function(err, result){
                if (err){
                    res.render('newevent', {
                        "errormessage" : err
                    });
                }else {
                    if (relEvents) {
                        relEvents.forEach( function (e){
                            updateRelated("events", e, req.body.code, "events");
                        });
                    }
                    if (relSites) {
                        relSites.forEach( function (e){
                            updateRelated("sites", e, req.body.code, "events");
                        });
                    }
                    if (relLocations) {
                        relLocations.forEach( function (e){
                            updateRelated("locations", e, req.body.code, "events");
                        });
                    }
                    if (relMPs) {
                        relMPs.forEach( function (e){
                            updateRelated("missing", e, req.body.code, "events");
                        });
                    }
                    res.redirect('/events');
                }
              });
                
            }
          }
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Location*/
router.post('/addlocation', function(req, res){
        if (db) {
            var collection = db.collection('locations');
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            //req.check('location_latitude','Latitude should be xx.xxxxx').isDecimal;
            //req.check('location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.validationErrors();
            if (errors) {
                res.render('newlocation', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "category": req.body.category,
                    "name_ar" : req.body.name_ar,
                    "name_en" : req.body.name_en,
                    "location_place" : req.body.location_place,
                    "location_district" : req.body.location_district,
                    "location_governorate" : req.body.location_governorate,
                    "location_latitude" : req.body.location_latitude,
                    "location_longitude" : req.body.location_longitude,
                    "UNHCR_latitude" : req.body.UNHCR_latitude,
                    "UNHCR_longitude" : req.body.UNHCR_longitude,
                    "date_beg_day" : req.body.date_beg_day,
                    "date_beg_month": req.body.date_beg_month, 
                    "date_beg_year": req.body.date_beg_year,
                    "date_end_day" : req.body.date_end_day,
                    "date_end_month": req.body.date_end_month,
                    "date_end_year": req.body.date_end_year,
                    "groups_responsible" : req.body.groups_responsible,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var groups =  req.body.groups_responsible;    
              var long;
              var lat; 
            
              if (req.body.location_longitude) {
                 long = parseFloat(req.body.location_longitude);   
              } else long = 0;
              if (req.body.location_latitude) {
                    lat = parseFloat(req.body.location_latitude);   
              }else lat = 0;
                 
              if (typeof relEvents == "string") relEvents = [relEvents]
              if (typeof relSites == "string") relSites = [relSites]
              if (typeof relLocations == "string") relLocations = [relLocations]
              if (typeof relMPs == "string") relMPs = [relMPs]
              if (typeof groups == "string") groups = [groups]     
              if (typeof contacts == "string") contacts = [contacts]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = [];     
                 
              /*if its an edit*/     
              if (req.body._id){    
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                //if (profile[0].type!= req.body.category) updateVal['category'] =  req.body.category  
                if (profile[0].location.place!= req.body.location_place) updateVal['location.place'] =  req.body.location_place
                if (profile[0].location.district!= req.body.location_district) updateVal['location.district'] =  req.body.location_district
                if (profile[0].location.governorate!= req.body.location_governorate) updateVal['location.governorate'] =  req.body.location_governorate
                if ((profile[0].location.latitude!= req.body.location_latitude && req.body.location_latitude != "") || (profile[0].location.longitude!= req.body.location_longitude) && req.body.location_longitude!= "") {
                    updateVal['location.coordinates'] =  [long, lat]
                    updateVal['specific.latitude'] =  req.body.location_latitude
                    updateVal['specific.longitude'] =  req.body.location_longitude
                }
                if (profile[0].UNHCR.latitude!= req.body.UNHCR_latitude) updateVal['UNHCR.latitude'] =  req.body.UNHCR_latitude
                if (profile[0].UNHCR.longitude!= req.body.UNHCR_longitude) updateVal['UNHCR.longitude'] =  req.body.UNHCR_longitude  
                if (profile[0].dates.beg!= dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)) updateVal['dates.beg'] =  dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)
                if (profile[0].dates.end!= dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)) updateVal['dates.end'] =  dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)
                if (profile[0].groups_responsible!= groups)updateVal['groups_responsible'] = groups
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].sources!= req.body.sources) updateVal['sources'] =  req.body.sources 
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts

                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                
                if (err){
                    console.log ("error :"+err);
                    res.render('newlocation', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList
                    });
                }else {
                    if (profile[0].related.events!= relEvents) {
                        relEvents.forEach( function (e){
                            if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "locations");
                        });
                        if (profile[0].related.events){
                          (profile[0].related.events).forEach( function (e){
                            if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "locations");
                          });  
                        }
                        
                    }
                    if (profile[0].related.sites!= relSites) {
                        relSites.forEach( function (e){
                            if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "locations");
                        });
                        if (profile[0].related.sites){
                            (profile[0].related.sites).forEach( function (e){
                                if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "locations");
                            });
                        }
                        
                    }
                    if (profile[0].related.locations != relLocations) {
                        relLocations.forEach( function (e){
                            if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "locations");
                        });
                        if (profile[0].related.locations){
                            (profile[0].related.locations).forEach( function (e){
                                if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "locations");
                            });
                        }
                        
                    }
                    if (profile[0].related.mps != relMPs) {
                        relMPs.forEach( function (e){
                            if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "locations");
                        });
                        if(profile[0].related.mps){
                            (profile[0].related.mps).forEach( function (e){
                                if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "locations");
                            });
                        }
                        
                    }
                    profile = null;
                    res.redirect('/locations');
                    
                    
                }
               });
                
             /*if its an insert*/    
             } else{
                var locationnew = {
                                "code" : req.body.code,
                                "category" : req.body.category,
                                "name" : {
                                    "ar" : req.body.name_ar,
                                    "en" : req.body.name_en
                                },
                                "location" : {
                                    "place" : req.body.location_place,
                                    "district" : req.body.location_district,
                                    "governorate" : req.body.location_governorate,
                                    "coordinates" : [long, lat],
                                    "type" : "Point"
                                },
                                "UNHCR" : {
		                              "latitude" : req.body.UNHCR_latitude,
		                              "longitude" : req.body.UNHCR_longitude
	                           },
                                "specific" : {
		                              "latitude" : req.body.location_latitude,
		                              "longitude" : req.body.location_longitude
	                           },
                                "dates" : {
                                    "beg" : dateConverter(req.body.date_beg_day,req.body.date_beg_month,req.body.date_beg_year),
                                    "end" : dateConverter(req.body.date_end_day,req.body.date_end_month,req.body.date_end_year)
                                },
                                "groups_responsible" : groups,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "notes" : req.body.notes,
                                "sources" : req.body.sources,
                                "contacts" : contacts,
                                "files" : []
                             };
                collection.insert([locationnew], function(err, result){
                if (err){
                    res.render('newlocation', {
                        "errormessage" : err
                    });
                }else {
                    if (relEvents) {
                        relEvents.forEach( function (e){
                            updateRelated("events", e, req.body.code, "locations");
                        });
                    }
                    if (relSites) {
                        relSites.forEach( function (e){
                            updateRelated("sites", e, req.body.code, "locations");
                        });
                    }
                    if (relLocations) {
                        relLocations.forEach( function (e){
                            updateRelated("locations", e, req.body.code, "locations");
                        });
                    }
                    if (relMPs) {
                        relMPs.forEach( function (e){
                            updateRelated("missing", e, req.body.code, "locations");
                        });
                    }
                    res.redirect('/locations');
                }
              });
                
            }
          }
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Sites*/
router.post('/addsite', function(req, res){
        if (db) {
            var collection = db.collection('sites');
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('location_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.validationErrors();
            if (errors) {
                res.render('newsite', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "type": req.body.type,
                    "name_ar" : req.body.name_ar,
                    "name_en" : req.body.name_en,
                    "location_place" : req.body.location_place,
                    "location_district" : req.body.location_district,
                    "location_governorate" : req.body.location_governorate,
                    "location_latitude" : req.body.location_latitude,
                    "location_longitude" : req.body.location_longitude,
                    "UNHCR_latitude" : req.body.UNHCR_latitude,
                    "UNHCR_longitude" : req.body.UNHCR_longitude,
                    "date_beg_day" : req.body.date_beg_day,
                    "date_beg_month": req.body.date_beg_month, 
                    "date_beg_year": req.body.date_beg_year,
                    "date_end_day" : req.body.date_end_day,
                    "date_end_month": req.body.date_end_month,
                    "date_end_year": req.body.date_end_year,
                    "perpetrators" : req.body.perpetrators,
                    "number_expected" : req.body.number_expected,
                    "risk_index" : req.body.risk_index,
                    "risk_reasons" : req.body.risk_reasons,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "sensitivity_index": req.body.sensitivity_index,
                    "sensitivity_reasons" : req.body.sensitivity_reasons,
                    "credibility_index": req.body.credibility_index,
                    "credibility_reasons" : req.body.credibility_reasons,
                    "exhumed_status" : req.body.exhumed_status,
                    "exhumed_date_day" : req.body.exhumed_date_day,
                    "exhumed_date_month" : req.body.exhumed_date_month,
                    "exhumed_date_year" : req.body.exhumed_date_year,
                    "exhumed_number" : req.body.exhumed_number,
                    "exhumed_contact" : req.body.exhumed_contact,
                    "exhumed_notes" : req.body.exhumed_notes,
                    "status" : req.body.status,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts; 
              var long;
              var lat; 
            
              if (req.body.location_longitude) {
                 long = parseFloat(req.body.location_longitude);   
              } else long = 0;
              if (req.body.location_latitude) {
                    lat = parseFloat(req.body.location_latitude);   
              }else lat = 0;
                 
              if (typeof relEvents == "string") relEvents = [relEvents]
              if (typeof relSites == "string") relSites = [relSites]
              if (typeof relLocations == "string") relLocations = [relLocations]
              if (typeof relMPs == "string") relMPs = [relMPs]
              if (typeof contacts == "string") contacts = [contacts]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = [];
                 
              /*if its an edit*/
              if (req.body._id){    
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                if (profile[0].location.place!= req.body.location_place) updateVal['location.place'] =  req.body.location_place
                if (profile[0].location.district!= req.body.location_district) updateVal['location.district'] =  req.body.location_district
                if (profile[0].location.governorate!= req.body.location_governorate) updateVal['location.governorate'] =  req.body.location_governorate
                if (profile[0].location.latitude!= req.body.location_latitude || profile[0].location.longitude!= req.body.location_longitude) {
                    updateVal['location.coordinates'] =  [long, lat]
                    updateVal['specific.latitude'] =  req.body.location_latitude
                    updateVal['specific.longitude'] =  req.body.location_longitude
                }
                if (profile[0].UNHCR.latitude!= req.body.UNHCR_latitude) updateVal['UNHCR.latitude'] =  req.body.UNHCR_latitude
                if (profile[0].UNHCR.longitude!= req.body.UNHCR_longitude) updateVal['UNHCR.longitude'] =  req.body.UNHCR_longitude  
                if (profile[0].dates.beg!= dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)) updateVal['dates.beg'] =  dateConverter(req.body.date_beg_day,req.body.date_beg_month, req.body.date_beg_year)
                if (profile[0].dates.end!= dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)) updateVal['dates.end'] =  dateConverter(req.body.date_end_day,req.body.date_end_month, req.body.date_end_year)
                if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type
                if (profile[0].related.events!= relEvents) updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites) updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].perpetrators!= req.body.perpetrators) updateVal['perpetrators'] =  req.body.perpetrators
                if (profile[0].number_expected!= req.body.number_expected) updateVal['number_expected'] =  req.body.number_expected
                if (profile[0].risk.index!= req.body.risk_index) updateVal['risk.index'] =  req.body.risk_index
                if (profile[0].risk.reasons!= req.body.risk_reasons) updateVal['risk.reasons'] =  req.body.risk_reasons  
                if (profile[0].sensitivity.index!= req.body.sensitivity_index) updateVal['sensitivity.index'] =  req.body.sensitivity_index
                if (profile[0].sensitivity.reasons!= req.body.sensitivity_reasons) updateVal['sensitivity.reasons'] =  req.body.sensitivity_reasons
                if (profile[0].credibility.index!= req.body.credibility_index) updateVal['credibility.index'] =  req.body.credibility_index
                if (profile[0].credibility.reasons!= req.body.credibility_reasons) updateVal['credibility.reasons'] =  req.body.credibility_reasons
                if (profile[0].exhumed.status!= req.body.exhumed_status) updateVal['exhumed.status'] =  req.body.exhumed_status
                if (profile[0].exhumed.date!= dateConverter(req.body.exhumed_date_day,req.body.exhumed_date_month, req.body.exhumed_date_year)) updateVal['exhumed.date'] =  dateConverter(req.body.exhumed_date_day,req.body.exhumed_date_month,req.body.exhumed_date_year)
                if (profile[0].exhumed.number!= req.body.exhumed_number) updateVal['exhumed.number'] =  req.body.exhumed_number
                if (profile[0].exhumed.contact!= req.body.exhumed_contact) updateVal['exhumed.contact'] =  req.body.exhumed_contact
                if (profile[0].exhumed.notes!= req.body.exhumed_notes) updateVal['exhumed.notes'] =  req.body.exhumed_notes
                if (profile[0].status!= req.body.status) updateVal['status'] =  req.body.status
                if (profile[0].sources!= req.body.sources) updateVal['sources'] =  req.body.sources
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes  
                  
                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                
                if (err){
                    console.log ("error :"+err);
                    res.render('newsite', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList
                    });
                }else {
                    if (profile[0].related.events!= relEvents) {
                        relEvents.forEach( function (e){
                            if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "sites");
                        });
                        (profile[0].related.events).forEach( function (e){
                            if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "sites");
                        });
                    }
                    if (profile[0].related.sites!= relSites) {
                        relSites.forEach( function (e){
                            if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "sites");
                        });
                        (profile[0].related.sites).forEach( function (e){
                            if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "sites");
                        });
                    }
                    if (profile[0].related.locations != relLocations) {
                        relLocations.forEach( function (e){
                            if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "sites");
                        });
                        (profile[0].related.locations).forEach( function (e){
                            if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "sites");
                        });
                    }
                    if (profile[0].related.mps != relMPs) {
                        relMPs.forEach( function (e){
                            if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "sites");
                        });
                        (profile[0].related.mps).forEach( function (e){
                            if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "sites");
                        });
                    }
                    profile = null;
                    res.redirect('/sites');
                    
                    
                }
               });
                
             /*if its an insert*/    
             } else{
                var sitenew = {
                                "code" : req.body.code,
                                "type" : req.body.type,
                                "name" : {
                                    "ar" : req.body.name_ar,
                                    "en" : req.body.name_en
                                },
                                "location" : {
                                    "place" : req.body.location_place,
                                    "district" : req.body.location_district,
                                    "governorate" : req.body.location_governorate,
                                    "coordinates" : [long, lat],
                                    "type" : "Point"
                                },
                                "UNHCR" : {
		                              "latitude" : req.body.UNHCR_latitude,
		                              "longitude" : req.body.UNHCR_longitude
	                           },
                                "specific" : {
		                              "latitude" : req.body.location_latitude,
		                              "longitude" : req.body.location_longitude
	                           },
                                "dates" : {
                                    "beg" : dateConverter(req.body.date_beg_day,req.body.date_beg_month,req.body.date_beg_year),
                                    "end" : dateConverter(req.body.date_end_day,req.body.date_end_month,req.body.date_end_year)
                                },
                                "type" : req.body.type,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "perpetrators" : req.body.perpetrators,
                                "number_expected" : req.body.number_expected,
                                "risk" : {
		                                  "index" : req.body.risk_index,
                                          "reasons" : req.body.risk_reasons
                                },
                                "sensitivity" : {
		                                  "index" : req.body.sensitivity_index,
                                          "reasons" : req.body.sensitivity_reasons
                                },
                                "credibility" : {
		                                  "index" : req.body.credibility_index,
                                          "reasons" : req.body.credibility_reasons
                                },
                                "exhumed" : {
                                            "status" : req.body.exhumed_status,
                                            "date" : dateConverter(req.body.exhumed_date_day, req.body.exhumed_date_month, req.body.exhumed_date_year),
                                            "number" : req.body.exhumed_number,
                                            "contact" : req.body.exhumed_contact,
                                            "notes" : req.body.exhumed_notes
                                },
                                "status" : req.body.status,
	                            "sources" : req.body.sources,
                                "contacts" : contacts,
                                "files" : [],
                                "notes" : req.body.notes,
                             };
                collection.insert([sitenew], function(err, result){
                if (err){
                    res.render('newsite', {
                        "errormessage" : err
                    });
                }else {
                    if (relEvents) {
                        relEvents.forEach( function (e){
                            updateRelated("events", e, req.body.code, "sites");
                        });
                    }
                    if (relSites) {
                        relSites.forEach( function (e){
                            updateRelated("sites", e, req.body.code, "sites");
                        });
                    }
                    if (relLocations) {
                        relLocations.forEach( function (e){
                            updateRelated("locations", e, req.body.code, "sites");
                        });
                    }
                    if (relMPs) {
                        relMPs.forEach( function (e){
                            updateRelated("missing", e, req.body.code, "sites");
                        });
                    }
                    res.redirect('/sites');
                }
              });
                
            }
          }
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Party*/
router.post('/addparty', function(req, res){
        if (db) {
            var collection = db.collection('parties');
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('hq_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('hq_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.validationErrors();
            if (errors) {
                res.render('newparty', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "name_ar" : req.body.name_ar,
                    "name_en" : req.body.name_en,
                    "name_alt_name" : req.body.name_en,
                    "hq_place" : req.body.hq_place,
                    "hq_description" : req.body.hq_description,
                    "hq_latitude" : req.body.hq_latitude,
                    "hq_longitude" : req.body.hq_longitude,
                    "control_1_description" : req.body.control_1_description,
                    "control_1_latitude" : req.body.control_1_latitude,
                    "control_1_longitude" : req.body.control_1_longitude,
                    "date_beg_day_1": req.body.date_beg_day_1, 
                    "date_beg_month_1": req.body.date_beg_month_1,
                    "date_beg_year_1" : req.body.date_beg_year_1,
                    "date_end_day_1": req.body.date_end_day_1,
                    "date_end_month_1": req.body.date_end_month_2,
                    "date_end_year_1" : req.body.date_end_year_2,
                    
                    "control_2_description" : req.body.control_2_description,
                    "control_2_latitude" : req.body.control_2_latitude,
                    "control_2_longitude" : req.body.control_2_longitude,
                    "date_beg_day_2": req.body.date_beg_day_2, 
                    "date_beg_month_2": req.body.date_beg_month_2,
                    "date_beg_year_2" : req.body.date_beg_year_2,
                    "date_end_day_2": req.body.date_end_day_2,
                    "date_end_month_2": req.body.date_end_month_2,
                    "date_end_year_2" : req.body.date_end_year_2,
                    
                    "control_3_description" : req.body.control_3_description,
                    "control_3_latitude" : req.body.control_3_latitude,
                    "control_3_longitude" : req.body.control_3_longitude,
                    "date_beg_day_3": req.body.date_beg_day_3, 
                    "date_beg_month_3": req.body.date_beg_month_3,
                    "date_beg_year_3" : req.body.date_beg_year_3,
                    "date_end_day_3": req.body.date_end_day_3,
                    "date_end_month_3": req.body.date_end_month_3,
                    "date_end_year_3" : req.body.date_end_year_3,
                    
                    "control_4_description" : req.body.control_4_description,
                    "control_4_latitude" : req.body.control_4_latitude,
                    "control_4_longitude" : req.body.control_4_longitude,
                    "date_beg_day_4": req.body.date_beg_day_4, 
                    "date_beg_month_4": req.body.date_beg_month_4,
                    "date_beg_year_4" : req.body.date_beg_year_4,
                    "date_end_day_4": req.body.date_end_day_4,
                    "date_end_month_4": req.body.date_end_month_4,
                    "date_end_year_4" : req.body.date_end_year_4,
                    
                    "control_5_description" : req.body.control_5_description,
                    "control_5_latitude" : req.body.control_5_latitude,
                    "control_5_longitude" : req.body.control_5_longitude,
                    "date_beg_day_5": req.body.date_beg_day_5, 
                    "date_beg_month_5": req.body.date_beg_month_5,
                    "date_beg_year_5" : req.body.date_beg_year_5,
                    "date_end_day_5": req.body.date_end_day_5,
                    "date_end_month_5": req.body.date_end_month_5,
                    "date_end_year_5" : req.body.date_end_year_5,
                    
                    "flaf" : req.body.flag_file,
                    "documenta" : req.body.documents,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
            
              var long;
              var lat; 
            
              if (req.body.hq_longitude) {
                 long = parseFloat(req.body.hq_longitude);   
              } else long = 0;
              if (req.body.hq_latitude) {
                    lat = parseFloat(req.body.hq_latitude);   
              }else lat = 0;
                 
              /*if its an edit*/
              if (req.body._id){    
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                if (profile[0].name.alt_name!= req.body.name_alt_name) updateVal['name.alt_name'] =  req.body.name_alt_name
                if (profile[0].hq.place!= req.body.hq_place) updateVal['hq.place'] =  req.body.hq_place
                if (profile[0].hq.description!= req.body.hq_description) updateVal['hq.description'] =  req.body.hq_description
                if (profile[0].hq.latitude!= req.body.hq_latitude || profile[0].hq.longitude!= req.body.hq_longitude) {
                    updateVal['hq.coordinates'] =  [long, lat]
                }
                for(var i = 1;i<6;i++){  
                    if (profile[0].control_areas.i.description!= req.body.control_i_description) updateVal['control_areas.'+i+'.description'] =  req.body.control_i_description
                    if (profile[0].control_areas.i.coordinates[1]!= req.body.control_i_latitude || profile[0].control_areas.i.coordinates[0]!= req.body.control_i_longitude) updateVal['control_areas.'+1+'.coordinates'] = [parseFloat( req.body.control_i_longitude), parseFloat(req.body.control_i_latitude)] 
                    if (profile[0].control_areas.i.beg!= dateConverter(req.body.date_beg_day_i,req.body.date_beg_month_i, req.body.date_beg_year_i)) updateVal['control_areas.'+1+'.beg'] =  dateConverter(req.body.date_beg_day_i,req.body.date_beg_month_i, req.body.date_beg_year_i)
                    if (profile[0].control_areas.i.end!= dateConverter(req.body.date_end_day_i,req.body.date_end_month_i, req.body.date_end_year_i)) updateVal['control_areas.'+1+'.end'] =  dateConverter(req.body.date_end_day_i,req.body.date_end_month_i, req.body.date_end_year_i)
                }
                
                if (profile[0].flag.file!= req.body.flag_file) updateVal['flag.file'] =  req.body.flag_file
                if (profile[0].documents!= req.body.documents) updateVal['documents'] =  req.body.documents  
                  
                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                
                if (err){
                    console.log ("error :"+err);
                    res.render('newparty', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList
                    });
                }else {
                    profile = null;
                    res.redirect('/parties');
                    
                    
                }
               });
                
             /*if its an insert*/    
             } else{
                var partynew = {
                                "code" : req.body.code,
                                "name" : {
                                    "ar" : req.body.name_ar,
                                    "en" : req.body.name_en,
                                    "alt_name" : req.body.name_alt_name
                                },
                                "hq" : {
                                    "place" : req.body.hq_place,
                                    "description" : req.body.hq_description,
                                    "coordinates" : [long, lat],
                                    "type" : "Point"
                                },
                                "control_areas" : {
                                        "1" : {
                                                "description" : req.body.control_1_description,
                                                "coordinates" : [parseFloat(req.body.control_1_longitude),parseFloat(req.body.control_1_latitude)],
                                                "type" : "Point",
                                                "beg" : dateConverter(req.body.date_beg_day_1,req.body.date_beg_month_1,req.body.date_beg_year_1),
                                                "end" : dateConverter(req.body.date_end_day_1,req.body.date_end_month_1,req.body.date_end_year_1)
                                              },
                                        "2" : {
                                                "description" : req.body.control_2_description,
                                                "coordinates" : [parseFloat(req.body.control_2_longitude),parseFloat(req.body.control_2_latitude)],
                                                "type" : "Point",
                                                "beg" : dateConverter(req.body.date_beg_day_2,req.body.date_beg_month_2,req.body.date_beg_year_2),
                                                "end" : dateConverter(req.body.date_end_day_2,req.body.date_end_month_2,req.body.date_end_year_2)
                                              },
                                        "3" : {
                                                "description" : req.body.control_3_description,
                                                "coordinates" : [parseFloat(req.body.control_3_longitude),parseFloat(req.body.control_3_latitude)],
                                                "type" : "Point",
                                                "beg" : dateConverter(req.body.date_beg_day_3,req.body.date_beg_month_3,req.body.date_beg_year_3),
                                                "end" : dateConverter(req.body.date_end_day_3,req.body.date_end_month_3,req.body.date_end_year_3)
                                              },
                                        "4" : {
                                                "description" : req.body.control_4_description,
                                                "coordinates" : [parseFloat(req.body.control_4_longitude),parseFloat(req.body.control_4_latitude)],
                                                "type" : "Point",
                                                "beg" : dateConverter(req.body.date_beg_day_4,req.body.date_beg_month_4,req.body.date_beg_year_4),
                                                "end" : dateConverter(req.body.date_end_day_4,req.body.date_end_month_4,req.body.date_end_year_4)
                                              },
                                        "5" : {
                                                "description" : req.body.control_5_description,
                                                "coordinates" : [parseFloat(req.body.control_5_longitude),parseFloat(req.body.control_5_latitude)],
                                                "type" : "Point",
                                                "beg" : dateConverter(req.body.date_beg_day_5,req.body.date_beg_month_5,req.body.date_beg_year_5),
                                                "end" : dateConverter(req.body.date_end_day_5,req.body.date_end_month_5,req.body.date_end_year_5)
                                              }
                                },
                                "flag" : {
		                              "file" : req.body.flag_file
	                           },
                                "documents" : req.body.documents
                             };
                collection.insert([partynew], function(err, result){
                if (err){
                    res.render('newparty', {
                        "errormessage" : err
                    });
                }else {
                    res.redirect('/parties');
                }
              });
                
            }
          }
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Contact*/
router.post('/addcontact', function(req, res){
        if (db) {
            var collection = db.collection('contacts');
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            //req.check('name_en', 'Name in English cannot be empty').notEmpty();

            var errors = req.validationErrors();
            if (errors) {
                res.render('newcontact', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "confidential": req.body.confidential,
                    "name_ar_first" : req.body.name_ar_first,
                    "name_ar_last" : req.body.name_ar_last,
                    "name_en_first" : req.body.name_en_first,
                    "name_en_last" :req.body.name_en_last,
                    "alias": req.body.alias,
                    "fathers_name": req.body.fathers_name,
                    "mothers_name": req.body.mothers_name,
                    "sex": req.body.sex,
                    "birth_place": req.body.birth_place,
                    "birth_date_day" : req.body.birth_date_day,
                    "birth_date_month": req.body.birth_date_month, 
                    "birth_date_year": req.body.birth_date_year,
                    "residence": req.body.residence,
                    "nationality": req.body.nationality,
                    "profession": req.body.profession,
                    "status_war": req.body.status_war,
                    "relationship_missing": req.body.relationship_missing,
                    "political_affiliation": req.body.political_affiliation,
                    "area_present": req.body.area_present,
                    "languages": req.body.languages,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "interviews": req.body.interviews,
                    "phone_1": req.body.phone_1,
                    "phone_2": req.body.phone_2,
                    "email": req.body.email,
                    "preferred_channel": req.body.preferred_channel,
                    "icrc": req.body.icrc,
                    "family_associations": req.body.family_associations,
                    "contacted_act": req.body.contacted_act,
                    "notes": req.body.notes,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : errors
                });

             } else {
                 
                var relEvents = req.body.related_events;
                var relSites = req.body.related_sites;
                var relLocations = req.body.related_locations;
                var relMPs = req.body.related_mps; 
                var ints = req.body.interviews;  
                 
                if (typeof relEvents == "string") relEvents = [relEvents]
                if (typeof relSites == "string") relSites = [relSites]
                if (typeof relLocations == "string") relLocations = [relLocations]
                if (typeof relMPs == "string") relMPs = [relMPs] 
                if (typeof ints == "string") ints = [ints]  
                if (!ints) ints = []
                if (!relEvents)relEvents = []
                if (!relSites)relSites = []
                if (!relLocations)relLocations = []
                if (!relMPs)relMPs = []
                 
                /*if its an edit*/   
                if (req.body._id){ 
                    var updateVal = {};                                                     
                    if (profile[0].confidential!= req.body.confidential) updateVal['confidential'] =  req.body.confidential
                    if (profile[0].name.ar.first!= req.body.name_ar_first) updateVal['name.ar.first'] =  req.body.name_ar_first
                    if (profile[0].name.ar.last!= req.body.name_ar_last) updateVal['name.ar.last'] =  req.body.name_ar_last
                    if (profile[0].name.en.first!= req.body.name_en_first) updateVal['name.en.first'] =  req.body.name_en_first
                    if (profile[0].name.en.last!= req.body.name_en_last) updateVal['name.en.last'] =  req.body.name_en_last
                    if (profile[0].alias!= req.body.alias) updateVal['alias'] =  req.body.alias
                    if (profile[0].fathers_name!= req.body.fathers_name) updateVal['fathers_name'] =  req.body.fathers_name
                    if (profile[0].mothers_name!= req.body.mothers_name) updateVal['mothers_name'] =  req.body.mothers_name
                    if (profile[0].sex!= req.body.sex) updateVal['sex'] =  req.body.sex
                    if (profile[0].birth.place!= req.body.birth_place) updateVal['birth.place'] =  req.body.birth_place
                    if (profile[0].birth.date!= dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year)) updateVal['birth.date'] =  dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year)
                    if (profile[0].residence!= req.body.residence) updateVal['residence'] =  req.body.residence
                    if (profile[0].nationality!= req.body.nationality) updateVal['nationality'] =  req.body.nationality
                    if (profile[0].profession!= req.body.profession) updateVal['profession'] =  req.body.profession
                    if (profile[0].status_war!= req.body.status_war) updateVal['status_war'] =  req.body.status_war
                    if (profile[0].relationship_missing!= req.body.relationship_missing) updateVal['relationship_missing'] =  req.body.relationship_missing
                    if (profile[0].political_affiliation!= req.body.political_affiliation) updateVal['political_affiliation'] =  req.body.political_affiliation
                    if (profile[0].area_present!= req.body.area_present) updateVal['area_present'] =  req.body.area_present
                    if (profile[0].languages!= req.body.languages) updateVal['languages'] =  req.body.languages
                    if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                    if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                    if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                    if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                    if (profile[0].interviews!= req.body.interviews) updateVal['interviews'] =  ints
                    if (profile[0].phone_1!= req.body.phone_1) updateVal['phone_1'] =  req.body.phone_1
                    if (profile[0].phone_2!= req.body.phone_2) updateVal['phone_2'] =  req.body.phone_2
                    if (profile[0].email!= req.body.email) updateVal['email'] =  req.body.email
                    if (profile[0].preferred_channel!= req.body.preferred_channel) updateVal['preferred_channel'] =  req.body.preferred_channel
                    if (profile[0].icrc!= req.body.icrc) updateVal['icrc'] =  req.body.icrc
                    if (profile[0].family_associations!= req.body.family_associations) updateVal['family_associations'] =  req.body.family_associations
                    if (profile[0].contacted_act!= req.body.contacted_act) updateVal['contacted_act'] =  req.body.contacted_act
                    if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                    
                    collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                        if (err){
                            console.log ("error :"+err);
                            res.render('newcontact', {
                                "errormessage" : err, 
                                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                            });
                        }else {
                            if (profile[0].related.events!= relEvents) {
                                relEvents.forEach( function (e){
                                    if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "contacts");
                                });
                                (profile[0].related.events).forEach( function (e){
                                    if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "contacts");
                                });
                            }
                            if (profile[0].related.sites!= relSites) {
                                relSites.forEach( function (e){
                                    if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "contacts");
                                });
                                (profile[0].related.sites).forEach( function (e){
                                    if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "contacts");
                                });
                            }
                            if (profile[0].related.locations != relLocations) {
                                relLocations.forEach( function (e){
                                    if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "contacts");
                                });
                                (profile[0].related.locations).forEach( function (e){
                                    if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "contacts");
                                });
                            }
                            if (profile[0].related.mps != relMPs) {
                                relMPs.forEach( function (e){
                                    if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "contacts");
                                });
                                (profile[0].related.mps).forEach( function (e){
                                    if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "contacts");
                                });
                            }    
                            profile = null;
                            res.redirect('/contacts');
                        }
                    });
                    
                }else {
                    /*if its an insert*/    
                    var contactnew = {
                                "code" : req.body.code,
                                "confidential": req.body.confidential,
                                "category": req.body.category,
                                "name" : {
                                    "ar" : {
                                        "first" : req.body.name_ar_first,
                                        "last" : req.body.name_ar_last
                                    },
                                    "en" : {
                                        "first" : req.body.name_en_first,
                                        "last" : req.body.name_en_last
                                    }
                                },
                                "alias" : req.body.alias,
                                "fathers_name" : req.body.fathers_name,
                                "mothers_name" : req.body.mothers_name,
                                "sex" : req.body.sex,
                                "birth" : {
                                    "place" : req.body.birth_place,
                                    "date" : dateConverter(req.body.birth_date_day,req.body.birth_date_month, req.body.birth_date_year)
                                },
                                "residence" : req.body.residence,
                                "nationality" : req.body.nationality,
                                "profession" : req.body.profession,
                                "status_war": req.body.status_war,
                                "relationship_missing" : req.body.relationship_missing,
                                "political_affiliation": req.body.political_affiliation,
                                "area_present" : req.body.area_present,
                                "languages": req.body.languages,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "interviews" : ints,
                                "files" : [],
                                "phone_1" : req.body.phone_1,
                                "phone_2" : req.body.phone_2,
                                "email" : req.body.email,
                                "preferred_channel": req.body.preferred_channel,
                                "icrc" : req.body.icrc,
                                "family_associations" : req.body.family_associations,
                                "contacted_act" : req.body.contacted_act,
                                "notes" : req.body.notes
                             };
                    collection.insert([contactnew], function(err, result){
                        if (err){
                            res.render('newcontact', {
                                "errormessage" : err
                            });
                        }else {
                            if (relEvents) {
                                relEvents.forEach( function (e){
                                    updateRelated("events", e, req.body.code, "contacts");
                                });
                            }
                            if (relSites) {
                                relSites.forEach( function (e){
                                    updateRelated("sites", e, req.body.code, "contacts");
                                });
                            }
                            if (relLocations) {
                                relLocations.forEach( function (e){
                                    updateRelated("locations", e, req.body.code, "contacts");
                                });
                            }
                            if (relMPs) {
                                relMPs.forEach( function (e){
                                    updateRelated("missing", e, req.body.code, "contacts");
                                });
                            }
                            res.redirect('/contacts');
                        }
                    });  
                }
            }
          
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Interview*/
router.post('/addinterview', function(req, res){
        
            //if there are files, first perform upload            
            upload(req,res,function(err) {
                if(err) {
                    console.log(err);
                    return res.end("Error uploading file.");
                } else {
                    //rename file to add code
                    renameFile(req.files, relPath, req.body.code, function(err){
                       if(err){
                        console.log(err);
                        return res.end("Error renaming file.");
                       }else {
                        //then insert in database
                        if (db) {
                            var relEvents = req.body.related_events;
                            var relSites = req.body.related_sites;
                            var relLocations = req.body.related_locations;
                            var relMPs = req.body.related_mps;
                            var contactCode = req.body.interviewee;
                             

                            if (typeof relEvents == "string") relEvents = [relEvents]
                            if (typeof relSites == "string") relSites = [relSites]
                            if (typeof relLocations == "string") relLocations = [relLocations]
                            if (typeof relMPs == "string") relMPs = [relMPs]
                            if (!relEvents) relEvents = [];
                            if (!relSites) relSites = [];
                            if (!relLocations) relLocations = [];
                            if (!relMPs) relMPs = [];
                            if (contactCode) contactCode = (contactCode.split("-")[0]).trim();

                            //if there are files, create a record in the files collection
                            
                            
                            createFileRecord (req, contactCode, relEvents, relSites, relLocations, relMPs, function(){
                                //then for the interviews record
                                var collection = db.collection('interviews');
                            
                                //Validate Fields
                                req.check('code', 'Code cannot be empty').notEmpty();
                                req.check('date_day', 'Day cannot be empty').notEmpty();
                                req.check('date_month', 'Month cannot be empty').notEmpty();
                                req.check('date_year', 'Year cannot be empty').notEmpty();
    
                                var errors = req.validationErrors();
                                if (errors) {
                                    res.render('newinterview', {
                                        "_id":req.body._id,
                                        "code":req.body.code,
                                        "type": req.body.type,
                                        "subject": req.body.subject,
                                        "interviewee" : req.body.interviewee,
                                        "interviewer" : req.body.interviewer,
                                        "organization" : req.body.organization,
                                        "date_day" : req.body.date_day,
                                        "date_month": req.body.date_month, 
                                        "date_year": req.body.date_year,
                                        "place" : req.body.place,
                                        "language" : req.body.language,
                                        "duration" : req.body.duration,
                                        "files": req.body.files,
                                        "transcript" : req.body.transcript,
                                        "notes": req.body.notes,
                                        "related_events" : req.body.related_events,
                                        "related_sites" : req.body.related_sites,
                                        "related_locations" : req.body.related_locations,
                                        "related_mps" : req.body.related_mps,
    
                                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, interviewslist: interviewsList,
    
                                        "validationErrors" : errors
                                    });
    
                                    } else {
    
                                    /*if its an edit*/   
                                    if (req.body._id){ 
                                        var updateVal = {};                                                     
                                        if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type
                                        if (profile[0].subject!= req.body.subject) updateVal['subject'] =  req.body.subject
                                        if (profile[0].interviewee!= req.body.interviewee) updateVal['interviewee'] =  req.body.interviewee
                                        if (profile[0].interviewer!= req.body.interviewer) updateVal['interviewer'] =  req.body.interviewer
                                        if (profile[0].organization!= req.body.organization) updateVal['organization'] =  req.body.organization
                                        if (profile[0].date!= dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)) updateVal['date'] =  dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)
                                        if (profile[0].place!= req.body.place) updateVal['place'] =  req.body.place
                                        if (profile[0].language!= req.body.language) updateVal['language'] =  req.body.language
                                        if (profile[0].duration!= req.body.duration) updateVal['duration'] =  req.body.duration
                                        //console.log("new files edit "+newFiles);
                                        console.log("filesArray "+filesArray);
                                        if (filesArray.length>0) {
                                            var oldFiles = profile[0].files;
                                            if (!oldFiles) oldFiles = [];
                                            filesArray.forEach(function(f) {
                                                oldFiles.push(f)
                                            });
                                            updateVal['files'] =  oldFiles    
                                        } 
                                        if (profile[0].transcript!= req.body.transcript) updateVal['transcript'] =  req.body.transcript
                                        if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                                        if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                                        if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                                        if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                                        if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
    
                                        collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                                            if (err){
                                                console.log ("error :"+err);
                                                res.render('newinterview', {
                                                    "errormessage" : err, 
                                                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                                                });
                                            }else {
                                                if (profile[0].related.events!= relEvents) {
                                                    relEvents.forEach( function (e){
                                                        if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "interviews");
                                                    });
                                                    (profile[0].related.events).forEach( function (e){
                                                        if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (profile[0].related.sites!= relSites) {
                                                    relSites.forEach( function (e){
                                                        if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "interviews");
                                                    });
                                                    (profile[0].related.sites).forEach( function (e){
                                                        if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (profile[0].related.locations != relLocations) {
                                                    relLocations.forEach( function (e){
                                                        if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "interviews");
                                                    });
                                                    (profile[0].related.locations).forEach( function (e){
                                                        if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (profile[0].related.mps != relMPs) {
                                                    relMPs.forEach( function (e){
                                                        if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "interviews");
                                                    });
                                                    (profile[0].related.mps).forEach( function (e){
                                                        if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (profile[0].interviewee!= req.body.interviewee){
                                                    if (req.body.interviewee){
                                                    //var newContactCode = ((req.body.interviewee).split("-"))[0];
                                                    updateRelated("contacts", contactCode,req.body.code, "interviews");    
                                                    }  
                                                    if (profile[0].interviewee){
                                                    var oldContactCode = ((profile[0].interviewee).split("-"))[0];
                                                    removeRelated("contacts", oldContactCode,req.body.code, "interviews");
                                                    }  
                                                }
                                                profile = null;
                                                filesArray = [];
                                                res.redirect('/interviews');
                                            }
                                        });
    
                                    }else {  
                                        /*if its an insert*/
                                        var interviewnew = {
                                                    "code" : req.body.code,
                                                    "type": req.body.type,
                                                    "subject": req.body.subject,
                                                    "interviewee" : req.body.interviewee,
                                                    "interviewer" : req.body.interviewer,
                                                    "organization" : req.body.organization,
                                                    "date" : dateConverter(req.body.date_day,req.body.date_month, req.body.date_year),
                                                    "place" : req.body.place,
                                                    "language" : req.body.language,
                                                    "duration" : req.body.duration,
                                                    "consent_form" : req.body.consent_form,
                                                    "files": filesArray,
                                                    "transcript" : req.body.transcript,
                                                    "notes": req.body.notes,
                                                    "related" : {
                                                        "events" : relEvents,
                                                        "sites" : relSites,
                                                        "locations" :relLocations,
                                                        "mps" : relMPs
                                                    }
                                                    };
                                        collection.insert([interviewnew], function(err, result){
                                            if (err){
                                                res.render('newinterview', {
                                                    "errormessage" : err
                                                });
                                            }else {
                                                if (relEvents) {
                                                    relEvents.forEach( function (e){
                                                        updateRelated("events", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (relSites) {
                                                    relSites.forEach( function (e){
                                                        updateRelated("sites", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (relLocations) {
                                                    relLocations.forEach( function (e){
                                                        updateRelated("locations", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (relMPs) {
                                                    relMPs.forEach( function (e){
                                                        updateRelated("missing", e, req.body.code, "interviews");
                                                    });
                                                }
                                                if (req.body.interviewee){
                                                    updateRelated("contacts", contactCode,req.body.code, "interviews");
                                                }
                                                filesArray = [];
                                                res.redirect('/interviews');
                                            }
                                        });      
                                    }
                                }                    
                            });        
                            


                        } else { 
                        res.render('index', { title: 'Login to Database'});
                        }    
                       }
                        

                    });    
                     
                }
            });   
});

/*INSERT or UPDATE File*/
router.post('/addfile', function(req, res){            
        upload(req,res,function(err) {
            if(err) {
                console.log(err);
                return res.end("Error uploading file.");
            } else {
                //rename file to add code
                renameFile(req.files, relPath, req.body.code, function(){
                    //then insert in database
                    if (db) {
                        var collection = db.collection('files');

                        //Validate Fields
                        req.check('code', 'Code cannot be empty').notEmpty();
                        // req.check('file', 'File must be selected').notEmpty();
                        // req.checkBody('files', 'File must be selected').notEmpty();

                        var errors = req.validationErrors();
                        if (errors) {
                            res.render('newfile', {
                                "_id":req.body._id,
                                "code":req.body.code,
                                "type": req.body.type,
                                "description": req.body.description,
                                "file": req.files,
                                "date_day" : req.body.date_day,
                                "date_month": req.body.date_month, 
                                "date_year": req.body.date_year,
                                "format" : req.body.format,
                                "language" : req.body.language,
                                "notes": req.body.notes,
                                "contacts": req.body.contacts,
                                "interviews": req.body.interviews,
                                "related_events" : req.body.related_events,
                                "related_sites" : req.body.related_sites,
                                "related_locations" : req.body.related_locations,
                                "related_mps" : req.body.related_mps,

                                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                                "validationErrors" : errors
                            });

                         } else {

                            var relEvents = req.body.related_events;
                            var relSites = req.body.related_sites;
                            var relLocations = req.body.related_locations;
                            var relMPs = req.body.related_mps;
                            var contacts = req.body.contacts;
                            var interviews = req.body.interviews; 

                            if (typeof relEvents == "string") relEvents = [relEvents]
                            if (typeof relSites == "string") relSites = [relSites]
                            if (typeof relLocations == "string") relLocations = [relLocations]
                            if (typeof relMPs == "string") relMPs = [relMPs]
                            if (typeof contacts == "string") contacts = [contacts]
                            if (typeof interviews == "string") interviews = [interviews]
                            if (!relEvents) relEvents = [];
                            if (!relSites) relSites = [];
                            if (!relLocations) relLocations = [];
                            if (!relMPs) relMPs = [];
                            if (!contacts) contacts = [];
                            if (!interviews) interviews = [];

                            /*if its an edit*/   
                            if (req.body._id){ 
                                var updateVal = {};                                                     
                                if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type
                                if (profile[0].description!= req.body.description) updateVal['description'] =  req.body.description
                                if (profile[0].date!= dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)) updateVal['date'] =  dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)
                                if (profile[0].format!= req.body.format) updateVal['format'] =  req.body.format
                                if (profile[0].language!= req.body.language) updateVal['language'] =  req.body.language
                                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                                if (profile[0].contacts!= contacts)updateVal['contacts'] = contacts
                                if (profile[0].interviews!= interviews)updateVal['interviews'] = interviews
                                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs

                                collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                                    if (err){
                                        console.log ("error :"+err);
                                        res.render('newfile', {
                                            "errormessage" : err, 
                                            parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                                        });
                                    }else {
                                        if (profile[0].related.events!= relEvents) {
                                            relEvents.forEach( function (e){
                                                if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "files");
                                            });
                                            (profile[0].related.events).forEach( function (e){
                                                if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "files");
                                            });
                                        }
                                        if (profile[0].related.sites!= relSites) {
                                            relSites.forEach( function (e){
                                                if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "files");
                                            });
                                            (profile[0].related.sites).forEach( function (e){
                                                if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "files");
                                            });
                                        }
                                        if (profile[0].related.locations != relLocations) {
                                            relLocations.forEach( function (e){
                                                if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "files");
                                            });
                                            (profile[0].related.locations).forEach( function (e){
                                                if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "files");
                                            });
                                        }
                                        if (profile[0].related.mps != relMPs) {
                                            relMPs.forEach( function (e){
                                                if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "files");
                                            });
                                            (profile[0].related.mps).forEach( function (e){
                                                if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "files");
                                            });
                                        }
                                        if (profile[0].contacts != contacts) {
                                            contacts.forEach( function (e){
                                                if((profile[0].contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "files");
                                            });
                                            (profile[0].contacts).forEach( function (e){
                                                if((contacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "files");
                                            });
                                        }
                                        if (profile[0].interviews != interviews) {
                                            interviews.forEach( function (e){
                                                if((profile[0].interviews).indexOf(e)== -1)updateRelated("interviews", e, req.body.code, "files");
                                            });
                                            (profile[0].interviews).forEach( function (e){
                                                if((interviews).indexOf(e)== -1)removeRelated("interviews", e, req.body.code, "files");
                                            });
                                        }
                                        profile = null;
                                        filesArray = [];
                                        res.redirect('/files');
                                    }
                                });

                            }else {
                                /*if its an insert*/
                                var filenew = {
                                            "code" : req.body.code,
                                            "type": req.body.type,
                                            "description": req.body.description,
                                            "file" : filesArray[0],
                                            "date" : dateConverter(req.body.date_day,req.body.date_month, req.body.date_year),
                                            "format" : req.body.format,
                                            "language" : req.body.language,
                                            "notes": req.body.notes,
                                            "contacts": contacts,
                                            "interviews": interviews,
                                            "related" : {
                                                "events" : relEvents,
                                                "sites" : relSites,
                                                "locations" :relLocations,
                                                "mps" : relMPs
                                            }
                                         };
                                collection.insert([filenew], function(err, result){
                                    if (err){
                                        res.render('newfile', {
                                            "errormessage" : err
                                        });
                                    }else {
                                        if (relEvents) {
                                            relEvents.forEach( function (e){
                                                updateRelated("events", e, req.body.code, "files");
                                            });
                                        }
                                        if (relSites) {
                                            relSites.forEach( function (e){
                                                updateRelated("sites", e, req.body.code, "files");
                                            });
                                        }
                                        if (relLocations) {
                                            relLocations.forEach( function (e){
                                                updateRelated("locations", e, req.body.code, "files");
                                            });
                                        }
                                        if (relMPs) {
                                            relMPs.forEach( function (e){
                                                updateRelated("missing", e, req.body.code, "files");
                                            });
                                        }
                                        if (contacts){
                                            contacts.forEach(function (e){
                                                updateRelated("contacts", e, req.body.code, "files");
                                            });
                                            
                                        }

                                        if (interviews){
                                            interviews.forEach(function (e){
                                                updateRelated("interviews", e, req.body.code, "files");
                                            });
                                            
                                        }
                                        filesArray = [];
                                        res.redirect('/files');
                                    }
                                });      
                            }
                        }


                    } else { 
                    res.render('index', { title: 'Login to Database'});
                    }

                });    
                 
            }
        });   
});

/*Search*/
router.post('/search', function(req, res){
    var collectionName = req.body.collection;
    var criteria = req.body.criteria;
    var searchText = req.body.search_text;
    
    if (db) {
        var collection = db.collection(collectionName);
        var query = {};
        if (criteria == "keyword"){
            query = { $text: { $search: searchText }}
        } else {
            query[criteria] = searchText;
        }
        
        collection.find(query).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else if (result.length){
                        res.render('searchresult', {
                        "searchResult" : result,
                        "collection" : collectionName    
                        }); 
                }else{
                        res.render('home', {
                        "collections" : collectionsList,
                        "empty" : 'yes',
                        }); 
                }
            }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
});

/*Missing - Advanced Search*/
router.post('/searchmissing', function(req, res){
    
    if (db) {
        var collection = db.collection('missing');
        var query = {};
        
        var fromDay = req.body.from_disappearance_date_day;
        var fromMonth = req.body.from_disappearance_date_month;
        var fromYear = req.body.from_disappearance_date_year;
        var toDay = req.body.to_disappearance_date_day;
        var toMonth = req.body.to_disappearance_date_month;
        var toYear = req.body.to_disappearance_date_year;
        
        //search by date of disappearance
        if (fromYear) query["disappearance.date"] = {"$gte": new Date(fromYear+"-"+fromMonth+"-"+fromDay+"T00:00:00.000Z"), "$lte": new Date(toYear+"-"+toMonth+"-"+toDay+"T00:00:00.000Z")}
        //if (fromYear) query["disappearance.date"] = {"$gte": moment(fromYear+"-"+fromMonth+"-"+fromDay), "$lte": moment(toYear+"-"+toMonth+"-"+toDay)}
        //search by district
        if (req.body.disappearance_place_district) query['disappearance.place.district'] = req.body.disappearance_place_district
        //search by governorate
        if (req.body.disappearance_place_governorate) query['disappearance.place.governorate'] = req.body.disappearance_place_governorate
        //search by distance to coordinate
        if (req.body.meters && req.body.latitude && req.body.longitude) query['location.coordinates'] = {$near: {$geometry: {type: 'Point', coordinates : [parseFloat(req.body.longitude) , parseFloat(req.body.latitude)]}, $maxDistance: parseFloat(req.body.meters)}}
        //search by sex
        if (req.body.sex) query['sex'] = req.body.sex
        //search by keyword
        if (req.body.keyword) query['$text'] = { $search: req.body.keyword}
        //search by age
        if (req.body.age_from && req.body.age_to) query['age'] = {$gte: req.body.age_from, $lt:req.body.age_to}
        //search by last seen
        if (req.body.last_seen_reported) query['last_seen.reported'] = req.body.last_seen_reported
        //search by perpetrator
        if (req.body.perpetrators) query['perpetrators'] = req.body.perpetrators
        //search by fate
        if (req.body.fate) query['fate'] = req.body.fate
        //search by related event
        if (req.body.related_event) query['related.events'] = req.body.related_event
        //search by related location
        if (req.body.related_location) query['related.locations'] = req.body.related_location
        //search by related site
        if (req.body.related_site) query['related.sites'] = req.body.related_site
        //search by published
        if (req.body.fushatamal_published) query['fushatamal.published'] = req.body.fushatamal_published
        
        
        collection.find(query).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else{
                        missingResult = result;
                        res.render('missinglist', {
                        "collList" : result,
                        parties : partiesList,
                        title: "List of Missing People",
                        nextrecord : nextrecord,
                        "user": user,
                        parties : partiesList,
                        locations: locationsList, 
                        events: eventsList, 
                        sites: sitesList    
                        }); 
                }
            }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
});

/*Site - Advanced Search*/
router.post('/searchsites', function(req, res){
    
    if (db) {
        var collection = db.collection('sites');
        var query = {};
        
        //search by district
        if (req.body.location_district) query['location.district'] = req.body.location_district
        //search by governorate
        if (req.body.location_governorate) query['location.governorate'] = req.body.location_governorate
        //search by distance to coordinate
        if (req.body.meters && req.body.latitude && req.body.longitude) query['location.coordinates'] = {$near: {$geometry: {type: 'Point', coordinates : [parseFloat(req.body.longitude) , parseFloat(req.body.latitude)]}, $maxDistance: parseFloat(req.body.meters)}}
        //search by type
        if (req.body.type) query['type'] = req.body.type
        //search by Risk of Destruction
        if (req.body.risk_index) query['risk.index'] = req.body.risk_index
        //search by Sensitivity
        if (req.body.sensitivity_index) query['sensitivity.index'] = req.body.sensitivity_index
        //Search by credibility
        if (req.body.credibility_index) query['credibility.index'] = req.body.credibility_index
        //search by exhumation
        if (req.body.exhumed_status) query['exhumed.status'] = req.body.exhumed_status
        //search by keyword
        if (req.body.keyword) query['$text'] = { $search: req.body.keyword}
        //search by perpetrator
        if (req.body.perpetrators) query['perpetrators'] = req.body.perpetrators
        //search by related event
        if (req.body.related_event) query['related.events'] = req.body.related_event
        //search by related location
        if (req.body.related_location) query['related.locations'] = req.body.related_location
        //search by related mps
        if (req.body.related_mps) query['related.mps'] = req.body.related_mps
        
        
        collection.find(query).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else{
                        sitesResult = result;
                        res.render('siteslist', {
                        "collList" : result,
                        parties : partiesList,
                        title: "List of Sites",
                        nextrecord : nextrecord,
                        "user": user,
                        parties : partiesList,
                        locations: locationsList, 
                        events: eventsList, 
                        sites: sitesList    
                        }); 
                }
            }); 
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
});

/*Export to excel*/
router.post('/export', function(req, res){

    var wb = new xl.Workbook();
    // Add Worksheets to the workbook 
    var ws = wb.addWorksheet('DB Export');
    // Create a reusable style 
    var style = wb.createStyle({
        font: {
            size: 10
        },
        alignment: {
            wrapText: true
	    },
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    });

    var column;
    var substringDate = "date";
    
    //loop the resultArray
    Object.keys(missingResult).forEach(function(record) {
        var recordObject = missingResult[record];
        column = 1;
        line = parseInt(record) +2;
        ws.cell(line,1).string(recordObject.code).style(style);
        //we loop the keys of each record
        Object.keys(recordObject).forEach(function(key) {
            var keyValue = recordObject[key];
            column = column + 1;
            if (key== "_id"){ //ignore
            }else if (keyValue == "[object Object]"){
                ws.cell(1,column).string(key).style(style);
                //console.log(JSON.stringify(keyValue));
                ws.cell(line,column).string(JSON.stringify(keyValue)).style(style);
               //if the value had nested / child values ([object Object]) we loop it
//                Object.keys(keyValue).forEach(function(child) {
//                    var childValue = keyValue[child];
//                    //if it doesn't have nested values we print it
//                    if (childValue != "[object Object]" && child!="place"){
//                        if (child == "id" || child == "_bsontype") { //ignore
//                        }else{
//                            //if its a date we format it
//                           if (child.lastIndexOf(substringDate)!= -1){  
//                            childValue = moment(childValue).format('MMMM Do YYYY');
//                            childValue.toDateString;
//                            }
//                            //if its null we convert it to empty string
//                            if (childValue==null)childValue = ""
////                            console.log("record: "+record+" column: "+column)
//                            ws.cell(line,column).string(childValue); 
////                            console.log("childValue: "+childValue)
//                        }
//                        
//                    }else {
//                        //if it has nested values we loop it
//                        Object.keys(childValue).forEach(function(subchild) {
//                        var subchildValue = childValue[subchild];
//                        //if it doesnt have nested values we print it    
//                        if (subchildValue != "[object Object]"){  
//                            console.log("subchildValue: "+subchildValue)
//                            console.log("record2: "+record+" column2: "+column)
//                            //ws.cell(record,column).string(subchildValue); 
//                        } else{
//                            console.log("todavia aca: "+subchild)
//                            //ws.cell(record,column).string(subchildValue); 
//                        }
//                        })   
//                    }     
//                })  
                
                
                
            }else {
                //print the key name on the first row
                ws.cell(1,column).string(key).style(style);
                //print the value of the key for each record
                ws.cell(line,column).string(keyValue).style(style);
                
            }
        })    
    
    });

    var date = moment().format('DD-MM-YYYY-hhmmss');
    
    wb.write(date+'.xlsx', function (err, stats) {
        if (err) {
            console.error(err);
            /*res.render('missinglist', {
                            "collList" : missingList,
                            parties : partiesList,
                            title: "List of Missing People",
                            nextrecord : nextrecord,
                            "user": user,
                            parties : partiesList,
                            locations: locationsList, 
                            events: eventsList, 
                            sites: sitesList,
                            export: "Export could not be completed"
                            }); */
            //popupS.alert({
              //  content: 'Error'
            //});
        } else {
            //console.log("stats: "+JSON.stringify(stats))
            res.render('missinglist', {
                            "collList" : missingResult,
                            parties : partiesList,
                            title: "List of Missing People",
                            nextrecord : nextrecord,
                            "user": user,
                            parties : partiesList,
                            locations: locationsList, 
                            events: eventsList, 
                            sites: sitesList,
                            export: "Export completed succesfully"
                            }); 
            //popupS.alert({
              //  content: 'Yes'
            //});
        } 

    
    });
});


router.post('/uploadPicture',function(req,res){
    
    // define the route and file name
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
     req.files.forEach( function(f) {
        console.log(f);
     });  
    cb(null, file.fieldname + '.jpeg')
    }
    })
    
    
    var upload = multer({ storage : storage}).any();

    upload(req,res,function(err) {
        if(err) {
            console.log(err);
            return res.end("Error uploading file.");
        } else {
            req.files.forEach( function(f) {
             //rename file to add code
             fs.rename(__dirname + '/../public/images/profilePic.jpeg', __dirname + '/../public/images/profilePic-'+req.body.code+'.jpeg', function(err) {
                 if ( err ) {
                    console.log('ERROR: ' + err); 
                 }
                 else {
                    //update database
                    var collection = db.collection('missing');

                    collection.update({code: req.body.code}, {$set: {picture: 'profilePic-'+req.body.code+'.jpeg'}}, function(err, result){    
                        if (err){
                            console.log ("error :"+err);
                        }else {
                                res.render('missinglist', {
                                "collList" : missingResult,
                                parties : partiesList,
                                title: "List of Missing People",
                                nextrecord : nextrecord,
                                "user": user   
                                });
                        }
                    }); 
                 }
             });     
            }); 
        }
    });
});

router.post('/removeFile', function(req,res){
    var file = req.body.file;
    var type = req.body.type;
    var path = __dirname +"/../public/files/"+file;
    
    //delete file from file system
    fs.unlink(path, function(err) {
        if ( err ) {
           console.log('ERROR: ' + err); 
        }
        else {
           //update database
           var collection = db.collection(type);

           collection.deleteOne({code: req.body.code}, function(err, result){
               if (err){
                  console.log ("error :"+err);
               }else {
                   if((req.body.related_events).length){
                       var relEvents = (req.body.related_events).slice(1,-1);
                       relEvents.split(",").forEach(function (e){
                           removeRelated("events", e.slice(1,-1), req.body.code, "files");
                       })     
                   }
                   if((req.body.related_sites).length){
                       var relSites = (req.body.related_sites).slice(1,-1);
                       relSites.split(",").forEach(function (e){
                        removeRelated("sites", e.slice(1,-1), req.body.code, "files");
                       })     
                   }
                   if((req.body.related_locations).length){
                    var relLocations = (req.body.related_locations).slice(1,-1);
                    relLocations.split(",").forEach(function (e){
                     removeRelated("locations", e.slice(1,-1), req.body.code, "files");
                    })     
                   }
                   if((req.body.related_mps).length){
                    var relMps = (req.body.related_mps).slice(1,-1);
                    relMps.split(",").forEach(function (e){
                     removeRelated("missing", e.slice(1,-1), req.body.code, "files");
                    })     
                   }
                   if((req.body.related_interviews).length){
                    var relInts = (req.body.related_interviews).slice(1,-1);
                    relInts.split(",").forEach(function (e){
                     removeRelated("interviews", e.slice(1,-1), req.body.file, "files");
                    })     
                   }
                   if((req.body.related_contacts).length){
                    var relContacts = (req.body.related_contacts).slice(1,-1);
                    relContacts.split(",").forEach(function (e){
                     removeRelated("contacts", e.slice(1,-1), req.body.code, "files");
                    })     
                   }  
                   res.redirect('/'+type);   
               }
           });    
        }

    });

    
});

router.post('/logout', function(req, res){
    db.close(function(){
        //res.redirect('/');
        res.render('index', { title: 'Login to Database'});
    });
    
    
});


module.exports = router;