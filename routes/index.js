"use strict";
var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var validator = require('express-validator');
var async = require('async');
var fs = require("fs");
var csrf = require('csurf');
var bodyParser = require('body-parser');
var config = require('../config.js').get(process.env.NODE_ENV);
var cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);
var RateLimit = require('express-rate-limit');
app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc) 
var loginLimiter = new RateLimit(config.loginLimiter);

const municipalities = require("../public/javascripts/lebanonAdministrativeSimplified70.js");
const common = require('./common.js');
const mongoCommon = require('./models/common.js');
const mongoMissing = require('./models/missing.js');
const mongoEvents = require('./models/events.js');
const mongoLocations = require('./models/locations.js');
const mongoSites = require('./models/sites.js');
const mongoParties = require('./models/parties.js');
const mongoContacts = require('./models/contacts.js');
const mongoSources = require('./models/sources.js');
const mongoLogins = require('./models/logins');
 
var db;
var partiesList;
var locationsList;
var eventsList;
var sitesList;
var missingList;
var contactsList;
var sourcesList;

var parseJson = bodyParser.json();
var parseForm = bodyParser.urlencoded({ extended: false });
var csrfProtection = csrf();

/* GET home page. */
router.get('/', csrfProtection, function(req, res, next) {
    res.render('index', { title: 'ACT - Login to Database', csrfToken: req.csrfToken()});  
});

/*Log in*/
router.post('/login', loginLimiter, parseForm, csrfProtection, function(req, res){
    const user = req.body.user;
    const pass = req.body.pass;
    
    //Validate Fields
    req.check('user', 'User cannot be empty').notEmpty();
    req.check('pass', 'Password cannot be empty').notEmpty();
    var errors = req.getValidationResult();
    errors.then(function (result) {
     if (!result.isEmpty()) {
            res.render('index', {
                "validationErrors" : result.mapped(),
                csrfToken: req.csrfToken()
            });    

     } else {
        /*Connect to the BD*/
        mongoCommon.mongoConnect(user, pass)
            .then((dbConnection, err)=> {
                db = dbConnection;
                req.session.user = user;
                res.redirect("missing"); 
            /*Record Login information*/ 
            }).then(()=> { mongoCommon.recordLogins(user, req)
            /*Open Change Streams*/       
            }).then(()=> { mongoCommon.openChangeStreams(user) 
            }).catch((err) =>{
                res.render('index', {
                    "errormessage" : err,
                    csrfToken: req.csrfToken()
                });
            })
    }
 });
});

/* GET list of missing */
router.get('/missing', csrfProtection, function(req, res){
    if (req.session.user){
        async.parallel([
            mongoCommon.getByType.bind(null, req.session, 'missing', mongoMissing.propertiesObj, mongoMissing.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'events', mongoEvents.propertiesObj, mongoEvents.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'locations', mongoLocations.propertiesObj, mongoLocations.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'parties', mongoParties.propertiesObj, mongoParties.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'sites', mongoSites.propertiesObj, mongoSites.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'sources', mongoSources.propertiesObj,mongoSources.sortBy),
            mongoCommon.getByType.bind(null, req.session.user, 'contacts', mongoContacts.propertiesObj,mongoContacts.sortBy),
        ], function(err, results){
            if (err) {
                return console.error(err);
            } else if (results[0].length) {
                    //save results to reuse throughout the app
                    missingList = results[0];
                    eventsList = results[1];
                    locationsList = results[2];
                    partiesList = results[3];
                    sitesList = results[4];
                    sourcesList = results[5];
                    contactsList = results[6];

                    var nextrecord = common.calcLastRecord(results[0], "missing");
                    req.session.nextrecord = nextrecord;
                    res.render('missinglist', {
                        title: "List of Missing People",
                        nextrecord : nextrecord,
                        user: req.session.user,
                        collList : missingList,
                        csrfToken: req.csrfToken()
                    });   
    
                } else {
                        res.send('No Events found');
                }
        });
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }
    
});

