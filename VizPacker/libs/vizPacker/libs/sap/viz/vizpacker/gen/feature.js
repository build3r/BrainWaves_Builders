define(['jquery'], function($) {
	var _template = {
		"metadataVersion" : "1.0",
		"id" : "sap.viz.ext.helloworld",
		"name" : "Hello World",
		"description" : "Hello World",
		"version" : "1.0.0.0",
		"vendor" : {
			"name" : "SAP",
			"url" : "www.sap.com"
		},
		"requires" : [ {
			"id" : "sap.viz.common.core",
			"version" : "4.0.14"
		} ],
		"bundles" : [ {
			"id" : "sap.viz.ext.helloworld",
			"version" : "1.0.0"
		} ]
	};
	
	var _feature = $.extend(true, {}, _template);
	
	_feature.generate = function(chart) {
		_feature.id = chart.id;
		_feature.name = chart.name;
		_feature.description = chart.name;
		_feature.bundles[0].id = chart.id;
		_feature.bundles[0].version = chart.version;
		
		return JSON.stringify(_feature, undefined, 4);
	};

	_feature.filename = function(chart) {
		var id = chart.id.split('\.').slice(-1);
		return id + "-feature.json";
	};

	return _feature;
});
