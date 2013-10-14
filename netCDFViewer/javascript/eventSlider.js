var timeSliderDateLabel = "Date: January";
var selectedEventSliderIndex = 0;
var currentDateTime = null;
var timeSlicesTable = null;
var eventSliderPlayActive = false;
var tsChartPointSelected = "Selected";
var tsTimeField = 'time';


/**
 *This class handles the Event Slider.  The idea is to make this simular to the Time-Slider, however,
 * be able to handle time-steps that are irregular spaced.  Each time step should be represented
 * as a plot point.  The key though is that there has to be some sort of query to get the unique time steps. 
 */
function EventSlider() {
	
	this.setTimeSliderDateLabel = d3SetTimeSliderDateLabel;
	this.getTimeSliderDateLabel = d3GetTimeSliderDateLabel;
	this.setTimeField = setEventSliderTimeField;
	this.getDateTime = eventSliderGetDateTime;
	this.isPlayActive = getEventSliderPlayActive;
	this.isSlidersLastSpot = isLastStep;
	this.isSlidersFirstSpot = isFirstStep;
	this.moveSliderForward = eventSliderMoveForward;
	this.moveSliderBackward = eventSliderMoveBackword;
	this.playButtonClicked = eventSliderPlayButtonClicked;
	this.selectNewTimeStep = eventSliderSelectTimeStep;
	this.updateChartSize = eventSliderUpdateChartSize;
	this.createEventSlider = eventSliderGenerateEventSlider;
	
	var myVar=setInterval(function(){myTimer();},3000);
		
	//Events
	updateEventSliderTimeEvent = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	updateEventSliderTimeEvent.initEvent("EventSliderDateChanged",true,true);	
}

/****** Get/Set Properties *******************************/
function setEventSliderTimeField(value)
{
	tsTimeField = value;
}
function getEventSliderPlayActive()
{
	return eventSliderPlayActive;
}
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

function myTimer()
{	
	if(eventSliderPlayActive)
		eventSliderMoveForward();
}

function eventSliderGenerateEventSlider(features)
{
	timeSlicesTable = getTimeSlices(features);
	d3CreateEventSlider(timeSlicesTable); 	
}

/**
 *Gets the unique time slices 
 */
function getTimeSlices(features) {

	var timeSlices = [];
	for(var index = 0; index <  features.length; index++)
	{
		var row = features[index];
		var d3TimeObject = [];
		d3TimeObject[tsTimeField] = row.attributes[tsTimeField];
		timeSlices.push(d3TimeObject);
	}
	
	currentDateTime = new Date(features[0].attributes[tsTimeField]);
	timeSliderDateLabel = "Date: " + currentDateTime.toDateString(); 
	document.dispatchEvent(updateEventSliderTimeEvent);	
	
	return timeSlices;
} 

