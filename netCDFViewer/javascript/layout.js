dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.TimeSlider");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.IdentityManager");
dojo.require("esri.geometry");
dojo.require("esri.tasks.geometry");
dojo.require("dojo/json");


  var map, urlObject, tb;
  var timeSlider;
  var timeProperties = null;
  var i18n;
  var returnTable = null;
  var transectFeatures = null;
  var mode = "PointMode";
  var chart = null;
  var esriMapOb = null;
  
  
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
        configOptions.proxyurl = location.protocol + '//' + location.host + "/sharing/proxy.ashx";
      }

      esri.config.defaults.io.proxyUrl =  configOptions.proxyurl;

      esri.config.defaults.io.alwaysUseProxy = false;
      

	urlObject = esri.urlToObject(document.location.href);
	urlObject.query = urlObject.query || {};
	config = utils.applyOptions(config, urlObject.query);

	if(urlObject.query.appid)
	{		
		appRequest = esri.arcgis.utils.getItem(config.appid);

		//getItem provides a deferred object; set onAppData to load when the request completes
		appRequest.then(onAppData);
	}
	else
	{
		setUpMap();
	}        
}
    
function onAppData (result) {

		//The configuration properties are stored in the itemData.values property of the result
		//Update the config variable
		config = utils.applyOptions(config, result.itemData.values);
		//Apply any UI changes
		
		console.log(result.itemData.values)
		
		
		setUpMap()
}

function setUpMap() {
	var itemDeferred = esri.arcgis.utils.getItem(config.webmap);

	var mapDeferred = esri.arcgis.utils.createMap(config.webmap, "map", {
		mapOptions : {
			slider : true,
			sliderStyle : 'small',
			nav : false,
			showAttribution : true,
			wrapAround180 : true
		},
		ignorePopups : false,
		bingMapsKey : configOptions.bingmapskey
	});

	mapDeferred.addCallback(function(response) {
		document.title = configOptions.title || response.itemInfo.item.title;
		dojo.byId("title").innerHTML = config.title || response.itemInfo.item.title;
		dojo.byId("subtitle").innerHTML = config.subtitle || response.itemInfo.item.snippet || "";

		map = response.map;
		var layers = response.itemInfo.itemData.operationalLayers;
		//get any time properties that are set on the map
		if (response.itemInfo.itemData.widgets && response.itemInfo.itemData.widgets.timeSlider) {
			timeProperties = response.itemInfo.itemData.widgets.timeSlider.properties;
		}
		if (map.loaded) {
			initUI(layers);
		} else {
			dojo.connect(map, "onLoad", function() {
				initUI(layers);
			});
		}
		//resize the map when the browser resizes
		dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
	});

	mapDeferred.addErrback(function(error) {
		alert(i18n.viewer.errors.createMap + " : " + error.message);
	});
	     
}

function resetLayout(){
	if(esriMapOb != null){
		//When the application is rezied, we want to refresh the graph
		esriMapOb.UpdateTime();
	}
	
}

var utils = {
	applyOptions : function(configVariable, newConfig) {
		var q;

		//Override any config options with query parameters
		for (q in newConfig) {
			configVariable[q] = newConfig[q];
		}
		return configVariable;
	},
	mapResize : function(mapNode) {
		//Have the map resize on a window resize
		dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
	},
	onError : function(error) {
		console.log('Error occured')
		console.log(error);
	}
}	


	function addGraphic(geometry) {
		
		tb.deactivate();
		
		if(esriMapOb == null)
			esriMapOb = new esriMap(map,config.GPTaskService);

		  var type = geometry.type;
          if (type === "point" || type === "multipoint") {
          	mode = "PointMode";
          	esriMapOb.addPointToMap(geometry);
            //addPointToMap(geometry);
          }
          else if (type === "line" || type === "polyline") {
          	mode = "LineMode";
          	esriMapOb.addTransectToMap(geometry);
            //addLineToMap(geometry);
          }        
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
    
    
    if(esriMapOb == null)
		esriMapOb = new esriMap(map,config.GPTaskService);
			
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
      
      timeSlider.loop = config.loop;
      
      map.setTimeSlider(timeSlider);
      //Set time slider properties 
      timeSlider.setThumbCount(timeProperties.thumbCount);
      //timeSlider.setThumbCount(1);
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
          datePattern = 'MMMM, y';
          break;          
        case 'esriTimeUnitsSeconds':
          datePattern = 'h:m:s.SSS a';
          break;          
      }
       var startTime=formatDate(timeExtent.startTime,datePattern);
       var endTime = formatDate(timeExtent.endTime,datePattern);
       //timeString= esri.substitute({"start_time": startTime, "end_time": endTime}, i18n.tools.time.timeRange);
       
       //Show one month
       timeString = esri.substitute({"time":formatDate(timeExtent.endTime,datePattern)},i18n.tools.time.timeRangeSingle);
      }
      else{
       timeString = esri.substitute({"time":formatDate(timeExtent.endTime,datePattern)},i18n.tools.time.timeRangeSingle);

      }

        dojo.byId('timeSliderLabel').innerHTML =  timeString;
        if(esriMapOb != null)
        {
        	esriMapOb.UpdateTime();
        }
                
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
