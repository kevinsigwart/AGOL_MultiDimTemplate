//Global Variables.  These are needed in the events so the have to be global
var yValueField = "SoilMoist1_GDS0_DBLY";
var dimension = "time";

var chartingMode = "";
var selectedGraphIndex = -1;
var chartPointSelectedEvent;
var updateChartEvent;

function EventSliderTimeChart() {
	
	//Methods  
	this.createTimeSeriesChart = esCreateTimeSeriesChart;
	this.remove = esRemoveChart;
	this.setYFieldName = d3SetyFieldName;
	this.getYFieldName = d3GetyFieldName;
	this.setDimensionFieldName = d3SetDimensionFieldName;
	this.getDimensionFieldName = d3GetDimensionFieldName;
	
	//Events
	eventSliderTimeChartDotClicked = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	eventSliderTimeChartDotClicked.initEvent("EventSliderChartNewDotSelection",true,true);	
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
 *Removes the Chart 
 */
function esRemoveChart() {
	
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
function esCreateTimeSeriesChart(features, currentDateTime)
{	

	//Removing Old Chart if it still exists
	esRemoveChart();
	
	var valueField = yValueField;
	var timeField = dimension;
		
	chartingWidth = getTimeChartWidth();
	
	//var margin = {top: 10, right: 80, bottom: 20, left: 50}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	var margin = {top: 20, right: 15, bottom: 20, left: 45},
	width = chartingWidth - margin.left - margin.right; //chartingWidth; //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	//Adding the plot framwork to the application
	var svg = addSliderTimePlot(margin, width, height);
			
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6);
	
	var line = d3.svg.line()
	.x(function(d) { return x(d.attributes[timeField]);	})
	.y(function(d) { return y(d.attributes[valueField]);});
	
		
	x.domain(d3.extent(features, function(d) {
		return d.attributes[timeField];
	}));
	
	y.domain(d3.extent(features, function(d) {
		return d.attributes[valueField];
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "-40").style("text-anchor", "end").text(valueField);


	//Adding the line on the graph
	svg.append("path")
	.datum(features)
	.attr("class", "tsChartLine")
	.attr("d", line);

	//Adding the data points on the graph
	svg.selectAll(".tsChartDot")
	.data(features)
	.enter().append("circle")
	.attr("class", "tsChartDot")
	.attr("r", 3.5)
	.attr("cx", function(d) { return x(d.attributes[timeField]); })
	.attr("cy", function(d) { return y(d.attributes[valueField]); })
	.on("click",timeChartMouseClick)
	.on("mouseover",timeChartOnMouseOver)
	.on("mouseout",timeChartOnMouseOut) 
	.append("svg:title").text(function(d) { return valueField + ": " + d.attributes[valueField] + "\n" + timeField + ": " + (new Date(d.attributes[timeField])).toDateString(); }); 
	
	var timeSliderDateLabel = currentDateTime.toDateString();
	
	svg.append("text")
    .attr("x", (width / 2))          
    .attr("y", 0 - (margin.top / 2))
    .attr("id", "Title")
    .attr("text-anchor", "middle")  
    .style("font-size", "14px") 
    .style("text-decoration", "underline")  
    .text(timeSliderDateLabel);
    
  	//We want to highlight the current view of the map
  	selectActivePoint(currentDateTime);
}

/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function addSliderTimePlot(margin, width, height)
{    	
	var panel= d3.select("#panel");
	var svg = d3.select("#panel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	return svg;
}

function getTimeChartWidth()
{
	totalPossibleWidth = document.getElementById('panel').offsetWidth;
	
	return totalPossibleWidth * .90;
}

/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function selectActivePoint(dateTime)
{
	var svg = d3.select("#panel").select("svg");
	
	var circles = svg.selectAll(".tsChartDot");
	for(var index = 0; index < circles[0].length; index++)
	{
		var chartDotCircle = circles[0][index];
		
		var dotDateValue = new Date(chartDotCircle.__data__.attributes[dimension]);
		
		if(dotDateValue.getTime() == dateTime.getTime()) 
		{
			chartDotCircle.style.fill = "cyan";		
			chartDotCircle.style.stroke = "black";	
			chartDotCircle.setAttribute("r", 6);	
			
			var chartValue = chartDotCircle.__data__.attributes[yValueField];
			var chartingDateLabel = "Map Date" + ": " + dotDateValue.toDateString(); 
			
			chartDotCircle.__data__.attributes["Selected"] = true;
			
			var textAll = svg.selectAll("#Title");
			textAll[0][0].textContent = chartingDateLabel;		
		}
		else
		{
			chartDotCircle.__data__.attributes["Selected"] = false;
			chartDotCircle.style.fill = "";		
			chartDotCircle.style.stroke = "";
			chartDotCircle.setAttribute("r", 3.5);
		}
	}
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function timeChartMouseClick(d,i)
{
	var selectedDateTime = new Date(d.attributes[dimension]);
	eventSliderTimeChartDotClicked.selectedDateTime = selectedDateTime;
	
	//Update Chart to Select this new date
	selectActivePoint(selectedDateTime);

	//Fire off an event so that the other layout controls can update
	document.dispatchEvent(eventSliderTimeChartDotClicked);
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function timeChartOnMouseOver(d,i)
{
	var svg = d3.select("#panel").select("svg");
	var circles = svg.selectAll(".tsChartDot");
	var selectedCircle = circles[0][i];	
	
	if(d.attributes["Selected"])
	{
		selectedCircle.style.strokeWidth = '2px';	
		selectedCircle.setAttribute("r", 7);
	}
	else
	{
		selectedCircle.style.strokeWidth = '2px';	
		selectedCircle.setAttribute("r", 4.5);
	}
}

/**
 *This event is fired off when the mouse is no longer hovering
 */
function timeChartOnMouseOut(d,i)
{	
	var svg = d3.select("#panel").select("svg");
	var circles = svg.selectAll(".tsChartDot");
	var selectedCircle = circles[0][i];	
	
	if(d.attributes["Selected"])
	{
		selectedCircle.style.strokeWidth = '1px';	
		selectedCircle.setAttribute("r", 6);
	}
	else
	{
		selectedCircle.style.strokeWidth = '1px';	
		selectedCircle.setAttribute("r", 3.5);
	}
	
}
