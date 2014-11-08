define(function(){
    var _c = {};
    _c.moduleType = {
        title: "title",
        legend: "legend",
        plot: "plot"
    };
    _c.nameOfModuleType = function(type) {
        switch (type) {
            case this.moduleType.title:
                return "Title";
            case this.moduleType.legend:
                return "Legend";
            case this.moduleType.plot: 
                return "Plot Area";
        }
        return;
    };
    _c.dataTypeName = {
        dimensionName:['ds1','ds2'],
        measureName:['ms1','ms2','ms3']
    };
    return _c;
});