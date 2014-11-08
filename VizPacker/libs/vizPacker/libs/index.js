
$(function(){
		
	require([
	"jquery", 
	"sap/viz/vizpacker/ui/chart", 
	"sap/viz/vizpacker/ui/properties", 
	"sap/viz/vizpacker/ui/module", 
	"sap/viz/vizpacker/profile", 
	"sap/viz/vizpacker/ui/toolbar",
	"sap/viz/vizpacker/ui/dataTable",
	"sap/viz/vizpacker/ui/layout",
	"sap/viz/vizpacker/ui/editor/popupEditor",
	"sap/viz/vizpacker/gen/lib", 
	"sap/viz/vizpacker/gen/html",
	"sap/viz/vizpacker/ui/editor/filePicker"
	], 
	function(
	$, 
	_chart,
	_properties, 
	_module, 
	_profile,
	_uiTB,
	_dataTable,
	_layout,
	_popupEditor,
	_genLib, 
	_genHtml,
	_filePicker
	){		
		_profile.create();
		
		//fullscreen code editor
		var code = _profile.currentChart().code();
		_popupEditor.on("previewshowed", function() {
			if (!$("#mainNew").hasClass("docked")) {
				_layout.layout(1/3);
			}
		}).init(code);//.layout(true);
		
		_layout.on("widthchanged", function(){
			_module.layout();
			_popupEditor.layout(false);
            $(".vp-dt-table, .vp-dt-table tbody").css("maxWidth", $("#mainNew").width() - 40 * 2 + "px"); //40 is padding-right of #vp-dt-container
		}).on("heightchanged", function(){
			_popupEditor.layout(true);
		}).init();
		

		
		

		
		_module.init();
		_properties.init();
		_chart.init();			
	
		_uiTB.init();
		


		_dataTable.init();
		
		
		/*****events*****/
		//dock
		$(".vp-main-btn-dock, .vp-editor-btn-fullscreen").click(function() {
			$("#mainNew").toggleClass("docked");
			var docked = $("#mainNew").hasClass("docked");
			$(".vp-editor-btn-fullscreen")[docked ? "addClass" : "removeClass"]("docked");
		
			// update the tool-tip value and position according to dock state
			$(".vp-editor-btn-fullscreen").attr("data-original-title", docked ? "Restore Code Editor to original position" : "Expand Code Editor");
			$(".vp-main-btn-dock").attr("data-placement", docked ? "right" : "bottom").
									attr("data-original-title", docked ? "Restore tabs to original position" : "Dock tabs to the left");

			_layout.layout();
		});	
		_profile.on("propertychanged moduleadded moduleremoved datachanged datamodelchanged plotcontainerchanged", function(e) {
			var loading = $("#vpLoading");
			loading.find(".vp-loading-title").text("Generating & Executing Code...");
			loading.show();
			setTimeout(function(){
				var code;
				if (e.type === "datachanged") {
				  var chart = _profile.currentChart();
                  code = {
                      flow: _genLib.generateFlow(chart),
                      html: _genHtml.generate(chart)
                  };
                } else if (e.type === "datamodelchanged") {
					var chart = _profile.currentChart();
					code = {
						bundle: _genLib.generateBundle(chart),
						module: _genLib.generateModule(chart),
						flow: _genLib.generateFlow(chart),
						render: _genLib.generateRender(chart),
						dataMapping: _genLib.generateDataMapping(chart),
						util: _genLib.generateUtil(chart),
						html: _genHtml.generate(chart)
					};			
					if (_profile.useFlattenTable()) { //module are not reusable while using flatten table
						$(".vp-module-container:not(#plot)").find(".module").each(function(idx, mod) {
							_module.removeModule($(mod), true, true);
						});
						$(".vp-main-design-tb").hide();
					} else {
						$(".vp-main-design-tb").show();
					}
				} else if(e.type === "propertychanged" ||e.type === "moduleremoved"||e.type === "moduleadded"){
				    var chart = _profile.currentChart();
				    code = {
				        bundle: _genLib.generateBundle(chart),
						module: _genLib.generateModule(chart),
						flow: _genLib.generateFlow(chart),
						render: _genLib.generateRender(chart),
						dataMapping: _genLib.generateDataMapping(chart),
						util: _genLib.generateUtil(chart),
						html: _genHtml.generate(chart)
				    };
				} else if(e.type === "plotcontainerchanged") {
					var chart = _profile.currentChart();
					code = {
						bundle: _genLib.generateBundle(chart),
						module: _genLib.generateModule(chart),
						flow: _genLib.generateFlow(chart),
						render: _genLib.generateRender(chart),
						dataMapping: _genLib.generateDataMapping(chart),
						util: _genLib.generateUtil(chart)
					};	
				} else {
					code = _popupEditor.code();
				}
				code = _profile.code(code);
				_popupEditor.code(code, true);
				setTimeout(function(){
					loading.hide();
				}, 4);
			}, 4);
		}).on("profileloaded", function() { //refresh code editor and run if preview is open
			var loading = $("#vpLoading");
			loading.find(".vp-loading-title").text("Loading...");
			loading.show();
			setTimeout(function(){
				var code = _profile.code();
				_popupEditor.code(code, true);
				setTimeout(function(){
					loading.hide();
				}, 4);
			}, 4);
		});
		
		$("body").click(function(e){
			_properties.hide();
			_filePicker.hide();
		});
		
		var TOOLTIP_PADDING = 5;
		$(".vp-tooltip").tooltip();
		$(".vp-tooltip").hover(function(){
			// workaround the cases that a tool-tip goes off the screen
			// we have to move the tool-tip after it is shown, however the shown event only provided
			// in bootstrap 3, so we just wait for a period and move the tool-tips. 
			setTimeout(function(){
				var offset = $(".tooltip").offset(),
				width = $(".tooltip").width(),
				bodyWidth = $("body").width(),
				left;
				
				if(offset) {
					left = offset.left;
					if((left + width) > bodyWidth - TOOLTIP_PADDING) {
						left = bodyWidth - width - TOOLTIP_PADDING;
						$(".tooltip").css("left", left);
					} else if (left < TOOLTIP_PADDING) {
						$(".tooltip").css("left", TOOLTIP_PADDING);
					}
				}
			}, 200);
		});

		window.onbeforeunload = function(e) {
			return "Do you want to reload or leave VizPacker? All unsaved changes will be lost.";
		};		
		
		
		$("#vpLoading").hide();
		
	});
});
