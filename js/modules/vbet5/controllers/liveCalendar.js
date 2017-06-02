/**
 * @ngdoc controller
 * @name vbet5.controller:LiveCalendarController
 * @description
 * LiveCalendarController controller
 */
angular.module('vbet5.betting').controller('LiveCalendarController', ['$scope', '$rootScope', '$location', '$window', 'ConnectionService', 'Zergling', 'Moment', 'Translator', 'Utils', 'Config', 'GameInfo',
    function ($scope, $rootScope, $location, $window, ConnectionService, Zergling, Moment, Translator, Utils, Config, GameInfo) {
        'use strict';
        $rootScope.footerMovable = true;

        var linkedGameSubId, i, excludeIdsKey;
        var excludeIds, liveCalendarSelectedDaysSavedState, initialLoadDone = false;
        var connectionService = new ConnectionService($scope);

        $scope.prematchFlow = Config.main.calendarPrematchSelection;
        $scope.liveCalendarSelectedSports = {};
        $scope.liveCalendarSelectedDays = {};
        $scope.dayFilter = [];
        $scope.marketEvents = {};
        $scope.collapsedSports = {};
        $scope.totalGamesCount = 0;
        $scope.sporsSelected = false;
        $scope.isEventInBetSlip = GameInfo.isEventInBetSlip;
        $scope.options = {
            allSportsSelected: false,
            allDaysSelected: false
        }

        /**
         * @ngdoc method
         * @name doInitialLoad
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  selects initial values for sport and day and loads games
         */
        function doInitialLoad() {
            if ($scope.leftMenuSports && $scope.leftMenuSports.length > 0) {
                $scope.liveCalendarSelectedSports[$scope.leftMenuSports[0].id] = true;
                $scope.selectedSports = [$scope.leftMenuSports[0].id];
                $scope.liveCalendarSelectedDays[0] = true;
                $scope.toggleDay();
                initialLoadDone = true;
            }
        }

        /**
         * @ngdoc method
         * @name updateLeftMenu
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  updates sports object and does the initial load
         * @param {Object} data sports data object
         */
        function updateLeftMenu(data) {
            console.log('updateLeftMenu', data);
            $scope.leftMenuSports = Utils.objectToArray(data.sport).sort(Utils.orderSorting);
            if (!initialLoadDone) {
                doInitialLoad();
            }
        }


        function updateLinkedGames(data) {
            angular.forEach(data.sport, function (sport) {
                angular.forEach(sport.region, function (region) {
                    angular.forEach(region.competition, function (competition) {
                        angular.forEach(competition.game, function (game) {
                            var groupedMarkets = Utils.groupByItemProperty(game.market, 'type');
                            var gameObj = {
                                sport: {id: sport.id},
                                region: {id: region.id},
                                competition: {id: competition.id},
                                id: game.id,
                                team1_name: game.team1_name,
                                team2_name: game.team2_name,
                                events_count: game.events_count,
                                markets_count: game.markets_count,
                                type: game.type
                            };
                            if (groupedMarkets.P1XP2 !== undefined && groupedMarkets.P1XP2[0] && groupedMarkets.P1XP2[0].event) {
                                $scope.marketEvents[game.id] = {
                                    events: Utils.groupByItemProperty(groupedMarkets.P1XP2[0].event, 'type'),
                                    market: groupedMarkets.P1XP2[0],
                                    game: gameObj
                                };
                            } else if (groupedMarkets.P1P2 !== undefined && groupedMarkets.P1P2[0] && groupedMarkets.P1P2[0].event) {
                                $scope.marketEvents[game.id] = {
                                    events: Utils.groupByItemProperty(groupedMarkets.P1P2[0].event, 'type'),
                                    market: groupedMarkets.P1P2[0],
                                    game: gameObj
                                };
                            }
                        });
                    });
                });
            });
        }

        function getLinkedGames() {
            if (linkedGameSubId) {
                Zergling.unsubscribe(linkedGameSubId);
            }
            var request = {
                'source': 'betting',
                'what': {
                    'sport': ['id', 'name', 'alias', 'order'],
                    'competition': ['id'],
                    'region': ['id', 'name', 'alias'],
                    'game': ['id', 'team1_name', 'team2_name', 'type', 'events_count', 'markets_count', 'is_stat_available', 'team1_external_id', 'team2_external_id', 'is_live'],
                    'market': ['type', 'name', 'id', 'base', 'express_id'],
                    'event': ['type', 'id', 'price', 'name', 'base']
                },
                'where': {
                    'game': {
                        'id': {'@in': excludeIds},
                        'not_in_sportsbook': 0
                    },
                    'market': {
                        'type': {'@in': ['P1XP2', 'P1P2']}
                    }
                }
            };

            connectionService.subscribe(
                request,
                updateLinkedGames,
                {
                    'thenCallback': function (result) {
                        if (result.subid) {
                            linkedGameSubId = result.subid;
                        }
                    }
                }
            );
        }

        /**
         * @ngdoc method
         * @name updateGames
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  creates main game objects array from received data
         *
         * @param {Object} data games data object
         */
        function updateGames(data) {
            console.log('updateGames', data);
            excludeIds = [];
            $scope.liveCalendarGames = [];
            $scope.liveCalendarAllGames = [];

            angular.forEach(data.sport, function (sport) {
                var allGames = [];
                angular.forEach(sport.region, function (region) {
                    angular.forEach(region.competition, function (competition) {
                        angular.forEach(competition.game, function (game) {
                            game.sport = {id: sport.id, alias: sport.alias, name: sport.name};
                            game.region = {id: region.id, name: region.name, alias: region.alias};
                            game.title = game.team1_name + " - " + game.team2_name;
                            game.competition = {id: competition.id, name: competition.name};
                            game.game_text_info = (game.info && game.info.add_info ? game.info.add_info : '') || (game.text_info ? game.text_info.split(';')[0] : '');
                            for (i = 0; i < $scope.dayFilter.length - 1; i++) {
                                if (game.start_ts >= $scope.dayFilter[i].from && game.start_ts < $scope.dayFilter[i].to) {
                                    game.day = $scope.dayFilter[i];
                                    game.dayOffset = $scope.dayFilter[i].id;
                                }
                            }
                            if (!Config.main.GmsPlatform && game.exclude_ids || Config.main.GmsPlatform && game.id) {
                                game.pointerId = Config.main.GmsPlatform ? game.id : game.exclude_ids;
                                excludeIds.push(game.pointerId);
                            } else {
                                game.pointerId = game.id;
                            }
                            allGames.push(game);
                            $scope.liveCalendarAllGames.push(game);
                        });
                    });
                });
                if (excludeIds.length > 0 && !$scope.prematchFlow) {
                    if (excludeIdsKey !== excludeIds.join()) {
                        getLinkedGames();
                        excludeIdsKey = excludeIds.join();
                    }
                } else if ($scope.prematchFlow) {
                    updateLinkedGames(data);
                }
                $scope.liveCalendarGames.push({sport: sport, order: sport.order, games: Utils.groupByItemProperty(allGames, 'dayOffset')});
            });
            $scope.liveCalendarGames.sort(Utils.orderSorting);
        }

        /**
         * @ngdoc method
         * @name updateGamesCount
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  requests games count
         *
         * @param {Object} data games data object
         */
        function updateGamesCount() {

            var leftMenuSportsIds = [];
            angular.forEach($scope.leftMenuSports, function (sport) {
                leftMenuSportsIds.push(sport.id);
            });

            var request = {
                "source": "betting",
                "what": {
                    "game": "@count"
                },
                'where': {
                    'sport': {
                        'id': {'@in': leftMenuSportsIds}
                    },
                    'game': {
                        'type': {'@in': [0, 2]}
                    }
                }
            };

            Zergling.get(request).then(function (result) {
                if (result.data) {
                    $scope.totalGamesCount = result.data.game;
                }
            })['catch'](function (reason) {
                console.log('Error:'); console.log(reason);
            });
        }

        /**
         * @ngdoc method
         * @name loadLeftMenu
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  loads the sports menu data
         */
        function loadLeftMenu() {
            $scope.leftMenuIsLoading = true;
            var request = {
                'source': 'betting',
                'what': {'sport': ['id', 'name', 'alias', 'order']},
                'where': {
                    'game': {
                        'type': $scope.prematchFlow ? 0 : 2
                    }
                }
            };

            connectionService.subscribe(
                request,
                updateLeftMenu,
                {
                    'thenCallback': function () {
                        $scope.leftMenuIsLoading = false;
                    }
                }
            );
        }

        $scope.$on('$destroy', function () {
            if (!linkedGameSubId) {
                Zergling.unsubscribe(linkedGameSubId);
            }
        });

        /**
         * @ngdoc method
         * @name loadSelectedGames
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  loads selected games according to sport and time filters
         */
        function loadSelectedGames() {
            $scope.gamesAreLoading = true;

            var request = {
                'source': 'betting',
                'what': {
                    'sport': ['id', 'name', 'alias', 'order'],
                    'region': ['id', 'name', 'alias'],
                    'competition': ['id', 'name'],
                    'game': ['id', 'type', 'is_blocked', 'game_number', 'team1_name', 'team2_name', 'start_ts', 'title', 'info', 'text_info', 'events_count', 'exclude_ids', 'is_stat_available', 'team1_external_id', 'team2_external_id', 'is_live']
                },
                'where': {
                    'sport': {'id': {'@in': $scope.selectedSports}},
                    'game': {
                        'type': $scope.prematchFlow ? 0 : 2
                    }
                }
            };

            // if prematch selection
            if ($scope.prematchFlow) {
                request.what.market = ['type', 'name', 'id', 'base', 'express_id'];
                request.what.event = ['type', 'id', 'price', 'name', 'base'];
                request.where.market = {type: {'@in': ['P1XP2', 'P1P2']}};
            }

            if ($scope.selectedDays && $scope.selectedDays.length > 0) {
                request.where.game['@or'] = $scope.selectedDays;
            }

            request.where.game.not_in_sportsbook = 0;

            connectionService.subscribe(
                request,
                updateGames,
                {
                    'thenCallback': function () {
                        $scope.gamesAreLoading = false;
                    }
                }
            );

            if (Config.main.liveCalendarView === 'oneDaySelectionView') {
                updateSportsLabel();
            }
        }

        /**
         * @ngdoc method
         * @name bet
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  sends a message to betslip to add a bet
         *
         * @param {Object} event event object
         * @param {Object} market event's market object
         * @param {Object} openGame game object
         * @param {String} [oddType] odd type (odd or sp)
         */
        $scope.bet = function bet(event, market, openGame, oddType) {
            if (!event) {
                return;
            }
            oddType = oddType || 'odd';
            var game = Utils.clone(openGame);
            console.log('betsslip', arguments);
            $rootScope.$broadcast('bet', {event: event, market: market, game: game, oddType: oddType});
        };

        $scope.openMore = function openMore(sportId, game) {
            if (!game) {
                return;
            }
            $location.url('/sport/?type=0&sport=' + sportId + '&region=' + game.region.id + '&competition=' + game.competition.id + '&game=' + game.id);
        };

        $scope.openSport = function openMore(live) {
            $location.url('/sport/?type=' + live);
        };

        /**
         * @ngdoc method
         * @name toggleSport
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  updates sport filter and loads corresponding data
         */
        $scope.toggleSport = function toggleSport(allSportsCheckbox) {
            var sports = [], selectedCount = 0;

            if (allSportsCheckbox) {
                $scope.liveCalendarSelectedSports = {};
                angular.forEach($scope.leftMenuSports, function (sport) {
                    $scope.liveCalendarSelectedSports[sport.id] = $scope.options.allSportsSelected;
                });
            }

            angular.forEach($scope.liveCalendarSelectedSports, function (selected, id) {
                if (selected) {
                    selectedCount++;
                    sports.push(parseInt(id, 10));
                }
            });

            if (selectedCount) {
                $scope.options.allSportsSelected = $scope.leftMenuSports.length === selectedCount;
            } else {
                sports.push($scope.leftMenuSports[0].id);
                $scope.liveCalendarSelectedSports[$scope.leftMenuSports[0].id] = true;
            }

            $scope.selectedSports = sports;
            loadSelectedGames();
        };

        /**
         * @ngdoc method
         * @name toggleDayAll
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  toggles all days or restores selection, then load corresponding data
         */
        $scope.toggleDayAll = function toggleDayAll() {
            if ($scope.options.allDaysSelected) {
                liveCalendarSelectedDaysSavedState = Utils.clone($scope.liveCalendarSelectedDays);
                $scope.liveCalendarSelectedDays = {0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true};
            } else {
                $scope.liveCalendarSelectedDays = liveCalendarSelectedDaysSavedState;
            }
            $scope.toggleDay();
        };

        /**
         * @ngdoc method
         * @name printCoupon
         * @methodOf vbet5.controller:LiveCalendarController
         * @description prints the coupon
         */
        $scope.printCoupon = function printCoupon() {
            var popup = $window.open('#/popup/?action=couponprintpreview&anticache=' + Math.floor((Math.random() * 1000)), Config.main.skin + 'couponprintpreview.popup', "scrollbars=1,width=1000,height=600,resizable=yes");
            popup.topLevelLiveCalendarGames = $scope.liveCalendarGames;
            popup.topLevelMarketEvents = $scope.marketEvents;
        };

        /**
         * @ngdoc method
         * @name toggleDay
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  updates time filter and loads corresponding data
         */
        $scope.toggleDay = function toggleDay(updateAllCheckbox) {
            var selectedCount = 0;

            if (updateAllCheckbox) {
                angular.forEach($scope.liveCalendarSelectedDays, function(selectedDay) {
                    if (selectedDay) {
                        selectedCount++;
                    }
                });
                if (selectedCount === 0) {
                    $scope.liveCalendarSelectedDays[0] = true;
                    $scope.toggleDay(true);
                    return;
                }
                $scope.options.allDaysSelected = selectedCount >= $scope.dayFilter.length;
            }

            var days = [];
            //console.table($scope.dayFilter);
            angular.forEach($scope.dayFilter, function (selected, id) {
                if ($scope.liveCalendarSelectedDays[id]) {
                    if ($scope.liveCalendarSelectedDays[id - 1]) {
                        days[days.length - 1] = {'@gte': days[days.length - 1]['@gte'], '@lt': $scope.dayFilter[id].to};
                    } else {
                        days.push({'@gte': $scope.dayFilter[id].from, '@lt': $scope.dayFilter[id].to});
                    }
                }
            });
            $scope.selectedDays = days.map(function (element) {
                return {'start_ts': element};
            });
            console.log($scope.liveCalendarSelectedDays);
            loadSelectedGames();
        };

        /**
         * @ngdoc method
         * @name selectDay
         * @methodOf vbet5.controller:LiveCalendarController
         * @description select specific day by index (used in new livecalendar)
         */
        $scope.selectDay = function selectDay(dayIndex) {
            $scope.liveCalendarSelectedDays = {};
            $scope.liveCalendarSelectedDays[dayIndex] = true;
            $scope.options.allDaysSelected = false;
            $scope.toggleDay();
        };


        /**
         * @ngdoc method
         * @name togglePrematch
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  updates prematch pin button and loads corresponding data
         */
        $scope.togglePrematch = function togglePrematch() {
            $scope.prematchFlow = !$scope.prematchFlow;
            loadSelectedGames();
        };

        /**
         * @ngdoc method
         * @name openStatistics
         * @methodOf vbet5.controller:LiveCalendarController
         * @description
         * Opens statistics in popup window
         *
         * @param {Object} game game object
         */
        $scope.openStatistics = function openStatistics(game) {
            $window.open(GameInfo.getStatsLink(game), game.id, "width=940,height=600,resizable=yes");
        };

        /**
         * @ngdoc method
         * @name updateSportsLabel
         * @methodOf vbet5.controller:LiveCalendarController
         * @description
         * Generates readable lable for all sports dropdown
         */
        function updateSportsLabel() {
            $scope.sportsSelected = false;
            if (!$scope.liveCalendarSelectedSports || !$scope.leftMenuSports) {
                $scope.sportsLabel = '';
            }
            var count = 0, name = '';
            angular.forEach($scope.leftMenuSports, function (value) {
                if ($scope.liveCalendarSelectedSports[value.id]) {
                    count++;
                    name = value.name;
                }
            });
            $scope.sportsSelected = true;
            if (count === 1) {
                $scope.sportsLabel =  name;
                return;
            }
            if (count === $scope.leftMenuSports.length) {
                $scope.sportsLabel =  Translator.get('All sports');
                return;
            }
            if (count > 1) {
                $scope.sportsLabel =  Translator.get('Custom Selection');
                return;
            }
            $scope.sportsSelected = false;
            $scope.sportsLabel =  Translator.get('No Selection');
        }

        /**
         * @ngdoc method
         * @name initLiveCalendar
         * @methodOf vbet5.controller:LiveCalendarController
         * @description  does the initial load
         */
        function initLiveCalendar() {
            $scope.setTitle('LiveCalendar');
            loadLeftMenu();
            for (i = 0; i < 7; i++) {
                $scope.dayFilter.push({
                    to: Moment.get().add(i, 'days').endOf("day").unix(),
                    from: Moment.get().add(i, 'days').startOf("day").unix(),
                    id: i,
                    name: Moment.get().add(i, 'days').startOf("day").format("dd D")
                });
            }
        }

        initLiveCalendar();
    }]);