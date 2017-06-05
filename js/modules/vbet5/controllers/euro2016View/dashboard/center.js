VBET5.controller('euro2016DashboardCenterController', ['$rootScope', '$scope', 'OddService', 'ConnectionService', 'Config', '$filter', 'Utils', 'GameInfo', 'Moment', function ($rootScope, $scope, OddService, ConnectionService, Config, $filter, Utils, GameInfo, Moment) {
    'use strict';

    var connectionService = new ConnectionService($scope);
    var connectionSubIds = {};
    var parentMainScope = $scope.$parent.$parent.$parent;
    var expandedRegionSubIds = {};
    var updateCentralLiveView = updateCentralViewFactory('centerViewLiveData');
    var updateCentralPrematchView = updateCentralViewFactory('centerViewPrematchData');

    var updateCentralLiveViewWithExpandedRegion = updateCentralViewWithExpandedRegionFactory('centerViewLiveData');
    var updateCentralPrematchViewWithExpandedRegion = updateCentralViewWithExpandedRegionFactory('centerViewPrematchData');
    var updateCentralPrematchViewWithExpandedRegionForLiveToday = updateCentralViewWithExpandedRegionFactory('centerViewPrematchData', updateLinkedGames);
    var firstTimeLoaded = false;
    //adding sport basketball to show only P1P2
    $scope.sportP1P2Alias = ['Dota2', 'CounterStrike', 'Tennis', 'TableTennis', 'Volleyball', 'Golf', 'Snooker', 'Mma', 'LeagueOfLegends', 'StarCraft2', 'WorldOfTanks', 'Basketball', 'Badminton', 'Baseball','EBasketball', 'BeachVolleyball', 'AustralianFootball']; //sport aliases which haven't X (only P1 P2)

    ;

    (function initScope () {
        $scope.displayBase = GameInfo.displayBase;
        $scope.displayEventLimit = GameInfo.displayEventLimit;
        $scope.cancelDisplayEventLimit = GameInfo.cancelDisplayEventLimit;
        $scope.isEventInBetSlip = GameInfo.isEventInBetSlip;
        $scope.liveGamesSoccerTemplate = GameInfo.liveGamesSoccerTemplate;
        $scope.dotaGamesList = GameInfo.dotaGamesList;
        $scope.framesCount = GameInfo.framesCount;
        $scope.showFrameAlias = GameInfo.showFrameAlias;
        $scope.slideSets = GameInfo.slideSets;
        $scope.getCurrentTime = GameInfo.getCurrentTime;
        $scope.visibleSetsNumber = 5;

        $scope.selectedMarketForLiveCompetition = {};
        $scope.selectedMarketForPrematchCompetition = {};


        $scope.odds = OddService.data;
        $scope.setOddSwitcherValue = OddService.setOddSwitcherValue;
        $scope.oddSwitcherValue = OddService.getOddSwitcherInitialValue();
        $scope.setOddSwitcherValue($scope.oddSwitcherValue, true);

        $scope.competitionLiveFilters = {};
        $scope.competitionPrematchFilters = {};
        $scope.sportBlock = {};
        $scope.expandedAll = true;
        $scope.goToUrl = Utils.goToUrl;



    })();

    function isSelectedCentralViewTogglable () {
        return true;
//         return ['sport', 'liveToday', 'popularEvents'].indexOf(parentMainScope.selectedCentralView) !== -1;
    }

    $scope.isSelectedCentralViewTogglable = isSelectedCentralViewTogglable;

    function updateCentralViewFactory (source) {
        return function updateCentralView(data, subId) {
            $scope.centerViewLoading = false;
            if (subId) {
                connectionSubIds[subId] = subId;
            }

            processCenterViewData(data, subId, function (sport) {
                if ($scope[source].length) {
                    var existingSportKey = -1;
                    angular.forEach($scope[source], function (templateSport, key) {
                        if (templateSport.id == sport.id) {
                            existingSportKey = key;
                            return;
                        }
                    });

                    if (existingSportKey >= 0) {
                        $scope[source][existingSportKey] = sport;
                    } else {
                        $scope[source].push(sport);
                    }
                } else {
                    $scope[source].push(sport);
                }

            });

            if (isSelectedCentralViewTogglable()) {
                if (!subId || !$scope[source].length) {
                    return;
                }

                var region = angular.extend(
                    {},
                    {
                        type: source == 'centerViewLiveData' ? 1 : 0,
                        isClosed: false,
                        'region': $scope[source][0].region[$scope[source][0].regions[0].id].id,
                        'sport': $scope[source][0].id
                    }
                );

                $scope.toggleItem(region);
            }
        }
    }

    function updateLinkedGames (sport) {
        angular.forEach(sport.region, function (region) {
            if (!region || !region.exclude_ids.length) {
                return;
            }

            var where = {
                type: Config.main.GmsPlatform ? 1 : {'@in': [0, 2]},
                game: {'@in': region.exclude_ids}
            };

            var request = generateRequest(where);

            $scope.pointerGames = $scope.pointerGames ? $scope.pointerGames : {};
            $scope.pointerGamesCompetition = $scope.pointerGamesCompetition ? $scope.pointerGamesCompetition : {};

            connectionService.subscribe(request, function (data, subId) {
                if (subId) {
                    connectionSubIds[subId] = subId;
                }
                $scope.pointerGames[region.id] = [];
                $scope.pointerGamesCompetition[region.id] = [];
                processCenterViewData(data, subId, function (sport) {},  function (game, competition) {
                    $scope.pointerGamesCompetition[region.id][game.id] = competition;
                    $scope.pointerGames[region.id][game.id] = game;
                });

            });
        });
    }

    function updateCentralViewWithExpandedRegionFactory (source, callback) {

        return function updateCentralViewWithExpandedRegion(data, subId) {
            if (subId && data.sport) {
                var sportKeys = Object.keys(data.sport);
                if (sportKeys.length) {
                    var regionKeys = Object.keys(data.sport[sportKeys[0]].region);
                    expandedRegionSubIds[data.sport[sportKeys[0]].region[regionKeys[0]].id] = subId;
                }
            }
            $scope.pointerIds = $scope.pointerIds || {};

            processCenterViewData(data, subId, function (sport) {
                angular.forEach($scope[source], function (templateSport) {
                    if (templateSport.id !== sport.id) {
                        return;
                    }

                    angular.forEach(templateSport.region, function (region, key) {
                        if (sport.region[sport.regions[0].id].id == region.id) {
                            // replace (initially loaded) light region info with fully loaded data
                            sport.region[sport.regions[0].id].isLoading = false;

                            var mergedRegion = angular.extend({}, region, sport.region[sport.regions[0].id]);
                            angular.forEach(mergedRegion, function (mergedRegionValue, mergedRegionKey) {
                                templateSport.region[key][mergedRegionKey] = mergedRegionValue;
                            });
                        }
                    });
                });

                callback && callback(sport);

                $scope.centerViewLoading = false;
            });
        }
    }

    function processCenterViewData (data, subId, sportCallback, gameCallback) {
        var sportCount = 0;

        angular.forEach(data.sport, function (sport) {
            sport.regions = Utils.objectToArray(sport.region, false, ['id', 'order']);
            sport.regions.sort(Utils.orderSorting);

            angular.forEach(sport.region, function (region) {
                // by default all regions are closed
                // (see below this loop, when we're opening first region)
                if (subId) {
                    region.regionListClosed = true;
                }

                region.isLoading = false;

                if (region.competition) {
                    region.competitions = Utils.objectToArray(region.competition, false, ['id', 'order']);
                    region.competitions.sort(Utils.orderSorting);
                }

                region.exclude_ids = [];

                angular.forEach(region.competition, function (competition) {
                    angular.forEach(competition.game, function (game) {
                        competition.filteredMarkets = [];

                        game.sport = {id: sport.id, alias: sport.alias, name: sport.name};
                        game.region = {id: region.id, name: region.name};
                        game.competition = {id: competition.id, order: competition.order, name: competition.name};
                        game.firstMarket = $filter('firstElement')(game.market);
                        game.additionalEvents = Config.main.showEventsCountInMoreLink ? game.events_count : game.markets_count;

                        game.filteredMarkets = Utils.groupByItemProperty(game.market, 'type');
                        angular.forEach(game.filteredMarkets, function (marketGroup, id) {
                            competition.filteredMarkets.push(marketGroup[0]);

                            if (marketGroup.length > 1 && marketGroup[0].base) {
                                angular.forEach(marketGroup, function (market) {
                                    if (!market.col_count) {
                                        market.col_count = Object.keys(market.event).length;
                                    }

                                    if (market.base === Utils.getDefaultSelectedMarketBase(marketGroup)) {
                                        marketGroup.events = Utils.objectToArray(market.event);
                                    }
                                });
                            } else {
                                marketGroup.events = Utils.objectToArray(marketGroup[0].event);

                                angular.forEach(marketGroup, function (market) {
                                    if (!market.col_count) {
                                        market.col_count = Object.keys(market.event).length;
                                    }
                                });
                            }

                            marketGroup.events.sort(function (a, b) {
                                return a.order - b.order;
                            });

                            if (marketGroup.events.length === 2) {
                                marketGroup.events.splice(1, 0, {});
                            }

                            angular.forEach(marketGroup.events, function (event, index) {
                                if (!event.name) {
                                    // remove events without name from filtered markets
                                    marketGroup.events.splice(index, 1);
                                    return;
                                }

                                event.name = $filter('improveName')(event.name, game);
                            });
                        });

                        gameCallback && gameCallback(game, competition);

                        if (game.exclude_ids) {
                            region.exclude_ids.push(game.exclude_ids);
                        }
                    });

                    competition.games = Utils.twoParamsSorting(Utils.objectToArray(competition.game, false, ['id', 'start_ts']), ['start_ts', 'id']);

                    var competitionTotalMarketCount = Object.keys(competition.filteredMarkets).length;
                    competition.filteredMarketsCount = competitionTotalMarketCount;
                    competition.moreFilteredMarketsCount = competitionTotalMarketCount > 3 ? competitionTotalMarketCount - 3 : 0;
                });
            });

            sportCount++;

            if (sportCount === 1) {
                // mark first region as open
                if (subId) {
                    sport.region[sport.regions[0].id].regionListClosed = false;
                }

                if (isSelectedCentralViewTogglable()) {
                    sport.region[sport.regions[0].id].isLoading = true;
                }
            }

            sportCallback(sport);
        });
    }

    function generateRequest (where, whatFields) {
        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias'],
                'region': ['id', 'name', 'order'],
                'competition': ['id', 'name', 'order'],
                'game': [
                    'id', 'start_ts', 'team1_name', 'team2_name',
                    'team1_external_id', 'team2_external_id', 'type', 'info',
                    'events_count', 'markets_count', 'extra', 'is_blocked',
                    'exclude_ids', 'is_stat_available', 'game_number', 'game_external_id', 'is_live'
                ],
                'event': ['id', 'price', 'type', 'name', 'order', 'base'],
                'market': ['type', 'express_id', 'name', 'base', 'order']
            },
            'where': {
                'game': {not_in_sportsbook: 0}
            }
        };

        if (whatFields && !whatFields['competition']) {
            delete request['what']['competition'];
        }

        if (whatFields && !whatFields['game']) {
            delete request['what']['game'];
        }

        if (whatFields && !whatFields['event']) {
            delete request['what']['event'];
        }

        if (whatFields && !whatFields['market']) {
            delete request['what']['market'];
        }

        if (where.sport) {
            request.where['sport'] = {'id': where.sport};
        }

        if (where.region) {
            request.where['region'] = {'id': where.region};
        }

        if (where.competition) {
            request.where['competition'] = {'id': where.competition};
        }

        if (where.game) {
            request.where['game'].id = where.game;
        }

        if (where.type !== undefined) {
            if (where.game === undefined) {
                request.where.game = {'type': where.type};
            } else {
                request.where.game.type = where.type;
            }
        }

        if ($rootScope.myGames && $rootScope.myGames.length && Config.main.separateFavoritesInClassic) {
            request.where.game.id = {'@nin': $rootScope.myGames};
        }

        if (where.start_ts) {
            request.where.game["@or"] = [];
            request.where.game["@or"].push({start_ts: where.start_ts});
        }

        if (where.popularGames) {
            request.where[Config.main.loadPopularGamesForSportsBook.level] = {};
            request.where[Config.main.loadPopularGamesForSportsBook.level][Config.main.loadPopularGamesForSportsBook.type] = true;
        }

        if ($scope.selectedUpcomingPeriod) {
            request.where.game.start_ts = {'@now': {'@gte': 0, '@lt': $scope.selectedUpcomingPeriod * 3600}};
        } else if (Config.env.gameTimeFilter) {
            request.where.game.start_ts = Config.env.gameTimeFilter;
        }

        return request;
    }

    function stopRegionLoading(toggledItem) {
        var centerViewData = $scope[toggledItem.type == 1 ? 'centerViewLiveData' : 'centerViewPrematchData'];

        if (!centerViewData) {
            return;
        }

        for (var j = 0; j < centerViewData.length; j++) {
            if (centerViewData[j].id === toggledItem.sport) {
                centerViewData[j].region[toggledItem.region].isLoading = false;

                break;
            }
        }
    }

    var setMarketFactory = function setMarketFactory (type) {
        return function (market, competitionId) {
            $scope['selectedMarketFor' + type + 'Competition'][competitionId] = market;
        };
    };

    $scope.setLiveMarket = setMarketFactory('Live');
    $scope.setPrematchMarket = setMarketFactory('Prematch');

    var getMarketFactory = function getMarketFactory (type) {
        return function (competition) {
            var marketToReturn = $scope['selectedMarketFor' + type + 'Competition'][competition.id];

            if (!marketToReturn && competition.filteredMarketsCount) {
                var selectedItem = Utils.getItemBySubItemProperty(competition.filteredMarkets, 'type', ['P1XP2']);
                if (selectedItem) {
                    return selectedItem.P1XP2;
                } else {
                    return competition.filteredMarkets[0];
                }

            }

            return marketToReturn;
        }
    };

    $scope.getLiveMarket = getMarketFactory('Live');
    $scope.getPrematchMarket = getMarketFactory('Prematch');

    $scope.openGameView = function openGameView (game) {
        parentMainScope.selectedCentralView = 'gameView';
        $scope.liveGameLoading = true;

        // -1) init
        game.opened = true;
        var competition = game.competition;
        var region = game.region;
        var sport = game.sport;
        var request = {
            'source': 'betting',
            'what': {
                'game': [],
                'market': [],
                'event': []
            },
            'where': {'game': {'id': game.id}}
        };

        // 0) update breadcrumb
        $scope.updatePathInComboView(sport, region, competition, game);

        // 1) clean up previous subscriptions
        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        // 2) add game view data to scope, so that bet() can receive then from template
        $scope.game = game;
        $scope.competition = competition;
        $scope.region = region;
        $scope.sport = sport;

        // 3) request full game details
        connectionService.subscribe(request, function updateCentralGameView (response, subId) {
            if (subId) {
                connectionSubIds[subId] = subId;
            }

            response.game[game.id].availableMarketGroups = {};
            response.game[game.id].sport = {id: sport.id, alias: sport.alias, name: sport.name};
            response.game[game.id].region = {id: region.id};
            response.game[game.id].competition = {id: competition.id, name: competition.name};

            $scope.openGame = response.game[game.id];
            $scope.openGame.setsOffset = $scope.openGame.setsOffset || 0;

            // if teams shirt colors equal we change them to default colors
            if ($scope.openGame.info && $scope.openGame.info.shirt1_color === $scope.openGame.info.shirt2_color) {
                $scope.openGame.info.shirt1_color = "ccc";
                $scope.openGame.info.shirt2_color = "f00";
            }

            if ($scope.openGame.type === 1) {
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
                if ($scope.openGame.video_data === undefined) {
                    $scope.openGame.video_data = null; }//not to call this several times before getVideoData fills the field
                /*if ($scope.pinnedGames && !$scope.pinnedGames[$scope.openGame.id]) {*/
                GameInfo.getVideoData($scope.openGame);
                if ($scope.enlargedGame && $scope.enlargedGame.id !== $scope.openGame.id) {
                    $scope.enlargedGame = $scope.openGame;
                }
                /*} else {
                 $scope.openGame.activeFieldType = 'field';
                 }*/

            }

            if (hasVideo && (Config.env.authorized || !$scope.openGame.has_animation) && $scope.openGame.activeFieldType === undefined) {
                $scope.openGame.activeFieldType = 'video';
            } else if ($scope.openGame.activeFieldType === undefined) {
                $scope.openGame.activeFieldType = 'field';
            }

            // move to GameInfo service and pass $scope.openGame
            GameInfo.updateOpenGameTextInfo($scope.openGame);

            $scope.$emit('animation.video.available', $scope.openGame);

            if ($scope.openGame) {
                $scope.openGame.markets = Utils.objectToArray(Utils.groupByItemProperties($scope.openGame.market, ['type', 'name']));

                if ($scope.openGame.markets) {
                    $scope.openGame.markets.sort(function (a, b) {
                        return a[0].order - b[0].order;
                    });
                    angular.forEach($scope.openGame.markets, function (groupedMarkets) {
                        groupedMarkets[0].name = $filter('improveName')(groupedMarkets[0].name, $scope.openGame);

                        if(groupedMarkets[0].type) {
                            groupedMarkets[0].fullType = (groupedMarkets[0].type || '') + (groupedMarkets[0].period || '');
                        }
                    });
                }
            }
            $scope.liveGameLoading = false;
        });
    };

    $scope.changeStatsMode = function changeStatsMode() {
        $scope.flipMode = $scope.flipMode || 0;
        $scope.flipMode = ($scope.flipMode + 1) % 3;
    };

    $scope.toggleItem = function toggleItem(item) {
        if (!isSelectedCentralViewTogglable()) {
            stopRegionLoading(item);

            return;
        }

        if (!item.isClosed) {
            var where = angular.copy(item);
            where.region = item.region;

            if (parentMainScope.selectedCentralView === 'popularEvents') {
                where.popularGames = true;
            }

            if (parentMainScope.selectedCentralView === 'liveToday') {
                where.type = 2;
                where.start_ts = {
                    '@gte': Moment.get().add(0, 'days').startOf("day").unix(),
                    '@lt': Moment.get().add(0, 'days').endOf("day").unix()
                };
            }

            var request = generateRequest(where);

            if (parentMainScope.selectedCentralView === 'liveToday') {
                connectionService.subscribe(request, updateCentralPrematchViewWithExpandedRegionForLiveToday);
            } else if (item.type == 1) {
                connectionService.subscribe(request, updateCentralLiveViewWithExpandedRegion);
            } else {
                connectionService.subscribe(request, updateCentralPrematchViewWithExpandedRegion);
            }
        } else {
            stopRegionLoading(item);

            if (!expandedRegionSubIds[item.region]) {
                return;
            }

            connectionService.unsubscribe(expandedRegionSubIds[item.region]);
            delete expandedRegionSubIds[item.region];
        }
    };

    parentMainScope.$on('comboView.leftMenu.gameSelected', function (event, game) {
        if (game.opened && parentMainScope.selectedCentralView == 'gameView' && $scope.selectedGame && $scope.selectedGame.id == game.id && !game.force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        $scope.openGameView(game);
    });

    parentMainScope.$on('comboView.leftMenu.competitionSelected', function (event, response) {
        var competition = response.competition;

        if (competition.opened && parentMainScope.selectedCentralView == 'competition' && $scope.selectedCompetition && $scope.selectedCompetition.id == competition.id && !response.force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = false;
        var requestLive = generateRequest({'competition': competition.id, type: 1});
        var requestPrematch = generateRequest({'competition': competition.id, type: 0});

        parentMainScope.selectedCentralView = 'competition';
        $scope.mainHeaderTitle = competition.name;

        $scope.centerViewLoading = true;
        connectionService.subscribe(requestLive, updateCentralLiveView);
        connectionService.subscribe(requestPrematch, updateCentralPrematchView);

        $scope.updatePathInComboView(response.sport, response.region, competition);
    });

    parentMainScope.$on('comboView.leftMenu.regionSelected', function (event, response) {
        var region = response.region;

        if (region.opened && parentMainScope.selectedCentralView === 'region' && $scope.selectedRegion && $scope.selectedRegion.id == region.id && !response.force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        $scope.centerViewLoading = true;
        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = false;
        var requestLive = generateRequest({'region': region.id, type: 1});
        var requestPrematch = generateRequest({'region': region.id, type: 0});

        parentMainScope.selectedCentralView = 'region';
        $scope.mainHeaderTitle = region.name;

        connectionService.subscribe(requestLive, updateCentralLiveView);
        connectionService.subscribe(requestPrematch, updateCentralPrematchView);

        $scope.updatePathInComboView(response.sport, region);
    });

    parentMainScope.$on('comboView.leftMenu.sportSelected', function (event, response) {
        var sport = response.sport;

        if (sport.opened && parentMainScope.selectedCentralView === 'sport' && $scope.selectedSport && $scope.selectedSport.id === sport.id && !response.force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        $scope.centerViewLoading = true;
        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = false;

        var requestLive = generateRequest({'sport': sport.id, type: 1}, ['sport', 'region']);
        var requestPrematch = generateRequest({'sport': sport.id, type: 0}, ['sport', 'region']);

        parentMainScope.selectedCentralView = 'sport';
        $scope.mainHeaderTitle = sport.name;

        connectionService.subscribe(requestLive, updateCentralLiveView);
        connectionService.subscribe(requestPrematch, updateCentralPrematchView);

        $scope.updatePathInComboView(sport);
    });

    parentMainScope.$on('comboView.leftMenu.liveTodaySelected', function (event, data) {
        var force = data && data.force;
        if (parentMainScope.selectedCentralView === 'liveToday' && !force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        $scope.centerViewLoading = true;
        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = true;

        var where = {
            type: 2,
            start_ts: {
                '@gte': Moment.get().add(0, 'days').startOf("day").unix(),
                '@lt': Moment.get().add(0, 'days').endOf("day").unix()

            }
        };

        var request = generateRequest(where, ['sport', 'region']);

        parentMainScope.selectedCentralView = 'liveToday';
        $scope.mainHeaderTitle = 'LIVE TODAY';

        connectionService.subscribe(request, updateCentralPrematchView);

        $scope.updatePathInComboView({name: 'Live Today'});
    });

    $scope.$on('euro2016.comboView.leftMenu.liveNow', function (event, data) {
        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        $scope.centerViewLoading = true;
        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = true;

        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id', 'name', 'alias', 'order'],
                'region': ['id', 'name', 'alias', 'order']
            },
            'where': {'game': {'type': 1}}
        };

        if (!Config.main.GmsPlatform) {
            request.where.sport = {'id': {'@nin': GameInfo.VIRTUAL_SPORT_IDS}};
        }
        request.where.game.not_in_sportsbook = 0;

        connectionService.subscribe(request, updateCentralLiveView);
    });

    parentMainScope.$on('comboView.leftMenu.popularEventsSelected', function (event, data) {
        var force = data && data.force;
        if (parentMainScope.selectedCentralView === 'popularEvents' && !force) {
            return;
        }

        $scope['centerViewLiveData'] = [];
        $scope['centerViewPrematchData'] = [];

        connectionService.unsubscribe(connectionSubIds);
        connectionService.unsubscribe(expandedRegionSubIds);

        $scope.hideLiveEvents = true;

        var where = {popularGames: true};
        var request = generateRequest(where, ['sport', 'region']);

        parentMainScope.selectedCentralView = 'popularEvents';
        $scope.mainHeaderTitle = 'POPULAR';

        $scope.centerViewLoading = true;
        connectionService.subscribe(request, updateCentralPrematchView);

        $scope.updatePathInComboView({name: 'Popular Events'});
    });

    parentMainScope.$on('comboView.timeFilter.changed', function (event) {
        var eventForView = {
            'liveToday': 'liveTodaySelected',
            'popularEvents': 'popularEventsSelected',
            'sport': 'sportSelected',
            'region': 'regionSelected',
            'competition': 'competitionSelected'
        };

        var data = {
            'sport': $scope.selectedSport,
            'region': $scope.selectedRegion,
            'competition': $scope.selectedCompetition
        };

        data.force = true;

        $scope.$emit('comboView.leftMenu.' + eventForView[parentMainScope.selectedCentralView], data);
    });

    $scope.$on('login.loggedIn', function () {
        if ($scope.openGame) {
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
    });

    //and unavailable when he logs out
    $scope.$on('login.loggedOut', function () {
        $scope.openGame.video_data = null;
    });

    //synchronize video with user balance
    $scope.$watch('profile.balance', function (newValue, oldValue) {
        if ($scope.openGame) {
            return;
        }

        if (newValue === 0 && $rootScope.profile.initial_balance === 0) {
            $scope.openGame.video_data = null;
        } else if (oldValue === 0 && newValue > 0 && !$scope.openGame.video_data) {
            GameInfo.getVideoData($scope.openGame);
        }
    });

    $scope.selectSport = function selectSport (sport) {
        $scope.$emit(
            'comboView.leftMenu.sportSelected',
            {sport: sport}
        );
    };

    $scope.selectRegion = function selectRegion (sport, region) {
        $scope.$emit(
            'comboView.leftMenu.regionSelected',
            {
                sport: sport,
                region: region
            }
        );
    };

    $scope.selectCompetition = function selectCompetition (sport, region, competition) {
        $scope.$emit(
            'comboView.leftMenu.competitionSelected',
            {
                sport: sport,
                region: region,
                competition: competition
            }
        );
    };

    $scope.toggleSports = function toggleSports (sportId) {
        if (sportId) {
            $scope.sportBlock[sportId].expanded = !$scope.sportBlock[sportId].expanded;
            checkToggleAllStatus();
        } else {
            $scope.expandedAll = !$scope.expandedAll;
            angular.forEach($scope.sportBlock, function (item) {
                item.expanded = $scope.expandedAll;
            });
        }
    };


    function checkToggleAllStatus() {
        var expandedCount = 0;
        angular.forEach($scope.sportBlock, function (item) {
            if (item.expanded) {
                expandedCount++;
            }
        });

        if (expandedCount === $scope.centerViewLiveData.length) {
            $scope.expandedAll = true;
        } else if (!expandedCount) {
            $scope.expandedAll = false;
        }
    }

}]);
