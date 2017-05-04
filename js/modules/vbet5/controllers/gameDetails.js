/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:gameDescriptionCtrl
 */
VBET5.controller('gameDetailsCtrl', ['$scope', '$location', 'casinoData', function ($scope, $location, casinoData) {
    'use strict';
    $scope.getGameDetails = function getGameDetails () {
        var game_skin_id = $location.search().game_skin_id;
        if (game_skin_id) {
            casinoData.getCasinoGameDetails(game_skin_id).then(function (response) {
                if (response && response.data) {
                    $scope.game = response.data;
                }
            });
        }
    };
}]);