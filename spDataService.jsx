
// Adds document fields to spItem
class spDocument extends spItem{
	getFileName(){
		return this.FileLeafRef.split(';#')[1];
	}
	
	getFileUrl(){
		return '/'+this.FileRef.lookupValue;
	}	
}

spDocument.prototype._viewFields = spItem.prototype._viewFields.concat([
	'FileLeafRef',
	'FileRef',
	'Created_x0020_Date',
	'Last_x0020_Modified'
]);


////////////////////////////////////////////////////////////////////////////////////
class spCacheProvider {
	constructor(){
		this._cache = {};
	}
	
	getCached(key){
		return this._cache[key];
	}
	
	setCached(key,val){
		this._cache[key] = val;
	}
}


const _SPCP = new spCacheProvider();

//debug
window._SPCP = _SPCP;

//used by SPGetListItemsJsonCustom
const _spListFieldTypes = [
			"Integer",
			"Text",
			"Note",
			"DateTime",
			"Counter",
			"Choice",
			"Lookup",
			"Boolean",
			"Number",
			"Currency",
			"URL",
			"MultiChoice",
			"Calculated",
			"File",
			"Attachments",
			"User",
			"ModStat",
			"ContentTypeId",
			"WorkflowStatus", // NEW
			"UserMulti", // Multiselect users
			"LookupMulti", // Multi-select lookup
			"datetime", // Calculated date/time result
			"float", // Calculated float
			"Calc" // General calculated
		];

class spDataService{
	//spModel data senders/receivers
	create(options){
		let o = $.extend({
			modelClass: undefined,
			props: undefined
		},options);
	
		let spModel = new o.modelClass();

		return this._addListItem({
			webURL: spModel.getSiteUrl(),
			listName: spModel.getListName(),  
			props: o.props
		});
	}
	
	getById(options){
		let d = $.Deferred();
				
		let spModelClass = options.modelClass;
		let spModel = new spModelClass();
		let spModelId = options.id;
	
		let o = $.extend({
			id: undefined,
			modelClass: undefined,
			webURL: spModel.getSiteUrl(),
			listName: spModel.getListName(),	  
			CAMLQuery: '<Query><Where><Eq><FieldRef Name="ID" /><Value Type="Number">'+spModelId+'</Value></Eq></Where></Query>',
			CAMLRowLimit: 1,
			CAMLViewFields: this._generateViewFields(spModel._viewFields)
		},options);
	
		$.when(
			this._SPServices_SPGetListItemsJsonCustom(o)
		)
		.done(function(result){
			let resultModel = result.data[0];
			let properties = result.mapping;

// Update properties for all instances of the spModel
			spModelClass.prototype._properties = properties;
			
			let m;
			
			if(resultModel){
				m = new spModelClass(resultModel);
			}

			d.resolve(m);
		})
		.fail(function(errorMsg){
			d.reject(errorMsg);
		});

		return d.promise();
	}

/*
	Required:
	{
		modelClass: class extending spItem
	}
	Optional:
	{
		cacheKey: string key used to cache or retrieve a cached result
		...any SPServices option
	}
*/
	getAll(options){
		let d = $.Deferred();
				
		let spModelClass = options.modelClass;
		let spModel = new spModelClass();
	
		let o = $.extend({
			modelClass:undefined,
			cacheKey:false,
			webURL: spModel.getSiteUrl(),
			listName: spModel.getListName(),	   
			CAMLQuery: '<OrderBy><FieldRef Name="ID" Ascending="False" /></OrderBy>',
			CAMLRowLimit: 10000,
			CAMLViewFields: this._generateViewFields(spModel._viewFields),
			debug:true//<- don't ignore errors
		},options);
		
		const cachePrefix = 'spdGetAll:';
		
		if(o.cacheKey){
			o.cacheKey = cachePrefix + o.cacheKey;
		}

		$.when(
			this._SPServices_SPGetListItemsJsonCustom(o)
		)
		.done(function(result){
			let properties = result.mapping;

			o.modelClass.prototype._properties = properties;
			
			let models = [];
			
			$.each(result.data,function(i,model){
				if(model){
		 			models.push(new o.modelClass(model));
		 		}
			});

			d.resolve(models);
		})
		.fail(function(errorMsg){
			d.reject(errorMsg);
		});

		return d.promise();
	}

