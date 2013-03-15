var config = {
	title : 'MultiDimensional NetCDF Template',
	description : '',
	loop : true,
	GPTaskService : "http://wdcb4.esri.com/arcgis/rest/services/201212_NetCDF_Viewer/MakeNetCDFTable_Norfolk/GPServer/Make%20NetCDF%20Table%20Script",
	//Webmap comes with app, but normally not manually specified
	webmap : '56106bdcd93d4c9ab0de78d0c8cdaabd',
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
		},
		{
			"category":"Time Settings",
			"fields":
			[
				{
					"type":"boolean",
					"fieldName":"loop",
					"label":"Enable Looping",
					"tooltip":""
				},
				{
					"type":"string",
					"fieldName":"totalWindow",
					"label":"Total Window",
					"stringFieldOption":"textbox",
					"placeHolder":"1"
				},
				{
					"type":"options",
					"fieldName":"totalWindowUnits",
					"tooltip":"Total Window units",
					"label":"Window Units",
					"options":
					[
						{
							"label":"Hours",
							"value":"hours"
						},
						{
							"label":"Days",
							"value":"days"
						},
						{
							"label":"Weeks",
							"value":"weeks"
						},
						{
							"label":"Years",
							"value":"years"
						}
					]
				}
			]
		}
	],
	"values":
	{	
		"title":"",
		"GPTaskService":"",
		"totalWindow":"1",
		"totalWindowUnits":"hours",
		"loop":true
	}
}