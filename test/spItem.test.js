"use strict";

const spi = require('../spItem.js');
const spItem = spi.spItem;
const spBase = spi.spBase;

const Testy = require('./testy.js');
const describe = Testy.describe;
const it = Testy.it;
const expect = Testy.expect;

describe('spBase',()=>{
    let spAnnouncement;

    it('should be extensible',()=>{
        spAnnouncement = class _spAnnouncement extends spBase({
            parent: spItem,
            fields:{
                'Title': 'Untitled',
                'Body': undefined,
                'Teaser': undefined
            },
            siteUrl: undefined,
            listName: undefined
        }){
            getTeaser(){
                let teaser = this.get('Teaser');

                if(teaser){
                    return teaser;
                }
                else{
                    return this.get('Body').substr(0,100)+'...';
                }
            }
        }//extends spBase

        let announcement = new spAnnouncement();

        expect(announcement.get('Title')).toBe('Untitled');
        expect(announcement.get('ID')).toBe(undefined);
    });//it

    
});//describe

/*
new Testy().describe('spItem',()=>{
    const spAnnouncement; 

    



}).done();

let announcement = new spi.spItem({
    ID: 42,
    Body:'Test body'
});

testy.assert(
    'field property set',
    testItem1.get('ID'),
    42
);

testy.assert(
    'removing property sets to undefined',
    testItem1.remove('ID').get('ID'),
    undefined
);

testy.assert(
    'After removing property original untouched',
    testItem1.get('ID'),
    42
);

testy.done();*/