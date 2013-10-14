dojo.require("dojo.DeferredList");

//Global Variables
var map = null;
var transectFeatures = [];
var gpTask = "";
var geomService = "";
var resultTables = [];
var chart = null;
var inputParamaterName = "InputPnt";


function esriMap(esrimap,gpTaskString){

	gpTask = gpTaskString;
	
	//TODO: Use Geom Service Template Variable
	geomService = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
	map = esrimap;
	chart = new D3Charting();
	
	//Get row dimension and value variables from Output Parameters
	//getParameterValues(gpTask);
	
	//Event for when the chart is updated
	document.addEventListener("ChartPointSelected",graphSelectIndexChanged,false);
	document.addEventListener("UpdateChart",graphUpdateChart,false);
	
	//dojo.connect(map.graphics,"onClick",esriSelectGraphic);
	//dojo.connect(map.graphics,"onDblClick",esriGraphicDoubleClick);
	
	//Events
	this.clearGraphics = esriMapClearGraphics;
	this.removeSelections = esriMapRemoveSelections;
	this.addPointToMap = esriMapAddPointToMap;
	this.addTransectToMap = esriMapAddTransectToMap;
	//this.UpdateTime = esriMapTimeExtentChange;	
	this.UpdateMapTime = esriMapUpdateTimeExtent;
}



/**************** Chart Events ******************************************/
/**
 *When the Chart Point is selected we want to select the graphic on the map 
 */
function graphSelectIndexChanged () {
	
  var selIndex = chart.getSelectedGraphIndex();
  esriMapSelectGraphic(selIndex);
}

/**
 *When the graph point is double clicked we want to plot that particular point 
 */
function graphUpdateChart () {
	
  var selIndex = chart.getSelectedGraphIndex();

  esriMapTimeExtentChange();  
}

/************** Time Change Functions ***********************************/
/**
 *When we change the time (or want to redraw the chart based on updated parameters)
 * we fire off this method 
 */
function esriMapTimeExtentChange()
{
	var index = chart.getSelectedGraphIndex();
	if(index == -1)
		index = 0;
		
	esriMapUpdateChartTime(index);
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
}  

/**
 *Updates the charts based on the current map time extent 
 */
function esriMapUpdateChartTime(index)
{ 	
	var timeExtent = map.timeExtent;
	//var endDate = timeExtent.endTime;
	var endDate = timeExtent.startTime;
	
	var mode = chart.getChartingMode();	
	if(mode == "PointMode")
	{
		chart.setSelectedGraphIndex(-1);
		esriMapCreateChart(resultTables[0]); 
    }
    else if(mode == "TransectLineMode")
    {
    	esriMapCreateTransectPlot(resultTables);        	
    }   
    else if(mode == "TransectPointMode")   
    {
    	esriMapCreateChart(resultTables[index]); 
    } 	
}

/**** Update Graphics Functions **********************************/
/**
 *Event Handler for when user selects a point graphic on the map. 
 */
function esriSelectGraphic(evt)
{
	var mode = chart.getChartingMode();	
	
	//Making sure the Graphic Selected is not the line
	if(evt.graphic != null && evt.graphic.attributes != null && mode != "PointMode")
	{
		var selectedIndex = evt.graphic.attributes["OBJECTID"];
		if(selectedIndex != null)
		{
			//Select The Graphic On the Map
			esriMapSelectGraphic(selectedIndex);
			
			//If we are in Transect Line Mode, we just want to highlight the point on the graph
			if(mode == "TransectLineMode")
			{	
				//Update Chart Selection
				chart.setSelectedGraphIndex(selectedIndex);
				chart.selectGraphPoint(selectedIndex);
			}
			else if(mode == "TransectPointMode")
			{
				chart.setSelectedGraphIndex(selectedIndex);
				esriMapUpdateChartTime(selectedIndex);
			}
		}
	}
	else if(mode == "TransectPointMode")//If we just selected the line, go back to transect line graph
	{
		chart.setChartingMode("TransectLineMode");	
		esriMapsClearMapGraphicSelections();
		chart.setSelectedGraphIndex(-1);
		esriMapCreateTransectPlot(resultTables);   
	}
}

/**
 *Event Listener for a graphic double click.
 * When a Transect Graphic Point has been double clicked, drill down and get the time
 * series for that point.  
 */
function esriGraphicDoubleClick(evt)
{
	//Making sure the Graphic Selected is not the line
	if(evt.graphic != null && evt.graphic.attributes != null)
	{
		var selectedIndex = evt.graphic.attributes["OBJECTID"];
		if(selectedIndex != null)
		{
			esriMapSelectGraphic(selectedIndex);
			
			//We want to graph that point overtime.
			chart.setChartingMode("TransectPointMode");	
			chart.setSelectedGraphIndex(selectedIndex);
			esriMapUpdateChartTime(selectedIndex);
		}
	}
}

