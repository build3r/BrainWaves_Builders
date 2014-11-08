define(["jquery", "../../util", "./codeFinder"], function($, _util, _finder){
	var con = CodeMirror.prototype.on;
	CodeMirror.prototype.on = function(type, f, scope) {
		if (scope) {
			con.call(this, type, function() {
				return f.apply(scope, arguments);
			});
		} else {
			con.call(this, type, f);
		}
		return this;
	};
	var _unchanagableTip = $("<div class='unchangable-tip'>Code here is not editable</div>").appendTo("body");
    var _unchanagableTipTimeout = undefined;
	function _showUnchangableTip(editor, line, ch) {
//		line = line < 3 ? line + 3 : line - 3;
        if (_unchanagableTipTimeout) {
            clearTimeout(_unchanagableTipTimeout);
            _unchanagableTipTimeout = undefined;
        } 
		line -= 3;
		var frame = editor.charCoords({line: line, ch: ch});
		_unchanagableTip.css({
			left: frame.left,
			top: frame.top
		}).slideDown();
		_unchanagableTipTimeout = setTimeout(function(){
			_unchanagableTip.slideUp();
            _unchanagableTipTimeout = undefined;
		}, 2000);
	}
    function _constructFinder(holder, finderHolder, editor) {
        var me = this;
        finderHolder.html($("#codeFinderTemplate").html());
        finderHolder.find("[viz-role=close-finder]").click(function(){
			me.showFinder(false);
        });
        finderHolder.find("[viz-role=find]").click(function(){
            var query = finderHolder.find("[viz-role=find-value]").val();
            _finder.doSearch(editor, query);
            
        });
        finderHolder.find("[viz-role=highlight-all]").click(function(){
            var query = finderHolder.find("[viz-role=find-value]").val();
            _finder.highlightAll(editor, query);
        });
        finderHolder.find("[viz-role=replace]").click(function(){
            _finder.replace(editor, finderHolder.find("[viz-role=find-value]").val(), finderHolder.find("[viz-role=replace-value]").val());
        });
        finderHolder.find("[viz-role=replace-all]").click(function(){
            _finder.replaceAll(editor, finderHolder.find("[viz-role=find-value]").val(), finderHolder.find("[viz-role=replace-value]").val());
        });
    }
	function _foldJS(editor, where) { 
		editor.foldCode(where, CodeMirror.braceRangeFinder); 
	}	
	function CodeEditor(holder, readOnly, hlModule, disabledTags, mode) {
		this.holder = holder;
		this.readOnly = readOnly;
		this.hlModule = hlModule;
		this.disabledTags = disabledTags;
		this.mode = mode || "javascript";
		//create dom nodes needed
		holder.append('\
                        <div class="code-editor-container">\n\
                            <textarea class="code-view-content"></textarea>\n\
                        </div> \n' + 
                        '<div class="code-finder"></div> \n\
                      ');		
        this.finder = holder.find(".code-finder");
		//meta info
		this.meta = {
			height: undefined, //height of editor
			olHeight: undefined, //height of overlay */
			editorLines: undefined, //visible lines of editor
			allLines: undefined, //line count of code
		};	
		/*code editor*/
        var me = this;
		this.showFinder = function(show) {
			if (show) {
				if (me.finder.css("display") === "none") {
					  me.finder.slideDown(500);
					  me.holder.find(".code-editor-container").css({
						  height: me.holder.find(".code-editor-container").height() - 80 + "px"
					  });
					  me.updateHeight();
				}
				me.finder.find("[viz-role=find-value]").val(me.editor.getSelection()).focus();
			} else {
				me.finder.slideUp(300);
				holder.find(".code-editor-container").css({
					height: holder.find(".code-editor-container").height() + 80 + "px"
				});
				me.updateHeight();
				me.editor.focus();
			}
		};
		this.editor = CodeMirror.fromTextArea(holder.find(".code-view-content").get(0), {
			mode:  this.mode,
			lineNumbers: true,
			readOnly: readOnly,
			theme: 'vibrant-ink',
			smartIndent: false,
			coverGutterNextToScrollbar: true,
//			highlightSelectionMatches:true,
			extraKeys: {
				"Ctrl-F": function() {
					me.showFinder(true);
				},
				"Ctrl-Q": function(cm){
					_foldJS(me.editor, cm.getCursor());
				},
				"Tab": function(cm) { 
					cm.replaceSelection("    ", "end"); 
				}
			}
		});	
		if (!this.readOnly) {
			this.editor.on("beforeChange", function(editor, changeObj) { //cancel change if in uneditable lines
				if (changeObj.origin === "setValue") return;
				var i;
				for (i = changeObj.from.line; i <= changeObj.to.line; i++) {
					if (this.editor.lineInfo(i).bgClass && this.editor.lineInfo(i).bgClass.indexOf("read-only-code") >= 0) {
						changeObj.cancel();
                        editor.state.focused = false;//when select a not-editable text, and press a key (for instance, k), beforeChange event is called infinitively, so add this line to round it.
						//show tip of uneditable
						_showUnchangableTip(editor, i, changeObj.from.ch);
						return;
					}
				}
			}, this);
		}
        _constructFinder.call(this, this.holder, this.finder, this.editor);
	}
	
	
	function _visibleLines(editor) {
		var info = editor.getScrollInfo(),
			l0 = editor.coordsChar(info, "local").line,
			l1 = editor.coordsChar({left: 0, top: info.top + info.clientHeight}, "local").line
			;
		return {from: l0, to: l1};
	}	
	
	function _updateUI(codeEditor) {
		var editorLines = _visibleLines(codeEditor.editor)
            ;
		//calc visibleLines info
		codeEditor.meta.editorLines = editorLines.to - editorLines.from + 1;
			;
		
		codeEditor.meta.allLines = codeEditor.editor.lineCount();
	}	
	
	var cp = CodeEditor.prototype;
	cp.code = function(code) {
		if (!arguments.length) return this.editor.getValue();
		var me = this
			;
		this.editor.setValue(code);
		this.editor.clearHistory();
		setTimeout(function(){
			me.editor.refresh();
			_updateUI(me);
			//mark readOnly
			me._clearBGClass("read-only-code");
			if (!me.readOnly && me.disabledTags instanceof Array) {
				$.each(me.disabledTags, function(idx, tag){
					var ls = _linesOfTag(code, tag, me.mode);
					$.each(ls, function(jdx, l){
						me._addBGClass(l[0], l[1], "read-only-code");
					});
				});
			}
			//fold code
			var regex = /\/\*__FOLD__\*\//gm, m;
			while(m = regex.exec(code)) {
				var pos = me.editor.posFromIndex(m.index);
				_foldJS(me.editor, pos.line);
			}
		}, 1);
		return this;
	};
	cp.updateHeight = function() {
		var newHeight = this.holder.find(".code-editor-container").height()
            ;
		this.meta.height = newHeight;
		this.editor.setSize(null, newHeight);
		_updateUI(this);
		return this;
	};
	cp._addBGClass = function(from, to, clz) {
		for (var i = -1; ++i < this.meta.allLines;) {
			if (i >= from && i <=to) {
				$.each([this.editor], function(idx, editor) {
					editor.addLineClass(i, "background", clz);
				});
			}
		}
		return this;
	};
	cp._clearBGClass = function(clz) {
		for (var i = -1; ++i < this.meta.allLines;) {
			$.each([this.editor], function(idx, editor) {
				editor.removeLineClass(i, "background", clz);
			});
		}
		return this;
	};
	cp.highlight = function(from, to, clear) {
		if (clear) this._clearBGClass("highlight-code");
		this._addBGClass(from, to, "highlight-code");
		return this;
	};
	cp.unhighlight = function() {
		this.highlight(-1,-1,true);
		return this;
	};	
	
	function _linesOfTag(code, tag, mode) {
		var regexs = _util.regexsOfTag(tag, mode),
			m,
			line0, line1,
			res = []
			;
		$.each(regexs, function(idx, regex) {
			while(m = regex.exec(code)) {
				line0 = code.substring(0, m.index).split("\n").length - 1;
				line1 = line0 + m[0].split("\n").length - 1;
				res.push([line0, line1]);
			}			
		});
		return res;
	}

	cp.highlightModule = function(moduleType) {
		var ls = _linesOfTag(this.editor.getValue(), moduleType, this.mode),
			me = this
			;
		this.unhighlight();
		$.each(ls, function(idx, l) {
			me.highlight(l[0], l[1], false);
		});
		if (ls.length) {
			this.editor.scrollIntoView({
				line: ls[0][0] > 5 ? ls[0][0] - 5 : 0
			});
		}
		return this;
	};	
	
	return {
		createEditor: function(holder, readOnly, hlModule, disabledTags, mode) {
			return new CodeEditor(holder, readOnly, hlModule, disabledTags, mode);
		}
	};
});