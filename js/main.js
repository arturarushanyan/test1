/**
 * Application bootstrapping
 * @ngdoc overview
 * @id index
 * @name index
 * @description <h1>the main application is 'app' which loads all needed modules</h1>
 */
var availableModules = ['vbet5', 'CMS', 'casino', 'exchange'].reduce(function (acc, curr) {
    'use strict';
    try {
        angular.module(curr);
        acc.push(curr);
    } catch (err) {
        console.log(err);
    }
    return acc;
}, []);
console.log("available modules:", availableModules);
angular.module('app', availableModules);

angular.module('app').config(['$compileProvider', function ($compileProvider) {
    'use strict';
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
}]);

(function () {
    'use strict';
    var initInjector = angular.injector(["ng"]);
    var $http = initInjector.get("$http");
    var runtimeConfig;

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(document.location.hash) || [, ""])[1].replace(/\+/g, '%20')) || null;
    }

    function getLocation(href) {
        var el = document.createElement("a");
        el.href = href;
        return el;
    }

    function getCurrentTimeRoundedByMinutes(mins) {
        var now = new Date();
        now.setMinutes((Math.round(now.getMinutes()/mins) * mins) % 60);
        now.setSeconds(0);
        now.setMilliseconds(0);
        return now.getTime().toString()
    }

    function loadRuntimeConfig() {
        var configUrlPrefix = "";
        if (getURLParameter('conf')) {
            configUrlPrefix = getURLParameter('conf');
        } else if (document.getElementById("app-config") && document.getElementById("app-config").getAttribute('data-config-url-path')) {
            configUrlPrefix = document.getElementById("app-config").getAttribute('data-config-url-path');
        }

        // allow config change only from these hosts (must be lowercase!)
        var ALLOWED_CONFIG_HOSTS = ["config.betconstruct.me","configs.betconstruct.me", "172.16.79.148", "cms.betconstruct.com"];

        if (ALLOWED_CONFIG_HOSTS.indexOf(getLocation(configUrlPrefix).host.toLowerCase()) === -1) {
            configUrlPrefix = '';
        }

        return $http.get(configUrlPrefix + "conf.json?" + getCurrentTimeRoundedByMinutes(5)).then(
            function (response) {
                runtimeConfig = response.data;
                angular.module("app").constant("RuntimeConfig", response.data);
            },
            function () {
                angular.module("app").constant("RuntimeConfig", {});
            }
        );
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce(function (prev, curr) { return curr.indexOf(name + "=") !== -1 ? curr.split("=")[1] : prev; }, null);
    }

    function getLocationParam(name) {
        var match = document.location.hash.match(new RegExp(name + "=([\\w\\-]+)"));
        return match ? match[1] : null;
    }

    function loadTranslations() {
        var defaultLanguage, availableLanguages;
        if (runtimeConfig && runtimeConfig.SkinConfig) {
            availableLanguages = runtimeConfig.SkinConfig.main && runtimeConfig.SkinConfig.main.availableLanguages;
            //  some skins have dependency by domain
            if (runtimeConfig.SkinConfig.main && runtimeConfig.SkinConfig.main.transLangByDomain && runtimeConfig.SkinConfig.main.transLangByDomain[document.location.host]) {
                defaultLanguage = runtimeConfig.SkinConfig.main.transLangByDomain[document.location.host];
            } else {
                defaultLanguage = runtimeConfig.SkinConfig.env && runtimeConfig.SkinConfig.env.lang;
            }
        }

        var lang = getLocationParam("lang") || getCookie('lang') || amplify.store('lang') || defaultLanguage || 'eng';
        // fix language in case it`s not present in the language list
        if (availableLanguages && !availableLanguages[lang]) {
            lang = defaultLanguage || 'eng';
        }

        var urlPrefix = "";

        if (getURLParameter('trans')) {
            urlPrefix = getURLParameter('trans');
        } else if (document.location.hostname.match(/staging.*\.int/)) {
            urlPrefix = "http://web.betconstruct.int/translations/app/get_language/" + runtimeConfig.SkinConfig.main.skin;
        } else if (document.getElementById("bc-main-js") && document.getElementById("bc-main-js").src) {
            var appLocation = getLocation(document.getElementById("bc-main-js").src);
            urlPrefix = (appLocation.protocol + "//" + appLocation.host + appLocation.pathname).replace("app.min.js", "");
        }
        var antiCacheDate = new Date(), antiCacheDateFormatted = antiCacheDate.getFullYear() + '-' + (antiCacheDate.getMonth() + 1) + '-' + antiCacheDate.getDate();
        var langUrl = urlPrefix + (urlPrefix.substr(-1) === '/' || !urlPrefix.length ? "" : "/") + "languages/" + lang + ".json?antiCache=" + antiCacheDateFormatted;
        console.log('loading language:', lang, langUrl);
        return $http.get(langUrl).then(
            function (response) {
                console.log('language load ok', response);
                angular.module('vbet5').constant('Translations', response.data);
            },
            function (response) {
                console.error('language load failed, error: ', response, " url: ", langUrl);
                angular.module('vbet5').constant('Translations', {});
            }
        );
    }

    function bootstrapApplication() {
        angular.element(document).ready(function () {
            angular.bootstrap(document, ["app"]);
        });
    }

    loadRuntimeConfig()['finally'](function () {
        loadTranslations()['finally'](bootstrapApplication);
    });

}());