/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:vbetBigSlider
 * @description Big slider widget
 */
VBET5.directive('vbetBigSlider', ['$rootScope', '$timeout', '$route', '$interval', 'Config', '$sce', function ($rootScope, $timeout, $route, $interval, Config, $sce) {
    'use strict';
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'templates/directive/big-slider.html',
        scope: {
            sliderTemplate: '=',
            images: '=',
            linkClickHandler: '&'
        },
        link: function (scope) {
            scope.index = 0;
            scope.$sce = $sce;
            var stopInterval;
            /**
             * @description Slides click handler
             * @param (String) bannerLink
             */
            scope.linkClick = function (banner) {
                if (banner.isYouTubeVideo) {
                    $rootScope.$broadcast('youtube.videourl', banner.link);
                } else if (banner.link) {
                    scope.linkClickHandler()(banner.link);
                    $timeout(function () { $route.reload(); }, 100);
                }
            };

            scope.changeActiveBanner = function changeActiveBanner(activeIndex) {
                scope.index = activeIndex;
            };
            
            /**
             * @description Automatically start slides animation
             */
            function animateBanners() {
                if (scope.rotationPaused || !scope.images) {
                    return;
                }
                if (scope.index === scope.images.length - 1) {
                    scope.index = 0;
                } else {
                    scope.index++;
                }
            }

            stopInterval = $interval(animateBanners, Config.main.featuredGamesRotationPeriod);

            scope.$on('$destroy', function () {
                $interval.cancel(stopInterval);
            });
        }
    };
}]);