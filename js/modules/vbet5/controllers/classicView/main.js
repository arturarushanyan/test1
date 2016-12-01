/**
 * @ngdoc controller
 * @name vbet5.controller:classicViewMainCtrl
 * @description
 * Classic mode view controller
 */
angular.module('vbet5.betting').controller('classicViewMainCtrl', ['$rootScope', '$scope', '$controller', 'Config', 'ConnectionService', 'Utils', '$filter', '$location', 'TimeoutWrapper', '$q', 'Storage', 'GameInfo', '$window', 'partner', 'Moment', function ($rootScope, $scope, $controller, Config, ConnectionService, Utils, $filter, $location, TimeoutWrapper, $q, Storage, GameInfo, $window, partner, Moment) {
    'use strict';

    TimeoutWrapper = TimeoutWrapper($scope);
    var connectionService = new ConnectionService($scope);

    $rootScope.footerMovable = true;

    angular.extend(this, $controller('classicViewCenterController', {
        $rootScope: $rootScope,
        $scope: $scope,
        TimeoutWrapper: TimeoutWrapper,
        $filter: $filter,
        $q: $q,
        Config: Config,
        Utils: Utils,
        Storage: Storage,
        GameInfo: GameInfo,
        partner: partner
    }));

    var todaysBetsSubsciptionSubIds = {}, todaysBetsSportsSubsciptionSubIds = {};
    var expandedSports = {0: {}, 1: {}}, expandedRegions = {0: {}, 1: {}}, liveVideoCondition = null;


    Config.env.liveStatsFlipMode = Storage.get('liveStatsFlipMode') ? 1 : 0;
    Config.env.preMatchMultiSelection = Storage.get('preMatchMultiSelection') === undefined ? Config.env.preMatchMultiSelection : Storage.get('preMatchMultiSelection');
    Config.env.hideLiveStats = Storage.get('hideLiveStats') || false;
    $scope.showStatsBlock = !Config.env.hideLiveStats;
    GameInfo.checkIfTimeFilterIsNeeded();
    $scope.hideVideoAndAnimationBox = false;
    $scope.isPopularGames = false;
    $scope.popularGamesLastState = false;
    $scope.showNewsBlock = !Config.betting.enableShowBetSettings;
    $scope.showNewsBetSet = true;
    $scope.marketFilterTypes = Config.main.GmsPlatform ? Config.main.marketFilterTypesGms : Config.main.marketFilterTypes;
    $scope.selectedMarketFilter = $scope.marketFilterTypes[0];
    $scope.competitionTimeGroupe = {};
    $scope.competitionNameGroupe = {};

    $scope.changeVolume = GameInfo.changeVolume;
    $scope.pinnedGames = {};
    $scope.enlargedGame = null;

    $scope.sportsbookAvailableViews = Utils.checkForAvailableSportsbookViews(Config);

    /**
     * @ngdoc method
     * @name newsDependBetSetting
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  show/hide News block, depend BetSetting
     */
    $scope.newsDependBetSetting = function () {
        $scope.showNewsBetSet = !$scope.showNewsBetSet;
    };

    /**
     * @ngdoc method
     * @name newsDependBetSlip
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  show/hide News block, depend BetSlip
     */
    $scope.newsDependBetSlip = function () {
        $scope.showNewsBlock = !$scope.showNewsBlock;
    };

    /**
     * @ngdoc method
     * @name toggleVideoAndAnimationBox
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  name says it all
     */
    $scope.toggleVideoAndAnimationBox = function toggleVideoAndAnimationBox() {
        $scope.hideVideoAndAnimationBox = !$scope.hideVideoAndAnimationBox;
    };

    /**
     * @ngdoc method
     * @name animationSoundOn
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  indicates the animation sound state
     */
    $scope.animationSoundOn = function animationSoundOn() {
        return $scope.openGame && !$scope.openGame.isAnimationMute && $scope.openGame.activeFieldType !== 'video' && Config.env.sound > 0 && !$scope.hideVideoAndAnimationBox && !$scope.isVideoDetached;
    };

    $rootScope.myGames = Storage.get('myGames') || [];

    // will be stored route params if there is, and will be loaded the view depend on this object
    $scope.userActivity = {0: {},1: {}};

    $scope.isInArray = Utils.isInArray;
    $scope.setSound = GameInfo.setSound;
    $scope.animationSoundsMap = GameInfo.animationSoundsMap;
    $scope.visibleSetsNumber = 5; // number of sets to be visible for multiset games

    /**
     * Today's Bets
     */
    $scope.toDay = Moment.get().unix();

    $scope.$on('leftMenu.closed', function (event, isClosed) {
        $scope.leftMenuClosed = isClosed;
    });

    $scope.$on('login.loggedOut', function() {
        if($scope.enlargedGame) {
            $scope.attachPinnedVideo($scope.enlargedGame, 'fullScreen');
        }
    });

    $scope.$on("leftmenu.virtualSportsSelected", function(event, value){ $scope.virtualSportsSelected = value; });
    $scope.$on("leftmenu.outrightSelected", function(event, value){ $scope.outrightSelected = value; });

    if (undefined === $location.search()) {
        Config.env.live = true;
        $location.search('type', 1);
    }

    /**
     * @ngdoc method
     * @name toggleLive
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description Toggles  live/pre-match
     *
     */
    function toggleLive() {
        if (Config.env.live) {
            $scope.popularGamesLastState = $scope.isPopularGames;
        } else if ($scope.popularGamesLastState) {
            $scope.loadPopularGames(true);
        }
    }

    $scope.$on('toggleLive', toggleLive);

    /**
     * @description selects live prematch tab from dashboard
     * @param type sport type live/prematch
     */
    $scope.selectSportTabFromDashboard = function selectSportTabFromDashboard(type) {
        $location.search('type', type);
        $location.path('/sport');
    }

    $scope.$on("leftMenu.gameClicked", function (event, data) {
        if ($location.path() === '/multiview/') {
            return;
        }

        $scope.openGameFullDetails(data.game, data.competition, false, true);
    });

    /**
     * @ngdoc method
     * @name getCustomSportAliasFilter
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description
     */
    $scope.getCustomSportAliasFilter = function getCustomSportAliasFilter() {
        var customSportAlias;
        for (customSportAlias in Config.main.customSportAliases) {
            if ($location.path() === '/customsport/' + customSportAlias + '/') {
                $scope.customSportAliasFilter = Config.main.customSportAliases[customSportAlias];
                return;
            }
        }
    };

    $scope.getCustomSportAliasFilter();

    $scope.$on('subscribeForTodaysBetsSports', subscribeForTodaysBetsSports);

    function updateTodaysBetsSportList (data, subId) {
        $scope.todaysBetsSports = Utils.objectToArray(data.sport);
        $scope.todaysBetsSports.sort(function (a, b) {
            return a.order - b.order;
        });
    };

    /**
     * @ngdoc method
     * @name subscribeForTodaysBetsSports
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description
     */
    function subscribeForTodaysBetsSports() {
        unsubscribeFromTodayBets();

        var startDay = 0, endDay = 1;
        if ($location.search().dayshift) {
            startDay = endDay = $location.search().dayshift;
            $location.search('dayshift', undefined);
        }

        var request = {
            'source': 'betting',
            'what': {'sport': ['id', 'name', 'alias', 'order'], 'game': '@count'},
            'where': {
                'game': {
                    'type': Config.main.GmsPlatform ? {'@in':[0,2]} : 0,
                    'start_ts': {
                        '@gte': Moment.get().add(startDay, 'days').startOf("day").unix(),
                        '@lt': Moment.get().add(endDay, 'days').endOf("day").unix()
                    }
                }

            }
        };
        request.where.game.not_in_sportsbook = 0;

        connectionService.subscribe(
            request,
            updateTodaysBetsSportList,
            {
                'thenCallback': function (result) {
                    if (result.subid) {
                        todaysBetsSportsSubsciptionSubIds[result.subid] = result.subid;
                    }

                    if (result.data) {
                        $scope.todaysBetsSelected = true;
                        $scope.expandTodaysBets($scope.todaysBetsSelectedSport || $scope.todaysBetsSports[0], startDay, endDay);
                    }
                }
            }
        );
    }

    /**
     * @ngdoc method
     * @name unsubscribeFromTodayBets
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description
     */
    function unsubscribeFromTodayBets() {
        connectionService.unsubscribe(todaysBetsSubsciptionSubIds);
        connectionService.unsubscribe(todaysBetsSportsSubsciptionSubIds);
    }

    /**
     * @ngdoc method
     * @name updatePrematchGames
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  Updates pre-mach games list (middle column)
     * @param {Object} data game data
     */
    function updatePrematchGames(data, subId) {
        $scope.prematchGameViewData = [];
        angular.forEach(data.sport, function (sport) {
            angular.forEach(sport.region, function (region) {
                angular.forEach(region.competition, function (competition) {
                    angular.forEach(competition.game, function (game) {
                        game.sport = {id: sport.id, alias: sport.alias, name: sport.name};
                        game.region = {id: region.id, name: region.name, alias: region.alias};
                        game.competition = {id: competition.id, order: competition.order};
                        game.firstMarket = $filter('firstElement')(game.market);
                        game.additionalEvents = Config.main.showEventsCountInMoreLink ? game.events_count : game.markets_count;
                        game.groupDate = Date.parse((moment(game.start_ts*1000).format("YYYY-MM-DD")))/1000;

                        $scope.showMarketsFilter = false;

                        if (game.sport.alias !== 'Soccer' && Config.main.enableMarketFiltering) {
                            $scope.selectedMarketFilter = $scope.marketFilterTypes[0];
                        }

                        if (Config.main.enableMarketFiltering && game.sport.alias === 'Soccer') {
                            $scope.showMarketsFilter = true;
                            game.filteredMarkets = Utils.groupByItemProperty(game.market, 'type');
                            angular.forEach($scope.marketFilterTypes, function (filter) {
                                var key = filter.type;
                                if (game.filteredMarkets && game.filteredMarkets[key]) {
                                    if (filter.base) {
                                        key = filter.type + filter.base;
                                        var events = Utils.groupByItemProperty(game.filteredMarkets[filter.type], 'base');
                                        if (!game.filteredMarkets[key]) {
                                            game.filteredMarkets[key] = {};
                                        }
                                        game.filteredMarkets[key].events = events[filter.base] ? Utils.objectToArray(events[filter.base][0].event) : '';
                                    } else if (game.filteredMarkets[key].length > 1 && game.filteredMarkets[key][0].base) {
                                        angular.forEach(game.filteredMarkets[key], function (market) {
                                            if (market.base === Utils.getDefaultSelectedMarketBase(game.filteredMarkets[key])) {
                                                game.filteredMarkets[key].events = Utils.objectToArray(market.event);
                                            }
                                        });

                                    } else {
                                        game.filteredMarkets[key].events = Utils.objectToArray(game.filteredMarkets[key][0].event);
                                    }
                                    if (game.filteredMarkets[key].events) {
                                        game.filteredMarkets[key].events.sort(function (a, b) {
                                            return a.order - b.order;
                                        });
                                        if (game.filteredMarkets[key].events.length === 2) {
                                            game.filteredMarkets[key].events.splice(1, 0, {});

                                        }
                                        angular.forEach(game.filteredMarkets[key].events, function (event) {
                                            event.name = $filter('improveName')(event.name, game);
                                        });
                                    }

                                }
                            });

                        } else if (game.firstMarket) {
                            game.firstMarket.events = Utils.createMapFromObjItems(game.firstMarket.event, 'type');
                            //if (Config.main.replaceP1P2WithTeamNames) {
                            angular.forEach(game.firstMarket.events, function (event) {
                                event.name = $filter('improveName')(event.name, game);
                            });
                            //}

                            if (!Config.main.showEventsCountInMoreLink) {
                                game.additionalEvents--;
                            } else {
                                game.additionalEvents -= $filter('count')(game.firstMarket.events);
                            }
                        }
                        //$scope.prematchGames.push(game);
                    });
                    competition.games = Utils.objectToArray(competition.game).sort(function (a, b) {
                        return a.start_ts - b.start_ts;
                    });
                    if(Config.main.sportsLayout === 'euro2016') {
                        competition.gamesGroupedByDate = Utils.groupByItemProperty(competition.games, 'groupDate');
                    }

                    if (!$location.search().game && $scope.selectedCompetition && competition.id === $scope.selectedCompetition.id) {expandFullGameDetails(competition);
                    }
                    $scope.prematchGameViewData.push(competition);
                });
            });
        });

        $scope.prematchGamesLoading = false;

        $scope.isPopularGamesLoadedFlag = true;
        if ($location.search().sport === -12 && !Utils.isObjectEmpty(data.sport))
        {
            $scope.$broadcast('topGamesAreLoaded');
        }


        //$scope.prematchGames.sort(function (a, b) { return a.start_ts - b.start_ts; }); //sort by game time
        //$scope.prematchGames.sort(function (a, b) { return a.competition.order - b.competition.order; });
    }

    /**
     * Select Competition - update route
     */
    //$scope.selectCompetition = function selectCompetition(competition, sport) {
    //    if (!$scope.selectedCompetition && !competition) {
    //        return;
    //    }
    //    $location.search('competition', competition ? competition.id : $scope.selectedCompetition.id);
    //    if (sport && sport.id) {
    //        $location.search('sport', sport.id);
    //    }
    //};

    $scope.selectGame = function (gameId) {
        var type = Number(Config.env.live);
        $location.search('game', gameId);
        $scope.userActivity[type].selectedGameId = gameId;
    };

    /**
     * @ngdoc method
     * @name expandFullGameDetails
     * @description automaticly expand game full detalis when we have game
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @param {object} competition competition
     */
    function expandFullGameDetails(competition) {
        console.log('expandFullGameDetails', competition);
        if (!competition.game) {
            return;
        }
        var games = Utils.objectToArray(competition.game);
        if (!games) {
            return;
        }
        var gameToOpen,
            type = Number(Config.env.live);

        var deepLinkedGameId = $location.search().game ? parseInt($location.search().game, 10) : null;
        if (deepLinkedGameId && Utils.getArrayObjectElementHavingFieldValue(games, 'id', deepLinkedGameId)) {
            gameToOpen = Utils.getArrayObjectElementHavingFieldValue(games, 'id', deepLinkedGameId);
        } else {
            gameToOpen = games[0];
        }
        if ((competition.expanded && gameToOpen.id !== $scope.userActivity[type].selectedGameId) || !$scope.openGame) {
            $scope.openGameFullDetails(gameToOpen, competition);
        }
    }

    $scope.loadPopularGames = function loadPopularGames() {
        if ($scope.isPopularGames) {
            $scope.resetPrematchMultiView(true);
            return;
        }

        $scope.resetPrematchMultiView(true);

        $scope.favoriteGameIsSelected = false;
        $scope.outrightSelected = false;
        $scope.favoriteTeamExpanded = false;

        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias'],
                'competition': ['id', 'order', 'name'],
                'region': ['id', 'name', 'alias'],
                game: [
                    ['id', 'start_ts', 'team1_name', 'team2_name', 'team1_external_id', 'team2_external_id', 'type',
                        'info', 'events_count', 'markets_count', 'extra', 'is_blocked', 'exclude_ids', 'is_stat_available', 'game_number', 'game_external_id', 'is_live']
                ],
                'event': ['id', 'price', 'type', 'name', 'order'],
                'market': ['type', 'express_id', 'name']
            },
            'where': {}
        };

        if (Config.env.gameTimeFilter) {
            request.where.game = {start_ts : Config.env.gameTimeFilter};
        }

        $scope.isPopularGames = false;

        if (Config.main.loadPopularGamesForSportsBook.type1x1) {
            request.where.event = {type: {'@in': ['P1', 'X', 'P2']}};
        }

        request.where[Config.main.loadPopularGamesForSportsBook.level] = {};
        request.where[Config.main.loadPopularGamesForSportsBook.level][Config.main.loadPopularGamesForSportsBook.type] = true;

        $scope.isPopularGames = true;
        $scope.prematchGamesLoading = true;
        $scope.favoriteTeamExpanded = false;

        Storage.set('isPopularGames', $scope.isPopularGames);

        request.where.game = request.where.game || {};
        request.where.game.not_in_sportsbook = 0;

        connectionService.subscribe(
            request,
            updatePrematchGames,
            {
                'thenCallback': function (result) {
                    $scope.$broadcast('popularGamesAreLoaded', result.data);
                },
                'failureCallback': function () {
                    $scope.prematchGamesLoading = false;
                }
            }
        );
    };

    $scope.resetPrematchMultiView = function resetPrematchMultiView() {
        $scope.isPopularGames = false;
        $scope.$parent.$broadcast('prematchMultiView.reset');
    };

    var prematchMultiViewGameIds;
    $scope.$on("prematchMultiView.games", function (event, games) {
        prematchMultiViewGameIds = [];
        angular.forEach(games, function (val, id) {
            if (val) {
                prematchMultiViewGameIds.push(parseInt(id, 10));
            }
        });
        $scope.loadPrematchMultiView();
    });

    $scope.$on("prematchMultiView.changeIsPopularGames", function (event, isPopularGames) {
        $scope.isPopularGames = isPopularGames;
    });

    $scope.loadPrematchMultiView = function loadPrematchMultiView() {
        $scope.favoriteGameIsSelected = false;
        $scope.favoriteTeamExpanded = false;

        var requestMarketTypes = ['P1P2'];
        angular.forEach($scope.marketFilterTypes, function (fType) {
            requestMarketTypes.push(fType.type);
        });


        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias'],
                'competition': ['id', 'order', 'name'],
                'region': ['id', 'name', 'alias'],
                game: [
                    ['id', 'start_ts', 'team1_name', 'team2_name', 'team1_external_id', 'team2_external_id', 'type',
                        'info', 'events_count', 'markets_count', 'extra', 'is_blocked', 'exclude_ids', 'is_stat_available', 'game_number', 'game_external_id', 'is_live']
                ],
                'event': ['id', 'price', 'type', 'name', 'order', 'base'],
                'market': ['type', 'express_id', 'name', 'base']
            },
            'where': {
                'game': {'type': Config.main.GmsPlatform ? {'@in': [0, 2]} : 0 , 'id': {'@in': prematchMultiViewGameIds}},
                'market': {'type': {'@in': requestMarketTypes}}
            }
        };

        if (Config.env.gameTimeFilter) {
            request.where.game.start_ts = Config.env.gameTimeFilter;
        }
        request.where.game.not_in_sportsbook = 0;
        connectionService.subscribe(
            request,
            updatePrematchGames,
            {
                'failureCallback': function () {
                    $scope.prematchGamesLoading = false;
                }
            }
        );
    };

    /**
     * @ngdoc method
     * @name openStatistics
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description
     * Opens statistics in popup window
     *
     * @param {Object} game game object
     */

    $scope.openStatistics = function openStatistics(game) {
        $window.open(GameInfo.getStatsLink(game), game.id, "width=940,height=600,resizable=yes");
    };

    $scope.$on('prematch.expandCompetition', function (event, data) {
        console.log('classicView: expandCompetition', event, data.competition, data.sport);
        $scope.expandCompetition(data.competition, data.sport);
    });

    $scope.$on('openTodayBets', function() {
        $scope.todaysBetsSelected = true;
    });

    /**
     * @ngdoc method
     * @name expandCompetition
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  updates open game data object
     *
     * @param {Object} competition competition object
     */
    $scope.expandCompetition = function expandCompetition(competition, sport) {
        $scope.todaysBetsSelected = false;
        $scope.favoriteTeamExpanded = false;
        $scope.isPopularGames = false;
        $scope.prevCompetition = [competition, sport];

        if (!competition || (Config.env.preMatchMultiSelection && !Config.env.live)) {
            return;
        }

        if (sport && !sport.isVirtualSport) {
            $scope.virtualSportsSelected = false;
        }

        $scope.selectedCompetition = competition;
        $scope.selectedSport = sport || $scope.selectedSport;
        $scope.selectedRegion = competition.region || $scope.selectedRegion;

        if (Config.env.live) {
            competition.expanded = !competition.expanded;
            // open game full detalis when we are in live mode
            expandFullGameDetails(competition);
        } else {
            $scope.favoriteGameIsSelected = false;
            if ($location.search().game && (!$scope.openGame || $scope.openGame.id !== Number($location.search().game))) { //open if deeplinked and different from now open
                $scope.openGameFullDetails({id: Number($location.search().game)});
            }

            $scope.prematchGamesLoading = true;
            $scope.favoriteTeamExpanded = false;
            var requestMarketTypes = ['P1P2'];
            angular.forEach($scope.marketFilterTypes, function (fType) {
                requestMarketTypes.push(fType.type);
            });

            var request = {
                'source': 'betting',
                'what': {
                    'sport': ['id', 'name', 'alias'],
                    'competition': ['id', 'name'],
                    'region': ['id', 'name', 'alias'],
                    game: [
                        ['id', 'start_ts', 'team1_name', 'team2_name', 'team1_external_id', 'team2_external_id','team1_id', 'team2_id', 'type', 'show_type', 'info', 'events_count', 'markets_count', 'extra', 'is_blocked', 'exclude_ids', 'is_stat_available', 'game_number', 'game_external_id', 'is_live']
                    ],
                    'event': ['id', 'price', 'type', 'name', 'order', 'base'],
                    'market': ['type', 'express_id', 'name', 'base']
                },
                'where': {
                    'competition': {'id': parseInt(competition.id, 10)},
                    'game': (Config.main.enableVisibleInPrematchGames && !Config.env.live ? {
                        '@or': ([{'type': Config.env.live ? 1 : Config.main.GmsPlatform ? {'@in':[0,2]} : 0}, {
                            'visible_in_prematch': 1,
                            'type': 1
                        }])
                    } : {'type': Config.env.live ? 1 : Config.main.GmsPlatform ? {'@in':[0,2]} : 0}),
                    'market': {'type': {'@in': requestMarketTypes}}
                }
            };

            if ($rootScope.myGames && $rootScope.myGames.length && Config.main.separateFavoritesInClassic) {
                request.where.game.id = {'@nin': $rootScope.myGames};
            }

            if ($scope.selectedUpcomingPeriod && !Config.env.live) {
                request.where.game.start_ts = {'@now': {'@gte': 0, '@lt': $scope.selectedUpcomingPeriod * 3600}};
            } else if (Config.env.gameTimeFilter) {
                request.where.game.start_ts = Config.env.gameTimeFilter;
            }

            request.where.game.not_in_sportsbook = 0;
            connectionService.subscribe(
                request,
                updatePrematchGames,
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            competition.gamesSubId = result.subid;
                        }
                    },
                    'failureCallback': function () {
                        $scope.prematchGamesLoading = false;
                    }
                }
            );

            unsubscribeFromTodayBets();
        }

        competition.active = !competition.active;
    };

    $scope.$on('prematch.expandFavoriteTeam', function (event, data) {
        $scope.expandFavoriteTeam(data.team);
    });

    /**
     * @ngdoc method
     * @name expandCompetition
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  updates open game data object
     *
     * @param {Object} team favorite team object
     */
    $scope.expandFavoriteTeam = function expandFavoriteTeam(team) {
        if (!team || (Config.env.preMatchMultiSelection && !Config.env.live)) {
            return;
        }

        $scope.virtualSportsSelected = false;
        $scope.favoriteTeamExpanded = true;
        $scope.prematchGamesLoading = true;

        var requestMarketTypes = ['P1P2'];
        angular.forEach($scope.marketFilterTypes, function (fType) {
            requestMarketTypes.push(fType.type);
        });

        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias'],
                'competition': ['id', 'name'],
                'region': ['id', 'name', 'alias'],
                game: [
                    ['id', 'start_ts', 'team1_name', 'team2_name', 'team1_external_id', 'team2_external_id', 'type', 'info', 'events_count', 'markets_count', 'extra', 'is_blocked', 'exclude_ids', 'is_stat_available', 'game_number', 'game_external_id', 'is_live']
                ],
                'event': ['id', 'price', 'type', 'name', 'order', 'base'],
                'market': ['type', 'express_id', 'name', 'base']
            },
            'where': {
                'game': {
                    '@or': [
                        {'team1_id': team.id},
                        {'team2_id': team.id}
                    ],
                    'type': Config.main.GmsPlatform ? {'@in':[0,2]} : 0
                },
                'market': {'type': {'@in': requestMarketTypes}}
            }
        };

        request.where.game.not_in_sportsbook = 0;
        connectionService.subscribe(
            request,
            updatePrematchGames,
            {
                'thenCallback': function (result) {
                    if (result.subid) {
                        team.gamesSubId = result.subid;
                    }
                },
                'failureCallback': function () {
                    $scope.prematchGamesLoading = false;
                }
            }
        );

        $scope.favoriteGameIsSelected = false;
        if ($location.search().game && (!$scope.openGame || $scope.openGame.id !== Number($location.search().game))) { 
            //open if deeplinked and different from now open
            $scope.openGameFullDetails({id: Number($location.search().game)});
        }
    };

    function updateTodaysBetsGames(data, subId) {
        updatePrematchGames(data);
        var prematchGameViewData = [];
        var first = true;

        if (subId) {
            todaysBetsSubsciptionSubIds[subId] = subId;
        }

        angular.forEach($scope.prematchGameViewData, function (competition) {
            if (first) {
                first = false;
                prematchGameViewData.push(competition);
                return 0;
            }
            prematchGameViewData[0].games = prematchGameViewData[0].games.concat(competition.games);
        });

        prematchGameViewData[0].games = prematchGameViewData[0].games.sort(function (a, b) {
            return a.start_ts - b.start_ts;
        });

        $scope.prematchGameViewData = prematchGameViewData;
    }

    /**
     * @ngdoc method
     * @name expandTodaysBets
     * @methodOf vbet5.controller:classicViewMainCtrl
     *
     * @param {Object} sport sport object
     */
    $scope.expandTodaysBets = function expandTodaysBets(sport, startDay, endDay) {
        if (!sport) {
            return;
        }

        $scope.todaysBetsSelectedSport = sport;
        $scope.prematchGamesLoading = true;
        $scope.favoriteTeamExpanded = false;

        if ($location.search().dayshift) {
            startDay = endDay = $location.search().dayshift;
            $location.search('dayshift', undefined);
        }

        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias', "order"],
                'region': ['id', 'name'],
                'competition': ['id'],
                game: [
                    ['id', 'start_ts', 'team1_name', 'team2_name', 'team1_external_id', 'team2_external_id', 'type', 'info', 'events_count', 'markets_count', 'extra', 'is_blocked', 'exclude_ids', 'is_stat_available', 'game_number', 'is_live']
                ],
                'market': ['type', 'express_id', 'name'],
                'event': ['id', 'price', 'type', 'name', 'order']
            },
            'where': {
                //'competition': {'id': parseInt(competition.id, 10)},
                "sport": {
                    "id": {"@in": [sport.id]}
                },
                'game': {
                    type: Config.main.GmsPlatform ? {'@in':[0,2]} : 0,
                    '@or': [{
                        start_ts: {
                            '@gte': Moment.get().add(startDay, 'days').startOf("day").unix(),
                            '@lt': Moment.get().add(endDay, 'days').endOf("day").unix()
                        }
                    }]
                },
                'market': {'type': {'@in': ['P1XP2', 'P1P2']}}
            }
        };

        request.where.game.not_in_sportsbook = 0;
        if ($rootScope.myGames && $rootScope.myGames.length && Config.main.separateFavoritesInClassic) {
            request.where.game.id = {'@nin': $rootScope.myGames};
        }

        connectionService.subscribe(
            request,
            updateTodaysBetsGames,
            {
                'failureCallback': function () {
                    $scope.prematchGamesLoading = false;
                }
            }
        );
    };

    /**
     * @ngdoc method
     * @name toggleGameFavorite
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  adds or removes(depending on if it's already there) game from 'my games' by emitting an event
     * @param {Object} game game object
     */
    $scope.toggleGameFavorite = function toggleGameFavorite(game) {
        $rootScope.$broadcast('game.toggleGameFavorite', game);
        console.log('$scope.favorites', $scope.favorites);
    };

    /**
     * @ngdoc method
     * @name detachVideo
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description called when video is detached. Sends game object to parent scope to show game video there
     *
     */
    $scope.detachVideo = function detachVideo(type) {
        $scope.pinnedGameType = type;
        $scope.isVideoDetached = true;

        if (!Config.main.defaultStreaming || !Config.main.defaultStreaming.enabled || $scope.openGame.tv_type !== Config.main.defaultStreaming.tvType) {
            $scope.openGame.video_data = null;
            GameInfo.getVideoData($scope.openGame);
        }

        if (type === 'dragable') {
            $scope.pinnedGames[$scope.openGame.id] = $scope.openGame;
        } else {
            $scope.enlargedGame = $scope.openGame;
            $scope.pinnedGames = {};
        }
    };

    /**
     * @ngdoc method
     * @name attachVideo
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description called when we get message from parent scope that detached video is reattached.
     * All single game scopes get this message so we have to look at check received game object id to check if
     * it is for current game
     *
     */
    $scope.attachPinnedVideo = function attachPinnedVideo(game, type) {
        if (type === 'dragable') {
            delete $scope.pinnedGames[game.id];
        } else {
            $scope.enlargedGame = null;
        }

        if (game && game.id === $scope.openGame.id) {
            if (!Config.main.defaultStreaming || !Config.main.defaultStreaming.enabled || $scope.openGame.tv_type !== Config.main.defaultStreaming.tvType) {
                $scope.openGame.video_data = null;
                GameInfo.getVideoData($scope.openGame);
            }
            $scope.isVideoDetached = false;
            $scope.openGame.activeFieldType = 'video'; //
        }
    };

    /**
     * @ngdoc method
     * @name selectPrematchTimePeriod
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  sets pre-match time period and reloads left menu
     *
     * @param {Number} hours number of hours, 0 for no filtering
     */

    $scope.selectMarketFilter = function selectMarketFilter(marketFilterField) {
        $scope.selectedMarketFilter = marketFilterField;

    };

    /**
     * @ngdoc method
     * @name changeStatsMode
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  changes live games stats mode from chart to details and back
     */
    $scope.changeStatsMode = function changeStatsMode() {
        Config.env.liveStatsFlipMode = (Config.env.liveStatsFlipMode + 1) % 3;
        Storage.set('liveStatsFlipMode', Config.env.liveStatsFlipMode);
    };

    /**
     * @ngdoc method
     * @name toggleStatsVisibility
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description  toggles live game statistics visibility
     */
    $scope.toggleStatsVisibility = function toggleStatsVisibility() {
        Config.env.hideLiveStats = !Config.env.hideLiveStats;
        $scope.showStatsBlock = !Config.env.hideLiveStats;
        Storage.set('hideLiveStats', Config.env.hideLiveStats);
    };

    $scope.$on('populateOutright', function() {
        if(Config.env.preMatchMultiSelection) {
            //$scope.resetPrematchMultiView();
        }
        TimeoutWrapper(populateOutright);
    });

    /**
     * @ngdoc method
     * @name populateOutright
     * @methodOf vbet5.controller:classicViewMainCtrl
     * @description populates games with OUTRIGHT market
     */
    function populateOutright() {
        $scope.favoriteGameIsSelected = false;
        $scope.isPopularGames = false;
        $scope.favoriteTeamExpanded = false;

        var request = {
            'source': 'betting',
            'what': {
                competition: ['name', 'order', 'id'],
                game: ['id','start_ts', 'team1_name', 'team2_name']
            },
            'where': {
                'market': {'show_type': "OUTRIGHT"}
            }
        };

        $scope.prematchGamesLoading = true;
        request.where.game = {};
        request.where.game.not_in_sportsbook = 0;

        connectionService.subscribe(request, updateOutrightGames);
    }

    function updateOutrightGames(data) {
        console.log('OUTRIGHT', data);
        var prematchGameViewData = [];
        if(Config.main.sportsLayout === 'euro2016') {
            addGroupDateToOutright(data.competition);
        }
        angular.forEach(data.competition, function (competition) {
            if(competition.game) {
                if(Config.main.sportsLayout === 'euro2016') {
                    competition.gamesGroupedByDate = Utils.groupByItemProperty(competition.game, 'groupDate');
                }
                competition.games = Utils.objectToArray(competition.game).sort(function (a, b) {
                    return a.start_ts - b.start_ts;
                });
            }
           prematchGameViewData.push(competition);
        });
        $scope.prematchGameViewData = prematchGameViewData;
        $scope.prematchGamesLoading = false;
    }

    function addGroupDateToOutright(competitions) {
        angular.forEach(competitions, function(competition) {
            angular.forEach(competition.game, function(game) {
                game.groupDate = Date.parse((moment(game.start_ts*1000).format("YYYY-MM-DD")))/1000;
            }) ;
        });
    }
}]);