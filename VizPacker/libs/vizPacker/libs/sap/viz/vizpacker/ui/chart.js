define(["jquery", "./module", "./properties"], function($, _module, _properties){
	var _ = {},
		_holder = $("#mainTabLayoutDesign .vp-main-design-chart")
		;
	
	_.init = function() {
		_holder.click(function(e){
			_module.select();
			_properties.showForChart(_holder);
			_.select();
			return false;
		});
	};
	
	_.select = function() {
		_holder.addClass("select");
	};
	
	_.unselect = function() {
		_holder.removeClass("select");
	};
	
	return _;
});