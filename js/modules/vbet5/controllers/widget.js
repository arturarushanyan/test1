/**
 * @ngdoc controller
 * @name vbet5.controller:widgetCtrl
 * @description
 * Custom widgets controller
 */
VBET5.controller('widgetCtrl', ['$scope', 'TimeoutWrapper', '$window', 'Config', 'ConnectionService', 'Zergling', 'Utils', function($scope, TimeoutWrapper, $window, Config, ConnectionService, Zergling, Utils) {
    'use strict';


    TimeoutWrapper = TimeoutWrapper($scope);
    var timer;
    var liveGamesSubId;
    var maxGamesCount = 5;
    var sliderDuration = 15000;
    var slideIndex = 0;
    var connectionService = new ConnectionService($scope);

    $scope.liveGames = [];
    $scope.newSlideAvailable = false;
    $scope.activeSlideGame = {};


    /**
     * @ngdoc method
     * @name continueSlide
     * @methodOf vbet5.controller:widgetCtrl
     * @description continues sliding to next games
     */
    $scope.continueSlide = function continueSlide() {
        if($scope.liveGames.length === 1) {
            return;
        }
        timer = TimeoutWrapper(function() {
            console.log('Widget Timeout', $scope.activeSlideGame.id);

            $scope.newSlideAvailable = false;
            $scope.widgetSlide('next');
        }, sliderDuration);

    }

    /**
     * @ngdoc method
     * @name loadRandomLiveGames
     * @methodOf vbet5.controller:widgetCtrl
     * @param {Number} gamesCount number of games to be loaded
     * @description loads random live games
     */
    function loadRandomLiveGames(gamesCount) {
        Zergling.get({
            'source': 'betting',
            'what': {
                'game':['id']
            },
            'where': {
                'sport': {
                    'alias': {
                        '@nin': 'Soccer'
                    }
                },
                'game': {
                    'type': 1
                }
            }
        })
        .then(function(response) {
            if(!response || !response.data) {
                return;
            }

            $scope.liveGames = $scope.liveGames.concat(Utils.objectToArray(response.data.game).slice(0,gamesCount));

            if($scope.liveGames.length) {
                loadGame($scope.liveGames[slideIndex].id);
            }

        })['catch'](function(reason) {
            console.log(reason);
        })
    }


    /**
     * @ngdoc method
     * @name loadSoccerLiveGames
     * @methodOf vbet5.controller:widgetCtrl
     * @description when no games pre selected from backend, load random live soccer games
     */
    function loadSoccerLiveGames() {
        Zergling.get({
            'source': 'betting',
            'what': {
                'game': ['id']
            },
            'where': {
                'sport':{'alias': {'@in': 'Soccer'}},
                'game': {'type': 1}
            }
        })
        .then(function(response) {
            if(!response || !response.data || !response.data.game) {
                return;
            }

            $scope.liveGames = Utils.objectToArray(response.data.game);

            if(!$scope.liveGames.length) {
                loadRandomLiveGames(maxGamesCount);
            } else {
                if($scope.liveGames.length < maxGamesCount) {
                    loadRandomLiveGames(maxGamesCount - $scope.liveGames.length);
                } else {
                    loadGame($scope.liveGames[slideIndex].id);
                }
            }

        })['catch'](function(reason) {
            console.log(reason);
        })
    }

     /**
     * @ngdoc method
     * @name loadGame
     * @methodOf vbet5.controller:widgetCtrl
     * @param {Number} gameId game id
     * @description checks if game is Live game
     */
    function loadGame(gameId) {
        Zergling.get({
            'source': 'betting',
            'what': {
                'game': ['id']
            },
            'where': {'game': {'id': gameId}}
        })
        .then(function(response) {
            if(response && response.data && response.data.game && !Utils.isObjectEmpty(response.data.game)) {
                $scope.activeSlideGame = Utils.objectToArray(response.data.game)[0];
                $scope.newSlideAvailable = true;
                $scope.continueSlide();

            } else {
                $scope.liveGames.splice(slideIndex,1);

                if(!$scope.liveGames.length) {
                    loadSoccerLiveGames();
                    return;
                }

                if(slideIndex === $scope.liveGames.length) {
                    slideIndex = 0;
                }

                loadGame($scope.liveGames[slideIndex].id);
            }
        })['catch'](function(reason) {
            console.log('live Widget catch',reason);
        });
    }


    /**
     * @ngdoc method
     * @name broadCastGameDetails
     * @methodOf vbet5.controller:widgetCtrl
     * @description handles game click
     * @param {Object} game
     */
    $scope.broadCastGameDetails = function broadCastGameDetails(game) {
        if(game) {
            $window.parent.postMessage(
                {
                    action: 'open_game',
                    data: {
                        gameId: game.id,
                        competitionId: game.competition.id,
                        regionId: game.region.id,
                        sportId: game.sport.id
                    }
                },
                '*'
            );
        } else {
            $window.parent.postMessage(
                {action: 'open_game', data: {gameId: $scope.activeSlideGame.id}}, 
                '*'
            );
        }
    };

    /**
     * @ngdoc method
     * @name pauseSlider
     * @methodOf vbet5.controller:widgetCtrl
     * @description name describes it all
     */
    $scope.pauseSlider = function pauseSlider() {
        TimeoutWrapper.cancel(timer);
    };

    /**
     * @ngdoc method
     * @name updateGame
     * @methodOf vbet5.controller:widgetCtrl
     * @description updates games list
     * @param {Array} games list of games
     */
    function updateGame(games) {
        if(!games || !games.length) {
            loadSoccerLiveGames();
            return;
        }

        $scope.liveGames = games;
        if(slideIndex >= games.length) {
            slideIndex = 0;
        }
        loadGame($scope.liveGames[slideIndex].id);
    }

    /**
    * @ngdoc method
    * @name getLiveGamesList
    * @methodOf vbet5.controller:widgetCtrl
    * @description subscribe for favorite/promoted games and load live games list when these games become live
    */
    $scope.getLiveGamesList = function getLiveGamesList() {
        if(!Config.main.loadLiveWidgetGamesFrom) {
            loadSoccerLiveGames();
            return;
        }

        var request = {
            'source': 'betting',
            'what': {
                'game': ['id', 'type']
            },
            'where': {
                'game': {'type': 1}
            }
        };

        request.where.game[Config.main.loadLiveWidgetGamesFrom.type] = {'@contains': parseInt(Config.main.site_id, 10)};

        connectionService.subscribe(
            request,
            updateGame,
            {
                'thenCallback': function (result) {
                    if(result.subid) {
                        liveGamesSubId = result.subid;
                    }
                }
            }
        );
    };

    /**
     * @ngdoc method
     * @name widgetSlide
     * @methodOf vbet5.controller:widgetCtrl
     * @description slides to next/previous slide
     * @param {String} direction prev/next direction to slide
     */
    $scope.widgetSlide = function widgetSlide(direction) {
        if (direction === 'prev') {
                slideIndex = slideIndex > 0 ? slideIndex-1 : $scope.liveGames.length-1;
        } else if(direction === 'next') {
                slideIndex = slideIndex < $scope.liveGames.length-1 ? slideIndex + 1 : 0;
        }
        TimeoutWrapper.cancel(timer);
        $scope.newSlideAvailable = false;
        loadGame($scope.liveGames[slideIndex].id);
    };


    $scope.$on('bet', function(event, data) {
        if(!data) {
            return;
        }

        $window.parent.postMessage({action: 'place_bet', data: data},'*');
    });

    $scope.$on('$routeChangeStart', function() {
        console.log('Timer Cancel');
        TimeoutWrapper.cancel(timer);

        if(liveGamesSubId) {
            Zergling.unsubscribe(liveGamesSubId);
        }

    });

}]);