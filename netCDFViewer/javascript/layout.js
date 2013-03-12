dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.TimeSlider");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.IdentityManager");
dojo.require("esri.geometry");
dojo.require("dojox.charting.Chart");
dojo.require("dojox.charting.plot2d.Default");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.themes.Wetland");
dojo.require("dojox.charting.themes.Shrooms");
dojo.require("dojox/charting/Theme");
dojo.require("dojox.charting.plot2d.StackedAreas");
dojo.require("esri.tasks.geometry");
dojo.require("dojo/json");

  var map, urlObject, tb;
  var timeSlider;
  var timeProperties = null;
  var i18n;
  var returnTable = null;
  var transectFeatures = null;
  var mode = "PointMode";
  
  
   function initMap() {
   	
   	
     //get the localization strings
  	 i18n = dojo.i18n.getLocalization("esriTemplate","template"); 
       
      
      //read the legend header text from the localized strings file 
      dojo.byId('legendHeader').innerHTML = i18n.tools.legend.label;

      
      if(configOptions.geometryserviceurl && location.protocol === "https:"){
        configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:','https:');
      }
      esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);  


      if(!configOptions.sharingurl){
        configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
      }
      esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
       
      if(!configOptions.proxyurl){   
        configOptions.proxyurl = location.protocol + '//' + location.host + "/sharing/proxy";
      }

      esri.config.defaults.io.proxyUrl =  configOptions.proxyurl;

      esri.config.defaults.io.alwaysUseProxy = false;
      

      
      urlObject = esri.urlToObject(document.location.href);
      urlObject.query = urlObject.query || {};
      if(urlObject.query.title){
        configOptions.title = urlObject.query.title;
      }
      if(urlObject.query.subtitle){
        configOptions.title = urlObject.query.subtitle;
      }
      if(urlObject.query.webmap){
        configOptions.webmap = urlObject.query.webmap;      
      } 
      if(urlObject.query.bingMapsKey){
        configOptions.bingmapskey = urlObject.query.bingMapsKey;      
      }

      
      var itemDeferred = esri.arcgis.utils.getItem(configOptions.webmap);
        
     
        var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap, "map", {
          mapOptions: {
            slider: true,
            sliderStyle:'small',
            nav: false,
            showAttribution:true,
            wrapAround180:true
          },
          ignorePopups:false,
          bingMapsKey: configOptions.bingmapskey
        });

        mapDeferred.addCallback(function (response) {
		  document.title = configOptions.title ||response.itemInfo.item.title;	
          dojo.byId("title").innerHTML =  configOptions.title ||response.itemInfo.item.title;
          dojo.byId("subtitle").innerHTML = configOptions.subtitle || response.itemInfo.item.snippet || "";
       

        
          map = response.map;
          var layers = response.itemInfo.itemData.operationalLayers;
          //get any time properties that are set on the map
          if(response.itemInfo.itemData.widgets && response.itemInfo.itemData.widgets.timeSlider){
            timeProperties =  response.itemInfo.itemData.widgets.timeSlider.properties;
          }
          if(map.loaded){
              initUI(layers);
            }
            else{
              dojo.connect(map,"onLoad",function(){
                initUI(layers);
              });
           } 
          //resize the map when the browser resizes
          dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
        });

        mapDeferred.addErrback(function (error) {
          alert(i18n.viewer.errors.createMap + " : " +  error.message);
        });
        
        
        //var theme = dojo.getObject('dojox.charting.themes.Wetland');
        var theme = dojo.getObject('dojox.charting.themes.Shrooms');
        theme.chart.fill = '#e3e9ee';
        theme.plotarea.fill = "#e3e9ee";
        theme.fill = "#e3e9ee";
        
        var type = dojo.getObject('dojox.charting.plot2d.StackedAreas')
        
        //createChart(null);
        
        /*
        chartOne = new dojox.charting.Chart("chartOne")
        		.addPlot("other", {type: type, tension:3})
        		.addPlot("default", {type: "Lines"})
        		.addAxis("x", {fixLower: "major", fixUpper: "major"})
        		.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", min: 0})
        		.setTheme(theme)
        		//.addSeries("Series A", [1, 2, 0.5, 1.5, 1, 2.8, 0.4])
        		
				.render(); 	*/
    }
    
    function createChart(table)
    {
    	
    	var oldSVG = d3.select("#panel").select("svg");
    	if(oldSVG != null)
    		oldSVG.remove();
    	
    	var timeExtent = map.timeExtent
		var endDate = timeExtent.endTime;
			
		var margin = {top: 10, right: 1, bottom: 30, left: 50},
    	width = 240 - margin.left - margin.right,
    	height = 315 - margin.top - margin.bottom;
		
		var x = d3.time.scale().range([0, width]);
		
		var y = d3.scale.linear().range([height, 0]);
	
		var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
		
	
		var yAxis = d3.svg.axis().scale(y).orient("left");
		
	
		var line = d3.svg.line().x(function(d) {
			return x(d.attributes.time);
		}).y(function(d) {
			return y(d.attributes.INUNDATION_RECURRENCE);
		});		
		
		var area = d3.svg.area().x(function(d) {
			return x(d.attributes.time);
		}).y0(height).y1(function(d) {
			return y(d.attributes.INUNDATION_RECURRENCE);
		}); 
			
		var panel= d3.select("#panel");
		var svg = d3.select("#panel").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  	.append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					

		d3.json(table.features);
		
		
		x.domain(d3.extent(table.features, function(d) {
			return d.attributes.time;
		}));
		
		y.domain(d3.extent(table.features, function(d) {
			return d.attributes.INUNDATION_RECURRENCE;
		})); 

		svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
	
		svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("INUNDATION RECURRENCE");
	
		svg.append("path").datum(table.features).attr("class", "line").attr("d", line);
		
		var fillArea = [];
		for(var index =0; index < table.features.length; index++)
		{
			var feat = table.features[index];
			if(feat.attributes.time < endDate)
				fillArea.push(feat);
			else
				break;
		}
		
		svg.append("path").datum(fillArea).attr("class", "area").attr("d", area);
		
    }
    
    function createTransectPlot()
    {
    	var oldSVG = d3.select("#panel").select("svg");
    	if(oldSVG != null)
    		oldSVG.remove();
    	
    	var timeExtent = map.timeExtent
		var endDate = timeExtent.endTime;
		
		var transectPlot = []
		
		for(var index =0; index < returnTable.length; index++)
		{
			var trasectFeat = transectFeatures[index];
			var transectDistance = parseInt(trasectFeat.attributes.Distance);
			var table = returnTable[index];
			var features = table.features;
	  	    for (var f=0, fl=features.length; f<fl; f++) {
	          var feature = features[f];
	          var value = feature.attributes.INUNDATION_RECURRENCE;
	          var timeValue = feature.attributes.time;
	          
	          //Get the latest date  			          
	          if(timeValue <= endDate)
	          {
	          	var plotLoc = [];
	          	plotLoc.value = value;
	          	plotLoc.distance = transectDistance;
	          	transectPlot[index] = plotLoc;	
	          }
	          else
	          	break;
	        }
		}
			
		var margin = {top: 10, right: 1, bottom: 30, left: 50},
    	width = 240 - margin.left - margin.right,
    	height = 315 - margin.top - margin.bottom;
		
		//var x = d3.time.scale().range([0, width]);
		var x = d3.scale.linear().range([0, width]);
		
		var y = d3.scale.linear().range([height, 0]);
	
		var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(3);
		
	
		var yAxis = d3.svg.axis().scale(y).orient("left");
		
	
		var line = d3.svg.line().x(function(d) {
			return x(d.distance);
		}).y(function(d) {
			return y(d.value);
		});		
		
			
		var panel= d3.select("#panel");
		var svg = d3.select("#panel").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  	.append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					

		d3.json(transectPlot);
		
		
		x.domain(d3.extent(transectPlot, function(d) {
			return d.distance;
		}));
		
		y.domain(d3.extent(transectPlot, function(d) {
			return d.value;
		})); 

		svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
	
		svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("INUNDATION RECURRENCE");
	
		//svg.append("path").datum(transectPlot).attr("class", "line").attr("d", line);
		svg.append("path").datum(transectPlot).attr("class", "transectLine").attr("d", line);
		
		svg.selectAll(".dot")
      		.data(transectPlot)
    		.enter().append("circle")
      		.attr("class", "dot")
      		.attr("r", 3.5)
      		.attr("cx", function(d) { return x(d.distance); })
      		.attr("cy", function(d) { return y(d.value); });
    }

	function addGraphic(geometry) {

		  var type = geometry.type;
          if (type === "point" || type === "multipoint") {
          	mode = "PointMode";
            addPointToMap(geometry);
          }
          else if (type === "line" || type === "polyline") {
          	mode = "LineMode";
            addLineToMap(geometry);
          }        
	  }
	  
	  function addLineToMap(geometry)
	  {
	  		tb.deactivate();
	  		
	  		var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 3);
	  		var graphic = new esri.Graphic(geometry,symbol);
	  		map.graphics.clear();
	  		map.graphics.add(graphic);
	  		
	  		var markerSymbol = new esri.symbol.SimpleMarkerSymbol();	    
		    markerSymbol.setSize(12);
		    markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
	        markerSymbol.setColor(new dojo.Color([255,0,0,0.75]));
	  		

	  		var polyline = geometry;
	  		var path = polyline.paths[0];
	  		
	  		returnTable = [];
			resultCount = path.length;
			transectFeatures = [];
			
			var subsetPolylines = [];
						
		    for(index = 0; index < path.length; index++)
		    {
		    	var pnt = path[index];
		    	var pntGeom = new esri.geometry.Point(pnt);
		    	
		    	
		    	//Creating a new Polyline to get the distance between the points.
		    	if(index > 0)
		    	{
		    		var pnt2 = path[index - 1];
		    		var pntGeom = new esri.geometry.Point(pnt);
		    		var subsetPolyline = new esri.geometry.Polyline(geometry.spatialReference);
		    		subsetPolyline.addPath([pnt, pnt2]);
		    		
		    		subsetPolylines.push(subsetPolyline);
		    	}
		    	
		    	var pntGraphic = new esri.Graphic(pntGeom,markerSymbol);
		    	map.graphics.add(pntGraphic);
		    	
		    	var attributes = new Array();
		    	attributes.OBJECTID = index;
		    		
			    var repoGeom = esri.geometry.webMercatorToGeographic(pntGeom);
			    var repoGraphic = new esri.Graphic(repoGeom,symbol);
			    repoGraphic.attributes = attributes;
			    
		        transectFeatures.push(repoGraphic);
		    }
		    
		    if(subsetPolylines.length > 0)
		    {
		    	var geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
				var lengthParams = new esri.tasks.LengthsParameters();
				lengthParams.polylines = subsetPolylines;
				lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
				lengthParams.geodesic = true;
				geometryService.lengths(lengthParams,getDistances);

		    }
		    		    
	  }
	  
	  function getDistances(result)
	  {
	  	
		var gp = new esri.tasks.Geoprocessor("http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script");
		    
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
			var inputfeatures = [];
			inputfeatures.push(transectFeatures[0]);
			var featureSet = new esri.tasks.FeatureSet();
			featureSet.features = inputfeatures;
	
			var params = {
				"InputPnt" : featureSet
			};
			gp.execute(params, getTransect);
		}
	  }
	  
	  
	  function getTransect(results, messages) {

			var timeExtent = map.timeExtent
			var endDate = timeExtent.endTime;
			
			returnTable[returnTable.length] = results[0].value; 
			var currentIndex = returnTable.length
			
			var seriesValues = [];
			
			if(currentIndex < resultCount)
			{
				var inputfeatures= [];
			    inputfeatures.push(transectFeatures[currentIndex]);
			    var featureSet = new esri.tasks.FeatureSet();
			    featureSet.features = inputfeatures;
			    
				var params = { "InputPnt":featureSet };
				var gp = new esri.tasks.Geoprocessor("http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script");
			    gp.execute(params, getTransect);
			}
			else
			{
				updateChart(returnTable);  
			}

       }
	  
	  function addPointToMap(geometry)
	  {
		  	var symbol = new esri.symbol.SimpleMarkerSymbol();	    
		    symbol.setSize(12);
		    symbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
	        symbol.setColor(new dojo.Color([255,0,0,0.75]));
		    
		    var graphic = new esri.Graphic(geometry,symbol);
		    
		    map.graphics.clear();
		    
		    map.graphics.add(graphic);
		    
		    tb.deactivate();
		    	    
		    var gp = new esri.tasks.Geoprocessor("http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script");
		    
		    var features= [];
		    var repoGeom = esri.geometry.webMercatorToGeographic(geometry);
		    var repoGraphic = new esri.Graphic(repoGeom,symbol);
	        features.push(repoGraphic);
	        var featureSet = new esri.tasks.FeatureSet();
	        featureSet.features = features;
	        
	        var params = { "InputPnt":featureSet };
	        gp.execute(params, getTable);
	  }
	  
	  function getTable(results, messages) {

			
			var seriesValues = [];
			var seriesValuesSub = [];
			var timeExtent = map.timeExtent
			var endDate = timeExtent.endTime;
			
			returnTable = results[0].value;
			//updateChart(returnTable);  	   
			
			createChart(returnTable); 
        }
        
        function updateChart(table)
        {
        	
        	var timeExtent = map.timeExtent
			var endDate = timeExtent.endTime;
				
        	if(mode == "PointMode")
        	{
        		createChart(table);
		    }
		    else
		    {
		    	createTransectPlot();        	
		    }
        	
        }
        
	 function clearGraphics() {

	    map.graphics.clear()
	    chartOne.removeSeries("Series A");    
	    chartOne.removeSeries("TimeArea");    
	    chartOne.render();
	    
	    returnTable = null;
	    
	  }
   
   function initUI(layers) {
   			
   	tb = new esri.toolbars.Draw(map);
    dojo.connect(tb, "onDrawEnd", addGraphic);
        
    //add chrome theme for popup
    dojo.addClass(map.infoWindow.domNode, "chrome");
    //add the scalebar 
    var scalebar = new esri.dijit.Scalebar({
      map: map,
      scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
    }); 
    
    //create the legend - exclude basemaps and any note layers
    var layerInfo = buildLayersList(layers);  
    if(layerInfo.length > 0){
      var legendDijit = new esri.dijit.Legend({
        map:map,
        layerInfos:layerInfo
      },"legendDiv");
      legendDijit.startup();
    }
    else{
      dojo.byId('legendDiv').innerHTML = i18n.tools.legend.layerMessage;
    }
    
    //check to see if the web map has any time properties
    
    if(timeProperties){

      var startTime = timeProperties.startTime;
      var endTime = timeProperties.endTime;
      var fullTimeExtent = new esri.TimeExtent(new Date(startTime), new Date(endTime));

      map.setTimeExtent(fullTimeExtent);
      //create the slider
      timeSlider = new esri.dijit.TimeSlider({
        style: "width: 100%;"
      }, dojo.byId("timeSliderDiv"));
      
      map.setTimeSlider(timeSlider);
      //Set time slider properties 
      timeSlider.setThumbCount(timeProperties.thumbCount);
      timeSlider.setThumbMovingRate(timeProperties.thumbMovingRate);
      //define the number of stops
      if(timeProperties.numberOfStops){
        timeSlider.createTimeStopsByCount(fullTimeExtent,timeProperties.numberOfStops);
      }else{
        timeSlider.createTimeStopsByTimeInterval(fullTimeExtent,timeProperties.timeStopInterval.interval,timeProperties.timeStopInterval.units);
      }
      //set the thumb index values if the count = 2
      if(timeSlider.thumbCount ==2){
        timeSlider.setThumbIndexes([0,1]);
      }


      dojo.connect(timeSlider,'onTimeExtentChange',function(timeExtent){
        //update the time details span.
        var timeString; 
        if(timeProperties.timeStopInterval !== undefined){
        switch(timeProperties.timeStopInterval.units){   
        case 'esriTimeUnitsCenturies':	
          datePattern = 'yyyy G';
          break;          
        case 'esriTimeUnitsDecades':
          datePattern = 'yyyy';
          break;  
         case 'esriTimeUnitsYears':
          datePattern = 'MMMM yyyy';
          break;
        case 'esriTimeUnitsWeeks':	 
          datePattern = 'MMMM d, yyyy';
          break;
        case 'esriTimeUnitsDays':
          datePattern = 'MMMM d, yyyy';
          break;        
        case 'esriTimeUnitsHours':
          datePattern = 'h:m:s.SSS a';
          break;
        case 'esriTimeUnitsMilliseconds':
          datePattern = 'h:m:s.SSS a';
          break;          
        case 'esriTimeUnitsMinutes':
          datePattern = 'h:m:s.SSS a';
          break;          
        case 'esriTimeUnitsMonths':
          datePattern = 'MMMM d, y';
          break;          
        case 'esriTimeUnitsSeconds':
          datePattern = 'h:m:s.SSS a';
          break;          
      }
       var startTime=formatDate(timeExtent.startTime,datePattern);
       var endTime = formatDate(timeExtent.endTime,datePattern);
       timeString= esri.substitute({"start_time": startTime, "end_time": endTime}, i18n.tools.time.timeRange);
       
      }
      else{
       timeString = esri.substitute({"time":formatDate(timeExtent.endTime,datePattern)},i18n.tools.time.timeRangeSingle);

      }

        
        dojo.byId('timeSliderLabel').innerHTML =  timeString;
        
        if(returnTable != null)
        	updateChart(returnTable);  	
        
      });

      timeSlider.startup();

   }
  }
  function formatDate(date,datePattern){
    return dojo.date.locale.format(date, {
        selector: 'date',
        datePattern: datePattern
      });
  }
  
  function buildLayersList(layers){

 //layers  arg is  response.itemInfo.itemData.operationalLayers;
  var layerInfos = [];
  dojo.forEach(layers, function (mapLayer, index) {
      var layerInfo = {};
      if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
        if (mapLayer.featureCollection.showLegend === true) {
            dojo.forEach(mapLayer.featureCollection.layers, function (fcMapLayer) {
              if (fcMapLayer.showLegend !== false) {
                  layerInfo = {
                      "layer": fcMapLayer.layerObject,
                      "title": mapLayer.title,
                      "defaultSymbol": false
                  };
                  if (mapLayer.featureCollection.layers.length > 1) {
                      layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
                  }
                  layerInfos.push(layerInfo);
              }
            });
          }
      } else if (mapLayer.showLegend !== false && mapLayer.layerObject) {
      var showDefaultSymbol = false;
      if (mapLayer.layerObject.version < 10.1 && (mapLayer.layerObject instanceof esri.layers.ArcGISDynamicMapServiceLayer || mapLayer.layerObject instanceof esri.layers.ArcGISTiledMapServiceLayer)) {
        showDefaultSymbol = true;
      }
      layerInfo = {
        "layer": mapLayer.layerObject,
        "title": mapLayer.title,
        "defaultSymbol": showDefaultSymbol
      };
        //does it have layers too? If so check to see if showLegend is false
        if (mapLayer.layers) {
            var hideLayers = dojo.map(dojo.filter(mapLayer.layers, function (lyr) {
                return (lyr.showLegend === false);
            }), function (lyr) {
                return lyr.id;
            });
            if (hideLayers.length) {
                layerInfo.hideLayers = hideLayers;
            }
        }
        layerInfos.push(layerInfo);
    }
  });
  return layerInfos;
  }
