
function D3Charting() {

	//Properties
	this.value = "INUNDATION_RECURRENCE";
	this.dimension = "time";
	this.margin = {top: 10, right: 1, bottom: 30, left: 50};
	//this.width = 240 - margin.left - margin.right;
	//this.height = 315 - margin.top - margin.bottom;
	
	//Methods  
	this.createTimeSeriesChart = d3CreateTimeSeriesChart;
	this.remove = d3RemoveChart;
	this.createTransectPlot = d3CreateTransectPlot;

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
 * Creates a Time Series chat as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 * @param {Object} fillArea:  Only include the features up to a certain date/time.
 */
function d3CreateTimeSeriesChart(features, fillArea)
{	
	var valueField = this.value;
	var timeField = this.dimension;
	
	var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = 240 - margin.left - margin.right,
	height = 315 - margin.top - margin.bottom;
	
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

	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(this.valueField);


	svg.append("path").datum(features).attr("class", "line").attr("d", line);

	svg.append("path").datum(fillArea).attr("class", "area").attr("d", area);

	svg.selectAll(".invDot").data(features).enter().append("circle").attr("class", "invDot").attr("r", 1.5).attr("cx", function(d) {
		return x(d.attributes[timeField]);
	}).attr("cy", function(d) {
		return y(d.attributes[valueField]);
	}).append("svg:title").text(function(d) {
		return valueField + ": " + d.attributes[valueField] + "\n" + timeField + ": " + (new Date(d.attributes[timeField])).toDateString();
	}); 

}

/**
 * Creates a Transect plot
 * @param {Object} transectPlot:  TransectPlot must be an array of Objects with a value and distance property
 */
function d3CreateTransectPlot(transectPlot)
{	
	var margin = {top: 10, right: 1, bottom: 30, left: 50},
	width = 240 - margin.left - margin.right,
	height = 315 - margin.top - margin.bottom;
		
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
	svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("INUNDATION RECURRENCE");


	svg.append("path").datum(transectPlot).attr("class", "transectLine").attr("d", line);
	
	svg.selectAll(".dot")
  		.data(transectPlot)
		.enter().append("circle")
  		.attr("class", "dot")
  		.attr("r", 3.5)
  		.attr("cx", function(d) { return x(d.distance); })
  		.attr("cy", function(d) { return y(d.value); })
  		.append("svg:title")
  		.text(function(d) { return d.value; });

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


