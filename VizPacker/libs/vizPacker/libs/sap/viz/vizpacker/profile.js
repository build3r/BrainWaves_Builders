define(['jquery', "./constants", "./gen/lib", "./gen/html", "./gen/css"], function($, _cs, _genLib, _genHtml, _genCSS){
    var _et = $("<div style='display:none;'/>").appendTo("body"); //event target, current supports events: profileloaded, propertychanged, datamodelchanged;
    var _dataModelType = {
        flattenTable: "flattenTable",
        crossTable: "crossTable"
    };
    var _plotContainerType = {
        svg : "svg",
        div : "div"
    }
    /*Chart class*/
    function Chart(id, name, version, modules) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.modules = modules || {};
        this._code = {}; //{js:xxx, html:xxx}
        this._data = undefined;
        this._dataModel = _dataModelType.crossTable;
        this._plotContainer = _plotContainerType.svg;
    }
    var cp = Chart.prototype;
    cp.title = function(titleModule) {
        if (titleModule) {
            this.modules.title = titleModule;
            return this;
        }
        return this.modules.title;
    };
    cp.legend = function(legendModule) {
        if (legendModule) {
            this.modules.legend = legendModule;
            return this;
        }
        return this.modules.legend;
    };
    cp.plot = function(plotModule) {
        if (plotModule) {
            this.modules.plot = plotModule;
            return this;
        }
        return this.modules.plot;
    };
    cp.position = function(module) {
        return module && module.layout && module.layout.position ? module.layout.position : undefined;
    };
    function _onPropertyChanged(type, name, value) {
        _et.trigger("propertychanged", [type, name, value]);
    }
    cp.property = function(moduleType, name, value) {
        if (moduleType === undefined) { //chart property
            if (arguments.length === 2) {
                return this[name];
            } else {
                if (this[name] !== value) {
                	// chart.id only supports lowercase
                	if (name === "id") {
                		value = value.toLowerCase();
                	}
                    this[name] = value;
                    _onPropertyChanged("chart", name, value);
                }
                return this;
            }
        }
        //module property
        var module;
        switch (moduleType) {
            case _cs.moduleType.title:
                module = this.title();
                break;
            case _cs.moduleType.legend:
                module = this.legend();
                break;
            case _cs.moduleType.plot:
                module = this.plot();
                break;
            default:
                throw "Unknown module type: " + moduleType;
        }
        if (arguments.length === 2) {
            return module[name];
        }
        if (module[name] !== value) {
            module[name] = value;
            _onPropertyChanged(moduleType, name, value);
        }
        return this;
    };
    cp.save = function() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            dataModel: this._dataModel,
            modules: this.modules,
            code: $.extend({}, this.code()),
            data: this.data()
        };
    };
    cp.load = function(co) {
        this._dataModel = co.dataModel;
        this._data = _fixDataMapping(co.data);
        if (co.code) {
            var code = co.code;
            code.bundle = decodeURIComponent(code.bundle);
            code.module = decodeURIComponent(code.module);
            code.flow = decodeURIComponent(code.flow);
            code.render = decodeURIComponent(code.render);
            code.dataMapping = decodeURIComponent(code.dataMapping);
           	code.util = decodeURIComponent(code.util);
            code.html = decodeURIComponent(code.html);
			code.css = decodeURIComponent(code.css);
            this.code(code);
        } else {
            // gen code
            var bundle = _genLib.generateBundle(this.chart),
                module = _genLib.generateModule(this.chart),
                flow = _genLib.generateFlow(this.chart),
                render = _genLib.generateRender(this.chart),
                dataMapping = _genLib.generateDataMapping(this.chart),
                util = _genLib.generateUtil(this.chart),
                html = _genHtml.generate(this.chart),
                css = _genCSS.generate(this.chart);
            this.code = ({
            	bundle: bundle,
            	module: module,
            	flow: flow,
            	render: render,
            	dataMapping: dataMapping,
            	util: util,
            	html: html,
            	css: css
            });
        }
        return this;
    };
    cp.removeModule = function(type, noEvent) {
        delete this.modules[type];
        if (!noEvent) _et.trigger("moduleremoved", [type]);
    };
    cp.createModule = function(type, position, positionPriority) {
        if (type === _cs.moduleType.plot) 
            console.error("something wrong.");
        if (!position) position = type === _cs.moduleType.title ? "top" : "right";
        if (positionPriority === undefined) positionPriority = 1;
        this.modules[type] = {
            layout: {
                position: position,
                priority: positionPriority
            }
        };
        _et.trigger("moduleadded", [type, position,positionPriority]);
        return this.modules[type];
    };
    
    cp.on = function(evtName, handler) {
        _et.on(evtName, handler);
        return this;
    };
    
    cp.code = function(code) {
        if (arguments.length) {
            for( name in code ) { 
                this._code[name] = code[name]; 
            } 
            return this._code;
        }
        //TODO: need optimization - only re-gen code after property change incl. feed def changed.
        var bundle = _genLib.generateBundle(this, this._code.bundle),
        module = _genLib.generateModule(this, this._code.module),
        flow = _genLib.generateFlow(this, this._code.flow),
        render = _genLib.generateRender(this, this._code.render),
        dataMapping = _genLib.generateDataMapping(this, this._code.dataMapping),
        util = _genLib.generateUtil(this, this._code.util),
        html = _genHtml.generate(this, this._code.html),
        css = _genCSS.generate(this, this._code.css);
        this._code = {
            bundle: bundle,
            module: module,
            flow: flow,
            render: render,
            dataMapping: dataMapping,
            util: util,
            html: html,
            css: css
        };
        return this._code;
    };
    
    cp.useFlattenTable = function(i_flag) {
        if (arguments.length > 0) {
            var newDM = i_flag ? _dataModelType.flattenTable : _dataModelType.crossTable;
            if (this._dataModel !== newDM) {
                this._dataModel = newDM;
                _et.trigger("datamodelchanged");
            }
            return this;
        }
        return this._dataModel === _dataModelType.flattenTable;
    };

    cp.useDivContainer = function(i_flag) {
        if(arguments.length > 0) {
            var newContainer = i_flag ? _plotContainerType.div : _plotContainerType.svg;
            if(this._plotContainer !== newContainer) {
                this._plotContainer = newContainer;
                _et.trigger("plotcontainerchanged");
            }
            return this;
        }
        return this._plotContainer === _plotContainerType.div;
    }
    
    function _fixDataMapping(data) {
        var mapping = data.mapping,
            ds1 = mapping.ds1,
            ms1 = mapping.ms1
            ;
        mapping.ds1Name = mapping.ds1Name ||$("#dimensionSet1Name").text();
        mapping.ds2Name = mapping.ds2Name ||$("#dimensionSet2Name").text();
        mapping.ms1Name = mapping.ms1Name ||$("#measureSet1Name").text();
        mapping.ms2Name = mapping.ms2Name ||$("#measureSet2Name").text();
        mapping.ms3Name = mapping.ms3Name ||$("#measureSet3Name").text();
        if (!ds1 || !ds1.length || !ms1 || !ms1.length) {
            alert("Dimension set 1 and measure set 1 are required, please assign at least one dimension or measure to them respectively.");
            return this;
        }

        return data;
    }
    /*------------------------------
    add quotes to dimension
    remove quotes from measure
    ------------------------------*/
    function _fixQuotes(data) {
        var aaIndex=[],msIndex=[];
        var mapping = data.mapping;
        var fields = data.fields;
        var table = data.table;
        var distinguish = function(dataName){
            var indexName=[];
            dataName.forEach(function(ds){
                mapping[ds].forEach(function(dimension){
                    fields.forEach(function(field,index){
                        if(dimension===field){
                            indexName.push(index);
                        }
                    })
                })
            })
            return indexName;
        };
        //distinguish the aa from the field
        aaIndex = distinguish(_cs.dataTypeName.dimensionName);
        msIndex = distinguish(_cs.dataTypeName.measureName);
        //add quotes
        for(i=0;i<aaIndex.length;i++){
            for(j=0;j<table.length;j++){
                if((typeof table[j][aaIndex[i]])==='number'){
                    data.table[j][aaIndex[i]]=table[j][aaIndex[i]]+"";    //float2string
                }
            }
        }
        //remove quotes
        for(i=0;i<msIndex.length;i++){
            for(j=0;j<table.length;j++){
                if((typeof Number(table[j][msIndex[i]]))==='number'){
                    data.table[j][msIndex[i]]=Number(table[j][msIndex[i]]);    //string2float
                }
            }
        }
        return data;
    };

    cp.data = function(data) {
        if (arguments.length) {
            this._data = $.extend(true, {}, data);
            _fixDataMapping(this._data);
            _et.trigger("datachanged");
            this._data = _fixQuotes(this._data);
            return this;
        }
        return this._data;
    };
    
    cp.dimensionGroupCount = function() {
        var data = this.data(),
            mapping = data.mapping,
            count = 0
            ;
        $.each([mapping.ds1, mapping.ds2], function(idx, ms) {
            if (ms && ms.length) {
                count = idx + 1;
            };
        });
        return count;
    };
    
    /*profile*/
    /*
     * version history:
     * 1.1.0 2013-10-18 use csv as data format
     * 1.0.2 2013-09-06
     * 1.0.1 2013-07-26
     * 1.0.0 initial verison
     * */
    var _version = '1.1.0';
    var _magicString = 'SAPVIZPACKER';
    var _p = {
        chart: undefined
    };
    function createFeed(id, name, type, min, max, idx) {
        var feed = {
            id: id,
            name: name,
            type: type,
            min: min,
            max: max
        };
        feed[(type === 'Dimension' ? 'aaIndex' : 'mgIndex')] = idx;
        return feed;
    }
    var _sampleData = {
        default: {
            fields: ["City", "Year", "Margin", "Quantity sold", "Sales revenue"],
            mapping: {
                ds1: ["City", "Year"],
                ds1Name: "X Axis",
                ds2: [],
                ms1: ["Margin", "Quantity sold", "Sales revenue"],
                ms1Name: "Y Axis",
                ms2: [],
                ms3: []
            },
            table: [
                [ "Austin", "2009", 1676.70, 21, 3930.00 ], 
                [ "Austin", "2011", 3097.90, 52, 9861.90 ], 
                [ "Austin", "2010", 230.80, 2, 498.00 ], 
                [ "Boston", "2009", 153.60, 2, 422.50 ], 
                [ "Boston", "2011", 4092.10, 61, 12677.10 ], 
                [ "Boston", "2010", 555.40, 7, 1656.20 ], 
                [ "Colorado Springs", "2009", 150.70, 9, 1087.00 ], 
                [ "Colorado Springs", "2011", 1741.20, 38, 6724.00 ], 
                [ "Colorado Springs", "2010", 1328.20, 12, 2988.00 ], 
                [ "Chicago", "2010", 2116.50, 20, 4890.40 ], 
                [ "Chicago", "2009", 1165.80, 10, 2281.00 ], 
                [ "Chicago", "2011", 6944.30, 79, 18406.10 ], 
                [ "Dallas", "2009", 823.40, 7, 1550.90 ], 
                [ "Dallas", "2011", 3848.30, 51, 10994.60 ], 
                [ "Dallas", "2010", 2303.80, 25, 5695.60 ], 
                [ "Houston", "2009", 5759.00, 71, 13332.10 ], 
                [ "Houston", "2011", 9749.60, 144, 28733.00 ], 
                [ "Houston", "2010", 19.30, 1, 129.00 ], 
                [ "Los Angeles", "2009", 2790.20, 30, 5954.20 ], 
                [ "Los Angeles", "2011", 6571.70, 82, 17585.20 ], 
                [ "Los Angeles", "2010", 175.60, 3, 527.20 ]    
            ]
        },
        test1: {
            fields: ["Dim1", "Dim2", "M1"],
            mapping: {
                ds1: ['Dim1', 'Dim2'],
                ds2: [],
                ms1: ['M1'],
                ms2: [],
                ms3: []
            },
            table: [
                [ "Mem1_1", "Mem2_1", 1 ], 
                [ "Mem1_2", "Mem2_2", 2 ], 
                [ "Mem1_3", "Mem2_3", 3 ]
            ]
        },
        test2: {
            fields: ["year", "country", "income", "cost"],
            mapping: {
                ds1: ['year'],
                ds2: ['country'],
                ms1: ['income'],
                ms2: ['cost'],
                ms3: []
            },
            table: [
                [ '2010', 'China', 5930.393, 1593.0393 ],
                [ '2010', 'US', 7298.147, 829.8147 ], 
                [ '2011', 'China', 14526.550, 2452.6550 ], 
                [ '2011', 'US', 15094.025, 3509.4025 ]
            ]
        }
    };
    function _defaultData() {
        return _fixDataMapping(_sampleData.default);
    }
    function _createChart() {
        var chart = new Chart("sap.viz.ext.helloworld", "Hello World", "1.0.0.0", {}),
            cm = chart.modules
            ;
        cm.plot = {
            id: "sap.viz.ext.module.HelloWorldModule",
            name: 'Hello World Module',
            feeds: {
                ds1: createFeed("viz.ext.feed.DS1", "Dimension Set 1", "Dimension", 1, 1, 1),
                ds2: createFeed("viz.ext.feed.DS2", "Dimension Set 2", "Dimension", 1, 1, 2),
                ms: createFeed("viz.ext.feed.MS", "Measure Set", "Measure", 1, 1, 1)
            }
        };
        chart.createModule(_cs.moduleType.title);
        chart.createModule(_cs.moduleType.legend);
        //set default property values
        chart.title()["alignment"] = "center";
        var legend = chart.legend();
        legend["type"] = "ColorLegend";
        legend["drawingEffect"] = "normal";
//        chart.data(_defaultData());
        chart._data = _defaultData();

        // gen code
        var bundle = _genLib.generateBundle(chart),
            module = _genLib.generateModule(chart),
            flow = _genLib.generateFlow(chart),
            render = _genLib.generateRender(chart),
            dataMapping = _genLib.generateDataMapping(chart),
            util = _genLib.generateUtil(chart),
            html = _genHtml.generate(chart),
            css = _genCSS.generate(chart);
        chart.code({
        	bundle: bundle,
        	module: module,
        	flow: flow,
        	render: render,
        	dataMapping: dataMapping,
        	util: util,
        	html: html,
        	css: css
        });
        return chart;
    }
    _p.create = function() {
        _p.chart = _createChart();
        return this;
    };
    _p.load = function(profileObject) {
        if (!profileObject.magic || profileObject.magic !== _magicString) {
            throw "The file is not a profile file.";
        }
        var vc1 = _version.split('.'), vc2 = profileObject.version.split('.'), i = -1, n1, n2;
        n1 = n2 = 0;
        for (; ++i < vc1.length;) {
            n1 += parseInt(vc1[i]) * Math.pow(100, 2 - i);
            n2 += parseInt(vc2[i]) * Math.pow(100, 2 - i);
        }
        if (n1 < n2) {
            throw "Can't load from a profile of higher version: my version is " + _version + ", profile version is " + profileObject.version;
        }
        var co = profileObject.chart;
        if (n2 < 10101) { // for profile prior to 1.1.0, need to convert data table from object array to csv format
            var table = co.data.table;
            if (table && table.length && !(table[0] instanceof Array)) {
                var csv = [];
                var fs = co.data.fields;
                $.each(table, function(idx, obj) {
                    var row = [];
                    $.each(fs, function(jdx, field) {
                        row.push(obj[field]);
                    });
                    csv.push(row);
                });
                co.data.table = csv;
            }
        }
        this.chart = new Chart(co.id, co.name, co.version, co.modules);
        this.chart.load(co);
        _et.trigger("profileloaded");
        return this;
    };
    _p.save = function() {
        var ch = this.chart.save(),
            code = ch.code
            ;
        code.bundle = encodeURIComponent(code.bundle);
        code.module = encodeURIComponent(code.module);
        code.flow = encodeURIComponent(code.flow);
        code.render = encodeURIComponent(code.render);
        code.dataMapping = encodeURIComponent(code.dataMapping);
        code.util = encodeURIComponent(code.util);
        code.html = encodeURIComponent(code.html);
        code.css = encodeURIComponent(code.css);
        ch.code = code;
        var po = {
            magic: _magicString,
            version: _version,
            chart: ch
        };
        return po;
    };
    _p.currentChart = function() {
        return _p.chart;
    };
    //dispatch chart related methods to chart instance
    $.each(['title', 'legend', 'plot', 'feeds', 'feed', 'position', 'property', 'createModule', 'removeModule', 'on', 'code', 'data', 'useFlattenTable', 'useDivContainer'], function(i, name){
        _p[name] = function() {
            if (!_p.chart) throw "Profile doesn't contain a chart, please init it first";
            var res = _p.chart[name].apply(_p.chart, arguments);
            if (res === _p.chart) return _p;
            return res;
        };
    });
    
    return _p;
});