/* GET list of Events */
router.get('/events', csrfProtection, function(req, res){
    if (req.session.user){      
        mongoCommon.getByType(req.session.user, 'events', mongoEvents.propertiesObj, mongoEvents.sortBy, function(err, result){
            if (result.length) {
                eventsList = result;
                let nextrecord = common.calcLastRecord(eventsList, "events");
                res.render('eventslist', {
                    collList : eventsList,
                    title: "List of Events",
                    nextrecord : nextrecord,
                    user: req.session.user, 
                    csrfToken: req.csrfToken()
                });   

            } else {
                    res.send('No Events found');
            }
        });
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

/* GET list of Locations */
router.get('/locations', csrfProtection, function(req, res){
    if (req.session.user){
        mongoCommon.getByType(req.session.user, 'locations', mongoLocations.propertiesObj, mongoLocations.sortBy, function(err, result){
            locationsList = result;    
            if (locationsList.length) {
                var nextrecord = common.calcLastRecord(locationsList, "locations");
                res.render('locationslist', {
                    user: req.session.user,
                    title: "List of Locations",
                    collList : locationsList,
                    nextbarrack : nextrecord[0],
                    nextsbarrack : nextrecord[1],
                    nextibarrack : nextrecord[2],
                    nextcheckpoint : nextrecord[3],
                    nextscheckpoint : nextrecord[4],
                    nexticheckpoint : nextrecord[5],
                    nextcenter : nextrecord[6],
                    nextscenter : nextrecord[7],
                    nexticenter : nextrecord[8],
                    csrfToken: req.csrfToken()
                });   

            } else {
                res.send('No Events found');
            }
        }); 
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

/* GET list of Sites */
router.get('/sites', csrfProtection, function(req, res){
    if (req.session.user){
        mongoCommon.getByType(req.session.user, 'sites', mongoSites.propertiesObj, mongoSites.sortBy ,(err, result) => {
            sitesList = result;    
            if (sitesList.length) {
                var nextrecord = common.calcLastRecord(sitesList, "sites");
                req.session.nextrecord = nextrecord;
                res.render('siteslist', {
                    collList : sitesList,
                    title: "List of Sites",
                    nextrecord : nextrecord,
                    user: req.session.user,
                    csrfToken: req.csrfToken()
                });   

            } else {
                    res.send('No Events found');
            }
        });
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }         
});

/* GET list of Logins */
router.get('/logins', csrfProtection, function(req, res){
    if (req.session.user && db){
        mongoCommon.getByType(req.session.user, 'logins', mongoLogins.propertiesObj, mongoLogins.sortBy, (err, result) => {
            if (result.length) {
                res.render('loginslist', {
                collList : result,
                user: req.session.user,
                csrfToken: req.csrfToken()
            });    
            } else {
                res.send('No Sites found');
            }
        }); 
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

/*GET mapping*/
router.get('/map', csrfProtection, function(req, res){
    var missingLayer = [];
    var barracksLayer = [];
    var checkpointsLayer = [];
    var detentionCentresLayer = [];
    var sitesLayer = [];
    var eventsLayer = [];
    var itineraryLayer = [];

    if (req.session.user){
        missingList.forEach(function (e){
            if(e.location.coordinates) missingLayer.push(e);
            if(e.itinerary_route && (e.itinerary_route).length>0) {
               var itineraryArray = []; 
               if(e.location.coordinates)itineraryArray.push(e.location.coordinates);
               e.itinerary_route.forEach (function (e){
                locationsList.forEach(function(f){
                  if(e==f.code) itineraryArray.push(f.location.coordinates)
                })
               })
             itineraryLayer.push({
                 "code": e.code, 
                 "name": e.name, 
                 "itinerary": itineraryArray 
             });
            }      
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

        //var muniString = JSON.stringify(municipalities);

        res.render('map', {
            "user": req.session.user,
            "missing": missingLayer,
            "checkpoints": checkpointsLayer,
            "barracks": barracksLayer,
            "centres": detentionCentresLayer,
            "sites": sitesLayer,
            "events": eventsLayer,
            "parties": partiesList,
            "itineraries" : itineraryLayer,
            //"municipalities" : encodeURIComponent(JSON.stringify(municipalities))
            "municipalities" : municipalities,
            csrfToken: req.csrfToken()
        });  
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }  
});

/* GET list of Parties */
router.get('/parties', csrfProtection, function(req, res){
    if (req.session.user){
        mongoCommon.getByType(req.session.user, 'parties', mongoParties.propertiesObj, mongoParties.sortBy, function(err, partiesList){
                if (partiesList.length) {
                    var nextrecord = common.calcLastRecord(partiesList, "parties");
                    res.render('partieslist', {
                        "collList" : partiesList,
                        nextrecord : nextrecord,
                        "user": req.session.user,
                        csrfToken: req.csrfToken()
                    });   

                } else {
                        res.send('No Events found');
                }
            }); 
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }          
});

/* GET list of Contacts */
router.get('/contacts', csrfProtection, function(req, res){
    if (req.session.user){
        mongoCommon.getByType(req.session.user, 'contacts', mongoContacts.propertiesObj, mongoContacts.sortBy, function(err, result){
            contactsList= result;    
            if (contactsList.length) {
                var nextrecord = common.calcLastRecord(contactsList, "contacts");
                res.render('contactslist', {
                    collList : contactsList,
                    title: "List of Contacts",
                    nextrecord : nextrecord,
                    user: req.session.user,
                    csrfToken: req.csrfToken()
                });   
            } else {
                    res.send('No Events found');
            }
        });       
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }     
});

/* GET list of Souces */
router.get('/sources', csrfProtection, function(req, res){
    if (req.session.user){
        mongoCommon.getByType(req.session.user, 'sources', mongoSources.propertiesObj,mongoSources.sortBy, function(err, result){
            sourcesList = result;    
            if (sourcesList.length) {
                var nextrecord = common.calcLastRecord(sourcesList, "sources");
                res.render('sourceslist', {
                    collList : sourcesList,
                    nextrecord : nextrecord,
                    user: req.session.user,
                    csrfToken: req.csrfToken()
                });   
            } else {
                res.send('No Events found');
            }
        }); 
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }           
});

/* GET profile*/
router.get('/profile', csrfProtection, function(req, res){
    if (req.session.user && db) {
            let collName = req.query.type;
            if (req.session.user == "public") collName = collName+"_public"
            mongoCommon.getByCode(collName, req.query.code, (result => {
                if (result.length) {
                    req.session.profile = result;
                    let urls = [];
                    if(collName=="sources" || collName=="missing"){
                        //get private url from cloudinary (expires in an hour)
                        let files = result[0].files;
                        if(files && files.length){
                          files.forEach((file) => {
                            let fileSplit = JSON.stringify(file).split(".");
                            let extension = (fileSplit[fileSplit.length -1]).slice(0, -1);
                            let url = cloudinary.utils.private_download_url(file,extension);
                            urls.push(url);  
                          });  
                        } 
                    }
                    res.render(req.query.type+'profile', {    
                        profile : result,
                        file_urls : urls, 
                        user : req.session.user,
                        locationsList : locationsList,
                        missingList : missingList,
                        sitesList : sitesList,
                        eventsList : eventsList,
                        contactsList : contactsList,
                        sourcesList : sourcesList,
                        csrfToken: req.csrfToken()
                        });    
                } else {
                    res.send('No data found');
                }
            })); 
    } else {
            res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }       
});

/* GET Report*/
router.get('/report', csrfProtection, function(req, res){
    if (req.session.user && req.session.user != "public") {
        mongoCommon.getByCode('sites', req.query.code, (result) => {
            Promise.all([
                mongoCommon.getRelatedProfiles(result, 'events'),
                mongoCommon.getRelatedProfiles(result, 'locations'),
                mongoCommon.getRelatedProfiles(result, 'mps'),
                mongoCommon.getRelatedProfiles(result, 'sites')
            ]).then((results)=> {
                    res.render('report', {    
                        title : "Report on "+result[0].name.en,
                        profile : result,
                        user : req.session.user,
                        eventsProfiles : results[0],
                        locationsProfiles : results[1],
                        mpsProfiles : results[2],
                        sitesProfiles : results[3],
                        csrfToken: req.csrfToken()
                    })
                }).catch((error) =>{
                    console.error(error)
                })
            });  
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }     
});

/* ADD or EDIT */
router.get('/newprofile', csrfProtection, function(req, res){
    if (req.session.user){  
        let type = req.query.type;
        let title;
        let record;
        let profile;

        if (req.query.nextrecord){
            title = 'Add New '+type;
            record = req.query.nextrecord;
            profile = null;
        } else {
            title = 'Edit '+type;
            record = null;
            profile = req.session.profile;
        }
        res.render('new'+type, { 
            title: title, 
            user: req.session.user, 
            nextrecord : record, 
            editprofile : profile, 
            mps: missingList,
            events: eventsList,
            locations: locationsList,
            parties : partiesList,
            sites: sitesList, 
            contactslist: contactsList, 
            sourceslist: sourcesList, 
            municipalities : municipalities, 
            csrfToken: req.csrfToken()
        });
    } else {
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }
});

/*INSERT or UPDATE Missing*/
router.post('/addmissing',parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    "itinerary_route" : req.body.itinerary_route,
                    "perpetrators" : req.body.perpetrators,
                    "perpetrators_name" : req.body.perpetrators_name,
                    "related_events" : req.body.related_events,
                    "related_sites" : req.body.related_sites,
                    "related_locations" : req.body.related_locations,
                    "related_mps" : req.body.related_mps,
                    "fate" : req.body.fate,
                    "notes" : req.body.notes,
                    "sources": req.body.sources,
                    "fushatamal_published": req.body.fushatamal_published,
                    "fushatamal_url": req.body.fushatamal_url,
                    "contacts" : req.body.contacts,
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
              let relEvents = !req.body.related_events ? []
                        : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
              let relSites = !req.body.related_sites ? []
                        : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
              let relLocations = !req.body.related_locations ? []
                        : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
              let relMPs = !req.body.related_mps ? []
                        : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
              let contacts = !req.body.contacts ? []
                        : typeof req.body.contacts == "string" ? [req.body.contacts] : req.body.contacts;
              let sources = !req.body.sources ? []
                        : typeof req.body.sources == "string" ? [req.body.sources] : req.body.sources
              let itinerary_route = !req.body.itinerary_route ? []
                        : typeof req.body.itinerary_route == "string" ? [req.body.itinerary_route] : req.body.itinerary_route;

              /*if its an edit*/   
              if (req.body._id){  
                //create the update Object
                let updateVal = mongoMissing.updateMissing(profile[0], req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, itinerary_route);
                //update in DB    
                mongoCommon.updateByCode('missing', profile[0].code, updateVal, function(err, result){
                    if (err){
                        res.render('newmissing', {
                            "errormessage" : err, 
                            parties : partiesList, 
                            mps: missingList, 
                            locations: locationsList, 
                            events: eventsList, 
                            sites: sitesList, 
                            contacts: contactsList
                        });
                    } else {
                        //update related
                        mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "mps");
                        mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "mps");
                        mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "mps");
                        mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "mps");
                        mongoCommon.updateRelated(profile[0].sources, sources, "sources", req.body.code, "mps");
                        mongoCommon.updateRelated(profile[0].contacts, contacts, "contacts", req.body.code, "mps");
    
                        res.redirect('/missing');
                    }
                });
                
             /*if its an insert*/    
             } else{
                //create the new Missing Object
                let missingnew = mongoMissing.newMissing(req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, itinerary_route);
                //insert it in the DB
                mongoCommon.insertNew('missing', missingnew, function(err, result){
                    if (err){
                        res.render('newmissing', {
                            "errormessage" : err
                        });
                    }else {
                        if (relEvents) {
                            relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "mps"));
                        }
                        if (relSites) {
                            relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "mps"));
                        }
                        if (relLocations) {
                            relLocations.forEach((e)=> mongoCommon.addRelated("locations", e, req.body.code, "mps"));
                        }
                        if (relMPs) {
                            relMPs.forEach((e)=> mongoCommon.addRelated("missing", e, req.body.code, "mps"));
                        }
                        if (sources) {
                            sources.forEach((e)=> mongoCommon.addRelated("sources", e, req.body.code, "mps"));
                        }
                        if (contacts) {
                            contacts.forEach((e)=> mongoCommon.addRelated("contacts", e, req.body.code, "mps"));
                        }
                        res.redirect('/missing');
                    }
                });
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }      
            
});

/*INSERT or UPDATE Event*/
router.post('/addevent',parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList,

                    "validationErrors" : result.mapped()
                });

             } else {
                let relEvents = !req.body.related_events ? []
                                    : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
                let relSites = !req.body.related_sites ? []
                                    : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
                let relLocations = !req.body.related_locations ? []
                                    : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
                let relMPs = !req.body.related_mps ? []
                                    : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
                let contacts = !req.body.contacts ? []
                                    : typeof req.body.contacts == "string" ? [req.body.contacts] : req.body.contacts;
                let sources = !req.body.sources ? []
                                    : typeof req.body.sources == "string" ? [req.body.sources] : req.body.sources
                let groups = !req.body.groups_responsible ? []
                                    : typeof req.body.groups_responsible == "string" ? [req.body.groups_responsible] : req.body.groups_responsible
                
                 
                /*if its an edit*/   
              if (req.body._id){    
                let updateVal = mongoEvents.updateEvent(profile[0], req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, groups)
                mongoCommon.updateByCode('events', profile[0].code, updateVal, function(err, result){    
                    if (err){
                        res.render('newevent', {
                            "errormessage" : err, 
                            parties : partiesList, 
                            mps: missingList, 
                            locations: locationsList, 
                            events: eventsList, 
                            sites: sitesList, 
                            contacts: contactsList
                        });
                    }else {
                        mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "events");
                        mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "events");
                        mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "events");
                        mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "events");
                        mongoCommon.updateRelated(profile[0].sources, sources, "sources", req.body.code, "events");
                        mongoCommon.updateRelated(profile[0].contacts, contacts, "contacts", req.body.code, "events");

                        res.redirect('/events');
                    }
                });

             /*if its an insert*/    
             } else{
                let eventnew = mongoEvents.newEvent(req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, groups) ;
                mongoCommon.insertNew('events', eventnew, function(err, result){
                    if (err){
                    res.render('newevent', {
                        "errormessage" : err
                    });
                    }else {
                        if (relEvents) {
                            relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "events"));
                        }
                        if (relSites) {
                            relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "events"));
                        }
                        if (relLocations) {
                            relLocations.forEach((e) => mongoCommon.addRelated("locations", e, req.body.code, "events"));
                        }
                        if (relMPs) {
                            relMPs.forEach((e) => mongoCommon.addRelated("missing", e, req.body.code, "events"));
                        }
                        if (sources) {
                            sources.forEach((e) => mongoCommon.addRelated("sources", e, req.body.code, "events"));
                        }
                        if (contacts) {
                            contacts.forEach((e) => mongoCommon.addRelated("contacts", e, req.body.code, "events"));
                        }
                        res.redirect('/events');
                    }
              });
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }      
            
});

