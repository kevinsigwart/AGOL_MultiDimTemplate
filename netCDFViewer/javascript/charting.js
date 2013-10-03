//dojo.require("kisters/builds/kiWidgets");
//dojo.require("kisters/widgets/tsWidget");

//Global Variables.  These are needed in the events so the have to be global
var yValueField = "";
var dimension = "";

var chartingMode = "";
var selectedGraphIndex = -1;
var chartPointSelectedEvent;
var kistersWidget;

function D3Charting() {

	//Properties
	var margin = {top: 10, right: 1, bottom: 30, left: 50};
		
	kistersInitWidget();
		
	//Methods  
	this.remove = chartingRemoveChart;
	this.setYFieldName = d3SetyFieldName;
	this.getYFieldName = d3GetyFieldName;
	this.setDimensionFieldName = d3SetDimensionFieldName;
	this.getDimensionFieldName = d3GetDimensionFieldName;
	this.setChartingMode = d3SetChartingMode;
	this.getChartingMode = d3GetChartingMode;
	this.addPointKisters = kistersAddPoint;
	this.updateKistersGraphSize = kistersUpdateGraphSize;
	this.updateKistersTimeGraphic = kistersUpdateTimeGraphic;
}


/****** Get/Set Properties *******************************/
function d3GetyFieldName()
{
	return yValueField;
}
function d3SetyFieldName(value)
{
	yValueField = value;
}
function d3GetDimensionFieldName()
{
	return dimension;
}
function d3SetDimensionFieldName(value)
{
	dimension = value;
}
/**
 *Sets the Charting Mode.  Three Types
 *  PointMode:  Point mode is when a user clicks one point on the map.  Graphs that point over time.
 *  TransectLineMode: Graphs a transect at a particular time
 *  TransectPointMode: Graphs a point within the transect over time.
 */
function d3SetChartingMode(mode)
{
	chartingMode = mode;
}
/**
 *Gets the Charting Mode.  Three Types
 *  PointMode:  Point mode is when a user clicks one point on the map.  Graphs that point over time.
 *  TransectLineMode: Graphs a transect at a particular time
 *  TransectPointMode: Graphs a point within the transect over time.
 */
function d3GetChartingMode()
{
	return chartingMode;
}


function chartingRemoveChart()
{
	kistersDeleteGraph();
}

/**
 * Initialize Kisters Widget.  Currently Broken.
 */
function kistersInitWidget(){
	
	chartingMode = "kisters";

		require(["kisters/builds/kiWidgets"],function(){
	
			require(["kisters/widgets/tsWidget"],function(tsWidget){
			try
			{
				var tsWidgetConf = {
	
						 floating:true, 
						 tslist:[],
						 currentFrom:"2010-01-01T00:00:00Z",
						 currentTo:"2013-02-01T00:00:00Z",
						 totalFrom:"2010-01-01T00:00:00Z", 
						 totalTo:"2013-02-01T00:00:00Z", 
						 width:"500",
						 height:"450",
						 baseUrl:"http://gisweb.kisters.de/dscwidget-servlet/DSCWidgetServlet",
						customlogo:"http://gisweb.kisters.de/kiWidgets/service/kisters_nasa.png"				 
				};
						
				var tsW = new tsWidget(tsWidgetConf,"tsWidget");		
				//var tsW = new tsWidget(tsWidgetConf);	
				
				kistersWidget = tsW;
				
				console.log(map);
			}
			catch(err)
			{
				console.log(err);
			 	//alert(err.message );
			}
				 
			});		
		
		});		

}

/**
 *Add new point to the kisters widget. 
 * @param {Object} geometry
 */
function kistersAddPoint(geometry)
{
	if(kistersWidget != null)
	{
		//var	timeSliderWidth = document.getElementById('timeSliderDiv').offsetWidth;
		timeSliderWidth = 1000;
		//var width = timeSliderWidth - 130;
		//Time Slider bar is 80% the panel, the margin on the left side of graph is 60, and 15 on the right
		var width = 950; //(timeSliderWidth * .8) + 57;
		//var marginWidth = (timeSliderWidth * .1) - 57;
		
		//dojo.byId('panel').style.margin = '0px 0px 0 50px';
		dojo.byId('panel').style.margin = '0px 0px 0px ' + '0px';
		
		dojo.byId('panel').style.width = width+'px';
		//dojo.byId('panel').style.align = 'center';
		
		kistersWidget.placeAt(dojo.byId('panel'));
			
		var lat = geometry.getLatitude();
		var lon = geometry.getLongitude();
		lat = lat.toFixed(3);
		lon = lon.toFixed(3);
		var tslist = [{srcid:"ldas",lat:lat, lon: lon,name: lat+","+lon }];
		kistersWidget.addTsByLocation(tslist);	
	}
}

/**
 *We want to update the Graph size when the web application is resized. 
 */
function kistersUpdateGraphSize()
{
	if(kistersWidget != null)
	{
		var element = dojo.byId(kistersWidget.id);
		element.remove();
		
		//var	timeSliderWidth = document.getElementById('timeSliderDiv').offsetWidth;
		var	timeSliderWidth = 1200;
		//var width = timeSliderWidth - 130;
		//Time Slider bar is 80% the panel, the margin on the left side of graph is 60, and 15 on the right
		var width = 1200; //(timeSliderWidth * .8) + 57;
		//var marginWidth = (timeSliderWidth * .1) - 57;
		
		//dojo.byId('panel').style.margin = '0px 0px 0 50px';
		//dojo.byId('panel').style.margin = '0px 0px 0px ' + marginWidth+'px';
		
		dojo.byId('panel').style.width = width+'px';
		
		var dim = new Array();
		dim.w = width;
		dim.h = 150;
		kistersWidget.resize(dim);
		//dojo.byId('panel').style.align = 'center';
		
		kistersWidget.placeAt(dojo.byId('panel'));
	}
}

/**
 *Removes the Kisters Graph from the application 
 */
function kistersDeleteGraph()
{
	if(kistersWidget != null)
	{
		var	timeSliderWidth = 1000; //document.getElementById('timeSliderDiv').offsetWidth;
		var width = timeSliderWidth;
		dojo.byId('panel').style.margin = '0px 0px 0 0px';
		dojo.byId('panel').style.width = width+'px';
		
		var element = dojo.byId(kistersWidget.id);
		element.remove();
	}
}
/**
 *Updates the Kisters graph to show a marker where the time\extent of the map is at. 
 * @param {Object} timeExtent
 */
function kistersUpdateTimeGraphic(timeExtent)
{
	if(kistersWidget != null)
		kistersWidget.setMarker(timeExtent.startTime,timeExtent.endTime);
}
