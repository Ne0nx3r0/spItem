const spItem = require('./spItem.js');
const jQuery = require('./lib/jquery-1.11.3.js');
const SPServices = require('./lib/jquery.SPServices.js');

class spDataService{
    create(options){
        let o = $.extend({
            model:undefined,//required
        },options);

        let d = $.Deferred();

        let valuePairs = this._getValuePairs();

        

        return d.promise();
    }

    getAll(options){

    }

    getById(options){

    }

    update(options){

    }

    upload(options){

    }

    checkIn(options){
        
    }

    delete(options){

    }

    _getValuePairs(spModel){
        let valuePairs = [];

        spModel.keySeq().forEach(function(key){
            let val = spModel.get(key);

            if(val){
                valuePairs.push([key,val]);
            }
        });

        return valuePairs;
    }
}