	update(options){
		let o = $.extend({
			modelClass:undefined,
			id:undefined,
			props:undefined
		},options);
		
 		let d = $.Deferred();
 	
		let spModel = new o.modelClass();
		
		let valuePairs = [];

		for(var key in o.props){
			valuePairs.push([ key,o.props[key] ]);
		}	   

		$().SPServices({
			operation: 'UpdateListItems',
			webURL: spModel.getSiteUrl(),
			listName: spModel.getListName(),  
			batchCmd: 'Update',
			ID: o.id,
			valuepairs: valuePairs,
			completefunc: function(xData,status){
				let $xml = $(xData.responseXML);
				let errorCode = $xml.find('ErrorCode').text();

				if(errorCode == '0x00000000'){
					let withOwsMapping = {};
					
					$.each(spModel._properties,function(key,val){
						withOwsMapping['ows_'+key] = val;
					});
				
					let spModelProps = $xml.SPFilterNode("z:row").SPXmlToJson({
						mapping: withOwsMapping,
						sparse: true
					});
					
					//fresh copy of the model with the new values
					d.resolve(new o.modelClass(spModelProps[0]));
				}
				else{
			 		let errorText = $xml.find('ErrorText').text();
			 		
			 		if(errorText === ''){
			 			errorText = $xml.find('errorstring').text();
			 		}
					
					d.reject(errorText);
				}   
			},
			debug:true// <- Show us the errors
		});
		
		return d.promise(); 
	}

	upload(options){
		let o = $.extend({
			modelClass: undefined,
			file: undefined,
			overwrite: false
		},options);
	
		let d = $.Deferred();
	
		let spModel = new o.modelClass();
		let spd = this;
					
		let fileExists = $.Deferred();
					
		if(o.overwrite === true){
			fileExists.resolve(false);
		}
		else{
			$.when(
				spd.getAll({
					modelClass:o.modelClass,
					CAMLQuery:'<Query><Where><Eq><FieldRef Name="FileLeafRef" /><Value Type="Text">'+o.file.name+'</Value></Eq></Where></Query>',
					CAMLRowLimit: 1,
					CAMLViewFields: spd._generateViewFields(['FileLeafRef'])
				})
			).done(function(models){
				if(models.length > 0){
					fileExists.resolve(true);
				}
				else{
					fileExists.resolve(false);
				}
			})
			.fail(function(reason){
				fileExists.reject(reason);
			});	
		}
		
		$.when(
			fileExists.promise()
		)
		.done(function(fileExists){
			if(fileExists){
				d.reject('A file named "'+o.file.name+'" already exists!');
				
				return;
			}
			
			let reader = new FileReader();
			 
			reader.addEventListener('load',function(){
				let base64withSuffix = reader.result;
				let base64Stream = base64withSuffix.substr(base64withSuffix.indexOf(',')+1);
				let destinationUrl = spModel.getSiteUrl()+spModel.getListName()+'/'+o.file.name;

				$().SPServices({
					operation: 'CopyIntoItems',
					webURL: spModel.getSiteUrl(),
					SourceUrl: 'C:\\'+o.file.name,
					Stream: base64Stream,
					DestinationUrls: [destinationUrl],
					completefunc: function(xData,Status){	
						let $xml = $(xData.responseXML);
						
						let copyResult = $xml.find('CopyResult');
				 		let errorCode = copyResult.attr('ErrorCode');
				 		let uploadedDestination = copyResult.attr('DestinationUrl');
				 	
				 		if(errorCode == 'Success'){
				 			//Sadly, the CopyIntoItems service only gives us the URL back			 		
							$.when(spd._getUrlSegments({
				 				webURL:spModel.getSiteUrl(),
				 				url: uploadedDestination
				 			})).then(function(urlInfo){
				 				let newItemId = urlInfo.strItemID;
				 				
				 				$.when(spd.getById({
				 					modelClass: o.modelClass,
				 					id: newItemId
				 				})).then(function(model){
				 					//phew
				 					d.resolve(model);
				 				});
				 			});
				 		}
						else{
							window.testy = $xml;
							console.log($xml);
							d.reject('Unable to upload file');
						}
					}			
				});
			});
			
			reader.readAsDataURL(o.file);
		})
		.fail(function(reason){
			d.reject(reason);
		});
		
		return d.promise();
	}
	
