/*global VOPT,chrome*/
VOPT.controller("options", ['Config', '$scope', 'Storage', function (Config, $scope, Storage) {
    'use strict';
    $scope.conf = Config.main;
    $scope.env = Config.env;
    $scope.notifState = true;
    $scope.notifSound = true;

    if (Storage.get('isNotificationsActivated') !== undefined) {
        $scope.notifState = Storage.get('isNotificationsActivated');
    }

    if (Storage.get('isNotifSoundEnabled') !== undefined) {
        $scope.notifSound = Storage.get('isNotifSoundEnabled');
    }

    if (Storage.get('lang') === undefined) {
        Storage.set('lang', $scope.env.lang);
    } else {
        $scope.env.lang = Storage.get('lang') || $scope.env.lang;
    }

    /**
     * @ngdoc method
     * @name applySettings
     * @methodOf vopt.controller:options
     * @description  Apply user settings
     */
    $scope.applySettings = function applySettings() {
        Storage.set('lang', Config.env.lang);
        Storage.set('isNotificationsActivated', $scope.notifState);
        Storage.set('isNotifSoundEnabled', $scope.notifSound);
        chrome.runtime.sendMessage({langChanged: true});
    };


}]);