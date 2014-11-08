/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

define(['jquery', 
	'../util', 
	'../profile',
	"./editor/popupEditor",
	"../gen/lib",
	"../gen/html",
	"../gen/css",
	"../gen/data",
	"../gen/template",
	"../gen/feature",
	"../initIntro"
], function($, _util, _profile, _popupEditor, _genLib, _genHtml, _genCSS, _genData, _template, _genFeature, _initIntro) {
	var _ = {};
	_.init = function() {
		/*download*/		
		//download js code
//		_util.attachDownloadFeature($("#downloadCode"), function(cb) {
//			var code = _popupEditor.code();
//			_profile.code(code);
//			var chart = _profile.currentChart();
//			var code = _profile.code().js;// _genLib.generate(chart);
//			var blob = new Blob([ code ], {
//				type : "text/plain"
//			});
//			cb(_genLib.filename(chart), blob);
//		});
		//download extension zip
		_util.attachDownloadFeature($("#downloadZip"), function(cb) {
			var code = _popupEditor.code();
			_profile.code(code);
			//zip file
			zip.useWebWorkers = false;
			zip.fs.FS();
			var dir = zip.fs.root,
				chart = _profile.currentChart(),
                code = _profile.code(),
				egCode = code.html,// _genHtml.generate(chart),
				egBlob =  new Blob([ egCode ], { type : "text/plain" }),				

//				dataCSV = _genData.generate(chart),
//				dataBlob = new Blob([dataCSV], {type:"text/plain"}),
				
				bundleCode = code.bundle.replace(/\/\*<<bundle_immutable\*\/\n/gm, "").replace(/\n\/\*bundle_immutable>>\*\//gm, ""),
				bundleBlob = new Blob([ bundleCode ], { type : "text/plain" }),
				moduleCode = code.module,
				moduleBlob = new Blob([ moduleCode ], { type : "text/plain" }),	
				flowCode = code.flow,
				flowBlob = new Blob([ flowCode ], { type : "text/plain" }),	
				renderCode = code.render,
				renderBlob = new Blob([ renderCode ], { type : "text/plain" }),	
				dataMappingCode = code.dataMapping,
				dataMappingBlob = new Blob([ dataMappingCode ], { type : "text/plain" }),
				utilCode = code.util,
				utilBlob = new Blob([ utilCode ], { type : "text/plain" }),
				
				libFullName = _genLib.filename(chart),
				libName, libPackage, currentPackage, sampleTplCode, sampleTplBlob;
			
			dir.addBlob("examples/"+ _genHtml.filename(chart), egBlob);

			// generate package folder structure
			libFullName = libFullName.substr(0, libFullName.indexOf(".js"));
			libPackage = libFullName.split(".");
			libName = libPackage[libPackage.length - 1];
			
			var featuresPath = "features/" + libPackage.join('/') + "/";
			var bundlesPath = "bundles/" + libPackage.join('/') + "/";
			
			// add feature.json
			var featureBlob = new Blob([ _genFeature.generate(chart) ], { type : "text/plain" });
			dir.addBlob(featuresPath + _genFeature.filename(chart), featureBlob);
			
			// add bundle.js
			dir.addBlob(bundlesPath + libName + "-bundle.js", bundleBlob);
			var srcPath = bundlesPath + chart.id.split('.').join('_') + "-src" + "/";

			// add JS files
			dir.addBlob(srcPath + "js/module.js", moduleBlob);
			dir.addBlob(srcPath + "js/flow.js", flowBlob);
			dir.addBlob(srcPath + "js/render.js", renderBlob);
			dir.addBlob(srcPath + "js/dataMapping.js", dataMappingBlob);
			dir.addBlob(srcPath + "js/utils/util.js", utilBlob);
			
			// add template
			sampleTplCode = _template.generate(chart);
			sampleTplBlob = new Blob([sampleTplCode], {type:"text/plain"});
			dir.addBlob(srcPath + "resources/templates/sample/" + _template.filename(chart), sampleTplBlob);

			//add CSS file
			var cssCode = code.css;
			var cssBlob = new Blob([ cssCode ], { type : "text/plain" });
			dir.addBlob(srcPath + "style/" + _genCSS.filename(chart), cssBlob);
			
			dir.exportBlob(function(zippedBlob){
				var zipname = _genLib.zipName(chart);
				cb(zipname, zippedBlob);	
			});
		});
		//change download link title
		var hasDetails = false;
		$("#dialogPack").on("show", function(e){
			var chart = _profile.currentChart();
		//	$("#downloadCode").text(_genLib.filename(chart));
			$("#downloadZip").text(_genLib.zipName(chart));
			$("#showDetails")[0].src = "libs/vizPacker/resources/btnDrillDown.png";
			$("#packDetails").css("display", "none");
			hasDetails = false;
		});
		$("#showInNewWin").click(function(){
			var code = _profile.code().bundle;// _genLib.generate(_profile.currentChart());
			var uriContent = "data:application/octet-stream," + encodeURIComponent(code);
			window.open(uriContent, _profile.plot().id + ".js");
		});
		//show details
		$("#showDetails").click(function(){
			if (!hasDetails) {
				$("#packDetails").css("display", "block");
				this.src = "libs/vizPacker/resources/btnDrillUp.png";
			} else {
				$("#packDetails").css("display", "none");
				this.src = "libs/vizPacker/resources/btnDrillDown.png";
			}
			hasDetails = !hasDetails;
		});
		/*profile*/
		//save profile
		_util.attachDownloadFeature($(".vp-tb-btn-save"), function(cb) {
			var codeInEditor = _popupEditor.code();
			_profile.code(codeInEditor);
			var code = _util.formatJSON(_profile.save());
			var blob = new Blob([ code ], {
				type : "text/plain"
			});			
			var prefix = _genLib.filename(_profile.currentChart()),
				idx = prefix.lastIndexOf(".");
			if (idx >= 0) prefix = prefix.substring(0, idx);
			var filename = prefix + ".profile";
			cb(filename, blob);
		});
		//load profile
		$(".vp-tb-btn-load").on("change", function(e) {
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = (function(f){
				return function(e) {
					var str = e.target.result;
//					console.log("start loading: \n" + str);
					var po = JSON.parse(str);
					_profile.load(po);
//					console.log("loaded." );
				};
			})(file);
			reader.readAsText(file);
		});
		
		$(".vp-tb-btn-tour").click(function() {
		    $('#chooseZone').hide();
		});

		//show tour
		$("#btnStartTutorial").click(function(){
			$("#dialogStartTutorial").modal("hide");
			
			// set Flag to record user's choice in localStorage
			var checkbox = $('#chooseCheckbox')[0];
            if (checkbox.checked) {
                window.localStorage.setItem('_VIZPACKERFIRSTTIMESHOW','false');
            }
            else {
                window.localStorage.setItem('_VIZPACKERFIRSTTIMESHOW', 'true');
            }
            
			setTimeout(function(){
				_initIntro.startIntro();
			}, 500);
			
		});
		$("#btnEndTutorial").click(function() {
		    $("#dialogEndTutorial").modal("hide");
		});
	};
	
	$('#startRemove').click(function() {
	       // set Flag to record user's choice in localStorage
           var checkbox = $('#chooseCheckbox')[0];
           if (checkbox.checked) {
               window.localStorage.setItem('_VIZPACKERFIRSTTIMESHOW','false');
           }
           else {
               window.localStorage.setItem('_VIZPACKERFIRSTTIMESHOW', 'true');
           }
	});
	return _;
});