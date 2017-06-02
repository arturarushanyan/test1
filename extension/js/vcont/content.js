/* global chrome  */
VCONT.controller('showHistory', ['$scope', 'Utils', 'Storage', 'Config', 'Moment', function ($scope, Utils, Storage, Config, Moment) {
    'use strict';
    $scope.authorized = false;
    $scope.busy = false;
    $scope.bets = [];
    $scope.totalPages = 0;
    $scope.betHistoryPages = [];
    $scope.betHistoryActivePage = 0;
    $scope.user = {};
    $scope.updating = true;
    $scope.liveSportList = [];


    if (Storage.get('lang') !== undefined) {
        Config.env.lang = Storage.get('lang');
        Moment.setLang(Config.env.lang);
    }
    $scope.conf = Config.main;


    var BETS_PER_HISTORY_PAGE = 5;

    /**
     * @ngdoc method
     * @name betHistoryGotoPage
     * @methodOf vcont.content:showHistory
     * @description selects slice of bet history data according to given page number
     * @param {Number, Boolean} page page number, user interaction
     */
    $scope.betHistoryGotoPage = function betHistoryGotoPage(page, userClick) {
        userClick = userClick || false;
        $scope.totalPages = parseInt($scope.betHistory.length / BETS_PER_HISTORY_PAGE + ($scope.betHistory.length % BETS_PER_HISTORY_PAGE ? 1 : 0), 10);
        $scope.betHistoryPages = Utils.createPaginationArray($scope.totalPages, page, 4);
        var start = (page - 1) * BETS_PER_HISTORY_PAGE;
        var end = page * BETS_PER_HISTORY_PAGE;
        end = end > $scope.betHistory.length ? $scope.betHistory.length : end;
        $scope.bets = $scope.betHistory.slice(start, end);
        if (page === $scope.betHistoryActivePage) {
            $scope.updating = true;
            if (!userClick) {
                $scope.$apply();
            }
        } else {
            $scope.updating = false;
            if (!$scope.betHistoryActivePage) {
                $scope.betHistoryActivePage = page;
                $scope.$apply();
            } else {
                $scope.betHistoryActivePage = page;
            }
        }

    };

    /**
     * @ngdoc method
     * @name getUserBets
     * @methodOf vcont.content:showHistory
     * @description Request user bets from background script
     */
    function getUserBets() {
        console.log('getUserBets');
        chrome.runtime.sendMessage({getBetHistory: true}, function (response) {
            $scope.betHistory = Utils.objectToArray(response);
            if ($scope.betHistoryActivePage) {
                $scope.betHistoryGotoPage($scope.betHistoryActivePage);
            } else {
                $scope.betHistoryGotoPage(1);
            }
        });
    }

    /**
     * @ngdoc method
     * @name getState
     * @methodOf vcont.content:showHistory
     * @description Request state from background script
     */
    function getState() {
        console.log('getState');
        chrome.runtime.sendMessage({getState: true}, function (response) {
            if (!$scope.authorized && response && response.authorized) {
                chrome.runtime.sendMessage({updateRequest: true}, function (response) {});
            }
            $scope.busy = response.busy;
            $scope.authorized = response.authorized;
            if ($scope.authorized) {
                getUserBets();
                if (!$scope.user.profile) {
                    chrome.runtime.sendMessage({getUserProfile: true});
                }
            } else {
                $scope.$apply();
            }
        });
    }

    /**
     * @ngdoc method
     * @name login
     * @methodOf vcont.content:showHistory
     * @description send login request to background script
     */
    $scope.login = function login() {
        console.log('login');
        $scope.busy = true;
        chrome.runtime.sendMessage({userLogin: true, data: $scope.user}, function (response) {
            getState();
        });
    };

    /**
     * @ngdoc method
     * @name openOptions
     * @methodOf vcont.content:showHistory
     * @description
     */
    $scope.openOptions = function openOptions() {
        var optionsUrl = chrome.extension.getURL('options.html');

        chrome.tabs.query({url: optionsUrl}, function (tabs) {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, {active: true});
            } else {
                chrome.tabs.create({url: optionsUrl});
            }
        });

    };

    /**
     * @ngdoc method
     * @name logOut
     * @methodOf vcont.content:showHistory
     * @description send logout request to background script
     */
    $scope.logOut = function logOut() {
        console.log('logOut');
        chrome.runtime.sendMessage({userLogout: true}, function (response) {
            if (response) {
                $scope.authorized = false;
                $scope.busy = false;
                $scope.bets = [];
                $scope.totalPages = 0;
                $scope.betHistoryPages = [];
                $scope.betHistoryActivePage = 0;
                $scope.user = {};
                $scope.$apply();
            }
        });

    };

    /**
     * @ngdoc method
     * @name loadLive
     * @methodOf vcont.content:showHistory
     * @description send logout request to background script
     */
    $scope.loadLive = function loadLive() {
        console.log('loadLive');
        chrome.runtime.sendMessage({getLiveSportList: true});
        $scope.extViewState = 'live';
    };

    /**
     * @ngdoc method
     * @name updateLiveSportList
     * @methodOf vcont.content:showHistory
     * @description Update live sport list
     */
    function updateLiveSportList(data) {
        console.log(data);
        $scope.liveSportList = Utils.objectToArray(data);
        if (!$scope.selectedLiveSportId && $scope.liveSportList.length > 0) {
            $scope.getSelectedSportGames($scope.liveSportList[0]);
        }
        $scope.$apply();
    }

    /**
     * @ngdoc method
     * @name getSelectedSportGames
     * @methodOf vcont.content:showHistory
     * @description get selected live sport games
     */
    $scope.getSelectedSportGames = function getSelectedSportGames(sport) {
        console.log('getSelectedSportGames');
        $scope.selectedLiveSportId = sport.id;
        chrome.runtime.sendMessage({getLiveSportGames: true, data: sport});
    };

    /**
     * @ngdoc method
     * @name bgMsgProcessor
     * @methodOf vcont.content:showHistory
     * @param {Object, String, Object} message from background, MessageSender, function sendResponse
     * @description Processing messages from background Script
     */
    function bgMsgProcessor(msg, _, sendResponse) {
        if (msg.stateChanged) {
            console.log('state Changed');
            getState();
        } else if (msg.userProfile) {
            console.log('userProfile');
            if (msg.data && msg.data.profile) {
                $scope.userProfile = Utils.objectToArray(msg.data.profile)[0];
                $scope.$apply();
            }
        } else if (msg.sportListReady) {
            console.log("sportListReady");
            if (msg.data && msg.data.sport) {
                updateLiveSportList(msg.data.sport);
            } else {
                console.log("error Get sport List" + msg.data);
            }
        } else if (msg.competitionsReady) {
            console.log("competitionsReady");
            $scope.selectedSportCompetitions = msg.data;
            $scope.$apply();
        }
    }

    /**
     * @ngdoc method
     * @name init
     * @methodOf vcont.content:showHistory
     * @description initialize content script
     */
    $scope.init = function init() {
        console.log('init');
        if (Storage.get('numOfStatusChanges')) {
            $scope.extViewState = 'mybets';
        } else {
            $scope.loadLive();
        }

        chrome.runtime.onMessage.addListener(bgMsgProcessor);
        getState();
        chrome.runtime.sendMessage({clearNotifications: true});
        var port = chrome.runtime.connect({name: "skylink"});


    };

}]);