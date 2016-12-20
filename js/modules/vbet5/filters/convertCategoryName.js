/* global VBET5 */
/**
 * @ngdoc filter
 * @name vbet5.filter:convertSetName
 * @description changes set name according to sport type
 *
 */
VBET5.filter('convertCategoryName', function () {
    'use strict';

       var replacements = {
                "All Games": "All Games"
        };
    return function (rawName, sportAlias) {
        if (replacements[sportAlias + rawName] !== undefined) {
            return replacements[sportAlias + rawName];
        }
        if (replacements[rawName] !== undefined) {
            return replacements[rawName];
        }
        return rawName;
    };
});

