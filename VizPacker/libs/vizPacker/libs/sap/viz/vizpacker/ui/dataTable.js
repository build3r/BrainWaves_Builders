define(['jquery', "../profile"], function($, profile) {
	var _measureIcon = "./libs/vizPacker/resources/iconMeasure.png";
	var _dimensionIcon = "./libs/vizPacker/resources/iconDimension.png";
	var _ = {};		
//	var _panel = $("#dataPanel");
	var _dt = $('#mainTabDataModel').find(".vp-dt-table");
	var _t = {}; //template
    var _delimiter = "*";
	_t.tbl = $("#dataPanel .vp-dt-table-template");
	_t.th = _t.tbl.find("th");
	_t.tr = _t.tbl.find("tbody > tr");
	_t.td = _t.tr.children("td");
	_t.tr.children("td").remove();
	
	var infos = {
			"vp-dt-upload-info":"Data table in csv (size < 20k) is supported here.",
			"vp-dt-table-info":"View the data table uploaded here and delete the column of data that's not needed.",
			"vp-dt-ds-info":"Two dimension sets are given for better grouping and easy binding to various modules. New dimension is put into set1 by default",
			"vp-dt-ms-info":"Three measure sets are pre-set here, and new measure is put into set 1 by default"
	};
    
    var _data; //same structure of data from profile.data();
	
	_.init = function() {
		//generate data table with fake data (default)
		loadDataFromProfile();


		/*events*/
		//flatten table switch
		$("#vpUseFlattenTable").change(function(e) {
			if (confirm("You're changing data model, all code changes you made will be lost, do you want to continue?")) {
				profile.useFlattenTable(this.checked);
			} else {
				this.checked = !this.checked;
			}
		});
		
		_dt.click(function(e){
			var jt = $(e.target);
			if (jt.hasClass("vp-dt-field-type-picker-button")) {//show type picker
				showTypePickerAt(e.target);
			} else if (jt.hasClass("vp-dt-field-remove")) {
				var th = jt.parents("TH"),
					idx = th.parent().children("TH").index(th)
					;
				th.remove();
				_dt.find("tbody > tr").each(function(i, tr) {
					$($(tr).children("td").get(idx)).remove();
				});
				removeField(idx);
				typePicker.slideUp();
			}
			e.preventDefault();
			return false;
		});

		//field type picker
		var typePicker = $(".vp-dt-field-type-picker");
		var dimensionRadios = document.dimensionSet.dimensionSetPicker;
		var measureRadios = document.measureSet.measureSetPicker;
		
		var columnDataTypeChangedTo = function(colIdx, targetType){
			var trs = _dt.find("tbody").children();
			$.each(trs, function(rowIdx, tr){
				var td = $(tr).children()[colIdx];
				if(targetType==='measure'){
					$(td).css('text-align','right');
				}else{
					$(td).css('text-align','');
				}
				
			});
		};
		
		var fieldAssignmentChanged = function(e){
            var fieldName = _data.fields[typePicker.fieldIndex];
            var setType,
                setIdx = parseInt(this.value);
            if(this.name==="dimensionSetPicker"){
                setType = "Dimension";
            } else {
                setType = "Measure";
            }
            _assignFieldToSet(fieldName, setType, setIdx);
            $(_dt.find("thead > th").get(typePicker.fieldIndex)).find('.vp-dt-field-type-icon').attr("src", setType === "Dimension" ? _dimensionIcon : _measureIcon);
            updateSummary();
            // typePicker.slideUp();
        };

        var typePickerSlideUp = function(){
            typePicker.slideUp();
        };

        $("body").on('click.hideTypePicker', typePickerSlideUp);

        typePicker.click(function(event) {
            event.stopPropagation();
        });

        $(dimensionRadios).on('change', fieldAssignmentChanged);
        $(measureRadios).on('change', fieldAssignmentChanged);
        $(dimensionRadios).on('click', typePickerSlideUp);
        $(measureRadios).on('click', typePickerSlideUp);

        var nameDblclick = {
            delay: 500,
            clicks: 0,
            timer: undefined,
            input: $("<input id='vpDTSetNameInput' type=text>"),
            appendInputTo: function(newParent) {
                var input = this.input,
                    oldParent = input.parent();
//                if (oldParent.length) {
//                    oldParent.text(input.val());
//                }
                this.addListeners();
                input.val(newParent.text());
                newParent.text("");
                input.appendTo(newParent);
                input.show();
            },
            hideInput: function() {
                var text = this.input.val();
                var oldParent = this.input.parent();
                oldParent.text(text);
                var id = oldParent.attr("viz-for");
                this.input.hide();
                this.input.appendTo("body");
                var radio = $("#" + id);
                var setType = radio.attr("name") === "dimensionSetPicker" ? "Dimension" : "Measure";
                var setIdx = parseInt(radio.val());
                var setId = _constructSetId(setType, setIdx);
                var setName = _constructSetName(setId);
                _data.mapping[setName] = text;
            },
            addListeners: function() {
                var me = this;
                me.input.on({
                    blur: function(e) {
                        me.hideInput();
                    },
                    keydown: function(e) {
                        if (e.keyCode === 13) {//return
                            me.hideInput();
                            e.preventDefault();
                            return false;
                        }
                    }
                });                
            }
        };

        $(".vp-dt-field-type-set-name").dblclick(function(e){
            e.preventDefault();
            return false;
        }).click(function(e){
            var $tgt = $(e.target);
            if (!$tgt.hasClass("vp-dt-field-type-set-name")) return;
            nameDblclick.clicks++;
            if (nameDblclick.clicks === 1) {
                nameDblclick.timer = setTimeout(function() {//single click handler
                    var radioId = $tgt.attr("viz-for");
                    $("#" + radioId).trigger("click");
                }, nameDblclick.delay);
            } else {
                clearTimeout(nameDblclick.timer);
                nameDblclick.clicks = 0;
                //double click handler
                nameDblclick.appendInputTo($tgt);
            }
            
        });
		typePicker.click(function(e){
            var $tgt = $(e.target);
			if($tgt.hasClass("vp-dt-submenu_indicator")/* && e.target.parentNode.tagName === "FORM"*/) {
                var menu = $tgt.parents(".vp-dt-field-type-picker-menu").find(".vp-dt-field-type-picker-submenu");
				if (menu.css("display") === 'none'){
					$('.vp-dt-field-type-picker-submenu').slideUp();
					$('.vp-dt-submenu_indicator').attr('src','./libs/vizPacker/resources/arrow-right.png');
					$tgt.attr('src',"./libs/vizPacker/resources/arrow-down.png");
					menu.slideDown();
				}
				else {
					$tgt.attr('src','./libs/vizPacker/resources/arrow-right.png');	
					menu.slideUp();
				}
//			}else if (e.target.tagName === 'FORM'){
//				$($($($(e.target.parentNode).find('.vp-dt-field-type-picker-submenu')).find('form')[0]).children()[0]).trigger('click');
//				typePicker.slideUp();
            } else if ($tgt.hasClass("vp-dt-field-type")) {
                $tgt.parents(".vp-dt-field-type-picker-menu").find(".vp-dt-field-type-picker-submenu input[type=radio]:first-child").trigger("click");
                typePicker.slideUp();
            } else if(e.target.tagName==="INPUT" || $tgt.hasClass("vp-dt-field-type-set-name")){
				return true;
			} else if($tgt.hasClass("vp-dt-info-btn")) {
                var $bubble = $('#vp-dt-info_bubble');
                if ($bubble.css('display') === "block") {
                    $bubble.css('display', 'none');
                } else {
                    var x = e.pageX, y = e.pageY;
                    var id = $tgt.attr('id');
                    $bubble.css('display', 'block');
                    $bubble.css({left: x + 8, top: y - 23});
                    $($bubble.children()[1]).text(infos[id]);
                }
                return false;
            }
			e.preventDefault();
			$('#vp-dt-info_bubble').css('display', 'none');
			return false;
		});
		
		typePicker.loadDataType = function(){
            $(measureRadios).attr('checked', false);
            $(dimensionRadios).attr('checked', false);
            //get set and its name
            var fieldName = _data.fields[typePicker.fieldIndex];
            var setInfo = _setInfo(fieldName),
                setIdx = setInfo.index, 
                setType = setInfo.type;
                setName = setInfo.name;
			if ( setType === 'Dimension'){
				var dimCurrentIndex = $(typePicker).find(".vp-dt-field-type-picker-cur-idx")[0];
				$(dimCurrentIndex).text("["+ setName +"]");
				$($(typePicker).find(".vp-dt-field-type-picker-cur-idx")[1]).text("");
				$(dimensionRadios[setIdx]).attr('checked', true);
			} else {// if ($(typePicker.currentTH).attr('dataType') === 'measure'){
				var measureCurrentIndex = $(typePicker).find(".vp-dt-field-type-picker-cur-idx")[1];
				$(measureCurrentIndex).text("["+setName+"]");
				$($(typePicker).find(".vp-dt-field-type-picker-cur-idx")[0]).text("");
				$(measureRadios[setIdx]).attr('checked', true);
			}
		};
		
		function showTypePickerAt(target) {
			typePicker.fieldIndex = $(target.parentNode.parentNode).children().index(target.parentNode);
			var offset = $(target).offset();
			typePicker.css({
				left: target.x - 20 + "px",
				top: (target.y + $(target).height() + 4) + "px"
			});
			typePicker.loadDataType();
			$(typePicker).find('.vp-dt-field-type-picker-submenu').slideUp();
			$(".vp-dt-submenu_indicator").attr('src','./libs/vizPacker/resources/arrow-right.png');
			typePicker.slideDown();
			typePicker.css('z-index',999);
			$('#vp-dt-info_bubble').css('display', 'none');
		}

        $("#vp-dt-delimiter-selection").on('change', function(e) {
            if(this.value === "Other") {
                $("#vp-dt-delimiter-other-text").val("*");
                $("#vp-dt-delimiter-other-text").attr("disabled", false);
            } else {
                $("#vp-dt-delimiter-other-text").val("");
                $("#vp-dt-delimiter-other-text").attr("disabled", true);
            }
        });

        function getDelimiter() {
            var delimiterSel = $("#vp-dt-delimiter-selection").val();
            switch (delimiterSel) {
                case "Comma" : return ",";
                case "Tab" : return "\t";
                case "Semicolon" : return ";";
                case "Space" : return " ";
                default : return $("#vp-dt-delimiter-other-text").val();
            }
        }
        
		var readFile = function(file){
			var reader = new FileReader();
			reader.onload = (function(f){
				return function(e) {
					var str = e.target.result,
                        delimiter = getDelimiter(),
						csv = d3.dsv(delimiter, "text/plain").parseRows(str),
                        fields
						;
                    if( $('#vp-dt-load-first-row-header').attr('checked') === null ){
                        // load from csv and csv does not have header.
                        var colLength = csv[0].length;
                        fields = [];
                        for(var i = 0; i < colLength; ++i){
                            fields.push('Column '+(i+1));
                        }
                    } else {
                        fields = csv[0];
                        csv = csv.slice(1);
                    }       
                    var data = {
                        fields: fields,
                        mapping: {
                            ds1: fields.slice(0),
                            ds2: [],
                            ms1: [],
                            ms2: [],
                            ms3: []
                        },
                        table: csv
                    };
                    profile.data(data);
                    _data = $.extend(true, {}, profile.data());
					_genTable();
					$(".vp-dt-load-text").val(f.name);
				};
			})(file);
			reader.readAsText(file);
		};
		//load from csv
		$(".vp-dt-load").on("change", function(e) {
			var file = e.target.files[0];
			readFile(file);
		});
		
		$(".vp-dt-load-text").click(function(e){
			$(".vp-dt-load").trigger('click');
		});
		$(".vp-dt-load-btn").click(function(e){
			var file = $(".vp-dt-load")[0].files[0];
			if(file){
				readFile(file);
			}else{
				$(".vp-dt-load").trigger('click');
			}
		});
		
		$("#mainTabDataModel").click(function(){
			$("#vp-dt-info_bubble").css('display','none');
			typePicker.slideUp();
		});	
		
		$("#vp-dt-apply-btn").click(function(){
		  if (confirm("You're changing feeds definition, the code changes you made in flow.js and HTML will be lost, do you want to continue?")) {
		    var data = $.extend(true, {}, _data);
            profile.data(data);
          }
		});

        $('.vp-dt-info-btn').on('mouseover', function(e) {
            var questionMark = e.target;
            var x = e.target.x, y = e.target.y, width = e.target.width, height = e.target.height;
            var id = $(e.target).attr('id');
            $('#vp-dt-info_bubble').css('display', 'block');
            $('#vp-dt-info_bubble').css({
                left : x+width + 8,
                top : y+height/2 - 23
            });
            $($('#vp-dt-info_bubble').children()[1]).text(infos[id]);
        });
        $('.vp-dt-info-btn').on('mouseout', function(e) {
            $('#vp-dt-info_bubble').css('display', 'none');
        });

		
		profile.on('profileloaded', loadDataFromProfile);
	};
    
    
    /////////////////////////////////////////////////////
    var _data;
    function _sementicType(name) {
        if (typeof name === 'number') {
            name = _data.fields[name];
        }
        var m = _data.mapping;
        var type = undefined;
        $.each(m, function(key, val) {
            if (val.indexOf && val.indexOf(name) >=0) {
                type = key === 'ds1' || key === 'ds2' ? 'Dimension' : 'Measure';
                return false;
            }
        });
        return type;
    }
    
    function _setInfo(name) {
        if (typeof name === 'number') {
            name = _data.fields[name];
        }
        var setIdx, setId, setName, setType;
        $.each(_data.mapping, function(key, val) {
            if (val instanceof Array) {
                var idx = val.indexOf(name);
                if (idx >= 0) {
                    switch(key) {
                        case "ds1":
                        case "ms1":
                            setIdx = 0;
                            break;
                        case "ds2":
                        case "ms2":
                            setIdx = 1;
                            break;
                        case "ms3": 
                            setIdx = 2;
                            break;
                    }
                    setId = key;
                    setName = _data.mapping[_constructSetName(key)];
                    setType = key === "ds1" || key === "ds2" ? "Dimension" : "Measure";
                    return false;
                }
            }
        });  
        return {index: setIdx, id: setId, name: setName, type:setType};
    }
    
    function _constructSetId(setType, setIdx) {
        return (setType === "Dimension" ? "ds" : "ms") + (setIdx + 1);
    }
    
    function _constructSetName(setId) {
        return setId + "Name";
    }
    
    function _assignFieldToSet(fieldName, setType, setIdx) {
        var info = _setInfo(fieldName);
        var m = _data.mapping;
        var idx = m[info.id].indexOf(fieldName);
        if (idx >= 0 ) {
            m[info.id].splice(idx,1);
        }
        var setId = _constructSetId(setType, setIdx);// (setType === "Dimension" ? "ds" : "ms") + (setIdx + 1);
        m[setId].push(fieldName);
    }
    
    function loadDataFromProfile() {
		document.getElementById("vpUseFlattenTable").checked = profile.useFlattenTable();
        _data = $.extend(true, {}, profile.data());


        _genTable();
    }
    
	function _genTable() {
		var _dth = _dt.find('thead');
		var _dtb = _dt.find("tbody");
        _dth.children().remove();
        _dtb.children().remove();
		$.each(_data.fields, function(idx, fname){
			_addField(fname);
		});
		_dtb.on('scroll', function(e){
			_dth.css('left', 0-_dtb[0].scrollLeft);
		});
		for (var i = 0; i < _data.table.length; i++) {
			_addRow(_data.table[i]);
		}
        updateSummary();
        //change sets' name
        var m = _data.mapping;
        $("#dimensionSet1Name").text(m.ds1Name);
        $("#dimensionSet2Name").text(m.ds2Name);
        $("#measureSet1Name").text(m.ms1Name);
        $("#measureSet2Name").text(m.ms2Name);
        $("#measureSet3Name").text(m.ms3Name);        
	}
	function _addField(fieldName, type, bindingInfo) {
		var thnew = _t.th.clone();
		var textPosition = thnew.find(".vp-dt-field-name");
		thnew.attr("title", fieldName);
		textPosition.text(fieldName);
		if( _sementicType(fieldName) === 'Measure'){
            thnew.find('.vp-dt-field-type-icon').attr("src", _measureIcon);
		}
		thnew.on('mouseover',function(e){
            $(this).find(".vp-dt-field-remove").show();
		}).on('mouseout', function(e){
            $(this).find(".vp-dt-field-remove").hide();
		});

		if (textPosition[0].innerHTML && textPosition[0].innerHTML.replace) {
            		textPosition[0].innerHTML = textPosition[0].innerHTML.replace(/\n/g, '<br>');
       		 };	
	
		_dt.find("thead").append(thnew);
		return thnew;
	}
	
	function _addRow(datum) {
		var trnew = _t.tr.clone()
			;
		_dt.find("th").each(function(idx, th) {
			var tdnew = _t.td.clone();
			if( _sementicType(_data.fields[idx]) === 'Measure'){
				tdnew.css('text-align', 'right');
			}
			
			tdnew.text(datum[idx]); 
			tdnew.attr("title", datum[idx]);
			if(tdnew[0].innerHTML&&tdnew[0].innerHTML.replace){
			   tdnew[0].innerHTML = tdnew[0].innerHTML.replace(/\n/g,'<br>'); 
			};
			
			trnew.append(tdnew);
		});
		_dt.find("tbody").append(trnew);
		return trnew;
	}
    
	var removeField = function(colIndex){
		//remove from data
        var name = _data.fields[colIndex];
        _data.fields.splice(colIndex, 1);
        $.each(_data.table, function(idx, row) {
            row.splice(colIndex, 1);
        });
        $.each(_data.mapping, function(key, val) {
            if (val instanceof Array) {
                var idx = val.indexOf(name);
                if (idx >= 0) {
                    val.splice(idx, 1);
                    return false;
                }
            }
        });
        updateSummary();
	};    
    
    
    function updateSummary() {
		$("#vp-dt-number-of-rows").text(_data.table.length);
		$("#vp-dt-number-of-dim").text( _data.mapping.ds1.length + _data.mapping.ds2.length );
		$("#vp-dt-number-of-measure").text( _data.mapping.ms1.length + _data.mapping.ms2.length + _data.mapping.ms3.length );
    }

    if (!$.isFunction(d3.dsv)) {
        d3.dsv = function d3_dsv(delimiter, mimeType) {
            var reParse = new RegExp("\r\n|[" + delimiter + "\r\n]", "g"),
                reFormat = new RegExp('["' + delimiter + "\n]"),
                delimiterCode = delimiter.charCodeAt(0);

            function dsv(url, callback) {
                d3.text(url, mimeType, function(text) {
                    callback(text && dsv.parse(text));
                });
            }
            dsv.parse = function(text) {
                var header;
                return dsv.parseRows(text, function(row, i) {
                    if (i) {
                        var o = {}, j = -1,
                            m = header.length;
                        while (++j < m) o[header[j]] = row[j];
                        return o;
                    } else {
                        header = row;
                        return null;
                    }
                });
            };
            dsv.parseRows = function(text, f) {
                var EOL = {}, EOF = {}, rows = [],
                    n = 0,
                    t, eol;
                reParse.lastIndex = 0;

                function token() {
                    if (reParse.lastIndex >= text.length) return EOF;
                    if (eol) {
                        eol = false;
                        return EOL;
                    }
                    var j = reParse.lastIndex;
                    if (text.charCodeAt(j) === 34) {
                        var i = j;
                        while (i++ < text.length) {
                            if (text.charCodeAt(i) === 34) {
                                if (text.charCodeAt(i + 1) !== 34) break;
                                i++;
                            }
                        }
                        reParse.lastIndex = i + 2;
                        var c = text.charCodeAt(i + 1);
                        if (c === 13) {
                            eol = true;
                            if (text.charCodeAt(i + 2) === 10) reParse.lastIndex++;
                        } else if (c === 10) {
                            eol = true;
                        }
                        return text.substring(j + 1, i).replace(/""/g, '"');
                    }
                    var m = reParse.exec(text);
                    if (m) {
                        eol = m[0].charCodeAt(0) !== delimiterCode;
                        return text.substring(j, m.index);
                    }
                    reParse.lastIndex = text.length;
                    return text.substring(j);
                }
                while ((t = token()) !== EOF) {
                    var a = [];
                    while (t !== EOL && t !== EOF) {
                        a.push(t);
                        t = token();
                    }
                    if (f && !(a = f(a, n++))) continue;
                    rows.push(a);
                }
                return rows;
            };
            dsv.format = function(rows) {
                return rows.map(formatRow).join("\n");
            };

            function formatRow(row) {
                return row.map(formatValue).join(delimiter);
            }

            function formatValue(text) {
                return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
            }
            return dsv;
        }
    }

	return _;
});
