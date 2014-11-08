define([], function (){
    var _ = function() {
        var result = window.localStorage.getItem('_VIZPACKERFIRSTTIMESHOW');
        if (!result || result === 'true' ) {
            $('.vp-tb-btn-tour')[0].click();
            $('#chooseZone').show();
        }
    };
    
    return _;
});
