define(["jquery"], function($){
	var _func = {};
	_func.dialog = function() {return $('#dialogFunc');};
	_func.propertiesUI = function() {
		var me = this;
		return $("<button class='btn'>Edit</button>").click(function(){
			me.dialog().modal();
		});
	};
	return _func;
});