/*INSERT or UPDATE Location*/
router.post('/addlocation',parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
                let relEvents = !req.body.related_events ? []
                            : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
                let relSites = !req.body.related_sites ? []
                            : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
                let relLocations = !req.body.related_locations ? []
                            : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
                let relMPs = !req.body.related_mps ? []
                            : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
                let contacts = !req.body.contacts ? []
                            : typeof req.body.contacts == "string" ? [req.body.contacts] : req.body.contacts;
                let sources = !req.body.sources ? []
                            : typeof req.body.sources == "string" ? [req.body.sources] : req.body.sources
                let groups = !req.body.groups_responsible ? []
                            : typeof req.body.groups_responsible == "string" ? [req.body.groups_responsible] : req.body.groups_responsible
                
           
              /*if its an edit*/     
              if (req.body._id){    
                let updateVal = mongoLocations.updateLocation(profile[0], req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, groups);
                mongoCommon.updateByCode('locations', profile[0].code, updateVal, function(err, result){
                if (err){
                    res.render('newlocation', {
                        "errormessage" : err, 
                        parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList
                    });
                }else {
                    mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "locations");
                    mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "locations");
                    mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "locations");
                    mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "locations");
                    mongoCommon.updateRelated(profile[0].sources, sources, "sources", req.body.code, "locations");
                    mongoCommon.updateRelated(profile[0].contacts, contacts, "contacts", req.body.code, "locations");
                   
                    res.redirect('/locations');
                }
               });
                
             /*if its an insert*/    
             } else{
                let locationnew = mongoLocations.newLocation(req.body, relEvents, relSites, relLocations, relMPs, contacts, sources, groups) 
                mongoCommon.insertNew('locations', locationnew, function(err, result){
                    if (err){
                    res.render('newlocation', {
                        "errormessage" : err
                    });
                    }else {
                        if (relEvents) {
                            relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "locations"));
                        }
                        if (relSites) {
                            relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "locations"));
                        }
                        if (relLocations) {
                            relLocations.forEach((e) => mongoCommon.addRelated("locations", e, req.body.code, "locations"));
                        }
                        if (relMPs) {
                            relMPs.forEach((e) => mongoCommon.addRelated("missing", e, req.body.code, "locations"));
                        }
                        if (sources) {
                            sources.forEach((e) => mongoCommon.addRelated("sources", e, req.body.code, "locations"));
                        }
                        if (contacts) {
                            contacts.forEach((e) => mongoCommon.addRelated("contacts", e, req.body.code, "locations"));
                        }
                        res.redirect('/locations');
                    }
              });     
            }
          }
         });   
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }      
            
});

