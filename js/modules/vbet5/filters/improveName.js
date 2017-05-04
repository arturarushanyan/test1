/* global VBET5 */
/**
 * @ngdoc filter
 * @name vbet5.filter:improveName
 * @description makes replacement in provided string using information from provided game
 * e.g. replaces "Team 1" with actual team name from game.team1_name
 *
 */
VBET5.filter('improveName', [ 'Config', function (Config) {
    'use strict';
    var cache = {},
        replacements = {
            'eng': {
                'Team 1': 'team1_name',
                'team 1': 'team1_name',
                'Team 2': 'team2_name',
                'team 2': 'team2_name',
                'W1': 'team1_name',
                'W2': 'team2_name',
                'Home': 'team1_name',
                'Away': 'team2_name'
            },
            'rus': {
                'Ком. 1': 'team1_name',
                'Ком1': 'team1_name',
                'Ком. 2': 'team2_name',
                'Ком2': 'team2_name',
                'П1': 'team1_name',
                'П2': 'team2_name',
                'W1': 'team1_name',
                'W2': 'team2_name',
                'Home': 'team1_name',
                'Away': 'team2_name'
            },
            'arm': {
                'Թիմ 1': 'team1_name',
                'Թիմ 2': 'team2_name',
                'Հ1': 'team1_name',
                'Հ2': 'team2_name'
            },
            'tur': {
                'G1': 'team1_name',
                'G2': 'team2_name',
                'Home': 'team1_name',
                'Away': 'team2_name'
            }
        },
        exactReplacements = {
//            '1' : 'team1_name',
            ' 1' : 'team1_name',
            '1 ' : 'team1_name',
//            '2' : 'team2_name',
            '2 ' : 'team2_name',
            ' 2' : 'team2_name'
        };

    return function (rawName, game) {
        if (!rawName) {
            return;
        }
        var cacheKey = rawName + (game && (game.id || ''));
        if (cache[cacheKey] === undefined) {
            cache[cacheKey] = rawName;
            var lang = replacements[Config.env.lang] === undefined ? 'eng' : Config.env.lang;
            if (exactReplacements[cache[cacheKey]]) {
                cache[cacheKey] = game[exactReplacements[cache[cacheKey]]];
            } else if (replacements[lang]) {
                angular.forEach(replacements[lang], function (fieldName, term) {
                    if (game && game[fieldName]) {
                        while ((game[fieldName].lastIndexOf(term) === -1) && (cache[cacheKey] != cache[cacheKey].replace(term, game[fieldName] + ' '))) {
                            cache[cacheKey] = cache[cacheKey].replace(term, game[fieldName] + ' ');
                        }
                    }
                });

            }
        }
        return cache[cacheKey];
    };
}]);