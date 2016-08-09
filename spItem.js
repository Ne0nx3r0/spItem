"use strict";

const Immutable = require('./immutable.js');

const spBase = function(o) {
	let fieldMap = {};

	if(o.parentClass){
		let temp = new o.parentClass();
		
		if(temp._fieldMap){
			fieldMap = temp._fieldMap;
		}
	}

	if(o.fields){
		for(const p in o.fields){
			fieldMap[p] = o.fields[p];
		}
	}

	class _spBase extends Immutable.Record(fieldMap){
		getSiteUrl(){
			// Warn if the class doesn't properly implement site url
			if(!this._siteUrl){
				console.error(this.constructor.name+' does not implement siteUrl');
			}
			return this._siteUrl;
		}

		getListName(){
			// Warn if the class doesn't properly implement list name
			if(!this._listName){
				console.error(this.constructor.name+' does not implement listName');
			}
			return this._listName;
		}
	}

	//keep a copy of the fieldMap on the prototype for classes that extend this one
	_spBase.prototype._fieldMap = fieldMap;

	if(o.siteUrl) _spBase.prototype._siteUrl = o.siteUrl;
	if(o.listName) _spBase.prototype._listName = o.listName;

	return _spBase;
}

class spItem extends spBase({
	parentClass: undefined,
	fields:{
		'ID': undefined,
		'Title': undefined,
		'Created': undefined,
		'Author': undefined,
		'Modified': undefined,
		'Editor': undefined,
		'BaseName': undefined
	},
	siteUrl: undefined,
	listName: undefined
}){
	getId(){
		return this.get('ID');
	}
}

class spDocument extends spBase({
	parentClass: spItem,
	fields:{
		'FileLeafRef':undefined,
		'FileRef':undefined,
		'Created_x0020_Date':undefined,
		'Last_x0020_Modified':undefined
	},
	siteUrl: undefined,
	listName: undefined
}){
	getFileName(){
		let fileLeafRef = this.get('FileLeafRef');

		if(fileLeafRef){
			return fileLeafRef.split(';#')[1];
		}
	}

	getFileUrl(){
		let fileRef = this.get('FileRef');

		if(fileRef){
			return '/'+fileRef.lookupValue;
		}
	}
}