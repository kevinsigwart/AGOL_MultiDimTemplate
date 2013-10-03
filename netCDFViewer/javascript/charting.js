//dojo.require("kisters/builds/kiWidgets");
//dojo.require("kisters/widgets/tsWidget");

//Global Variables.  These are needed in the events so the have to be global
var yValueField = "";
var dimension = "";

var chartingMode = "";
var selectedGraphIndex = -1;
var chartPointSelectedEvent;
var updateChartEvent;
var kistersWidget;

function D3Charting() {

	//Properties
	var margin = {top: 10, right: 1, bottom: 30, left: 50};
	
	//Events
	chartPointSelectedEvent = document.createEvent("Event");
	updateChartEvent = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	chartPointSelectedEvent.initEvent("ChartPointSelected",true,true);
	//Only using this when a plot point has been double clicked
	updateChartEvent.initEvent("UpdateChart",true,true);
	
	kistersInitWidget();
		
	//Methods  
	this.createTimeSeriesChart = d3CreateTimeSeriesChart;
	this.remove = chartingRemoveChart;
	this.createTransectPlot = d3CreateTransectPlot;
	this.setYFieldName = d3SetyFieldName;
	this.getYFieldName = d3GetyFieldName;
	this.setDimensionFieldName = d3SetDimensionFieldName;
	this.getDimensionFieldName = d3GetDimensionFieldName;
	this.setChartingMode = d3SetChartingMode;
	this.getChartingMode = d3GetChartingMode;
	this.getSelectedGraphIndex = d3GetSelectedGraphIndex;
	this.setSelectedGraphIndex = d3SetSelectedGraphIndex;
	this.selectGraphPoint = d3HighlighGraphPntFromIndex;
	this.clearSelection = d3ClearSelection;
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
/**
 *Gets the Current Selected Graph Index:
 * The index of the transect point selected on the map.
 * Returns -1 if no point is selected 
 */
function d3GetSelectedGraphIndex()
{
	return selectedGraphIndex;
}
/**
 * Sets the Current Selected Graph Index:
 * The index of the transect point selected on the map.
 */
function d3SetSelectedGraphIndex(index)
{
	selectedGraphIndex = index;
}

function chartingRemoveChart()
{
	if(chartingMode != "kisters")
		d3RemoveChart();
	else
		kistersDeleteGraph();
}


/**
 *Removes the Chart 
 */
function d3RemoveChart() {
	
	var oldSVG = d3.select("#panel").select("svg");
    if(oldSVG != null)
    	oldSVG.remove();
}

/**
 * Creates a Time Series chart as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 * @param {Object} fillArea:  Only include the features up to a certain date/time.
 */
function d3CreateTimeSeriesChart(features, fillArea)
{	
	var valueField = yValueField;
	var timeField = dimension;
	
	//timeSliderWidth = document.getElementById('timeSliderDiv').offsetWidth;
	timeSliderWidth = 500;
	
	var margin = {top: 10, right: 80, bottom: 20, left: 50}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = timeSliderWidth - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	
	
	
	
	//Adding the plot framwork to the application
	var svg = addPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var line = d3.svg.line().x(function(d) {
		return x(d.attributes[timeField]);
	}).y(function(d) {
		return y(d.attributes[valueField]);
	});		
	
	var area = d3.svg.area().x(function(d) {
		return x(d.attributes[timeField]);
	}).y0(height).y1(function(d) {
		return y(d.attributes[valueField]);
	}); 
		
	
	x.domain(d3.extent(features, function(d) {
		return d.attributes[timeField];
	}));
	
	y.domain(d3.extent(features, function(d) {
		return d.attributes[valueField];
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(valueField);


	svg.append("path").datum(features).attr("class", "line").attr("d", line);

	//svg.append("path").datum(fillArea).attr("class", "area").attr("d", area);

	svg.selectAll(".invDot").data(features).enter().append("circle").attr("class", "invDot").attr("r", 1.5).attr("cx", function(d) {
		return x(d.attributes[timeField]);
	}).attr("cy", function(d) {
		return y(d.attributes[valueField]);
	}).append("svg:title").text(function(d) {
		return valueField + ": " + d.attributes[valueField] + "\n" + timeField + ": " + (new Date(d.attributes[timeField])).toDateString();
	}); 
	
  	//We want to highlight the current view of the map
  	var circles = svg.selectAll(".invDot");
	var pnt = circles[0][fillArea.length - 1];
	pnt.style.fill = "cyan";
	pnt.style.stroke = "black";	
	pnt.setAttribute('r',6);	

}

/**
 * Creates a Transect plot with the transect distances on the x axis and the values on y
 * @param {Object} transectPlot:  TransectPlot must be an array of Objects with a value and distance property
 */
function d3CreateTransectPlot(transectPlot)
{	
	var valueField = yValueField;
	
	/*
	var margin = {top: 10, right: 80, bottom: 20, left: 50}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = 880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	*/
	
	timeSliderWidth = document.getElementById('timeSliderDiv').offsetWidth;
	
	var margin = {top: 10, right: 80, bottom: 20, left: 50}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = timeSliderWidth - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	/*
	var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = 240 - margin.left - margin.right,
	height = 315 - margin.top - margin.bottom;*/
			
	//Adding the plot framwork to the application
	var svg = addPlot(margin, width, height);
	
	var x = d3.scale.linear().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(3);
	var yAxis = d3.svg.axis().scale(y).orient("left");
				
	var line = d3.svg.line().x(function(d) {
		return x(d.distance);
	}).y(function(d) {
		return y(d.value);
	});		
	
	x.domain(d3.extent(transectPlot, function(d) {
		return d.distance;
	}));
	
	y.domain(d3.extent(transectPlot, function(d) {
		return d.value;
	})); 

	//Add x and y axis to the plot
	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);	
	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(valueField);


	svg.append("path").datum(transectPlot).attr("class", "transectLine").attr("d", line);
	
	svg.selectAll(".dot")
  		.data(transectPlot)
		.enter().append("circle")
  		.attr("class", "dot")
  		.attr("r", 3.5)
  		.attr("cx", function(d) { return x(d.distance); })
  		.attr("cy", function(d) { return y(d.value); })
  		.on("click",d3MouseClick)
  		.on("dblclick",d3DoubleClick)
  		.append("svg:title")
  		.text(function(d) { return d.value; });
  	
  	//If we have an item in the chart selected we need to be sure to identify it every time this redraws	
  	if(selectedGraphIndex != -1)
  	{
  		var circles = svg.selectAll(".dot");
  		var pnt = circles[0][selectedGraphIndex];
  		pnt.style.fill = "cyan";
		pnt.style.stroke = "black";	
		pnt.setAttribute('r',6);	
  	}

}

/***
 *The event fires off whenever a plot point is double clicked.  
 * This drills into that item and plots it over time. 
 */
function d3DoubleClick(d,i)
{
	selectedGraphIndex = i;
	chartingMode = "TransectPointMode";
	
	//Dispatching an Event saying the Graph Point has been selected.  Map should highlight feature
	document.dispatchEvent(chartPointSelectedEvent);
	
	d3HighlighTransectPoint(this);
	
	d3RemoveChart();

	//This event lets the mapping application know it's time to draw the chart based off it's current time.
	document.dispatchEvent(updateChartEvent);
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function d3MouseClick(d,i)
{
	selectedGraphIndex = i;
	
	document.dispatchEvent(chartPointSelectedEvent);
		
	d3HighlighTransectPoint(this);
}

/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function d3HighlighGraphPntFromIndex(selectedIndex)
{
	var svg = d3.select("#panel").select("svg");
	
	var circles = svg.selectAll(".dot");
	for(var index = 0; index < circles[0].length; index++)
	{
		circles[0][index].style.fill = "red";		
		circles[0][index].style.stroke = "black";
		circles[0][index].setAttribute('r',3.5);
	}
	
	circles[0][selectedIndex].style.fill = "cyan";		
	circles[0][selectedIndex].style.stroke = "cyan";	
	circles[0][selectedIndex].setAttribute('r',6);	
}

/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function d3HighlighTransectPoint(pnt)
{
	var svg = d3.select("#panel").select("svg");
	
	var circles = svg.selectAll(".dot");
	for(var index = 0; index < circles[0].length; index++)
	{
		circles[0][index].style.fill = "red";		
		circles[0][index].style.stroke = "black";
		circles[0][index].setAttribute('r',3.5);
	}
		
	pnt.style.fill = "cyan";
	pnt.style.stroke = "black";	
	pnt.setAttribute('r',6);	
}
/**
 *Clears the selected points on the graph
 */
function d3ClearSelection()
{
	var svg = d3.select("#panel").select("svg");

	var circles = svg.selectAll(".dot");
	if (circles != null && circles.length) {
		for (var index = 0; index < circles[0].length; index++) {
			circles[0][index].style.fill = "red";
			circles[0][index].style.stroke = "black";
			circles[0][index].setAttribute('r', 3.5);
		}
	}

}
/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function addPlot(margin, width, height)
{    	
	var panel= d3.select("#panel");
	var svg = d3.select("#panel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	return svg;
}

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

function kistersUpdateTimeGraphic(timeExtent)
{
	if(kistersWidget != null)
		kistersWidget.setMarker(timeExtent.startTime,timeExtent.endTime);
}