	checkIn(options){
		let model = options.model;
	
		let o = $.extend({
			model: undefined,//Required
			webURL:model.getSiteUrl(),//probably not needed
			listName:model.getListName(),//probably not needed
			operation:'CheckInFile',
			pageUrl: model.getSiteUrl()+model.getListName()+'/'+model.getFileName(),
			comment : ' ',
			CheckinType: 1,
			completefunc: (xData, Status)=>{
				let $xml = $(xData.responseXML);
				let error = $xml.find('errorstring').text();
				
				if(error!==''){
					d.reject(error);
				}
				
				let result = $xml.find('CheckInFileResult').text();

				if(result == 'true'){
					d.resolve(model);
				}
				
				d.reject('File was not checked in, a wrong URL may have been given.');
			}
		},options);

		let d = $.Deferred();
		
		$().SPServices(o);
		
		return d.promise();
	}

	delete(options){	   
		let o = $.extend({
			model:undefined//required
		},options);
		
		let d = $.Deferred();

		let fileUrl = '';
		
		if(o.model instanceof spDocument){
			fileUrl = '<Field Name="FileRef">'+ o.model.getFileUrl() +'</Field>';
		}

		let batch = '\
		<Batch OnError="Continue">\
			<Method ID="1" Cmd="Delete">\
				<Field Name="ID">'+ o.model.ID +'\</Field>\
				'+fileUrl+'\
			</Method>\
		</Batch>\
		';

		$().SPServices({
			operation: "UpdateListItems",
			async: false,
			webURL:o.model.getSiteUrl(),
			listName:o.model.getListName(),
			updates: batch,
			debug: true,
			completefunc: function (xData, Status){
				let $xml = $(xData.responseXML);
				let errorMsg = $xml.find('ErrorText').text();
				
				if(errorMsg !== ''){
					d.reject(errorMsg);
					return;
				}

				d.resolve();	
			}	
		});
		
		return d.promise();
	}
	
	loadProps(options){
		let o = $.extend({
			modelClass: undefined
		},options);
	
		let d = $.Deferred();
		
		let spModel = new o.modelClass();

		let ajaxResponse = this._SPServices_SPGetListItemsJsonCustom({
			webURL: spModel.getSiteUrl(),
			listName: spModel.getListName(),	  
			CAMLQuery: '<OrderBy><FieldRef Name="ID" Ascending="False" /></OrderBy>',
			CAMLRowLimit: 1,
			CAMLViewFields: this._generateViewFields(spModel._viewFields)
		});

		$.when(ajaxResponse).done(function(result){
			let model = this.data[0];
			let properties = this.mapping;

			// Update properties for all instances of the spModel
			o.modelClass.prototype._properties = properties;

			d.resolve({
		 		success: true,
		 		model: new o.modelClass(model)
			});
		});

		return d.promise();
	}
	
	getCurrentUserGroups(options){
		let o = $.extend({
			cacheKey: null
		},options);

		if(o.cacheKey){
			o.cacheKey = 'getCurrentUserGroups:'+o.cacheKey;
		}
	
		let d = $.Deferred();

		if(o.cacheKey){
			let cached = _SPCP.getCached(o.cacheKey);
	
			if(cached){
				//resolve with a copy of the cached array
				d.resolve([].concat(cached));
	
				return d.promise();
			}
		}
		
   		$().SPServices({
    		operation: "GetGroupCollectionFromUser",
    		userLoginName: $().SPServices.SPGetCurrentUser(),
    		async: false,
    		completefunc: function(xData,Status){
				let $xml = $(xData.responseXML);
					
				let groups = [];
				
				$xml.find('Group').each(function(i,group){
					let $g = $(group);
					
					groups.push({
						name:$g.attr('Name'),
						id:$g.attr('ID')
					});
				});
				
				if(o.cacheKey){
					_SPCP.setCached(o.cacheKey,groups);
				}

				//resolve with a copy so we don't hand over the cached array
				d.resolve([].concat(groups));
			}
   		});
   		
   		return d.promise();
	}


// INTERNAL METHODS	
	_getListItemById(options){
		let o = $.extend({
			id: undefined,//required
			webURL: undefined,//required
			listName: undefined,//required		  
			viewFields: ['ID','Title'],
			CAMLQuery: '<Query><Where><Eq><FieldRef Name="ID" /><Value Type="Number">'+options.id+'</Value></Eq></Where></Query>',
			CAMLRowLimit: 1
		},options);
		
		o.CAMLViewFields = this._generateViewFields(o.viewFields);
		
		return this._SPServices_SPGetListItemsJsonCustom(o);
	}

