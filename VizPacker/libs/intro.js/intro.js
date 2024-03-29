/**
 * Intro.js v0.5.0
 * https://github.com/usablica/intro.js
 * MIT licensed
 *
 * Copyright (C) 2013 usabli.ca - A weekend project by Afshin Mehrabani (@afshinmeh)
 */

( function(root, factory) {
        if ( typeof exports === 'object') {
            // CommonJS
            factory(exports);
        } else if ( typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define(['exports'], factory);
        } else {
            // Browser globals
            factory(root);
        }
    }(this, function(exports) {
        //Default config/variables
        var VERSION = '0.5.0';
        
        /**
         * IntroJs main class
         *
         * @class IntroJs
         */
        function IntroJs(obj) {
            this._targetElement = obj;

            this._options = {
                /* Next button label in tooltip box */
                nextLabel : 'Next &rarr;',
                /* Previous button label in tooltip box */
                prevLabel : '&larr; Back',
                /* Skip button label in tooltip box */
                skipLabel : 'Skip',
                /* Done button label in tooltip box */
                doneLabel : 'Done',
                /* Default tooltip box position */
                tooltipPosition : 'bottom',
                /* Next CSS class for tooltip boxes */
                tooltipClass : '',
                /* Close introduction when pressing Escape button? */
                exitOnEsc : true,
                /* Close introduction when clicking on overlay layer? */
                exitOnOverlayClick : true,
                /* Show step numbers in introduction? */
                showStepNumbers : true,
                /* store the total sections*/
                totalSections : 1
            };

            // store some callbacks , when enter/leave the specialized step invoke the callback
            this._stepCallbacks = {
                enter : [],
                leave : []
            };
            this._lastStep = 0;

        }

        /**
         * Initiate a new introduction/guide from an element in the page
         *
         * @api private
         * @method _introForElement
         * @param {Object} targetElm
         * @returns {Boolean} Success or not?
         */
        function _introForElement(targetElm) {
            var introItems = [], self = this;

            if (this._options.steps) {
                //use steps passed programmatically
                var allIntroSteps = [];

                for (var i = 0, stepsLength = this._options.steps.length; i < stepsLength; i++) {
                    var currentItem = this._options.steps[i];
                    //set the step
                    currentItem.step = i + 1;
                    //use querySelector function only when developer used CSS selector
                    if ( typeof (currentItem.element) === 'string') {
                        //grab the element with given selector from the page
                        currentItem.element = document.querySelector(currentItem.element);
                    }
                    introItems.push(currentItem);
                }

            } else {
                //use steps from data-* annotations

                var allIntroSteps = targetElm.querySelectorAll('*[data-intro]');
                //if there's no element to intro
                if (allIntroSteps.length < 1) {
                    return false;
                }

                for (var i = 0, elmsLength = allIntroSteps.length; i < elmsLength; i++) {
                    var currentElement = allIntroSteps[i];
                    introItems.push({
                        element : currentElement,
                        intro : currentElement.getAttribute('data-intro'),
                        step : parseInt(currentElement.getAttribute('data-step'), 10),
                        tooltipClass : currentElement.getAttribute('data-tooltipClass'),
                        position : currentElement.getAttribute('data-position') || this._options.tooltipPosition
                    });
                }
            }

            //Ok, sort all items with given steps
            introItems.sort(function(a, b) {
                return a.step - b.step;
            });

            //set it to the introJs object
            self._introItems = introItems;

            //add overlay layer to the page
            if (_addOverlayLayer.call(self, targetElm)) {
                //then, start the show
                _nextStep.call(self);

                var skipButton = targetElm.querySelector('.introjs-skipbutton'), nextStepButton = targetElm.querySelector('.introjs-nextbutton');

                self._onKeyDown = function(e) {
                    if (e.keyCode === 27 && self._options.exitOnEsc == true) {
                        //escape key pressed, exit the intro
                        _exitIntro.call(self, targetElm);
                        //check if any callback is defined
                        if (self._introExitCallback != undefined) {
                            self._introExitCallback.call(self);
                        }
                    } else if (e.keyCode === 37) {
                        //left arrow
                        _previousStep.call(self);
                    } else if (e.keyCode === 39 || e.keyCode === 13) {
                        //right arrow or enter
                        _nextStep.call(self);
                        //prevent default behaviour on hitting Enter, to prevent steps being skipped in some browsers
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }
                    }
                };

                self._onResize = function(e) {
                    //register brower resize event
                    _refresh.call(self);
                };

                if (window.addEventListener) {
                    window.addEventListener('keydown', self._onKeyDown, true);
                    //for window resize
                    window.addEventListener("resize", self._onResize, true);
                } else if (document.attachEvent) {//IE
                    document.attachEvent('onkeydown', self._onKeyDown);
                    //for window resize
                    document.attachEvent("onresize", self._onResize);
                }
            }
            return false;
        }

        /**
         * Go to specific step of introduction
         *
         * @api private
         * @method _goToStep
         */
        function _goToStep(step) {
            //because steps starts with zero
            this._currentStep = step - 2;
            if ( typeof (this._introItems) !== 'undefined') {
                _nextStep.call(this);
            }
        }

        /**
         * Go to next step on intro
         *
         * @api private
         * @method _nextStep
         */
        function _nextStep() {
            if ( typeof (this._currentStep) === 'undefined') {
                this._currentStep = 0;
            } else {++this._currentStep;
            }

            if ((this._introItems.length) <= this._currentStep) {
                //end of the intro
                //check if any callback is defined
                if ( typeof (this._introCompleteCallback) === 'function') {
                    this._introCompleteCallback.call(this);
                }
                _exitIntro.call(this, this._targetElement);
                return;
            }

            var nextStep = this._introItems[this._currentStep];
            if ( typeof (this._introBeforeChangeCallback) !== 'undefined') {
                this._introBeforeChangeCallback.call(this, nextStep.element);
            }

            window.targetElement = nextStep;
            _showElement.call(this, nextStep);
        }

        /**
         * Go to previous step on intro
         *
         * @api private
         * @method _nextStep
         */
        function _previousStep() {
            if (this._currentStep === 0) {
                return false;
            }
            this._lastStep = this._currentStep;
            var nextStep = this._introItems[--this._currentStep];
            if ( typeof (this._introBeforeChangeCallback) !== 'undefined') {
                this._introBeforeChangeCallback.call(this, nextStep.element);
            }
           
            window.targetElement = nextStep;
            _showElement.call(this, nextStep);
        }

        /**
         * Exit from intro
         *
         * @api private
         * @method _exitIntro
         * @param {Object} targetElement
         */
        function _exitIntro(targetElement) {
            //remove overlay layer from the page
            var overlayLayer = targetElement.querySelector('.introjs-overlay');
            //for fade-out animation
            overlayLayer.style.opacity = 0;
            setTimeout(function() {
                if (overlayLayer.parentNode) {
                    overlayLayer.parentNode.removeChild(overlayLayer);
                }
            }, 500);
            //remove all helper layers
            var helperLayer = targetElement.querySelector('.introjs-helperLayer');
            if (helperLayer) {
                helperLayer.parentNode.removeChild(helperLayer);
            }

            //remove tooltipLayer
            var tooltipLayer = targetElement.querySelector('.introjs-tooltip');
            if (tooltipLayer) {
                tooltipLayer.parentNode.removeChild(tooltipLayer);
            }

            //remove helperNumberLayer
            var helperNumberLayer = targetElement.querySelector('.introjs-helperNumberLayer');
            if (helperNumberLayer) {
                helperNumberLayer.parentNode.removeChild(helperNumberLayer);
            }

            //remove `introjs-showElement` class from the element
            var showElement = document.querySelector('.introjs-showElement');
            if (showElement) {
                showElement.className = showElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');
                // This is a manual trim.
            }
            
            //remove showElementMask
            var showElementMask = document.querySelector('.introjs-showElementMask');
            if (showElementMask) {
                showElementMask.parentNode.removeChild(showElementMask);
            }

            //remove `introjs-fixParent` class from the elements
            var fixParents = document.querySelectorAll('.introjs-fixParent');
            if (fixParents && fixParents.length > 0) {
                for (var i = fixParents.length - 1; i >= 0; i--) {
                    fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
                };
            }
            //clean listeners
            if (window.removeEventListener) {
                window.removeEventListener('keydown', this._onKeyDown, true);
            } else if (document.detachEvent) {//IE
                document.detachEvent('onkeydown', this._onKeyDown);
            }
            //set the step to zero
            this._currentStep = undefined;
        }

        /**
         * Render tooltip box in the page
         *
         * @api private
         * @method _placeTooltip
         * @param {Object} targetElement
         * @param {Object} tooltipLayer
         * @param {Object} arrowLayer
         */
        function _placeTooltip(targetElement, tooltipLayer, arrowLayer) {
            //reset the old style
            tooltipLayer.style.top = null;
            tooltipLayer.style.right = null;
            tooltipLayer.style.bottom = null;
            tooltipLayer.style.left = null;

            //prevent error when `this._currentStep` is undefined
            if (!this._introItems[this._currentStep])
                return;

            var tooltipCssClass = '';

            //if we have a custom css class for each step
            var currentStepObj = this._introItems[this._currentStep];
            if ( typeof (currentStepObj.tooltipClass) === 'string') {
                tooltipCssClass = currentStepObj.tooltipClass;
            } else {
                tooltipCssClass = this._options.tooltipClass;
            }

            tooltipLayer.className = ('introjs-tooltip ' + tooltipCssClass).replace(/^\s+|\s+$/g, '');

            //custom css class for tooltip boxes
            var tooltipCssClass = this._options.tooltipClass;

            var currentHelperLayer = document.querySelector('.introjs-helperLayer');
            var currentTooltipPosition = this._introItems[this._currentStep].position;
            switch (currentTooltipPosition) {
                case 'top':
                    // tooltipLayer.style.left = '15px';
                    // tooltipLayer.style.top = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
                    ////arrowLayer.className = 'introjs-arrow bottom';

                    tooltipLayer.style.left = currentHelperLayer.style.left;
                    tooltipLayer.style.width = currentHelperLayer.style.width;
                    tooltipLayer.style.height = 'auto';
                    tooltipLayer.style.top = _addPixel(currentHelperLayer.style.top, -tooltipLayer.offsetHeight + 40);
                    tooltipLayer.style.paddingLeft = '';
                    break;
                case 'right':
                    // tooltipLayer.style.left = (_getOffset(targetElement).width + 20) + 'px';
                    ////arrowLayer.className = 'introjs-arrow left';

                    tooltipLayer.style.left = _addPixel(currentHelperLayer.style.left, _parsePxielToInt(currentHelperLayer.style.width) - 20);
                    tooltipLayer.style.top = currentHelperLayer.style.top;
                    tooltipLayer.style.height = currentHelperLayer.style.height;
                    tooltipLayer.style.width = currentHelperLayer.offsetHeight * 0.4 + 'px';
                    tooltipLayer.style.paddingLeft = '20px';
                    break;
                case 'left':
                    // tooltipLayer.style.top = '15px';
                    // tooltipLayer.style.right = (_getOffset(targetElement).width + 20) + 'px';
                    ////arrowLayer.className = 'introjs-arrow right';

                    tooltipLayer.style.height = currentHelperLayer.style.height;
                    tooltipLayer.style.width = currentHelperLayer.offsetHeight * 0.4 + 'px';
                    // tooltipLayer.style.left = '-' + (_getOffset(tooltipLayer).width) + 'px';
                    tooltipLayer.style.left = _addPixel(currentHelperLayer.style.left, -tooltipLayer.offsetWidth + 20);
                    tooltipLayer.style.top = currentHelperLayer.style.top;
                    tooltipLayer.style.paddingLeft = '';

                    break;
                case 'bottom':
                // Bottom going to follow the default behavior
                default:
                    // tooltipLayer.style.bottom = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
                    ////arrowLayer.className = 'introjs-arrow top';

                    tooltipLayer.style.top = _addPixel(currentHelperLayer.style.top, _parsePxielToInt(currentHelperLayer.style.height) - 20);
                    tooltipLayer.style.left = currentHelperLayer.style.left;
                    tooltipLayer.style.width = currentHelperLayer.style.width;
                    tooltipLayer.style.height = 'auto';
                    tooltipLayer.style.paddingLeft = '';
                    break;
            }
            
            var tooltipbuttons = document.querySelector('.introjs-tooltipbuttons');
            var tooltiptitle = document.querySelector('.introjs-tooltiptext ,tooltiptextTitle');
            if (tooltipbuttons && tooltiptitle && currentTooltipPosition == 'top') {
                tooltipbuttons.style.paddingBottom = '20px';
                tooltiptitle.style.paddingTop = '10px';
            } else if (tooltipbuttons && tooltiptitle) {
                tooltipbuttons.style.paddingBottom = '';
                tooltiptitle.style.paddingTop = '';
            }
            
        }

        /**
         * Update the position of the helper layer on the screen
         *
         * @api private
         * @method _setHelperLayerPosition
         * @param {Object} helperLayer
         */
        function _setHelperLayerPosition(helperLayer) {
            if (helperLayer) {
                //prevent error when `this._currentStep` in undefined
                if (!this._introItems[this._currentStep])
                    return;

                var elementPosition = _getOffset(this._introItems[this._currentStep].element);

                //set new position to helper layer
                //helperLayer.setAttribute('style', 'width: ' + (elementPosition.width + 10) + 'px; ' + 'height:' + (elementPosition.height + 10) + 'px; ' + 'top:' + (elementPosition.top - 5) + 'px;' + 'left: ' + (elementPosition.left - 5) + 'px;');
                var propPosition = _getHelperPropPosition(elementPosition);
                helperLayer.setAttribute('style', 'width:' + propPosition.width + 'px;' + 'height:' + propPosition.height + 'px;' + 'left:' + propPosition.left + 'px;' + 'top:' + propPosition.top + 'px;');

                //coordinate adjustment
                if (propPosition.left < 0) {
                    helperLayer.style.left = '0px';
                    helperLayer.style.width = ( parseInt(helperLayer.style.width) + propPosition.left) + 'px'; 
                }

                if (propPosition.top < 0) {
                    helperLayer.style.top = '0px';
                    helperLayer.style.height = ( parseInt(helperLayer.style.height) + propPosition.top) + 'px';
                }

                if (propPosition.left + propPosition.width > window.innerWidth) {
                    helperLayer.style.width = ( parseInt(helperLayer.style.width) - 
                                                ( propPosition.left + propPosition.width - window.innerWidth)) + 'px';
                }

                if (propPosition.top + propPosition.height > window.innerHeight) {
                    helperLayer.style.height = ( parseInt(helperLayer.style.height) - 
                                                 ( propPosition.top + propPosition.height - window.innerHeight)) + 'px';
                }

            }
        }

        /**
         * Show an element on the page
         *
         * @api private
         * @method _showElement
         * @param {Object} targetElement
         */
        function _showElement(targetElement) {

            if ( typeof (this._introChangeCallback) !== 'undefined') {
                this._introChangeCallback.call(this, targetElement.element);
            }

            var callBackSucceed = _invokeStepCallback.call(this, this._currentStep + 1, false);
            if(callBackSucceed === false){
               // _nextStep();
               if(this._lastStep>this._currentStep){
                   if(this._lastStep > 1) {
                       _previousStep.call(this);
                   } else {
                       this._currentStep ++;
                   }
                   
               }else{
                   _nextStep.call(this);
               }
               
                return;
            };
            
            var self = this, oldHelperLayer = document.querySelector('.introjs-helperLayer'), elementPosition = _getOffset(targetElement.element);

            if (oldHelperLayer != null) {
                var oldHelperNumberLayer = document.querySelector('.introjs-helperNumberLayer'),
                // var oldHelperNumberLayer = oldHelperLayer.querySelector('.introjs-helperNumberLayer'),
                // oldtooltipLayer = oldHelperLayer.querySelector('.introjs-tooltiptext'),
                oldArrowLayer = oldHelperLayer.querySelector('.introjs-arrow'),
                // oldtooltipContainer = oldHelperLayer.querySelector('.introjs-tooltip'),
                // skipTooltipButton = oldHelperLayer.querySelector('.introjs-skipbutton'),
                // prevTooltipButton = oldHelperLayer.querySelector('.introjs-prevbutton'),
                // nextTooltipButton = oldHelperLayer.querySelector('.introjs-nextbutton');

                oldtooltipContainer = document.querySelector('.introjs-tooltip'), skipTooltipButton = document.querySelector('.introjs-skipbutton'), prevTooltipButton = document.querySelector('.introjs-prevbutton'), nextTooltipButton = document.querySelector('.introjs-nextbutton');

                var oldtooltiptitleLayer = oldtooltipContainer.querySelector('.tooltiptextTitle');
                var oldtooltipcontentLayer = oldtooltipContainer.querySelector('.tooltiptextContent');

                //hide the tooltip and helperNumber
                oldtooltipContainer.style.opacity = 0;
                oldHelperNumberLayer.style.opacity = 0;
                //set new position to helper layer
                _setHelperLayerPosition.call(self, oldHelperLayer);

                //remove `introjs-fixParent` class from the elements
                var fixParents = document.querySelectorAll('.introjs-fixParent');
                if (fixParents && fixParents.length > 0) {
                    for (var i = fixParents.length - 1; i >= 0; i--) {
                        fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
                    };
                }

                //remove old classes
                var oldShowElement = document.querySelector('.introjs-showElement');
                oldShowElement.className = oldShowElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');
                
                //we should wait until the CSS3 transition is competed (it's 0.3 sec) to prevent incorrect `height` and `width` calculation
                if (self._lastShowElementTimer) {
                    clearTimeout(self._lastShowElementTimer);
                }

                self._lastShowElementTimer = setTimeout(function() {
                    //set current step to the label
                    if (oldHelperNumberLayer != null) {
                        // oldHelperNumberLayer.innerHTML = targetElement.step;
                        oldHelperNumberLayer.innerHTML = self._options.sectionNum + '/' + self._options.totalSections;
                    }
                    //set current tooltip text
                    // oldtooltipLayer.innerHTML = targetElement.intro;
                    oldtooltiptitleLayer.innerHTML = targetElement.title;
                    oldtooltipcontentLayer.innerHTML = targetElement.intro;
                    //set the tooltip position
                    _placeTooltip.call(self, targetElement.element, oldtooltipContainer, oldArrowLayer);
                    //show the tooltip
                    oldtooltipContainer.style.opacity = 1;
                    
                    _showNumberLayer();
                    
                    _placeShowElementMask.call(self, document.querySelector('.introjs-showElementMask'));
                }, 400);

            } else {
                var helperLayer = document.createElement('div'), arrowLayer = document.createElement('div'), tooltipLayer = document.createElement('div');

                // tooltipLayer.innerHTML = '<div class="introjs-tooltiptext introjs-tooltiptextContent">' + targetElement.intro + '</div><div class="introjs-tooltipbuttons"></div>';
                tooltipLayer.innerHTML = '<div class="introjs-tooltiptext tooltiptextTitle">' + targetElement.title + '</div>' + '<div class="introjs-tooltiptext tooltiptextContent">' + targetElement.intro + '</div><div class="introjs-tooltipbuttons"></div></div>';

                this._targetElement.appendChild(tooltipLayer);
                
                _ForbidEvent(tooltipLayer, ['click', 'contextmenu']);
                
                helperLayer.className = 'introjs-helperLayer';
                helperLayer.addEventListener('webkitTransitionEnd', _transitionEndListener, false);
                //WebkitTransition
                helperLayer.addEventListener('transitionend', _transitionEndListener, false);
                //MozTransition
                helperLayer.addEventListener('oTransitionEnd otransitionend', _transitionEndListener, false);
                //OTransition
                helperLayer.addEventListener('MSTransitionEnd', _transitionEndListener, false);
                //msTransition

                //set new position to helper layer
                _setHelperLayerPosition.call(self, helperLayer);

                //add helper layer to target element
                this._targetElement.appendChild(helperLayer);
                
                // add mask to block the listener on showElement
                var showElementMask = document.createElement('div');
                showElementMask.className = 'introjs-showElementMask';
                _placeShowElementMask.call(self, showElementMask);
                _ForbidEvent(showElementMask, ['click', 'contextmenu']);
                
                this._targetElement.appendChild(showElementMask);
                
                // arrowLayer.className = 'introjs-arrow';

                //add helper layer number
                if (this._options.showStepNumbers) {
                    var helperNumberLayer = document.createElement('span');
                    helperNumberLayer.className = 'introjs-helperNumberLayer';
                    // helperNumberLayer.innerHTML = targetElement.step;
                    helperNumberLayer.innerHTML = this._options.sectionNum + '/' + this._options.totalSections;
                    // helperLayer.appendChild(helperNumberLayer);

                    var helperLayerData = {};
                    helperLayerData.left = _parsePxielToInt(helperLayer.style.left);
                    helperLayerData.top = _parsePxielToInt(helperLayer.style.top);
                    helperLayerData.width = helperLayer.offsetWidth;
                    helperLayerData.height = helperLayer.offsetHeight;
                    _placeHelperNumberLayer(helperNumberLayer, helperLayerData, window.targetElement.numPosition);

                    this._targetElement.appendChild(helperNumberLayer);

                }

                // tooltipLayer.appendChild(arrowLayer);
                // helperLayer.appendChild(tooltipLayer);

                //next button
                var nextTooltipButton = document.createElement('a');

                nextTooltipButton.onclick = function() {
                    if (self._introItems.length - 1 != self._currentStep) {
                        _nextStep.call(self);
                    }
                };

                nextTooltipButton.href = 'javascript:void(0);';
                nextTooltipButton.innerHTML = this._options.nextLabel;

                //previous button
                var prevTooltipButton = document.createElement('a');

                prevTooltipButton.onclick = function() {
                    if (self._currentStep != 0) {
                        _previousStep.call(self);
                    }
                };

                prevTooltipButton.href = 'javascript:void(0);';
                prevTooltipButton.innerHTML = this._options.prevLabel;

                //skip button
                var skipTooltipButton = document.createElement('a');
                skipTooltipButton.className = 'introjs-button introjs-skipbutton';
                skipTooltipButton.href = 'javascript:void(0);';
                skipTooltipButton.innerHTML = this._options.skipLabel;

                skipTooltipButton.onclick = function() {
                    if (self._introItems.length - 1 == self._currentStep && typeof (self._introCompleteCallback) === 'function') {
                        self._introCompleteCallback.call(self);
                    }

                    if (self._introItems.length - 1 != self._currentStep && typeof (self._introExitCallback) === 'function') {
                        self._introExitCallback.call(self);
                    }

                    _exitIntro.call(self, self._targetElement);
                };

                var tooltipButtonsLayer = tooltipLayer.querySelector('.introjs-tooltipbuttons');
                
                tooltipButtonsLayer.appendChild(skipTooltipButton);
                //in order to prevent displaying next/previous button always
                if (this._introItems.length > 1) {
                    tooltipButtonsLayer.appendChild(prevTooltipButton);
                    tooltipButtonsLayer.appendChild(nextTooltipButton);
                }

                //set proper position
                _placeTooltip.call(self, targetElement.element, tooltipLayer, arrowLayer);
            }

            if (this._currentStep == 0) {
                prevTooltipButton.className = 'introjs-button introjs-prevbutton introjs-disabled';
                nextTooltipButton.className = 'introjs-button introjs-nextbutton';
                skipTooltipButton.innerHTML = this._options.skipLabel;
            } else if (this._introItems.length - 1 == this._currentStep) {
                skipTooltipButton.innerHTML = this._options.doneLabel;
                prevTooltipButton.className = 'introjs-button introjs-prevbutton';
                nextTooltipButton.className = 'introjs-button introjs-nextbutton introjs-disabled';
            } else {
                prevTooltipButton.className = 'introjs-button introjs-prevbutton';
                nextTooltipButton.className = 'introjs-button introjs-nextbutton';
                skipTooltipButton.innerHTML = this._options.skipLabel;
            }

            //Set focus on "next" button, so that hitting Enter always moves you onto the next step
            nextTooltipButton.focus();

            //add target element position style
            targetElement.element.className += ' introjs-showElement';

            var currentElementPosition = _getPropValue(targetElement.element, 'position');
            if (currentElementPosition !== 'absolute' && currentElementPosition !== 'relative') {
                //change to new intro item
                targetElement.element.className += ' introjs-relativePosition';
            }

            var parentElm = targetElement.element.parentNode;
            while (parentElm != null) {
                if (parentElm.tagName.toLowerCase() === 'body')
                    break;

                var zIndex = _getPropValue(parentElm, 'z-index');
                if (/[0-9]+/.test(zIndex)) {
                    parentElm.className += ' introjs-fixParent';
                }
                parentElm = parentElm.parentNode;
            }

            if (!_elementInViewport(targetElement.element)) {
                var rect = targetElement.element.getBoundingClientRect(), top = rect.bottom - (rect.bottom - rect.top), bottom = rect.bottom - _getWinSize().height;

                // Scroll up
                if (top < 0) {
                    window.scrollBy(0, top - 30);
                    // 30px padding from edge to look nice

                    // Scroll down
                } else {
                    window.scrollBy(0, bottom + 100);
                    // 70px + 30px padding from edge to look nice
                }
            }

            // finish step , so invoke the stepovercallback
            _invokeStepCallback.call(this, this._currentStep + 1, true);
        }

        /**
         * Get an element CSS property on the page
         * Thanks to JavaScript Kit: http://www.javascriptkit.com/dhtmltutors/dhtmlcascade4.shtml
         *
         * @api private
         * @method _getPropValue
         * @param {Object} element
         * @param {String} propName
         * @returns Element's property value
         */
        function _getPropValue(element, propName) {
            var propValue = '';
            if (element.currentStyle) {//IE
                propValue = element.currentStyle[propName];
            } else if (document.defaultView && document.defaultView.getComputedStyle) {//Others
                propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
            }

            //Prevent exception in IE
            if (propValue && propValue.toLowerCase) {
                return propValue.toLowerCase();
            } else {
                return propValue;
            }
        }

        /**
         * Provides a cross-browser way to get the screen dimensions
         * via: http://stackoverflow.com/questions/5864467/internet-explorer-innerheight
         *
         * @api private
         * @method _getWinSize
         * @returns {Object} width and height attributes
         */
        function _getWinSize() {
            if (window.innerWidth != undefined) {
                return {
                    width : window.innerWidth,
                    height : window.innerHeight
                };
            } else {
                var D = document.documentElement;
                return {
                    width : D.clientWidth,
                    height : D.clientHeight
                };
            }
        }

        /**
         * Add overlay layer to the page
         * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
         *
         * @api private
         * @method _elementInViewport
         * @param {Object} el
         */
        function _elementInViewport(el) {
            var rect = el.getBoundingClientRect();

            return (rect.top >= 0 && rect.left >= 0 && (rect.bottom + 80) <= window.innerHeight && // add 80 to get the text right
            rect.right <= window.innerWidth
            );
        }

        /**
         * Add overlay layer to the page
         *
         * @api private
         * @method _addOverlayLayer
         * @param {Object} targetElm
         */
        function _addOverlayLayer(targetElm) {
            var overlayLayer = document.createElement('div'), styleText = '', self = this;

            //set css class name
            overlayLayer.className = 'introjs-overlay';

            //check if the target element is body, we should calculate the size of overlay layer in a better way
            if (targetElm.tagName.toLowerCase() === 'body') {
                styleText += 'top: 0;bottom: 0; left: 0;right: 0;position: fixed;';
                overlayLayer.setAttribute('style', styleText);
            } else {
                //set overlay layer position
                var elementPosition = _getOffset(targetElm);
                if (elementPosition) {
                    styleText += 'width: ' + elementPosition.width + 'px; height:' + elementPosition.height + 'px; top:' + elementPosition.top + 'px;left: ' + elementPosition.left + 'px;';
                    overlayLayer.setAttribute('style', styleText);
                }
            }

            targetElm.appendChild(overlayLayer);

            overlayLayer.onclick = function() {
                if (self._options.exitOnOverlayClick == true) {
                    _exitIntro.call(self, targetElm);
                }
                //check if any callback is defined
                if (self._introExitCallback != undefined) {
                    self._introExitCallback.call(self);
                }
            };

            setTimeout(function() {
                styleText += 'opacity: .8;';
                overlayLayer.setAttribute('style', styleText);
            }, 10);
            return true;
        }

        /**
         * Get an element position on the page
         * Thanks to `meouw`: http://stackoverflow.com/a/442474/375966
         *
         * @api private
         * @method _getOffset
         * @param {Object} element
         * @returns Element's position info
         */
        function _getOffset(element) {
            var elementPosition = {};

            //set width
            elementPosition.width = element.offsetWidth;

            //set height
            elementPosition.height = element.offsetHeight;

            //calculate element top and left
            var _x = 0;
            var _y = 0;
            while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
                _x += element.offsetLeft;
                _y += element.offsetTop;
                element = element.offsetParent;
            }
            //set top
            elementPosition.top = _y;
            //set left
            elementPosition.left = _x;

            return elementPosition;
        }

        /**
         * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
         * via: http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
         *
         * @param obj1
         * @param obj2
         * @returns obj3 a new object based on obj1 and obj2
         */
        function _mergeOptions(obj1, obj2) {
            var obj3 = {};
            for (var attrname in obj1) {
                obj3[attrname] = obj1[attrname];
            }
            for (var attrname in obj2) {
                obj3[attrname] = obj2[attrname];
            }
            return obj3;
        }

        /**
         *  the following are some customizine codes
         */

        function _invokeStepCallback(currentStep, over) {

            var callbacks = over ? this._stepCallbacks.leave : this._stepCallbacks.enter;

            if (callbacks === null || callbacks === undefined) {
                return;
            }

            for (var i = 0; i < callbacks.length; i++) {
                if ((currentStep === callbacks[i].step) && ( typeof (callbacks[i].callback) === 'function')) {
                    // wait the drawing tooltip is done
                    if (over) {
                        setTimeout(function() {
                            return callbacks[i].callback.call(this);
                        }, 500);
                       // return;
                    }
                    return callbacks[i].callback.call(this);
                   // break;
                }
            }
        }
        
        function _ForbidEvent(element, typeList) {
            for (var i = 0; i < typeList.length; i ++) {
                element.addEventListener(typeList[i], function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            }
        }

        function _placeHelperNumberLayer(numberLayer, helperLayerData, numPosition) {
            
            var left,top;
            
            switch(numPosition) {
                case 'top-right':
                    left = helperLayerData.left + helperLayerData.width;
                    top = helperLayerData.top;
                    break;
                case 'top-left':
                    left = helperLayerData.left;
                    top = helperLayerData.top;
                    break;
                case 'bottom-right':
                    left = helperLayerData.left + helperLayerData.width;
                    top = helperLayerData.top + helperLayerData.height;
                    break;
                case 'bottom-left':
                    left = helperLayerData.left;
                    top = helperLayerData.top + helperLayerData.height;
                    break;
            }
            
            left = left - 15;
            top = top - 8;
            
            // part is out of the viewport, so ajust the coordinate
            if (left > window.innerWidth - 25)
                left = window.innerWidth - 25;
            if (top < 10)
                top = 10;

            numberLayer.style.left = left + 'px';
            numberLayer.style.top = top + 'px';
        }

        function _parsePxielToInt(pixel) {
            return parseInt(pixel.substring(0, pixel.length - 2));
        }

        function _addPixel(pixel, increment) {
            return (parseInt(pixel.substring(0, pixel.length - 2)) + increment) + 'px';
        }
        
        function _refresh() {
            //redraw helperlayer
            _setHelperLayerPosition.call(this, document.querySelector('.introjs-helperLayer'));
            //redraw tooltip
            _placeTooltip.call(this, window.targetElement.element, document.querySelector('.introjs-tooltip'), null);

            var helperLayer = document.querySelector('.introjs-helperLayer');
            var helperLayerData = {};
            helperLayerData.left = _parsePxielToInt(helperLayer.style.left);
            helperLayerData.top = _parsePxielToInt(helperLayer.style.top);
            helperLayerData.width = parseInt(helperLayer.offsetWidth);
            helperLayerData.height = parseInt(helperLayer.offsetHeight);
            //redraw helperNumberLayer
            _placeHelperNumberLayer.call(this, document.querySelector('.introjs-helperNumberLayer'), helperLayerData, window.targetElement.numPosition);
            
            //redraw showElementMask
            _placeShowElementMask.call(this, document.querySelector('.introjs-showElementMask'));
        }

                
        function _getHelperPropPosition(elementPosition) {

            var minWidth = 350;
            var minHeight = 350;

            var propPosition = {};
            if (elementPosition.height >= elementPosition.width) {
                /**
                 * if true, present the condition of almost square.
                 * if false, present the condition of vertical bar.
                 */
                if (parseInt(elementPosition.height / elementPosition.width) == 1) {
                    propPosition.width = elementPosition.width + 50;
                    propPosition.height = elementPosition.height + 50;
                    propPosition.left = elementPosition.left - 25;
                    propPosition.top = elementPosition.top - 25;
                } else {
                    
                    propPosition.width = elementPosition.width+ 50;
                    propPosition.left = elementPosition.left - 25;
                    if (elementPosition.height < minHeight) {
                        propPosition.height = minHeight + 50;
                        propPosition.top = elementPosition.top - (minHeight - elementPosition.height + 50) / 2;
                    } else {
                        propPosition.height = elementPosition.height + 50;
                        propPosition.top = elementPosition.top - 25;
                    }
                }

            } else {
                /**
                 * if true, present the condition of almost square.
                 * if false, present the condition of horizontal bar.
                 */
                if (parseInt(elementPosition.width / elementPosition.height) == 1) {
                    propPosition.width = elementPosition.width + 50;
                    propPosition.height = elementPosition.height + 50;
                    propPosition.left = elementPosition.left - 25;
                    propPosition.top = elementPosition.top - 25;
                } else {
                    
                    propPosition.height = elementPosition.height+ 50;
                    propPosition.top = elementPosition.top - 25;
                    if (elementPosition.width < minWidth) {
                        propPosition.width = minWidth + 50;
                        propPosition.left = elementPosition.left - (minWidth - elementPosition.width + 50) / 2;
                    } else {
                        propPosition.width = elementPosition.width + 50;
                        propPosition.left = elementPosition.left - 25;
                    }
                }

            }
           
            return propPosition;
        }
        
        function _showNumberLayer() {
            var oldHelperLayer = document.querySelector('.introjs-helperLayer');
            var oldHelperNumberLayer = document.querySelector('.introjs-helperNumberLayer');

            var helperLayerData = {};
            helperLayerData.left = _parsePxielToInt(oldHelperLayer.style.left);
            helperLayerData.top = _parsePxielToInt(oldHelperLayer.style.top);
            helperLayerData.width = parseInt(oldHelperLayer.offsetWidth);
            helperLayerData.height = parseInt(oldHelperLayer.offsetHeight);

            _placeHelperNumberLayer(oldHelperNumberLayer, helperLayerData, window.targetElement.numPosition);
            oldHelperNumberLayer.style.opacity = 1;
        }
        
        function _placeShowElementMask(showElementMask) {

            var helperLayer = document.querySelector('.introjs-helperLayer');
            if (helperLayer && showElementMask) {
                showElementMask.style.width = helperLayer.style.width;
                showElementMask.style.height = helperLayer.style.height; 
                showElementMask.style.left = helperLayer.style.left;
                showElementMask.style.top = helperLayer.style.top;
            }
        }

        function _transitionEndListener(_event) {
            
            // means that all the transition works are done
            if (_event.propertyName === 'height') {
                //set the helperNumber
                // _showNumberLayer();
            }
        }

        /**
         *  the upper are some customizine codes
         */

        var introJs = function(targetElm) {
            if ( typeof (targetElm) === 'object') {
                //Ok, create a new instance
                return new IntroJs(targetElm);

            } else if ( typeof (targetElm) === 'string') {
                //select the target element with query selector
                var targetElement = document.querySelector(targetElm);

                if (targetElement) {
                    return new IntroJs(targetElement);
                } else {
                    throw new Error('There is no element with given selector.');
                }
            } else {
                return new IntroJs(document.body);
            }
        };

        /**
         * Current IntroJs version
         *
         * @property version
         * @type String
         */
        introJs.version = VERSION;

        //Prototype
        introJs.fn = IntroJs.prototype = {
            clone : function() {
                return new IntroJs(this);
            },
            setOption : function(option, value) {
                this._options[option] = value;
                return this;
            },
            setOptions : function(options) {
                this._options = _mergeOptions(this._options, options);
                return this;
            },
            getOptions : function() {
                return this._options;
            },
            getOption : function(option) {
              return this._options[option];  
            },
            start : function() {
                _introForElement.call(this, this._targetElement);
                return this;
            },
            goToStep : function(step) {
                _goToStep.call(this, step);
                return this;
            },
            exit : function() {
                _exitIntro.call(this, this._targetElement);
            },
            refresh : function() {
                // _setHelperLayerPosition.call(this, document.querySelector('.introjs-helperLayer'));
                _refresh.call(this);
                return this;
            },
            onbeforechange : function(providedCallback) {
                if ( typeof (providedCallback) === 'function') {
                    this._introBeforeChangeCallback = providedCallback;
                } else {
                    throw new Error('Provided callback for onbeforechange was not a function');
                }
                return this;
            },
            onchange : function(providedCallback) {
                if ( typeof (providedCallback) === 'function') {
                    this._introChangeCallback = providedCallback;
                } else {
                    throw new Error('Provided callback for onchange was not a function.');
                }
                return this;
            },
            oncomplete : function(providedCallback) {
                if ( typeof (providedCallback) === 'function') {
                    this._introCompleteCallback = providedCallback;
                } else {
                    throw new Error('Provided callback for oncomplete was not a function.');
                }
                return this;
            },
            onexit : function(providedCallback) {
                if ( typeof (providedCallback) === 'function') {
                    this._introExitCallback = providedCallback;
                } else {
                    throw new Error('Provided callback for onexit was not a function.');
                }
                return this;
            },
            getTotalSections : function() {
                return this._options.totalSections;
            },
            getCurrentStep : function() {
                return this._currentStep + 1;
            },
            resetStep : function(stepNum, target, setting) {
                
                this._introItems[stepNum - 1] = {
                    element : document.querySelector(target),
                    title : setting.title ? setting.title : '',
                    intro : setting.intro ? setting.intro : '',
                    position : setting.tipPosition ? setting.tipPosition : 'bottom',
                    numPosition : setting.numPosition ? setting.numPosition : 'top-right'
                };
                return this;
            },
            addStepEnterCallback : function(stepnum, callback) {
                this._stepCallbacks.enter.push({
                    step : stepnum,
                    callback : callback
                });
            },
            addStepLeaveCallback : function(stepnum, callback) {
                this._stepCallbacks.leave.push({
                    step : stepnum,
                    callback : callback
                });
            }
        };

        exports.introJs = introJs;
        return introJs;
    }));