/**
 *Highlight the graphic on the map that is at the inputed index 
 */
function esriMapSelectGraphic(index){
	
	var trasectFeat = transectFeatures[index];
	var graphics = map.graphics.graphics;
	var highlightSymbol = new esri.symbol.SimpleMarkerSymbol();
	highlightSymbol.setSize(12);
	highlightSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    highlightSymbol.setColor(new dojo.Color([0,255,255,0.75]));
    
	var markerSymbol = new esri.symbol.SimpleMarkerSymbol();	    
    markerSymbol.setSize(12);
    markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    markerSymbol.setColor(new dojo.Color([255,0,0,0.75]));
        
	for (var i=0, il=graphics.length; i<il; i++) {
		var graphic = graphics[i];
		if(graphic.attributes != null && graphic.attributes["OBJECTID"] == trasectFeat.attributes.OBJECTID)
		{
			graphic.setSymbol(highlightSymbol);
		}
		else if(graphic.attributes != null && graphic.attributes["OBJECTID"] != null)
		{
			graphic.setSymbol(markerSymbol);
		}
	}	
}
function esriMapsClearMapGraphicSelections()
{
	var graphics = map.graphics.graphics;
	var markerSymbol = new esri.symbol.SimpleMarkerSymbol();	    
    markerSymbol.setSize(12);
    markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    markerSymbol.setColor(new dojo.Color([255,0,0,0.75]));
    
    for (var i=0, il=graphics.length; i<il; i++) {
		var graphic = graphics[i];
		
		if(graphic.attributes != null && graphic.attributes["OBJECTID"] != null)
		{
			graphic.setSymbol(markerSymbol);
		}
	}	
    
    
}
/**
 *Clears out the map graphics, removes the chart and sets variables to default values 
 */
function esriMapClearGraphics() {

	map.graphics.clear();  
	//chart.remove();  
	//chart.setSelectedGraphIndex(-1);
	//resultTables = [];
}

/**
 *Clears out the map graphics, removes the chart and sets variables to default values 
 */
function esriMapRemoveSelections() {

	chart.setSelectedGraphIndex(-1);
	esriMapsClearMapGraphicSelections();
	chart.clearSelection();
	
	//When the user removes the selection, we want to graph to go back to transect mode,
	//because no points are selected.
	if(chart.getChartingMode() == "TransectPointMode")
	{
		chart.setChartingMode("TransectLineMode");	
		graphUpdateChart();
	}
}

/*****  Time Series Point Plot *******************************************************/
/*
 * Plots the points values over time
 */
function esriMapAddPointToMap(geometry)
{
	chart.setChartingMode("PointMode");
  	var symbol = new esri.symbol.SimpleMarkerSymbol();	    
    symbol.setSize(12);
    symbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    //symbol.setColor(new dojo.Color([255,0,0,0.75]));
    symbol.setColor(new dojo.Color([0,255,255,0.75]));
    
    var graphic = new esri.Graphic(geometry,symbol);
    
    map.graphics.clear();
    
    map.graphics.add(graphic);
    
    map.centerAt(geometry);
    
}



/**
 * We only want values up the the current time in the time-slider.  This is used
 * to create an area plot of the values up to the current time. 
 */
function esriMapGetTimeSubsetAreaPlot(table)
{
	var timeExtent = map.timeExtent;
	var endDate = timeExtent.startTime;
	
	//We fill in the graph up the latest date within the current time range of the map.
	//This lets the user see what the current value is.
	var fillArea = [];
	for(var index =0; index < table.features.length; index++)
	{
		var feat = table.features[index];
		if(feat.attributes.time < endDate)
			fillArea.push(feat);
		else
			break;
	}
	
	return fillArea;
}



/******************* Transect Tools *********************************************************/
/**
 *Creates a transect plot from a geomtry 
 * @param {Object} geometry
 */
