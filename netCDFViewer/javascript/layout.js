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
  var mode = "PointMode";
  var chart = null;
  var esriMapOb = null;
  var kistersWidget = null;
  var eventSliderOb = null;
  
   function initMap() {
   	
   	
     //get the localization strings
  	 i18n = dojo.i18n.getLocalization("esriTemplate","template"); 
             
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
		//When the application is resized, we want to refresh the graph
		esriMapOb.UpdateChartSize();
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
		eventSliderOb.moveSliderForward();
	}
}

/**
 *Animates through all the events.
 */
function animationPlay()
{
	//TODO: Need to implement.
}

/**
 *When the kisters button is clicked we want to activate the Draw Point tool to allow the user
 * to draw a point on the map and then plot the values within that point. 
 */
function kistersButtonClicked()
{
	mode = "kistersMode";
	tb.activate(esri.toolbars.Draw.POINT);
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
    //add the scalebar 
    var scalebar = new esri.dijit.Scalebar({
      map: map,
      scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
    }); 
    
    
    if(esriMapOb == null)
		esriMapOb = new esriMap(map,config.GPTaskService);
			
    //check to see if the web map has any time properties
    if(eventSliderOb == null)
    {
    	eventSliderOb = new EventSlider();
    	document.addEventListener("EventSliderDateChanged",updateMapTime,false);
    }
   
    //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
    var basemapGallery = new esri.dijit.BasemapGallery({
      showArcGISBasemaps: true,
      map: map
    }, "basemapGallery");
    basemapGallery.startup();
    
    basemapGallery.on("error", function(msg) {
      console.log("basemap gallery error:  ", msg);
    });
  }
  
  	/**
  	 *The event handler for when a graphic is drawn on the map using the Draw Graphics Tool 
  	 * (In this case the kisters draw point tool).  We want to add a point to the map and deactivate
  	 * the Draw Point button.  Only one point can be drawn at a time.  The user needs to reclick the
  	 * tool button to draw another point. 
  	 */
	function addGraphic(geometry) {
		
		tb.deactivate();
		
		if(esriMapOb == null)
			esriMapOb = new esriMap(map,config.GPTaskService);
	
		esriMapOb.addPointToMap(geometry,mode);
	
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
  	 	animationDateTimeLabel.textContent = dateTime.toDateString(); 
  	 	esriMapOb.UpdateMapTime(dateTime);		
  	 	
  	 	if(eventSliderOb.isSlidersLastSpot()) 
  	 		animForwardBtn.disabled = true;
  	 	else
  	 		animForwardBtn.disabled = false;
  	 		
  	 	if(eventSliderOb.isSlidersFirstSpot())
  	 		animBackwordBtn.disabled = true;
  	 	else
  	 		animBackwordBtn.disabled = false;
  	 }
  }
