"use strict";
var multer  = require('multer');
var fs = require("fs");
var bodyParser = require('body-parser');
var cloudinary = require('cloudinary');
cloudinary.config({ 
    cloud_name: 'hxxbdvyzc', 
    api_key: '971837284457376', 
    api_secret: 'q__oUqJiwGAcJhDoYl3zaQjEPx4'
});
var relPath = __dirname +"/../public/files/";
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, relPath)      //you tell where to upload the files,
    }
})
var upload = multer({ storage : storage}).any();

module.exports = {

    dateConverter: (day, month, year) => {
        var date;
        if (year != ""){ 
            if (day == ""){day = "01"};
            if (month == "") {month = "01"};
            date = new Date(Date.UTC(year, month-1, day));
        };
        return date;
    },

    ageCalculator: (age, birth, disapp) => {
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
        
    },

    calcLastRecord: (list, type)=> {
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
                if(doc.code){
                 number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                 numbers.push(number);
                } else{
                 console.log("ERROR in record "+JSON.stringify(doc)+" Code missing");   
                }
            })
            nextrecord = (Math.max.apply(null, numbers))+1;
            return nextrecord;             
                         
        }
        return nextrecord;
    },

    uploadFile: (req, res, callback) => {
        let filesList = [];
        let uploadError;
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
                        });  
                    });
                });    
                return callback(filesList, uploadError);    
            }
        });
    }
};

function renameFile (files, relPath, code, callback) {
    let newName;
    let filesArray = [];
    files.forEach((f) => {
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
