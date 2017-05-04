/**
 * @ngdoc directive
 * @name CASINO.directive:biggestWinners
 * @element ANY
 * @param {Number} initial-width initial width of target element
 *
 * @description Makes gets and updates list of biggest winners of casino
 */
CASINO.directive('casinoBiggestWinners', ['$rootScope', '$location', '$interval', 'CConfig', 'Zergling', 'Utils', 'casinoData', function ($rootScope, $location, $interval, CConfig, Zergling, Utils, casinoData) {
    'use strict';
    return {
        restrict: 'E',
        replace: true,
        template: '<ng-include src="templateUrl"/>',
        scope: {
            limit: '=',
            templateUrl: '@',
            title: '@'
        },
        link: function (scope) {
            var updateInterval;
            scope.activeTab = CConfig.main.biggestWinners.topWinners ? 'top' : 'last';
            scope.imagePath = CConfig.cUrlPrefix + CConfig.winnersIconsUrl;
            scope.biggestWinners = CConfig.main.biggestWinners;

            /**
             * @ngdoc method
             * @name changeTab
             * @description  changed request and showing content from 'Top Winners' to 'Last Winners' and vice versa
             */
            scope.changeTab = function changeTab(tabName) {
                if(scope.activeTab === tabName){ return; }

                scope.activeTab = tabName;
                scope.winners = '';
                $interval.cancel(updateInterval);
                if(scope.activeTab === 'last') {
                    updateInterval = $interval(getWinners, CConfig.main.biggestWinners.updateInterval || 10000);
                }
                getWinners();
            };

            /**
             * @ngdoc method
             * @name getWinners
             * @description  get winners data
             */
            function getWinners() {
                scope.winnersLoading = true;
                var command = (scope.activeTab === 'top') ? 'get_partner_last_big_wins' : 'get_partner_last_wins';
                var request = {
                    count: scope.limit || 5
                };
                Zergling.get(request, command).then(function (result) {  //  or get_partner_last_big_wins
                    if (result.details) {
                        scope.winners = Utils.objectToArray(result.details);
                    }
                })['catch'](function (reason) {
                    console.log('Error:'); console.log(reason);
                })['finally'](function () {
                    scope.winnersLoading = false;
                });
            }

            if(scope.activeTab === 'last') {
                updateInterval = $interval(getWinners, CConfig.main.biggestWinners.updateInterval || 15000);
            }
            getWinners();

            function openGame(game, gameType) {
                var page, pagePath;
                var gameId = $rootScope.conf.casinoVersion !== 2 ? game.gameID : game.front_game_id;
                if (gameId == CConfig.ogwil.gameID) {
                    if (gameType === 'real' && !$rootScope.env.authorized) {
                        $rootScope.$broadcast("openLoginForm");
                    } else {
                        $location.url('/ogwil/');
                    }
                    return;
                }
                if ($rootScope.conf.casinoVersion !== 2) {
                    switch (game.gameCategory) {
                        case CConfig.skillGames.categoryName:
                            page = 'games';
                            break;
                        case CConfig.liveCasino.categoryName:
                            page = 'livedealer';
                            break;
                        default:
                            page = 'casino';
                    }
                } else {
                    if (game.categories.indexOf(CConfig.skillGames.categoryId) !== -1) {
                        page = 'games';
                    } else if (game.categories.indexOf(CConfig.liveCasino.categoryId) !== -1) {
                        page = 'livedealer';
                    } else {
                        page = 'casino';
                    }
                }


                pagePath =  '/' + page + '/';
                if ($location.$$path === pagePath) {
                    $rootScope.$broadcast(page + '.openGame', game, gameType);
                } else {
                    var unregisterRouteChangeSuccess =  $rootScope.$on('$routeChangeSuccess', function () {

                        if (!$location.$$replace) {
                            $rootScope.$broadcast(page + '.openGame', game, gameType);
                            unregisterRouteChangeSuccess();
                        }
                    });

                    $location.url(pagePath);
                }

            }

            scope.openWinnerGame = function openWinnerGame (gameExternalId) {
                casinoData.getGames(null, null, null, null, null, null, null, [gameExternalId]).then(function(response) {
                    if(response && response.data && response.data.games) {
                        openGame(response.data.games[0], 'fun');
                    }
                });
            };

            /**
             * clear interval
             */
            scope.$on('$destroy', function () {
                $interval.cancel(updateInterval);
            });
        }
    };
}]);