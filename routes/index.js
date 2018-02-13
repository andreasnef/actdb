var express = require('express');
var app = express();
var router = express.Router();
var mongodb = require('mongodb');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var validator = require('express-validator');
var async = require('async');
var multer  = require('multer');
var fs = require("fs");
var cloudinary = require('cloudinary');
cloudinary.config({ 
    cloud_name: 'hxxbdvyzc', 
    api_key: '971837284457376', 
    api_secret: 'q__oUqJiwGAcJhDoYl3zaQjEPx4'
});
var municipalities = require("../public/javascripts/lebanonAdministrative.js");
//var functions = require("./functions.js")();
 
var db;
var dbclient;
var collectionsList;
var partiesList;
var locationsList;
var eventsList;
var sitesList;
var missingList;
var contactsList;
var sourcesList;

var relPath = __dirname +"/../public/files/";
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, relPath)      //you tell where to upload the files,
    }
})

var upload = multer({ storage : storage}).any();


/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session && db) {
        res.redirect("missing");
    } else {
        res.render('index', { title: 'Login to Database'});   
    }
});

/*Log in*/
router.post('/login', function(req, res){
    
    var user = req.body.user;
    var pass = req.body.pass;
    var ip = req.connection.remoteAddress;
    var date = new Date().toISOString();
    var MongoClient = mongodb.MongoClient;
    //var url = 'mongodb://'+user+':'+pass+'@localhost:27017,localhost:27018,localhost:27019/Act?replicaSet=mongo-repl&authSource=admin';
    var url = 'mongodb://'+user+':'+pass+'@cluster0-shard-00-00-tey75.mongodb.net:27017,cluster0-shard-00-01-tey75.mongodb.net:27017,cluster0-shard-00-02-tey75.mongodb.net:27017/Act?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';

    //Validate Fields
    req.check('user', 'User cannot be empty').notEmpty();
    req.check('pass', 'Password cannot be empty').notEmpty();
    var errors = req.getValidationResult();
    errors.then(function (result) {
     if (!result.isEmpty()) {
            res.render('index', {
                "validationErrors" : result.mapped()
            });    

     } else {
        /*Connect to the BD*/
        MongoClient.connect(url, function(err,client){
            if (err){
            console.log("User:"+user+" Unable to connect to server", err);
            res.render('index', {
                "errormessage" : err
            });
        } else {
            //Store the connection globally
            db = client.db("Act");
            dbclient = client;
            //save user in session
            req.session.user = user;
            console.log("user:" + req.session.user);
            
            //open change stream and record any changes
            // const missingCollection = db.collection('missing');
            // var changeStream = missingCollection.watch();
            // changeStream.on("change", function(change) {
            //     var newChange = {user: user, date: date, collection: change.ns.coll, operation: change.operationType, fullDocument: change.fullDocument, updateDescription: change.updateDescription};
            //     db.collection('updates').insert([newChange],function(err,result){
            //         if (err){
            //             console.log(err)
            //          }
            //     });
            //     console.log(newChange);
            // });
            
            if(user != "public"){
               //save the login info in the db
                var collection = db.collection('logins');
                var newlongin = {user: req.body.user, ip: ip, date: date};

                collection.insert([newlongin], function(err, result){
                 if (err){
                    console.log(err)
                 }
                });     
            }
            res.redirect("missing"); 
         }   
        })   
    }
 });
});

