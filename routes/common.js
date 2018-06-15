"use strict";
var moment = require('moment');
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
        let date;
        if (year != ""){ 
            if (day == "") day = "01";
            if (month == "") month = "01";
            date = new Date(Date.UTC(year, month-1, day));
        };
        return date;
    },

    ageCalculator: (age, birth_day, birth_month, birth_year, disapp_day, disapp_month, disapp_year) => {
        if(age == "" && birth_year!= "" && disapp_year!= ""){
            birth_day = (birth_day == "") ? "01" : birth_day
            birth_month = (birth_month == "") ? "01" : birth_month
            disapp_day = (disapp_day == "") ? "01" : disapp_day
            disapp_month = (disapp_month == "") ? "01" : disapp_month

            let momDis = moment([parseInt(disapp_year), parseInt(disapp_month), parseInt(disapp_day)])
            let momBirth = moment([parseInt(birth_year), parseInt(birth_month), parseInt(birth_day)])
            return momDis.diff(momBirth, 'year');
        }
    },

    calcLastRecord: (list, type)=> {
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
            
            list.map((doc)=> {
                let letter = doc.code.match(/[a-zA-Z]+|[0-9]+/g)[0]
                let number = parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1])
                if (letter == 'B') barracks.push(number)
                if (letter == 'SB') sbarracks.push(number)
                if (letter == 'IB') ibarracks.push(number)
                if (letter == 'C') checkpoints.push(number)
                if (letter == 'SC') scheckpoints.push(number)
                if (letter == 'IC') icheckpoints.push(number)
                if (letter == 'D') centers.push(number)
                if (letter == 'SD') scenters.push(number)
                if (letter == 'ID') icenters.push(number)
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
            let codes = list.map((doc) => parseInt(doc.code.match(/[a-zA-Z]+|[0-9]+/g)[1]))
            nextrecord = (Math.max.apply(null, codes))+1;
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
