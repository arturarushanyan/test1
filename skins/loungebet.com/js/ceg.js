angular.module('vbet5').run(function () {
    var cegScript = window.document.createElement('script');
    cegScript.type = 'text/javascript';
    cegScript.async = true;
    cegScript.src = 'https://2268f7ea3aac49a54df4.curacao-egaming.com/ceg-seal.js';
    var cegScript_s = window.document.getElementsByTagName('script')[0];
    cegScript_s.parentNode.insertBefore(cegScript, cegScript_s);
    setTimeout(function() {
        if (window.CEG) {
            window.CEG.init();
        }
    }, 3000);
});