/*INSERT or UPDATE Sites*/
router.post('/addsite',parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contactslist: contactsList, sourceslist: sourcesList,

                    "validationErrors" : result.mapped()
                });

             } else {
                let relEvents = !req.body.related_events ?[]
                            : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
                let relSites = !req.body.related_sites ?[]
                            : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
                let relLocations = !req.body.related_locations ?[]
                            : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
                let relMPs = !req.body.related_mps ?[]
                            : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
                let contacts = !req.body.contacts ?[]
                            : typeof req.body.contacts == "string" ? [req.body.contacts] : req.body.contacts;
                let sources = !req.body.sources ?[]
                            : typeof req.body.sources == "string" ? [req.body.sources] : req.body.sources
                 
              /*if its an edit*/
              if (req.body._id){     
                let updateVal = mongoSites.updateSite(profile[0], req.body, relEvents, relSites, relLocations, relMPs, contacts, sources)
                mongoCommon.updateByCode('sites', profile[0].code, updateVal, function(err, result){    
                    if (err){
                        res.render('newsite', {
                            "errormessage" : err, 
                            parties : partiesList, 
                            mps: missingList, 
                            locations: locationsList, 
                            events: eventsList, 
                            sites: sitesList
                        });
                    }else {
                        mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "sites");
                        mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "sites");
                        mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "sites");
                        mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "sites");
                        mongoCommon.updateRelated(profile[0].sources, sources, "sources", req.body.code, "sites");
                        mongoCommon.updateRelated(profile[0].contacts, contacts, "contacts", req.body.code, "sites");
                    
                        res.redirect('/sites');   
                    }
               });
                
             /*if its an insert*/    
             } else{
                let sitenew = mongoSites.newSite(req.body, relEvents, relSites, relLocations, relMPs, contacts, sources);
                mongoCommon.insertNew('sites', sitenew, function(err, result){
                    if (err){
                    res.render('newsite', {
                        "errormessage" : err
                    });
                    }else {
                        if (relEvents) {
                            relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "sites"));
                        }
                        if (relSites) {
                            relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "sites"));
                        }
                        if (relLocations) {
                            relLocations.forEach((e) => mongoCommon.addRelated("locations", e, req.body.code, "sites"));
                        }
                        if (relMPs) {
                            relMPs.forEach((e) => mongoCommon.addRelated("missing", e, req.body.code, "sites"));
                        }
                        if (sources) {
                            sources.forEach((e) => mongoCommon.addRelated("sources", e, req.body.code, "sites"));
                        }
                        if (contacts) {
                            contacts.forEach((e) => mongoCommon.addRelated("contacts", e, req.body.code, "sites"));
                        }
                        res.redirect('/sites');
                    }
              });
            }
          }
         });  
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }      
            
});

