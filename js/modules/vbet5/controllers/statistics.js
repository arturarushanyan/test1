VBET5.controller('statisticsCtrl', ['$rootScope', '$scope', '$sce', 'Config', function($rootScope, $scope, $sce, Config) {
    $rootScope.footerMovable = true;

    $scope.initStatistics = function initStatistics() {
        $scope.setTitle('Statistics');
        $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink +'/#/'+ Config.env.lang);
    }
}]);
