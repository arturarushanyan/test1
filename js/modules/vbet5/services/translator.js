/* global VBET5 */
/**
 * @ngdoc service
 * @name vbet5.service:Translator
 * @description
 * Translator
 */
VBET5.factory('Translator', ['Config', 'Translations', function (Config, Translations) {
    'use strict';
    var Translator = {};

    var regExp = /\{(\d+)\}/g;

    /**
     * @ngdoc method
     * @name get
     * @methodOf vbet5.service:Translator
     * @description Translates string or returns it if no translation is available
     * @param {String} str string to translate
     * @param {Array} [placeholders] optional. values to put into placeholders ( {1}, {2}, etc..) in text
     * @param {String} [lang] optional. language to translate to. if not specified, taken from Config.env.lang
     * @returns {String} translated string
     */
    Translator.get = function get(str, placeholders, lang) {
        var ret;

        var d = (lang && Translations[lang]) || Translations[Config.env.lang];
        if (d instanceof Object && d.hasOwnProperty(str)) {
            ret = d[str];
        } else {
            ret = str;
        }

        if (placeholders && placeholders.length) {
            ret = ret.replace(regExp, function (match, number) {
                return placeholders[number - 1] !== undefined ? placeholders[number - 1] : match;
            });
        }

        if (Config.main.translateToDefaultIfNotAvailable && ret === str && lang !== Config.main.defaultTransLang) {
            return Translator.get(str, placeholders, Config.main.defaultTransLang);
        }
        return ret;
    };

    /**
     * @ngdoc method
     * @name translationExists
     * @methodOf vbet5.service:Translator
     * @description Returns true is the translation exists
     * @param {String} str string to translate
     * @param {String} [lang] optional. language to translate to. if not specified, taken from Config.env.lang
     * @returns {Boolean} returns true is the translation exists
     */
    Translator.translationExists = function translationExists(str, lang) {
        var d = (lang && Translations[lang]) || Translations[Config.env.lang];
        if (d instanceof Object && d.hasOwnProperty(str)) {
            return true;
        }
        return false;
    };

    return Translator;

}]);