function esriMapAddTransectToMap(geometry)
{
	chart.setChartingMode("TransectLineMode");
	var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 3);
	var graphic = new esri.Graphic(geometry, symbol);
	map.graphics.clear();
	map.graphics.add(graphic);

	var markerSymbol = new esri.symbol.SimpleMarkerSymbol();
	markerSymbol.setSize(12);
	markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 1));
	markerSymbol.setColor(new dojo.Color([255, 0, 0, 0.75]));

	var polyline = geometry;
	var path = polyline.paths[0];

	resultTables = [];
	resultCount = path.length;
	transectFeatures = [];

	var subsetPolylines = [];

	//To plot the points on the map we need each pnt within the transect, to pass up to the GP Service
	for ( index = 0; index < path.length; index++) {
		var pnt = path[index];
		var pntGeom = new esri.geometry.Point(pnt);

		//Creating a new Polyline to get the distance between the points.
		if (index > 0) {
			var pnt2 = path[index - 1];
			var pntGeom = new esri.geometry.Point(pnt);
			var subsetPolyline = new esri.geometry.Polyline(geometry.spatialReference);
			subsetPolyline.addPath([pnt, pnt2]);

			subsetPolylines.push(subsetPolyline);
		}

		var attributes = new Array();
		attributes.OBJECTID = index;

		var pntGraphic = new esri.Graphic(pntGeom, markerSymbol);
		pntGraphic.attributes = attributes;
		map.graphics.add(pntGraphic);

		var repoGeom = esri.geometry.webMercatorToGeographic(pntGeom);
		var repoGraphic = new esri.Graphic(repoGeom, symbol);
		repoGraphic.attributes = attributes;

		transectFeatures.push(repoGraphic);
	}
	
	//Once we have our polylines we can use the geometry service to get the legnth between each segment of our transect.
	if (subsetPolylines.length > 0) {
		var geometryService = new esri.tasks.GeometryService(geomService); 
		var lengthParams = new esri.tasks.LengthsParameters();
		lengthParams.polylines = subsetPolylines;
		lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
		lengthParams.geodesic = true;
		geometryService.lengths(lengthParams, esriMapGetDistanceResults);

	}

	    		    
}

/**
 *The event listener for the Geometry Service returning the lengths of our subset polylines. 
 * @param {Object} result
 */
function esriMapGetDistanceResults(result)
{

	var gp = new esri.tasks.Geoprocessor(gpTask); 

	if (transectFeatures.length > 0) {
		var distances = [0];
		var totalDistance = 0;
		var feature = transectFeatures[0];
		feature.attributes.Distance = 0;

		for (var index = 0; index < result.lengths.length; index++) {
			totalDistance += result.lengths[index];
			var feature = transectFeatures[index + 1];
			feature.attributes.Distance = totalDistance;
			//transectFeatures[index + 1] = feature;
		}

		//Now that we have the distances we can query each individual point
		esriMapsGetTransectValues();
	}

}

/**
 *Takes all the input points from the transect and sends them up to the server individually.  
 * The Deffered list makes this possible to get all the results in the order they were sent 
 */
function esriMapsGetTransectValues()
{
	var allGPTasks = [];
	
	dojo.forEach(transectFeatures, function(feature){
		
			var gp = new esri.tasks.Geoprocessor(gpTask); 
			
			//Now that we have the distances we can query each individual point
			var inputfeatures = [];
			inputfeatures.push(feature);
			var featureSet = new esri.tasks.FeatureSet();
			featureSet.features = inputfeatures;
	
			var params = [];
			params[inputParamaterName] = featureSet;
			var thisRequest = gp.execute(params);
			
			allGPTasks.push(thisRequest);		

	});
	
	var gpTaskDefferedList = new dojo.DeferredList(allGPTasks); 
	gpTaskDefferedList.then(esriMapGetTransectResults);
}

/**
 *Getting the results from the GP Tasks. 
 */
function esriMapGetTransectResults(results) {

	var tempResults = [];
	
	for(var index = 0; index < results.length; index++)
	{
		var result = results[index];
		if(result[0])
		{
			tempResults.push(result[1][0].value);
		}
		else
		{
			tempResults = [];
			break;
		}
	}
	
	//Making sure we got the results.
	if(tempResults.length > 0)
	{
		resultTables = tempResults;
		esriMapCreateTransectPlot(resultTables);  
	}
} 


/**
 *Plot the transect using the results from the GP Service 
 * @param {Object} returnTable
 */  
function esriMapCreateTransectPlot(returnTable)
{
	if(chart == null)
		chart = new D3Charting();
	
	chart.remove();
	
	
	var yField = chart.getYFieldName();
	var dimField = chart.getDimensionFieldName();
	
	var timeExtent = map.timeExtent;
	var endDate = timeExtent.endTime;
		
	//Creating a transect plot of the values closest to the end date of our time range.
	var transectPlot = [];
	for(var index =0; index < returnTable.length; index++)
	{
		var trasectFeat = transectFeatures[index];
		var transectDistance = parseInt(trasectFeat.attributes.Distance);
		var table = returnTable[index];
		var features = table.features;
  	    for (var f=0, fl=features.length; f<fl; f++) {
          var feature = features[f];
          var value = feature.attributes[yField]; 
          var timeValue = feature.attributes[dimField]; 
          
          //Get the latest date  			          
          if(timeValue <= endDate)
          {
          	var plotLoc = [];
          	plotLoc.value = value;
          	plotLoc.distance = transectDistance;
          	plotLoc.graphic = trasectFeat;
          	transectPlot[index] = plotLoc;	
          }
          else
          	break;
        }
	}
	
	chart.createTransectPlot(transectPlot);
}
    
