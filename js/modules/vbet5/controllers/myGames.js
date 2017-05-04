/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:myGamesCtrl
 * @description
 *  "My games" controller.
 *  Responsible for managing and showing "my games" block.
 *  Games ids' list is kept in $rootScope.myGames
 *  and is syncronized with local storage on every update(adding or removing a game)
 */
VBET5.controller('myGamesCtrl', ['$scope', '$rootScope', '$location', '$route', 'Utils', 'Storage', 'ConnectionService', 'Zergling', 'Config', 'GameInfo', function ($scope, $rootScope, $location, $route, Utils, Storage, ConnectionService, Zergling, Config, GameInfo) {
    'use strict';

    $scope.myGamesloaded = false;
    $scope.offset = 0;
    $scope.allGamesCount = 0;
    $rootScope.leftMenuFavorites = [];

    var allGames, subId = null;
    var connectionService = new ConnectionService($scope);

    $rootScope.myGames = Storage.get('myGames') || [];
    $rootScope.myCompetitions = Storage.get('myCompetitions') || [];

    /**
     * @ngdoc method
     * @name getVisibleGames
     * @methodOf vbet5.controller:myGamesCtrl
     * @description Returns array of visible games
     *
     * @param {Array} games all "my games"
     * @returns {Array} visible games
     */
    function getVisibleGames(games) {
        return games.slice($scope.offset, $scope.offset + $scope.gamesToShow);
    }

    $scope.$on('widescreen.on', function () {
        $scope.gamesToShow = 4;
        $scope.games = allGames && getVisibleGames(allGames);
    });

    $scope.$on('widescreen.off', function () {
        $scope.gamesToShow = 3;
        $scope.games = allGames && getVisibleGames(allGames);
    });


    /**
     * @ngdoc method
     * @name updateMyGames
     * @methodOf vbet5.controller:myGamesCtrl
     * @description receives game data from swarm, modifies structure a little bit and sets needed scope variables
     *
     * @param {Object} data games data object
     */
    function updateMyGames(data) {
        console.log('favorite games from swarm', data);
        var games = [];
        angular.forEach(data.sport, function (sport) {
            angular.forEach(sport.region, function (region) {
                angular.forEach(region.competition, function (competition) {
                    angular.forEach(competition.game, function (game) {
                        game.sport = {id: sport.id, alias: sport.alias, name: sport.name};
                        game.competition = {id: competition.id, name: competition.name};
                        game.region = {id: region.id};
                        if (game.type === 1 && game.sport.alias === "Soccer") {
                            GameInfo.extendLiveGame(game);
                            GameInfo.generateTimeLineEvents(game, $scope);
                            if (game.live_events) { //need this for sorting
                                game.live_events.map(function (event) {
                                    event.add_info_order = parseInt(event.add_info, 10);
                                });
                            }
                        }
                        if (game.type === 1 && game.sport.alias === "HorseRacing") {
                            GameInfo.getHorseRaceInfo(game.info);
                        }
                        games.push(game);
                    });
                });
            });
        });
        games.sort(function (a, b) {return a.start_ts - b.start_ts; }); //sort by date
        // remove games that don't exist anymore by taking game ids from update (except those, which are already deleted from $rootScope.myGames)
        $rootScope.leftMenuFavorites = games;
        $rootScope.myGames = games.map(function (game) {return game.id; }).reduce(function (acc, curr) {if ($rootScope.myGames.indexOf(curr) !== -1) {acc.push(curr); }  return acc; }, []);

        Storage.set('myGames', $rootScope.myGames);
        allGames = games;
        $scope.allGamesCount = allGames.length;
        if ($scope.offset > 0 && $scope.offset + $scope.gamesToShow > $scope.allGamesCount) {
            $scope.offset--;
        }
        $scope.games = getVisibleGames(allGames);
        $scope.myGamesloaded = true;
    }

    $scope.framesCount = GameInfo.framesCount;

    /**
     * Get games from swarm to check if they still exist to know if "my games" button should be shown initially
     */
    function init() {
        if ($rootScope.myGames.length === 0) {
            console.log('no myGames to get');
            return;
        }
        Zergling
            .get({'source': 'betting', 'what': {'game': [], 'sport': ['id', 'alias', 'name'], 'competition': ['id', 'name'], 'region': ['id']}, 'where': {'game': {'id': {'@in': $rootScope.myGames }}}})
            .then(function (data) {
                updateMyGames(data.data);
            });
    }

    init();


    /**
     * @ngdoc method
     * @name slide
     * @methodOf vbet5.controller:myGamesCtrl
     * @description Slides visible games left or right by changing $scope's **offset** variable
     *
     * @param {String} direction direction, 'left' or 'right'
     */
    $scope.slide = function slide(direction) {
        if (direction === 'left') {
            if ($scope.offset > 0) {
                $scope.offset--;
            }
        } else if (direction === 'right') {
            if ($scope.offset < allGames.length - $scope.gamesToShow) {
                $scope.offset++;
            }
        }
        $scope.games = getVisibleGames(allGames);
    };


    /**
     * @ngdoc method
     * @name loadMyGames
     * @methodOf vbet5.controller:myGamesCtrl
     * @description Loads all games(having ids from $rootScope.myGames) and subscribes to updates
     *
     */
    function loadMyGames() {
        $scope.myGamesloaded = false;

        if (subId) {
            Zergling.unsubscribe(subId);
        }

        if (!$rootScope.myGames.length) {
            updateMyGames({"sport": {}});
            return;
        }

        connectionService.subscribe(
            {
                'source': 'betting',
                'what': {
                    'game': [],
                    'sport': ['id', 'alias', 'name'],
                    'competition': ['id', 'name'],
                    'region': ['id']
                },
                'where': {
                    'game': {
                        'id': {'@in': $rootScope.myGames }
                    }
                }
            },
            updateMyGames,
            {
                'thenCallback': function (response) {
                    subId = response.subid;
                    $scope.myGamesloaded = true;
                }
            }
        );
    }

    $rootScope.$on('myGames.load', loadMyGames);

    var myGamesWatcher = $rootScope.$watch('myGames.length', loadMyGames );
    $scope.$on('$destroy', function () {
        if (myGamesWatcher) {
            myGamesWatcher();
        }
    });

    $rootScope.$on('game.addToMyCompetition', function (event, competition) {
        if ($rootScope.myCompetitions === undefined) {
            $rootScope.myCompetitions = [];
        }
        if ($rootScope.myCompetitions.indexOf(competition.id) === -1) {
            competition.indexInMyCompetitions = 0;
            $rootScope.myCompetitions.push(competition.id);
        }

        Storage.set('myCompetitions', $rootScope.myCompetitions);
        loadMyGames();
    });


    $rootScope.$on('game.addToMyGames', function (event, game) {
        if (!$scope.myGamesloaded) {
            return;
        }
        if ($rootScope.myGames === undefined) {
            $rootScope.myGames = [];
        } else {
            if (angular.isArray(game)) {
                angular.forEach(game, function (value) {
                    if (Utils.isInArray($rootScope.myGames, value.id) < 0) {
                        value.indexInMyGames = 0;
                        $rootScope.myGames.push(value.id);
                    }
                });
            } else {
                if (Utils.isInArray($rootScope.myGames, game.id) < 0) {
                    game.indexInMyGames = 0;
                    $rootScope.myGames.push(game.id);
                }

            }
        }

        Storage.set('myGames', $rootScope.myGames);
    });

    $rootScope.$on('game.removeGameFromMyGames', function (event, game) {
        $scope.removeGameFromSaved(game);
    });

    $rootScope.$on('game.removeGameFromMyCompetition', function (event, competition) {
        $scope.removeGameFromMyCompetition(competition);
    });


    /**
     * @ngdoc method
     * @name removeFavoriteGame
     * @methodOf vbet5.controller:myGamesCtrl
     * @description $emit event to deleting game from myFavourites
     *
     * @param {Object} game game object
     */
    $scope.removeFavoriteGame = function (game) {
        $scope.$emit('game.removeGameFromMyGames', game);
        $scope.$emit('game.removeGameFromMyCompetition', game.competition);
    };

    /**
     * @ngdoc method
     * @name removeGameFromSaved
     * @methodOf vbet5.controller:myGamesCtrl
     * @description removes game from "my games" and updates scope and local storage
     *
     * @param {Object} game game object
     */
    $scope.removeGameFromSaved = function removeGameFromSaved(data) {
        console.log('game.addToMyGames', '$rootScope.myGames', $rootScope.myGames);
        if (!$scope.myGamesloaded) {
            return;
        }
        /**
         * remove from $rootScope and local storage
         * @param game
         */
        function removeGame(game) {
            var pos = $rootScope.myGames.indexOf(game.id);

            if (typeof game === 'object') {
                game.indexInMyGames = -1;
            }

            $rootScope.myGames.splice(pos, 1);
            Storage.set('myGames', $rootScope.myGames);
            if ($rootScope.myGames.length === 0) {
                if ($rootScope.myCasinoGames.length) {
                    $rootScope.env.sliderContent = 'casinoSavedGames';
                } else {
                    $rootScope.env.showSlider = false;
                    $rootScope.env.sliderContent = '';
                }
            }
        }

        if (angular.isArray(data)) {
            var i;
            for (i = 0; i < data.length; i++) {
                removeGame(data[i]);
            }
        } else {
            removeGame(data);
        }
    };

    /**
     * @ngdoc method
     * @name removeGameFromMyCompetition
     * @methodOf vbet5.controller:myGamesCtrl
     * @description removes competition from "my competitions" and updates scope and local storage
     *
     * @param {Array} || {String}
     */
    $scope.removeGameFromMyCompetition = function removeGameFromMyCompetition(competition) {
        function removeCompetition(competition) {
            var pos = $rootScope.myCompetitions.indexOf(competition);
            if (pos > -1) {
                $rootScope.myCompetitions.splice(pos, 1);

                Storage.set('myCompetitions', $rootScope.myCompetitions);

                if ($rootScope.myCompetitions.length !== 0) {
                    loadMyGames();
                }
            }
        }
        if (angular.isArray(competition)) {
            var i;
            for (i = 0; i < competition.length; i++) {
                removeCompetition(competition[i]);
            }
        } else {
            competition.indexInMyCompetitions = -1;
            removeCompetition(competition.id);
        }


    };



    /**
     * @ngdoc method
     * @name gotoGame
     * @methodOf vbet5.controller:myGamesCtrl
     * @description  Navigates to provided game
     *
     * @param {Object} game game object
     */
    $scope.gotoGame = function gotoGame(game) {
        console.log('my games gotoGame', game);
        $rootScope.env.sliderContent = '';
        $rootScope.env.showSlider = false;
        $location.search({
            'game' : game.id,
            'sport': (Config.main.showFavoriteGamesInSportList && Config.main.sportsLayout !== "classic" && Config.main.sportsLayout !== "combo") ? -1 : game.sport.id,
            'competition': game.competition.id,
            'type': game.type,
            'region': game.region.id
        });
        if ($location.path() !== '/sport/') {
            $location.path('/sport');
        } else {
            $route.reload();
        }
    };

}]);
