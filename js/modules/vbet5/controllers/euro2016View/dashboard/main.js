/**
 * @ngdoc controller
 * @name vbet5.controller:classicViewMainCtrl
 * @description
 * Classic mode view controller
 */
angular.module('vbet5.betting').controller('euro2016DashboardMainController', ['$rootScope', '$scope', '$controller', '$sce', 'TimeoutWrapper', 'Utils', 'Config', 'content', '$location', function ($rootScope, $scope, $controller, $sce, TimeoutWrapper, Utils, Config, content, $location) {
    'use strict';

    TimeoutWrapper = TimeoutWrapper($scope);

    $rootScope.date = new moment();

    console.log("DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    console.log($rootScope.date);

    angular.extend(this, $controller('classicViewCenterController', {
        $rootScope: $rootScope,
        $scope: $scope
    }));

    $scope.goToUrl = Utils.goToUrl;

    /*
    * @description loads page(s) from CMS
    * @param {String} slug page slug
    * @param {Boolean} withChildren whether to load page children or not
    */
    $scope.loadPage = function loadPage(slug, withChildren) {
        $scope.pageLoaded = false;
        if (Utils.isObjectEmpty($scope.pages)) {
            content.getPage(slug, withChildren).then(function (data) {
                console.log('loadPage', data);
                $scope.mainPage = data.data.page;
                $scope.pages = data.data.page ? data.data.page.children : [];
                var i, length = $scope.pages.length;
                for (i = 0; i < length; i++) {
                    $scope.pages[i].title = $sce.trustAsHtml($scope.pages[i].title);
                    $scope.pages[i].content = $sce.trustAsHtml($scope.pages[i].content);
                }
                console.log('loaded pages:', $scope.pages);
                $scope.selectedPage = $scope.pages[0];
                $scope.pagesLoaded = true;
            });
        }
    };

    /*
    * @description selects page from given page array by custom field
    * @param {Array} pages pages array
    * @param {String} title page title
    * @param {String} custom field name
    * @returns {Object} page having specified title
    */
    $scope.getPageByField = function getPageByField(pages, value, field) {
        if (!pages || !value || !field) {
            return;
        }
        var i, length = pages.length;
        for (i = 0; i < length; i++) {
            if (pages[i].custom_fields[field][0].toString() === value.toString()) {
                return pages[i];
            }
        }
    };


    (function init () {
        TimeoutWrapper(function () {
            $scope.$broadcast('euro2016.comboView.leftMenu.liveNow');
        }, 100);

        if (Config.env.preMatchMultiSelection) {
            $rootScope.$broadcast('toggleMultiView');
        }
    })();
}]);