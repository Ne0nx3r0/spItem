"use strict";

const spi = require('../spItem.js');
const Testy = require('./testy.js');

class spAnnouncement extends spi.spBase({
	parent: spItem,
	fields:{
        'Title': 'Untitled',
		'Body': undefined,
        'Teaser': undefined
	},
	siteUrl: undefined,
	listName: undefined
}){

}

let testItem1 = new spi.spItem({
    ID: 42,
    Title: 'Test Item'
});

let testy = new Testy();

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

testy.done();