/*retrieve list of parties*/
function getParties(callback){ 
    if (db) {
        var partiesColl = db.collection('parties');
        partiesColl.find({}).project({_id:0, 'name': 1, code: 1, control_areas:1, color:1}).sort({'name.en':1}).toArray(function(err, result){
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
function getLocations(user, callback){
    if (db) {
        if (user == "public"){
         var locationsColl = db.collection('locations_public');
         locationsColl.find({public: 'Yes'}).project({_id:0, code: 1, category: 1, 'name': 1, groups_responsible:1, 'location.district':1, 'location.governorate': 1, 'location.coordinates':1}).sort({'name.en': 1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    locationsList = result;
            }
            callback();
        });
        }else{
         var locationsColl = db.collection('locations');  
         locationsColl.find({}).project({_id:0, code: 1, category: 1, 'name': 1, groups_responsible:1, 'location.district':1, 'location.governorate': 1, 'location.coordinates':1}).sort({'name.en': 1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    locationsList = result;
            }
            callback();
        }); 
        }
     } else { 
        res.render('index', { title: 'Login to Database'});
    }       
};

 /*retrieve list of Events*/
function getEvents(user, callback){
    if (db) {
        if (user == "public"){
         var eventsColl = db.collection('events_public');
        }else{
         var eventsColl = db.collection('events');   
        } 
            eventsColl.find({}).project({_id:0,'name': 1, code: 1, type: 1, 'location.district':1, 'location.governorate': 1, 'dates.beg': 1, 'location.coordinates':1}).sort({'name.en':1}).toArray(function(err, result){
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
function getSites(user, callback){
    if (db) {
        if (user == "public"){
         var sitesColl = db.collection('sites_public');
        }else{
         var sitesColl = db.collection('sites');   
        } 
        sitesColl.find({}).project({_id:0,'name': 1, code: 1, 'location.district':1,'location.governorate':1, 'exhumed.status': 1, 'location.coordinates':1}).sort({'location.governorate':1, 'location.district':1, 'name.en': 1}).toArray(function(err, result){
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
function getMissing(session, callback){
    if (db) {
        if (session.user == "public"){
            var missingColl = db.collection('missing_public');
            missingColl.find({public: 'Yes'}).project({_id:0, 'name': 1, code: 1, 'disappearance.place': 1, 'disappearance.date': 1, 'location':1}).sort({'name.ar.last':1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        missingList = result;
                }
                callback();
            });
        } else {
            var missingColl = db.collection('missing');

            missingColl.find({}).project({_id: 0, name: 1, code: 1, "disappearance.place": 1, "disappearance.date": 1, location:1}).sort({"name.ar.last":1}).toArray(function(err, result){
                if (err){
                        res.send(err);
                } else {
                        missingList = result;
                        session.missingResult = result;
                }
                callback();
            });
        }
         
    } else { 
        res.render('index', { title: 'Login to Database'});
    }    
};

function getContacts(callback){ 
    if (db) {
        var contactsColl = db.collection('contacts');
        contactsColl.find({}).project({'name': 1, code: 1, confidential:1, category: 1}).sort({'name.en':1}).toArray(function(err, result){
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

function getSources(callback){ 
    if (db) {
        var filesColl = db.collection('sources');
        filesColl.find({}).project({code: 1, type:1, subtype:1, source_title:1, file: 1}).sort({'code':1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else {
                    sourcesList = result;
            }
            callback();
        });
     } else { 
        res.render('index', { title: 'Login to Database'});
    }         
};

function renameFile(files, relPath, code, callback){
    var newName;
    var filesArray = [];
    files.forEach( function(f) {
        newName = code+'-'+f.originalname
        filesArray.push(newName);
        fs.rename(relPath +f.filename, relPath +newName, function(err) {
            if ( err ) {
                console.log('ERROR: ' + err); 
            } 
        });    
    });
    return callback(filesArray);
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
        if(field == "mps" || field == "missing"){
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
        } else if(field == "sources"){
            collection.update({code: codeUpdate}, {$push: {'sources': codePush}}, function(err, result){
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
        if(field == "mps" || field == "missing"){
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

function uploadFile(req, res, callback){
    var filesList = [];
    var uploadError;
    upload(req,res,function(err) { 
        if(err) {
            console.log(err);
        } else {
            //rename file to add code
            renameFile(req.files, relPath, req.body.code, function(filesArray){
                filesList = filesArray;
                filesList.forEach( function(file) {
                    cloudinary.v2.uploader.upload(relPath+file, {public_id: file, type: "private"}, function(error,result) {
                        if(error){
                            uploadError = error;
                            console.log("Cloudinary upload error: "+JSON.stringify(uploadError));
                            //remove from list if there was an error
                        }
                        console.log(result);
                    });  
                });
            });    
            return callback(filesList, uploadError);    
        }
    });
};

/* GET list of missing */
router.get('/missing', function(req, res){
    if (req.session.user){
        async.parallel([
            getMissing.bind(null, req.session),
            getEvents.bind(null, req.session.user),
            getLocations.bind(null, req.session.user),
            getParties,
            getSites.bind(null, req.session.user),
            getSources
        ], function(err){
            if (err) {
                return console.error(err);
            } else if (missingList.length) {
                    nextrecord = calcLastRecord(missingList, "missing");
                    res.render('missinglist', {
                        "collList" : missingList,
                        title: "List of Missing People",
                        nextrecord : nextrecord,
                        "user": req.session.user,
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
    if (req.session.user){      
        getEvents(req.session.user,function(){
            if (eventsList.length) {
                nextrecord = calcLastRecord(eventsList, "events");
                res.render('eventslist', {
                    "collList" : eventsList,
                    nextrecord : nextrecord,
                    user: req.session.user
                });   

            } else {
                    res.send('No Events found');
            }
        });
    } else {
        res.render('index', { title: 'Login to Database'});
    }    
});

/* GET list of Locations */
router.get('/locations', function(req, res){
    if (req.session.user){
        getLocations(req.session.user, function(){
                if (locationsList.length) {
                    nextrecord = calcLastRecord(locationsList, "locations");
                    res.render('locationslist', {
                        "user": req.session.user,
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
    } else {
        res.render('index', { title: 'Login to Database'});
    }    
});

/* GET list of Sites */
router.get('/sites', function(req, res){
    if (req.session.user){
        getSites(req.session.user,function(){
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
                        "user": req.session.user
                    });   

                } else {
                        res.send('No Events found');
                }
            });
    } else {
        res.render('index', { title: 'Login to Database'});
    }         
});

/* GET list of Logins */
router.get('/logins', function(req, res){
    if (req.session.user && db){
        var loginsColl = db.collection('logins');

        loginsColl.find({}, {user:1, ip:1, date:1}).toArray(function(err, result){
            if (err){
                    res.send(err);
            } else if (result.length) {
                    res.render('loginslist', {
                        "collList" : result,
                        "user": req.session.user
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
    var missingLayer = [];
    var barracksLayer = [];
    var checkpointsLayer = [];
    var detentionCentresLayer = [];
    var sitesLayer = [];
    var eventsLayer = [];

    if (req.session.user){
        missingList.forEach(function (e){
            if(e.location.coordinates) missingLayer.push(e);
        });
        locationsList.forEach(function (e){
            if(e.location.coordinates){
                if (e.category == "Detention Centre") detentionCentresLayer.push(e);
                if (e.category == "CheckPoint") checkpointsLayer.push(e);
                if (e.category == "Barrack") barracksLayer.push(e);
            }
        });
        sitesList.forEach(function (e){
            if(e.location.coordinates) sitesLayer.push(e);
        });
        eventsList.forEach(function (e){
            if(e.location.coordinates) eventsLayer.push(e);
        });
        res.render('map', {
            "user": req.session.user,
            "missing": missingLayer,
            "checkpoints": checkpointsLayer,
            "barracks": barracksLayer,
            "centres": detentionCentresLayer,
            "sites": sitesLayer,
            "events": eventsLayer,
            "parties": partiesList
        });  
    } else {
        res.render('index', { title: 'Login to Database'});
    }  
});

/* GET list of Parties */
router.get('/parties', function(req, res){
    if (req.session.user){
        getParties(function(){
                if (partiesList.length) {
                    nextrecord = calcLastRecord(partiesList, "parties");
                    res.render('partieslist', {
                        "collList" : partiesList,
                        nextrecord : nextrecord,
                        "user": req.session.user
                    });   

                } else {
                        res.send('No Events found');
                }
            }); 
    } else {
        res.render('index', { title: 'Login to Database'});
    }          
});

/* GET list of Contacts */
router.get('/contacts', function(req, res){
    if (req.session.user){
        getContacts(function(){
                if (contactsList.length) {
                    nextrecord = calcLastRecord(contactsList, "contacts");
                    res.render('contactslist', {
                        "collList" : contactsList,
                        nextrecord : nextrecord,
                        "user": req.session.user
                    });   

                } else {
                        res.send('No Events found');
                }
            });       
    } else {
        res.render('index', { title: 'Login to Database'});
    }     
});

/* GET list of Files */
router.get('/sources', function(req, res){
    if (req.session.user){
        getSources(function(){
                if (sourcesList.length) {
                    nextrecord = calcLastRecord(sourcesList, "sources");
                    res.render('sourceslist', {
                        "collList" : sourcesList,
                        nextrecord : nextrecord,
                        "user": req.session.user
                    });   

                } else {
                    nextrecord = 1;
                    res.render('sourceslist', {
                        "collList" : sourcesList,
                        nextrecord : nextrecord,
                        "user": req.session.user
                    }); 
                }
            }); 
    } else {
        res.render('index', { title: 'Login to Database'});
    }           
});

/* GET profile*/
router.get('/profile', function(req, res){
    if (req.session.user && db) {
            var collName = req.query.type;
            if (req.session.user == "public") collName = collName+"_public"
            var collection = db.collection(collName);
            collection.find({code:req.query.code}).toArray(function(err, result){
            if (err){
                res.send(err);
            } else if (result.length) {
                req.session.profile = result;
                var urls = [];
                if(collName=="sources"){
                    //get private url from cloudinary (expires in an hour)
                    var files = result[0].files;
                    if(files && files.length){
                      files.forEach( function (file){
                        var fileSplit = JSON.stringify(file).split(".");
                        var extension = (fileSplit[fileSplit.length -1]).slice(0, -1);
                        var url = cloudinary.utils.private_download_url(file,extension);
                        urls.push(url);    
                      });  
                    } 
                }
                res.render(req.query.type+'profile', {    
                    "profile" : result,
                    "file_urls" : urls, 
                    "user" : req.session.user,
                    "locationsList" : locationsList,
                    "missingList" : missingList,
                    "sitesList" : sitesList,
                    "eventsList" : eventsList,
                    "contactsList" : contactsList,
                    "sourcesList" : sourcesList
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
    if (req.session.user){  
        async.parallel([
            getMissing.bind(null, req.session),
            getEvents.bind(null, req.session.user),
            getLocations.bind(null, req.session.user),
            getParties,
            getSites.bind(null, req.session.user),
            getContacts,
            getSources
        ], function(err){
            if (err) {
                return console.error(err);
            }
            var type = req.query.type;
            if (req.query.nextrecord){
                res.render('new'+type, { title: 'Add New '+type, user: req.session.user, nextrecord : req.query.nextrecord, parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList, municipalities : municipalities});
            } else {
                res.render('new'+type, { title: 'Edit '+type, user: req.session.user, editprofile : req.session.profile, parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList, municipalities : municipalities});
            }
        });
    } else {
        res.render('index', { title: 'Login to Database'});
    }
});

function dateConverter(day, month, year) {
                var date;
                if (year != ""){ 
                    if (day == ""){day = "01"};
                    if (month == "") {month = "01"};
                    date = new Date(Date.UTC(year, month-1, day));
                };
                return date;
};


/*INSERT or UPDATE Missing*/
router.post('/addmissing', function(req, res){
        if (db) {
            var collection = db.collection('missing');
            var profile = req.session.profile;
            
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

            var errors = req.getValidationResult();
            errors.then(function (result) {
                if (!result.isEmpty()) {
                 res.render('newmissing', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "public": req.body.public,
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
                    "perpetrators_name" : req.body.perpetrators_name,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "fate" : req.body.fate,
                    "notes" : req.body.notes,
                    "sources": req.body.sources,
                    "picture" : req.body.picture,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var sources = req.body.sources;
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
              if (typeof sources == "string") sources = [sources]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = [];
              if (!sources) sources = [];
              
              /*if its an edit*/   
              if (req.body._id){  
                var updateVal = {};                                                     
                if (profile[0].public!= req.body.public) updateVal['public'] =  req.body.public
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
                if (profile[0].disappearance.location.latitude!= req.body.disappearance_location_latitude || profile[0].disappearance.location.longitude!= req.body.disappearance_location_longitude) {
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
                if (profile[0].perpetrators_name!= req.body.perpetrators_name) updateVal['perpetrators_name'] =  req.body.perpetrators_name
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].fate!= req.body.fate) updateVal['fate'] =  req.body.fate
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].sources!= sources) updateVal['sources'] =  sources
                if (profile[0].picture!= req.body.picture) updateVal['picture'] =  req.body.picture
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts
                    
                collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
                
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
                    if (profile[0].sources != sources) {
                        sources.forEach( function (e){
                            if((profile[0].sources).indexOf(e)== -1)updateRelated("sources", e, req.body.code, "mps");
                        });
                        if(profile[0].sources){
                            (profile[0].sources).forEach( function (e){
                                if((sources).indexOf(e)== -1)removeRelated("sources", e, req.body.code, "mps");
                            });
                        }
                    }
                    if (profile[0].contacts != contacts) {
                        contacts.forEach( function (e){
                            if((profile[0].contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "mps");
                        });
                        if(profile[0].contacts){
                            (profile[0].contacts).forEach( function (e){
                                if((contacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "mps");
                            });      
                        }
                    }
                    profile = null;
                    res.redirect('/missing');
                }
               });
                
             /*if its an insert*/    
             } else{
                var missingnew = {
                                "code" : req.body.code,
                                "public": req.body.public,
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
                                "perpetrators_name" : req.body.perpetrators_name,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "fate" : req.body.fate,
                                "notes" : req.body.notes,
                                "picture" : req.body.picture,
                                "sources" : sources,
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
                    if (sources) {
                        sources.forEach( function (e){
                            updateRelated("sources", e, req.body.code, "mps");
                        });
                    }
                    if (contacts) {
                        contacts.forEach( function (e){
                            updateRelated("contacts", e, req.body.code, "mps");
                        });
                    }
                    
                    res.redirect('/missing');
                }
              });
                
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Event*/
router.post('/addevent', function(req, res){
        if (db) {
            var collection = db.collection('events');
            var profile = req.session.profile;
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('location_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.getValidationResult();
            errors.then(function (result) {
             if (!result.isEmpty()) {
                res.render('newevent', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "public": req.body.public,
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
                    "description" : req.body.description,
                    "groups_responsible" : req.body.groups_responsible,
                    "groups_responsible_name" : req.body.groups_responsible_name,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList,

                    "validationErrors" : result.mapped()
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var sources = req.body.sources;
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
              if (typeof sources == "string") sources = [sources]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!contacts) contacts = []; 
              if (!sources) sources = []; 
                 
              /*if its an edit*/   
              if (req.body._id){    
                var updateVal = {};
                if (profile[0].public!= req.body.public) updateVal['public'] =  req.body.public                                                     
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
                if (profile[0].description!=req.body.description)updateVal['description'] = req.body.description
                if (profile[0].groups_responsible!= groups)updateVal['groups_responsible'] = groups
                if (profile[0].groups_responsible_name!=req.body.groups_responsible_name)updateVal['groups_responsible_name'] = req.body.groups_responsible_name
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts
                if (profile[0].sources!=sources) updateVal['sources'] = sources

                collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
                
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
                    if (profile[0].sources != sources) {
                        sources.forEach( function (e){
                            if((profile[0].sources).indexOf(e)== -1)updateRelated("sources", e, req.body.code, "events");
                        });
                        if(profile[0].sources){
                            (profile[0].sources).forEach( function (e){
                                if((sources).indexOf(e)== -1)removeRelated("sources", e, req.body.code, "events");
                            });
                        }
                    }
                    if (profile[0].contacts != contacts) {
                        contacts.forEach( function (e){
                            if((profile[0].contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "events");
                        });
                        if(profile[0].contacts){
                            (profile[0].contacts).forEach( function (e){
                                if((contacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "events");
                            });
                        }
                    }
                    profile = null;
                    res.redirect('/events');
                }
               });
                
             /*if its an insert*/    
             } else{
                var eventnew = {
                                "code" : req.body.code,
                                "public": req.body.public,
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
                                "description" : req.body.description,
                                "groups_responsible" : groups,
                                "groups_responsible_name" : req.body.groups_responsible_name,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "notes" : req.body.notes,
                                "contacts" : contacts,    
                                "sources" : sources
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
                    if (sources) {
                        sources.forEach( function (e){
                            updateRelated("sources", e, req.body.code, "events");
                        });
                    }
                    if (contacts) {
                        contacts.forEach( function (e){
                            updateRelated("contacts", e, req.body.code, "events");
                        });
                    }
                    res.redirect('/events');
                }
              });
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Location*/
router.post('/addlocation', function(req, res){
        if (db) {
            var collection = db.collection('locations');
            var profile = req.session.profile;
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();

            var errors = req.getValidationResult();
            errors.then(function (result) {
             if (!result.isEmpty()) {
                res.render('newlocation', {
                    "_id":req.body._id,
                    "code":req.body.code,
                    "public": req.body.public,
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
                    "description" : req.body.description,
                    "groups_responsible" : req.body.groups_responsible,
                    "groups_responsible_name" : req.body.groups_responsible_name,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var contacts = req.body.contacts;
              var groups =  req.body.groups_responsible;  
              var sources = req.body.sources;  
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
              if (typeof sources == "string") sources = [sources]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!sources) sources = [];
              if (!contacts) contacts = [];
                 
              /*if its an edit*/     
              if (req.body._id){    
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                if (profile[0].public!= req.body.public) updateVal['public'] =  req.body.public  
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
                if (profile[0].description!= req.body.description) updateVal['description'] =  req.body.description
                if (profile[0].groups_responsible!= groups)updateVal['groups_responsible'] = groups
                if (profile[0].groups_responsible_name!= req.body.groups_responsible_name)updateVal['groups_responsible_name'] = req.body.groups_responsible_name
                if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                if (profile[0].sources!= sources) updateVal['sources'] = sources
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts

                collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
                
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
                    if (profile[0].sources != sources) {
                        sources.forEach( function (e){
                            if(profile[0].sources && (profile[0].sources).indexOf(e)== -1)updateRelated("sources", e, req.body.code, "locations");
                        });
                        if(profile[0].sources){
                            (profile[0].sources).forEach( function (e){
                                if((sources).indexOf(e)== -1)removeRelated("sources", e, req.body.code, "locations");
                            });     
                        } 
                    }
                    if (profile[0].contacts != contacts) {
                        contacts.forEach( function (e){
                            if(profile[0].contacts && (profile[0].contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "locations");
                        });
                        if(profile[0].contacts){
                            (profile[0].contacts).forEach( function (e){
                                if((contacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "locations");
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
                                "public": req.body.public,
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
                                "description" : req.body.description,
                                "groups_responsible" : groups,
                                "groups_responsible_name" : req.body.groups_responsible_name,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "notes" : req.body.notes,
                                "contacts" : contacts,
                                "sources" : sources
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
                    if (sources) {
                        sources.forEach( function (e){
                            updateRelated("sources", e, req.body.code, "locations");
                        });
                    }
                    if (contacts) {
                        contacts.forEach( function (e){
                            updateRelated("contacts", e, req.body.code, "locations");
                        });
                    }
                    res.redirect('/locations');
                }
              });
                
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Sites*/
router.post('/addsite', function(req, res){
        if (db) {
            var collection = db.collection('sites');
            var profile = req.session.profile;
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('location_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('location_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.getValidationResult();
            errors.then(function (result) {
             if (!result.isEmpty()) {
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
                    "description" : req.body.description,
                    "perpetrators" : req.body.perpetrators,
                    "perpetrators_name" : req.body.perpetrators_name,
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
                    "identification_status" : req.body.identification_status,
                    "identification_date_day" : req.body.identification_date_day,
                    "identification_date_month" : req.body.identification_date_month,
                    "identification_date_year" : req.body.identification_date_year,
                    "identification_number" : req.body.identification_number,
                    "identification_notes" : req.body.identification_notes,
                    "identification_dna" : req.body.identification_dna,
                    "notes" : req.body.notes,
                    "sources" : req.body.sources,
                    "contacts" : req.body.contacts,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList,

                    "validationErrors" : result.mapped()
                });

             } else {
            
              var relEvents = req.body.related_events;
              var relSites = req.body.related_sites;
              var relLocations = req.body.related_locations;
              var relMPs = req.body.related_mps;
              var sources = req.body.sources;
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
              if (typeof sources == "string") sources = [sources]
              if (!relEvents) relEvents = [];
              if (!relSites) relSites = [];
              if (!relLocations) relLocations = [];
              if (!relMPs) relMPs = [];
              if (!sources) sources = [];
              if (!contacts) contacts = [];
                 
              /*if its an edit*/
              if (req.body._id){     
                var updateVal = {};                                                     
                if (profile[0].name.ar!= req.body.name_ar) updateVal['name.ar'] =  req.body.name_ar
                if (profile[0].name.en!= req.body.name_en) updateVal['name.en'] =  req.body.name_en
                if (profile[0].public!= req.body.public) updateVal['public'] = req.body.public
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
                if (profile[0].description!= req.body.description) updateVal['description'] = req.body.description
                if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type
                if (profile[0].related.events!= relEvents) updateVal['related.events'] = relEvents
                if (profile[0].related.sites!= relSites) updateVal['related.sites'] = relSites  
                if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                if (profile[0].perpetrators!= req.body.perpetrators) updateVal['perpetrators'] =  req.body.perpetrators
                if (profile[0].perpetrators_name!= req.body.perpetrators_name) updateVal['perpetrators_name'] = req.body.perpetrators_name
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
                if (!profile[0].identification || profile[0].identification.status!=req.body.identification_status) updateVal['identification.status'] =  req.body.identification_status
                if (!profile[0].identification || profile[0].identification.date!= dateConverter(req.body.identification_date_day,req.body.identification_date_month, req.body.identification_date_year)) updateVal['identification.date'] =  dateConverter(req.body.identification_date_day,req.body.identification_date_month,req.body.identification_date_year)
                if (!profile[0].identification || profile[0].identification.number!=req.body.identification_number)updateVal['identification.number'] =  req.body.identification_number
                if (!profile[0].identification || profile[0].identification.notes!=req.body.identification_notes)updateVal['identification.notes'] =  req.body.identification_notes
                if (!profile[0].identification || profile[0].identification.dna!=req.body.identification_dna)updateVal['identification.dna'] =  req.body.identification_dna
                if (profile[0].sources!= sources) updateVal['sources'] = sources
                if (profile[0].contacts!=contacts) updateVal['contacts'] = contacts
                if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes  
                //collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){
                collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
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
                    if (profile[0].sources != sources) {
                        sources.forEach( function (e){
                            if(profile[0].sources && (profile[0].sources).indexOf(e)== -1)updateRelated("sources", e, req.body.code, "sites");
                        });
                        if(profile[0].sources){
                            (profile[0].sources).forEach( function (e){
                                if((sources).indexOf(e)== -1)removeRelated("sources", e, req.body.code, "sites");
                            });     
                        } 
                    }
                    if (profile[0].contacts != contacts) {
                        contacts.forEach( function (e){
                            if(profile[0].contacts && (profile[0].contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "sites");
                        });
                        if(profile[0].contacts){
                            (profile[0].contacts).forEach( function (e){
                                if((contacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "sites");
                            });     
                        } 
                    }
                    profile = null;
                    res.redirect('/sites');   
                }
               });
                
             /*if its an insert*/    
             } else{
                var sitenew = {
                                "code" : req.body.code,
                                "public": req.body.public,
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
                                "description" : req.body.description,
                                "type" : req.body.type,
                                "related" : {
                                    "events" : relEvents,
                                    "sites" : relSites,
                                    "locations" :relLocations,
                                    "mps" : relMPs
                                },
                                "perpetrators" : req.body.perpetrators,
                                "perpetrators_name" : req.body.perpetrators_name,
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
                                "identification" : {
                                    "status" : req.body.identification_status,
                                    "date" : dateConverter(req.body.identification_date_day, req.body.identification_date_month, req.body.identification_date_year),
                                    "number" : req.body.identification_number,
                                    "notes" : req.body.identification_notes,
                                    "dna" : req.body.identification_dna
                                },
                                "contacts" : contacts,
                                "sources" : sources,
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
                    if (sources) {
                        sources.forEach( function (e){
                            updateRelated("sources", e, req.body.code, "sites");
                        });
                    }
                    if (contacts) {
                        contacts.forEach( function (e){
                            updateRelated("contacts", e, req.body.code, "sites");
                        });
                    }
                    res.redirect('/sites');
                }
              });
                
            }
          }
         });  
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Party*/
router.post('/addparty', function(req, res){
        if (db) {
            var collection = db.collection('parties');
            var profile = req.session.profile;
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            req.check('name_en', 'Name in English cannot be empty').notEmpty();
            req.check('hq_latitude','Latitude should be xx.xxxxx').isDecimal;
            req.check('hq_longitude','Longitude should be xx.xxxxx').isDecimal;

            var errors = req.getValidationResult();
            errors.then(function (result) {
             if (!result.isEmpty()) {
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
                    "control_areas" : control_areas,
                    "color" : req.body.color,
                    "sources" : req.body.sources,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
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
                if (profile[0].control_areas!= req.body.control_areas) updateVal['control_areas'] =  req.body.control_areas
                if (profile[0].color!= req.body.color) updateVal['color'] =  req.body.color
                
                if (profile[0].flag.file!= req.body.flag_file) updateVal['flag.file'] =  req.body.flag_file
                if (profile[0].documents!= req.body.documents) updateVal['documents'] =  req.body.documents  
                  
                collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
                
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
                                "control_areas" : req.body.control_areas,
                                "color" : req.body.color,
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
         });  
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Contact*/
router.post('/addcontact', function(req, res){
        if (db) {
            var collection = db.collection('contacts');
            var profile = req.session.profile;
            
            //Validate Fields
            req.check('code', 'Code cannot be empty').notEmpty();
            //req.check('name_en', 'Name in English cannot be empty').notEmpty();

            var errors = req.getValidationResult();
            errors.then(function (result) {
             if (!result.isEmpty()) {
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
                    "sources" : req.body.sources,
                    "phone_1": req.body.phone_1,
                    "phone_2": req.body.phone_2,
                    "email": req.body.email,
                    "preferred_channel": req.body.preferred_channel,
                    "icrc": req.body.icrc,
                    "family_associations": req.body.family_associations,
                    "contacted_act": req.body.contacted_act,
                    "notes": req.body.notes,
                    
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
                var relEvents = req.body.related_events;
                var relSites = req.body.related_sites;
                var relLocations = req.body.related_locations;
                var relMPs = req.body.related_mps; 
                var sources = req.body.sources;  
                 
                if (typeof relEvents == "string") relEvents = [relEvents]
                if (typeof relSites == "string") relSites = [relSites]
                if (typeof relLocations == "string") relLocations = [relLocations]
                if (typeof relMPs == "string") relMPs = [relMPs] 
                if (typeof sources == "string") sources = [sources]  
                if (!sources) sources = []
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
                    if (profile[0].sources!= req.body.sources) updateVal['sources'] =  sources
                    if (profile[0].phone_1!= req.body.phone_1) updateVal['phone_1'] =  req.body.phone_1
                    if (profile[0].phone_2!= req.body.phone_2) updateVal['phone_2'] =  req.body.phone_2
                    if (profile[0].email!= req.body.email) updateVal['email'] =  req.body.email
                    if (profile[0].preferred_channel!= req.body.preferred_channel) updateVal['preferred_channel'] =  req.body.preferred_channel
                    if (profile[0].icrc!= req.body.icrc) updateVal['icrc'] =  req.body.icrc
                    if (profile[0].family_associations!= req.body.family_associations) updateVal['family_associations'] =  req.body.family_associations
                    if (profile[0].contacted_act!= req.body.contacted_act) updateVal['contacted_act'] =  req.body.contacted_act
                    if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                    
                    collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
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
                                "sources" : sources,
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
         });
            
        } else { 
        res.render('index', { title: 'Login to Database'});
    }      
            
});

/*INSERT or UPDATE Source*/
router.post('/addsource', function(req, res){

    //validation
    if (db) {
        var collection = db.collection('sources');
        var profile = req.session.profile;

        //Validate Fields
        //req.check('code', 'Code cannot be empty').notEmpty();
        //req.check('type', 'Type cannot be empty').notEmpty();

        var errors = req.getValidationResult();
        errors.then(function (result) {
        if (!result.isEmpty()) {
            res.render('newsource', {
                "_id":req.body._id,
                "code":req.body.code,
                "type": req.body.type,
                "subtype": req.body.subtype,
                "name": req.body.name,
                "location" : req.body.location,
                "date_day" : req.body.date_day,
                "date_month": req.body.date_month, 
                "date_year": req.body.date_year,
                "source_title" : req.body.source_title,
                "focus" : req.body.focus,
                "related_events" : req.body.related_events,
                "related_sites" : req.body.related_sites,
                "related_locations" : req.body.related_locations,
                "related_mps" : req.body.related_mps,
                "related_sources" : req.body.related_sources,
                "attendant_name": req.body.attendant_name,
                "attendant_contacts": req.body.attendant_contacts,
                "interviewee_name": req.body.interviewee_name,
                "interviewee_contacts": req.body.interviewee_contacts,
                "interviewer" : req.body.interviewer,
                "number" : req.body.number,
                "author" : req.body.author,
                "publication" : req.body.publication,
                "duration" : req.body.duration,
                "production" : req.body.production,
                "notes": req.body.notes,
                "files": req.file,
                
                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,
    
                "validationErrors" : result.mapped()
            });
    
        } else {

            uploadFile(req, res, function(filesList, uploadError){
                var relEvents = req.body.related_events;
                var relSites = req.body.related_sites;
                var relLocations = req.body.related_locations;
                var relMPs = req.body.related_mps;
                var relSources = req.body.related_sources;
                var attendantContacts = req.body.attendant_contacts;
                var intervieweeContacts = req.body.interviewee_contacts;
            
                if (typeof relEvents == "string") relEvents = [relEvents]
                if (typeof relSites == "string") relSites = [relSites]
                if (typeof relLocations == "string") relLocations = [relLocations]
                if (typeof relMPs == "string") relMPs = [relMPs]
                if (typeof attendantContacts == "string") attendantContacts = [attendantContacts]
                if (typeof intervieweeContacts == "string") intervieweeContacts = [intervieweeContacts]
                if (typeof relSources == "string") relSources = [relSources]
                if (!relEvents) relEvents = [];
                if (!relSites) relSites = [];
                if (!relLocations) relLocations = [];
                if (!relMPs) relMPs = [];
                if (!attendantContacts) attendantContacts = [];
                if (!intervieweeContacts) intervieweeContacts = [];
                if (!relSources) relSources = [];
            
                /*if its an edit*/   
                if (req.body._id){
                        var updateVal = {};                                                     
                        if (profile[0].type!= req.body.type) updateVal['type'] =  req.body.type
                        if (profile[0].subtype!= req.body.subtype) updateVal['subtype'] =  req.body.subtype
                        if (profile[0].name!= req.body.name) updateVal['name'] =  req.body.name
                        if (profile[0].location!= req.body.location) updateVal['location'] =  req.body.location
                        if (profile[0].date!= dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)) updateVal['date'] =  dateConverter(req.body.date_day,req.body.date_month, req.body.date_year)
                        if (profile[0].source_title!= req.body.source_title) updateVal['source_title'] =  req.body.source_title
                        if (profile[0].focus!= req.body.focus) updateVal['focus'] =  req.body.focus
                        if (profile[0].related.events!= relEvents)updateVal['related.events'] = relEvents
                        if (profile[0].related.sites!= relSites)updateVal['related.sites'] = relSites  
                        if (profile[0].related.locations!= relLocations) updateVal['related.locations'] = relLocations
                        if (profile[0].related.mps!= relMPs) updateVal['related.mps'] = relMPs
                        if (profile[0].related.sources!= relSources) updateVal['related.sources'] = relSources
                        if (profile[0].attendant && (profile[0].attendant.name!= req.body.attendant_name)) updateVal['attendant.name'] =  req.body.attendant_name
                        if (profile[0].attendant && (profile[0].attendant.contacts!= attendantContacts)) updateVal['attendant.contacts'] =  attendantContacts
                        if (profile[0].interviewee && (profile[0].interviewee.name!= req.body.interviewee_name)) updateVal['interviewee.name'] =  req.body.interviewee_name
                        if (profile[0].interviewer!= req.body.interviewer) updateVal['interviewer'] =  req.body.interviewer
                        if (profile[0].interviewee && (profile[0].interviewee.contacts!= intervieweeContacts)) updateVal['interviewee.contacts'] =  intervieweeContacts
                        if (profile[0].number!= req.body.number) updateVal['number'] =  req.body.number
                        if (profile[0].author!= req.body.author) updateVal['author'] =  req.body.author
                        if (profile[0].publication!= req.body.publication) updateVal['publication'] =  req.body.publication
                        if (profile[0].duration!= req.body.duration) updateVal['duration'] =  req.body.duration
                        if (profile[0].production!= req.body.production) updateVal['production'] =  req.body.production
                        if (profile[0].notes!= req.body.notes) updateVal['notes'] =  req.body.notes
                        if (filesList.length>0 && !uploadError) {
                            var oldFiles = profile[0].files;
                            if (!oldFiles) oldFiles = [];
                            filesList.forEach(function(f) {
                                oldFiles.push(f)
                            });
                            updateVal['files'] =  oldFiles    
                        } 
                        //collection.update({_id: profile[0]._id}, {$set: updateVal}, function(err, result){    
                        collection.update({code: profile[0].code}, {$set: updateVal}, function(err, result){
                            if (err){
                                console.log ("error :"+err);
                                res.render('newfile', {
                                    "errormessage" : err, 
                                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                                });
                            }else {
                                if (profile[0].related.events!= relEvents) {
                                    relEvents.forEach( function (e){
                                        if((profile[0].related.events).indexOf(e)== -1)updateRelated("events", e, req.body.code, "sources");
                                    });
                                    (profile[0].related.events).forEach( function (e){
                                        if((relEvents).indexOf(e)== -1)removeRelated("events", e, req.body.code, "sources");
                                    });
                                }
                                if (profile[0].related.sites!= relSites) {
                                    relSites.forEach( function (e){
                                        if((profile[0].related.sites).indexOf(e)== -1)updateRelated("sites", e, req.body.code, "sources");
                                    });
                                    (profile[0].related.sites).forEach( function (e){
                                        if((relSites).indexOf(e)== -1)removeRelated("sites", e, req.body.code, "sources");
                                    });
                                }
                                if (profile[0].related.locations != relLocations) {
                                    relLocations.forEach( function (e){
                                        if((profile[0].related.locations).indexOf(e)== -1)updateRelated("locations", e, req.body.code, "sources");
                                    });
                                    (profile[0].related.locations).forEach( function (e){
                                        if((relLocations).indexOf(e)== -1)removeRelated("locations", e, req.body.code, "sources");
                                    });
                                }
                                if (profile[0].related.mps != relMPs) {
                                    relMPs.forEach( function (e){
                                        if((profile[0].related.mps).indexOf(e)== -1)updateRelated("missing", e, req.body.code, "sources");
                                    });
                                    (profile[0].related.mps).forEach( function (e){
                                        if((relMPs).indexOf(e)== -1)removeRelated("missing", e, req.body.code, "sources");
                                    });
                                }
                                if (profile[0].attendant && (profile[0].attendant.contacts != attendantContacts)) {
                                    attendantContacts.forEach( function (e){
                                        if((profile[0].attendant.contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "sources");
                                    });
                                    if(profile[0].attendant && profile[0].attendant.contacts){
                                        (profile[0].attendant.contacts).forEach( function (e){
                                            if((attendantContacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "sources");
                                        });     
                                    }
                                }
                                if (profile[0].interviewee && (profile[0].interviewee.contacts != intervieweeContacts)) {
                                    intervieweeContacts.forEach( function (e){
                                        if((profile[0].interviewee.contacts).indexOf(e)== -1)updateRelated("contacts", e, req.body.code, "sources");
                                    });
                                    if(profile[0].interviewee && profile[0].interviewee.contacts){
                                        (profile[0].interviewee.contacts).forEach( function (e){
                                            if((intervieweeContacts).indexOf(e)== -1)removeRelated("contacts", e, req.body.code, "sources");
                                        });     
                                    }
                                }
                                if (profile[0].related.sources != relSources) {
                                    relSources.forEach( function (e){
                                        if((profile[0].related.sources).indexOf(e)== -1)updateRelated("sources", e, req.body.code, "sources");
                                    });
                                    (profile[0].related.sources).forEach( function (e){
                                        if((relSources).indexOf(e)== -1)removeRelated("sources", e, req.body.code, "sources");
                                    });
                                }
                                profile = null;
                                res.redirect('/sources');
                            }
                        });
            
                }else {
                        /*if its an insert*/
                        var sourcenew = {
                            "code" : req.body.code,
                            "type": req.body.type,
                            "subtype": req.body.subtype,
                            "name": req.body.name,
                            "location" : req.body.location,
                            "date" : dateConverter(req.body.date_day,req.body.date_month, req.body.date_year),
                            "source_title" : req.body.source_title,
                            "focus" : req.body.focus,
                            "related" : {
                                "events" : relEvents,
                                "sites" : relSites,
                                "locations" :relLocations,
                                "mps" : relMPs,
                                "sources" : relSources
                            },
                            "attendant": {
                                "name": req.body.attendant_name,
                                "contacts": attendantContacts,
                            },
                            "interviewee": {
                                "name": req.body.interviewee_name,
                                "contacts": intervieweeContacts,
                            },
                            "interviewer" : req.body.interviewer,
                            "number" : req.body.number,
                            "author" : req.body.author,
                            "publication" : req.body.publication,
                            "duration" : req.body.duration,
                            "production" : req.body.production,
                            "notes": req.body.notes,
                            "files" : filesList
                        };
                        collection.insert([sourcenew], function(err, result){
                            if (err){
                                res.render('newsource', {
                                    "errormessage" : err
                                });
                            }else {
                                if (relEvents) {
                                    relEvents.forEach( function (e){
                                        updateRelated("events", e, req.body.code, "sources");
                                    });
                                }
                                if (relSites) {
                                    relSites.forEach( function (e){
                                        updateRelated("sites", e, req.body.code, "sources");
                                    });
                                }
                                if (relLocations) {
                                    relLocations.forEach( function (e){
                                        updateRelated("locations", e, req.body.code, "sources");
                                    });
                                }
                                if (relMPs) {
                                    relMPs.forEach( function (e){
                                        updateRelated("missing", e, req.body.code, "sources");
                                    });
                                }
                                if (relSources) {
                                    relSources.forEach( function (e){
                                        updateRelated("sources", e, req.body.code, "sources");
                                    });
                                }
                                if (attendantContacts){
                                    attendantContacts.forEach(function (e){
                                        updateRelated("contacts", e, req.body.code, "sources");
                                    });
                                }
                                if (intervieweeContacts){
                                    intervieweeContacts.forEach(function (e){
                                        updateRelated("contacts", e, req.body.code, "sources");
                                    });
                                }
                                res.redirect('/sources');
                            }
                        });
                }
            });        
              // });
        }
    //   });
    //  }
        });
    } else { 
        res.render('index', { title: 'Login to Database'});
    }   
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
                        req.session.missingResult = result;
                        res.render('missinglist', {
                        "collList" : result,
                        parties : partiesList,
                        title: "List of Missing People",
                        nextrecord : nextrecord,
                        "user": req.session.user,
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
    var sitesResult;
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
                        "user": req.session.user,
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

router.post('/uploadPicture',function(req,res){
    
    // define the route and file name
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
     req.files.forEach( function(f) {
        //console.log(f);
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
                                "collList" : req.session.missingResult,
                                parties : partiesList,
                                title: "List of Missing People",
                                nextrecord : nextrecord,
                                "user": req.session.user   
                                });
                        }
                    }); 
                 }
             });     
            }); 
        }
    });
});

router.post('/deleteEntry', function (req,res){
    var collection = db.collection(req.body.collection);
    var code = req.body.code;

    if (req.body.files && req.body.files.length){
        var files = JSON.parse(req.body.files);
        files.forEach(function (file){
            //delete temporary file
            fs.unlink(relPath+file, function(err) {
                if (err) { console.log('ERROR: ' + err); }
            });
            //delete file from cloudinry
            cloudinary.v2.uploader.destroy(file, function(error, result){console.log(result)});  
        }) 
    }

    collection.deleteOne({code: req.body.code}, function(err, result){
        if (err){
           console.log ("error :"+err);
        }else {
            if((req.body.related_events).length){
                var relEvents = (req.body.related_events).slice(1,-1);
                relEvents.split(",").forEach(function (e){
                    removeRelated("events", e.slice(1,-1), req.body.code, req.body.collection);
                })     
            }
            if((req.body.related_sites).length){
                var relSites = (req.body.related_sites).slice(1,-1);
                relSites.split(",").forEach(function (e){
                 removeRelated("sites", e.slice(1,-1), req.body.code, req.body.collection);
                })     
            }
            if((req.body.related_locations).length){
             var relLocations = (req.body.related_locations).slice(1,-1);
             relLocations.split(",").forEach(function (e){
              removeRelated("locations", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }
            if((req.body.related_mps).length){
             var relMps = (req.body.related_mps).slice(1,-1);
             relMps.split(",").forEach(function (e){
              removeRelated("missing", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }
            if(req.body.contacts && (req.body.contacts).length){
             var relContacts = (req.body.contacts).slice(1,-1);
             relContacts.split(",").forEach(function (e){
              removeRelated("contacts", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }  
            if(req.body.sources && (req.body.sources).length){
                var sources = (req.body.sources).slice(1,-1);
                sources.split(",").forEach(function (e){
                 removeRelated("sources", e.slice(1,-1), req.body.code, req.body.collection);
                })     
               }
            req.session.profile = null;   
            res.redirect('/'+req.body.collection);   
        }
    }); 

});

router.post('/logout', function(req, res){
    //dbclient.close();
    req.session.destroy;
    res.render('index', { title: 'Login to Database'});
    //res.redirect("/");
    
    
});

module.exports = router;