/*INSERT or UPDATE Party*/
router.post('/addparty', parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
              /*if its an edit*/
              if (req.body._id){    
                let updateVal = mongoParties.updateParty(profile[0], req.body); 
                mongoCommon.updateByCode('parties', profile[0].code, updateVal, function(err, result){
                    if (err){
                        res.render('newparty', {
                            "errormessage" : err, 
                            editprofile: req.session.profile,
                            municipalities : municipalities 
                        });
                    }else {
                        res.redirect('/parties');
                    }
               });
                
             /*if its an insert*/    
             } else{
                let partynew = mongoParties.newParty(req.body);
                mongoCommon.insertNew('parties', partynew, function(err, result){
                    if (err){
                    res.render('newparty', {
                        "errormessage" : err,
                        nextrecord: req.query.nextrecord
                    });
                    }else {
                        res.redirect('/parties');
                    }
              });
            }
          }
         });  
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }      
            
});

/*INSERT or UPDATE Contact*/
router.post('/addcontact', parseForm, csrfProtection, function(req, res){
        if (db) {
            let profile = req.session.profile;
            
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
                    "district" : req.body.district,
                    "governorate" : req.body.governorate,
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
                    csrfToken: req.csrfToken(),
                    parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,

                    "validationErrors" : result.mapped()
                });

             } else {
                let relEvents = !req.body.related_events ? []
                            : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
                let relSites = !req.body.related_sites ? []
                            : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
                let relLocations = !req.body.related_locations ? []
                            : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
                let relMPs = !req.body.related_mps ? []
                            : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
                let sources = !req.body.sources ? []
                            : typeof req.body.sources == "string" ? [req.body.sources] : req.body.sources
                 
                /*if its an edit*/   
                if (req.body._id){ 
                    let updateVal = mongoContacts.updateContact(profile[0], req.body, relEvents, relSites, relLocations, relMPs, sources);
                    mongoCommon.updateByCode('contacts', profile[0].code, updateVal, function(err, result){
                        if (err){
                            res.render('newcontact', {
                                "errormessage" : err, 
                                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                            });
                        }else {
                            mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "contacts");
                            mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "contacts");
                            mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "contacts");
                            mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "contacts");
                            mongoCommon.updateRelated(profile[0].sources, sources, "sources", req.body.code, "contacts");
                        
                            res.redirect('/contacts');
                        }
                    });
                    
                }else {
                    /*if its an insert*/    
                    let contactnew = mongoContacts.newContact(req.body, relEvents, relSites, relLocations, relMPs, sources);
                    mongoCommon.insertNew('contacts', contactnew, function(err, result){    
                        if (err){
                            res.render('newcontact', {
                                "errormessage" : err
                            });
                        }else {
                            if (relEvents) {
                                relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "contacts"));
                            }
                            if (relSites) {
                                relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "contacts"));
                            }
                            if (relLocations) {
                                relLocations.forEach((e) => mongoCommon.addRelated("locations", e, req.body.code, "contacts"));
                            }
                            if (relMPs) {
                                relMPs.forEach((e) => mongoCommon.addRelated("missing", e, req.body.code, "contacts"));
                            }
                            res.redirect('/contacts');
                        }
                    });  
                }
            }
         });
        } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }            
});