	_addListItem(options){
		let o = $.extend({
			webURL: false,//required
			listName: false,//required
			props: false,//required
		},options);
	
		var d = $.Deferred();
		
		let valuePairs = [];
		
		for(var key in o.props){
			var val = o.props[key];
			
			valuePairs.push([key,val]);
		}	   
				
		$().SPServices({
			operation: 'UpdateListItems',
			listName: o.listName,
			webURL: o.webURL,
			batchCmd: 'New',
			valuepairs: valuePairs,
			completefunc: function(xData,status){
				let $xml = $(xData.responseXML);
				let errorCode = $xml.find('ErrorCode').text();

				if(errorCode == '0x00000000'){
					d.resolve({
						success:true,
						// Because the schema and potentially necessary fields aren't
						// handed back with this call we force 
						// the caller to make their own get call
						modelId: $xml.find('z\\:row').attr('ows_ID')
					});
				}
				else{
					d.resolve({
						success:false,
						error: 'Error: '+$xml.find('ErrorText').text()
					});
				}   
			},
			debug:true// <- Show us the errors
		});
		
		return d.promise(); 
	}
	
// By cloning this SPServices method here we can tweak it to include list schema information such as choice options
	_SPServices_SPGetListItemsJsonCustom(options){
		var opt = $.extend({}, {
			cacheKey: undefined, //optional, unique string to use to cache results
			webURL: "", // [Optional] URL of the target Web.  If not specified, the current Web is used.
			listName: "",
			viewName: "",
			CAMLQuery: "",
			CAMLViewFields: "",
			CAMLRowLimit: "",
			CAMLQueryOptions: "",
			changeToken: "", // [Optional] If provided, will be passed with the request
			contains: "", // CAML snippet for an additional filter
			mapping: null, // If provided, use this mapping rather than creating one automagically from the list schema
			mappingOverrides: null, // Pass in specific column overrides here
			debug: true // If true, show error messages;if false, run silent
		}, $().SPServices.defaults, options);

		if(opt.cacheKey){
			//acronym for method name
			opt.cacheKey = 'SPGLIJC:'+opt.cacheKey;
		}

		var newChangeToken;
		var thisListJsonMapping = {};
		//BEGIN CUSTOM CODE
		// create a copy without ows_ prefixes
		var nonOWSListJSONMapping = {};
		//END CUSTOM CODE
		var deletedIds = [];
		var result = $.Deferred();

		//run after checking for errors
		let completeFunc = function(xData,status){	
          	// We're going to use this multiple times
          	var responseXml = $(xData.responseXML);
          	
			let errorText = responseXml.find('errorstring').text();

			if(errorText != ''){				
				result.reject(errorText);
				
				return;
			}   
		
            var mappingKey = "SPGetListItemsJson" + opt.webURL + opt.listName;

            // Get the changeToken
            newChangeToken = responseXml.find("Changes").attr("LastChangeToken");

            // Some of the existing items may have been deleted
            responseXml.find("listitems Changes Id[ChangeType='Delete']").each(function () {
                deletedIds.push($(this).text());
            });

			if (opt.mapping === null) {
				// Automagically create the mapping
				responseXml.find("List > Fields > Field").each(function () {
					var thisField = $(this);
					var thisType = thisField.attr("Type");
					// Only work with known column types
					if ($.inArray(thisType, _spListFieldTypes) >= 0) {			  
						var thisMapping = thisListJsonMapping["ows_" + thisField.attr("Name")] = {					//END CUSTOM CODE					
							mappedName: thisField.attr("Name"),
							objectType: thisField.attr("Type")
						}; 
												
						//BEGIN CUSTOM CODE 
						var thisNonOWSMapping = nonOWSListJSONMapping[thisField.attr("Name")] = {
							mappedName: thisField.attr("Name"),
							objectType: thisField.attr("Type")
						};
	   
						var choices = []; 
						
						thisField.find('CHOICE').each(function(i,choice){
							choices.push(choice.textContent);
						});  
											  
						if(choices.length > 0){
							thisNonOWSMapping.choices = choices;	 
						}
						
						var defaultChoice = false;
						
						thisField.find('Default').each(function(i,d){
							defaultChoice = d.textContent;
						});
						
						if(defaultChoice){
							thisNonOWSMapping.defaultChoice = defaultChoice;
						}
						//END CUSTOM CODE
					}
				});
			}
			else {
				thisListJsonMapping = opt.mapping;
			}

			// Implement any mappingOverrides
			// Example: { ows_JSONTextColumn: { mappedName: "JTC", objectType: "JSON" } } 
			if(opt.mappingOverrides !== null){
				// For each mappingOverride, override the list schema
				for (var mapping in opt.mappingOverrides) {
					thisListJsonMapping[mapping] = opt.mappingOverrides[mapping];
				}
			}

			// If we haven't retrieved the list schema in this call, try to grab it from the saved data from a prior call
			if($.isEmptyObject(thisListJsonMapping)) {
				thisListJsonMapping = $(document).data(mappingKey);
			} else {
				$(document).data(mappingKey, thisListJsonMapping);
			}

			var jsonData = responseXml.SPFilterNode("z:row").SPXmlToJson({
				mapping: thisListJsonMapping,
				sparse: true
			});

			if(opt.cacheKey){
				_SPCP.setCached(opt.cacheKey,arguments);
			}

			//pass a copy back, original stays in cache
			result.resolve({
				changeToken: newChangeToken,
				mapping: nonOWSListJSONMapping,
				data: jsonData,
				deletedIds: deletedIds
			});
		};

		if(opt.cacheKey){		
			let c = _SPCP.getCached(opt.cacheKey);

			if(c){
				//don't recache the already cached result
				delete opt.cacheKey;

				completeFunc.apply(this,c);
				
				return result.promise();
			}
		}
		
		// Call GetListItems to find all of the items matching the CAMLQuery
		$().SPServices({
			operation: "GetListItemChangesSinceToken",
			webURL: opt.webURL,
			listName: opt.listName,
			viewName: opt.viewName,
			CAMLQuery: opt.CAMLQuery,
			CAMLViewFields: opt.CAMLViewFields,
			CAMLRowLimit: opt.CAMLRowLimit,
			CAMLQueryOptions: opt.CAMLQueryOptions,
			changeToken: opt.changeToken,
			contains: opt.contains,
			debug:true,
			completefunc: completeFunc
		});
		
		return result.promise();	
	}

// Helper method to convert arrays to viewFields XML
	_generateViewFields(viewFieldsArr){
		var viewFields = '';
		viewFieldsArr.forEach(function(fieldName,i){
			viewFields += '<FieldRef Name="'+fieldName+'" />';
		});
		return '<ViewFields>'+viewFields+'</ViewFields>';
	}

// extension of spservices to get url segments
/**
 * Given a URL to an item, this method will retrieve information about
 * that URL, including the List UID and the ID of the item within the
 * list.
 * 
 * @param {Object|String} options
 *	  An object with the options below or a string with the URL.
 * 
 * @param {String} options.url
 * @param {String} [options.webURL=(current site)]
 *	  If left unset, the webURL of the current site will be used.
 * @param {Boolean} [options.async=true]
 * 
 * @return {jQuery.Promise}
 *	  Promise is resolved with the following 3 params
 *	  1.  Object containing the information about the url. The object
 *		  will always contain at least one property - resultsFound -
 *		  which is a Boolean indicating if information about the
 *		  URL was found.. Other attribute in the object include
 *		  'strItemID' and 'strListID'. Object example:
 *			  {
 *				  resultsFound: false,
 *				  strListID: '',
 *				  strItemID: ''
 *			  }
 *	  2.  jQuery XHR object
 *	  3.  jQuery ajax call Status
 * 
 * @example
 * 
 *	  $.SPGetListItemInfoByUrl({ url: "https...." })
 *		  .done(function(urlInfo){
 *			  alert(urlInfo.strListID);
 *		  })
 * 
 *	  // String input
 *	  $.SPGetListItemInfoByUrl("https.....")
 *		  .done(function(urlInfo){
 *			  alert(urlInfo.strListID);
 *		  })
 * 
 * @requires jQuery
 * @requires jQuery.SPServices
 * 
 * @see http://wp.me/p2kCXW-62
 * 
 * (c) 2014 | Paul Tavares (@paul_tavares) | MIT License
 */
	_getUrlSegments(options){
		var opt = $.extend({}, {
					url:		'',
					webURL:	 $().SPServices.SPGetCurrentSite(),
					async:	  true
				}, options),
			urlInfo = {
				resultsFound: false,
				strListID: '',
				strItemID: ''
			};
		
		if (typeof options === "string") {
			
			opt.url = options;
			
		}
		
		if (opt.url.indexOf("?") > -1) {
			
			opt.url = opt.url.substr(0, opt.url.indexOf("?"));
			
		} else if (opt.url.indexOf("#") > -1) {
			
			opt.url = opt.url.substr(0, opt.url.indexOf("#"));
			
		}
		
		// Return a Promise
		return $.Deferred(function(dfd){
			// Make ajac call to SP webservice
			$.ajax({
				type:		   "POST",
				cache:		  false,
				async:		  opt.async,
				url:			opt.webURL + "/_vti_bin/SiteData.asmx",
				contentType:	"text/xml;charset=utf-8",
				dataType:	   "xml",
				data:		   "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " +
						"xmlns:xsd='http://www.w3.org/2001/XMLSchema' " +
						"xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>" +
						"<soap:Body>" +
							"<GetURLSegments xmlns='http://schemas.microsoft.com/sharepoint/soap/'>" +
								"<strURL>" + opt.url + "</strURL>" +
							"</GetURLSegments>" +
						"</soap:Body>" +
					"</soap:Envelope>",
			})
			.done(function(data, status, jqXHR){
				
				var $xmlDoc = $(jqXHR.responseXML);
					
				$xmlDoc.find("GetURLSegmentsResponse").children().each(function(){
					
					var $this = $(this);
					
					if ($this[0].nodeName === "GetURLSegmentsResult") {
						
						urlInfo.resultsFound = ( $this.text() === "true" ? true : false );
						
					} else {
						
						urlInfo[ $this[0].nodeName ] = $this.text() || "";
						
					}
					
				});
				
				dfd.resolveWith($, [urlInfo, jqXHR, status]);
				 
			})
			.fail(function(jqXHR, status, error){
				
				dfd.rejectWith($, [urlInfo, jqXHR, status]);
				
			 }); //end: .ajax()
			 
		}).promise();	
	}
	
	_doesFileExist(spModelClass,fileName){
		let d = $.Deferred();
		
		let query = '<Query><Where><Eq><FieldRef Name="FileLeafRef" /><Value Type="Text">'+fileName+'</Value></Eq></Where></Query>';
		
		$.when(
			this.getAllByQuery(
				spModelClass,
				query,
				{CAMLRowLimit:1}
			)
		)
		.done(function(result){
			if(!result.success){
				d.reject({
					error:result.error
				});
			}
			else if(result.models.length > 0){
				d.resolve({
					exists: true
				});
			}
			else{
				d.resolve({
					exists: false
				});
			}
		});	
		
		return d.promise();
	}
}
spDataService.prototype.queries = {
	checkedInItems: '<Query><Where><IsNull><FieldRef Name="CheckoutUser" /></IsNull></Where></Query>'
};

