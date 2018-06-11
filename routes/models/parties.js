"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        _id:0, 
        name: 1, 
        code: 1, 
        control_areas:1, 
        color:1
    },
    
    sortBy: {'name.en':1},

    newParty: function(form){
        return partynew = {
            "code" : form.code,
            "name" : {
                "ar" : form.name_ar,
                "en" : form.name_en,
                "alt_name" : form.name_alt_name
            },
            "hq" : {
                "place" : form.hq_place,
                "description" : form.hq_description,
                "coordinates" : [ (form.hq_longitude) ? parseFloat(form.hq_longitude): 0
                    , (form.hq_latitude) ? parseFloat(form.hq_latitude) : 0 ],
                "type" : "Point"
            },
            "control_areas" : form.control_areas,
            "color" : form.color,
            "flag" : {
                  "file" : form.flag_file
           },
            "documents" : form.documents
         };
    },

    updateParty: function(profile, form){
        var updateVal = {};                                                     
        if (profile.name.ar!= form.name_ar) updateVal['name.ar'] =  form.name_ar
        if (profile.name.en!= form.name_en) updateVal['name.en'] =  form.name_en
        if (profile.name.alt_name!= form.name_alt_name) updateVal['name.alt_name'] =  form.name_alt_name
        if (profile.hq.place!= form.hq_place) updateVal['hq.place'] =  form.hq_place
        if (profile.hq.description!= form.hq_description) updateVal['hq.description'] =  form.hq_description
        if (profile.hq.latitude!= form.hq_latitude || profile.hq.longitude!= form.hq_longitude) {
            updateVal['hq.coordinates'] =  [ (form.hq_longitude) ? parseFloat(form.hq_longitude): 0
                , (form.hq_latitude) ? parseFloat(form.hq_latitude) : 0 ]
        }
        if (profile.control_areas!= form.control_areas) updateVal['control_areas'] =  form.control_areas
        if (profile.color!= form.color) updateVal['color'] =  form.color
        
        if (profile.flag.file!= form.flag_file) updateVal['flag.file'] =  form.flag_file
        if (profile.documents!= form.documents) updateVal['documents'] =  form.documents 
        return updateVal;
    }
}