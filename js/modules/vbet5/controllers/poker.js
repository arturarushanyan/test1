VBET5.controller('pokerCtrl', ['$rootScope', '$scope', '$sce', 'Config', function($rootScope, $scope, $sce, Config) {
    $rootScope.footerMovable = true;

    $scope.initPoker = function initPoker() {
        $scope.setTitle('Poker');

        if (Config.env.lang === 'eng') {
            $scope.pokerUrl = $sce.trustAsResourceUrl(Config.main.headerPokerLink.home + 'en');
        }
        if (Config.env.lang === 'chi') {
            $scope.pokerUrl = $sce.trustAsResourceUrl(Config.main.headerPokerLink.home + 'zh-cn');
        }
        else {
            $scope.pokerUrl = $sce.trustAsResourceUrl(Config.main.headerPokerLink.home + 'en');
        }
    }
}]);