/*INSERT or UPDATE Source*/
router.post('/addsource', parseForm, csrfProtection, function(req, res){
    //validation
    if (db) {
        let profile = req.session.profile;

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
                csrfToken: req.csrfToken(),
                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList,
    
                "validationErrors" : result.mapped()
            });
        } else {
            common.uploadFile(req, res, function(filesList, uploadError){
                let relEvents = !req.body.related_events ? []
                            : typeof req.body.related_events == "string" ? [req.body.related_events] : req.body.related_events
                let relSites = !req.body.related_sites ? []
                            : typeof req.body.related_sites == "string" ? [req.body.related_sites] : req.body.related_sites
                let relLocations = !req.body.related_locations ? []
                            : typeof req.body.related_locations == "string" ? [req.body.related_locations] : req.body.related_locations
                let relMPs = !req.body.related_mps ? []
                            : typeof req.body.related_mps== "string" ? [req.body.related_mps] : req.body.related_mps;
                let sources = !req.body.related_sources ? []
                            : typeof req.body.related_sources == "string" ? [req.body.related_sources] : req.body.related_sources
                let attendantContacts = !req.body.attendant_contacts ? []
                            : typeof req.body.attendant_contacts == "string" ? [req.body.attendant_contacts] : req.body.attendant_contacts
                let intervieweeContacts = !req.body.interviewee_contacts ? []
                            : typeof req.body.interviewee_contacts == "string" ? [req.body.interviewee_contacts] : req.body.interviewee_contacts
                
                /*if its an edit*/   
                if (req.body._id){
                    let updateVal = mongoSources.updateSource(profile[0], req.body, relEvents, relSites, relLocations, relMPs, sources, attendantContacts, intervieweeContacts, filesList, uploadError)
                    mongoCommon.updateByCode('sources', profile[0].code, updateVal, function(err, result){    
                        if (err){
                            res.render('newsource', {
                                "errormessage" : err, 
                                parties : partiesList, mps: missingList, locations: locationsList, events: eventsList, sites: sitesList, contacts: contactsList
                            });
                        }else {
                            mongoCommon.updateRelated(profile[0].related.events, relEvents, "events", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].related.sites, relSites, "sites", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].related.locations, relLocations, "locations", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].related.mps, relMPs, "missing", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].related.sources, sources, "sources", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].attendant.contacts, attendantContacts, "contacts", req.body.code, "sources");
                            mongoCommon.updateRelated(profile[0].interviewee.contacts, intervieweeContacts, "contacts", req.body.code, "sources");

                            res.redirect('/sources');
                        }
                    });
            
                }else {
                    /*if its an insert*/
                    let sourcenew = mongoSources.newSource(req.body, relEvents, relSites, relLocations, relMPs, sources, attendantContacts, intervieweeContacts, filesList) 
                    mongoCommon.insertNew('sources', sourcenew, function(err, result){     
                        if (err){
                            res.render('newsource', {
                                "errormessage" : err
                            });
                        }else {
                            if (relEvents) {
                                relEvents.forEach((e) => mongoCommon.addRelated("events", e, req.body.code, "sources"));
                            }
                            if (relSites) {
                                relSites.forEach((e) => mongoCommon.addRelated("sites", e, req.body.code, "sources"));
                            }
                            if (relLocations) {
                                relLocations.forEach((e) => mongoCommon.addRelated("locations", e, req.body.code, "sources"));
                            }
                            if (relMPs) {
                                relMPs.forEach((e) => mongoCommon.addRelated("missing", e, req.body.code, "sources"));
                            }
                            if (sources) {
                                sources.forEach((e) => mongoCommon.addRelated("sources", e, req.body.code, "sources"));
                            }
                            if (attendantContacts){
                                attendantContacts.forEach((e) => mongoCommon.addRelated("contacts", e, req.body.code, "sources"));
                            }
                            if (intervieweeContacts){
                                intervieweeContacts.forEach((e) => mongoCommon.addRelated("contacts", e, req.body.code, "sources"));
                            }
                            res.redirect('/sources');
                        }
                    });
                }
            });    
        }
        });
    } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }   
});

