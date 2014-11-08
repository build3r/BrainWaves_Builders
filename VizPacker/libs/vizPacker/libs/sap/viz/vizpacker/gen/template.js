define( [ '../util' ], function(UTIL) {
	var sampleTemplate = {
		id : "sample",
		name : "Sample",
		properties : {
			"%viz.chartId%" : {
				legend : {
					title : {
						visible : true,
						text : "City/Year"
					}
				}
			}
		},
		css : ".viz-title-label.v-title {fill: #000fff}"
	};

	return {
		generate : function(chart) {
			var tpl = UTIL.formatJSON(sampleTemplate);
			tpl = tpl.replace("%viz.chartId%", chart.id);
			return "var sampleTemplate = \n" + tpl + ";\n" + "sap.viz.extapi.env.Template.register(sampleTemplate);";
		},
		filename : function(chart) {
			return "template.js";
		}
	};
});