define([], function(){
	var _templates = {
		defaultStyle: ".v-m-plot rect.bar { stroke: black; stroke-width: 1px; stroke-opacity: 0.3 }"
	};

	var _css = {};
	_css.generate = function(chart, template) {
		var code = template || _templates.defaultStyle;
		return code;
	};
	
	_css.filename = function(chart) {
		return "default.css";
	};
	
	return _css;
});
