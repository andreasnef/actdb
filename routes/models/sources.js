"use strict";
const common = require('../common.js');

module.exports = {
    propertiesObj: {
        code: 1, 
        type:1, 
        subtype:1, 
        source_title:1, 
        file: 1
    },

    sortBy: {'code':1},

    newSource: function(form, relEvents, relSites, relLocations, relMPs, sources, attendantContacts, intervieweeContacts, filesList){
        let sourcenew = {
            "code" : form.code,
            "type": form.type,
            "subtype": form.subtype,
            "name": form.name,
            "location" : form.location,
            "date" : common.dateConverter(form.date_day,form.date_month, form.date_year),
            "source_title" : form.source_title,
            "focus" : form.focus,
            "related" : {
                "events" : relEvents,
                "sites" : relSites,
                "locations" :relLocations,
                "mps" : relMPs,
                "sources" : sources
            },
            "attendant": {
                "name": form.attendant_name,
                "contacts": attendantContacts,
            },
            "interviewee": {
                "name": form.interviewee_name,
                "contacts": intervieweeContacts,
            },
            "interviewer" : form.interviewer,
            "number" : form.number,
            "author" : form.author,
            "publication" : form.publication,
            "duration" : form.duration,
            "production" : form.production,
            "notes": form.notes,
            "files" : filesList
        };
        return sourcenew;
    },

    updateSource: function(profile, form, relEvents, relSites, relLocations, relMPs, sources, attendantContacts, intervieweeContacts, filesList, uploadError){
        var updateVal = {};                                                     
        if (profile.type!= form.type) updateVal['type'] =  form.type
        if (profile.subtype!= form.subtype) updateVal['subtype'] =  form.subtype
        if (profile.name!= form.name) updateVal['name'] =  form.name
        if (profile.location!= form.location) updateVal['location'] =  form.location
        if (profile.date!= common.dateConverter(form.date_day,form.date_month, form.date_year)) updateVal['date'] =  common.dateConverter(form.date_day,form.date_month, form.date_year)
        if (profile.source_title!= form.source_title) updateVal['source_title'] =  form.source_title
        if (profile.focus!= form.focus) updateVal['focus'] =  form.focus
        if (profile.related.events!= relEvents)updateVal['related.events'] = relEvents
        if (profile.related.sites!= relSites)updateVal['related.sites'] = relSites  
        if (profile.related.locations!= relLocations) updateVal['related.locations'] = relLocations
        if (profile.related.mps!= relMPs) updateVal['related.mps'] = relMPs
        if (profile.related.sources!= sources) updateVal['related.sources'] = sources
        if (profile.attendant && (profile.attendant.name!= form.attendant_name)) updateVal['attendant.name'] =  form.attendant_name
        if (profile.attendant && (profile.attendant.contacts!= attendantContacts)) updateVal['attendant.contacts'] =  attendantContacts
        if (profile.interviewee && (profile.interviewee.name!= form.interviewee_name)) updateVal['interviewee.name'] =  form.interviewee_name
        if (profile.interviewer!= form.interviewer) updateVal['interviewer'] =  form.interviewer
        if (profile.interviewee && (profile.interviewee.contacts!= intervieweeContacts)) updateVal['interviewee.contacts'] =  intervieweeContacts
        if (profile.number!= form.number) updateVal['number'] =  form.number
        if (profile.author!= form.author) updateVal['author'] =  form.author
        if (profile.publication!= form.publication) updateVal['publication'] =  form.publication
        if (profile.duration!= form.duration) updateVal['duration'] =  form.duration
        if (profile.production!= form.production) updateVal['production'] =  form.production
        if (profile.notes!= form.notes) updateVal['notes'] =  form.notes
        if (filesList.length>0 && !uploadError) {
            var oldFiles = profile.files;
            if (!oldFiles) oldFiles = [];
            filesList.forEach(function(f) {
                oldFiles.push(f)
            });
            updateVal['files'] =  oldFiles    
        }
        return updateVal; 
    }
}