/*Missing - Advanced Search*/
router.post('/searchmissing', parseForm, csrfProtection, function(req, res){
    
    if (db) {
        let query = mongoMissing.advancedSearch(req.body);
        mongoCommon.getByQuery('missing', query, function(err, result){
            if (err){
                res.send(err);
            } else{
                req.session.missingResult = result;
                res.render('missinglist', {
                    "collList" : result,
                    title: "List of Missing People",
                    nextrecord : req.session.nextrecord,
                    "user": req.session.user,
                    parties : partiesList,
                    locations: locationsList, 
                    events: eventsList, 
                    sites: sitesList,
                    csrfToken: req.csrfToken()    
                }); 
            } 
        });    
                
    } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

/*Site - Advanced Search*/
router.post('/searchsites', parseForm, csrfProtection, function(req, res){
    var sitesResult;
    if (db) {
        let query = mongoSites.advancedSearch(req.body);
        mongoCommon.getByQuery('sites', query, function(err, result){
                if (err){
                        res.send(err);
                } else{
                        sitesResult = result;
                        res.render('siteslist', {
                        "collList" : result,
                        title: "List of Sites",
                        nextrecord : req.session.nextrecord,
                        "user": req.session.user,
                        parties : partiesList,
                        locations: locationsList, 
                        events: eventsList, 
                        sites: sitesList,
                        mps: missingList,
                        csrfToken: req.csrfToken()   
                        }); 
                }
            }); 
    } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

/*Contact - Advanced Search*/
router.post('/searchcontacts', parseForm, csrfProtection, function(req, res){
    
    if (db) {
        let query = mongoContacts.advancedSearch(req.body);
        mongoCommon.getByQuery('contacts', query, function(err, result){
                if (err){
                        res.send(err);
                } else{
                        req.session.contactsResult = result;
                        res.render('contactslist', {
                        "collList" : result,
                        title: "List of Contacts",
                        nextrecord : req.session.nextrecord,
                        "user": req.session.user,
                        locations: locationsList, 
                        events: eventsList, 
                        sites: sitesList,
                        mps: missingList,
                        csrfToken: req.csrfToken()
                        }); 
                }
            }); 
    } else { 
        res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()});
    }    
});

router.post('/uploadPicture',parseForm, csrfProtection, function(req,res){
    common.uploadFile(req, res, function(filesList, uploadError){
        let filesProp = {files: filesList};

        mongoCommon.updateByCode('missing', req.body.code, filesProp, function (err, result){   
            if (err){
                console.log ("error :"+err);
            }else {
                    res.render('missinglist', {
                        collList : missingList,
                        parties : partiesList,
                        title: "List of Missing People",
                        nextrecord : req.session.nextrecord,
                        user: req.session.user,
                        csrfToken: req.csrfToken()   
                    });
            }
        }); 
    });
});

router.post('/deleteEntry', parseForm, csrfProtection, function (req,res){
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

    mongoCommon.deleteByCode(req.body.collection, req.body.code, function(err, result){
        if (err){
           console.log ("error :"+err);
        }else {
            if((req.body.related_events).length){
                let relEvents = (req.body.related_events).slice(1,-1);
                relEvents.split(",").forEach(function (e){
                    mongoCommon.removeRelated("events", e.slice(1,-1), req.body.code, req.body.collection);
                })     
            }
            if((req.body.related_sites).length){
                let relSites = (req.body.related_sites).slice(1,-1);
                relSites.split(",").forEach(function (e){
                    mongoCommon.removeRelated("sites", e.slice(1,-1), req.body.code, req.body.collection);
                })     
            }
            if((req.body.related_locations).length){
             let relLocations = (req.body.related_locations).slice(1,-1);
             relLocations.split(",").forEach(function (e){
                mongoCommon.removeRelated("locations", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }
            if((req.body.related_mps).length){
             let relMps = (req.body.related_mps).slice(1,-1);
             relMps.split(",").forEach(function (e){
                mongoCommon.removeRelated("missing", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }
            if(req.body.contacts && (req.body.contacts).length){
             let relContacts = (req.body.contacts).slice(1,-1);
             relContacts.split(",").forEach(function (e){
                mongoCommon.removeRelated("contacts", e.slice(1,-1), req.body.code, req.body.collection);
             })     
            }  
            if(req.body.sources && (req.body.sources).length){
                let sources = (req.body.sources).slice(1,-1);
                sources.split(",").forEach(function (e){
                    mongoCommon.removeRelated("sources", e.slice(1,-1), req.body.code, req.body.collection);
                })     
               }
            req.session.profile = null;   
            res.redirect('/'+req.body.collection);   
        }
    });
});

router.post('/logout', parseForm, csrfProtection, function(req, res){
    if(req.session){
        req.session.destroy();
    }
    res.render('index', { title: 'Login to Database', csrfToken: req.csrfToken()}); 
});

module.exports = router;