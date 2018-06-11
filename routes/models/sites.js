"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        _id:0,
        name: 1, 
        code: 1, 
        'location.district':1,
        'location.governorate':1, 
        'exhumed.status': 1, 
        'location.coordinates':1
    },

    sortBy: {
        'location.governorate':1, 
        'location.district':1, 
        'name.en': 1
    },

    newSite: function (form, relEvents, relSites, relLocations, relMPs, contacts, sources){
        return sitenew = {
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
            "related" : {
                "events" : relEvents,
                "sites" : relSites,
                "locations" :relLocations,
                "mps" : relMPs
            },
            "perpetrators" : form.perpetrators,
            "perpetrators_name" : form.perpetrators_name,
            "number_expected" : form.number_expected,
            "risk" : {
                      "index" : form.risk_index,
                      "reasons" : form.risk_reasons
            },
            "sensitivity" : {
                      "index" : form.sensitivity_index,
                      "reasons" : form.sensitivity_reasons
            },
            "credibility" : {
                      "index" : form.credibility_index,
                      "reasons" : form.credibility_reasons
            },
            "exhumed" : {
                        "status" : form.exhumed_status,
                        "date" : common.dateConverter(form.exhumed_date_day, form.exhumed_date_month, form.exhumed_date_year),
                        "number" : form.exhumed_number,
                        "contact" : form.exhumed_contact,
                        "notes" : form.exhumed_notes
            },
            "identification" : {
                "status" : form.identification_status,
                "date" : common.dateConverter(form.identification_date_day, form.identification_date_month, form.identification_date_year),
                "number" : form.identification_number,
                "notes" : form.identification_notes,
                "dna" : form.identification_dna
            },
            "contacts" : contacts,
            "sources" : sources,
            "notes" : form.notes,
         };

    },

    updateSite : function(profile, form, relEvents, relSites, relLocations, relMPs, contacts, sources){
        var updateVal = {};                                                     
        if (profile.name.ar!= form.name_ar) updateVal['name.ar'] =  form.name_ar
        if (profile.name.en!= form.name_en) updateVal['name.en'] =  form.name_en
        if (profile.public!= form.public) updateVal['public'] = form.public
        if (profile.location.place!= form.location_place) updateVal['location.place'] =  form.location_place
        if (profile.location.district!= form.location_district) updateVal['location.district'] =  form.location_district
        if (profile.location.governorate!= form.location_governorate) updateVal['location.governorate'] =  form.location_governorate
        if (profile.location.latitude!= form.location_latitude || profile.location.longitude!= form.location_longitude) {
            updateVal['location.coordinates'] =  [ (form.location_longitude) ? parseFloat(form.location_longitude): 0
                , (form.location_latitude) ? parseFloat(form.location_latitude) : 0 ]
            updateVal['specific.latitude'] =  form.location_latitude
            updateVal['specific.longitude'] =  form.location_longitude
        }
        if (profile.UNHCR.latitude!= form.UNHCR_latitude) updateVal['UNHCR.latitude'] =  form.UNHCR_latitude
        if (profile.UNHCR.longitude!= form.UNHCR_longitude) updateVal['UNHCR.longitude'] =  form.UNHCR_longitude  
        if (profile.dates.beg!= common.dateConverter(form.date_beg_day,form.date_beg_month, form.date_beg_year)) updateVal['dates.beg'] =  common.dateConverter(form.date_beg_day,form.date_beg_month, form.date_beg_year)
        if (profile.dates.end!= common.dateConverter(form.date_end_day,form.date_end_month, form.date_end_year)) updateVal['dates.end'] =  common.dateConverter(form.date_end_day,form.date_end_month, form.date_end_year)
        if (profile.description!= form.description) updateVal['description'] = form.description
        if (profile.type!= form.type) updateVal['type'] =  form.type
        if (profile.related.events!= relEvents) updateVal['related.events'] = relEvents
        if (profile.related.sites!= relSites) updateVal['related.sites'] = relSites  
        if (profile.related.locations!= relLocations) updateVal['related.locations'] = relLocations
        if (profile.related.mps!= relMPs) updateVal['related.mps'] = relMPs
        if (profile.perpetrators!= form.perpetrators) updateVal['perpetrators'] =  form.perpetrators
        if (profile.perpetrators_name!= form.perpetrators_name) updateVal['perpetrators_name'] = form.perpetrators_name
        if (profile.number_expected!= form.number_expected) updateVal['number_expected'] =  form.number_expected
        if (profile.risk.index!= form.risk_index) updateVal['risk.index'] =  form.risk_index
        if (profile.risk.reasons!= form.risk_reasons) updateVal['risk.reasons'] =  form.risk_reasons  
        if (profile.sensitivity.index!= form.sensitivity_index) updateVal['sensitivity.index'] =  form.sensitivity_index
        if (profile.sensitivity.reasons!= form.sensitivity_reasons) updateVal['sensitivity.reasons'] =  form.sensitivity_reasons
        if (profile.credibility.index!= form.credibility_index) updateVal['credibility.index'] =  form.credibility_index
        if (profile.credibility.reasons!= form.credibility_reasons) updateVal['credibility.reasons'] =  form.credibility_reasons
        if (profile.exhumed.status!= form.exhumed_status) updateVal['exhumed.status'] =  form.exhumed_status
        if (profile.exhumed.date!= common.dateConverter(form.exhumed_date_day,form.exhumed_date_month, form.exhumed_date_year)) updateVal['exhumed.date'] =  common.dateConverter(form.exhumed_date_day,form.exhumed_date_month,form.exhumed_date_year)
        if (profile.exhumed.number!= form.exhumed_number) updateVal['exhumed.number'] =  form.exhumed_number
        if (profile.exhumed.contact!= form.exhumed_contact) updateVal['exhumed.contact'] =  form.exhumed_contact
        if (profile.exhumed.notes!= form.exhumed_notes) updateVal['exhumed.notes'] =  form.exhumed_notes
        if (!profile.identification || profile.identification.status!=form.identification_status) updateVal['identification.status'] =  form.identification_status
        if (!profile.identification || profile.identification.date!= common.dateConverter(form.identification_date_day,form.identification_date_month, form.identification_date_year)) updateVal['identification.date'] =  common.dateConverter(form.identification_date_day,form.identification_date_month,form.identification_date_year)
        if (!profile.identification || profile.identification.number!=form.identification_number)updateVal['identification.number'] =  form.identification_number
        if (!profile.identification || profile.identification.notes!=form.identification_notes)updateVal['identification.notes'] =  form.identification_notes
        if (!profile.identification || profile.identification.dna!=form.identification_dna)updateVal['identification.dna'] =  form.identification_dna
        if (profile.sources!= sources) updateVal['sources'] = sources
        if (profile.contacts!=contacts) updateVal['contacts'] = contacts
        if (profile.notes!= form.notes) updateVal['notes'] =  form.notes 
        return updateVal;
    },

    advancedSearch: function(form){
        let query = {};
        
        //search by district
        if (form.location_district) query['location.district'] = form.location_district
        //search by governorate
        if (form.location_governorate) query['location.governorate'] = form.location_governorate
        //search by distance to coordinate
        if (form.meters && form.latitude && form.longitude) query['location.coordinates'] = {$near: {$geometry: {type: 'Point', coordinates : [parseFloat(form.longitude) , parseFloat(form.latitude)]}, $maxDistance: parseFloat(form.meters)}}
        //search by type
        if (form.type) query['type'] = form.type
        //search by Risk of Destruction
        if (form.risk_index) query['risk.index'] = form.risk_index
        //search by Sensitivity
        if (form.sensitivity_index) query['sensitivity.index'] = form.sensitivity_index
        //Search by credibility
        if (form.credibility_index) query['credibility.index'] = form.credibility_index
        //search by exhumation
        if (form.exhumed_status) query['exhumed.status'] = form.exhumed_status
        //search by identification
        if (form.identification_status) query['identification.status'] = form.identification_status
        //search by keyword
        if (form.keyword) query['$text'] = { $search: form.keyword}
        //search by perpetrator
        if (form.perpetrators) query['perpetrators'] = form.perpetrators
        //search by related event
        if (form.related_event) query['related.events'] = form.related_event
        //search by related location
        if (form.related_location) query['related.locations'] = form.related_location
        //search by related mps
        if (form.related_mps) query['related.mps'] = form.related_mps
        return query;
    }
}