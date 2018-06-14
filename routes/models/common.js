"use strict";
var mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let date = new Date().toISOString();
let db;

module.exports = {

    mongoConnect: (user, pass) =>{
        return new Promise((resolve, reject) => {
            var url = 'mongodb://'+user+':'+pass+'@cluster0-shard-00-00-tey75.mongodb.net:27017,cluster0-shard-00-01-tey75.mongodb.net:27017,cluster0-shard-00-02-tey75.mongodb.net:27017/Act?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
            
            MongoClient.connect(url, {poolSize: 30}, function(err,client){
                if (err){
                    console.log("User:"+user+" unable to connect to server", err);
                    reject(err);
                } else {
                    console.log("user:" + user);
                    db = client.db("Act");
                    resolve(db);
                }   
            })  
        })
    },

    recordLogins: (user, req) => {
        //save the login info in the db as admin

        MongoClient.connect(process.env.MONGODB_URI, function(err, client){
            if (err){
                console.log("Unable to log "+user+ " into the database logins record. " + err);
            } else {
                let adminDB = client.db("Act");
                let collection = adminDB.collection('logins');
                let ipAddress;
                // Amazon EC2 / Heroku workaround to get real client IP
                let forwardedIpsStr = req.header('x-forwarded-for'); 
                if (forwardedIpsStr) {
                    // 'x-forwarded-for' header may return multiple IP addresses in
                    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
                    // the first one
                    let forwardedIps = forwardedIpsStr.split(',');
                    ipAddress = forwardedIps[0];
                }
                if (!ipAddress) {
                    // Ensure getting client IP address still works in
                    // development environment
                    ipAddress = req.connection.remoteAddress;
                }
                let newlongin = {user: user, ip: ipAddress, date: date};

                collection.insert([newlongin], function(err, result){
                    if (err){
                        console.log(err)
                    }
                });  
            }
        });
    },


    openChangeStreams: (user) => {
        const missingCollection = db.collection('missing');
        const sitesCollection = db.collection('sites');
        const eventsCollection = db.collection('events');
        const locationsCollection = db.collection('locations');
        const partiesCollection = db.collection('parties');
        const contactsCollection = db.collection('contacts');
        const sourcesCollection = db.collection('sources');

        var collectionsArray = [missingCollection, sitesCollection, eventsCollection, locationsCollection, partiesCollection, contactsCollection, sourcesCollection];
        
        collectionsArray.forEach(function (e){
            var changeStream = e.watch();
            changeStream.on("change", function(change) {
                var newChange = {user: user, date: date, collection: change.ns.coll, operation: change.operationType, documentKey: change.documentKey, updateDescription: change.updateDescription};
                db.collection('updates').insert([newChange],function(err,result){
                    if (err){
                    console.log(err);
                    }
                });
            });
        });
    },
    
    getByType: function (user, type, propertiesObj, sortBy, callback){
            if (user == "public"){
                var collection = db.collection(type+'_public');
            }else{
                var collection = db.collection(type);   
            } 
            collection.find({}).project(propertiesObj).sort(sortBy).toArray(function(err, result){
                    if (err){   
                        console.error(err);
                    }
                    return callback(null, result);
                });                      
    },

    getByCode: function (collection, code, callback){
            db.collection(collection).find({code:code}).toArray(function(err, result){
                if (err){
                    console.error(err);
                    reject(err);
                } else {
                    return callback(result);
                }
            });
    },

    getByQuery: function(collection, query, callback){
            db.collection(collection).find(query).toArray(function(err, result){
                if(err){
                    console.error(err);
                }
                return callback(null, result);
            });
    },

    insertNew: function(collection, insertObj, callback){
            db.collection(collection).insert([insertObj], function(err, result){
                if (err){
                    console.log ("error :"+err);
                    return callback(err);
                } else {
                    callback();
                } 
            })       
    },

    updateByCode: function(collection, code, updateVal, callback){
            db.collection(collection).update({code: code}, {$set: updateVal}, function(err, result){
                if (err){
                    console.log ("error :"+err);
                    return callback(err);
                } else {
                    callback();
                }   
            });
    },

    deleteByCode: function(collection, code, callback){
        db.collection(collection).deleteOne({code: code}, function(err, result){
            if (err){
                console.log ("error :"+err);
                return callback(err);
            } else {
                callback();
            }
        });
    },

    addRelated: (collection, codeUpdate, codePush, field) => {
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
    },

    removeRelated: (collection, codeUpdate, codePush, field) => {
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
            } else if(field == "sources"){
                collection.update({code: codeUpdate}, {$pull: {'sources': codePush}}, function(err, result){
                    if (err) console.log ("error :"+err);
                });      
            }        
    },

    getRelatedProfiles: (result, type) => {
        return new Promise((resolve,reject)=> {
            let relatedParameter = result[0].related[type]; 
            //let relatedProfiles = [];
            if (relatedParameter && relatedParameter != "") {
                if(type=="mps") type = 'missing';
                const promises = relatedParameter.map(e => new Promise((resolve,reject)=> {
                    module.exports.getByCode(type, e, (resultRelated)=> {
                        let relatedProfiles = [];
                        relatedProfiles.push(resultRelated[0]);
                        resolve(relatedProfiles);
                    })
                }))
                resolve(Promise.all(promises));
            }else{
                resolve();
            }
        })
    },

    updateRelated: (oldRelated, newRelated, collection, codePush, field) => {
        if (oldRelated!= newRelated) {
            newRelated.forEach( function (e){
                if((oldRelated).indexOf(e)== -1)module.exports.addRelated(collection, e, codePush, field);
            });
            (oldRelated).forEach( function (e){
                if((newRelated).indexOf(e)== -1)module.exports.removeRelated(collection, e, codePush, field);
            });
        }
    }
};    