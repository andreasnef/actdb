"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        _id:0,'name': 1, 
        code: 1, 
        type: 1, 
        'location.district':1, 
        'location.governorate': 1, 
        'dates.beg': 1, 
        'location.coordinates':1
    },
    
    sortBy: {"name.en":1},

    newEvent: function (form, relEvents, relSites, relLocations, relMPs, contacts, sources, groups){
        let eventnew = {
            "code" : form.code,
            "public": form.public,
            "type" : form.type,
            "name" : {
                "ar" : form.name_ar,
                "en" : form.name_en
            },
            "location" : {
                "place" : form.location_place,
                "district" : form.location_district,
                "governorate" : form.location_governorate,
                "coordinates" : [ (form.location_longitude) ? parseFloat(form.location_longitude): 0
                    , (form.location_latitude) ? parseFloat(form.location_latitude) : 0 ],
                "type" : "Point"
            },
            "UNHCR" : {
                  "latitude" : form.UNHCR_latitude,
                  "longitude" : form.UNHCR_longitude
           },
            "specific" : {
                  "latitude" : form.location_latitude,
                  "longitude" : form.location_longitude
           },
            "dates" : {
                "beg" : common.dateConverter(form.date_beg_day,form.date_beg_month,form.date_beg_year),
                "end" : common.dateConverter(form.date_end_day,form.date_end_month,form.date_end_year)
            },
            "description" : form.description,
            "groups_responsible" : groups,
            "groups_responsible_name" : form.groups_responsible_name,
            "related" : {
                "events" : relEvents,
                "sites" : relSites,
                "locations" :relLocations,
                "mps" : relMPs
            },
            "notes" : form.notes,
            "contacts" : contacts,    
            "sources" : sources
         }
         return eventnew;
    },

    updateEvent: function(profile, form, relEvents, relSites, relLocations, relMPs, contacts, sources, groups){
        let updateVal = {};
        if (profile.public!= form.public) updateVal['public'] =  form.public                                                     
        if (profile.name.ar!= form.name_ar) updateVal['name.ar'] =  form.name_ar
        if (profile.name.en!= form.name_en) updateVal['name.en'] =  form.name_en
        if (profile.type!= form.type) updateVal['type'] =  form.type  
        if (profile.location.place!= form.location_place) updateVal['location.place'] =  form.location_place
        if (profile.location.district!= form.location_district) updateVal['location.district'] =  form.location_district
        if (profile.location.governorate!= form.location_governorate) updateVal['location.governorate'] =  form.location_governorate
        if (profile.specific.latitude && profile.specific.longitude && (profile.specific.latitude!= form.location_latitude || profile.specific.longitude!= form.location_longitude)) {
            updateVal['location.coordinates'] =  [ (form.location_longitude) ? parseFloat(form.location_longitude): 0
                , (form.location_latitude) ? parseFloat(form.location_latitude) : 0 ]
            updateVal['specific.latitude'] =  form.location_latitude
            updateVal['specific.longitude'] =  form.location_longitude
        }
        if (profile.UNHCR.latitude!= form.UNHCR_latitude) updateVal['UNHCR.latitude'] =  form.UNHCR_latitude
        if (profile.UNHCR.longitude!= form.UNHCR_longitude) updateVal['UNHCR.longitude'] =  form.UNHCR_longitude  
        if (profile.dates.beg!= common.dateConverter(form.date_beg_day,form.date_beg_month, form.date_beg_year)) updateVal['dates.beg'] =  common.dateConverter(form.date_beg_day,form.date_beg_month, form.date_beg_year)
        if (profile.dates.end!= common.dateConverter(form.date_end_day,form.date_end_month, form.date_end_year)) updateVal['dates.end'] =  common.dateConverter(form.date_end_day,form.date_end_month, form.date_end_year)
        if (profile.description!=form.description)updateVal['description'] = form.description
        if (profile.groups_responsible!= groups)updateVal['groups_responsible'] = groups
        if (profile.groups_responsible_name!=form.groups_responsible_name)updateVal['groups_responsible_name'] = form.groups_responsible_name
        if (profile.related.events!= relEvents)updateVal['related.events'] = relEvents
        if (profile.related.sites!= relSites)updateVal['related.sites'] = relSites  
        if (profile.related.locations!= relLocations) updateVal['related.locations'] = relLocations
        if (profile.related.mps!= relMPs) updateVal['related.mps'] = relMPs
        if (profile.notes!= form.notes) updateVal['notes'] =  form.notes
        if (profile.contacts!=contacts) updateVal['contacts'] = contacts
        if (profile.sources!=sources) updateVal['sources'] = sources
        return updateVal;
    }
};