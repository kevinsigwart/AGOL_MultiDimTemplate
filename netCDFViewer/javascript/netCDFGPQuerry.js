var gpTask = "";
var inputParamaterName = "InputPnt";
var outputValueField = "SoilMoist1_GDS0_DBLY";
var outputDimension = "time";
var gpResultsTable = null;

function NetCDFGPQuery(gpTaskString){
	
	gpTask = gpTaskString;
	//Get row dimension and value variables from Output Parameters
	getParameterValues(gpTask);
	
	this.queryPoint = netCDFQueryPoint;
	this.getResultsTable = getNetCDFResultsTable;
	this.getTimeField = netCDFGPQueryGetOutputTimeField;
	this.getOutputValueField = netCDFGPQueryGetOutputValueField;
	//Events
	netCDFgotQueryResults = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	netCDFgotQueryResults.initEvent("NetCDFGPQueryGotQueryResults",true,true);	
}


/******** Properties *********************************************/

function netCDFGPQueryGetOutputValueField()
{
	return outputValueField;
}

function netCDFGPQueryGetOutputTimeField()
{
	return outputDimension;
}

/**********Methods *********************************************/

/**
 *Get's the NetCDF Results Table 
 */
function getNetCDFResultsTable(){
	return gpResultsTable;
}

/**********Gp Service Functions******************************************/
/**
 *We hit the rest end point to get the format of the output table schema.  THis way we
 * know what the x Variable and y Variable to graph are. 
 */
function getParameterValues(gpTask){

	//var url = gpTask + "?f=json";
	var dataUrl = gpTask + "?f=json";
	
	
	//var targetNode = dojo.byId("licenseContainer");
	// The parameters to pass to xhrGet, the url, how to handle it, and the callbacks.
	//TODO:Switch to using DOJO Request/Promise
	var xhrArgs = {
		url : dataUrl,
		//handleAs : "json",
		//preventCache : true,
		load : function(data) {

			var gotFieldValues = false;
			
			//TODO:  Check if this is asynchronous
			
			dojo.forEach(data.parameters, function(parameter){
				if(parameter.direction == "esriGPParameterDirectionOutput" && parameter.dataType == "GPRecordSet")
				{
					var table = parameter.defaultValue;
					var rowDimFieldValue = table.fields[1].name;
					var valueFieldValue = table.fields[2].name;
					chart.setDimensionFieldName(rowDimFieldValue);
					chart.setYFieldName(valueFieldValue);
					gotFieldValues = true;
				}
				else if(parameter.direction == "esriGPParameterDirectionInput" && parameter.dataType == "GPFeatureRecordSetLayer")
				{
					inputParamaterName = parameter.name;
				}
			});
			
			if(!gotFieldValues)
				alert("Invalid Input GP Service.\nPlease check your GP Service Configured Variable");
		},
		error : function(error) {
			alert("Invalid Input GP Service.\nPlease check your GP Service Configured Variable");
		}
	};

	esri.request(xhrArgs);	
}

/*
 * Plots the points values over time
 */
function netCDFQueryPoint(geometry)
{    	    
    var gp = new esri.tasks.Geoprocessor(gpTask);
    
    //We reproject the points into WGS84 for the service if need be
    var features= [];
    
    if(geometry.spatialReference.wkid != '4326')
    	geometry = esri.geometry.webMercatorToGeographic(geometry); //Project if geometry is not already geographic
    	
    var repoGraphic = new esri.Graphic(geometry);
    features.push(repoGraphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    
    var params = []; //{ inputParamaterName:featureSet };
    params[inputParamaterName] = featureSet;
    
    gp.execute(params, esriMapGetTable);
}

/**
 *Gets the results from the GP Service and plots them over time. 
 */
function esriMapGetTable(results, messages) {
				
	gpResultsTable = [results[0].value];
	document.dispatchEvent(netCDFgotQueryResults);
}