CASINO.directive('casinoLobby', ['$rootScope', '$interval', 'Zergling', 'CConfig', 'Translator', function($rootScope, $interval, Zergling, CConfig, Translator) {
    'use strict';

    return{
        restrict: 'AE',
        replace: true,
        templateUrl: 'optional_modules/casino/templates/livedealer/tables.html',
        link: function(scope, element, attr) {
            var timeoutPromise;

            scope.sortAscending;
            scope.visibleMenuLength = 5;
            scope.lobbyDataLoading = true;
            scope.selectedLimits = {};
            scope.selectedGame = {id: attr.activeGameId == 'all' ? attr.activeGameId : parseInt(attr.activeGameId)};
            scope.lobbySubMenuOpen = false;
            scope.sortingProperty = null;

            function init() {
                getCasinoLobbyData();
                timeoutPromise = $interval(getCasinoLobbyData, CConfig.liveCasino.lobby.updateInterval || 5000);
            }

            //Get lobby data from swarm
            function getCasinoLobbyData() {
               // scope.lobbyDataLoading = true;
                var request = {
                    currency: $rootScope.profile ? $rootScope.profile.currency_name :  $rootScope.conf.registration.defaultCurrency || 'USD',
                    'skin_host': CConfig.cUrlPrefix
                };
                Zergling.get(request, 'get_live_game_lobby').then(function(response) {
                    if(response && response.details) {
                        updateCasinoLobbyData(response.details);
                        scope.lobbyDataLoading = false;
                    }
                })['catch'](function(error) {
                    console.log(error)
                });
            }

            /**
             * @description while lobby popup is open keep updating data based on given update interval
             */
            function updateCasinoLobbyData(data) {
                scope.allTables = [];
                scope.casinoLobby = data;
                var allGamesItem = {
                    GameIds: ['all'],
                    GroupName: 'All Tables',
                    Tables: []
                };
                var noActiveTab = true;
                if(angular.isArray(scope.casinoLobby)) {
                    scope.casinoLobby.unshift(allGamesItem);
                    for (var i = 0, lobbyLength = scope.casinoLobby.length; i < lobbyLength; i++) {
                        scope.casinoLobby[i].GameName = scope.casinoLobby[i].GroupName;
                        if(scope.casinoLobby[i].GameIds && scope.casinoLobby[i].GameIds.indexOf(scope.selectedGame.id) != -1) {
                            scope.selectedGame.name = scope.casinoLobby[i].GroupName;
                            noActiveTab = false;
                        }

                        for(var j = 0, tablesLength = scope.casinoLobby[i].Tables.length; j < tablesLength; j++) {
                            var table = scope.casinoLobby[i].Tables[j];
                            //table.gameId = table.GameId;
                            //table.gameName = scope.casinoLobby[i].GroupName;
                            table.groupName = scope.casinoLobby[i].GroupName;
                            table.dealerImg = table.DealerImageUrl;

                            if (Translator.translationExists('Lobby ' + table.GameName)) {
                                table.GameName = Translator.get('Lobby ' + table.GameName);
                            }


                            if(!scope.selectedLimits[table.TableId]) {
                                scope.selectedLimits[table.TableId] = scope.casinoLobby[i].Tables[j].Limits[0];
                            }
                            table.selectedLimit = scope.selectedLimits[table.TableId];
                            scope.allTables.push(table);
                        }
                    }

                    if (noActiveTab) {
                        scope.selectedGame.id = 'all';
                    }
                    if (scope.sortAscending !== undefined) {
                        sortGames(scope.sortingProperty, scope.sortAscending);
                    }
                } else {
                    scope.casinoLobby = undefined;
                }

                console.log('Lobby updating');
            }

            /**
             * @description generate iframe url when user selects a table
             */
            scope.selectTable = function selectTable(tableData) {
                var message = {};
                message.data = {
                    gameId : tableData.GameId,
                    tableId : tableData.TableId,
                    gameSelectedLimit: tableData.selectedLimit.LimitCategoryId,
                    provider : CConfig.liveCasino.lobby.provider
                };

                $rootScope.$broadcast('livedealer.redirectGame', message);
            };

            scope.selectLobbyGame = function selectLobbyGame(game) {
                scope.selectedGame.id = game.GameIds[0];
                scope.selectedGame.name = game.GameName;
                scope.lobbySubMenuOpen = false;
            };

            scope.toggleTablesSorting = function toggleTablesSorting(propertyName) {
                if(scope.sortingProperty !== propertyName) {
                    scope.sortingProperty = propertyName;
                    scope.sortAscending = true;
                } else {
                    scope.sortAscending = scope.sortAscending ? !scope.sortAscending : true;
                }
                sortGames(propertyName, scope.sortAscending);
            };

            /**
             * @description sorts lobby tables by the property
             * @param {String} propertyName the name of property to be sorted by
             * @param {Boolean} ascending
             */
            function sortGames(propertyName, ascending) {
                if(propertyName === 'Limits') {
                    scope.allTables.sort(function(a, b) {
                        if(ascending) {
                            if(a[propertyName][0].MinBetAmount < b[propertyName][0].MinBetAmount) return -1;
                            if(a[propertyName][0].MinBetAmount > b[propertyName][0].MinBetAmount) return 1;
                            return 0;
                        } else {
                            if(a[propertyName][0].MinBetAmount < b[propertyName][0].MinBetAmount) return 1;
                            if(a[propertyName][0].MinBetAmount > b[propertyName][0].MinBetAmount) return -1;
                            return 0;
                        }
                    });
                } else {
                    scope.allTables.sort(function(a, b) {
                        if(ascending) {
                            if(a[propertyName] < b[propertyName]) return -1;
                            if(a[propertyName] > b[propertyName]) return 1;
                            return 0;
                        } else {
                            if(a[propertyName] < b[propertyName]) return 1;
                            if(a[propertyName] > b[propertyName]) return -1;
                            return 0;
                        }
                    });
                }
            }

            scope.$on('$destroy', function () {
                $interval.cancel(timeoutPromise);
                getCasinoLobbyData = function getCasinoLobbyData() {};
            });

            init();
        }
    }
}]);
