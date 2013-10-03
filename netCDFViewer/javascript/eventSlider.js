var timeSliderDateLabel = "Date: January";
var selectedGraphIndex = 0;
var currentDateTime = null;

function EventSlider() {

	//Properties
	var margin = {top: 20, right: 80, bottom: 20, left: 50}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = timeSliderWidth - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 25; //300 - margin.top - margin.bottom;
	
	var timeSliderWidth = 1000; //document.getElementById('timeSliderDiv').offsetWidth;	
	
	queryForTimeSlices();
	this.setTimeSliderDateLabel = d3SetTimeSliderDateLabel;
	this.getTimeSliderDateLabel = d3GetTimeSliderDateLabel;
	this.getDateTime = eventSliderGetDateTime;
	this.isSlidersLastSpot = isLastStep;
	this.isSlidersFirstSpot = isFirstStep;
	this.moveSliderForward = eventSliderMoveForward;
	this.moveSliderBackward = eventSliderMoveBackword;
	
	//Events
	updateEventSliderTimeEvent = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	updateEventSliderTimeEvent.initEvent("EventSliderDateChanged",true,true);	
}

/****** Get/Set Properties *******************************/
function d3GetTimeSliderDateLabel()
{
	return timeSliderDateLabel;
}
function d3SetTimeSliderDateLabel(value)
{
	timeSliderDateLabel = value;
}
function eventSliderGetDateTime()
{
	return currentDateTime;
}

/**
 *In order to get the unique time slices we need to query the underlining data through a GP Service.  
 * This will be fixed once we use a Mosaic Dataset and Image Services. 
 */
function queryForTimeSlices(){
	
	var gpService = "http://arcgis-esrifederalsciences-1681685868.us-east-1.elb.amazonaws.com/arcgis/rest/services/201307_GLDAS_Multidimensional/SoilMoistureToTable/GPServer/Make%20NetCDF%20Table%20from%20Point";
	var gp = new esri.tasks.Geoprocessor(gpService);
    
    var point = new esri.geometry.Point(-99.7230062499967,38.466490312843504);
    
    //We reproject the points into WGS84 for the service.
    var features= [];

    var repoGraphic = new esri.Graphic(point,null);
    features.push(repoGraphic);
    
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    
    var params = []; //{ inputParamaterName:featureSet };
    params["InputPnt"] = featureSet; 
    
    gp.execute(params, getTimeSlices);
}

/**
 *Gets the unique time slices 
 */
function getTimeSlices(results, messages) {

	resultTables = [results[0].value];
	currentDateTime = new Date(resultTables[0].features[0].attributes['time']);
	timeSliderDateLabel = "Date: " + currentDateTime.toDateString(); 
	document.dispatchEvent(updateEventSliderTimeEvent);	
	d3CreateEventSlider(resultTables[0].features); 	
} 

/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function addPlot(margin, width, height)
{    	
	var panel= d3.select("#eventSliderPanel");
	var svg = d3.select("#eventSliderPanel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	return svg;
}

/**
 * Creates a Time Series chart as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 */
function d3CreateEventSlider(features)
{	
	var valueField = "SoilMoist1_GDS0_DBLY";
	var timeField = "time";
	
	timeSliderWidth = 1000;
	
	var margin = {top: 20, right: 15, bottom: 20, left: 15}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = timeSliderWidth - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 2; //185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	
	//Adding the plot framwork to the application
	var svg = addPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	//var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var line = d3.svg.line().x(function(d) {
		return x(d.attributes[timeField]);
	}).y(function(d) {
		return y(0);
	});		
	

	x.domain(d3.extent(features, function(d) {
		return d.attributes[timeField];
	}));
	
	
	y.domain(d3.extent(features, function(d) {
		return 0;
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	//svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(valueField);


	svg.append("path").datum(features).attr("class", "line").attr("d", line);

	//svg.append("path").datum(fillArea).attr("class", "area").attr("d", area);
	
	svg.selectAll(".invDot").data(features).enter().append("circle").attr("class", "invDot").attr("r", 2).attr("cx", function(d) {
		return x(d.attributes[timeField]);
		})
	.attr("cy", function(d) {
		return y(d.attributes[valueField]);})
	.on("click",eventSliderMouseClick)
	.append("svg:title").text(function(d) {
		return (new Date(d.attributes[timeField])).toDateString();
	}); 
	
	svg.append("text")
        .attr("x", (width / 2))          
        .attr("y", 0 - (margin.top / 2))
        .attr("id", "Title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("text-decoration", "underline")  
        .text(timeSliderDateLabel);
	
  	//We want to highlight the current view of the map
  	var circles = svg.selectAll(".invDot");
	var pnt = circles[0][0];
	pnt.style.fill = "cyan";
	pnt.style.stroke = "black";	
	pnt.setAttribute('r',6);	

}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function eventSliderMouseClick(d,i)
{
	selectedGraphIndex = i;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *Move the event slider one spot forward to the next event 
 */
function eventSliderMoveForward()
{
	selectedGraphIndex++;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *Move the event slider one spot backwards to the previous event 
 */
function eventSliderMoveBackword()
{
	selectedGraphIndex--;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);	
}

/**
 * Checking if we are currently on the last event
 */
function isLastStep()
{
	var lastStep = false;
	totalSteps = getStepsCount();
	if(totalSteps != 0)
	{
		if(selectedGraphIndex + 1 >= totalSteps)
			lastStep = true;
	}
		
	return lastStep;
}
/**
 *Check if we are on the first event 
 */
function isFirstStep()
{
	var firstStep = false;
	if(selectedGraphIndex == 0)
		firstStep = true;
	return firstStep;
}
/**
 *Gets the total number of events 
 */
function getStepsCount()
{
	var length = 0;
	
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".invDot");
	if(circles != null && circles.length > 0)
		length= circles[0].length;
		
	return length;
}

/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function changeEventStep()
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".invDot");
	for(var index = 0; index < circles[0].length; index++)
	{
		circles[0][index].style.fill = "";		
		circles[0][index].style.stroke = "";
		circles[0][index].setAttribute("r", 2);
	}
	
	var selectedItem = circles[0][selectedGraphIndex];
	selectedItem.style.fill = "cyan";		
	selectedItem.style.stroke = "black";	
	selectedItem.setAttribute('r',6);	
	
	currentDateTime = new Date(selectedItem.__data__.attributes['time']);
	timeSliderDateLabel = "Date: " + currentDateTime.toDateString(); 
	
	var textAll = svg.selectAll("#Title");
	textAll[0][0].textContent = timeSliderDateLabel;
}

