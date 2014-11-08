//	maintance a introJs instance
define([], function setUp() {

    var VizPackerIntro = function(targetElement, totalSections) {
        this.introJs = introJs(targetElement);
        this.targetElement = targetElement;
        this.introJs.setOption('sectionNum', 1);
        this.introJs.setOption('totalSections', totalSections);
        this.CONST_TOPINDEX = 99999999;
        this.CONST_SECONDARYINDEX = 99999998;
        this.CONST_BOTTOMINDEX = -99999999;
    };
    
    /**
         * add step for intro
         *
         * @api public
         * @method addStep
         * @param {Object} stepNum
         * @param {Object} target
         * @param {Object} setting
         * 
         * setting.element      necessary
         * setting.title        (default value: '')
         * setting.intro        (default value: '')
         * setting.tipPosition  (default value: 'bottom')
         * setting.numPosition  (default value: 'top-right')
         */
    VizPackerIntro.prototype.addStep = function(stepNum, target, setting) {

        if (stepNum <= 0)
            return;

        if (this.introJs.getOption('steps') === null || this.introJs.getOption('steps') === undefined) {
            this.introJs.setOption('steps', []);
        }

        // if the stepNum larger than introJs._options.steps.length, add this step to the steps array
        if (stepNum - this.introJs.getOption('steps').length > 0) {
            this.introJs.getOption('steps').push({
                element : document.querySelector(target),
                title : setting.title ? setting.title : '',
                intro : setting.intro ? setting.intro : '',
                position : setting.tipPosition ? setting.tipPosition : 'bottom',
                numPosition : setting.numPosition ? setting.numPosition : 'top-right'
            });

            var element = document.querySelector(target);
            if (element !== null) {
                element.setAttribute('data-step', this.introJs.getOption('steps').length);
            } else {
                throw Error('There is no element with given selector.');
            }
        } else {
            this.introJs.getOption('steps')[stepNum - 1].element.removeAttribute('data-step');
            this.introJs.getOption('steps')[stepNum - 1] = {
                element : document.querySelector(target),
               title : setting.title ? setting.title : '',
                intro : setting.intro ? setting.intro : '',
                position : setting.tipPosition ? setting.tipPosition : 'bottom',
                numPosition : setting.numPosition ? setting.numPosition : 'top-right'
            };
        }
    };

    VizPackerIntro.prototype.start = function() {
        this.introJs.start();
    };
    VizPackerIntro.prototype.exit = function() {
        this.introJs.exit();
    };
    VizPackerIntro.prototype.oncomplete = function(callback) {
        this.introJs.oncomplete(callback);
    };
    VizPackerIntro.prototype.onexit = function(callback) {
        this.introJs.onexit(callback);
    };
    VizPackerIntro.prototype.addStepEnterCallback = function(stepnum, callback) {
        this.introJs.addStepEnterCallback(stepnum, callback);
    };
    VizPackerIntro.prototype.addStepLeaveCallback = function(stepnum, callback) {
        this.introJs.addStepLeaveCallback(stepnum, callback);
    };
    VizPackerIntro.prototype.setSectionNum = function(sectionNum) {
        this.introJs.setOption('sectionNum', sectionNum);;
    };
    VizPackerIntro.prototype.resetStep = function(stepNum, target, setting) {
        if (stepNum < 0 || stepNum > this.introJs.getOption('steps').length)
            return;

        this.introJs.resetStep(stepNum, target, setting);
    };
    VizPackerIntro.prototype.getCurrentStep = function() {
      return this.introJs.getCurrentStep();  
    };
    VizPackerIntro.prototype.refresh = function() {
        this.introJs.refresh();
    };
    VizPackerIntro.prototype.getTopIndex = function() {
        return this.CONST_TOPINDEX;  
    };
    VizPackerIntro.prototype.getBottomIndex = function() {
        return this.CONST_BOTTOMINDEX;
    };
    VizPackerIntro.prototype.getSecondaryIndex = function() {
      return this.CONST_SECONDARYINDEX;  
    };
    // VizPackerIntro.prototype.
    return VizPackerIntro;
});
