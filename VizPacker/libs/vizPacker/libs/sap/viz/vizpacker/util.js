define(['jquery'], function($){
	var _util = {};
	_util.template = function(template, vals) {
		$.each(vals, function(idx, val){
			template = template.replace(new RegExp("\\$\\{" + idx + "\\}", "g"), val);
		});
		return template;
	};
	function _indentOf(level) {
		var indent = "", i = -1;
		for (; ++i < level;) indent += "    ";
		return indent;
	}
	
	_util.formatJSON = function(obj, level, trackNodes) {
		trackNodes = trackNodes || [];
		if (level === undefined) level = 0;
		var i = -1,
			indent = _indentOf(level),
			indent2 = _indentOf(level + 1),
			text = "",
			comps = []
			;
		if (obj instanceof Array) {
			var childIsArray = false;
			for (i = -1; ++i < obj.length;) {
				var nextLevel = level;
				if (obj[i] instanceof Array) {
					childIsArray = true;
					nextLevel = level + 1;
				}
				var xx = this.formatJSON(obj[i], nextLevel, trackNodes);
				comps.push(xx);  
			}
			if (childIsArray) text = "[\n" + indent2 + comps.join(", \n" + indent2) + '\n' + indent + ']'; 
			else text = "[" + comps.join(", ") + ']'; 
		} else if (typeof obj === 'object') {
			i = undefined;
			for (i in obj) {
				var xx = this.formatJSON(obj[i], level+1, trackNodes);
				xx = indent2 + '"' + i + '": ' + xx;
				if (trackNodes[i] !== undefined) {
					var tag = trackNodes[i] === '' ? i : trackNodes[i];
					xx = "\n/*<<" + tag + "*/\n" + xx + "\n/*" + tag + ">>*/\n";
				}
				comps.push(xx);//("\n" + indent + i + ": " + this.formatJSON(obj[i], level+1));
			}
			if (i === undefined) text = "{}";
			else text = "{\n" + comps.join(",\n") + '\n' + indent + '}'; 
		} else if (typeof obj === 'string') {
		    var tmp = JSON.stringify(obj);
			text = '"' + tmp.substr(1,tmp.length-2) + '"';
		} else {
			text = obj;
		}
		return text;
	};
	
	_util.regexsOfTag = function(tag, mode) {
		var rs = [new RegExp("(\\/\\*<<" + tag + "\\*\\/)([\\s\\S]*?)(\\/\\*" + tag + ">>\\*\\/)", "gm")];
		if (mode === "htmlmixed") {
			rs.push(new RegExp("(<!-- <<" + tag + " -->)([\\s\\S]*?)(<!-- " + tag + ">> -->)", "gm"));
		}
		return rs;
	};
	
	/**
	 * add num tabs to each line of str
     * @param {String} str string to add tabs
     * @param {Number} num how many tabs to add
	 */
	_util.addTab = function(str, num) {
		var space = "";
		for (var i = -1; ++i < num;) space += "\t";
		return str.split("\n").map(function(s){
			return space + s;
		}).join("\n");
	};
	
	/**
	 * attach download feature to a link
	 * @param {jquery object} ele the link ele
	 * @param {Blob} blobCB a callback function returning a blob which contains download data
	 */
	_util.attachDownloadFeature = function(ele, blobCB) {
		if ($(ele).prop("tagName") !== "A") throw "Only link item can be attached.";
		$(ele).click(function(e) {
			var me = this;
			if (!$(me).data("vizPacker")) {
				blobCB(function(filename, blob){
					var URL = window.webkitURL || window.mozURL || window.URL;			
					var event = e.originalEvent;
					var target = event.target, entry;
						if (typeof navigator.msSaveBlob === "function") {
							navigator.msSaveBlob(blob, filename);
						} else {
							var clickEvent,
								blobURL = URL.createObjectURL(blob)
								;
							clickEvent = document.createEvent("MouseEvent");
							$(me).data("vizPacker", true);
							clickEvent.vizPacker = true;
							clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
							me.href = blobURL;
							me.download = filename;
							me.dispatchEvent(clickEvent);
						}			
				});
				e.preventDefault();
				return false;
			} else {
//				delete me.download;
				$(me).data("vizPacker", false);
			}
		});			
	};

	_util.alert = function(level, msg) {
		var cls;
		switch (level) {
			case "warning":
				cls = "";
				break;
			case "error":
				cls = "alert-error";
				break;
			case "info":
				cls = "alert-info";
				break;
			case "success":
				cls = "alert-success";
				break;
			default:
				console.error("Unknown level " + level);
		}
		$("<div/>").html($("#alertTemplate").html())
			.css({
				position: "absolute",
				left: '3px',
				right: '3px',
				"z-index": 9999
			})
			.insertBefore($("#toolbar"))
			.children("div")
				.addClass(cls)
				.children("span")
					.text(msg)
			;
	};
	return _util;
});
