define(["jquery"], function($){  
	
	var filePicker = $("#vp-editor-file-picker");
	
	filePicker.all = {
	        "flow.js" : "#tabEditorFlowJs",
	        "module.js" : "#tabEditorModuleJs",
	        "bundle.js" : "#tabEditorBundleJs",
	        "utils/util.js" : "#tabEditorUtilJs",
	        "style.css" : "#tabEditorCSS"
	 };
	
	filePicker.selectedFile = undefined;
	
	filePicker.listRestFiles = function() {
		this.reset();
		this.show();
		$(".candidateFile").click(function(e) {
			$(filePicker.all[$(filePicker.selectedFile).text()]).parent().hide();
			filePicker.selectFile(e);
			filePicker.hide();
			// add to the code editor
			$(filePicker.all[$(e.target).text()]).parent().show();
			$(filePicker.all[$(e.target).text()]).click();
		});
		$(".candidateFile").hover(function(e) {
			$(e.target).addClass("hoveredon");
		}, function(e) {
			$(e.target).removeClass("hoveredon");
		});
	};

    filePicker.selectFile = function(e) {
    	this.selectedFile = e.target;
    };

    filePicker.reset = function (e) {
    	this.empty();
        var ignoredFile;
        if (this.selectedFile !== undefined ) {
            ignoredFile = $(this.selectedFile).text();
        }
        for (var key in this.all) {
            if (key !== ignoredFile){
            	this.append("<li class='candidateFile'>" + key + "</li>");
            }
        };
    };
    
    return filePicker;
    
});