/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:loadMore
 * @element ANY
 *
 * @description Automatically triggers click once page is scrolled to the element
 *
 */
VBET5.directive('loadMore', ['$window', '$timeout', function($window, $timeout) {
  'use strict';
  return {
    restrict: 'A',
    scope: {
      exception: '=',
      bottomOffset: '='
    },
    link: function(scope, element) {
        var clicked = false,
        bottomOffset = scope.bottomOffset || 10;

        function elementInViewport() {
            var windowHeight = "innerHeight" in document.querySelector('.ngscroll-container') ? document.querySelector('.ngscroll-container').innerHeight : document.documentElement.offsetHeight;
            var body = document.querySelector('.ngscroll-container'),
              html = document.documentElement;
            var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            var windowBottom = windowHeight + window.pageYOffset;
            return windowBottom + bottomOffset <= docHeight;
        }

        angular.element(document.querySelector('.ngscroll-container')).bind('mousewheel', function(){
            if (!scope.exception && elementInViewport() && !clicked) {
              element.triggerHandler('click');
              clicked = true;
              $timeout(function() {
                clicked = false;
              }, 200);
            }
        })
    }
  };
}]);