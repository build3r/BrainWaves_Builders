define(["jquery", "./CodeEditor", "./filePicker", "../../profile", "../../gen/template"], function($, _codeEditor, _filePicker, _profile, _template){
	var _ = {},
		_holder = $("#fullscreenCodeEditor"),
		_previewPanel = _holder.find(".vp-editor-preview-panel"),
		_editPanel = _holder.find(".vp-editor-edit-panel"),
		_handle = _holder.find(".handle"),
		_editor = undefined,
		_layoutSetting = {
            preview: false,
            edit: true
        },
		_MIN_CODE_WIDTH = 400
		;

	function _layout(layout) { 
		var hw = _handle.width(),
			width = _holder.width() - hw,
			pw = 0,
			ew = 0
			;
		if (typeof layout.preview === 'boolean' || typeof layout.edit === 'boolean') {
			if (layout.preview === true && layout.edit === true) { //show both
				ew = width / 2;
				if (ew < _MIN_CODE_WIDTH) ew = _MIN_CODE_WIDTH;
				pw = width - ew;
				_editPanel.css("width", ew + "px");
				_previewPanel.css("width", pw + "px");
				_handle.css("left", pw + "px");
				_editPanel.show();
				_previewPanel.show();
				_handle.show();
			} else {
				_handle.hide();
				width += hw;
				if (layout.edit === true) { // show code only
					ew = width;
					_editPanel.css("width", ew + "px");
					_editPanel.show();
					_previewPanel.hide();
				} else { //show preview only
					pw = width;
					_editPanel.hide();
					_previewPanel.css("width", pw + "px");
					_previewPanel.show();
				}
			}
		} else {
			ew = layout.edit;
			if (ew < _MIN_CODE_WIDTH) ew = _MIN_CODE_WIDTH;
			pw = width - ew;
			_editPanel.css("width", ew + "px");
			_previewPanel.css("width", pw + "px");
			_handle.css("left", pw + "px");
			layout = {
				preview: pw,
				edit: ew
			};
		}
		_layoutSetting = layout;
	}
	function _layoutHandle(left) {
		var width = _holder.width(),
			layout = {},
			pw = left, //_handle.position().left,
			ew = width - pw - _handle.width()
			;
		layout.preview = pw;// / width;
		layout.edit = ew;// / width;
		_layout(layout);
	}
	
	/*mouse event handlers*/
	var _mouse = {
		_pressed: false,
		_x0: undefined,
		down: function(e) {
			if (!$(e.target).hasClass("handle")) return;
			$("#preview").css("pointer-events", "none");
			_mouse._pressed = true;
			_mouse._x0 = e.clientX;
			return false;
		},
		move: function(e) {
			if (e.which !== 1) return;
			if (!_mouse._pressed) {
				return;
			}
			var dx = e.clientX - _mouse._x0,
				left = _handle.position().left + dx
				;
//			_handle.css("left", left + "px");
			_layoutHandle(left);
			_mouse._x0 = e.clientX;
			e.preventDefault();
			return false;
		},
		up: function(e) {
			_mouse._pressed = false;
			$("#preview").css("pointer-events", "all");
		}		
	};
	
	function _apply() {
		var iframeDoc = document.getElementById("preview").contentWindow.document;
		iframeDoc.location.href = "about:blank";
		setTimeout(function(){
			iframeDoc = document.getElementById("preview").contentWindow.document;
			iframeDoc.open();
			var tmp = _editor.bundle.code();
			var html = _editor.html.code(),
				js = "<script type='text/javascript'>window.onerror = function(errMsg, url, line) {alert('Error happened during executing, please check your console.');};</script>\n"
					+ "<script>\n"
					+ _editor.bundle.code() + "\n"
					+ _editor.flow.code() + "\n"
					+ _editor.render.code() + "\n"
					+ _editor.module.code() + "\n"
					+ _editor.dataMapping.code() + "\n"
					+ _editor.util.code() + "\n"
					+ _template.generate(_profile.currentChart()) + "\n" // todo: use editor for template
				;
			html = html.replace(/requirejs\.config\(\{\n[\s]*baseUrl : '\.\.\/bundles[\w\/]*[^']*'\n[\s]*\}\);/gm, js);
			html = html.replace(/<script type="text\/javascript" src="\.\.\/\.\.\/\.\.\/libs\//gm, '<script type="text/javascript" src="../../libs/');
			html = html.replace(/<script\s[^>]*id="prepare"[^>]*>/, "");
			html = html.replace(/, "css![\w_]*-src\/style\/[\w]*.css"/, "");
			
			iframeDoc.write(html);
			iframeDoc.close();
			var cssCode = _editor.css.code();
			if (cssCode.replace(/(^\s*)|(\s*$)/g, "").length != 0) {
				$(iframeDoc.head).append('<style type="text/css">\n'+ cssCode +'\n</style>\n');
			}
			$(iframeDoc.body).css("margin", "0px");
		}, 50);
	}
	
	function _appendName (code, name) {
		return code.replace(/define\(/, "define(\"" + name + "\",");
	}
	
	function _init() {
		//editors
		var bundleEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorBundleJs"), false, "title", ["bundle_immutable"]);
		var	moduleEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorModuleJs"), false, "title", ["dependency"]);
		var	flowEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorFlowJs"), false, "title", ["dependency"]);
		var	renderEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorRenderJs"), false, "title", ["dependency"]);
		var	dataMappingEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorDataMappingJs"), false, "title", ["dependency"]);
		var	utilEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorUtilJs"), false, "title", ["dependency"]);
		var	htmlEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorHtml"), false, "title", ["deps", "create", "container", "data", "template"], "htmlmixed");
		var	cssEditor = _codeEditor.createEditor($("#fullscreenCodeEditor #editorCSS"), false, "title", [], "css");

		//tabs
		$("#tabEditorBundleJs").on("shown", function(){
			bundleEditor.updateHeight();
		});
		$("#tabEditorModuleJs").on("shown", function(){
			moduleEditor.updateHeight();
		});
		$("#tabEditorFlowJs").on("shown", function(){
			flowEditor.updateHeight();
		});
		$("#tabEditorRenderJs").on("shown", function(){
			renderEditor.updateHeight();
		});
		$("#tabEditorDataMappingJs").on("shown", function(){
			dataMappingEditor.updateHeight();
		});
		$("#tabEditorUtilJs").on("shown", function(){
			utilEditor.updateHeight();
		});
		$("#tabEditorHtml").on("shown", function(){
			htmlEditor.updateHeight();
		});
		$("#tabEditorCSS").on("shown", function(){
			cssEditor.updateHeight();
		});
		
		$("#tabMore").click(function(e) {
			_filePicker.listRestFiles();
			e.stopPropagation();
		});
		
		//buttons
		var appliedTipWidth = undefined;
		_holder.find(".vp-editor-btn-apply").click(function(e) {
            _apply();
         });
		_holder.find(".vp-editor-btn-apply").mouseover(function(e) {
			var btn = _holder.find(".vp-editor-btn-apply"),
				tip = _holder.find(".vp-editor-applied-tip"),
				bpos = btn.offset()
				;
			if (appliedTipWidth === undefined) {
				appliedTipWidth = tip.css({
					left: "-10000px",
					display: "block"
				}).outerWidth();
				tip.css({
					display: 'none'
				});				
			}
			tip.css({
				left: bpos.left + (btn.width() - appliedTipWidth) / 2 - 40 + "px",
				top: bpos.top + btn.height() + 1 + "px"
			}).fadeIn();
			setTimeout(function(){
				_holder.find(".vp-editor-applied-tip").fadeOut();
			}, 2000);
		});
		
		_holder.find(".vp-editor-applied-tip-close").click(function(){
			_holder.find(".vp-editor-applied-tip").fadeOut();
		});
		
        _holder.find(".vp-editor-toggle").click(function(e){
            var needLayout = false;
            if (e.offsetX < 51) { //preview
				_.showPreviewPanel(!$(this).hasClass("preview"));
            } else { //code
				_.showCodePanel(!$(this).hasClass("code"));
            }
        });
		
		//enable dragging handle
		_holder.on({
			"mousedown": _mouse.down,
			"mousemove": _mouse.move,
			"mouseup": _mouse.up
		});
		
		return {
			bundle: bundleEditor,
			module: moduleEditor,
			flow: flowEditor,
			render: renderEditor,
			dataMapping: dataMappingEditor,
			util: utilEditor,
			html: htmlEditor,
			css: cssEditor
		};
	}
	
	_.init = function(code) {
        _holder.find(".vp-editor-toggle").addClass("code");	
		_editor = _init();
		this.code(code, true);
		_editor.bundle.updateHeight();
		_editor.module.updateHeight();
		_editor.flow.updateHeight();
		_editor.render.updateHeight();
		_editor.dataMapping.updateHeight();
		_editor.html.updateHeight();
		_editor.css.updateHeight();
		return this;
	};
	
	_.code = function(code, apply) {
		if (arguments.length === 0) {
			return {
				bundle: _editor.bundle.code(),
				module: _editor.module.code(),
				flow: _editor.flow.code(),
				render: _editor.render.code(),
				dataMapping: _editor.dataMapping.code(),
				util: _editor.util.code(),
				html: _editor.html.code(),
				css: _editor.css.code()
			};
		}
		_editor.bundle.code(code.bundle);
		_editor.module.code(code.module);
		_editor.flow.code(code.flow);
		_editor.render.code(code.render);
		_editor.dataMapping.code(code.dataMapping);
		_editor.util.code(code.util);
		_editor.html.code(code.html);
		_editor.css.code(code.css);
		if (apply && _layoutSetting.preview !== false) _apply();
	};
	
	_.on = function(evtName, handler) {
		_holder.on(evtName, handler);
		return this;
	};	
	
	_.layout = function(heightChanged){
		_layout(_layoutSetting);
		if (heightChanged) {
			_editor.bundle.updateHeight();
			_editor.module.updateHeight();
			_editor.flow.updateHeight();
			_editor.render.updateHeight();
			_editor.dataMapping.updateHeight();
			_editor.util.updateHeight();
			_editor.html.updateHeight();
			_editor.css.updateHeight();
		}
	};
	

	_.highlightModule = function(moduleType) {
		_editor.bundle.highlightModule(moduleType);
		return this;
	};
	
	_.unhighlight = function() {
		_editor.bundle.unhighlight();
		return this;
	};	
	
	_.showFinder = function(show) {
		_editor.bundle.showFinder(show);
		_editor.module.showFinder(show);
		_editor.flow.showFinder(show);
		_editor.render.showFinder(show);
		_editor.dataMapping.showFinder(show);
		_editor.util.showFinder(show);
		_editor.html.showFinder(show);
		_editor.css.showFinder(show);
	};
	
	function _layoutForToggle(toggle) {
		var layout = {
			preview: false,
			edit: false
		};
		if (toggle.hasClass("preview") && toggle.hasClass("code")) {
			layout.preview = layout.edit = true;// .5;
		} else if(toggle.hasClass("preview")) {
			layout.preview = true;// 1.0;
		} else {
			layout.edit = true;// 1.0;
		}
		_layout(layout);
		if (layout.edit) {
			_editor.bundle.updateHeight();
			_editor.module.updateHeight();
			_editor.flow.updateHeight();
			_editor.render.updateHeight();
			_editor.dataMapping.updateHeight();
			_editor.util.updateHeight();
			_editor.html.updateHeight();
			_editor.css.updateHeight();
		}		
	}
	
	_.showPreviewPanel = function(show) {
		var toggle = _holder.find(".vp-editor-toggle");
		if (toggle.hasClass("preview") === !!show) return;
		if (toggle.hasClass("code") || !toggle.hasClass("preview")) {
			toggle.toggleClass("preview");
			if (toggle.hasClass("preview")) {
				_apply();
				_holder.trigger("previewshowed");
				_holder.find(".vp-editor-btn-apply").removeClass("code-only");
				_holder.find(".vp-editor-edit-panel").removeClass("code-only");
			} else {
				_holder.find(".vp-editor-btn-apply").addClass("code-only");
				_holder.find(".vp-editor-edit-panel").addClass("code-only");
			}
			_layoutForToggle(toggle);
		}
	};
	
	_.showCodePanel = function(show) {
		var toggle = _holder.find(".vp-editor-toggle");
		if (toggle.hasClass("code") === !!show) return;
		if (!toggle.hasClass("code") || toggle.hasClass("preview")) {
			toggle.toggleClass("code");
			_layoutForToggle(toggle);
		}
	};
	
	_.apply = _apply;
	
	return _;
});
