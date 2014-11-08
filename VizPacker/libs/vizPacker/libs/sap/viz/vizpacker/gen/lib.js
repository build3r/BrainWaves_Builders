define(['../util'], function(_util) {
    /*************************** CODE TEMPLATE BEGIN **********************************/
    /*------------------- lib template begin -------------------*/
function _renderFuncTemplate() {
/*<<dependency*/
define("%chart.id%-src/js/render", ["%chart.id%-src/js/utils/util"], function(util){
/*dependency>>*/ 
    /**
     * This function is a drawing function; you should put all your drawing logic in it.
     * it's called in moduleFunc.prototype.render
     * @param {Object} data - data set passed in
     * @param {Object} container - target DOM element (SVG or DIV) of the plot area to render in
     * @param {float} width - width of canvas
     * @param {float} height - height of canvas
     * @param {Array of color string} colorPalette - color palette
     * @param {Object} properties - properties of chart
     * @param {Object} dispatch - event dispatcher
     */
    var render = function(data, container, width, height, colorPalette, properties, dispatch) {
		//prepare canvas with width and height of container
		container.selectAll('svg').remove();
        var vis = container.append('svg').attr('width', width).attr('height', height)
                    .append('g').attr('class', 'vis').attr('width', width).attr('height', height);
      
// START: sample render code for a column chart
// Replace the code below with your own one to develop a new extension
      
        /**
         * To get the dimension set, you can use either name or index of the dimension set, for example
         *     var dset_xaxis = data.meta.dimensions('X Axis’);    // by name 
         *     var dset1 = data.meta.dimensions(0);                // by index
         * 
         * To get the dimension or measure name, you should only use index of the dimension and avoid
         * hardcoded names.
         *     var dim1= dset_xaxis[0];        // the name of first dimension of dimension set ‘X Axis'
         * 
         * The same rule also applies to get measures by using data.meta.measures()
         */
        var dsets = data.meta.dimensions(),
            msets = data.meta.measures();
        
        var mset1 = data.meta.measures(0); 
        // only one measure 'Margin' is used in this sample
        var ms1 = mset1[0];                                                      

        // converts the json object array data into simple key-value array.
        var fdata = data.map(function(d) {
            var val = parseFloat(d[ms1]);
            mems = [];
            $.each(dsets, function(idx, dim) {
                mems.push(d[dim]);
            });
            return [mems.join(" / "), val];
        });

        var margin = {
            top: 20,
            right: 20,
            bottom: 60,
            left: 40
        };
        var plotWidth = width - margin.left - margin.right,
            plotHeight = height - margin.top - margin.bottom;
        //transform plot area
        vis.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        //create x and y scales, domains and axes
        var x = d3.scale.ordinal().rangeRoundBands([0, plotWidth], .1);
        x.domain(fdata.map(function(d) {
            return d[0];
        }));
        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(function(d) {
            //don't show x labels
            return '';
        });

        var y = d3.scale.linear().range([plotHeight, 0]);
        y.domain([0, d3.max(fdata, function(d) {
            return d[1];
        })]);
        var yAxis = d3.svg.axis().scale(y).orient("left");

        //draw x axis
        vis.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + plotHeight + ")")
            .call(xAxis)
            .append("text")
            .attr("x", plotWidth)
            .attr("dy", "1.5em")
            .style("text-anchor", "end")
            .text(dsets.join(" / "));

        //draw y axis
        vis.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(ms1);

        //draw bars
        vis.selectAll(".bar").data(fdata).enter().append("rect").attr("class", "bar").attr("x", function(d) {
            return x(d[0]);
        }).attr("width", x.rangeBand()).attr("y", function(d) {
            return y(d[1]);
        }).attr("height", function(d) {
            return plotHeight - y(d[1]);
        }).attr("fill", function(d, i) {
            return colorPalette[i % colorPalette.length];
        }).attr("stroke", properties ? properties["borderColor"] : "none").on("click", function(d, i) {
            // trigger a customized event which can be used in HTML file
            dispatch.barData(d);
            // trigger the data selection event which can be responded in SAP Lumira.
            util.fireSelectDataEvent(dispatch, ms1, d, i);
        });

        //set style of axis and its ticks and text
        $(".axis path, .axis line").css({
            fill: 'none',
            stroke: '#000',
            'shape-rendering': 'crispEdges'
        });
        $(".axis text").css({
            'font-size': '12px'
        });
        $(".axis > text").css({
            "font-size": "16px",
            "font-weight": "bold"
        });
// END: sample render code
    };

    return render; 
});
}

function _dataMappingFuncTemplate() {
/*<<dependency*/
define("%chart.id%-src/js/dataMapping", ["%chart.id%-src/js/utils/util"], function(util){
/*dependency>>*/
    var processData = function(data, feeds, done) {
        // Build name index so that dimension/measure sets can be accessed by name
        util.buildNameIdx(feeds);
        /**
         * mapper function is optional and used to customize your data conversion logic, for example, 
         * you can map from object array to a simplified x-y value array as below, 
         *
         *     var mapper = function(d, meta) {
         *         var val = parseFloat(d[meta.measures(0, 0)]);
         *         mems = [];
         *         $.each(meta.dimensions(), function(idx, dim) {
         *             mems.push(d[dim]);
         *        });
         *       return [mems.join(" / "), val];
         *     }
         */
        var mapper = function(d, meta) {
            return d;
        }
        // convert data into an object array, which is compatible to the return of
        // d3.csv() by default. Each data row is converted into attributes of an object.
        util.toTable(data, mapper, function(err, pData) {
            if(err) {
                return done(err, null);
            } else if(!pData) {
                return done('Empty data', null);
            }
            return done(null, pData);
        });
    };
    return processData;
});
}

function _utilsTemplate() {
/*<<dependency*/
define("%chart.id%-src/js/utils/util", [], function(){
/*dependency>>*/
    /*------------------------------------------------------------------------*/

    /**
     * In most cases, you don't need to modify the following code.
     */
    var _util = {/*__FOLD__*/
        /**
         * Converts data to flatten table format. Accepts MultiAxisDataAdapter, CrosstableDataset and FlattableDataset as data input.
         * Invocation example:
         * _util.toTable(data, [mapper], callback);
         * data : data input
         * mapper[optional] : a mapper that maps each data to another format.
         * eg. mapper = function(d, [meta]){...}
         * callback : accepts the error message and output data to generate visualization.
         * eg. callback = function(err, data, [meta]){...}
         */
        toTable: function(data, f1, f2) {
            var cb = f2 || f1,
                mapper = f2 ? f1 : undefined,
                rows;
            try {
                var me = this, parser = me._getParser(data);
                rows = parser.call(me, data);
                if(!rows) {
                    return cb('The chart needs at least one measure to render, please change the feeding settings in data panel.');
                }
                me._meta = rows.meta;
            
                if (mapper) {
                    rows = rows.map(function(d) {
                        return mapper(d, me._meta);
                    });
                    rows.meta = me._meta;
                }
            } catch (err) {
                return cb(err, null, null);
            } 
            if (cb) {
                return cb(null, rows, me._meta);
            } else {
                return rows;
            }
             
        },

        buildNameIdx : function(feeds) {
            if(feeds) {
                this._feeds = feeds, this._dimMap = {}, this._mgMap = {};
                var that = this;
                feeds.forEach(function(feed) {
                    if(feed.aaIndex) {
                        that._dimMap[feed.name] = feed.aaIndex - 1;
                    } else {
                        that._mgMap[feed.name] = feed.mgIndex - 1;
                    }
                });
            }
        },

        _getParser : function(data) {
            if(data.dataset) {
                var dataset = data.dataset;
                if(dataset.table) {
                    return this._flat;
                } else {
                    return this._cross;
                }
            }
            return this._cross;
        },

        _flat : function(data) {
            var dataset = data.dataset;
            var ret = dataset.table();
            ret.meta = {
                _dimensionSets : [dataset.dimensions()],
                _measureSets : [dataset.measures()],

                dimensions : function(i, j) {
                    if(arguments.length == 2) {
                        return this._dimensionSets[0][j];                        
                    }
                    return this._dimensionSets[0];
                },

                measures : function(i, j) {
                    if(arguments.length == 2) {
                        return this._measureSets[0][j];
                    }
                    return this._measureSets[0];
                }
            }

            return ret;
        },

        _parseMeta : function(meta) {
            if(!meta) {
                return;
            } else {
                return {
                    _dimMap : this._dimMap,
                    _mgMap : this._mgMap,
                    _meta : {
                        measureSets : (function(measureSets) {
                            var tmp = [];
                            $.each(measureSets, function(idx, ele) {
                                tmp[idx] = ele.map(function(d) {
                                    return d.measure;
                                });
                            })
                            return tmp;
                        }(meta.measureSets)),
                        dimSets : (function(dimSets) {
                            var tmp = [];
                            $.each(dimSets, function(idx, ele) {
                                tmp[idx] = ele.map(function(d) {
                                    return d.dimension;
                                });
                            })
                            return tmp;
                        }(meta.dimSets))
                    },
                    measures : function(i, j) {
                        if(arguments.length == 0) {
                            var ret = [];
                            $.each(this._meta.measureSets, function(idx, ms) {
                                $.each(ms, function(idx, measure) {
                                    ret.push(measure);
                                });
                            });
                            return ret;
                        } else if(arguments.length == 1) {
                            if(this._mgMap && this._mgMap[i] !== undefined) {
                                i = this._mgMap[i];  
                            }
                            if(!this._meta.measureSets[i]) {
                                throw 'MeasureGroup "' + i + '" not found!';
                            }
                            return this._meta.measureSets[i];
                        } else {
                            return this._meta.measureSets[i][j];
                        }
                    },
                    dimensions : function(i, j) {
                         if(arguments.length == 0) {
                            var ret = [];
                            $.each(this._meta.dimSets, function(idx, ds) {
                                $.each(ds, function(idx, dim) {
                                    ret.push(dim);
                                });
                            });
                            return ret;
                        } else if(arguments.length == 1) {
                            if(this._dimMap && this._dimMap[i] !== undefined) {
                                i = this._dimMap[i];  
                            }
                            if(!this._meta.dimSets[i]) {
                                throw 'Dimension Set "' + i + '" not found!';
                            }
                            return this._meta.dimSets[i];
                        } else {
                            return this._meta.dimSets[i][j];
                        }
                    },
                }
            }
        },

        _extractCtx: function(meta, data) {
            var ctx = {};
            $.each(data._mg, function(idx, mg) {
                $.each(mg.values, function(idx, mgValues) {
                    var ctxRows = [];
                    ctx[mgValues.col] = ctxRows;
                    $.each(mgValues.rows, function(idx, rows) {
                        $.each(rows, function(idx, row) {
                            ctxRows.push(row.ctx);
                        });
                    });
                });
            });
            $.each(data._aa, function(idx, aa) {
                $.each(aa.values, function(idx, axis) {
                    var ctxRows = [];
                    ctx[axis.col.val] = ctxRows;
                    $.each(axis.rows, function(idx, row) {
                        ctxRows.push(row.ctx);
                    });
                });
            });
            meta._ctx = ctx;
            meta.context = function(col, dataIdx) {
                return this._ctx[col][dataIdx];
            };
        },

        _cross : function(data) {
            var ret =  this._toFlattenTable(data);
            if( !ret ) {
                console.log("Null data detected, there is either no data, or no measure columns in the data.");
                return;
            }
            ret.meta = this._parseMeta(ret.meta);
            //Extract data context for MultiAxisDataAdapter
            if(data.getAnalysisAxisDataByIdx) {
                this._extractCtx(ret.meta, data);
            }
            return ret;
        },
        /**
         * extract dimension sets from data
         * @param data [Crosstable Dataset] crosstable dataset
         * @returns array of dimension sets, and each dimension set is an object of {dimension: "dimension name", data: [members]}.
         * e.g. [{dimension: 'country', data: ['China', 'US', ...]}, {dimension: 'year', data: ['2010', '2011', ...]}, ...]
         */
        _extractDimSets : function(data) {
            var dimSet1, dimSet2, res = [];
            if (data.getAnalysisAxisDataByIdx) {
                dimSet1 = data.getAnalysisAxisDataByIdx(0);
                dimSet2 = data.getAnalysisAxisDataByIdx(1);
            } else if (data.dataset && data.dataset.data) {
                data.dataset.data().analysisAxis.forEach(function(g){
                    var resg = [];
                    g.data.forEach(function(d){
                        var length = d.values.length;
                        var result = {};
                        result.data = [];
                        for(var i in d.values){
                            result.data[i] = d.values[i];
                        };
                        result.dimension = d.name;
                        resg.push(result);
                    });
                    res.push(resg);
                });
                return res;
            };

            $.each([dimSet1, dimSet2], function(idx, dimSet) {
                dimSet = dimSet ? dimSet.values : undefined;
                if (!dimSet)
                    return;
                var dims = [], dim;
                for (var i = 0; i < dimSet.length; i++) {
                    dim = {
                        dimension : dimSet[i].col.val,
                        data : []
                    };
                    for (var j = 0; j < dimSet[i].rows.length; j++)
                        dim.data.push(dimSet[i].rows[j].val);
                    dims.push(dim);
                }
                res.push(dims);
            });
            return res;
        },

        /**
         * extract measure sets from data
         * @param data [Crosstable Dataset] crosstable dataset
         * @returns array of measures, and each measure is an object of {measure: "measure name", data: [measure data]}.
         * for example, [[{measure: 'income', data: [555, 666, 777, ...]}, {measure: 'cost', data:[55, 66, 77, ...]}, ...], ...]
         */
        _extractMeasureSets : function(data) {
            var measureSet1, measureSet2, measureSet3, reses = [];
            if (data.getMeasureValuesGroupDataByIdx) {
                measureSet1 = data.getMeasureValuesGroupDataByIdx(0);
                measureSet2 = data.getMeasureValuesGroupDataByIdx(1);
                measureSet3 = data.getMeasureValuesGroupDataByIdx(2);
            }
            else if (data.dataset && data.dataset.data) {
                data.dataset.data().measureValuesGroup.forEach(function(g){
                    var resg = [];
                    g.data.forEach(function(d){
                        var length = d.values.length;
                        var result = {};
                        result.data = [];
                        for (var i in d.values) {
                            result.data[i] = d.values[i];
                        };
                        result.measure = d.name;
                        resg.push(result);
                    });
                    reses.push(resg);
                });
                return reses;
            };

            $.each([measureSet1, measureSet2, measureSet3], function(idx, measureSet) {
                measureSet = measureSet ? measureSet.values : undefined;
                if (!measureSet)
                    return;
                var res = [], resItem, resData, measure;
                for (var k = 0; k < measureSet.length; k++) {
                    measure = measureSet[k];
                    resItem = {
                        measure : measure.col,
                        data : []
                    };
                    resData = resItem.data;
                    for (var i = 0; i < measure.rows.length; i++) {
                        resData[i] = [];
                        for (var j = 0; j < measure.rows[i].length; j++) {
                            resData[i].push(measure.rows[i][j].val);
                        }
                    }
                    res.push(resItem);
                }
                reses.push(res);
            });

            return reses;
        },

        /**
         * convert crosstable data to flatten table data
         * @param data [Crosstable Dataset] crosstable dataset or MultiAxisDataAdapter
         * @returns array of objects, and each object represents a row of data table:
         * [{"dimension name1" : value1, "dimension name2" : value2, "measure name1" : value3}, ....{"dimension name1" : valueN1, "dimension name2" : valueN2, "measure name1" : valueN3} ]
         *
         * This method returns an extra meta data in data.meta, which includes all dimension and measure sets.
         */
        _toFlattenTable : function(data) {
            var dimSets = this._extractDimSets(data), measureSets = this._extractMeasureSets(data), fdata = [], datum, measure0Data, measure, me = this;
            //measureValueGroup is necessary in crosstable dataset
            //please directly call _util.extractDimSets() to get dimension values 
            if (measureSets.length === 0) {
                return;
            }
            var i, j, k, m;

            fdata = this._toFlatJsonArray(measureSets, dimSets);
            //fill meta data
            fdata.meta = {
                dimSets : dimSets,
                measureSets : measureSets
            };

            return fdata;
        },

        _toFlatJsonArray : function(measureSets, dimSets) {
            //convert data from ct to flat
            //TODO : if there is no measure, this logic will fail
            var fdata = [], measure0Data, me = this;

            measure0Data = measureSets[0][0].data;
            for ( i = 0; i < measure0Data.length; i++) {
                for ( j = 0; j < measure0Data[i].length; j++) {
                    datum = {};
                    $.each(dimSets, function(idx, dimSet) {
                        if (!dimSet)
                            return;
                        var counter = idx === 0 ? j : i;
                        for ( m = 0; m < dimSet.length; m++) {
                            datum[dimSet[m].dimension] = dimSet[m].data[counter]
                        }
                    });
                    $.each(measureSets, function(idx, measureSet) {
                        if (!measureSet)
                            return;
                        for ( m = 0; m < measureSet.length; m++) {
                            measure = measureSet[m];
                            datum[measure.measure] = measure.data[i][j];
                        }
                    });
                    fdata.push(datum);
                }
            }
            return fdata;
        },

        fireSelectDataEvent : function(dispatch, colName, data, i){
            // this event only works for lumira extension, in which the data model is MultiAxisDataAdapter
            if(this._meta.context) {
                dispatch.selectData({
                    name:"selectData",
                    data:_util.composeSelection(colName, data, this._meta,  i)
                });                
            }
        },

        composeSelection : function(colName, data, meta, index){
            // TODO: will add multiple selection support in the future
            // var len = data.length?data.length:1;
            var len = 1, returnValue = [], selectionObject = {}, selectionData = [];
            for (var i = 0; i < len; i++) {
                selectionData.push({
                    val: data,
                    ctx: this._meta.context(colName, index)
                });
            }
            selectionObject.data = selectionData;
            returnValue.push(selectionObject);
            return returnValue;
        },
    };
    return _util;
});
}

//for cross table
/********** please DO NOT change the indent of code lines of this method **********/
function _chartTemplateFunc() {
/*<<dependency*/
define("%chart.id%-src/js/module", ["%chart.id%-src/js/render", "%chart.id%-src/js/dataMapping"], function(render, processData) {
/*dependency>>*/
    // Drawing Function used by new created module
    var moduleFunc = {
        // color palette used by chart
        _colorPalette : d3.scale.category20().range().concat(d3.scale.category20b().range()).concat(d3.scale.category20c().range()),
        //event dispatcher
        _dispatch : d3.dispatch("initialized", "startToInit", 'barData', 'selectData')
    };

    moduleFunc.dispatch = function(_){
        if(!arguments.length){
            return this._dispatch;
        }
        this._dispatch = _;
        return this;
    };

    /**
     * function of drawing chart
     */
    moduleFunc.render = function(selection) {
        //add xml ns for root svg element, so the image element can be exported to canvas
        $(selection.node().parentNode.parentNode).attr("xmlns:xlink", "http://www.w3.org/1999/xlink");
         //save instance variables to local variables because *this* is not referenced to instance in selection.each
        var that = this,
            _data = this._data,
            _width = this._width,
            _height = this._height,
            _colorPalette = this._colorPalette,
            _properties = this._props,
            _dispatch = this._dispatch,
            _feeds = this._manifest.feeds;

        _dispatch.startToInit();
        selection.each(function() {
            processData(_data, _feeds, function(err, pData) {
                if(err) {
                    alert(err);
                    return;
                }
                render.call(that, pData, selection, _width, _height, _colorPalette, _properties, _dispatch);
            });
        });
        _dispatch.initialized({
            name : "initialized"
        });
    };

    /**
     * get/set your color palette if you support color palette
     */
    moduleFunc.colorPalette = function(_) {
        if (!arguments.length) {
            return this._colorPalette;
        }
        this._colorPalette = _;
        return this;
    };

    return moduleFunc;
});
    }

    /*------------------- lib template end -------------------*/

    /*------------------- chart template begin -------------------*/

    /*************************** CODE TEMPLATE END **********************************/

    var _template = "var ${0} = ${1};";

    function _genFeeds(chart) {
        var names = [], code = "/*Feeds Definition*/\n", plotModule = chart.plot(), plotId = plotModule.id, mapping = chart.data().mapping;
        $.each([{
            name : mapping.ds1Name,
            ds : mapping.ds1
        }, {
            name : mapping.ds2Name,
            ds : mapping.ds2
        }], function(idx, dsDef) {
            if (!dsDef.ds || !dsDef.ds.length)
                return;
            var def = {
                id : plotId + ".DS" + (idx + 1),
                name : dsDef.name, // "Set " + (idx+1),
                type : "Dimension",
                min : 1,
                max : 2,
                aaIndex : idx + 1,
                minStackedDims : 1,
                maxStackedDims : Infinity
            }, name = "ds" + (idx + 1);
            code += "//" + name + ": " + dsDef.ds.join(", ").replace(/\n/g,'\t') + "\n";
            var defCode = _util.formatJSON(def);
            //.replace("\n", " /*__FOLD__*/\n");
            code += _util.template(_template, [name, defCode]) + "\n";
            names.push(name);
        });
        $.each([{
            name : mapping.ms1Name,
            ms : mapping.ms1
        }, {
            name : mapping.ms2Name,
            ms : mapping.ms2
        }, {
            name : mapping.ms3Name,
            ms : mapping.ms3
        }], function(idx, msDef) {
            if (!msDef.ms || !msDef.ms.length)
                return;
            var def = {
                id : plotId + ".MS" + (idx + 1),
                name : msDef.name, // "Set " + (idx+1),
                type : "Measure",
                min : 1,
                max : "%Infinity%",
                mgIndex : idx + 1
            }, name = "ms" + (idx + 1);
            code += "//" + name + ": " + msDef.ms.join(", ") + "\n";
            var defStr = _util.formatJSON(def).replace('"%Infinity%"', "Infinity");
            code += _util.template(_template, [name, defStr]) + "\n";
            names.push(name);
        });
        return {
            names : names,
            code : code
        };
    }

    function _genModule(chart, modified) {
        if (modified !== undefined) {
          	return modified;
        }
        return _stringifyTemplateFunc(_chartTemplateFunc).replace(/%chart.id%/g, _asFolderName(chart.id));
    }

    function _stringifyTemplateFunc(func) {
        var str = func.toString();
        return str.substring(str.indexOf('\n') + 1, str.lastIndexOf('\n') - 1);
    }

    function _genModuleForFlow(chart, isFlow) {
        var json = $.extend(true, {}, chart.plot(), {
            fn : "%FN%"
        }), moduleCode, feedInfo = chart.useFlattenTable() ? {
            names : [],
            code : ""
        } : _genFeeds(chart), code = feedInfo.code, names = feedInfo.names;
        json.feeds = "%FEEDS%";
        moduleCode = _util.formatJSON(json);

        if (isFlow) {
            var len = names.length;
            for (var i = 0; i < len; i++) {
                code += "element.addFeed(" + names[i] + ");\n";
            }
        } else {
            code += "/*Module Definition*/\n" + _util.template(_template, ['module', moduleCode]);
            code = code.replace('"%FN%"', 'moduleFunc').replace('"%FEEDS%"', "[" + feedInfo.names.join(',') + "]");

        }

        return code;

    }

    function _getContainerType(chart) {
        return chart.useDivContainer() ? "'DIV'": "'BorderSVGFlow'";
    }

    function _genFlowAPIForCT(chart) {
        var code = "var flow = sap.viz.extapi.Flow.createFlow({\n\t" + "id : '" + chart.id + "',\n\t" + "name : '" + chart.name + "',\n\t" + "dataModel : 'sap.viz.api.data.CrosstableDataset',\n\t" + "type : " + _getContainerType(chart) + "\n" + "});\n";
        if (chart.title()) {
           code += "var titleElement  = sap.viz.extapi.Flow.createElement({\n\t" + "id : 'sap.viz.chart.elements.Title',\n\t" + "name : 'Title',\n" + "});\n";
           code += "flow.addElement({\n\t'element':titleElement,\n\t'propertyCategory':'title',\n\t'place':'"+chart.title().layout.position+"'\n});\n";

        } 
        if(chart.legend()) {
           code += "var legendElement  = sap.viz.extapi.Flow.createElement({\n\t" + "id : 'sap.viz.chart.elements.ColorLegend',\n\t" + "name : 'Legend',\n\t" + "dimensionIndex: [1],\n"+"});\n";
           code += "flow.addElement({\n\t'element':legendElement,\n\t'propertyCategory':'legend',\n\t'place':'"+chart.legend().layout.position+"'\n});\n";      
        };
        code += "var element  = sap.viz.extapi.Flow.createElement({\n\t" + "id : '" + chart.modules.plot.id + "',\n\t" + "name : '" + chart.modules.plot.name + "',\n" + "});\nelement.implement('sap.viz.elements.common.BaseGraphic', moduleFunc);\n";
        code += _genModuleForFlow(chart, true);
        code += "flow.addElement({\n\t'element':element,\n\t'propertyCategory' : '" + chart.modules.plot.name + "'\n});\n";
        return code;
    };
    
    function _genFlowAPIForFT(chart) {
        var code = "var element  = sap.viz.extapi.Flow.createElement({\n\t" + "id : '" + chart.modules.plot.id + "',\n\t" + "name : '" + chart.modules.plot.name + "',\n" + "});\nelement.implement('sap.viz.elements.common.BaseGraphic', moduleFunc);\n";
        code += "var flow = sap.viz.extapi.Flow.createFlow({\n\t" + "id : '" + chart.id + "',\n\t" + "name : '" + chart.name + "',\n\t" + "dataModel : 'sap.viz.api.data.FlatTableDataset',\n\t" + "type : " + _getContainerType(chart) + "\n" + "});\n";
        code += _genModuleForFlow(chart, true);
        code += "flow.addElement({\n\t'element':element,\n\t'propertyCategory' : '" + chart.id + "'\n});\n";
        return code;
    };
    
    function _genBundle(chart, modified) {
        if (modified !== undefined) {
        	return modified;
        }
        
        var code =  "/*<<bundle_immutable*/\n" +
            "define(\"" + chart.id.split('\.').slice(-1) + "-bundle\", [\"" + _asFolderName(chart.id) + "-src/js/flow\", \"css!" + _asFolderName(chart.id) + "-src/style/default.css\"], function(flowDefinition,cssStyleDeclaration) {\n" +
                    "    var cssString=\"\", rules, i;\n" +
                    "    if (cssStyleDeclaration && cssStyleDeclaration.cssRules) {\n" +
                    "            rules = cssStyleDeclaration.cssRules;\n" +
                    "        for (i=0;i<rules.length;i++) {\n" +
                    "            cssString += rules.item(i).cssText;\n" +
                    "        }\n" +
                    "    }\n" +
                    "    var vizExtImpl = {\n" +
                    "        viz   : [flowDefinition],\n" +
                    "        module: [],\n" +
                    "        feeds : [],\n" +
                    "        cssString : cssString\n" +
                    "    };\n" +
                    "    var vizExtBundle = sap.bi.framework.declareBundle({\n" +
                    "        \"id\" : \"" + _prefix(chart) + "\",\n" +
                    "        \"version\" : \"" + chart.version + "\",\n" +
                    "        \"components\" : [{\n" +
                    "            \"id\" : \"" + chart.id + "\",\n" +
                    "            \"provide\" : \"sap.viz.impls\",\n" +
                    "            \"instance\" : vizExtImpl,\n" +
                    "            \"customProperties\" : {\n" +           
                    "                \"name\" : \"" + chart.name + "\",\n" +
                    "/*bundle_immutable>>*/\n" +
                    "                \"description\" : \"\",\n" +
                    "                \"icon\" : {\"path\" : \"\"},\n" +
                    "                \"category\" : [],\n" +
                    "/*<<bundle_immutable*/\n" +
                    "                \"resources\" : [{\"key\":\"sap.viz.api.env.Template.loadPaths\", \"path\":\"./" + _asFolderName(chart.id) + "-src/resources/templates\"}]\n" +
                    "            }\n" +
                    "        }]\n" +
                    "   });\n";
        
            code += "   // sap.bi.framework.getService is defined in BundleLoader, which is\n" +
                    "   // always available at this timeframe\n"+
                    "   // in standalone mode sap.viz.js will force load and active the\n"+
                    "   // \"sap.viz.aio\" bundle\n"+
                    "   if (sap.bi.framework.getService(\"sap.viz.aio\", \"sap.viz.extapi\")) {\n"+
                    "       // if in standalone mode, sap.viz.loadBundle will be available,\n"+
                    "       // and we load the bundle directly\n"+
                    "       return sap.bi.framework.getService(\"sap.viz.aio\", \"sap.viz.extapi\").core.registerBundle(vizExtBundle);\n"+
                    "   } else {\n"+
                    "       // if loaded by extension framework, return the \"sap.viz.impls\"\n" +
                    "       return vizExtBundle;\n"+
                    "   }\n" +
                    "});\n" +
                       "/*bundle_immutable>>*/";
            return code;
    }

    function _genFlow(chart, modified) {
        if (modified !== undefined) {
        	return modified;
        }
        var co;
        var funcHeader = 
            "/*<<dependency*/\n" +
            "define(\"" + _asFolderName(chart.id) + "-src/js/flow\", [ \"" + _asFolderName(chart.id) + "-src/js/module\" ], function(moduleFunc) {\n" +
            "/*dependency>>*/\n" +
            "    var flowRegisterFunc = function(){\n";
        var funcTail = "sap.viz.extapi.Flow.registerFlow(flow);\n    };\n";
        if (!chart.useFlattenTable()) {
            co = _genFlowAPIForCT(chart);
        } else {
            co = _genFlowAPIForFT(chart);
        }
        co = funcHeader+_util.addTab(co, 2)+funcTail;
        co += "    flowRegisterFunc.id = '" + chart.id + "';\n" +
              "    return {\n" + 
              "        id : flowRegisterFunc.id,\n" + 
              "        init : flowRegisterFunc\n" +
      "    };\n" + 
      "});" 
      ;
        return co;
    }
    
    function _genRender(chart, modified) {
        if (modified !== undefined) {
            return modified;
        }
        return _stringifyTemplateFunc(_renderFuncTemplate).replace(/%chart.id%/g, _asFolderName(chart.id));
    }

    function _genDataMapping(chart, modified) {
        if (modified !== undefined) {
          return modified;
        }
        return _stringifyTemplateFunc(_dataMappingFuncTemplate).replace(/%chart.id%/g, _asFolderName(chart.id));
    }
    
    function _genUtil(chart, modified) {
        if (modified !== undefined) {
          return modified;
        }
        return _stringifyTemplateFunc(_utilsTemplate).replace(/%chart.id%/g, _asFolderName(chart.id));
    }

    function _prefix(chart) {
        var result = chart.id.split('/').join('.');
        return result;
    }
    
    function _asFolderName(chartId) {
        var result = chartId.split('.').join('_');
        return result;
    }
    
    
    return {
        generateBundle : _genBundle,
        generateModule : _genModule,
        generateFlow : _genFlow,
        generateRender : _genRender,
        generateDataMapping : _genDataMapping,
        generateUtil: _genUtil,
        
        filename : function(chart) {
            return _prefix(chart) + '.js';
        },
        zipName : function(chart) {
            return _prefix(chart) + ".zip";
        }
    };
});
