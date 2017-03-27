/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:asianViewMainController
 * @description
 *  asian view controller
 */
VBET5.controller('asianViewMainController', ['$rootScope', '$scope', '$filter', '$location', '$route', 'Utils', 'Zergling', 'ConnectionService', 'Moment', '$q', 'Translator', 'GameInfo', 'AsianMarkets', 'Storage', 'Config', 'TimeoutWrapper', 'asianViewGmsBasaltChanger', '$window', 'DomHelper',
    function ($rootScope, $scope, $filter, $location, $route, Utils, Zergling, ConnectionService, Moment, $q, Translator, GameInfo, AsianMarkets, Storage, Config, TimeoutWrapper, asianViewGmsBasaltChanger, $window, DomHelper) {
        'use strict';

        TimeoutWrapper = TimeoutWrapper($scope);
        var connectionService = new ConnectionService($scope);
        $scope.selectedCompetitionsModel = {};
        $scope.competitionsList = [];
        $scope.collapedCompetitions = {};
        $scope.isEventInBetSlip = GameInfo.isEventInBetSlip;
        $scope.orderedByTime = Config.main.competitionsOrderByTimeInAsianView;
        $scope.marketGameCounts = {};
        $scope.sortAscending = true;
        $scope.visibleSetsNumber = 5;
        $scope.framesCount = GameInfo.framesCount;
        $scope.getStatWidth = GameInfo.getStatWidth;
        $scope.getCurrentTime = GameInfo.getCurrentTime;
        $scope.liveGamesSoccerTemplate = GameInfo.liveGamesSoccerTemplate;
        $scope.dotaGamesList = GameInfo.dotaGamesList;
        $scope.selectedAll = false;
        $scope.liveGamesSoccerTemplate = GameInfo.liveGamesSoccerTemplate;
        $scope.dotaGamesList = GameInfo.dotaGamesList;
        $scope.slideSets = GameInfo.slideSets;
        $scope.showFrameAlias = GameInfo.showFrameAlias;
        $scope.activeSequencesForGms = ['MATCH', 'PERIOD', 'HALF', 'SET'];
        $scope.expandedHdpGames = {};
        $scope.pinnedGames = {};
        $scope.themeSelector = {
            name: Storage.get('asianTheme') || 'default'
        };

        $scope.bet = function bet(event, market, openGame, oddType) {
            console.log("bet", event, market, openGame, oddType);
            oddType = oddType || 'odd';
            var game = Utils.clone(openGame);
            $rootScope.$broadcast('bet', {event: event, market: market, game: game, oddType: oddType});
        };


        //make video available as soon as user logs in
        $scope.$on('loggedIn', checkVideoAvailability);     // restoring login case
        $scope.$on('login.loggedIn', checkVideoAvailability); //normal login case

        $scope.$on('login.loggedOut', function() {
            if($scope.enlargedGame) {
                $scope.attachPinnedVideo($scope.enlargedGame, 'fullScreen');
            }
        });

        function checkVideoAvailability() {
            if ($scope.openGame && Config.main.video.autoPlay) {
                if (!$scope.openGame.video_id && Config.main.defaultStreaming && Config.main.defaultStreaming.enabled) {
                    $scope.openGame.tv_type = Config.main.defaultStreaming.tvType;
                    $scope.openGame.video_data = Config.main.defaultStreaming.streamUrl;
                    return;
                }
                if ($rootScope.profile) {
                    GameInfo.getVideoData($scope.openGame);
                } else {
                    var profilePromise = $rootScope.$watch('profile', function () {
                        if ($rootScope.profile) {
                            profilePromise();
                            GameInfo.getVideoData($scope.openGame);
                        }
                    });
                }
            }
        }

        $scope.openStatistics = function openStatistics(game) {
            $window.open(GameInfo.getStatsLink(game), game.id, "width=940,height=600,resizable=yes");
        };

        var gameCountSubscriptions = {}, gamesSubId = null, leftMenuSubId = null, competitionsFilterSubId = null, singleGameSubId = null, expandedHdpGamesSubIds = {};
        var checkOneTime = true;
        var competitionFilterData = {}, storageFilterData = {};
        var marketTypedistinction = Config.main.GmsPlatform ? 'display_key' : 'show_type';

        $scope.asianMarkets = AsianMarkets;
        AsianMarkets.marketsBySport = Config.main.GmsPlatform ? AsianMarkets.marketsBySportGms : AsianMarkets.marketsBySportBazalt;
        var lastCenterData = {};
        var LEFT_MENU = Config.main.asianLeftMenu ||  {
            FUTURE: 0,
            LIVE: 1,
            TODAY: 2
        };
        var ALL_COMPETITIONS = {
            id: -1,
            name: Translator.get('All'),
            order: -1,
            alias: 'All'
        };
        $scope.selectedMenuType = {active: LEFT_MENU.LIVE};
        $scope.LEFT_MENU = LEFT_MENU;

        $scope.leftMenuSports = [];
        $scope.dayFilter = [];
        $scope.filters = {
            selectedDays: [],
            allDays: {name: "Future Dates", selected: null}
        };

        function updateLeftMenu(data) {
            $scope.leftMenuSports = Utils.objectToArray(data.sport);
            if ($scope.selectedMenuType.active === LEFT_MENU.LIVE && Config.main.asian && Config.main.asian.enableAllTabInLiveSection) {
                $scope.leftMenuSports.unshift(ALL_COMPETITIONS);
            }
            $scope.leftMenuSports.sort(function (a, b) {
                return parseInt(a.order) - parseInt(b.order);
            });
        }

        $scope.changeStatsMode = function changeStatsMode() {
            $scope.flipMode = $scope.flipMode || 0;
            $scope.flipMode = ($scope.flipMode + 1) % 3;
        };

        function unsubscribe(id) {
            if (id) {
                connectionService.unsubscribe(id);
            }
        }

        $scope.toggleCompetition = function toggleCompetition(competitionId) {
            if ($scope.collapedCompetitions[competitionId]) {
                delete $scope.collapedCompetitions[competitionId];
            } else {
                $scope.collapedCompetitions[competitionId] = true;
            }
        };

        $scope.setMenuType = function setMenuType(value) {
            Config.env.live = value === LEFT_MENU.TODAY ? false : value;
            $scope.selectedMenuType.active = value;
            $location.search('type', value);
            $location.search('sport', undefined);
            $location.search('competition', undefined);
            $location.search('region', undefined);
            $location.search('game', undefined);
        };

        $scope.$on('asianMenu', function () {
            $scope.selectedMenuType.active = +!$scope.selectedMenuType.active;
        });

        /**
         * @ngdoc method
         * @name setTimeFilter
         * @methodOf vbet5.controller:asianViewMainController
         * @description adds time conditions to request according to type selected in left menu (future, live, today)
         *
         * @param {Object} request request object
         */
        function setTimeFilter(request) {
            request.where.game = request.where.game || {};
            if ($scope.selectedMenuType.active === LEFT_MENU.FUTURE) {
                request.where.game.type = {'@in': [0, 2]};
            } else if ($scope.selectedMenuType.active === LEFT_MENU.LIVE) {
                request.where.game.type = 1;
            } else if ($scope.selectedMenuType.active === LEFT_MENU.TODAY) {
                request.where.game['@or'] = [{
                    'start_ts': {
                        '@gte': $scope.dayFilter[0].from,
                        '@lt': $scope.dayFilter[0].to
                    }
                }];
            }
        }

        /**
         * @ngdoc method
         * @name subscribeToLiveGameCounts
         * @methodOf vbet5.controller:asianViewMainController
         * @description  Subscribes to live games counts and updates $scope's liveGamesCount object properties
         */
        function subscribeToLiveGameCounts() {
            var request = {
                'source': 'betting',
                'what': {'game': '@count'},
                'where': {'game': {'type': 1}, market: {}}
            };
            request.where.market[marketTypedistinction] = {"@gt": ""};
            connectionService.subscribe(
                request,
                function (data) {
                    $scope.liveGamesCount = data.game;
                    ALL_COMPETITIONS.game = data.game;
                },
                null, true);
        }

        function updateGames(data) {
            var centerData = {};
            centerData.competitions = [];
            angular.forEach(data.sport, function (sportData) {
                centerData.competitions[sportData.id] = centerData.competitions[sportData.id] || [];
                angular.forEach(sportData.region, function (region) {
                    angular.forEach(region.competition, function (competition) {
                        competition.name = $filter('removeParts')(competition.name, [sportData.name]);
                        if (competition.game) {
                            competition.games = Utils.objectToArray(competition.game);
                            angular.forEach(competition.games, function (game) {
                                game.sport = {'alias': sportData.alias, name: sportData.name, id: sportData.id};
                                game.region = {'alias': region.alias, name: region.name, id: region.id};
                                game.competition = {name: competition.name, id: competition.id};
                                asianViewGmsBasaltChanger.groupBySequenceAndTypes(game, AsianMarkets);
                            });
                        }
                        centerData.competitions[sportData.id].push(competition);
                    });
                });
                centerData.competitions[sportData.id].sort($scope.sortAscending ? Utils.orderSorting : Utils.orderSortingReverse);
            });

            if ($scope.orderedByTime) {

                $scope.orderByTime(centerData);
            } else {
                $scope.centerData = centerData;
            }
            lastCenterData = centerData;
            // $scope.marketGamesAreLoading = false;

            if (centerData && centerData.competitions && centerData.competitions.length === 0) {
                if (checkOneTime && $scope.dateFilterGameCount[0] && dayCounter() === 0 && $scope.marketGameCounts && $scope.marketGameCounts[$scope.selectedSport.alias]) {
                    var count = 0;
                    angular.forEach($scope.marketGameCounts[$scope.selectedSport.alias], function (marketCount) {
                        count += marketCount;
                    });
                    if (count > 0) {
                        $scope.openMarket({key: 'OUR'});
                        checkOneTime = false;
                    }
                }

                $scope.filterName = '';
            }
        }

        function updateOpenGame(data) {
            angular.forEach(data.sport, function (sport) {
                angular.forEach(sport.region, function (region) {
                    angular.forEach(region.competition, function (competition) {
                        angular.forEach(competition.game, function (game) {
                            game.sport = {id: sport.id, alias: sport.alias, name: sport.name};
                            game.region = {id: region.id};
                            game.competition = {id: competition.id, name: competition.name};
                            $scope.openGame = game;
                            $scope.openGame.setsOffset = $scope.openGame.setsOffset || 0;
                            // if teams shirt colors equal we change them to default colors
                            if ($scope.openGame.info && $scope.openGame.info.shirt1_color === $scope.openGame.info.shirt2_color) {
                                $scope.openGame.info.shirt1_color = "ccc";
                                $scope.openGame.info.shirt2_color = "f00";
                            }
                            $scope.marketGamesAreLoading = false;
                            if ($scope.openGame.type === 1) { // live game
                                if($scope.openGame.info){
                                    $scope.openGame.info.current_game_time = GameInfo.getCurrentTime($scope.openGame.info.current_game_time, $scope.openGame.info.current_game_state);
                                }
                                GameInfo.updateGameStatistics($scope.openGame);
                                GameInfo.extendLiveGame($scope.openGame);

                                if($scope.openGame.sport.alias === "Soccer") {
                                    GameInfo.generateTimeLineEvents($scope.openGame, $scope);
                                    GameInfo.addOrderingDataToSoccerGameEvents($scope.openGame);
                                }
                            }


                            if ($scope.openGame.sport.alias === "HorseRacing") {
                                GameInfo.getHorseRaceInfo($scope.openGame.info, $scope.openGame.market, "Winner");
                            }

                            var hasVideo = GameInfo.hasVideo($scope.openGame);
                            if (hasVideo) {
                                if ($scope.openGame.video_data === undefined && Config.main.video.autoPlay) {
                                    $scope.openGame.video_data = null; //not to call this several times before getVideoData fills the field
                                    if ($scope.pinnedGames && !$scope.pinnedGames[$scope.openGame.id]) {
                                        GameInfo.getVideoData($scope.openGame);
                                        if ($scope.enlargedGame && $scope.enlargedGame.id !== $scope.openGame.id) {
                                            $scope.enlargedGame = !Config.main.detachedVideoSizes[$scope.openGame.tv_type] ? $scope.openGame : null;
                                        }
                                    } else {
                                        $scope.openGame.activeFieldType = 'field';
                                    }
                                }
                            } else if (Config.main.defaultStreaming && Config.main.defaultStreaming.enabled) {
                                $scope.openGame.tv_type = Config.main.defaultStreaming.tvType;
                                $scope.openGame.video_data = Config.main.defaultStreaming.streamUrl;
                                if ($scope.enlargedGame) {
                                    $scope.enlargedGame = $scope.openGame;
                                }
                                hasVideo = true;
                            } else if($scope.enlargedGame) {
                                $scope.enlargedGame = null;
                            }

                            if ($scope.openGame.activeFieldType === undefined) {
                                $scope.openGame.activeFieldType = hasVideo && !$scope.enlargedGame && (Config.env.authorized || $rootScope.loginInProgress || !$scope.openGame.has_animation) ? 'video' : 'field';
                            }

                            angular.forEach(game.market, function (market) {
                                angular.forEach(market.event, function (event) {
                                    event.name = $filter('improveName')(event.name, game);
                                    event.name = $filter('removeParts')(event.name, [market.name]);
                                });
                                market.events = Utils.objectToArray(market.event);
                            });
                        });
                    });
                });
            });

            if ($scope.openGame) {
                $location.search('sport', $scope.openGame.sport.id);
                $location.search('competition', $scope.openGame.competition.id);
                $location.search('region', $scope.openGame.region.id);
                $location.search('game', $scope.openGame.id);
                asianViewGmsBasaltChanger.groupByTypesAndSequence($scope.openGame);

                angular.forEach(AsianMarkets.marketsBySportGms.Default.HDP, function(marketType) {
                    if($scope.openGame.markets[marketType] && $scope.openGame.selectedSequence[marketType].subKey) {
                        $scope.openGame.markets[marketType][$scope.openGame.selectedSequence[marketType].subKey][$scope.openGame.selectedSequence[marketType].sequence].sort(function(a, b) {
                            return a.base - b.base;
                        });
                    }
                });
            }
        }

        $scope.goBackFromOpenGame = function goBackFromOpenGame() {
            $scope.openMarket({key: $scope.previouslyOpenedMarketKey});
            $scope.previouslyOpenedMarketKey = null;
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
         * @name toggleVideoAndAnimationBox
         * @methodOf vbet5.controller:asianViewMainController
         * @description  name says it all
         */
        $scope.toggleVideoAndAnimationBox = function toggleVideoAndAnimationBox() {
            $scope.hideVideoAndAnimationBox = !$scope.hideVideoAndAnimationBox;
        };

        /**
         * @ngdoc method
         * @name loadAllEvents
         * @methodOf vbet5.controller:asianViewMainController
         * @description load all events when more is clicked
         */
        $scope.loadAllEvents = function loadAllEvents(gameId) {
            if (gamesSubId) {
                connectionService.unsubscribe(gamesSubId);
            }
            if (Object.keys(expandedHdpGamesSubIds).length !== 0) {
                connectionService.unsubscribe(expandedHdpGamesSubIds);
            }

            $scope.previouslyOpenedMarketKey = $scope.selectedMarket.key;
            $scope.selectedMarket = {key: 'FULLGAME'};

            var request = {
                'source': 'betting',
                'what': {
                    sport: ['id', 'name', 'alias'],
                    competition: ['name', 'order', 'id'],
                    region: ['name', 'alias', 'id'],
                    //game: ['id', 'team1_name', 'team2_name', 'info', 'start_ts', 'type', 'text_info', 'is_blocked', 'stats', 'last_event', 'video_id', 'video_id1', 'video_id2', 'video_id3', 'tv_type', 'field', 'live_events', 'isGms', 'is_stat_available'],
                    game: [],
                    market: [],
                    event: []
                },
                'where': {
                    'game': {'id': +gameId}
                }
            };
            if ($scope.selectedSport.id !== ALL_COMPETITIONS.id) {
                request.where.sport =   {'id': $scope.selectedSport.id};
            }
            connectionService.subscribe(
                request,
                updateOpenGame,
                {
                    'thenCallback': function (result) {
                        singleGameSubId = result.subid;
                    }
                }
            );
        };

        /**
         * @ngdoc method
         * @name loadGames
         * @methodOf vbet5.controller:asianViewMainController
         * @description
         */
        $scope.loadGames = function loadGames() {
            $scope.marketGamesAreLoading = true;
            var showTypes = ($scope.asianMarkets.marketsBySport[$scope.selectedSport.alias] || $scope.asianMarkets.marketsBySport.Default)[$scope.selectedMarket.key];
            var request = {
                'source': 'betting',
                'what': {
                    sport: ['id', 'name', 'alias'],
                    competition: ['name', 'order', 'id'],
                    region: ['name', 'alias', 'id'],
                    game: ['id', 'team1_name', 'team2_name', 'info', 'start_ts', 'type', 'text_info', 'events_count', 'is_blocked', 'markets_count', 'stats'],
                    market: ['base', 'id', 'name', 'order', 'sequence', 'show_type', 'display_key', 'display_sub_key', 'market_type'],
                    event: ['name', 'id', 'base', 'type', 'price', 'show_type']
                },
                'where': {
                    'market': {}
                }
            };

            if (Config.main.GmsPlatform && $scope.selectedMarket.key === 'HDP') {
                request.where.market['@or'] = [];
                for (var i = 0, length = showTypes.length; i < length; i++) {
                    var obj = {'display_key': showTypes[i]};
                    if (showTypes[i] !== 'WINNER') {
                        obj.optimal = true;
                    }
                    request.where.market['@or'].push(obj);
                }
            } else {
                request.where.market[marketTypedistinction] = {'@in': showTypes};
            }

            setTimeFilter(request);
            request.where.competition = request.where.competition || {}; // ???


            if (($scope.selectedMenuType.active === LEFT_MENU.FUTURE) && $scope.filters.selectedDaysTimeIntervals && $scope.filters.selectedDaysTimeIntervals.length > 0) {
                request.where.game['@or'] = $scope.filters.selectedDaysTimeIntervals;
            }
            if ($scope.selectedSport.id !== ALL_COMPETITIONS.id) {
                request.where.sport = {'id': $scope.selectedSport.id};
                request.where.competition.id = {'@in': ($scope.competitionsList && $scope.competitionsList.length) ? $scope.competitionsList : ['-1']};
            }

            connectionService.subscribe(
                request,
                updateGames,
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            gamesSubId = result.subid;
                        }
                        $scope.marketGamesAreLoading = false;
                    }
                }
            );
        };

        /**
         * @ngdoc method
         * @name loadExtraMarkets
         * @methodOf vbet5.controller:asianViewMainController
         * @description subscribe to expanded games all hdp markets
         * @param game
         */
        function loadExtraMarkets(game) {
            $scope.extraMarketsLoading = true;
            var showTypes = ($scope.asianMarkets.marketsBySport[$scope.selectedSport.alias] || $scope.asianMarkets.marketsBySport.Default)[$scope.selectedMarket.key];

            var request = {
                'source': 'betting',
                'what': {
                    game: ['id', 'team1_name', 'team2_name', 'info', 'start_ts', 'type', 'text_info', 'events_count', 'is_blocked', 'markets_count'],
                    market: ['base', 'id', 'name', 'order', 'sequence', 'show_type', 'display_key', 'display_sub_key', 'optimal'],
                    event: ['name', 'id', 'base', 'type', 'price', 'show_type']
                },
                'where': {
                    'sport': {'id': $scope.selectedSport.id},
                    'game': {'id': game.id},
                    'market': {'optimal': false}
                }
            };

            request.where.market[marketTypedistinction] = {'@in': showTypes};
            setTimeFilter(request);
            if (($scope.selectedMenuType.active === LEFT_MENU.FUTURE) && $scope.filters.selectedDaysTimeIntervals && $scope.filters.selectedDaysTimeIntervals.length > 0) {
                request.where.game['@or'] = $scope.filters.selectedDaysTimeIntervals;
            }

            function updateExpandedHdpGame(data) {
                var gameDetails = data.game;
                if (gameDetails && gameDetails[game.id]) {
                    gameDetails[game.id].sport = {'alias': game.sport.alias, name: game.sport.name, id: game.sport.id};
                    gameDetails[game.id].region = {
                        'alias': game.region.alias,
                        name: game.region.name,
                        id: game.region.id
                    };
                    gameDetails[game.id].competition = {name: game.competition.name, id: game.competition.id};
                    asianViewGmsBasaltChanger.groupBySequenceAndTypes(gameDetails[game.id], AsianMarkets);

                    $scope.expandedHdpGames[game.id] = gameDetails[game.id];

                    angular.forEach($scope.expandedHdpGames[game.id].markets[game.selectedSequence.subKey][game.selectedSequence.sequence], function(marketType) {
                        marketType.sort(function(a, b) {
                            return a.base - b.base;
                        });
                    });


                } else {

                }
                $scope.extraMarketsLoading = false;
            }

            connectionService.subscribe(
                request,
                updateExpandedHdpGame,
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            expandedHdpGamesSubIds[game.id] = result.subid;
                        }
                    }
                },
                true
            );
        }

        /**
         * @ngdoc method
         * @name toggleExtraMarkets
         * @methodOf vbet5.controller:asianViewMainController
         * @description show/hide handicap extra markets
         * @param game
         */
        $scope.toggleExtraMarkets = function toggleExtraMarkets(game) {
            game.expanded = !game.expanded;

            if (game.expanded) {
                loadExtraMarkets(game);
            } else {
                //unsubscribe from this game's extra markets
                connectionService.unsubscribe(expandedHdpGamesSubIds[game.id]);
                delete $scope.expandedHdpGames[game.id];
            }
        };


        /**
         * @ngdoc method
         * @name updateCompetitionsFilterData
         * @methodOf vbet5.controller:asianViewMainController
         * @description receives available competitions list from swarm and stroes in corresponding scope variable
         */
        function updateCompetitionsFilterData(data) {
            $scope.competitionsFilter = [];
            if (data.region) {
                angular.forEach(data.region, function (region) {
                    angular.forEach(region.competition, function (competition) {
                        competition.regionName = region.name;
                        competition.name = $filter('removeParts')(competition.name, [$scope.selectedSport.name]);
                        competition.name = $filter('removeParts')(competition.name, [region.name]);
                        $scope.competitionsFilter.push(competition);
                    });
                });
            }
            $scope.selectedAll = true;
            $scope.checkAll();
            $scope.updateCompetitionsFilter();
        }

        function fillCompetitionsList() {
            angular.forEach($scope.selectedCompetitionsModel, function (value, competition) {
                angular.forEach($scope.competitionsFilter, function (updatedCompetition) {
                    if (value && +competition === updatedCompetition.id) {
                        $scope.competitionsList.push(+competition);
                    }
                });
            });
        }

        /**
         * @ngdoc method
         * @name updateCompetitionsFilter
         * @methodOf vbet5.controller:asianViewMainController
         * @description updates competitions filter (when OK cis clicked)
         */
        $scope.updateCompetitionsFilter = function updateCompetitionsFilter() {
            $scope.competitionsList = [];

            if ($scope.selectedMenuType.active === LEFT_MENU.FUTURE && competitionFilterData && competitionFilterData[$scope.selectedSport.id]) {
                angular.forEach(competitionFilterData[$scope.selectedSport.id], function (value, competition) {
                    angular.forEach($scope.competitionsFilter, function (updatedCompetition) {
                        if (value && +competition === updatedCompetition.id) {
                            $scope.competitionsList.push(+competition);
                        }
                    });
                });
            } else {
                fillCompetitionsList();
            }
        };

        /**
         * @ngdoc method
         * @name saveFilterData
         * @methodOf vbet5.controller:asianViewMainController
         * @description receives filter data and save in Local Storage
         */
        $scope.saveFilterData = function saveFilterData() {
            if ($scope.selectedMenuType.active === LEFT_MENU.FUTURE) {
                if (storageFilterData[$scope.selectedSport.id]) {
                    Utils.MergeRecursive(storageFilterData[$scope.selectedSport.id], $scope.selectedCompetitionsModel);
                } else {
                    storageFilterData[$scope.selectedSport.id] = $scope.selectedCompetitionsModel;
                }
                if (Config.env.authorized) {
                    Storage.set('storageFilterData', storageFilterData, Config.main.asianStorageFilterData || 86400000)
                }

                competitionFilterData = storageFilterData;

                $scope.competitionsList = [];
                $scope.selectedCompetitionsModel = competitionFilterData[$scope.selectedSport.id];

                fillCompetitionsList();

                var deferred = $q.defer();
                var dataFilterGameCounts = deferred.promise;
                loadDateFilterGameCounts($scope.selectedMarket, deferred);
                dataFilterGameCounts.then(function (data) {
                    updateDateFilters(data);
                    $scope.loadGames();
                });
            } else {
                $scope.competitionsList = [];
                angular.forEach($scope.selectedCompetitionsModel, function (value, competition) {
                    if (value) {
                        $scope.competitionsList.push(+competition);
                    }
                });
                $scope.loadGames();
            }
            $scope.showCompetitionsSelector = false;
        };

        /**
         * @ngdoc method
         * @name loadAvailableCompetitionsForSelectedMarket
         * @methodOf vbet5.controller:asianViewMainController
         * @description loads available competitions list for competitions filter
         */
        function loadAvailableCompetitionsForSelectedMarket(market) {
            $scope.selectedCompetitions = null;

            var showTypes = ($scope.asianMarkets.marketsBySport[$scope.selectedSport.alias] || $scope.asianMarkets.marketsBySport.Default)[$scope.selectedMarket.key];
            var request = {
                'source': 'betting',
                'what': {
                    competition: [],
                    region: ['name']
                },
                'where': {
                    'sport': {'id': $scope.selectedSport.id},
                    'market': {}
                }
            };
            request.where.market[marketTypedistinction] = {'@in': showTypes};
            setTimeFilter(request);

            connectionService.subscribe(
                request,
                function (data) {
                    updateCompetitionsFilterData(data, true);
                },
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            competitionsFilterSubId = result.subid;
                        }

                        if (result.data) {
                            updateCompetitionsFilterData(result.data);
                            var deferredCount = $q.defer();
                            var dataFilterGameCountPromise = deferredCount.promise;
                            loadDateFilterGameCounts(market, deferredCount);
                            dataFilterGameCountPromise.then(function (data) {
                                updateDateFilters(data);
                                $scope.loadGames();
                            });
                        }
                    }
                }
            );
        }

        function updateMarketGameCounts(data, sportAlias, marketsGroup) {
            $scope.marketGameCounts[sportAlias] = $scope.marketGameCounts[sportAlias] || {};
            $scope.marketGameCounts[sportAlias][marketsGroup] = data.game;
        }

        function loadSportMarketGameCounts(sport, showTypes, marketsGroup) {
            var request = {
                'source': 'betting',
                'what': {
                    'game': '@count'
                },
                where: {
                    "sport": {id: sport.id},
                    "market": {}
                }
            };
            request.where.market[marketTypedistinction] = {'@in': showTypes};
            setTimeFilter(request);

            connectionService.subscribe(
                request,
                function (data) {
                    updateMarketGameCounts(data, sport.alias, marketsGroup);
                },
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            gameCountSubscriptions[result.subid] = result.subid;
                        }
                    }
                },
                true
            );
        }

        function loadDateFilterGameCounts(market, deferred) {
            var selectedMarket = market || $scope.selectedMarket;
            $scope.dateFilterGameCount = [];
            var showTypes = ($scope.asianMarkets.marketsBySport[$scope.selectedSport.alias] || $scope.asianMarkets.marketsBySport.Default)[selectedMarket.key];
            if ($scope.selectedSport.id) {
                var i, request;
                for (i = 0; i < 8; i++) {
                    request = {
                        'source': 'betting',
                        'what': {'game': '@count'},
                        'where': {
                            'sport': {'id': $scope.selectedSport.id},
                            'game': {
                                'type': {'@in': [0, 2]},
                                'start_ts': {
                                    '@gte': i === 7 ? $scope.dayFilter[6].to : $scope.dayFilter[i].from,
                                    '@lt': i === 7 ? '' : $scope.dayFilter[i].to
                                }
                            },
                            'market': {},
                            'competition': ($scope.competitionsList && $scope.competitionsList.length) ? {'id': {'@in': $scope.competitionsList}} : {'id': {'@in': ['-1']}}
                        }
                    };
                    request.where.market[marketTypedistinction] = {'@in': showTypes};
                    Zergling.get(request).then(function (result) {
                        $scope.dateFilterGameCount.push(result.data);
                        if ($scope.dateFilterGameCount && $scope.dateFilterGameCount.length > 7) {
                            deferred.resolve($scope.dateFilterGameCount);
                        }
                    })['catch'](function (reason) {
                    });
                }
            }
        }

        function closeOpenGame() {
            $scope.openGame = null;
            if (singleGameSubId) {
                connectionService.unsubscribe(singleGameSubId);
            }
        }

        $scope.openSport = function openSport(sport, market, initial) {
            checkOneTime = true;
            $scope.collapedCompetitions = {};
            $location.search('sport', sport.id);
            if(!initial) {
                $location.search('competition', undefined);
                $location.search('region', undefined);
                $location.search('game', undefined);
            }

            var gameIsOpenned = initial && $location.search().game;
            if(!gameIsOpenned) {
                closeOpenGame();
            }

            if ($scope.selectedSport && $scope.selectedSport.id === sport.id && !initial) {
                $scope.selectedSport.closedTab = !$scope.selectedSport.closedTab;
                if (market && $scope.previouslyOpenedMarketKey) {
                    $scope.openMarket(market);
                    $scope.previouslyOpenedMarketKey = null;
                }
                return;
            }

            $scope.selectedSport = sport;
            connectionService.unsubscribe(gameCountSubscriptions)['finally'](function () {
                angular.forEach(AsianMarkets.marketsBySport[sport.alias] || AsianMarkets.marketsBySport.Default, function (markets, marketsGroup) {
                    loadSportMarketGameCounts(sport, markets, marketsGroup);
                });
                if (gameIsOpenned) {
                    $scope.loadAllEvents($location.search().game);
                }
            });

            if (market) {
                $scope.openMarket(market, null, gameIsOpenned);
            }
        };

        /**
         * @ngdoc method
         * @name openMarket
         * @methodOf vbet5.controller:asianViewMainController
         * @description selects sport market and loads right side view for it
         */
        $scope.openMarket = function openMarket(market, sport, gameIsOpenned) {

            if(!gameIsOpenned) {
                $location.search('competition', undefined);
                $location.search('region', undefined);
                $location.search('game', undefined);
            }


            if(Object.keys(expandedHdpGamesSubIds).length !== 0) {

                connectionService.unsubscribe(expandedHdpGamesSubIds);
            }
            $scope.expandedHdpGames = {};

            if (sport && sport.id === $scope.selectedSport.id && $scope.selectedMenuType &&
                LEFT_MENU.LIVE !== $scope.selectedMenuType.active && $scope.selectedMarket && $scope.selectedMarket.key === market.key) {
                return;
            }
            if(!gameIsOpenned) {
                closeOpenGame();
            }

            $scope.marketGamesAreLoading = true;
            $scope.selectedCompetitionsModel = {};
            $scope.selectedMarket = market;
            if (market.key === 'HDP') {
                var sport = AsianMarkets.marketsBySport[$scope.selectedSport.alias] || AsianMarkets.marketsBySport.Default;
                $scope.pointsTypeForMarket = sport.HDP[sport.HDP.length - 1];
            }
            var storageFilteredData = Config.env.authorized ? Storage.get('storageFilterData') : {};
            if ($scope.selectedMenuType.active === LEFT_MENU.FUTURE && storageFilteredData && storageFilteredData[$scope.selectedSport.id]) {
                $scope.competitionsList = [];
                competitionFilterData = storageFilteredData;
                $scope.selectedCompetitionsModel = competitionFilterData[$scope.selectedSport.id];

                fillCompetitionsList();
            } else {
                $scope.selectedCompetitionsModel = {};
                competitionFilterData = {};
                $scope.competitionsList = [];
            }
            !gameIsOpenned && loadAvailableCompetitionsForSelectedMarket(market);
        };

        function loadLeftMenu() {
            unsubscribe(leftMenuSubId);
            $scope.leftMenuIsLoading = true;
            var request = {
                'source': 'betting',
                'what': {
                    'sport': ['id', 'name', 'alias', 'order'],
                    'game': '@count'
                },
                where: {
                    "market": {}
                }
            };
            request.where.market[marketTypedistinction] = {'@gt': ""};

            setTimeFilter(request);

            connectionService.subscribe(
                request,
                updateLeftMenu,
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            leftMenuSubId = result.subid;
                        }

                        if (result.data) {
                            var sport = $location.search().sport && Utils.getArrayObjectElementHavingFieldValue($scope.leftMenuSports, 'id', +$location.search().sport);
                            if (sport) {
                                $scope.openSport(sport, {key: 'HDP'}, true);
                            } else {
                                $scope.openSport($scope.leftMenuSports[0], {key: 'HDP'}, true);
                            }
                        }

                        $scope.leftMenuIsLoading = false;
                    }
                }
            );
        }

        $scope.$watch('selectedMenuType.active', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                loadLeftMenu();
            }
        });
        $scope.$watch('env.authorized', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                storageFilterData = Config.env.authorized ? Storage.get('storageFilterData') || {} : {};
                var sport = $location.search().sport && Utils.getArrayObjectElementHavingFieldValue($scope.leftMenuSports,'id', +$location.search().sport);
                if(sport) {
                    $scope.openSport(sport, {key: 'HDP'}, true);
                } else {
                    $scope.openSport($scope.leftMenuSports[0], {key: 'HDP'}, true);
                }
            }
        });

        function createDayNames() {
            var i;
            for (i = 0; i < 7; i++) {
                $scope.dayFilter.push({
                    to: Moment.get().add(i, 'days').endOf("day").unix(),
                    from: Moment.get().add(i, 'days').startOf("day").unix(),
                    id: i,
                    name: Moment.get().add(i, 'days').startOf("day").format("ddd D")
                });
            }
        }

        function updateDateFilters(data) {
            $scope.filters.selectedDays = [];
            $scope.filters.allDays.selected = false;
            var i;
            for (i = 0; i < 7; i += 1) {
                if (data[i] && data[i].game != 0) {
                    $scope.filters.selectedDaysTimeIntervals = [{
                        'start_ts': {
                            '@gte': $scope.dayFilter[i].from,
                            '@lt': $scope.dayFilter[i].to
                        }
                    }];
                    $scope.filters.selectedDays[i] = true;
                    $scope.filterName = $scope.dayFilter[i].name;
                    $scope.filterCount = data[i].game;
                    break;
                }
                if (i === 6) {
                    $scope.filters.selectedDaysTimeIntervals = [{'start_ts': {'@gte': $scope.dayFilter[6].to}}];
                    $scope.filterName = Translator.get("Future Dates");
                    $scope.filterCount = data[7].game;
                    $scope.filters.allDays.selected = true;
                }
            }
        }

        /**
         * Initialize controller
         */
        function init() {
            $scope.selectedMenuType.active = typeof ($location.search().type) !== "undefined" ? parseInt($location.search().type, 10) : LEFT_MENU.FUTURE;

            createDayNames();
            loadLeftMenu();
            subscribeToLiveGameCounts();

            if (Config.main.availableAsianViewThemes.length > 1) {
                angular.forEach(Config.main.availableAsianViewThemes, function (theme) {
                    if (theme.name === $scope.themeSelector.name) {
                        $scope.loadTheme(theme);
                    }
                });
            }
        }

        /**
         * Initialize controller
         */
        function dayCounter() {
            var count = 0, i;
            for (i = 0; i < 8; i += 1) {
                if ($scope.dateFilterGameCount[i].game != 0) {
                    count += 1;
                }
            }

            return count;
        }

        /**
         * Handle allDay checkbox
         */
        $scope.toggleAllDays = function toggleAllDays() {
            if (dayCounter() === 1) {
                return;
            }
            if ($scope.filters.allDays.selected) {
                $scope.filters.selectedDays = [];
                $scope.filters.selectedDaysTimeIntervals = [{'start_ts': {'@gte': $scope.dayFilter[6].to}}];
                $scope.filterName = Translator.get("Future Dates");
                $scope.filterCount = $scope.dateFilterGameCount[7].game;
            } else {
                var i;
                for (i = 0; i < 8; i += 1) {
                    if ($scope.dateFilterGameCount[i].game > 0) {
                        $scope.filters.selectedDaysTimeIntervals = [{
                            'start_ts': {
                                '@gte': $scope.dayFilter[i].from,
                                '@lt': $scope.dayFilter[i].to
                            }
                        }];
                        $scope.filters.selectedDays[i] = true;
                        $scope.filterName = $scope.dayFilter[i].name;
                        $scope.filterCount = $scope.dateFilterGameCount[i].game;
                        break;
                    }
                }
            }

            $scope.loadGames();
        };

        /**
         * Handle day checkboxes select then load games
         */
        $scope.toggleDay = function toggleDay() {
            $scope.filterCount = 0;
            if (dayCounter() === 1) {
                return;
            }
            var days = [], count = 0, name = '';

            if ($scope.filters.allDays.selected) {
                $scope.filters.allDays.selected = false;
            }

            angular.forEach($scope.dayFilter, function (selected, id) {
                if ($scope.filters.selectedDays[id]) {
                    name = $scope.dayFilter[id].name;
                    $scope.filterCount += $scope.dateFilterGameCount[id].game;
                    count++;
                    if ($scope.filters.selectedDays[id - 1]) {
                        days[days.length - 1] = {'@gte': days[days.length - 1]['@gte'], '@lt': $scope.dayFilter[id].to};
                    } else {
                        days.push({'@gte': $scope.dayFilter[id].from, '@lt': $scope.dayFilter[id].to});
                    }
                }
            });

            $scope.filters.selectedDaysTimeIntervals = days.length === 0 ? [{'start_ts': {'@gte': $scope.dayFilter[6].to}}] : days.map(function (element) {
                return {'start_ts': element};
            });
            if (count !== 0) {
                $scope.filterName = count === 1 ? name : "...";
            } else {
                $scope.filterName = Translator.get("Future Dates");
                $scope.filterCount = $scope.dateFilterGameCount[7].game;
                $scope.filters.allDays.selected = true;
            }

            $scope.loadGames();
        };

        $scope.changeSortOrder = function changeSortOrder() {
            $scope.sortAscending = !$scope.sortAscending;
            $scope.orderByTime();
        };

        /**
         * @ngdoc method
         * @name sortByDate
         * @methodOf vbet5.controller:sortByDate
         * @description Order games by time
         */

        function doOrderByTime(centerData) {
            if (!$scope.orderedByTime) {
                $scope.centerData = lastCenterData;
                angular.forEach($scope.centerData.competitions, function (value, key) {
                    $scope.centerData.competitions[key].sort($scope.sortAscending ? Utils.orderSorting : Utils.orderSortingReverse);

                });

                return;
            }

            var orderedGroupedGames = [], orderedCompetitions = [];
            var dataToOrder = (centerData && centerData.competitions) || $scope.centerData.competitions;
            angular.forEach(dataToOrder, function (competitions, sportId) {
                orderedGroupedGames[sportId] =  orderedGroupedGames[sportId] || [];
                angular.forEach(competitions, function (competition, key) {
                    orderedGroupedGames[sportId] = orderedGroupedGames[sportId].concat(competition.games);
                });
            });

            var compareFn = $scope.sortAscending ? function (a, b) {
                return a.start_ts - b.start_ts;
            } : function (a, b) {
                return b.start_ts - a.start_ts;
            };
            angular.forEach(orderedGroupedGames, function (orderedGames, key) {
                orderedGroupedGames[key].sort(compareFn);
            });
            $scope.centerData.competitions = [];
            angular.forEach(orderedGroupedGames, function (orderedGames, key) {
                var i, length = orderedGames.length;
                for (i = 0; i < length; i++) {
                    if (!orderedCompetitions.length || orderedCompetitions[orderedCompetitions.length - 1].id !== orderedGames[i].competition.id) {
                        orderedCompetitions.push({
                            name: orderedGames[i].competition.name,
                            id: orderedGames[i].competition.id,
                            games: []
                        });
                    }
                    orderedCompetitions[orderedCompetitions.length - 1].games.push(orderedGames[i]);

                }

                $scope.centerData.competitions[key] = orderedCompetitions;
            });

        }

        /**
         * @ngdoc method
         * @name orderByTime
         * @methodOf vbet5.controller:orderByTime
         * @description the function used only in template; it calls function in the local scope with some delay
         */
        $scope.orderByTime = function orderByTime(param) {
            $scope.filterLoading = true;
            TimeoutWrapper(function () {
                doOrderByTime(param);
                $scope.filterLoading = false;
            }, 100);
        };

        /**
         * @ngdoc method
         * @name checkAll
         * @methodOf vbet5.controller:asianViewMainController
         * @description Marks all checkboxes if checkAll button is checked and unmarks them if checkAll is not checked
         */
        $scope.checkAll = function checkAll(force) {
            if (!force && $scope.selectedMenuType.active === LEFT_MENU.FUTURE && competitionFilterData && competitionFilterData[$scope.selectedSport.id]) {
                $scope.selectedAll = false;
                $scope.selectedCompetitionsModel = competitionFilterData[$scope.selectedSport.id];
            } else if ($scope.selectedAll) {
                angular.forEach($scope.competitionsFilter, function (competition) {
                    $scope.selectedCompetitionsModel[competition.id] = true;
                });
                storageFilterData[$scope.selectedSport.id] = $scope.selectedCompetitionsModel;
            } else {
                angular.forEach($scope.competitionsFilter, function (competition) {
                    angular.forEach($scope.selectedCompetitionsModel, function (competitionModel, modelId) {
                        if (competition.id === +modelId) {
                            delete $scope.selectedCompetitionsModel[modelId]
                        }
                    });
                });
                storageFilterData[$scope.selectedSport.id] = $scope.selectedCompetitionsModel;
            }
            $scope.allowFiltering();
        };

        /**
         *@ngdoc method
         * @name cancelCompetitionsSelector
         * @methodOf vbet5.controller:asianViewMainController
         * @description Revert temporary changes
         */
        $scope.cancelCompetitionsSelector = function cancelCompetitionsSelector() {
            $scope.showCompetitionsSelector = false;
            $scope.selectedCompetitionsModel = {};
            angular.forEach($scope.competitionsList, function (competition) {
                $scope.selectedCompetitionsModel[competition] = true;
            });
            $scope.selectedAll = ($scope.competitionsList.length === $scope.competitionsFilter.length);
        };

        /**
         * @ngdoc method
         * @name allCompatitionsCheck
         * @methodOf vbet5.controller:asianViewMainController
         * @description Checks if one of the checkboxes is not marked removes the mark from checkAll button as well
         * @param state:{boolean} the state of the clicked element
         */
        $scope.allCompatitionsCheck = function allCompatitionsCheck(state) {
            $scope.allowFiltering();
            if (!state) {
                $scope.selectedAll = state;
            }
        };

        /**
         * @ngdoc method
         * @name allowFiltering
         * @methodOf vbet5.controller:asianViewMainController
         * @description Checks whether at list one competition is chosen to allow the filtering
         * @returns {boolean}
         */
        $scope.allowFiltering = function allowFiltering() {
            var i = 0;
            if (!Object.keys($scope.selectedCompetitionsModel).length) {
                $scope.enableFiltering = false;
                return;
            }
            $scope.enableFiltering = false;
            angular.forEach($scope.competitionsFilter, function (competition) {
                angular.forEach($scope.selectedCompetitionsModel, function (competitionModel, modelId) {
                    if (competition.id === +modelId && competitionModel) {
                        i++;
                        $scope.enableFiltering = true;
                    }
                });
            });
            if ($scope.competitionsFilter.length === i && i > 0) {
                $scope.selectedAll = true;
            }
        };

        $scope.prefixBase = function prefixBase(base) {
            return (base <= 0 ? '' : '+') + base;
        };


        /**
         * @ngdoc method
         * @name fixDisplayTime
         * @methodOf vbet5.controller:asianViewMainController
         * @description removes reduntant text from game time info
         * @param {String} gameTime
         */
        $scope.fixDisplayTime = function fixDisplayTime(gameTime) {
            if (!gameTime) {
                return;
            }
            return gameTime.split(' ').length === 2 ? gameTime.split(' ')[1] : gameTime.split(' ')[0];
        };

        /**
         * @ngdoc method
         * @name loadTheme
         * @methodOf vbet5.controller:asianViewMainController
         * @description load theme
         * @param {Object} theme time
         */
        $scope.loadTheme = function loadTheme(theme) {
            Storage.set('asianTheme', theme.name);
            $scope.themeSelector.name = theme.name;
            $scope.themeSelector.show = false;
            DomHelper.clearCss('asian');
            if (theme.css) {
                var css = DomHelper.addCss(theme.css, null, null, 'asian');
                $scope.isCssLoading = true;
                css.onload = function () {
                    $scope.isCssLoading = false;
                    $scope.$apply();
                };
            }
        };

        init();

        $scope.$on('sportsbook.handleDeepLinking', function () { //linking to games inside sportsbook
            TimeoutWrapper(function () {
                $route.reload(); // it must be implement withoud rote.reload. neet to handle deepLinking
            }, 100);
        });
    }]);
