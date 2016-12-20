/* global CASINO */
/**
 * @ngdoc service
 * @name CASINO.service:casinoManager
 * @description
 * Utility functions
 */

CASINO.service('casinoManager', ['$rootScope', '$window', '$sce', '$location', '$timeout', 'analytics', 'casinoData', 'Storage', 'DomHelper', 'Zergling', 'CConfig', 'Translator', function ($rootScope, $window, $sce, $location, $timeout, analytics, casinoData, Storage, DomHelper, Zergling, CConfig, Translator) {
    'use strict';
    var casinoManager = {};

    /**
     * @ngdoc method
     * @name toggleSaveToMyCasinoGames
     * @methodOf CASINO.service:casinoManager
     * @description send events for adds or removes(depending on if it's already there) game from 'my casino games'
     *
     * @param {Object} scope the rootScope
     * @param {Object} game Object
     */
    casinoManager.toggleSaveToMyCasinoGames = function toggleSaveToMyCasinoGames(scope, game) {
        var myCasinoGames = scope.myCasinoGames || [], i, j;
        for (i = 0, j = myCasinoGames.length; i < j; i += 1) {
            if (myCasinoGames[i].id === game.id) {
                scope.$broadcast('game.removeGameFromMyCasinoGames', game);
                break;
            }
        }
        if (j === myCasinoGames.length) {
            //game is not from myCasinoGames
            scope.$broadcast('game.addToMyCasinoGames', game);
        }
    };

    /**
     * @ngdoc method
     * @name togglePlayMode
     * @methodOf CASINO.service:casinoManager
     * @description
     *
     * @param {Object} scope the rootScope
     * @param {Object} gameInfo Object
     */
    casinoManager.togglePlayMode = function togglePlayMode (scope, gameInfo) {
        if (!$rootScope.env.authorized) {
            $rootScope.$broadcast("openLoginForm");

            var authWatcherPromise = scope.$watch('env.authorized', function (authorized){
                if (authorized) {
                    if (loginFormWatcherPromise) {
                        loginFormWatcherPromise();
                    }
                    if (authWatcherPromise) {
                        authWatcherPromise();
                    }
                    gameInfo.gameMode = 'real';
                    scope.refreshGame(gameInfo.id);
                }
            });

            var loginFormWatcherPromise = scope.$watch('env.showSlider', function (showSlider){
                if (!showSlider) {
                    if (loginFormWatcherPromise) {
                        loginFormWatcherPromise();
                    }
                    if (authWatcherPromise) {
                        authWatcherPromise();
                    }
                }
            });

            return;
        }
        gameInfo.gameMode = gameInfo.gameMode === 'fun' ? 'real' : 'fun';
        scope.refreshGame(gameInfo.id);
    };

    /**
     * @ngdoc method
     * @name refreshCasinoGame
     * @methodOf CASINO.service:casinoManager
     * @description find game by id in opened games and relaod it
     *
     * @param {Object} scope the scope
     * @param {Int} id gameInfo id
     */
    casinoManager.refreshCasinoGame = function refreshCasinoGame(scope, id) {
        var i , length = scope.gamesInfo.length;
        for (i = 0; i < length; i += 1) {
            if (scope.gamesInfo[i].id === id) {
                var mode = scope.gamesInfo[i].gameMode;
                var currentGame = scope.gamesInfo[i].game;
                var tableId = scope.gamesInfo[i].tableId;
                var limit = scope.gamesInfo[i].limit;
                var studio = scope.gamesInfo[i].studio;
                scope.gamesInfo[i] = {gameUrl: '', id: id, toAdd: true};
                scope.openGame(currentGame, mode, tableId, studio, limit);
                break;
            }
        }
    };

    /**
     * @ngdoc method
     * @name refreshOpenedGames
     * @methodOf CASINO.service:casinoManager
     * @description  if user logged in refresh open games that do not have mode "play for fun" and open in real mode, or
     *               if user logged out close games that opened in real mode
     *
     * @param {Object} scope the scope
     */
    casinoManager.refreshOpenedGames = function refreshOpenedGames(scope) {
        for (var i = 0, count = scope.gamesInfo.length; i < count; i += 1) {
            if (scope.gamesInfo[i].game) {
                if (scope.gamesInfo[i].game.id !== CConfig.backgammon.id || $rootScope.env.authorized) {
                    if (scope.gamesInfo[i].game.types.viewMode) {
                        var infoId = scope.gamesInfo[i].id;
                        var currentGame = scope.gamesInfo[i].game;
                        var tableId = scope.gamesInfo[i].tableId;
                        var studio = scope.gamesInfo[i].studio;
                        var gameMode = $rootScope.env.authorized ? 'real' : 'fun';
                        var limit = scope.gamesInfo[i].limit;
                        scope.gamesInfo[i] = {gameUrl: '', id: infoId, toAdd: true};
                        scope.openGame(currentGame, gameMode, tableId, studio, limit);
                    } else if (scope.gamesInfo[i].gameUrl !== '' && scope.gamesInfo[i].gameMode === 'real' && !$rootScope.env.authorized) {
                        scope.closeGame(scope.gamesInfo[i].id);
                    }
                }
            }
        }
    };

    /**
     * @ngdoc method
     * @name openPopUpWindow
     * @methodOf CASINO.service:casinoManager
     * @description  finds game object, then calculates the possible sizes of the popup window and opens casino game in there
     *
     * @param {String} id game id
     * @param {Object} scope the scope object
     */
    casinoManager.openPopUpWindow = function openPopUpWindow(scope, id) {
        var gameInfo, scale, scaleWidth, scaleHeight;
        var percent = 0.85, windowWidth = 900, windowHeight = 900; // initial size of popUp
        var screenResolution = DomHelper.getScreenResolution();
        for (var i = 0, count = scope.gamesInfo.length; i < count; i += 1) {
            if (scope.gamesInfo[i].id === id) {
                gameInfo = scope.gamesInfo[i];
                scope.gamesInfo[i] = {gameUrl: '', id: id, loadingUserData: true};
                break;
            }
        }
        var windowUrl, game = gameInfo.game, gameMode = gameInfo.gameMode === "real" ? "real" : "fun";

        if (game.width && game.height) {
            scaleWidth = percent * screenResolution.x / game.width;
            scaleHeight = percent *  screenResolution.y / game.height;
            scale = Math.min(scaleWidth, scaleHeight);
            windowWidth = scale * game.width;
            windowHeight = scale * game.height;
        } else if (game.ratio) {
            var ratios =  game.ratio.split(':');
            var initialWidth = percent * screenResolution.y * ratios[0] / ratios[1];
            scaleWidth =percent *  screenResolution.x / initialWidth;
            scale = Math.min(scaleWidth, 1);
            windowWidth = scale * initialWidth;
            windowHeight = scale * screenResolution.y * percent;
        }
        var windowParam = 'width=' + windowWidth + ',height=' + windowHeight + ',menubar=no,toolbar=no,location=no,scrollbars=no,resizable=yes';
        if (CConfig.main.providersThatWorkWithSwarm.indexOf(game.provider) !== -1 || game.front_game_id === CConfig.belote.gameID) {
            var request = {
                'provider': game.provider,
                'game_id': game.front_game_id,
                'external_game_id': game.extearnal_game_id,
                'mode': gameMode,
                'skin_host': CConfig.cUrlPrefix
            };
            if (gameInfo.tableId) {
                request.table_id = gameInfo.tableId.toString();
            }
            if (gameInfo.limit) {
                request.limit_category_id = gameInfo.limit;
            }
            if (gameInfo.studio) {
                request.studio = parseInt(gameInfo.studio);
            }
            if (game.game_options) {
                addOptionsInRequest(game.game_options, request);
            }

            Zergling.get(request, 'casino_game_url')
                .then(
                    function (data) {
                        if (data && data.url) {
                            openGameWindow(data.url, gameInfo, windowParam);
                            return;
                        } else {
                            showMessage('casino_auth_error');
                        }
                    },
                    function (reason) {
                        showMessage('casino_auth_error');
                    }
                )['finally'](function () {
                scope.closeGame(id);
            });
        } else {
            var gameOption = game.game_options ? game.game_options : "";

            var urlPrefix = CConfig.main.providersThatWorkWithCasinoBackend && CConfig.main.providersThatWorkWithCasinoBackend.providers.indexOf(game.provider) !== -1 ? CConfig.main.providersThatWorkWithCasinoBackend.url : CConfig.cUrlPrefix + CConfig.cGamesUrl;

            windowUrl = urlPrefix + '?gameid=' + game.front_game_id + '&mode=' + gameMode + '&provider=' + game.provider + gameOption + '&lan=' + $rootScope.env.lang + '&partnerid=' + CConfig.main.partnerID;
            if (gameMode === 'real') {
                Zergling.get({'game_id': parseInt(game.extearnal_game_id)}, 'casino_auth')
                    .then(
                        function (response) {
                            if (response && response.result) {
                                if (response.result.has_error == "False") {
                                    var userInfo = '&token=' + response.result.token + '&username=' + response.result.username + '&balance=' + response.result.balance + '&currency=' + response.result.currency + '&userid=' + response.result.id;
                                    openGameWindow(windowUrl + userInfo, gameInfo, windowParam);
                                    return;
                                } else if (response.result.has_error == "True") {
                                    showMessage('casino_auth_error');
                                }
                            }
                        },
                        function (failResponse) {
                            showMessage('casino_auth_error');
                        }
                    )['finally'](function () {
                    scope.closeGame(id);
                });
            } else {
                scope.closeGame(id);
                openGameWindow(windowUrl, gameInfo, windowParam);
            }
        }
    };

    function openGameWindow(url, gameInfo, param) {
        var windowName = gameInfo.game.front_game_id;
        if (gameInfo.tableId) {
            url += "&table_id=" + gameInfo.tableId;
            windowName += "_" + gameInfo.tableId;
        }

        url = addNeededDataInUrl(gameInfo, url + '&popup=true');
        var popup = $window.open(url, windowName, param);
        casinoManager.checkIfPopupIsBlocked(popup);
    }

     function addOptionsInRequest(options, request) {
         var list = options.split('&');
         for (var i = 0; i < list.length; i += 1) {
             var option = list[i].split("=");
             if (option.length === 2) {
                 request[option[0]] = option[1];
             }
         }
     }

    /**
     * @ngdoc method
     * @name gpTransfer
     * @methodOf CASINO.service:casinoManager
     * @description find game by id in opened games and relaod it
     *
     * @param {Object} transferModel object that contains some keys for request
     */
    casinoManager.gpTransfer = function gpTransfer(transferModel) {
        transferModel.transferInProgress = true;
        var request;
        if (transferModel.method === 'get_balance') {
            request = {product: 'KlasGaming'};
        } else {
            request = {
                'from_product': transferModel.from,
                'to_product': transferModel.to,
                'amount': transferModel.from === 'Casino' ? transferModel.fromCasinoAmount : transferModel.fromGameAmount
            }
        }

        Zergling.get(request, transferModel.method).then(function (response) {
            transferModel.fromCasinoAmount = '';
            transferModel.fromGameAmount = '';
            transferModel.transferInProgress = false;

            if (response) {
                if (response.code === 0) {
                    transferModel.gpAmount = response.balance;
                } else if (response.result === 0) {
                    transferModel.gpAmount = response.details.balance;
                    transferModel.messageType = 'success';
                    updateCasinoBalance();
                } else {
                    transferModel.messageType = 'error';
                }
            }
        })['catch'](function (reason) {
            transferModel.transferInProgress = false;
            transferModel.messageType = 'error';
        });
    };

    function updateCasinoBalance() {
        Zergling.get({product: 'Casino'}, 'get_balance').then(function (response) {
            $rootScope.env.casinoBalance = response;
        });
    }

    /**
     * @ngdoc method
     * @name setupTableInfo
     * @methodOf CASINO.service:casinoManager
     * @description prepare url to open tables
     *
     * @param {Object} tableInfo object that contains url of tables
     */
    casinoManager.setupTableInfo = function setupTableInfo(tableInfo) {
        if (CConfig.main.providersThatWorkWithSwarm.indexOf('VGS') !== -1) {
            tableInfo.loadingUserData = true;
            Zergling.get({'provider': 'VGS', 'game_id': 'VGS102', 'external_game_id': '102', 'mode': $rootScope.env.authorized ? 'real' : 'fun'}, 'casino_game_url')
                .then(
                    function (data) {
                        if (data && data.url) {
                            tableInfo.url = $sce.trustAsResourceUrl(data.url);
                        }
                    })['finally'](function () {
                tableInfo.loadingUserData = false;
            });
        } else {
            var urlPrefix = CConfig.cUrlPrefix + CConfig.cGamesUrl + '?gameid=VGS102&provider=VGS&table_id=-1&lan=' + $rootScope.env.lang + '&partnerid=' + CConfig.main.partnerID;
            if ($rootScope.env.authorized) {
                tableInfo.loadingUserData = true;
                Zergling.get({'game_id': 102}, 'casino_auth').then(function (response) {
                    if (response && response.result && response.result.has_error == "False") {
                        var userInfo = '&token=' + response.result.token + '&username=' + response.result.username + '&currency=' + response.result.currency + '&userid=' + response.result.id + '&nickname=' + response.result.nickname + '&firstname=' + $rootScope.profile.first_name + '&lastname=' + $rootScope.profile.last_name;
                        tableInfo.url = $sce.trustAsResourceUrl(urlPrefix + userInfo + '&mode=real');
                    }
                })['finally'](function () {
                    tableInfo.loadingUserData = false;
                });
            } else {
                tableInfo.url = $sce.trustAsResourceUrl(urlPrefix + '&mode=fun');
            }
        }
    };

    /**
     * @ngdoc method
     * @name adjustLiveCasinoGame
     * @methodOf CASINO.service:casinoManager
     * @description changes game and tableId in gameInfo or finds and opens game
     *
     * @param {Object} scope the scope
     * @param {Object} message object that contains game info
     * @param {Array} games array of games
     */
    casinoManager.adjustLiveCasinoGame = function adjustLiveCasinoGame(scope, message, games) {
        var adjusting = function () {
            var i, length, oldGame, newGame;

            for(i = 0, length = games.length; i < length; i += 1) {
                if (message.data.provider + message.data.gameId === games[i].front_game_id) {
                    newGame = games[i];
                }
                if (message.data.provider + message.data.lastGameId === games[i].front_game_id) {
                    oldGame = games[i];
                }
            }

            if (message.data.isMinnyLobby) {
                i = 0;
                length = scope.gamesInfo.length;

                if (oldGame) {
                    for (; i < length; i += 1) {
                        if (scope.gamesInfo[i].game && scope.gamesInfo[i].game.id === oldGame.id) {
                            scope.gamesInfo[i].game = newGame;
                            scope.gamesInfo[i].tableId = message.data.tableId;
                            break;
                        }
                    }
                } else {
                    for (; i < length; i += 1) {
                        if (scope.gamesInfo[i].game && scope.gamesInfo[i].game.id === newGame.id) {
                            scope.gamesInfo[i].tableId = message.data.tableId;
                            break;
                        }
                    }
                }
            } else if (newGame) {
                newGame.gameOpenUrl = message.data && message.data.gameOpenUrl;
                scope.openGame(newGame, undefined, message.data.tableId, null, message.data.gameSelectedLimit);
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: "warning",
                    title: "Warning",
                    content: 'No game found'
                });
            }
        };
        if (games) {
            adjusting();
        } else {
            casinoData.getGames(CConfig.liveCasino.categoryId, null).then(function (response) {
                if (response && response.data && response.data.status !== -1) {
                    games = response.data.games;
                    adjusting();
                }
            });
        }
    };

    /**
     * @ngdoc method
     * @name openGame
     * @methodOf CASINO.service:casinoManager
     *
     * @description  opens login form if it needed, or generates casino game url and opens it
     *
     */
    casinoManager.openCasinoGame = function openCasinoGame(scope, game, gameType, tableId, studio, limit) {
        $rootScope.env.showSlider = false;
        $rootScope.env.sliderContent = '';

        if (!game.types.realMode && !game.types.viewMode && !game.types.funMode) {
            return;
        }

        if (!gameType) {
            gameType = $rootScope.env.authorized && game.types.realMode ? 'real' : 'fun';
        }

        if (gameType === 'real' && !game.types.realMode) {
            gameType = 'fun';
        }

        if ((gameType === 'real' && !$rootScope.env.authorized) || (gameType === 'fun' && !game.types.viewMode && !game.types.funMode)) {
            $rootScope.$broadcast("openLoginForm");
            var infoIndex, count = scope.gamesInfo.length;
            for (infoIndex = 0; infoIndex < count; infoIndex += 1) {
                scope.gamesInfo[infoIndex].toAdd = false;
            }
            return;
        }

        var gameInfo = {};
        gameInfo.gameID = game.front_game_id;
        gameInfo.id = Math.random().toString(36).substr(2, 9);
        gameInfo.gameMode = gameType;
        gameInfo.toAdd = false;
        gameInfo.game = game; //need for refresh some games after loggin
        var gameOption = game.game_options ? game.game_options : "";
        var tableInfo = tableId !== undefined ? "&table_id=" + tableId : "";
        gameInfo.tableId = tableId;
        gameInfo.studio = studio;
        gameInfo.limit = limit;

        var urlPrefix = CConfig.main.providersThatWorkWithCasinoBackend && CConfig.main.providersThatWorkWithCasinoBackend.providers.indexOf(game.provider) !== -1 ? CConfig.main.providersThatWorkWithCasinoBackend.url : CConfig.cUrlPrefix + CConfig.cGamesUrl;

        var gameUrl = urlPrefix + '?gameid=' + game.front_game_id + '&mode=' + gameType + '&provider=' + game.provider + gameOption + tableInfo +
            '&lan=' + $rootScope.env.lang + '&partnerid=' + CConfig.main.partnerID;


        if (scope.gamesInfo && scope.gamesInfo.length > 1) {
            if (game.ratio === '0') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: "warning",
                    title: "Warning",
                    content: Translator.get('Sorry, this game cannot be opened in multi-view mode')
                });
                return;
            }
            var toAddIndex, usedProviders = [], usedGames = [];
            for (var i = 0, length = scope.gamesInfo.length; i < length; i += 1) {
                var usedGame = scope.gamesInfo[i].game;
                if (usedGame) {
                    if (gameType === 'real' && game.id === usedGame.id && (game.categories.indexOf(CConfig.liveCasino.categoryId) === -1 || tableId === scope.gamesInfo[i].tableId)) {
                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: "warning",
                            title: "Warning",
                            content: Translator.get('This Table Is Already Opened In Multi Game View. Please Choose Another Table.')
                        });
                        return;
                    }
                    usedGames.push(usedGame);
                    if ((usedGame.provider === 'MGS' || usedGame.provider === 'BSG' || usedGame.provider === 'GMG' || usedGame.provider === 'NET') && usedProviders.indexOf(usedGame.provider) === -1) {
                        usedProviders.push(usedGame.provider);
                    }
                }
                if (scope.gamesInfo[i].toAdd) {
                    toAddIndex = i;
                }
            }
            if (usedProviders.indexOf(game.provider) !== -1) {
                for (var j = 0; j < usedGames.length; j += 1) {
                    if (game.id === usedGames[j].id) {
                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: "warning",
                            title: "Warning",
                            content: Translator.get('This Table Is Already Opened In Multi Game View. Please Choose Another Table.')
                        });
                        return;
                    }
                }
                if (j === usedGames.length) {
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: "warning",
                        title: "Warning",
                        content: Translator.get('It Is Possible To Play Only One Game Of The Same Provider In Multi Game View. Please Choose Another Game.')
                    });
                    return;
                }
            } else {
                if (toAddIndex !== undefined) {
                    $location.search('type', undefined);
                    $location.search('game', undefined);
                    $location.search('table', undefined);
                    $location.search('studio', undefined);
                    $location.search('limit', undefined);
                    addCurrentGame(scope, gameInfo, gameUrl, toAddIndex);
                }
            }
        } else {
            scope.gamesInfo = [];
            $location.search('game', game.id);
            $location.search('type', gameType);
            $location.search('limit', limit);
            addCurrentGame(scope, gameInfo, gameUrl, 0);
        }

        $rootScope.casinoGameOpened = scope.gamesInfo.length;

        if($rootScope.env.authorized && CConfig.main.providersCustomMessages && CConfig.main.providersCustomMessages[game.provider] && !Storage.get(game.provider)){
            Storage.set(game.provider, 'Popup time delay for ' + game.provider + ' provider', CConfig.main.providersCustomMessages[game.provider].timeDelay);
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'warning',
                title: 'Warning',
                content: Translator.get(CConfig.main.providersCustomMessages[game.provider].message)
            });
        }
    };

    /**
     * @ngdoc method
     * @name addCurrentGame
     * @methodOf CASINO.service:casinoManager
     * @description changes game and tableId in gameInfo or finds and opens game
     *
     * @param {Object} scope the scope
     * @param {Object} gameInfo object that contains game info
     * @param {String} gameUrl string that contains part of game's url
     * @param {Int} toAddIndex int current index
     */

    function addCurrentGame(scope, gameInfo, gameUrl, toAddIndex) {
        if (!gameInfo.game.gameOpenUrl && (CConfig.main.providersThatWorkWithSwarm.indexOf(gameInfo.game.provider) !== -1 || gameInfo.game.front_game_id === CConfig.belote.gameID)) {
            gameInfo.loadingUserData = true;
            scope.gamesInfo[toAddIndex] = gameInfo;
            if (gameInfo.gameMode !== "real") {
                gameInfo.gameMode = "fun";
            }
            var request = {
                'provider': gameInfo.game.provider,
                'game_id': gameInfo.game.front_game_id,
                'external_game_id': gameInfo.game.extearnal_game_id,
                'mode': gameInfo.gameMode,
                'skin_host': CConfig.cUrlPrefix
            };
            if (gameInfo.tableId) {
                request.table_id = gameInfo.tableId.toString();
            }
            if (gameInfo.limit) {
                request.limit_category_id = gameInfo.limit;
            }
            if (gameInfo.studio) {
                request.studio = parseInt(gameInfo.studio);
            }
            if (gameInfo.game.game_options) {
                addOptionsInRequest(gameInfo.game.game_options, request);
            }

            Zergling.get(request, 'casino_game_url').then(function (data) {
                if (data && data.url) {
                    gameInfo.loadingUserData = false;
                    gameInfo.gameUrl = $sce.trustAsResourceUrl(addNeededDataInUrl(gameInfo, data.url));
                } else {
                    showMessage('casino_auth_error');
                    scope.closeGame(gameInfo.id);
                }
            }, function (reason) {
                showMessage('casino_auth_error');
                scope.closeGame(gameInfo.id);
            });
        } else if (gameInfo.gameMode === 'real') {
            gameInfo.loadingUserData = true;
            scope.gamesInfo[toAddIndex] = gameInfo;
            Zergling.get({'game_id': parseInt(gameInfo.game.extearnal_game_id)}, 'casino_auth').then(function (response) {
                if (response && response.result) {
                    if (response.result.has_error == "False") {
                        var userInfo = gameInfo.game.gameOpenUrl ? response.result.token + '&username=' + response.result.username : '&token=' + response.result.token + '&username=' + response.result.username + '&balance=' + response.result.balance + '&currency=' + response.result.currency + '&userid=' + response.result.id;
                        gameInfo.gameUrl = gameInfo.game.gameOpenUrl ?  $sce.trustAsResourceUrl(gameInfo.game.gameOpenUrl + userInfo) : $sce.trustAsResourceUrl(addNeededDataInUrl(gameInfo, gameUrl + userInfo));
                        gameInfo.loadingUserData = false;
                    } else if (response.result.has_error == "True") {
                        showMessage('casino_auth_error');
                        scope.closeGame(gameInfo.id);
                    }
                }
            }, function (failResponse) {
                showMessage('casino_auth_error');
                scope.closeGame(gameInfo.id);
            });
        } else {
            gameInfo.gameUrl = gameInfo.game.gameOpenUrl ?  $sce.trustAsResourceUrl(gameInfo.game.gameOpenUrl) : $sce.trustAsResourceUrl(addNeededDataInUrl(gameInfo,gameUrl));
            scope.gamesInfo[toAddIndex] = gameInfo;
        }
    }

    function addNeededDataInUrl(gameInfo, initialUrl) {
        if (gameInfo.studio) {
            initialUrl += "&studio=" + gameInfo.studio;
        }
        if (gameInfo.game.categories.indexOf(CConfig.liveCasino.categoryId) !== -1) {
            var location = $window.location.origin + '/#/livedealer/';
            initialUrl += '&homeaction=' + encodeURIComponent(location) + '&loginaction=' + encodeURIComponent(location + '?action=login');
        }

        return initialUrl;
    }

    function showMessage(message) {
        $rootScope.$broadcast("globalDialogs.addDialog", {
            type: 'warning',
            title: ' ',
            content: message
        });
    }

    /**
     * @ngdoc method
     * @name checkIfPopupIsBlocked
     * @methodOf CASINO.service:casinoManager
     * @description  detect if the popup has been blocked by the browser and shows proper message
     *
     * @param {Object} popup object
     */
    casinoManager.checkIfPopupIsBlocked = function checkIfPopupIsBlocked(popup) {
        if(!popup || popup.closed || typeof popup.closed=='undefined')
        {
            $rootScope.$broadcast('globalDialogs.addDialog', {
                type: 'info',
                title: 'Alert',
                content: 'Please enable pop-up windows in your browser in order to open the game in a separate window.'
            });
        }
    };

    /**
     * @ngdoc method
     * @name changeView
     * @methodOf CASINO.service:casinoManager
     * @description change view for applying functionality of multiple view in casino
     *
     * @param {Object} scope the rootScope
     * @param {Int} view int
     */
    casinoManager.changeView = function changeView(scope, view) {
        var i, gameInfo, uniqueId;
        if(view > scope.gamesInfo.length) {
            for (i = scope.gamesInfo.length; i < view; i++) {
                uniqueId = Math.random().toString(36).substr(2, 9);
                gameInfo = {gameUrl: '', id: uniqueId, toAdd: false};
                scope.gamesInfo.push(gameInfo);
            }
            scope.viewCount = view;
        } else if (view < scope.gamesInfo.length) {
            var actualviews = 0, actualGames = [];
            for (i = 0; i < scope.gamesInfo.length; i += 1) {
                if (scope.gamesInfo[i].gameUrl !== '') {
                    gameInfo = scope.gamesInfo[i];
                    actualGames.push(gameInfo);
                    actualviews++;
                }
            }
            if (actualviews <= view) {
                if (actualviews === 1 && view === 2) {
                    uniqueId = Math.random().toString(36).substr(2, 9);
                    gameInfo = {gameUrl: '', id: uniqueId, toAdd: false};
                    if (scope.gamesInfo[0].gameUrl !== '') {
                        actualGames.push(gameInfo);
                    } else {
                        actualGames.unshift(gameInfo);
                    }
                }
                scope.gamesInfo = actualGames;
                scope.viewCount = view;
            } else {
                var numberOfNeeded = actualviews - view;
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'warning',
                    title: 'Warning',
                    content: Translator.get('Please close {1} game(s) to change view', [numberOfNeeded])
                });
            }
        }
        $rootScope.casinoGameOpened = scope.gamesInfo.length;

        analytics.gaSend('send', 'event', 'multiview',  {'page': $location.path(), 'eventLabel': 'multiview changed to ' + view});
    };

    casinoManager.getGameById = function getGameById(games, id) {
        for(var i = 0, count = games.length; i < count;  i += 1) {
            if (games[i].id === id) {
                return games[i];
            }
        }

        return null;
    };

    casinoManager.findAndCloseGame = function findAndCloseGame(scope, gameId, tableId) {
        if (scope.gamesInfo && scope.gamesInfo.length) {
            if (gameId === undefined) {
                scope.closeGame();
            } else {
                var i, length = scope.gamesInfo.length;
                for (i = 0; i < length; i += 1) {
                    if (scope.gamesInfo[i].game && (scope.gamesInfo[i].game.id == gameId || scope.gamesInfo[i].game.server_game_id == gameId) && (!tableId || tableId == scope.gamesInfo[i].tableId)) {
                        scope.closeGame(scope.gamesInfo[i].id);
                        break;
                    }
                }
            }
        }
    };

    casinoManager.openGameDetailsPopUp = function openGameDetailsPopUp (gameId) {
        var url = '#/popup/?u=' + ($rootScope.profile && $rootScope.profile.unique_id ? $rootScope.profile.unique_id : '') + '&action=gamedetails&game_skin_id=' + gameId;
        var param = "scrollbars=1,width=1000,height=600,resizable=yes";

        var popup = $window.open(url, 'game.details', param);
        casinoManager.checkIfPopupIsBlocked(popup);
    };

    function openPopUp (url, windowName, param) {
        var popUpWindow = $window.open('', windowName, param);
        $timeout(function () {
            popUpWindow.location.href = url;
        }, 500);
    }

    return casinoManager;
}]);
