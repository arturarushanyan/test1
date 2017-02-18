angular.module('vbet5').config(['$routeProvider', '$anchorScrollProvider', 'SkinConfig', 'Config', function ($routeProvider, $anchorScrollProvider, SkinConfig, Config) {
    'use strict';

    $anchorScrollProvider.disableAutoScrolling();

    function getTemplate(path) {
        if (SkinConfig.customTemplates && SkinConfig.customTemplates.indexOf(path.substr(10)) !== -1) { // substr's "10" param is the length of "templates/"
            return "skins/" + SkinConfig.main.skin + "/" + path;
        }
        return path;
    }

    $routeProvider
//        .when('/:page/', {
//            templateUrl: function (params) { return 'templates/' + params.page + '/main.html'; }
//        })
        .when('/about/:section?', {
            templateUrl: getTemplate('templates/about/main.html'),
            reloadOnSearch: false
        })
        .when('/sb/', {
            templateUrl: getTemplate('templates/external/sportsbook.html'),
            reloadOnSearch: false
        })
        .when('/sport/', {
            templateUrl: getTemplate('templates/sport/main.html'),
            reloadOnSearch: false
        })
        .when('/overview/', {
            templateUrl: function () {
                if (Config.main.sportsLayout == 'combo') {
                    return getTemplate('optional_modules/comboView/templates/main.html')
                }

                return getTemplate('templates/sport/overview/main.html');
            },
            reloadOnSearch: false
        })
        .when('/multiview/', {
            templateUrl: function () {
                if (Config.main.sportsLayout === 'euro2016') {
                    return getTemplate('templates/sport/main.html');
                } else {
                    return getTemplate('templates/sport/multiview/main.html');
                }
            },
            reloadOnSearch: false
        })
        .when('/dashboard/', {
            templateUrl: function () {
                if (Config.main.sportsLayout === 'euro2016') {
                    return getTemplate('templates/sport/main.html');
                } else {
                    return getTemplate('templates/sport/dashboard/main.html');
                }
            },
            reloadOnSearch: false
        }).when('/statistics/', {
            templateUrl: getTemplate('templates/sport/statistics/main.html'),
            reloadOnSearch: false
        })
        .when('/customsport/:section/', {
            templateUrl: getTemplate('templates/sport/main.html'),
            reloadOnSearch: false
        })
        .when('/virtualsports/', {
            templateUrl: getTemplate('templates/sport/virtualsportseastern.html'),
            reloadOnSearch: false
        })
        .when('/poolbetting/', {
            templateUrl: getTemplate('templates/sport/main.html'),
            reloadOnSearch: false
        })
        .when('/freebet/', {
            templateUrl: getTemplate('templates/freebet/main.html'),
            reloadOnSearch: false
        })
        .when('/page/:slug', {
            templateUrl: getTemplate('templates/pages/main.html')
        })
        .when('/section/:slug', {
            templateUrl: getTemplate('templates/section/main.html')
        })
        .when('/casino/', {
            templateUrl: getTemplate('optional_modules/casino/templates/' + (SkinConfig.main.casinoVersion === 2 ? 'version_2/' : '') + 'main.html'),
            reloadOnSearch: false
        })
        .when('/poker/', {
            templateUrl: getTemplate('templates/poker/main.html'),
            reloadOnSearch: false
        })
        .when('/promos/', {
            templateUrl: getTemplate('templates/promos/main.html'),
            reloadOnSearch: false
        })
        .when('/promonews/', {
            templateUrl: getTemplate('templates/promos/promonews.html'),
            reloadOnSearch: false
        })
        .when('/first_deposit_bonus/', {
            templateUrl: getTemplate('templates/promos/firstDepositBonusPromo.html'),
            reloadOnSearch: false
        })
        .when('/livedealer/', {
            templateUrl: getTemplate('optional_modules/casino/templates/livedealer/' + (SkinConfig.main.casinoVersion === 2 ? 'version_2/' : '') + 'main.html'),
            reloadOnSearch: false
        })
        .when('/keno/', {
            templateUrl: getTemplate('optional_modules/casino/templates/livedealer/keno.html'),
            reloadOnSearch: false
        })
        .when('/fantasy/', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/fantasy.html'),
            reloadOnSearch: false
        })
        .when('/ogwil/', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/ogwil.html'),
            reloadOnSearch: false
        })
        .when('/poker/:type?', {
            templateUrl: getTemplate('optional_modules/casino/templates/poker/main.html'),
            reloadOnSearch: false
        })
        .when('/belote/', {
            templateUrl: getTemplate('optional_modules/casino/templates/belote/main.html'),
            reloadOnSearch: false
        })
        .when('/backgammon/', {
            templateUrl: getTemplate('optional_modules/casino/templates/backgammon/main.html'),
            reloadOnSearch: false
        })
        .when('/pokerklas/', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/pokerklas.html'),
            reloadOnSearch: false
        })
        .when('/iphone/', {
            templateUrl: getTemplate('templates/golg/main.html'),
            reloadOnSearch: false
        })
        .when('/lottery/', {
            templateUrl: getTemplate('templates/lottery/main.html'),
            reloadOnSearch: false
        })
        .when('/affiliate/', {
            templateUrl: getTemplate('templates/affiliate/main.html'),
            reloadOnSearch: false
        })
        .when('/landing/', {
            templateUrl: getTemplate('templates/landing/main.html'),
            reloadOnSearch: false
        })
        .when('/free_winners/', {
            templateUrl: getTemplate('templates/free/main.html'),
            reloadOnSearch: false
        })
        .when('/winners/', {
            templateUrl: getTemplate('templates/pages/winners.html'),
            reloadOnSearch: false
        })
        .when('/games/', {
            templateUrl: getTemplate('optional_modules/casino/templates/skillgames/' + (SkinConfig.main.casinoVersion === 2 ? 'version_2/' : '') + 'main.html'),
            reloadOnSearch: false
        })
        .when('/game/:slug/provider/:slug/exid/:slug', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/specialgame.html'),
            reloadOnSearch: false
        })
        .when('/jackpot/', {
            templateUrl: getTemplate('optional_modules/casino/templates/jackpot/main.html'),
            reloadOnSearch: false
        })
        .when('/financials/', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/financials.html'),
            reloadOnSearch: false
        })
        .when('/', {
            templateUrl: getTemplate('templates/homepage/main.html'),
            reloadOnSearch: false
        })
        .when('/popup/', {
            templateUrl: getTemplate('templates/popup/main.html'),
            reloadOnSearch: true
        })
        .when('/news/', {
            templateUrl: getTemplate('templates/news/main.html'),
            reloadOnSearch: false
        })
        .when('/livecalendar/', {
            templateUrl: function () {
                if (Config.main.sportsLayout === 'euro2016') {
                    return getTemplate('templates/sport/main.html');
                } else {
                    return getTemplate('templates/livecalendar/main.html');
                }
            },
            reloadOnSearch: false
        })
        .when('/results/', {
            templateUrl: getTemplate('templates/results/main.html'),
            reloadOnSearch: false
        })
        .when('/mobile/', {
            templateUrl: getTemplate('templates/mobile/main.html'),
            reloadOnSearch: false
        })
        .when('/apppokerist/', {
            templateUrl: getTemplate('optional_modules/casino/templates/specialgames/apppokerist.html'),
            reloadOnSearch: false
        })
        .when('/widget/:widgetid', {
            templateUrl: getTemplate('templates/widget/main.html'),
            reloadOnSearch: false
        })
        .when('/europlayoff/:tabId?', {
            templateUrl: getTemplate('templates/sport/championship/euro2016/main.html'),
            reloadOnSearch: false
        })
        .when('/404/', {
            templateUrl: getTemplate('templates/pages/pageNotFound.html'),
            reloadOnSearch: false
        })
        .otherwise({
            redirectTo: '/sport/'
        })
        .when('/newaccount/', {
            templateUrl: getTemplate('templates/livebox/version_2/new_account_my_details.html'),
            reloadOnSearch: false
        })
        .when('/newaccount2/', {
            templateUrl: getTemplate('templates/livebox/version_2/new_account_documents.html'),
            reloadOnSearch: false
        });

}]);