/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:bannerSlider
 *
 * @description displaysblock with sliding banners
 * @param {String} slug slug id (key in WPConfig.bannerSlugs)
 * @param {Number} [interval] optional. Rotation interval in milliseconds (default is 10000)
 *
 */
VBET5.directive('bannerSlider', ['$rootScope', '$location', '$interval', 'analytics', 'WPConfig', 'content', function ($rootScope, $location, $interval, analytics, WPConfig, content) {
    'use strict';
    return {
        restrict: 'EA',
        replace: false,
        templateUrl: $rootScope.getTemplate('templates/directive/bannerslider.html'),
        scope: {
            slug: '=',
            ngHide: '=?'
        },
        link: function (scope, element, attrs) {
            scope.slide = 0;
            scope.over = false;
            scope.banners = [];
            var intervalPromise;

            function animateBanners() {
                if (scope.over) {
                    return;
                }
                if (scope.slide === scope.banners.length -1) {
                    scope.slide = 0;
                } else {
                    scope.slide++;
                }
            }
            /**
             * @ngdoc method
             * @name getBanners
             * @methodOf vbet5.directive:bannerSlider
             * @description   populates $scope's **banners** variable with banner information got from cms
             *
             * @param {string} slug  slug id (key in WPConfig.bannerSlugs)
             */
            function getBanners(slug) {
                var cmd, containerId;
                containerId = WPConfig.bannerSlugs[slug][$rootScope.env.lang];
                content.getWidget(containerId).then(function (response) {
                    if (response.data && response.data.widgets && response.data.widgets[0]) {
                        scope.banners = [];
                        angular.forEach(response.data.widgets, function (widget) {
                            widget.instance.linkType = 'url';
                            if (widget.instance.text) {
                                widget.instance.linkType = 'html';
                            } else if (widget.instance.link) {
                                cmd = widget.instance.link.split(':');
                                switch (cmd[0]) {
                                case 'broadcast':
                                    widget.instance.link = cmd[1];
                                    widget.instance.linkType = 'broadcast';
                                    break;
                                }
                            }

                            scope.banners.push(widget.instance);
                        });

                        intervalPromise = $interval(animateBanners, attrs.interval || 10000);
                    } else {
                        scope.ngHide = true;
                    }

                });
            };

            /**
             * @ngdoc method
             * @name bannerClick
             * @methodOf vbet5.directive:bannerSlider
             * @description sends ga message
             *
             * @param {Object} [banner]  current object of slider
             */
            scope.bannerClick = function bannerClick(banner) {
                analytics.gaSend('send', 'event', 'news', {
                    'page': $location.path(),
                    'eventLabel': attrs.slug + ' banner click: ' + banner.title
                });
            };

            getBanners(attrs.slug);

            scope.$on('$destroy', function () {
                $interval.cancel(intervalPromise);
            });
        }
    };
}]);
