"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        name: 1, 
        code: 1, 
        confidential:1, 
        category: 1, 
        phone_1: 1, 
        phone_2: 1
    },

    sortBy: {'name.en':1},

    newContact: function(form, relEvents, relSites, relLocations, relMPs, sources){
        let contactnew = {
            "code" : form.code,
            "confidential": form.confidential,
            "category": form.category,
            "name" : {
                "ar" : {
                    "first" : form.name_ar_first,
                    "last" : form.name_ar_last
                },
                "en" : {
                    "first" : form.name_en_first,
                    "last" : form.name_en_last
                }
            },
            "alias" : form.alias,
            "fathers_name" : form.fathers_name,
            "mothers_name" : form.mothers_name,
            "sex" : form.sex,
            "birth" : {
                "place" : form.birth_place,
                "date" : common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year)
            },
            "residence" : form.residence,
            "district": form.district,
            "governorate" : form.governorate,
            "nationality" : form.nationality,
            "profession" : form.profession,
            "status_war": form.status_war,
            "relationship_missing" : form.relationship_missing,
            "political_affiliation": form.political_affiliation,
            "area_present" : form.area_present,
            "languages": form.languages,
            "related" : {
                "events" : relEvents,
                "sites" : relSites,
                "locations" :relLocations,
                "mps" : relMPs
            },
            "sources" : sources,
            "phone_1" : form.phone_1,
            "phone_2" : form.phone_2,
            "email" : form.email,
            "preferred_channel": form.preferred_channel,
            "icrc" : form.icrc,
            "family_associations" : form.family_associations,
            "contacted_act" : form.contacted_act,
            "notes" : form.notes
         };
         return contactnew;
    },

    updateContact: function(profile, form, relEvents, relSites, relLocations, relMPs, sources){
        var updateVal = {};                                                     
        if (profile.confidential!= form.confidential) updateVal['confidential'] =  form.confidential
        if (profile.name.ar.first!= form.name_ar_first) updateVal['name.ar.first'] =  form.name_ar_first
        if (profile.name.ar.last!= form.name_ar_last) updateVal['name.ar.last'] =  form.name_ar_last
        if (profile.name.en.first!= form.name_en_first) updateVal['name.en.first'] =  form.name_en_first
        if (profile.name.en.last!= form.name_en_last) updateVal['name.en.last'] =  form.name_en_last
        if (profile.alias!= form.alias) updateVal['alias'] =  form.alias
        if (profile.fathers_name!= form.fathers_name) updateVal['fathers_name'] =  form.fathers_name
        if (profile.mothers_name!= form.mothers_name) updateVal['mothers_name'] =  form.mothers_name
        if (profile.sex!= form.sex) updateVal['sex'] =  form.sex
        if (profile.birth.place!= form.birth_place) updateVal['birth.place'] =  form.birth_place
        if (profile.birth.date!= common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year)) updateVal['birth.date'] =  common.dateConverter(form.birth_date_day,form.birth_date_month, form.birth_date_year)
        if (profile.residence!= form.residence) updateVal['residence'] =  form.residence
        if (profile.district!= form.district) updateVal['district'] =  form.district
        if (profile.governorate!= form.governorate) updateVal['governorate'] =  form.governorate
        if (profile.nationality!= form.nationality) updateVal['nationality'] =  form.nationality
        if (profile.profession!= form.profession) updateVal['profession'] =  form.profession
        if (profile.status_war!= form.status_war) updateVal['status_war'] =  form.status_war
        if (profile.relationship_missing!= form.relationship_missing) updateVal['relationship_missing'] =  form.relationship_missing
        if (profile.political_affiliation!= form.political_affiliation) updateVal['political_affiliation'] =  form.political_affiliation
        if (profile.area_present!= form.area_present) updateVal['area_present'] =  form.area_present
        if (profile.languages!= form.languages) updateVal['languages'] =  form.languages
        if (profile.related.events!= relEvents)updateVal['related.events'] = relEvents
        if (profile.related.sites!= relSites)updateVal['related.sites'] = relSites  
        if (profile.related.locations!= relLocations) updateVal['related.locations'] = relLocations
        if (profile.related.mps!= relMPs) updateVal['related.mps'] = relMPs
        if (profile.sources!= form.sources) updateVal['sources'] =  sources
        if (profile.phone_1!= form.phone_1) updateVal['phone_1'] =  form.phone_1
        if (profile.phone_2!= form.phone_2) updateVal['phone_2'] =  form.phone_2
        if (profile.email!= form.email) updateVal['email'] =  form.email
        if (profile.preferred_channel!= form.preferred_channel) updateVal['preferred_channel'] =  form.preferred_channel
        if (profile.icrc!= form.icrc) updateVal['icrc'] =  form.icrc
        if (profile.family_associations!= form.family_associations) updateVal['family_associations'] =  form.family_associations
        if (profile.contacted_act!= form.contacted_act) updateVal['contacted_act'] =  form.contacted_act
        if (profile.notes!= form.notes) updateVal['notes'] =  form.notes
        return updateVal;
    },

    advancedSearch: function(form){
        let query = {};
        //search by confidential
        if (form.confidential) query['disappearance.confidential'] = form.confidential
        //search by category
        if (form.category) query['disappearance.category'] = form.category
        //search by sex
        if (form.sex) query['sex'] = form.sex
        //search by keyword
        if (form.keyword) query['$text'] = { $search: form.keyword}
        //search by related event
        if (form.related_event) query['related.events'] = form.related_event
        //search by related location
        if (form.related_location) query['related.locations'] = form.related_location
        //search by related site
        if (form.related_site) query['related.sites'] = form.related_site
        //search by related mps
        if (form.related_mps) query['related.mps'] = form.related_mps
        //search by icrc
        if (form.icrc) query['icrc'] = form.icrc
        //search by contacted by ACT
        if (form.contacted_act) query['contacted_act'] = form.contacted_act
        return query;
    }
}