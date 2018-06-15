var assert = require('chai').assert;
var expect = require('chai').expect;
var common = require('../routes/common.js');

describe('dateConverter', function(){
    it('should return the date in Date format', function(){
        let date = common.dateConverter("01", "01", "1980");
        expect(date).to.be.a('date');
    })

    it('should return first day of the year if only year is passed', function(){
        let date = common.dateConverter("","","1980").getTime();
        assert.equal(date, new Date(Date.UTC("1980", "00", "01")).getTime());
    })
})

describe('ageCalculator', function(){
    it('should return the correct age at disappearance', function(){
        let age = common.ageCalculator("", "", "", "1983", "", "", "2018");
        assert.equal(35, age);
    })
})

describe('calcLastRecord', function(){
    it('should return the next record for by type', function(){
        let nextrecord = common.calcLastRecord([{code: "MP1"},{code: "MP2"}], 'missing');
        assert.equal(3, nextrecord);
    })

    it('should return an array of next codes when the type is locations', function(){
        let nextrecords = common.calcLastRecord([{code: "IB1"},{code: "B1"}, {code: "SB1"}, {code: "D1"}, {code: "ID1"}, {code: "SD1"}, {code: "C1"}, {code: "IC1"}, {code: "SC1"} ], 'locations');
        assert.deepEqual(["B2", "SB2", "IB2", "C2", "SC2", "IC2", "D2", "SD2", "ID2"], nextrecords);
    })
})