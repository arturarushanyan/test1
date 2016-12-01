VBET5.controller('pokerCtrl', ['$rootScope', '$scope', '$sce', 'Config', function($rootScope, $scope, $sce, Config) {
    $rootScope.footerMovable = true;

    $scope.initPoker = function initPoker() {
        $scope.setTitle('Poker');
        $scope.pokerUrl = $sce.trustAsResourceUrl(Config.main.headerPokerLink);
    }
}]);
