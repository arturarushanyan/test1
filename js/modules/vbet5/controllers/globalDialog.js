/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:globalDialogCtrl
 * @description
 * Custom dialog controller
 * Dialogs can be added in two ways
 * 1. by assigning the dialog to $rootScope.globalDialog global variable
 *      in this case the new dialog will overwrite previous dialogs
 *      for deleting/closing null can be assigned to $rootScope.globalDialog variable
 * 2. by broadcasting globalDialogs.addDialog event and passing the dialog object to the event
 *      in this case the new dialog will be saved in $scope.globalDialogs array,
 *      first input dialog will be output first (FIFO)
 *      the passed dialog should have the following structure
 *      {
 *          type: 'info', // required field - type of dialog can be info warning error success (feedback - only for feedback dialog)
 *          title: 'Information', // optional field - headline of dialog
 *          subTitle: 'Information', // optional field - title of dialog text
 *          content: "content of first dialog" // required field
 *      }
 */
VBET5.controller('globalDialogCtrl', ['$rootScope', '$scope', '$location', '$window', 'Config', 'Storage', 'Utils', 'content', 'Geoip', 'TimeoutWrapper', 'Moment', function ($rootScope, $scope, $location, $window, Config, Storage, Utils, content, Geoip, TimeoutWrapper, Moment) {
    'use strict';

    // $scope.globalDialogs is array where the dialogs are stored
    $scope.globalDialogs = [];
    $scope.activeDialog = null;
    TimeoutWrapper = TimeoutWrapper($scope);
    /**
     * @ngdoc method
     * @name dialog
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description returns active dialog
     */
    $scope.dialog = function dialog(param) {
        if (param) {
            return $rootScope.globalDialog[param];
        }
        return $rootScope.globalDialog;
    };

    /**
     * @ngdoc method
     * @name updateActiveDialog
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description returns active dialog (from globalDialogs)
     */
    function updateActiveDialog() {

        if ($scope.globalDialogs.length === 0) {
            $scope.activeDialog = null;
            Config.env.isGlobalDialog = false;
        } else {
            Config.env.isGlobalDialog = true;
        }

        $scope.activeDialog = $scope.globalDialogs[$scope.globalDialogs.length - 1];
    }

    /**
     * @ngdoc method
     * @name addDialog
     * @methodOf vbet5.controller:globalDialogCtrl
     * @param {Object} item dialog to add
     * @description adds dialog and updates its arrays
     */
    function addDialog(dialog) {
        if (!dialog || !dialog.type || ('image' === dialog.type && !dialog.src) || ('image' !== dialog.type && !dialog.content)) {
            return null;
        }
        dialog.index = $scope.globalDialogs.length;
        dialog.standardPopup = true;

        $scope.globalDialogs.unshift(dialog);
        updateActiveDialog();
    }

    $rootScope.$on("globalDialogs.addDialog", function (event, dialog) {
        addDialog(dialog);
    });

    $rootScope.$on("globalDialogs.removeDialogsByTag", function (event, tag) {
        var i, length = $scope.globalDialogs.length;
        for (i = 0; i < length; i += 1) {
            if ($scope.globalDialogs[i].tag && $scope.globalDialogs[i].tag === tag) {
                $scope.closeDialog($scope.globalDialogs[i]);
                break;
            }
        }
    });

    /**
     * @ngdoc method
     * @name closeDialog
     * @methodOf vbet5.controller:globalDialogCtrl
     * @param {Object} item dialog that should be removed
     * @description removes given dialog from $scope.globalDialogs array
     */
    $scope.closeDialog = function closeDialog(item, target) {
        var index = $scope.globalDialogs.indexOf(item);
        if (index !== -1) {
            if (target && $scope.globalDialogs[index] && $scope.globalDialogs[index][target]) {
                if (typeof $scope.globalDialogs[index][target] === 'string' || $scope.globalDialogs[index][target] instanceof String) {
                    $rootScope.$broadcast($scope.globalDialogs[index][target]);
                } else {
                    $rootScope.$broadcast($scope.globalDialogs[index][target][0], $scope.globalDialogs[index][target][1]);
                }
            }

            $scope.globalDialogs.splice(index, 1);
            updateActiveDialog();
        }

    };

    function loadDialogsFromConfig() {
        if (!Config.customDialogs || !Config.customDialogs instanceof Object || Utils.isObjectEmpty(Config.customDialogs)) {
            return false;
        }
        var item, key, getParams = $location.search();
        var storageCustomPopupsInfo = Storage.get('storageCustomPopupsInfo') || {};

        function checkPath(item) {
            var key;
            if (item.pages && item.pages.indexOf($location.path()) === -1) {
                return false;
            } else if (item.routParams) {
                for (key in item.routParams) {
                    if (item.routParams[key] !== getParams[key]) {
                        return false;
                    }
                }
            }
            return true;
        }

        function checkDataAndAddDialog(item) {
            if (!storageCustomPopupsInfo[key] || (storageCustomPopupsInfo[key].showedTimes < item.countOfPopups &&
                storageCustomPopupsInfo[key].lastShowedTime + item.frequency <= Date.now())) {
                if (checkPath(item) && (!item.onlyAuthorizedUser || item.onlyAuthorizedUser === $rootScope.env.authorized)) {
                    $rootScope.$broadcast("globalDialogs.addDialog", item.dialog);
                    storageCustomPopupsInfo[key] = storageCustomPopupsInfo[key] || {};
                    storageCustomPopupsInfo[key].lastShowedTime = Date.now();
                    storageCustomPopupsInfo[key].showedTimes = (storageCustomPopupsInfo[key].showedTimes || 0) + 1;
                    Storage.set('storageCustomPopupsInfo', storageCustomPopupsInfo);
                }
            }
        }

        for (key in Config.customDialogs) {
            item = Config.customDialogs[key];
            $rootScope.geoDataAvailable = $rootScope.geoDataAvailable || Geoip.getGeoData();
            if (item.country) {
                (function (item) {
                    $rootScope.geoDataAvailable.then(function (data) {
                        if (item.country === data.countryName.toLowerCase()) {
                            checkDataAndAddDialog(item);
                        }
                    });
                })(item);
            } else {
                checkDataAndAddDialog(item);
            }
        }
    }

    $scope.$on('$locationChangeSuccess', function () {
        loadDialogsFromConfig();
    });

    $rootScope.$watch("env.authorized", function (newValue) {
        loadDialogsFromConfig();
    }, true);

    /**
     * @ngdoc method
     * @name buttonClick
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description Button clicked
     */
    $scope.buttonClick = function buttonClick() {
        if ($rootScope.globalDialog) {
            if ($rootScope.globalDialog.buttonBroadcast) {
                $rootScope.$broadcast($rootScope.globalDialog.buttonBroadcast);
            }
        }
        $scope.closeDialog();
    };

    /**
     * @ngdoc method
     * @name closeDialog
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description Close the dialog
     */
    $scope.closeGlobalDialog = function closeGlobalDialog(reloadOnClose) {

        if ($rootScope.globalDialog && $rootScope.globalDialog.reloadOnClose && reloadOnClose) {
            $scope.refresh();
        }

        $rootScope.globalDialog = null;
    };

    /**
     * @ngdoc method
     * @name refresh
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description Refresh main window
     */
    $scope.refresh = function refresh() {
        TimeoutWrapper(function () {
            $window.location.reload();
        }, 100);
    };

    /**
     * @ngdoc method
     * @name answer
     * @methodOf vbet5.controller:globalDialogCtrl
     * @description closes yes/no dialog and broadcasts user's answer
     * @param {String} usersAnswer user's answer
     */
    $scope.answer = function answer(usersAnswer) {
        $rootScope.$broadcast('dialog.' + usersAnswer);
        $scope.closeDialog();
    };

    /**
     * displays messagebox if corresponding param in url is set
     */
    if ($location.search().message) {
        addDialog({
            type: $location.search().messagetype ? $location.search().messagetype.toLowerCase() : 'info',
            title: $location.search().messagetype || 'Info',
            content: $location.search().message,
            index: $scope.globalDialogs.length,
            standardPopup: true
        });

        $location.search('message', undefined); //remove it after displaying
        $location.search('messagetype', undefined); //remove it after displaying
    }

    /*
     *Get custom popup content from cms
     */
    function showRuntimePopup(name) {
        content.getPage(name + '-' + Config.env.lang).then(function (data) {
            console.log('-----------------------');
            console.log(data);
            if (data.data && data.data.popup) {
                var loginStatus = parseInt(data.data.popup.login || 0),
                    userTime = Moment.get().utc().unix(),
                    repeatType = data.data.popup.custom_fields.repeat_type,
                    customRepeat = data.data.popup.custom_fields.custom_repeat,
                    lastShow = parseInt(Storage.get(name + 'PopupShowedTime'), 10),
                    expiryTime = 1;

                switch (repeatType) {
                    case 'never':
                        expiryTime = false;
                        break;
                    case 'once_a_day':
                        expiryTime = 86400;
                        break;
                    case 'once_a_week':
                        expiryTime = 604800;
                        break;
                    case 'once_a_month':
                        expiryTime = 2592000;
                        break;
                    case 'custom':
                        expiryTime = parseInt(customRepeat, 10) * 60;
                        break;
                }

                if ((loginStatus === 0 && !Config.env.authorized) || (loginStatus === 1 && Config.env.authorized) || loginStatus === 2) {

                    if (lastShow && expiryTime === false) {
                        return;
                    }

                    if (!lastShow || userTime > lastShow + expiryTime) {
                        addDialog({
                            type: 'cms-popup',
                            title: data.data.popup.title,
                            content: data.data.popup.content + ' '
                        });
                        Storage.set(name + 'PopupShowedTime', userTime);
                    }
                }
            }
        });
    }

    if (Config.main.enableGettingRuntimePopupFromCMS && $location.path() != '/popup/') {
        showRuntimePopup('runtimepopup');
        showRuntimePopup('runtimepopup2');
        $scope.$on('login.loggedIn', function () {
            showRuntimePopup('runtimepopup');
            showRuntimePopup('runtimepopup2');
        });
    }
}]);