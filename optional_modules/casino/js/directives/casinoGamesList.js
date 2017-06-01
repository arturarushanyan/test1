CASINO.directive('casinoGamesList', ['$rootScope', 'CConfig', function($rootScope, CConfig, $location, $window) {
    'use strict';

    return {
        restrict: 'E',
        replace: true,
        template: '<ng-include src="templateUrl"/>',
        scope: {
            isNewDesignEnabled: '=',
            gamesList: '=',
            myGames: '=',
            showConditions: '=',
            gameShowConditions: '=',
            gamesLimit: '=',
            selectedCategory: '=',
            showDeleteBtn: '=',
            useBigIcons: '=',
            gamesCount: '=',
            templateUrl: '@'
        },
        link: function(scope) {
            scope.cConf = {
                realModeEnabled: CConfig.main.realModeEnabled,
                iconsUrl: CConfig.cUrlPrefix + (scope.useBigIcons ? CConfig.bigIconsUrl :CConfig.iconsUrl),
                downloadEnabled: CConfig.main.downloadEnabled,
                newCasinoDesignEnabled: CConfig.main.newCasinoDesign.enabled,
                funModeEnabled: CConfig.main.funModeEnabled
            };
            scope.templateUrl = $rootScope.conf.casinoVersion !== 2 ? 'optional_modules/casino/templates/directive/casino-games-list.html' : 'optional_modules/casino/templates/directive/casino-new-games-list.html';
            scope.userOS = $rootScope.userOS;
            scope.openGame = function openGame(game, mode) {
                scope.$emit('casinoGamesList.openGame', {game: game, playMode: mode});
            };

            scope.toggleSaveToMyCasinoGames = function toggleSaveToMyCasinoGames(game) {
                scope.$emit('casinoGamesList.toggleSaveToMyCasinoGames', game);
            };

            scope.loadMoreGames = function loadMoreGames(category) {
                scope.$emit('casinoGamesList.loadMoreGames', category);
            };

            scope.isFromSaved = function isFromSaved(gameId) {
                var games = $rootScope.myCasinoGames   || [], i, j;
                for (i = 0, j = games.length; i < j; i += 1) {
                    if (games[i].id === gameId) {
                        return true;
                    }
                }
                return false;
            };
            scope.removeGameFromSaved = function removeGameFromSaved(gameId) {
                scope.$emit('game.removeGameFromMyCasinoGames',{id:gameId});
            };

            scope.$on("ifFavoriteCategoryEnable", function(event, message) {
                if (message === true) {
                    scope.favoriteCategoryGames = true;
                } else {
                    scope.favoriteCategoryGames = false
                }
            });

            scope.windowWidth = window.innerWidth;

            scope.calculateGameWidth = function () {    
                return Math.floor(( window.innerWidth - 42 ) / Math.floor(( window.innerWidth - 42 ) / 232 )) - 6;
            } 

            window.onresize = function () {
                scope.calculateGameWidth;
            }
        },
    };
}]);