/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function addSliderPlot(margin, width, height)
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
function d3CreateEventSlider(timeSlices)
{		
	timeSliderWidth = getEventSliderWidth();
	
	//var margin = {top: 20, right: 15, bottom: 20, left: 15}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	var margin = {top: 20, right: 15, bottom: 20, left: 35},
	width = timeSliderWidth - margin.left - margin.right; // timeSliderWidth + margin.left + margin.right ; // - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 2; //185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	
	//Adding the plot framwork to the application
	var svg = addSliderPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	//var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var line = d3.svg.line().x(function(d) {
		return x(d[tsTimeField]);
	}).y(function(d) {
		return y(0);
	});		
	

	x.domain(d3.extent(timeSlices, function(d) {
		return d[tsTimeField];
	}));
	
	
	y.domain(d3.extent(timeSlices, function(d) {
		return 0;
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("path").datum(timeSlices).attr("class", "line").attr("d", line);
	
	svg.selectAll(".tsDot")
	.data(timeSlices)
	.enter().append("circle")
	.attr("class", "tsDot")
	.attr("r", 3.5)
	.attr("cx", function(d) { return x(d[tsTimeField]); })
	.attr("cy", function(d) { return y(0);})
	.on("click",eventSliderMouseClick)
	.on("mouseover",eventSliderOnMouseOver)
	.on("mouseout",eventSliderOnMouseOut) 
	.append("svg:title").text(function(d) {
		return (new Date(d[tsTimeField])).toDateString();
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
	changeEventStep();	
}

function getEventSliderWidth()
{
	totalPossibleWidth = document.getElementById('eventSliderPanel').offsetWidth;
	
	return totalPossibleWidth * .90;
}


/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function eventSliderMouseClick(d,i)
{
	selectedEventSliderIndex = i;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function eventSliderOnMouseOver(d,i)
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	var circles = svg.selectAll(".tsDot");
	var selectedCircle = circles[0][i];	
	
	if(d[tsChartPointSelected])
	{
		selectedCircle.setAttribute("r", 7);
	}
	else
	{
		selectedCircle.setAttribute("r", 4);
	}
}

/**
 *This event is fired off when the mouse is no longer hovering
 */
function eventSliderOnMouseOut(d,i)
{	
	var svg = d3.select("#eventSliderPanel").select("svg");
	var circles = svg.selectAll(".tsDot");
	var selectedCircle = circles[0][i];	
	
	if(d[tsChartPointSelected])
	{
		selectedCircle.setAttribute("r", 6);
	}
	else
	{
		selectedCircle.setAttribute("r", 2);
	}
	
}

function eventSliderPlayButtonClicked()
{
	if(eventSliderPlayActive)
		eventSliderPlayActive = false;
	else
		eventSliderPlayActive = true;
}

/**
 *Move the event slider one spot forward to the next event 
 */
function eventSliderMoveForward()
{
	if(!isLastStep())
		selectedEventSliderIndex++;
	else
		selectedEventSliderIndex = 0;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *Move the event slider one spot backwards to the previous event 
 */
function eventSliderMoveBackword()
{
	selectedEventSliderIndex--;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);	
}

function eventSliderSelectTimeStep(dateTime)
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".tsDot");
	for(var index = 0; index < circles[0].length; index++)
	{
		var chartDotCircle = circles[0][index];
		
		var dotDateValue = new Date(chartDotCircle.__data__[tsTimeField]);
		
		if(dotDateValue.getTime() == dateTime.getTime()) 
		{
			chartDotCircle.style.fill = "cyan";		
			chartDotCircle.style.stroke = "black";	
			chartDotCircle.setAttribute("r", 6);	
			
			//Marking chart point as selected so we know when mousing over the point.
			chartDotCircle.__data__[tsChartPointSelected] = true;
			
			var chartingDateLabel = "Date" + ": " + dotDateValue.toDateString(); 
	
			var textAll = svg.selectAll("#Title");
			textAll[0][0].textContent = chartingDateLabel;		
			
			//Save the selected index
			selectedEventSliderIndex = index;
		}
		else
		{
			chartDotCircle.style.fill = "";		
			chartDotCircle.style.stroke = "";
			chartDotCircle.setAttribute("r", 2);
			chartDotCircle.__data__[tsChartPointSelected] = false;
		}
	}	
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
		if(selectedEventSliderIndex + 1 >= totalSteps)
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
	if(selectedEventSliderIndex == 0)
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
	
	var circles = svg.selectAll(".tsDot");
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
	
	var circles = svg.selectAll(".tsDot");
	var selectedItem = circles[0][selectedEventSliderIndex];
	currentDateTime = new Date(selectedItem.__data__[tsTimeField]);
	eventSliderSelectTimeStep(currentDateTime);
	
}

/**
 * Removes the chart
 */
function eventSliderDeleteChart()
{
	var oldSVG = d3.select("#eventSliderPanel").select("svg");
    if(oldSVG != null)
    	oldSVG.remove();	
}

/**
 * Updates the chart
 * This is used typically when a the window has been resized.
 */
function eventSliderUpdateChartSize()
{
	eventSliderDeleteChart();
	d3CreateEventSlider(timeSlicesTable);
}
