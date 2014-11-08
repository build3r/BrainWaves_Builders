/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


define(['jquery'], function($) {
	function arr2Row(arr) {
		var fa = [];
		$.each(arr, function(idx, ele) {
			if (typeof ele === "string") {
				ele = '"' +  ele.replace(/"/gm, '\\"') + '"';
			}
			fa.push(ele);
		});
		return fa.join(",");
	}
	return {
		generate: function(chart) {
			var data = chart.data(),
				fields = data.fields,
				table = data.table,
				arr = []
				;
			arr.push(arr2Row(fields));
			$.each(table, function(idx, datum) {
				var vals = [];
				$.each(fields, function(jdx, f) {
					vals.push(datum[f]);
				});
				arr.push(arr2Row(vals));
			});
			return arr.join("\n");
		},
		filename: function() {
			return 'data.csv';
		}
	};
});