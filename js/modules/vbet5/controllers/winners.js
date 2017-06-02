VBET5.controller('mixedWinnersCtrl', ['$scope', '$rootScope', '$location', 'Zergling', 'Utils', 'CConfig', 'content', 'casinoData', function ($scope, $rootScope, $location, Zergling, Utils, CConfig, content, casinoData) {
    'use strict';
    $scope.casinoImagesPath = CConfig.cUrlPrefix + CConfig.winnersIconsUrl;
    $scope.winners = {
        sport: [],
        casino: []
    };
    $scope.winnersLoading = false;

    function initScope() {
        getPage('banner-favorite-game1', 'getWidget', 'topFavoriteData');
        getPage('banner-favorite-game2', 'getWidget', 'bottomFavoriteData');
        getPage('casino-biggest-wins', 'getPage', 'biggestWinsData');
    }

    /**
     * @ngdoc method
     * @name getBetWinners
     * @methodOf vbet5.controller:mixedWinnersCtrl
     * @description  get winners data
     */
    $scope.getBetWinners = function getBetWinners() {
        if (!$scope.winners.sport.length) {
            $scope.winnersLoading = true;
            var request = {};
            Zergling.get(request, 'get_biggest_winners').then(function (result) {
                // data can be in both cases
                if (result.details && result.details.bets && result.details.bets.bet) {
                    $scope.standardMode = true;
                    $scope.winners.sport = Utils.objectToArray(result.details.bets.bet);
                } else if (result.details && result.details.bets) {
                    $scope.standardMode = false;
                    $scope.winners.sport = Utils.objectToArray(result.details.bets);
                }

            })['catch'](function (reason) {
                console.log('Error:'); console.log(reason);
            })['finally'](function () {
                $scope.winnersLoading = false;
            });
        }
    };

    /**
     * @ngdoc method
     * @name getCasinoWinners
     * @methodOf vbet5.controller:mixedWinnersCtrl
     * @description  get winners data
     */
    $scope.getCasinoWinners = function getCasinoWinners() {
        if (!$scope.winners.casino.length) {
            $scope.winnersLoading = true;

            var request = {
                count: 10
            };
            Zergling.get(request, 'get_partner_last_big_wins').then(function (result) {
                if (result.details) {
                    $scope.winners.casino = Utils.objectToArray(result.details);
                    prepareCasinoWinners($scope.winners.casino);
                }
            })['catch'](function (reason) {
                console.log('Error:'); console.log(reason);
            })['finally'](function () {
                $scope.winnersLoading = false;
            });
        }
    };

    function getPage (slug, type, property) {
        content.getPage(slug, true).then(function (data) {
            if (type === 'getWidget') {
                $scope[property] = data && data.data && data.data.widgets && data.data.widgets[0] && data.data.widgets[0].instance;
            } else {
                $scope[property] = data && data.data && data.data.page && data.data.page.children && data.data.page.children[0];
            }
        });
    }

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

    };

    $scope.$on('winnerGame.open', function(event, gameExternalId) {
        casinoData.getGames(null, null, null, null, null, null, null, gameExternalId).then(function(response) {
            if(response && response.data) {
                openGame(response.data.games, 'fun');
            }
        });

    });



    initScope();
}]);
