VBET5.controller('sportsbookSwitchersCtrl', ['$scope', '$rootScope', 'Utils', 'Config', function ($scope, $rootScope, Utils, Config) {
    'use strict';
    $scope.sportsbookAvailableViews = Utils.checkForAvailableSportsbookViews(Config);
}]);
