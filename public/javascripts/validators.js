function dateToIsoDate(day,month,year){
   var isodate = new Date("'"+year+"-"+month+"-"+day"'").toISOString();
   return isodate;
}