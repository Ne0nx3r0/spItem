const spItem = require('./spItem.js');
const jQuery = require('./lib/jquery-1.11.3.js');
const SPServices = require('./lib/jquery.SPServices.js');

class spDataService{
    //create({model: new spItem()})
    create(o){
        let spModel = o.model;

        let d = $.Deferred();

        $().SPServices({
			operation: 'UpdateListItems',
			listName: spModel.getListName(),
			webURL: spModel.getSiteUrl(),
			batchCmd: 'New',
			debug:true,// <- Show us the errorsvaluepairs: this._getValuePairs(spModel),
			completefunc: function(xData,status){
				let $xml = $(xData.responseXML);
				let errorCode = $xml.find('ErrorCode').text();

				if(errorCode == '0x00000000'){
					d.resolve({
						// Because the schema and potentially necessary fields 
                        // aren't handed back with this call 
						// the caller will need to make 
                        // their own call if they want more data
                        modelId: $xml.find('z\\:row').attr('ows_ID')
					});
				}
				else{
					d.reject({
						error: 'Error: '+$xml.find('ErrorText').text()
					});
				}   
			}
		});

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

