/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:promotionNews
 * @description Renders promotion news by given slug from wordpress
 */
VBET5.directive('promotionNews',
    ['$routeParams', '$window', '$rootScope', '$sce', '$location', '$timeout', 'Config', 'WPConfig', 'content', 'Utils', 'analytics', 'DomHelper',
        function ($routeParams, $window, $rootScope, $sce, $location, $timeout, Config, WPConfig, content, Utils, analytics, DomHelper) {
            'use strict';
            var templates = {
                slider: 'templates/directive/promotion-news-slider.html',
                main: 'templates/directive/promotion-news.html'
            };
            return {
                restrict: 'E',
                replace: false,
                template: '<div ng-include="getTemplate()"></div>',
                scope: {
                    count: '@',
                    hideDates: '@',  //hides publish date
                    mainClass: '@',
                    template: '@',
                    path: '@',       //path of page where directive or placed (for generating sharing links)
                    sharePath: '@',   // if specified, this path will be used in sharing link generation (without deeplinking to specific promo)
                    slug: '@',
                    categorySlugKey: '@',
                    useCustomBaseHost: '@' // for new cms
                },
                link: function ($scope, element, attrs) {
                    var recentNews = [], newsPerGroup = WPConfig.news.pokerNewsPerGroup, isSliderMode,
                        SLIDER_NEWS_COUNT = {
                            wideOn: 4,
                            wideOff: 3
                        };
                    $scope.count = $scope.count || WPConfig.news.numberOfRecentNews;
                    $scope.showDates = !$scope.hideDates;
                    $scope.conf = Config.main;
                    $scope.getTemplate = function () {
                        var url;
                        if (templates[attrs.template]) {
                            url = templates[attrs.template];
                                isSliderMode = true;
                                initSliderMode();
                        } else {
                            url = templates.main;
                        }
                        return url;

                    };

                    function groupNewsInGroups(count) {
                        var groupCount = count || newsPerGroup;
                        if (recentNews) {
                            $scope.recentNewsList = Utils.groupToGroups(recentNews, groupCount, 'news');
                        }
                    }

                    function findAndOpenNews() {
                        var searchParams = $location.search();

                        if (searchParams.news !== undefined) {
                            var newsID = parseInt(searchParams.news, 10);
                            var i, j;
                            for (i = 0; i < $scope.recentNewsList.length; i++) {
                                for (j = 0; j < $scope.recentNewsList[i].news.length; j++) {
                                    if ($scope.recentNewsList[i].news[j].id == newsID) {
                                        $timeout(function () {
                                            $scope.showNews($scope.recentNewsList[i].news[j], $scope.recentNewsList[i].id);
                                        }, 100);

                                        return;
                                    }
                                }
                            }
                        }
                    }

                    function getPermaLink(news) {
                        var link, origin = $window.location.protocol + "//" + $window.location.hostname + ($window.location.port ? ':' + $window.location.port : '');
                        if ($scope.sharePath) {
                            link = origin + $window.document.location.pathname + $scope.sharePath;
                        } else if (WPConfig.seoFilesGenerationActive) {
                            link = origin + $window.document.location.pathname + $scope.path + '/' + decodeURIComponent(news.slug) + '-id' + news.id + '.html';
                        } else {
                            link = origin + $window.document.location.pathname + '%23' + $location.path() + '%3Fnews=' + news.id + '%23news-' + news.id;
                        }
                        return link;
                    }

                    /**
                     * @ngdoc method
                     * @name groupSliderNews
                     * @description  Group news depend on screen for slider mode
                     *
                     */
                    function groupSliderNews() {
                        if (DomHelper.getWindowSize().width < 1300) {
                            groupNewsInGroups(SLIDER_NEWS_COUNT.wideOff);
                        } else {
                            groupNewsInGroups(SLIDER_NEWS_COUNT.wideOn);
                        }
                    }

                    /**
                     * Retrive news from backend
                     * @param count
                     */
                    function loadNews(count) {
                        count = parseInt(count, 10) || 999;
                        var categorySlugKey = $scope.categorySlugKey || "newsCategorySlugs";
                        var type = $routeParams.type ? $routeParams.type + "-" : "";
                        if (WPConfig[type + $scope.slug] && WPConfig[type + $scope.slug][categorySlugKey] && WPConfig[type + $scope.slug][categorySlugKey][$rootScope.env.lang]) {
                            var categorySlug = WPConfig[type + $scope.slug][categorySlugKey][$rootScope.env.lang];
                            $scope.newsAreLoading = true;
                            content.getPostsByCategorySlug(categorySlug, count, false, WPConfig.wpPromoUrl, $scope.useCustomBaseHost && WPConfig.wpPromoCustomBaseHost).then(function (response) {
                                $scope.newsAreLoading = false;
                                if (response.data && response.data.posts) {
                                    recentNews = response.data.posts;
                                    var i, length = recentNews.length;
                                    for (i = 0; i < length; i += 1) {
                                        recentNews[i].titleRaw = angular.element('<div/>').html(recentNews[i].title).text(); //decode html entities
                                        recentNews[i].title = $sce.trustAsHtml(recentNews[i].title);
                                        recentNews[i].permalink = getPermaLink(recentNews[i]);
                                        recentNews[i].content = $sce.trustAsHtml(recentNews[i].content);
                                    }

                                    (templates[attrs.template]) ? groupSliderNews() : groupNewsInGroups();
                                    $scope.areThereMore = $scope.count < response.data.count;
                                    findAndOpenNews();
                                }
                            });
                        }
                    }


                    /**
                     * @ngdoc method
                     * @name showNews
                     * @methodOf CMS.controller:cmsPagesCtrl
                     * @description  Sets selected news
                     *
                     * @param {object} news news object
                     */
                    $scope.showNews = function showNews(news, groupId) {
                        if (Config.main.disbalePromoNewsForNonAuthorizedUsers && !$rootScope.env.authorized) {
                            $rootScope.$broadcast("openLoginForm");
                            return;
                        }
                        if ($scope.selectedNews === news) {
                            $scope.closeNews();
                            return;
                        }
                        $location.search('news', news.id);
                        analytics.gaSend('send', 'event', 'news', 'show poker news', {
                            'page': $location.path(),
                            'eventLabel': news.categories.length > 0 ? news.categories[0].title : ''
                        });
                        $scope.selectedNews = news;
                        $scope.selectedNewsGroupId = groupId;
                        if (typeof $scope.selectedNews.content === 'string') { //not to do it twice
                            $scope.selectedNews.content = $sce.trustAsHtml($scope.selectedNews.content);
                        }
                        if (typeof $scope.selectedNews.title === 'string') { //not to do it twice
                            $scope.selectedNews.title = $sce.trustAsHtml($scope.selectedNews.title);
                        }

                        DomHelper.scrollIntoView('news' + $scope.selectedNews.id);

                    };

                    $scope.loadMore = function loadMore() {
                        $scope.count += newsPerGroup === WPConfig.news.newsPerGroupWide ? WPConfig.news.increaseByWide : WPConfig.news.increaseBy;
                        loadNews($scope.count);
                    };

                    $scope.$on('widescreen.on', function () {
                        newsPerGroup = WPConfig.news.pokerNewsPerGroupWide;
                        (templates[attrs.template]) ? groupNewsInGroups(SLIDER_NEWS_COUNT.wideOn) : groupNewsInGroups();
                    });

                    $scope.$on('widescreen.off', function () {
                        newsPerGroup = WPConfig.news.pokerNewsPerGroup;
                        (templates[attrs.template]) ? groupNewsInGroups(SLIDER_NEWS_COUNT.wideOff) : groupNewsInGroups();
                    });

                    function init() {
                        loadNews($scope.count);
                    }

                    // Initialize directive
                    init();

                    /**
                     * @ngdoc method
                     * @name closeNews
                     * @methodOf CMS.controller:cmsPagesCtrl
                     * @description  closes open news
                     */
                    $scope.closeNews = function closeNews() {
                        $scope.selectedNews = null;
                        $location.search('news', undefined);
                    };
                    function initSliderMode() {
                        $scope.slideLeft = function () {
                            $scope.selectedGroupId--;
                        };
                        $scope.slideRight = function () {
                            $scope.selectedGroupId++;
                        };
                        $scope.pickFirstGroup = function (group) {
                            $scope.selectedGroupId = group.id;
                        };
                    }

                }
            };
        }
    ]);