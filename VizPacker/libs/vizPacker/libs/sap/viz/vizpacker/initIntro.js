define(['./vizPackerIntro', './ui/editor/popupEditor'], function startIntro(VizPackerIntro, popupEditor) {
	var vizPackerIntro = function() {

        function _prepareCodeEditorIntro() {
            var title = $('#vp-editor-title')[0],
                btnPreCode = $('#vp-editor-toggle-code-preview')[0],
                btnFullScreen = $('#vp-editor-btn-fullscreen')[0],
                btnRunCode = $('#vp-editor-btn-apply')[0],
                cloneTabs = $('.vp-editor-edit-panel .nav-tabs')[0].cloneNode(true);
            title.setAttribute('style','background:rgb(89,89,89);border-radius:8px 8px;');
            btnPreCode.style.zIndex = self.viobj.getSecondaryIndex();
            btnFullScreen.style.zIndex = self.viobj.getTopIndex();
            btnRunCode.style.zIndex = self.viobj.getSecondaryIndex();
            
            // clone file tabs, insert to the body
            document.body.appendChild(cloneTabs);
            
            var coordinate = _getCoordinate($('.vp-editor-edit-panel .nav-tabs')[0]);
            //set the attribute
            var left = $('#fullscreenCodeEditor')[0].offsetLeft + $('');
            cloneTabs.setAttribute('style','position:fixed;'
                                         + 'width:320px;'
                                         + 'height:20px;'
                                         + 'left:' + coordinate.left + 'px;'
                                         + 'top:' + coordinate.top + 'px;'
                                         + 'z-index:' + self.viobj.getSecondaryIndex());
                                         // + 'z-index:' + self.viobj.getBottomIndex());
           cloneTabs.setAttribute('id', 'clonetabs');
        }
        
        function _clearCodeEditorIntro() {
            //clear the style 
            $('#vp-editor-title')[0].removeAttribute('style');
            $('#vp-editor-toggle-code-preview')[0].removeAttribute('style');
            $('#vp-editor-btn-fullscreen')[0].removeAttribute('style');
            $('#vp-editor-btn-apply')[0].removeAttribute('style');
            
            var node = $('#clonetabs')[0];
            if(!!node) {
                node.parentNode.removeChild(node);                
            }
        }
        
        function _fakeBtngroup() {
            
            var originList = [];
            originList.push($('#vp-tb-btn-pack')[0]);
            originList.push($('#vp-tb-btn-sep1')[0]);
            originList.push($('#vp-tb-btn-deploy')[0]);
            originList.push($('#vp-tb-btn-sep2')[0]);
            originList.push($('#vp-tb-btn-save')[0]);
            originList.push($('#vp-tb-btn-load-wrapper')[0]);
            
            _fakeDiv(originList, 'fakeBtngroup');       
        }
        
        function _fakeCodePreview() {
            
            var originList = [];
            originList.push($('#vp-editor-btn-apply')[0]);
            originList.push($('#vp-editor-toggle-code-preview')[0]);
            
            _fakeDiv(originList, 'fakeCodePreview');
        }
        
        function _fakeDiv(originList, fakeid) {

            var fakeList = [];
            for( var i = 0; i < originList.length; i ++) {
                fakeList.push(originList[i].cloneNode(true));
            }
            
            var fakeDiv = document.createElement('div');
                                        
            document.body.appendChild(fakeDiv);
           
            for( var i = 0; i < fakeList.length; i ++) {
                fakeDiv.appendChild(fakeList[i]);
                var coordinate = _getCoordinate(originList[i]);
                fakeList[i].setAttribute('style', 'width:'+originList[i].offsetWidth+'px;'
                                                + 'height:'+originList[i].offsetHeight+'px;'
                                                + 'position:fixed;'
                                                + 'left:'+coordinate.left+'px;'
                                                + 'top:'+coordinate.top+'px;');
           }
           
            fakeDiv.setAttribute('id', fakeid);
            fakeDiv.setAttribute('style', 'height:'+(fakeList[0].offsetHeight + 10)+'px;'
                                        + 'width:'+(fakeList[fakeList.length-1].offsetLeft-fakeList[0].offsetLeft+parseInt(fakeList[fakeList.length-1].style.width) + 20)+'px;'
                                        + 'left:' +(fakeList[0].offsetLeft - 10)+'px;'
                                        + 'top:' +(fakeList[0].offsetTop - 5)+'px;'
                                        + 'border-radius:5px;'
                                        + 'z-index:' + self.viobj.getBottomIndex() + ';'
                                        + 'background:transparent;'
                                        + 'position:fixed;');
                                        
            if (fakeid === 'fakeBtngroup') {
                fakeDiv.style.background = '#4D4D4D';
            }
            
            return fakeDiv;
        }
       
        
        function _getCoordinate(element) {
            var actualLeft = element.offsetLeft;
            var actualTop = element.offsetTop;
            var current = element.offsetParent;
            
            while (current !== null) {
                actualLeft += current.offsetLeft;
                actualTop += current.offsetTop;
                current = current.offsetParent;
            }
            
            return {
                left : actualLeft,
                top : actualTop
            };
            
        }
        
        function _setFakeDiv() {
            if (!$('#fakeBtngroup')[0]) {
                _fakeBtngroup('fakeBtngroup');
            }
            
            if(!$('#fakeCodePreview')[0]) {
                _fakeCodePreview('fakeCodePreview');
            }
            
            // adjust the codepreview
            var btnFakeCodePreview = $('#fakeCodePreview>#vp-editor-toggle-code-preview')[0];
            if(btnFakeCodePreview.className.indexOf('code') === -1) {
                btnFakeCodePreview.className += ' code';
            }
        }
        
        function _hideFakeDiv() {
            var fakeBtngroup = $('#fakeBtngroup')[0],
                fakeCodePreview = $('#fakeCodePreview')[0];

            fakeBtngroup.style.zIndex = self.viobj.CONST_BOTTOMINDEX;
            fakeCodePreview.style.zIndex = self.viobj.CONST_BOTTOMINDEX;
            
            var btnFakeCodePreview = $('#fakeCodePreview>#vp-editor-toggle-code-preview')[0];
                if(btnFakeCodePreview.className.indexOf('preview') !== -1) {
                    // clear the preview 
                    var className = btnFakeCodePreview.className.substring(0, btnFakeCodePreview.className.length-8);
                    btnFakeCodePreview.className = className;
                }
        }
        
        function _copyLocation(sourceList, targetList) {
            if (sourceList.length !== targetList.length) return;
            
            for ( var i = 0; i < targetList.length; i ++) {
                var coordinate = _getCoordinate(targetList[i]);
                sourceList[i].style.left = coordinate.left + 'px';
                sourceList[i].style.top = coordinate.top + 'px';
            }
                
        }
        
        function _refreshCodeEditorIntro() {
            _clearCodeEditorIntro();
            _prepareCodeEditorIntro();
        }
        
        function _refreshFakeDiv(fakeElement, fakeList, originList) {
            _copyLocation(fakeList, originList);
            
            fakeElement.style.left = ( fakeList[0].offsetLeft - 10 ) + 'px';
            fakeElement.style.top = ( fakeList[0].offsetTop - 5) + 'px';
        }
        
        function _onResize() {
            
            var BP_originList = [];
            BP_originList.push($('#vp-tb-btn-pack')[0]);
            BP_originList.push($('#vp-tb-btn-sep1')[0]);
            BP_originList.push($('#vp-tb-btn-deploy')[0]);
            BP_originList.push($('#vp-tb-btn-sep2')[0]);
            BP_originList.push($('#vp-tb-btn-save')[0]);
            BP_originList.push($('#vp-tb-btn-load-wrapper')[0]);
            var fakeBtngroup = $('#fakeBtngroup')[0];
            _refreshFakeDiv(fakeBtngroup, fakeBtngroup.childNodes, BP_originList);
            
            var CP_originList = [];
            CP_originList.push($('#vp-editor-btn-apply')[0]);
            CP_originList.push($('#vp-editor-toggle-code-preview')[0]);
            var fakeCodePreview = $('#fakeCodePreview')[0];
            _refreshFakeDiv(fakeCodePreview, fakeCodePreview.childNodes, CP_originList);
            
            if (self.viobj.getCurrentStep() === 7) {
                _refreshCodeEditorIntro();
            }
        }
        
        function _addResizeListener() {
            if (window.addEventListener) {
                    window.addEventListener("resize", _onResize, true);
                } else if (document.attachEvent) {//IE
                    document.attachEvent("onresize", _onResize);
                }
        }

		this.viobj = new VizPackerIntro('body', 5);
		var self = this;
		
		//fake div
		_setFakeDiv();
		//add resize listener
		_addResizeListener();
		
		//section 1
		this.viobj.addStep(1, '#vp-main-design-tb', {
		    tipPosition: 'bottom',
		    numPosition: 'top-right',
		    title: 'Layout design',
		    intro: 'There are two pre-defined modules available for now: title and legend. More modules will come in the next release.'
		});
		
		this.viobj.addStep(2, '#vp-main-design-chart', {
		    tipPosition: 'right',
		    numPosition: 'top-right',
		    title: 'Layout design',
		    intro: '<p>Pick CVOM build-in modules that fit your need and construct the chart layout by drag & drop.</p>' + '<p>Click on “X” on its corner to get rid of the module from the canvas.</p>'
		});
		
		this.viobj.addStep(3, '#properties', {
		    tipPosition: 'bottom',
		    numPosition: 'top-right',
		    title: 'Layout design',
		    intro: 'Click each module on the canvas to configure the properties of the modules you’ve picked, and see its related part of code in the code editor also.'
		});
		

		//section 2
		this.viobj.addStep(4, '#vp-dt-file-upload-area', {
		    tipPosition: 'bottom',
		    numPosition: 'top-right',
		    title: 'Build up Data Model',
		    intro: 'Upload your data set from local onto VizPacker, only .csv format is supported so far.'
		});
		this.viobj.addStep(5, '#vp-dt-container', {
		    tipPosition: 'bottom',
		    numPosition: 'top-right',
		    title: 'Build up Data Model',
		    intro: 'You are able to preview and re-fine the sample data in the data table and set up the data type as dimension or measure. The data set would be reflected onto the example page of extension.'
		});

		//section 3
		this.viobj.addStep(6, '#main-nav-tabs', {
		    tipPosition: 'bottom',
		    numPosition: 'top-right',
		    title: 'Re-arrange the Layout',
		    intro: 'After data model build-up, feel free to dock the tabs to the left and expand the code editor for next step of code editing.'
		});

		//section 4
		this.viobj.addStep(7, '#vp-editor-title', {
		    tipPosition: 'bottom',
		    numPosition: 'top-left',
		    title: 'Code Editor',
		    intro: 'Check and modify the code furthermore for the modules you’ve picked in the code editor.'
		});
		// select '.vp-tb-title' replace the .code-finder	at this moment
		this.viobj.addStep(8, '#vp-tb-title', {
		    tipPosition: 'top',
		    numPosition: 'top-left',
		    title: 'Code Editor',
		    intro: '"Ctrl+ F" to trigger  the "Find & replace" panel.'
		});
		this.viobj.addStep(9,'#fakeCodePreview', {
		    tipPosition: 'bottom',
		    numPosition: 'bottom-left',
		    title: 'Code Editor',
		    intro: '<p>By clicking ‘RUN CODE’ button, the changes in the code editing panel will be applied to extension preview panel.</p>'
		         + '<p>By turning on/off "code" and "preview" mode, you are able to see either/both code editing panel and chart preview panel at your convenience.</p>'
		});
		
		//section 5
		this.viobj.addStep(10,'#fakeBtngroup', {
		    tipPosition: 'bottom',
		    numPosition: 'bottom-left',
		    title: 'Buttons you cannot miss',
		    intro: '<p><image src="./libs/vizPacker/resources/btnPack.png"></image></p>' 
                 + '<p>Click “PACK” to generate the extension code package in zip format.</p>'
                 // + '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-ZIP format:&nbsp;&nbsp;includes generated extension library file, examples, extension manifest and related folder structure.</p>'
                 // + '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-JS format:&nbsp;&nbsp;only includes generated extension library file.</p>'
                 + '<p><image src="./libs/vizPacker/resources/btnDeploy.png"></image>&nbsp;&nbsp;Click on the icon of Lumira to view the guidance of "Deploy to Lumira".</p>'
                 + '<p><image src="./libs/vizPacker/resources/save.png"></image>&nbsp;&nbsp;Click ‘Save’ to store your work including settings and coding.</p>'
                 + '<p><image src="./libs/vizPacker/resources/open.png"></image>&nbsp;&nbsp;By clicking on "Open" you are able to Open the saved project file and continue the work from last time that\'s been saved.</p>'
		});
		
	    //intro is completed
	    this.viobj.oncomplete(function() {
	        $('#endTutorialTrigger')[0].click();
	        _hideFakeDiv();
	    });
	    
	    //intro exit
	    this.viobj.onexit(function() {
	        _hideFakeDiv();
	    });
		
		// step callback , will be invoked when enter the specialized step
		this.viobj.addStepEnterCallback(1, function() {
		    self.viobj.setSectionNum(1);
			$('.vp-main-tab, layout-tab')[0].click();
			
			var mainDesignTab = $('#vp-main-design-tb')[0];
			if (mainDesignTab === undefined || mainDesignTab.style.display === 'none') {
			    return false;
			} else {
			    return true;
			}
		});
		this.viobj.addStepEnterCallback(3, function() {
			self.viobj.setSectionNum(1);
			$('.vp-main-tab, layout-tab')[0].click();
			var target = $('#_M_4')[0];
			if (target) {
			    target.click();
			    return true;
			} 
			return false;
		});
		this.viobj.addStepEnterCallback(4, function() {
			self.viobj.setSectionNum(2);
			$('.vp-main-tab, layout-tab')[1].click();
		});
		this.viobj.addStepEnterCallback(5, function() {
			self.viobj.setSectionNum(2);
			$('#vp-main-btn-dock')[0].style.zIndex = '';
		});

		this.viobj.addStepEnterCallback(6, function() {
			self.viobj.setSectionNum(3);
			$('#vp-main-btn-dock')[0].style.zIndex = self.viobj.getTopIndex();
			
			_clearCodeEditorIntro();
		});

		this.viobj.addStepEnterCallback(7, function() {
			self.viobj.setSectionNum(4);
			_prepareCodeEditorIntro();
			
			$('#vp-main-btn-dock')[0].style.zIndex = '';
			popupEditor.showFinder(true);
			self.viobj.resetStep(8, '.active .code-finder',{
			    tipPosition: 'top',
			    numPosition: 'top-left',
			    title: 'Code Editor',
			    intro: '"Ctrl+ F" to trigger  the "Find & replace" panel.'
			});
		});

		this.viobj.addStepEnterCallback(8, function() {
		    _clearCodeEditorIntro();
		    // turn off the full-screen
		    var btnFullScreen = $('#vp-editor-btn-fullscreen')[0];
		    if(btnFullScreen.className.indexOf('docked') !== -1) {
		        btnFullScreen.click();
		    }
		     
		    // turn off the preview-screen
		    var btnPreCode = $('#vp-editor-toggle-code-preview')[0];
            if (btnPreCode.className.indexOf('preview') !== -1) {
                btnPreCode.click();
                // unlight the btnFakecodepreview
                var btnFakeCodePreview = $('#fakeCodePreview>#vp-editor-toggle-code-preview')[0];
                if(btnFakeCodePreview.className.indexOf('preview') !== -1) {
                    // clear the preview 
                    var className = btnFakeCodePreview.className.substring(0, btnFakeCodePreview.className.length-8);
                    btnFakeCodePreview.className = className;
                }
            } 
		});
		
		this.viobj.addStepEnterCallback(9, function() {
            self.viobj.setSectionNum(4);
            
            // turn on the full-screen
            var btnFullScreen = $('#vp-editor-btn-fullscreen')[0];
            if (btnFullScreen.className.indexOf('docked') === -1) {
                btnFullScreen.click();
            }
            
            // turn on the preview-screen
            var btnPreCode = $('#vp-editor-toggle-code-preview')[0];
            if (btnPreCode.className.indexOf('preview') === -1) {
                btnPreCode.click();
                // light the btnFakecodepreview
                var btnFakeCodePreview = $('#fakeCodePreview>#vp-editor-toggle-code-preview')[0];
                if(btnFakeCodePreview.className.indexOf('preview') === -1) {
                    btnFakeCodePreview.className += ' preview';
                }
            }
            
            var fakeCodePreview = $('#fakeCodePreview')[0];
            fakeCodePreview.style.zIndex = '';
		});
		
		this.viobj.addStepEnterCallback(10, function() {
		   self.viobj.setSectionNum(5); 
		});
	};
	
	vizPackerIntro.prototype.startIntro = function() {
        // reset the vizPacker
        // turn off preview 
        popupEditor.showCodePanel(true);
        popupEditor.showPreviewPanel(false);

        var btnFullScreen = $('#vp-editor-btn-fullscreen')[0];
        //turn off fullscreen
        if (btnFullScreen.className.indexOf('docked') !== -1) {
            btnFullScreen.click();
        }
        
        var codeFinder = $('.code-finder')[0];
        //turn off code finder
        if(codeFinder && codeFinder.style.display === 'block') {
            popupEditor.showFinder(false);
        }

        // adjust the codepreview
        var btnFakeCodePreview = $('#fakeCodePreview>#vp-editor-toggle-code-preview')[0];
        if(btnFakeCodePreview.className.indexOf('code') === -1) {
            btnFakeCodePreview.className += ' code';
        }
        
		this.viobj.start();
	};

	return new vizPackerIntro();
});
