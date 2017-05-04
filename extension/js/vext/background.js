VEXT.run(['Zergling', 'AuthData', 'Storage', 'Config', 'Translator', 'Utils', '$filter', function (Zergling, AuthData, Storage, Config, Translator, Utils, $filter) {
    'use strict';
    var state = {authorized: false, busy: true};
    var user = {};
    var numOfStatusChanges = 0;
    var betHistory = {};
    var live = {
        SelectedSportSubId: null,
        selectedSport: {},
        selectedSportCompetitions: []
    };
    var userProfileSubId = null;


    if (Storage.get('lang') !== undefined) {
        Config.env.lang = Storage.get('lang');
    }


    /**
     * @ngdoc method
     * @name updateIcon
     * @methodOf vext.background
     * @description Update extension icon
     */
    function updateIcon() {
        console.log('updateIcon');
        if (!state.authorized) {
            chrome.browserAction.setIcon({path: "images/disabled-icon.png"});
            chrome.browserAction.setBadgeText({text: ""});
        } else {
            chrome.browserAction.setIcon({path: "images/active-icon.png"});

        }
    }

    /**
     * @ngdoc method
     * @name onContentCloseEventHandler
     * @methodOf vext.background
     * @param {Object} Port event object
     * @description Handle Content page close event
     */
    function onContentCloseEventHandler(value) {
        console.log('onContentCloseEventHandler');
        if (live.SelectedSportSubId) {
            Zergling.unsubscribe(live.SelectedSportSubId);
        }
        if (userProfileSubId) {
            Zergling.unsubscribe(userProfileSubId);
            userProfileSubId = null;
        }
        live.SelectedSportSubId = null;
        live.selectedSport = {};
        live.selectedSportCompetitions = [];
    }

    /**
     * @ngdoc method
     * @name restoreLogin
     * @methodOf vext.background
     * @description try to restore last session
     */
    function restoreLogin() {
        console.log('restoreLogin');
        if (AuthData.getAuthToken()) {
            console.log('restoring login');
            Zergling.login(null).then(function (data) {
                console.log('login restore ok', data);
                state.authorized = true;
                getUserBets();
            })['catch'](function (reason) {
                    console.log(reason);
                    updateIcon();
                    state.busy = false;
                    state.authorized = false;
                    chrome.runtime.sendMessage({stateChanged: true});
                }
            )['finally'](function () {
                updateIcon();
            });
        } else {
            state.busy = false;
            state.authorized = false;
            chrome.runtime.sendMessage({stateChanged: true});
        }
    }

    /**
     * @ngdoc method
     * @name resetAlarm
     * @methodOf vext.background
     * @description Set or remove alarms
     */
    function resetAlarm() {
        console.log('resetAlarm');
        chrome.alarms.get('refresh', function (alarm) {
            if (state.authorized) {
                var hasActiveBets = false;
                angular.forEach(betHistory, function (bet) {
                    if (bet.outcome == 0) {
                        hasActiveBets = true;
                    }
                });
                if (hasActiveBets && (alarm === undefined || alarm.periodInMinutes !== 1)) {
                    chrome.alarms.create('refresh', {periodInMinutes: 1, delayInMinutes: 1});
                }
                if (!hasActiveBets && (alarm === undefined || alarm.periodInMinutes !== 5)) {
                    chrome.alarms.create('refresh', {periodInMinutes: 5, delayInMinutes: 5});
                }
            } else if (state.busy) {
                chrome.alarms.create('refresh', {periodInMinutes: 1, delayInMinutes: 1});
            } else {
                chrome.alarms.clear('refresh');
            }
        });
    }

    /**
     * @ngdoc method
     * @name login
     * @methodOf vext.background
     * @description login user
     */
    function login() {
        console.log('login');
        state.busy = true;
        resetAlarm();
        Zergling
            .login(user)
            .then(
            function (data) {
                console.log('login ok', data);
                state.authorized = true;
                getUserBets();
            })['catch'](function (reason) {
                console.log(reason);
                state.busy = false;
                state.authorized = false;
                chrome.runtime.sendMessage({stateChanged: true});
                resetAlarm();
            })['finally'](function () {
                updateIcon();
            });
    }

    /**
     * @ngdoc method
     * @name resetNotifications
     * @methodOf vext.background
     * @description Clear all notifications
     */
    function resetNotifications() {
        numOfStatusChanges = 0;
        Storage.remove('numOfStatusChanges');
        chrome.browserAction.setBadgeText({text: ""});

        chrome.notifications.getAll(function (notifications) {
            angular.forEach(notifications, function (value, key) {
                chrome.notifications.clear(key, function () {
                });
            });

        });
    }

    /**
     * @ngdoc method
     * @name login
     * @methodOf vext.background
     * @description Logout user and clean user data
     */
    function logOut() {
        console.log('logOut');
        Storage.remove('savedBetHistory');
        Storage.remove('numOfStatusChanges');
        updateIcon();
        resetAlarm();
        resetNotifications();
        onContentCloseEventHandler();
        Zergling.logout()['finally'](function () {
            state.authorized = false;
            state.busy = false;
            user = {};
        });
    }

    /**
     * @ngdoc method
     * @name showNotifications
     * @methodOf vext.background
     * @param {Object} Bet Event
     * @description Show desktop notifications
     */
    function showNotifications(betEvent) {
        console.log("showNotifications");
        var betTypeTitles = {1: "ntf_single", 2: "ntf_express", 3: "ntf_system", 4: "ntf_chain"};
        var betStatusTitles = {0: "ntf_not_calc", 1: "ntf_lose", 2: "ntf_return", 3: "ntf_won"};
        var betStatusIcons = {0: "../images/lost.png", 1: "../images/lost.png", 3: "../images/win.png"};
        var contextMessageText = (betEvent.outcome == 3) ? (Translator.get("ntf_won") + ": " + betEvent.payout + " " + betEvent.currency) : "";
        var titleMessageText = Translator.get(betStatusTitles[betEvent.outcome]);
        var yourSound;
        if (betEvent.outcome == 1 || betEvent.outcome == 3) {
            if (Storage.get('isNotifSoundEnabled') === undefined || Storage.get('isNotifSoundEnabled')) {
                if (betEvent.outcome == 1) {
                    yourSound = new Audio('../sounds/notification_lose.mp3');
                } else {
                    yourSound = new Audio('../sounds/notification_won.mp3');
                }
                yourSound.play();
            }

            if (Storage.get('isNotificationsActivated') === undefined || Storage.get('isNotificationsActivated')) {
                if (betEvent.type == 1) {
                    chrome.notifications.create(betEvent.id, {type: "basic", iconUrl: betStatusIcons[betEvent.outcome], title: titleMessageText, message: betEvent.events[0].game_name, contextMessage: contextMessageText}, function () {
                    });
                } else {
                    var eventItems = [];
                    angular.forEach(betEvent.events, function (event) {
                        eventItems.push({title: Translator.get(betStatusTitles[event.outcome]) + ": ", message: event.game_name});
                    });
                    chrome.notifications.create(betEvent.id, {type: "list", iconUrl: betStatusIcons[betEvent.outcome], title: titleMessageText, message: "", items: eventItems, contextMessage: contextMessageText}, function () {
                    });
                }
            }
        }
    }

    /**
     * @ngdoc method
     * @name findBetStatusChanges
     * @methodOf vext.background
     * @param {Object} User Bets
     * @description Compare and find win or lose games in user bets
     */
    function findBetStatusChanges(bets) {
        console.log('findBetStatusChanges');
        if (bets !== undefined && bets.length > 0) {
            if (Storage.get('savedBetHistory') !== undefined && Storage.get('numOfStatusChanges') !== undefined) {
                numOfStatusChanges = Storage.get('numOfStatusChanges');
                angular.forEach(Storage.get('savedBetHistory'), function (oldValue) {
                    angular.forEach(bets, function (newValue) {
                        if (oldValue.id === newValue.id && oldValue.outcome !== newValue.outcome) {
                            numOfStatusChanges++;
                            showNotifications(newValue);
                        }
                    });
                });
            } else {
                numOfStatusChanges = 0;
            }
            Storage.set('savedBetHistory', betHistory);
            Storage.set('numOfStatusChanges', numOfStatusChanges);
            chrome.browserAction.setBadgeText({text: numOfStatusChanges ? numOfStatusChanges.toString() : ""});
        }
    }


    /**
     * @ngdoc method
     * @name updateMyBets
     * @methodOf vext.background
     * @param {Object} Bet Data
     * @description Get bet info from bet data
     */
    function updateMyBets(data) {
        console.log('my bets', data.bets);
        if (data && data.bets) {
            betHistory = data.bets;
        }
        findBetStatusChanges(betHistory);
        resetAlarm();
    }


    /**
     * @ngdoc method
     * @name getUserBets
     * @methodOf vext.background
     * @description Get User Bets
     */
    function getUserBets() {
        console.log('getUserBets');
        state.busy = true;
        Zergling.get({
            'where': {}//"from_date":1401566400,"to_date":1404158400
        }, 'bet_history')
            .then(function (response) {
                state.busy = false;
                chrome.runtime.sendMessage({stateChanged: true});
                updateMyBets(response);
            })['catch'](function (reason) {
            state.busy = false;
        });
    }

    /**
     * @ngdoc method
     * @name updateLiveGames
     * @methodOf vext.background
     * @description update selected sport Games
     * @param {Object} data games data
     * @param {Boolean} initial indicates if initial data(not subscription update) is passed
     */
    function updateLiveGames(data, initial) {
        live.selectedSportCompetitions = [];
        angular.forEach(data.sport, function (sport) {
            angular.forEach(sport.region, function (region) {
                angular.forEach(region.competition, function (competition) {
                    competition.region = {id: region.id, name: region.name, alias: region.alias};
                    competition.gamesArray = Utils.objectToArray(competition.game) || [];
                    live.selectedSportCompetitions.push(competition);
                    angular.forEach(competition.game, function (game) {
                        game.competition = {id: competition.id};
                        game.region = {id: region.id};
                        game.sport = {id: sport.id};
                        game.events = {};
                        angular.forEach(game.market, function (market) {
                            game.marketType = market.type;
                            angular.forEach(market.event, function (event) {
                                game.events[event.type] = event;
                            });
                        });

                    });
                });
            });
        });
        var i;
        for (i = 0; i < live.selectedSportCompetitions.length; i++) {
            live.selectedSportCompetitions[i].name = $filter('removeParts')(live.selectedSportCompetitions[i].name, [live.selectedSport, '']);
        }
        live.selectedSportCompetitions.sort(function (a, b) {
            return a.order - b.order;
        });

        chrome.runtime.sendMessage({competitionsReady: true, data: live.selectedSportCompetitions});
    }


    /**
     * @ngdoc method
     * @name loadSelectedSportGames
     * @methodOf vext.background
     * @description
     * Subscribes to Selects sport
     * @param {Object} sport sport object
     */
     function loadSelectedSportGames(sport) {
        console.log('select sport', sport);
        if (!sport || sport.id === live.selectedSport.id) {
            return;
        }

        if (live.SelectedSportSubId) {
            Zergling.unsubscribe(live.SelectedSportSubId);
            live.SelectedSportSubId = null;
        }
        live.selectedSport = sport;

        var request = {
            'source': 'betting',
            'what': {
                'sport': ['id'],
                'region': ['id', 'name', 'alias'],
                'competition': [],
                'game': [
                    ['id', 'start_ts', 'team1_name', 'team2_name', 'type', 'info', 'events_count', 'extra', 'is_blocked', 'game_number']
                ],
                'event': ['id', 'price', 'type', 'name'],
                'market': ['type', 'express_id', 'name']
            },
            'where': {
                'sport': {
                    'id': sport.id
                },
                'market': {
                    'type': {'@in': ['P1XP2', 'P1P2']}
                },
                'game': {
                    'type': 1
                }
            }
        };

        Zergling.subscribe(request, updateLiveGames)
            .then(function (result) {
                if (result.subid) {
                    if (result.data.sport.hasOwnProperty(live.selectedSport.id)){
                        live.SelectedSportSubId = result.subid;
                    } else {
                        Zergling.unsubscribe(result.subid);
                        return;
                    }
                }
                updateLiveGames(result.data, true);
            })['catch'](function (reason) {
            console.log('Error:', reason);
        });
    }

    /**
     * @ngdoc method
     * @name loadLiveSportList
     * @methodOf vext.background
     * @description Get live games
     */
    function loadLiveSportList() {
        console.log('loadLiveSportList');
        Zergling.get(
            {'source': 'betting', 'what': {'sport': [], 'game': '@count'}, 'where': {'game': {'type': 1}}}
        ).then(function (result) {
                if (result.data) {
                    chrome.runtime.sendMessage({sportListReady: true, data: result.data});
                }
            })['catch'](function (reason) {
                console.log('Error:'); console.log(reason);
                chrome.runtime.sendMessage({sportListReady: true, data: reason});
        });
    }

    /**
     * @ngdoc method
     * @name msgProcessor
     * @methodOf vext.background
     * @param {Object, String, Object} message from Content, MessageSender, function sendResponse
     * @description Processing messages from content Script
     */
    function msgProcessor(msg, _, sendResponse) {
        if (msg.getState) {
            sendResponse(state);
        } else if (msg.getBetHistory) {
            sendResponse(betHistory);
        } else if (msg.getUserProfile) {
            getUserProfile();
        } else if (msg.clearNotifications) {
            resetNotifications();
            sendResponse(true);
        } else if (msg.userLogout) {
            logOut();
            sendResponse(true);
        } else if (msg.userLogin) {
            user = msg.data;
            login();
            sendResponse(true);
        } else if (msg.updateRequest) {
            getUserBets();
        } else if (msg.langChanged) {
            chrome.runtime.reload();
        } else if (msg.getLiveSportList) {
            loadLiveSportList();
        } else if (msg.getLiveSportGames) {
            if (msg.data) {
                loadSelectedSportGames(msg.data);
            }
        }
    }


    /**
     * @ngdoc method
     * @name onContentCloseEventHandler
     * @methodOf vext.background
     * @param {Object} Port event object
     * @description Handle Content page close event
     */
    function getUserProfile() {
        if (state.authorized && !state.busy) {
            Zergling
                .subscribe({'source': 'user', 'what': {'profile': []}, 'subscribe': true},
                function(data) {
                    chrome.runtime.sendMessage({userProfile: true, data: data});
                })
                .then(function (result) {
                    chrome.runtime.sendMessage({userProfile: true, data: result.data});
                    userProfileSubId = result.subid;
                });
        }
    }

    /**
     * @ngdoc method
     * @name init
     * @methodOf vext.background
     * @description Script initialization
     */
    function init() {
        console.log('init');
        restoreLogin();
        chrome.alarms.onAlarm.addListener(onAlarm);
        chrome.runtime.onMessage.addListener(msgProcessor);

        chrome.runtime.onConnect.addListener(function(port) {
            port.onDisconnect.addListener(onContentCloseEventHandler);
        });

    }


    /**
     * @ngdoc method
     * @name onAlarm
     * @methodOf vext.background
     * @param {Object} Alarm object
     * @description Process alarm events
     */
    function onAlarm(alarm) {
        console.log('onAlarm');
        if (!state.authorized && state.busy) {
            if (AuthData.getAuthToken()) {
                restoreLogin();
            } else {
                login();
            }
        } else {
            getUserBets();
        }
    }

    init();

}]);
