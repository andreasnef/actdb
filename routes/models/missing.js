"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        _id: 0, 
        name: 1, 
        code: 1, 
        "disappearance.place": 1, 
        "disappearance.date": 1, 
        location:1, 
        'itinerary_route':1
    },
    
    sortBy: {"name.ar.last":1},

    newMissing: function (form, relEvents, relSites, relLocations, relMPs, contacts, sources, itinerary_route){
        let missingnew = { 
            code : form.code,
            public : form.public,
            name : {
                ar : {
                    first : form.name_ar_first,
                    middle : form.name_ar_middle,
                    last : form.name_ar_last,
                    alt_name : form.name_ar_alt_name
                },
                en : {
                    first : form.name_en_first,
                    middle : form.name_en_middle,
                    last : form.name_en_last,
                    alt_name : form.name_en_alt_name
                }
            },
            alias : form.alias,
            mothers_name : form.mothers_name,
            sex : form.sex,
            birth : {
                place : form.birth_place,
                date : common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year),
                alt_date : common.dateConverter(form.birth_alt_date_day,form.birth_alt_date_month, form.birth_alt_date_year),
                sejl : form.birth_sejl
            },
            age : common.ageCalculator(form.age, common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year), common.dateConverter(form.disappearance_date_day,form.disappearance_date_month, form.disappearance_date_year)),
            residence : form.residence,
            nationality : form.nationality,
            marital_status : form.marital_status,
            children : form.children,
            profession : form.profession,
            confession : form.confession,
            political_affiliation : form.political_affiliation,
            description : form.description,
            disappearance : {
                date : common.dateConverter(form.disappearance_date_day, form.disappearance_date_month, form.disappearance_date_year),
                alt_date : common.dateConverter(form.disappearance_alt_date_day,form.disappearance_alt_date_month, form.disappearance_alt_date_year),
                place : {
                    en : form.disappearance_place_en,
                    ar : form.disappearance_place_ar,
                    district : form.disappearance_place_district,
                    governorate : form.disappearance_place_governorate,
                    alt_place : form.disappearance_place_alt_place
                },
                location : {
                    latitude : form.disappearance_location_latitude,
                    longitude : form.disappearance_location_longitude
                },
                circumstances : form.disappearance_circumstances
            },
            last_seen : {
                reported : form.last_seen_reported,
                location : form.last_seen_location,
                country : form.last_seen_country,
                date : common.dateConverter(form.last_seen_date_day, form.last_seen_date_month, form.last_seen_date_year)
            },
            itinerary : form.itinerary,
            itinerary_route : itinerary_route,
            perpetrators : form.perpetrators,
            perpetrators_name : form.perpetrators_name,
            related : {
                events : relEvents,
                sites : relSites,
                locations : relLocations,
                mps : relMPs
            },
            fate : form.fate,
            notes : form.notes,
            sources : sources,
            contacts : contacts,
            location : {
                coordinates : [ (form.disappearance_location_longitude) ? parseFloat(form.disappearance_location_longitude): 0
                    , (form.disappearance_location_latitude) ? parseFloat(form.disappearance_location_latitude) : 0 ],
                type : "Point"
            },
            fushatamal : {
                published : form.fushatamal_published,
                url : form.fushatamal_url
            }
        }
        return missingnew; 
    },
    
    updateMissing: function (profile, form, relEvents, relSites, relLocations, relMPs, contacts, sources, itinerary_route){
        let updateVal = {};                                                     
        if (profile.public!= form.public) updateVal['public'] =  form.public
        if (profile.name.ar.first!= form.name_ar_first) updateVal['name.ar.first'] =  form.name_ar_first
        if (profile.name.ar.middle!= form.name_ar_middle) updateVal['name.ar.middle'] =  form.name_ar_middle
        if (profile.name.ar.last!= form.name_ar_last) updateVal['name.ar.last'] =  form.name_ar_last
        if (profile.name.ar.alt_name!= form.name_ar_alt_name) updateVal['name.ar.alt_name'] =  form.name_ar_alt_name
        if (profile.name.en.first!= form.name_en_first) updateVal['name.en.first'] =  form.name_en_first
        if (profile.name.en.middle!= form.name_en_middle) updateVal['name.en.middle'] =  form.name_en_middle
        if (profile.name.en.last!= form.name_en_last) updateVal['name.en.last'] = form.name_en_last
        if (profile.name.en.alt_name!= form.name_en_alt_name) updateVal['name.en.alt_name'] = form.name_en_alt_name 
        if (profile.alias!= form.alias) updateVal['alias'] =  form.alias
        if (profile.mothers_name!= form.mothers_name) updateVal['mothers_name'] = form.mothers_name 
        if (profile.sex!= form.sex) updateVal['sex'] =  form.sex  
        if (profile.birth.place!= form.birth_place) updateVal['birth.place'] =  form.birth_place
        if (profile.birth.date!= common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year)) updateVal['birth.date'] =  common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year)
        if (profile.birth.alt_date!= common.dateConverter(form.birth_alt_date_day,form.birth_alt_date_month, form.birth_alt_date_year)) updateVal['birth.alt_date'] =  common.dateConverter(form.birth_alt_date_day,form.birth_alt_date_month, form.birth_alt_date_year)
        if (profile.birth.sejl!= form.birth_sejl) updateVal['birth.sejl'] =  form.birth_sejl   
        if (profile.age!= form.age) updateVal['age'] =  ageCalculator(form.age,common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year))
        if (profile.residence!= form.residence) updateVal['residence'] =  form.residence
        if (profile.nationality!= form.nationality) updateVal['nationality'] =  form.nationality
        if (profile.marital_status!= form.marital_status) updateVal['marital_status'] =  form.marital_status
        if (profile.children!= form.children) updateVal['children'] =  form.children
        if (profile.profession!= form.profession) updateVal['profession'] =  form.profession
        if (profile.confession!= form.confession) updateVal['confession'] =  form.confession
        if (profile.political_affiliation!= form.political_affiliation) updateVal['political_affiliation'] =  form.political_affiliation
        if (profile.description!= form.description) updateVal['description'] =  form.description
        if (profile.disappearance.date!= common.dateConverter(form.disappearance_date_day,form.disappearance_date_month, form.disappearance_date_year)) updateVal['disappearance.date'] =  common.dateConverter(form.disappearance_date_day,form.disappearance_date_month, form.disappearance_date_year)
        if (profile.disappearance.alt_date!= common.dateConverter(form.disappearance_alt_date_day,form.disappearance_alt_date_month, form.disappearance_alt_date_year)) updateVal['disappearance.alt_date'] =  common.dateConverter(form.disappearance_alt_date_day,form.disappearance_alt_date_month, form.disappearance_alt_date_year)
        if (profile.disappearance.place.en!= form.disappearance_place_en) updateVal['disappearance.place.en'] =  form.disappearance_place_en
        if (profile.disappearance.place.ar!= form.disappearance_place_ar) updateVal['disappearance.place.ar'] =  form.disappearance_place_ar
        if (profile.disappearance.place.district!= form.disappearance_place_district) updateVal['disappearance.place.district'] =  form.disappearance_place_district
        if (profile.disappearance.place.governorate!= form.disappearance_place_governorate) updateVal['disappearance.place.governorate'] =  form.disappearance_place_governorate
        if (profile.disappearance.place.alt_place!= form.disappearance_place_alt_place) updateVal['disappearance.place.alt_place'] =  form.disappearance_place_alt_place
        if (profile.disappearance.location.latitude!= form.disappearance_location_latitude || profile.disappearance.location.longitude!= form.disappearance_location_longitude) {
            updateVal['location.coordinates'] =  [(form.disappearance_location_longitude) ? parseFloat(form.disappearance_location_longitude): 0
                , (form.disappearance_location_latitude) ? parseFloat(form.disappearance_location_latitude) : 0]
            updateVal['disappearance.location.latitude'] =  form.disappearance_location_latitude
            updateVal['disappearance.location.longitude'] =  form.disappearance_location_longitude
        }  
            
        if (profile.disappearance.circumstances!= form.disappearance_circumstances) updateVal['disappearance.circumstances'] =  form.disappearance_circumstances
        if (profile.last_seen.reported!= form.last_seen_reported) updateVal['last_seen.reported'] =  form.last_seen_reported
        if (profile.last_seen.location!= form.last_seen_location) updateVal['last_seen.location'] =  form.last_seen_location
        if (profile.last_seen.country!= form.last_seen_country) updateVal['last_seen.country'] =  form.last_seen_country 
        if (profile.last_seen.date!= common.dateConverter(form.last_seen_date_day,form.last_seen_date_month, form.last_seen_date_year)) updateVal['last_seen.date'] =  common.dateConverter(form.last_seen_date_day,form.last_seen_date_month, form.last_seen_date_year)
        if (profile.itinerary!= form.itinerary) updateVal['itinerary'] =  form.itinerary
        if (profile.itinerary_route != itinerary_route) updateVal['itinerary_route'] = itinerary_route
        if (profile.perpetrators!= form.perpetrators) updateVal['perpetrators'] =  form.perpetrators
        if (profile.perpetrators_name!= form.perpetrators_name) updateVal['perpetrators_name'] =  form.perpetrators_name
        if (profile.related.events!= relEvents)updateVal['related.events'] = relEvents
        if (profile.related.sites!= relSites)updateVal['related.sites'] = relSites  
        if (profile.related.locations!= relLocations) updateVal['related.locations'] = relLocations
        if (profile.related.mps!= relMPs) updateVal['related.mps'] = relMPs
        if (profile.fate!= form.fate) updateVal['fate'] =  form.fate
        if (profile.notes!= form.notes) updateVal['notes'] =  form.notes
        if (profile.sources!= sources) updateVal['sources'] =  sources
        if (profile.fushatamal.published != form.fushatamal_published) updateVal['fushatamal.published'] = form.fushatamal_published
        if (profile.fushatamal.url != form.fushatamal_url) updateVal['fushatamal.url'] = form.fushatamal_url
        if (profile.contacts!=contacts) updateVal['contacts'] = contacts
        return updateVal;
    },

    advancedSearch: function(form){
        let query = {};
        
        let fromDay = form.from_disappearance_date_day;
        let fromMonth = form.from_disappearance_date_month;
        let fromYear = form.from_disappearance_date_year;
        let toDay = form.to_disappearance_date_day;
        let toMonth = form.to_disappearance_date_month;
        let toYear = form.to_disappearance_date_year;
        
        //search by date of disappearance
        if (fromYear) query["disappearance.date"] = {"$gte": new Date(fromYear+"-"+fromMonth+"-"+fromDay+"T00:00:00.000Z"), "$lte": new Date(toYear+"-"+toMonth+"-"+toDay+"T00:00:00.000Z")}
        //search by district
        if (form.disappearance_place_district) query['disappearance.place.district'] = form.disappearance_place_district
        //search by governorate
        if (form.disappearance_place_governorate) query['disappearance.place.governorate'] = form.disappearance_place_governorate
        //search by distance to coordinate
        if (form.meters && form.latitude && form.longitude) query['location.coordinates'] = {$near: {$geometry: {type: 'Point', coordinates : [parseFloat(form.longitude) , parseFloat(form.latitude)]}, $maxDistance: parseFloat(form.meters)}}
        //search by sex
        if (form.sex) query['sex'] = form.sex
        //search by keyword
        if (form.keyword) query['$text'] = { $search: form.keyword}
        //search by age
        if (form.age_from && form.age_to) query['age'] = {$gte: form.age_from, $lt:form.age_to}
        //search by last seen
        if (form.last_seen_reported) query['last_seen.reported'] = form.last_seen_reported
        //search by perpetrator
        if (form.perpetrators) query['perpetrators'] = form.perpetrators
        //search by fate
        if (form.fate) query['fate'] = form.fate
        //search by related event
        if (form.related_event) query['related.events'] = form.related_event
        //search by related location
        if (form.related_location) query['related.locations'] = form.related_location
        //search by related site
        if (form.related_site) query['related.sites'] = form.related_site
        //search by published
        if (form.fushatamal_published) query['fushatamal.published'] = form.fushatamal_published

        return query;
    }
};