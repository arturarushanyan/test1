/**
 * @ngdoc directive
 * @name CASINO.directive:biggestWinners
 * @element ANY
 * @param {Number} initial-width initial width of target element
 *
 * @description Makes gets and updates list of biggest winners of casino
 */
CASINO.directive('casinoBiggestWinners', ['$interval', 'CConfig', 'Zergling', 'Utils', function ($interval, CConfig, Zergling, Utils) {
    'use strict';
    return {
        restrict: 'E',
        replace: true,
        template: '<ng-include src="templateUrl"/>',
        scope: {
            limit: '=',
            templateUrl: '@',
            title: '@'
        },
        link: function (scope) {
            var updateInterval;
            scope.activeTab = CConfig.main.biggestWinners.topWinners ? 'top' : 'last';
            scope.imagePath = CConfig.cUrlPrefix + CConfig.winnersIconsUrl;
            scope.biggestWinners = CConfig.main.biggestWinners;

            /**
             * @ngdoc method
             * @name changeTab
             * @description  changed request and showing content from 'Top Winners' to 'Last Winners' and vice versa
             */
            scope.changeTab = function changeTab(tabName) {
                if(scope.activeTab === tabName){ return; }

                scope.activeTab = tabName;
                scope.winners = '';
                $interval.cancel(updateInterval);
                if(scope.activeTab === 'last') {
                    updateInterval = $interval(getWinners, CConfig.main.biggestWinners.updateInterval || 10000);
                }
                getWinners();
            };

            /**
             * @ngdoc method
             * @name getWinners
             * @description  get winners data
             */
            function getWinners() {
                scope.winnersLoading = true;
                var command = (scope.activeTab === 'top') ? 'get_partner_last_big_wins' : 'get_partner_last_wins';
                var request = {
                    count: scope.limit || 5
                };
                Zergling.get(request, command).then(function (result) {  //  or get_partner_last_big_wins
                    if (result.details) {
                        scope.winners = Utils.objectToArray(result.details);
                    }
                })['catch'](function (reason) {
                    console.log('Error:'); console.log(reason);
                })['finally'](function () {
                    scope.winnersLoading = false;
                });
            }

            if(scope.activeTab === 'last') {
                updateInterval = $interval(getWinners, CConfig.main.biggestWinners.updateInterval || 15000);
            }
            getWinners();

            scope.openWinnerGame = function openWinnerGame (gameExternalId) {
                scope.$emit('winnerGame.open', gameExternalId);
            };


            /**
             * clear interval
             */
            scope.$on('$destroy', function () {
                $interval.cancel(updateInterval);
            });
        }
    };
}]);