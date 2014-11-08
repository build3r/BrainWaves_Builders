define(["jquery", "./properties", "../func", "../profile", "../constants", "./editor/popupEditor"],function($, _properties, _func, _profile, _cs, _codeEditor){
	/*module*/
	var _module = {},
		_tabHolder = $(".layout-tab")
		;
	_module._lastId = 1;
	_module.nextId = function() {
		return '_M_' + ++this._lastId;
	};
	
	/**
	 * is the container at left or right
     * @param {jQuery} container container of module
	 */
	function isHorizonal(container) {
		return $(container).hasClass("vp-pos-left") || $(container).hasClass("vp-pos-right");//ttr('id') === 'left' || $(container).attr('id') === 'right';
	};
	/**
	 * completeCB: complete callback. if it's boolean, then it's noAnimate
     * @param {jQuery} container container of module
     * @param {function} completeCB callback of completion
	 */
	function layoutContainer(container, completeCB) {
		var margin = 0,
			mods = $(container).children('.module'),
			noAnimate = completeCB === true
			;
		
		typeof completeCB === 'function' || (completeCB = undefined);		
		var tgt;
		if (isHorizonal(container)) {
			var h = ($(container).height() - margin *2 - (mods.length - 1) * margin) / mods.length;
			tgt = {
				width: $(container).width() - 2 * margin,
				height: h
			};
		} else {
			var w = ($(container).width() - margin * 2 - (mods.length - 1) * margin * 2) / mods.length;
			tgt = {
				width: w,
				height: $(container).height() - 2 * margin
			};
		}		
		if (noAnimate) {
			mods.css(tgt);
			if (completeCB) completeCB();
		} else {
			mods.animate(tgt, {
				complete: completeCB
			});
		}
	};
	var _selectedModule = undefined;
	_module.select = function(modDiv) {
		$(".vp-module-container").removeClass("select");
		_selectedModule = modDiv;
		if (modDiv) {
			$(modDiv).parents(".vp-module-container").addClass("select");
			var type = $(modDiv).attr('type');
			_properties.showForModule(type, $(modDiv).parents(".vp-module-container"));
//			_codeEditor.highlightModule(type); //comment out because highlight is overlayed by readonly style.
			$("#mainTabLayoutDesign .vp-main-design-chart").removeClass("select");
		} else {
			_properties.hide();
			_codeEditor.unhighlight();
		}
	};
	
	_module.selectedModule = function() {
		return _selectedModule;
	};
	
	_module.removeModule = function(module, noAnimate, noEvent) {

//	function delModule(module, noAnimate, noEvent) {
		var tgt = {},
			container = module.parents(".vp-module-container")
			;
		function logic() {
			module.parents(".vp-module-container").removeClass("select");
			module.remove();
			if (container.find(".module").length === 0) container.removeClass("has-module");
			_profile.removeModule(module.attr('type'), noEvent);
			_properties.hide();
			layoutContainer(container);
			$("#vpModuleItem-" + module.attr("type")).attr("disabled", false).prop("title", "Drag me to add to chart");
		}
		if (noAnimate) {
			logic();
		} else {
			tgt[isHorizonal(container) ? 'height' : 'width'] = 0;
			module.animate(tgt, {
				complete: logic
			});
		}
	};
	
	/**
	 * event handler of deleting a module
     * @param {jQuery Event} e event
	 */	
	function _onDelModule(e) {
		var module = $(e.target).parents(".module");
		_module.removeModule(module);
	}
	/**
	 * add a module to a container
     * @param {jQuery} container container of module
     * @param {String} id module type
     * @param {bool} permanent whether the module can be removed
	 */
	_module.addTo = function(container, id, permanent, noselect) {
		var me = this, type = id, name = _cs.nameOfModuleType(type);
		var modDiv = $("<div class='module'><div class='module-title'>" + name + '</div></div>')
			.appendTo(container)
			.attr('id', me.nextId())
			.attr('type', type)
			.attr('draggable', !permanent)
			.css('display', 'none')
			.on('click', function() {
				me.select(this);
				return false;
			})
			.on('dragstart',instanceDragStart)
			;
		//calculate width, height considering margin
		layoutContainer(container, function() {
			modDiv.css({
				display: 'block'
			});
//			_codeEditor.update();
			if (!noselect) me.select(modDiv);
		});
		
		//disable module item
		$("#vpModuleItem-" + type).attr("disabled", true).prop('title', 'I was added to chart');
		
		
		//add "Delete" button
		if (!permanent) {
			$('<div class="remove-module"></div>').appendTo(modDiv).on('click', _onDelModule);
		}
		
		$(container).addClass("has-module");
		return modDiv;
	};
	
	function _dropHint(type) {
		$(type === _cs.moduleType.legend ? ".vp-pos-left,.vp-pos-right" : ".vp-module-container").addClass("drop-hint");
	}
	
	function tbDragStart(e){
		var type = $(this).attr('id').split("-").pop();
		if ($(e.target).attr("disabled")) return false;
		var dt = e.originalEvent.dataTransfer;
		dt.setData('from', 'tb');
		dt.setData('type', type);
		_dropHint(type);
	}	
	function instanceDragStart(e) {
		var dt = e.originalEvent.dataTransfer,
			type = $(this).attr("type");
		dt.setData('from', 'instance');
		dt.setData('id', $(this).attr('id'));
		dt.setData("type", type);
		$(this).find(".remove-module").css("display", "none");
		_dropHint(type);
	}
	
	function _dropTarget(e) {
		var mc = $(e.target).hasClass("vp-module-container") ? 
				$(e.target) : $(e.target).parents(".vp-module-container"),
			id = mc.attr("id"),
			type = e.originalEvent.dataTransfer.getData('type')
			; 
		if (id === "plot") return undefined;
		if (type === _cs.moduleType.legend && !isHorizonal(mc)) return undefined;//legend supports only left & right
		return mc;
	}
	
	function dragEnter(e) {
//		var mc = _dropTarget(e);
//		if (mc) {
//			mc.addClass("drop-hint");
//		}
	}
	function dragLeave(e) {
//		var mc = _dropTarget(e);
//		if (mc) {
//			mc.removeClass("drop-hint");
//		}
	}
	function dragOver(e) {
		var mc = _dropTarget(e);
		if (mc) {
			e.preventDefault();
			return false;
		}
	}
	
	function _pos(container) {
		return /\bvp-pos-(\w*)\b/.exec(container.className)[1];
	}
	
	function drop(e) {
		var dt = e.originalEvent.dataTransfer,
			mc = _dropTarget(e),
			mode = dt.getData('from');
		if (mode === 'tb') { //from toolbar
			var modDiv = _module.addTo(this, dt.getData('type'));
			//create module to profile
			var idx = $(this).find(".module").index(modDiv);
			_profile.createModule(dt.getData('type'), _pos(this), idx + 1);				
		} else if (mode === 'instance') { //from other container
			var module = $('#' + dt.getData('id')),
				prevContainer = module.parents(".vp-module-container");
				;
			module.detach().appendTo(this);
			if (prevContainer.find(".module").length === 0) prevContainer.removeClass("has-module");
			mc.addClass("has-module");
			layoutContainer(prevContainer);
			layoutContainer(this);
			var position = _pos(this);
			$(this).find(".module").each(function(idx){
				_profile.property($(this).attr("type"), "layout", {
					position: position,
					priority: idx + 1
				});
				_module.select(module);
			});
//			_codeEditor.update();
		}
	}
	function dragEnd(e) {
		$(e.target).find(".remove-module").css("display", "");
		$(".vp-module-container").removeClass("drop-hint");
	}
	function _updateUIFromChart() {
		var tm = _profile.title(), lm = _profile.legend(), pos;
		if (pos = _profile.position(tm)) {
			_module.addTo($('.vp-pos-' + pos), _cs.moduleType.title, false, true);
		}
		if (pos = _profile.position(lm)) {
			_module.addTo($('.vp-pos-' + pos), _cs.moduleType.legend, false, true);
		}
	}
	_module.init = function() {
		/*dnd*/
		$('.vp-module-container').on({
			'dragenter': dragEnter,
			'dragleave': dragLeave,
			'dragover': dragOver,
			'drop': drop,
			'dragend': dragEnd
		});
		
		//add modules to tb of layout design tab
		var idx = 0;
		$.each(_cs.moduleType, function(id, modId) {
			if (modId === _cs.moduleType.plot) return;
			if (idx++ > 0) { // add separator
				$("<div class='vp-module-item-separator'></div>").appendTo(".vp-main-design-tb");
			}
			var modTitle = modId === _cs.moduleType.title ? "Title Bar" : "Legend"
				;
			
			$("<div id='vpModuleItem-" + modId + "' class='vp-module-item' draggable=true><div class='vp-module-item-name'>" + modTitle + "</div></div>").appendTo('.vp-main-design-tb')
				.on({
					'dragstart': tbDragStart,
					'dragend': dragEnd
				});
		});
		//add modules to each part
		_updateUIFromChart();
		_module.addTo($("#plot"), _cs.moduleType.plot, true, true);		
		
		//for load profile
		_profile.on("profileloaded", function(){
			$(".vp-module-container:not(#plot)").find(".module").each(function(){
				var module = $(this);
				module.parents(".vp-module-container").removeClass("select has-module");
				module.remove();
				$("#vpModuleItem-" + module.attr("type")).attr("disabled", false).prop("title", "Drag me to add to chart");
			});
			_updateUIFromChart();
		});
	};
	_module.layout = function() {
		if ($("#mainNew").hasClass("docked") || !_tabHolder.parents(".active").length) return;
//		$(".vp-main-design-module").css({
//			"height": $(".vp-main-design-chart").height() * .8 + "px"
//		});
		$(".vp-module-container").each(function(){
			layoutContainer(this, true);
		});
	};
	return _module;
});