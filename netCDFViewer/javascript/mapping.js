dojo.require("dojo.DeferredList");

//Global Variables
var map = null;
var transectFeatures = [];
var gpTask = "";
var geomService = "";
var resultTables = [];
var chart = null;
var inputParamaterName = "";

var colorArray = ["#2f7ed8", "#0d233a", "#8bbc21", "#910000", "#1aadce", "#492970", "#f28f43", "#77a1e5", "#c42525", "#a6c96a"];


function esriMap(esrimap,gpTaskString){

	//Properties
	//gpTask = "http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script";
	gpTask = gpTaskString;
	
	geomService = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
	map = esrimap;
	chart = new D3Charting();
			
	//Events
	this.addPointToMap = esriMapAddPointToMap;
	this.UpdateChartSize = esriMapLayoutSizeChange;	
	this.UpdateMapTime = esriMapUpdateTimeExtent;
}

/**************** Chart Events ******************************************/

function esriMapLayoutSizeChange()
{
	if(chart.getChartingMode() == "kisters")
		chart.updateKistersGraphSize();
}

/*****  Time Series Point Plot *******************************************************/
/*
 * Plots the points values over time
 */
function esriMapAddPointToMap(geometry,mode)
{
	//We need to remove the point chart or transect chart if already created.
	chart.remove();
 	
 	var markerSymbolIndex = map.graphics.graphics.length - 1;
 	
 	var symbol = new esri.symbol.SimpleMarkerSymbol();	    
    symbol.setSize(12);
    symbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    symbol.setColor(new dojo.Color(colorArray[markerSymbolIndex]));
    
    if(map.graphics.graphics.length > 10)
    {
	    //symbol.setColor(new dojo.Color([255,0,0,0.75]));
	    symbol.setColor(new dojo.Color([0,255,255,0.75]));
	}
    	
    var graphic = new esri.Graphic(geometry,symbol);
    	    
    map.graphics.add(graphic);  
    		
	chart.addPointKisters(geometry);
}

/**
 * When the time extent on the map changes we need to update the Kisters chart to highlight it on
 * their chart.  Our data is summerized by month and their data is in 3 hour increments, so we highlight
 * the entire month. 
 * @param {Object} dateTime
 */
function esriMapUpdateTimeExtent(dateTime)
{
	var timeExtent = new esri.TimeExtent();
	timeExtent.startTime = dateTime;
	map.setTimeExtent(timeExtent); 
	
	var chartTimeExtent = new esri.TimeExtent();
	var endate = new Date(dateTime);
	endate.setMonth(endate.getMonth() + 1);
	chartTimeExtent.startTime = dateTime;
	chartTimeExtent.endTime = endate;
	if(chart != null) 	
		chart.updateKistersTimeGraphic(chartTimeExtent);
}    
