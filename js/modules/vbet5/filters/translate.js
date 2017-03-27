/* global VBET5 */
/**
 * @ngdoc filter
 * @name vbet5.filter:translate
 * @description  translator filter
 *
 * uses {@link vbet5.service:Translator Translator service}   to translate
 *
 */
VBET5.filter('translate', ['Translator', function (Translator) {
    'use strict';
    return function (str, placeholders) {
        return Translator.get(str, placeholders);
    };
}]);