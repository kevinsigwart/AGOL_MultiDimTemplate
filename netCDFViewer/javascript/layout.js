dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.geometry");
dojo.require("esri.geometry.Point");
dojo.require("esri.tasks.geometry");
dojo.require("dojo/json");


  var map, urlObject, tb;
  var timeSlider;
  var timeProperties = null;
  var i18n;
  var returnTable = null;
  var transectFeatures = null;
  var mode = "EventSlider"; //Toggle between EventSlider and Charting Mode.

  var esriMapOb = null;
  var eventSliderOb = null;
  var eventSliderTimeChartOb = null;
  var netCDFGPQueryOb = null;
    
  
   function initMap() {
   	
   	
     //get the localization strings
  	 i18n = dojo.i18n.getLocalization("esriTemplate","template"); 
       
      
      //read the legend header text from the localized strings file 
      //dojo.byId('legendHeader').innerHTML = i18n.tools.legend.label;

      
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
		
		console.log(result.itemData.values);
		
		
		setUpMap();
}

function setUpMap() {
	var itemDeferred = esri.arcgis.utils.getItem(config.webmap);

	var mapDeferred = esri.arcgis.utils.createMap(config.webmap, "map", {
		mapOptions : {
			slider : true,
			sliderStyle : 'small',
			nav : false,
			showAttribution : false,
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
		/*if (response.itemInfo.itemData.widgets && response.itemInfo.itemData.widgets.timeSlider) {
			timeProperties = response.itemInfo.itemData.widgets.timeSlider.properties;
		}*/
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
	if(eventSliderOb != null){
		//When the application is rezied, we want to refresh the graph
		//esriMapOb.UpdateTime();
		eventSliderOb.updateChartSize();
		document.getElementById('eventSliderPanel').style.height = '45px';
		
		if(eventSliderTimeChartOb != null)
		{
			dateTime = eventSliderOb.getDateTime();
			results = netCDFGPQueryOb.getResultsTable();
			eventSliderTimeChartOb.createTimeSeriesChart(results[0].features,dateTime);  	
		}

	}	
}

function removeSelections()
{
	if(esriMapOb != null){
		esriMapOb.removeSelections();
	}
}

function clearGraphics()
{
	
	mode = "EventSlider";
	
	if(esriMapOb != null){
		esriMapOb.clearGraphics();
		eventSliderTimeChartOb.remove();
		
		document.getElementById('panel').style.height = '0px';
		document.getElementById('panel').style.padding = '0px';
		document.getElementById('timeSliderFooter').style.height = '55px';
		document.getElementById('eventSliderPanel').style.height = '45px';
		document.getElementById('loadingImg').hidden = true;
		//document.getElementById('timeSliderFooter').style.padding = '0px';
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
		console.log('Error occured');
		console.log(error);
	}
};	

function initUI(layers) {
   			
   	tb = new esri.toolbars.Draw(map);
    dojo.connect(tb, "onDrawEnd", addGraphic);
        
    //add chrome theme for popup
    dojo.addClass(map.infoWindow.domNode, "chrome");
    
    /*
    //add the scalebar 
    var scalebar = new esri.dijit.Scalebar({
      map: map,
      scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
    }); */
        
    if(esriMapOb == null)
		esriMapOb = new esriMap(map,config.GPTaskService);
	
	if(netCDFGPQueryOb == null)
    {
    	netCDFGPQueryOb = new NetCDFGPQuery(config.GPTaskService);
    	document.addEventListener("NetCDFGPQueryGotQueryResults",gotNetCDFQueryResults,false);
    }
    

    if(eventSliderOb == null)
    {
    	eventSliderOb = new EventSlider();
    	document.addEventListener("EventSliderDateChanged",updateMapTime,false);
    	//For some reason, I need to set this within the code.  Have to figure out why.
    	document.getElementById('eventSliderPanel').style.height = '45px';
    	
    	//Need to prime the Event Slider with time slices.
    	var point = new esri.geometry.Point(-99.7230062499967,38.466490312843504);
    	netCDFGPQueryOb.queryPoint(point);
    }
    
    if(eventSliderTimeChartOb == null)
    {
    	eventSliderTimeChartOb = new EventSliderTimeChart();
    	document.addEventListener("EventSliderChartNewDotSelection",eventSliderChartPointSelectionUpdate,false);
    }	
  }
  


function addGraphic(geometry) {
	
	tb.deactivate();
	eventSliderTimeChartOb.remove();
	document.getElementById('panel').style.height = '190px';
	document.getElementById('panel').style.padding = '2px';
	document.getElementById('panel').style.paddingTop = '10px';
	document.getElementById('timeSliderFooter').style.height = '0px';
	document.getElementById('timeSliderFooter').style.padding = '0px';
	document.getElementById('loadingImg').hidden = false;
		
	dijit.byId("mainWindow").resize();
	
	if(esriMapOb == null)
		esriMapOb = new esriMap(map,config.GPTaskService);
	
	  var type = geometry.type;
	  if (type === "point" || type === "multipoint") {
	  	mode = "TimeChart";
	  	esriMapOb.addPointToMap(geometry);
	  	netCDFGPQueryOb.queryPoint(geometry);
	  }    
}

function animationShow(ob)
{
	graphingWidget.style.top = '130px';
}  

function animationHide(ob)
{
	graphingWidget.style.top = '60px';
}  
  /**
   * 
   */
  function eventSliderChartPointSelectionUpdate(ob)
  {
  	 if(eventSliderOb != null && esriMapOb != null)
  	 {
  	 	var obSelDateTime = ob.selectedDateTime;
	  	
	  	//Update Time Slider
	  	eventSliderOb.selectNewTimeStep(obSelDateTime);
	  	
	  	//Update Map Extent
	  	esriMapOb.UpdateMapTime(obSelDateTime);	
	  	
		//Update Animation Widget with Proper Text and Buttons
		updateAnimationWidget(obSelDateTime);
	  }
  	
  }
  
  function gotNetCDFQueryResults()
  {
  		results = netCDFGPQueryOb.getResultsTable();
  		timeField = netCDFGPQueryOb.getTimeField();
  		valueField = netCDFGPQueryOb.getOutputValueField();
  		
  		//We need to determine if we are building out the Event Slider which just shows the
  		//time steps or the Chart which graphs a points values
  		if(mode === "EventSlider")
  		{
  			eventSliderOb.setTimeField(timeField);
  			eventSliderOb.createEventSlider(results[0].features);
  		}
  		else if (mode == "TimeChart")
  		{
	  		var timeExtent = map.timeExtent;
	  		
	  		//Once we have the results we want to hide the loading image.
	  		document.getElementById('loadingImg').hidden = true;
	  		
	  		eventSliderTimeChartOb.setYFieldName(valueField);
	  		eventSliderTimeChartOb.setDimensionFieldName(timeField);
	  		eventSliderTimeChartOb.createTimeSeriesChart(results[0].features,timeExtent.startTime);
  		}
  }
  
  function updateAnimationWidget(dateTime)
  {
	  	animationDateTimeLabel.textContent = dateTime.toDateString(); 
		  	 	
  	 	if(eventSliderOb.isSlidersLastSpot()) 
  	 		animForwardBtn.disabled = true;
  	 	else
  	 		animForwardBtn.disabled = false;
  	 		
  	 	if(eventSliderOb.isSlidersFirstSpot())
  	 		animBackwordBtn.disabled = true;
  	 	else
  	 		animBackwordBtn.disabled = false;  	
  }
  
  /***
   * Event Handler Listener function for when the Event Sliders Date Changes. 
   * We want to update our Animation Widgets Date to be the same as the Event Slider
   * Also Enable/Disable the Animation buttons depending on where we are at within the
   * Event Slider.  For example disable the Forward button when we are at the last event
   * within the map.
   */
  function updateMapTime()
  {
  	 if(eventSliderOb != null)
  	 {
  	 	dateTime = eventSliderOb.getDateTime();

  	 	esriMapOb.UpdateMapTime(dateTime);

		if(netCDFGPQueryOb != null && eventSliderTimeChartOb != null && netCDFGPQueryOb.getResultsTable() != null)
		{
  			results = netCDFGPQueryOb.getResultsTable();
  		  		
  			eventSliderTimeChartOb.createTimeSeriesChart(results[0].features,dateTime);  	
  		} 			
  	 	
  	 	updateAnimationWidget(dateTime);
  	 }
  }
  /**
 *Move the Event Slider to the next event. 
 */
function animationGoForward()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.moveSliderForward();
	}
}
/**
 *Move the Event Slider to the previous event. 
 */
function animationGoBackward()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.moveSliderBackward();
	}
}

/**
 *Animates through all the events.
 */
function animationPlay()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.playButtonClicked();
		
		var playButton = document.getElementById('animPlayBtn');
		var img = playButton.children[0];
		
		
		if(eventSliderOb.isPlayActive())
			img.src = "./images/Button-Pause-16.png";
		else
			img.src = "./images/Button-Play-16.png";
		
	}
}