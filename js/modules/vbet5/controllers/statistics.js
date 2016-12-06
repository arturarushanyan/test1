VBET5.controller('statisticsCtrl', ['$rootScope', '$scope', '$sce', 'Config', function($rootScope, $scope, $sce, Config) {
    $rootScope.footerMovable = true;

    $scope.initStatistics = function initStatistics() {
        $scope.setTitle('Statistics');

        if (Config.env.lang === 'por') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'pt');
        }
        if (Config.env.lang === 'eng') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'en');
        }
        if (Config.env.lang === 'spa') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'es');
        }
        if (Config.env.lang === 'ita') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'it');
        }
        if (Config.env.lang === 'rus') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'ru');
        }
        if (Config.env.lang === 'tur') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'tr');
        }
        if (Config.env.lang === 'chi') {
            $scope.statsUrl = $sce.trustAsResourceUrl(Config.main.headerStatisticsLink + '/#/' + 'ch');
        }
    }
}]);
