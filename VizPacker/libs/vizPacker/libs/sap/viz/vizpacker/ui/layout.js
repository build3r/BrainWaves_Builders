define(['jquery', "../profile"], function($, profile){
	var _ = {},
		_handle = $(".handle.main"),
		_MIN_WIDTH = {
			left: 440,
			right: 550
		}
		;
	function _designTabVisible() {
		return $(".layout-tab").parents(".active").length > 0;
	}
	/**
	 * layout main & properties (width only) according to handle position
     * @return {boolean} false - can't move due to min properties width, true or undefined - can move
	 */
	function _layout(leftRatio) {
		var docked = $("#mainNew").hasClass("docked");
		$(".handle.main")[docked ? "addClass" : "removeClass"]("docked");
		var handleLeft = _handle.position().left,
			handleWidth = _handle.width(),
			codeEditorLeft = docked ? 25 :  handleLeft + handleWidth,
			bodyWidth = $("body").width(),
			codeEditorWidth = bodyWidth - codeEditorLeft,
			canMove = true
			;
		if (!docked) {
			if (typeof leftRatio === "number" || codeEditorWidth < _MIN_WIDTH.right) { //min width of property is 433px
				codeEditorWidth = typeof leftRatio === "number" ? ($("body").width() * (1 - leftRatio)) :  550;
				codeEditorLeft = $("body").width() - codeEditorWidth;
				handleLeft = codeEditorLeft - handleWidth;
				_handle.css("left", handleLeft + "px");
				canMove = false;
			}
			if (handleLeft < _MIN_WIDTH.left && bodyWidth >= (_MIN_WIDTH.left + _MIN_WIDTH.right)) {
				handleLeft = _MIN_WIDTH.left;
				_handle.css("left", handleLeft + "px");
				codeEditorLeft = handleLeft + handleWidth;
				codeEditorWidth = bodyWidth - codeEditorLeft;
				canMove = false;
			}
			$("#mainNew").css("width", handleLeft + "px");	
			$(".vp-main-design-tb").css("left", (handleLeft - $(".vp-main-design-tb").width())/2 + "px");	
		}
		$("#fullscreenCodeEditor").css({
			"width": codeEditorWidth + "px",
			"left": codeEditorLeft + "px"
		});
		_handle.trigger("widthchanged", []);
		return canMove;
	}
	/*mouse event handlers*/
	var _mouse = {
		_pressed: false,
		_x0: undefined,
		_dx0: undefined,
		down: function(e) {
			if (!$(e.target).hasClass("handle") || !$(e.target).hasClass("main")) return;
			$("iframe").parent().append("<div class='vp-iframe-mask'></div>");
			_mouse._pressed = true;
			_mouse._x0 = e.clientX;
			return false;
		},
		move: function(e) {
			if (e.which !== 1) return;
			if (!_mouse._pressed) {
				return;
			}
			var dx = e.clientX - _mouse._x0;
			if (_mouse._dx0 !== Infinity && ((_mouse._dx0 < 0 && dx < 0) || (_mouse._dx0 > 0 && dx > 0))) return;
			var left = _handle.position().left + dx;
			_handle.css("left", left + "px");
			if (!_layout()) {
	//			_handle.css("left", (left - dx) + "px");
				_mouse._dx0 = dx;
			} else {
				_mouse._x0 = e.clientX;
				_mouse._dx0 = Infinity;
			}
			e.preventDefault();
			return false;
		},
		up: function(e) {
			if (_mouse._pressed) {
				_mouse._pressed = false;
			}
			$(".vp-iframe-mask").remove();		
		}
	};

	$("#vpUseDivContainer").change(function(e) {
		if (confirm("You're changing container type, all code changes you made will be lost, do you want to continue?")) {
			profile.useDivContainer(this.checked);
		} else {
			this.checked = !this.checked;
		}
	});
//	function _onMouseDown(e) {
//		if (!$(e.target).hasClass("handle") || !$(e.target).hasClass("main")) return;
//		$("iframe").parent().append("<div class='vp-iframe-mask'></div>");
//		_pressed = true;
//		_x0 = e.clientX;
//		return false;
//	}
//	function _onMouseMove(e) {
//		if (e.which !== 1) return;
//		if (!_pressed) {
//			return;
//		}
//		var dx = e.clientX - _x0;
//		if (_dx0 !== Infinity && ((_dx0 < 0 && dx < 0) || (_dx0 > 0 && dx > 0))) return;
//		var left = _handle.position().left + dx;
//		_handle.css("left", left + "px");
//		if (!_layout()) {
////			_handle.css("left", (left - dx) + "px");
//			_dx0 = dx;
//		} else {
//			_x0 = e.clientX;
//			_dx0 = Infinity;
//		}
//		e.preventDefault();
//		return false;
//	}
//	function _onMouseUp(e) {
//		if (_pressed) {
//			_pressed = false;
//			_handle.trigger("widthchanged", []);
//		}
//		$(".vp-iframe-mask").remove();
//	}
	_.init = function() {
		_layout();
		$(window).on('resize', function() {
			_layout();
			_handle.trigger("heightchanged"); //widthchanged is triggered in _layout;
		});
		$('body').on({
			mousedown: _mouse.down,
			mousemove: _mouse.move,
			mouseup: _mouse.up
		});		
	};
	_.layout = _layout;
	_.on = function(name, handler) {
		_handle.on(name, handler);
		return this;
	};
	return _;
});