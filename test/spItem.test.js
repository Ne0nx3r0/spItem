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
            siteUrl: 'http://localhost/siteUrl/',
            listName: 'Announcements'
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

        expect(spAnnouncement).toBeDefined();
    });

    it('should allow subclass instances',()=>{
        let announcement = new spAnnouncement({ID:42});

        //overwritten by spAnnouncement
        expect(announcement.get('Title')).toEqual('Untitled');

        //from spItem
        expect(announcement.get('ID')).toEqual(42);
    });//it

    it('should provide list info from instances',()=>{
        let announcement = new spAnnouncement();

        expect(announcement.getSiteUrl()).toEqual('http://localhost/siteUrl/');
        expect(announcement.getListName()).toEqual('Announcements');
    });//it

    it('should allow subclasses to overwrite parent list info',()=>{
        class spOverwritten extends spBase({
            parent: spAnnouncement,
            siteUrl: 'http://localhost/mySiteUrl/',
            listName: undefined
        }){}

        let announcement = new spOverwritten();

        expect(announcement.getSiteUrl()).toEqual('http://localhost/mySiteUrl/');
        expect(announcement.getListName()).toEqual(undefined);
    });//it
});//describe

const spDocument = spi.spDocument;

describe('spDocument',()=>{
    it('should instantiate',()=>{
        expect(new spDocument()).toBeDefined();
    });//it

    it('should allow getting the filename',()=>{
        const document = new spDocument({
            FileLeafRef: 'filler;#someFile.txt'
        });

        expect(document.getFileName()).toEqual('someFile.txt');
    });//it

    it('should allow getting the file url',()=>{
        const document = new spDocument({
            FileRef: {
                lookupValue:'someSite/someFile.txt'
            }
        });

        expect(document.getFileUrl()).toEqual('/someSite/someFile.txt');
    });//it
});//describe