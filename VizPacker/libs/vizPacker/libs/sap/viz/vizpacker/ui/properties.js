define(["jquery", "../profile", "../constants"],function($, _profile, _cs){
	/*properties*/
	var _properties = {},
		_holder = $("#properties"),
		_listHolder = _holder.find('.vp-main-design-properties-list'),
		_moduleType = undefined;
	if (!_listHolder) throw "Properties Inner holder is not found";
	function _onBlur(e){
		var name = $(e.target).attr('propName'),
			val = $(e.target).val()
			;
		_profile.property(_moduleType, name, val);
	}
	function _fillUIFromChart(type, names) {
		var i, val, input;
		for (i = -1; ++i < names.length;) {
			val = _profile.property(type, names[i]);
			if (val) _listHolder.find("[propName=" + names[i] +  "]").val(val);
		}
        $("#tabProperties").text("Chart Properties");
	}
	_properties.hide = function() {
		_moduleType = undefined;
		_listHolder.children().remove();
		_holder.hide();
	};
	_properties.showForModule = function(moduleType, moduleContainer) {
		_moduleType = moduleType;
		_listHolder.children().remove();
		_holder.hide();
		if (moduleType === undefined) return;
		var names = [], title;
		switch(moduleType) {
			case _cs.moduleType.title: {
				//TODO
				this.appendSelect('alignment', "Alignment", ['left', 'center', 'right'], 1);
				names = ['alignment'];
                title = "Title";
				break;
			}
			case _cs.moduleType.legend:
				this.appendSelect('type', "Type", ['ColorLegend']);
//				this.appendSelect('alignment', "Alignment", ['start', 'middle', 'end']);
				this.appendSelect('drawingEffect', "Effect", ['normal', 'glossy']);
				names = ["type", /*"alignment",*/ "drawingEffect"];
                title = "Legend";
				break;
			case _cs.moduleType.axis:
				this.appendSelect('type', "Type", ["value", "category"]);
				names = ["type"];
                title = "Axis";
				break;
			case _cs.moduleType.plot:
				this.appendInput("id", "ID");
//				this.appendSelect('type', ['CHART']);
				this.appendInput('name', "Name");
				names = ["id", "name"];
                title = "Plot Area";
				break;
			default: {
				throw 'default reached in _module.showProperties';
			}
		}	
		_fillUIFromChart(moduleType, names);
        $(".vp-main-design-properties-title").text(title);
		//re-position properties panel
		var pw = _holder.width(),
			ph = _holder.height(),
			pl, pt
			;
		var cw = moduleContainer.width(),
			ch = moduleContainer.height(),
			cp = moduleContainer.offset(),
			cl = cp.left,
			ct = cp.top
			;
		var dis = 10;
		if (moduleContainer.hasClass("vp-pos-center")) {
			pt = ct + ch * 2/3;// (ch - ph) / 2;
			pl = cl + (cw - pw) / 2;
		} else if (moduleContainer.hasClass("vp-pos-left") || moduleContainer.hasClass("vp-pos-right")) {
			pt = ct + (ch - ph) / 2;
			pl = moduleContainer.hasClass("vp-pos-left") ? cl + cw + dis : cl - dis - pw;
		} else {
			pl = cl + (cw - pw) / 2;
			pt = moduleContainer.hasClass("vp-pos-top") ? ct + ch + dis : ct - dis - ph;
		}
		_holder.css({
			left: pl + "px",
			top: pt + "px"
		}).show();
	};

    var _permittedKeys = [8,37,38,39,40,46],
        _maxLen = 140 - Math.max("_bundle.js".length, "resources/templates/sample/template.js".length)//140 from https://wiki.wdf.sap.corp/wiki/display/IDDCA/Bundle+Naming+Conventions+And+Rules
        ;
    function _validateIdLength(id) {
        var comps = id.split('.'), lastComp = comps[comps.length - 1];
        return id.length + 1 + lastComp.length <= _maxLen;
    }
    
    function _checkIdInput(input, event) {
        var key = event.which, val = input.value;
        if (event.ctrlKey || event.altKey || event.metaKey || _permittedKeys.indexOf(key) > -1) return;
        if ( !$(input).data('originalValue') && !_validateIdLength(val) ) {
            $(input).data('originalValue', val);
        }
        return false;
    }
    
	_properties.showForChart = function(container) {
		_moduleType = undefined;
		_listHolder.children().remove();
		this.appendInput("id", "ID")
            .on('keydown', function(event) {
                if (event.ctrlKey || event.altKey || event.metaKey || _permittedKeys.indexOf(event.which) > -1) return;
                var input = this, origVal = this.value;
                setTimeout(function() {
                    if (!_validateIdLength(input.value)) {
                        input.value = origVal;
                    }
                }, 1);
            })
            .on('paste', function(event) {
                var input = this, origVal = this.value;
                setTimeout(function() {
                    if (!_validateIdLength(input.value)) {
                        input.value = origVal;
                    }
                }, 1);
            })
            ;
		this.appendInput('name', "Name");
		_fillUIFromChart(undefined, ["id", "name"]);
        $(".vp-main-design-properties-title").text("Chart");
		

		var pw = _holder.width(),
			ph = _holder.height(),
			pl, pt
			;
		var cw = container.width(),
			ch = container.height(),
			cp = container.offset(),
			cl = cp.left,
			ct = cp.top
			;	
		pl = cl + (cw - pw) / 2;
		pt = ct + ch + 10;
		_holder.css({
			left: pl + "px",
			top: pt + "px"
		}).show();
		
	};
	_properties.append = function(name, desc, input) {
		if (arguments.length === 2) {
			input = desc;
			desc = name;
		} else if (arguments.length !== 3) throw new TypeError('The length of arguments must be 2 or 3');
		$(input).attr('id', 'input' + name)
			.attr("propName", name)
			.attr('placeHolder', desc)
			.addClass('prop-input')
			.val(_profile.property(_moduleType, name))
			.on("blur", _onBlur)
			;
		$("<div class='prop-group'></div>")
			.appendTo(_listHolder)
			.append("<label for='input'" + name + " class='prop-label'>" + desc + "</label>")
			.append(input)
		;
		return input;
	};
	_properties.appendInput = function(name, desc) {
		Array.prototype.push.call(arguments, $('<input type=text>'));
		return this.append.apply(this, arguments);
	};
	_properties._createSelectStr = function(options) {
		var html = "<select>";
		$.each(options, function(idx, opt) {
			html += "<option>" + opt + "</option>";
		});
		html += "</select>";
		return html;
	};
	_properties.appendSelect = function(name, desc, options, defaultOptionIdx) {
		defaultOptionIdx = Array.prototype.pop.call(arguments);
		if (defaultOptionIdx instanceof Array) {
			options = defaultOptionIdx;
			defaultOptionIdx = undefined;
		} else {
			options = Array.prototype.pop.call(arguments);
		}
		var select = $(this._createSelectStr(options));
		Array.prototype.push.call(arguments, select);
		this.append.apply(this, arguments);
		select.get(0).selectedIndex = defaultOptionIdx;
	};
	_properties.init = function() {
		_holder.find(".vp-main-design-properties-close").click(function() {
			_properties.hide();
		});
		_holder.click(function(){
			return false;
		});
	};
	return _properties;
});