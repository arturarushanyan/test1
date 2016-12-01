/**
 * @ngdoc controller
 * @name vbet5.controller:betPrint
 * @description Bet Print
*/
angular.module('vbet5').controller('betPrint', ['$scope', '$location', 'TimeoutWrapper', function ($scope, $location, TimeoutWrapper) {
    'use strict';

    TimeoutWrapper = TimeoutWrapper($scope);
    function regroupEvents() {
        if ($scope.betData.events) {
            $scope.events = [];
            var i, length = $scope.betData.events.length;

            for (i = 0; i < length; i += 2) {
                $scope.events.push($scope.betData.events.slice(i, i + 2));
            }
        }
    }

    $scope.printBetEvent = function printBetEvent() {
        $scope.betData = JSON.parse(decodeURIComponent($location.search().data));
        regroupEvents();

        $scope.userId = $location.search().userId;
    };
    $scope.print = function(){
        TimeoutWrapper(print);
    };

    $scope.printCouponContent = function printCouponContent() {
        $scope.liveCalendarGames = topLevelLiveCalendarGames;
        $scope.marketEvents = topLevelMarketEvents;
        TimeoutWrapper(print);
    };
}]);