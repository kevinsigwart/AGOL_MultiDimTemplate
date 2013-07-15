var config = {
	title : 'MultiDimensional NetCDF Template',
	description : '',
	loop : true,
	GPTaskService : "http://wdcb4.esri.com/arcgis/rest/services/201304_MultiDimTemplate/SoilMoistureTable/GPServer/Make%20NetCDF%20Table%20from%20Point",//"http://wdcb4.esri.com/arcgis/rest/services/201304_MultiDimTemplate/NetCDFTableMaxTemp/GPServer/Make%20NetCDF%20Table%20from%20Point",//"http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script", //'http://ksigwart:6080/arcgis/rest/services/NetCDFTableRasterLayer/GPServer/Make%20NetCDF%20Table%20from%20Point', //"http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script",
	//Webmap comes with app, but normally not manually specified
	webmap : 'e5de4a367c464e57a22a0d1499a66ce5',//'32a28a9e495c4de3aaec7d2df789bf8b',//33db038f85944eb6a6c9e2628626b47a', //'56106bdcd93d4c9ab0de78d0c8cdaabd', // '6f8baac7ffb349a38f045ff2ae6c9797', //'56106bdcd93d4c9ab0de78d0c8cdaabd',
	//Below are default values that aren't set by an application'
	appid : '',
	proxy : '/proxy/proxy.ashx',
	arcgisUrl : null
}

//Application configuration specification as needed by ArcGIS Online Item
var _configSpecification = 
{
	"configurationSettings":
	[
		{
			"category":"General Settings",
			"fields":
			[
				{
					"type":"string",
					"fieldName":"title",
					"label":"Title",
					"stringFieldOption":"textbox",
					"placeHolder":""
				}
			]
		},
		{
			"category":"Charting Settings",
			"fields":
			[
				{
					"type":"string",
					"fieldName":"GPTaskService",
					"label":"GP Service",
					"stringFieldOption":"textbox",
					"placeHolder":""
				}
			]
		}
	],
	"values":
	{	
		"title":"",
		"GPTaskService":""
	}
}