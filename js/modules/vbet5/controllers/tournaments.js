/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:homepageTournaments
 * @description
 *  poker login controller
 */
VBET5.controller('homepageTournaments', ['$scope', 'Zergling', 'Translator', 'Utils', function ($scope, Zergling, Translator, Utils) {
    'use strict';
    $scope.tournamentsLoadComplete = false;

    $scope.options = [
        {label: Translator.get("Backgammon"), value: 1, href: "#/backgammon/"},
        {label: Translator.get("Chinese Poker"), value: 2, href: "#/games/"}
    ];

    $scope.tournamentModel = {selectedTournament: $scope.options[0]};
    //1 backgammon
    //2 chines epoker

    function loadTournament() {
        Zergling.get({product_type: $scope.tournamentModel.selectedTournament.value}, 'get_tournaments').then(function (response) {
            if (response) {
                $scope.tournamentsLoadComplete = true;
                $scope.name = response.name;
                $scope.time = response.start_time.split(' ')[1];
                $scope.prize = response.prize;
                $scope.entranceFee = response.entrance_fee;
            }
        });
    }

    $scope.loadTournament = loadTournament;

    $scope.getPokerLeaderboard = function getPokerLeaderboard() {
        Zergling.get({count: 6}, 'casino_get_player_points').then(function (response) {
            if (response) {
                $scope.pokerLeaderboard = response;
            }
        });
    };

    $scope.getBackgammonTournamentList = function getBackgammonTournamentList() {
        Zergling.get({}, 'get_skillgames_tournaments_schedule').then(function (response) {
            if (response && response.details) {
                $scope.backgammonTournamentList = Utils.objectToArray(response.details);
            }
        });
    };


}]);