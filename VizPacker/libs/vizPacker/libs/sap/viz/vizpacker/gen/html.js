define(['jquery', '../util', './lib'], function($, _util, _lib){
	var _templates = {
		whole: $("#templateHTML").val(),
		create: " 					try {\n" +
				"						var chart = sap.viz.api.core.createViz({\n" +
				"							type : '\"%chartId%\"',\n" +
				"							data : ds,\n" +
				"							container : $(\"#chart\"),\n" +
				"							properties : chartPoperties,\n" +
				"						});\n" +
				"					} catch (err) {\n" +
				"						console.log(err);\n" +
				"						return;\n" +
				"					}"
	};

	
	function _genDS(aaIndex, dims, allFields, table) {
		var index = aaIndex,
            dimIndexes = [],
			res = {
				"index": index,
				data: []
			},
			combs = [],
			comb,
			dim,
            mem,
			filtered,
			d,
			i, j
			;

		for (j = -1; ++j < dims.length;) {
			res.data.push({
				"type" : "Dimension",
				"name" : dims[j],
				"values" : []
			});
            dimIndexes.push(allFields.indexOf(dims[j]));
		}			
			
		for (i = -1;++i < table.length;) {
			d = table[i];
			filtered = combs.filter(function(c) {
				var dim;
				for (j = -1; ++j < dims.length;) {
					dim = dims[j];
                    mem = d[dimIndexes[j]];
					if (c[dim] !== mem) return false;
				}
				return true;
			});
			if (!filtered.length) {
				comb = {};
				for (j = -1; ++j < res.data.length;) {
					dim = res.data[j].name;
                    mem = d[dimIndexes[j]];
					res.data[j].values.push(mem);
					comb[dim] = mem;
				}
				combs.push(comb);
			}
		}
		return res;
	}
	

	
/* 
{
	"index" : 2,
	"data" : [ {
		"type" : "Dimension",
		"name" : "Time",
		"values" : [ "2010", "2011", "2012" ]
	} ]
}
	
	

					"measureValuesGroup" : [ {
						"index" : 1,
						"data" : [ {
							"type" : "Measure",
							"name" : "Value",
							"values" : [ [ 5930.393, 7298.147 ],
									[ 14526.550, 15094.025 ],
									[ 5488.424, 5869.471 ] ]
						} ]
					} ]	
	
	
*/	

	function _queryOne(table, cond, allFields) {
		return table.filter(function(d) {
			var notMatch = false;
			$.each(cond, function(key, value){
                var idx = allFields.indexOf(key);
				if (d[idx] !== cond[key]) {
					notMatch = true;
					return false;
				}
			});
			return notMatch !== true;
		})[0];
	}
	
	function _genMS(mapping, allFields, table, ds1, ds2) {
		var i, j, m, n, dims, mem, ds1Cond, ds2Cond, ds1Arr, datum, cdata = [];
		$.each([mapping.ms1, mapping.ms2, mapping.ms3], function(idx, ms) {
			if (!ms || !ms.length) return;
			var mo = {
				index: idx + 1,
				data: []
			};
			$.each(ms, function(jdx, m) {
				mo.data.push({
					type: "Measure",
					name: m,
					values: []
				});
			});
			cdata.push(mo);
		});
		
		if (!ds2 || !ds2.data || !ds2.data.length) {
			ds2 = {data: [{name: undefined, values: [undefined]}]};
		}
		for (i = -1; ++i < ds2.data[0].values.length;) {
			ds2Cond = {};
			for (j = -1; ++j < ds2.data.length;) {
				mem = ds2.data[j].values[i];
				if (ds2.data[j].name) {
					ds2Cond[ds2.data[j].name] = mem;
				}
			}
			for (j = -1; ++j < cdata.length;) {
				for (m = -1; ++m < cdata[j].data.length;) {
					cdata[j].data[m].values.push([]);
				}
			}
			for (j = -1; ds1.data[0] && ++j < ds1.data[0].values.length; ) {
				ds1Cond = $.extend({}, ds2Cond);
				for (m = -1; ++m < ds1.data.length;) {
					mem = ds1.data[m].values[j];
					ds1Cond[ds1.data[m].name] = mem;
				}
				datum = _queryOne(table, ds1Cond, allFields);
				if (!datum) {
					console.warn("No data for: " + JSON.stringify(ds1Cond));
//					continue;
				}
				for (m = -1; ++m < cdata.length;) {
					for (n = -1; ++n < cdata[m].data.length;) {
                        var measure = cdata[m].data[n];
                        var idx = allFields.indexOf(measure.name);
                        var val = datum ? datum[idx] : undefined;
						measure.values[i].push(val);
					}
				}
			}
		}
		return cdata;
	}
	
	function _genCTData(chart) {
		var data = chart.data(),
			m = data.mapping,
			t = data.table,
			cdata = {
	 			"analysisAxis": [],
	 			"measureValuesGroup": []
	 		},
			genedData
			;
        //ds1
		genedData = _genDS(1, m.ds1, data.fields, t);
		cdata.analysisAxis.push(genedData);
        //ds2
		if (m.ds2 && m.ds2.length) {
			genedData = _genDS(2, m.ds2, data.fields, t);
			cdata.analysisAxis.push(genedData);
		}
        //mses
		genedData = _genMS(m, data.fields, t, cdata.analysisAxis[0], cdata.analysisAxis[1]);
		cdata.measureValuesGroup = genedData;
		return cdata;
	}
	
	function _genFTData(chart) {
		var data = chart.data(),
			m = data.mapping,
			t = data.table,
			fdata = {
	 			"metadata": {
					"fields": [],
					"summary": {}
				},
	 			"data": []
	 		},
			fields = fdata.metadata.fields
		;
		$.each([m.ds1, m.ds2], function(idx, ds) {
			$.each(ds, function(jdx, dim) {
				fields.push({
					id: dim,
					name: dim,
					semanticType: "Dimension",
					dataType: "String"
				});
			});
		});
		$.each([m.ms1, m.ms2, m.ms3], function(idx, ms) {
			$.each(ms, function(jdx, m) {
				fields.push({
					id: m,
					name: m,
					semanticType: "Measure"
				});
			});
		});
		$.each(t, function(idx, record) {
			var datum = [];
			$.each(fields, function(jdx, field) {
                var vpFieldIdx = data.fields.indexOf(field["id"]);
				datum.push(record[vpFieldIdx]);
			});
			fdata.data.push(datum);
		});
		return fdata;
	}
	
	function _genData(chart) {
		if (chart.useFlattenTable()) {
			return _genFTData(chart);
		} else {
			return _genCTData(chart);
		}
	}
	var _html = {};
	_html.generate = function(chart, template) {
		var code = template || _templates.whole;
		var libFilePath = _lib.filename(chart);
		var dataObject = _genData(chart);
		var dataStr = _util.addTab(_util.formatJSON(dataObject), 1);
		var dataCode = "var data = " + dataStr + ";\n";
		if (chart.useFlattenTable()) {
			dataCode += "var ds = new sap.viz.api.data.FlatTableDataset(data);";
		} else {
			dataCode +=	"var ds = new sap.viz.api.data.CrosstableDataset(); \n" +
						"ds.data(data);"
						;
		}
		dataCode = _util.addTab(dataCode, 4);
			
		//var ds = new sap.viz.api.data.CrosstableDataset();
		
		//lib file location
		var libName, libPathArr, baseUrl;
		libFilePath = libFilePath.substr(0, libFilePath.indexOf(".js"));
		libPathArr = libFilePath.split(".");
		libName = libPathArr[libPathArr.length - 1];
		baseUrl = "../bundles/" + libPathArr.join("/");
        code = code.replace('"%baseUrl%"', baseUrl);
        code = code.replace('"%libName%"', libName);
		//data
		code = code.replace(_util.regexsOfTag('data')[0], function(whole, tagLeft, content, tagRight) {
			return tagLeft + "\n" + dataCode + "\n\t\t\t\t" + tagRight;
		});
		code = code.replace('"%propertyCategory%"', chart.modules.plot.name);
		if(chart.useFlattenTable()){
		    code = code.replace(/\/\/%titleStart([\w\W]+)\/\%titleEnd/,'');
		    code = code.replace(/\/\/%legendStart([\w\W]+)\/\%legendEnd/,'');
		}
		if(chart.title()){
		    code = code.replace('"%titleAlignment%"', chart.title().alignment?chart.title().alignment:'center');
		    code = code.replace(/\/\/%titleStart/,'');
		    code = code.replace(/\/\/%titleEnd/,'');
		}else{
		    code = code.replace(/\/\/%titleStart([\w\W]+)\/\%titleEnd/,'');
		}
		if(chart.legend()){
		    code = code.replace('"%legendDrawingEffect%"', chart.legend().drawingEffect?chart.legend().drawingEffect:'normal');
		    code = code.replace(/\/\/%legendStart/,'');
		    code = code.replace(/\/\/%legendEnd/,'');
		}else{
		    code = code.replace(/\/\/%legendStart([\w\W]+)\/\%legendEnd/,'');
		}
		//code of create chart instance
		code = code.replace(_util.regexsOfTag('create')[0], function(whole, tagLeft, content, tagRight) {
			return tagLeft + "\n" + _templates.create.replace('"%chartId%\"', chart.id) + "\n\t\t\t\t\t" + tagRight;
		});
		
		var templateTpl = "\t\t\t\tsap.viz.api.env.Resource.path(\"sap.viz.api.env.Template.loadPaths\", [\"" + 
						  "../bundles/" + libPathArr.join("/") + "/" + chart.id.split('.').join('_') + "-src/resources/templates\"]);\n" +
						  "\t\t\t\tsap.viz.api.env.Template.set(\"sample\", onTplLoad, onTplFail);";
						  
		code = code.replace(_util.regexsOfTag('template')[0], function(whole, tagLeft, content, tagRight) {
			return tagLeft + "\n" + templateTpl + "\n\t\t\t\t\t" + tagRight;
		}).replace(/\t/gm, "    ") //replace tab with 4 spaces
		;
		return code;
	};
	
	_html.filename = function(chart) {
		var id = chart.id.split("/").join(".");
		return "example-" + id + ".html";
	};
	
	return _html;
});
