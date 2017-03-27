/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:fixOnScroll
 * @description keep element visible in case of page scrolling
 *
 * @param {string} scrollable-area-id id of element containing the scrollable area which must be watched
 * @param {string} footer-id id of footer element
 * @param {string} watch-elements space delimited list of additional elements ids to monitor and reposition element on height change
 * @param {number} top-offset space between element and window top at which element should stay fixed
 */
VBET5.directive('fixonscroll', ['$window', 'DomHelper', 'UserAgent', function ($window, DomHelper, UserAgent) {
    'use strict';
    return function (scope, element, attrs) {
       // var elementDefaultOffset = 0;
        var positioning = function () {
            var y = ($window.pageYOffset !== undefined) ? $window.pageYOffset : ($window.document.documentElement || $window.document.body.parentNode || $window.document.body).scrollTop;
            var footerElement = $window.document.getElementById(attrs.footerId);
            var footerOffset = footerElement ? footerElement.offsetTop - y : $window.document.body.offsetHeight;
            var scrollableAreaContainerElement = $window.document.getElementById(attrs.scrollableAreaId);
            if (scrollableAreaContainerElement === null) { //in case we're in another view
                return;
            }
            var containerHeight = scrollableAreaContainerElement.scrollHeight;
            var elementHeight = element[0].scrollHeight;
            var elementDefaultOffset =  parseInt(attrs.defaultOffset, 10);
            if(!elementDefaultOffset) {
                var headerHeight = $window.document.getElementById(attrs.headerId).offsetHeight || 0;
                elementDefaultOffset =  DomHelper.getOffset(element[0]).top  - headerHeight;
            }
            var elementTopOffset = parseInt(attrs.topOffset, 10) || 0;

           if ($window.pageYOffset < elementDefaultOffset - elementTopOffset ) { //|| containerHeight < elementHeight || UserAgent.isIE8orOlder()
                angular.element(element[0]).removeClass('scrollable-absolute scrollable-fixed');
            } else {
                /*if (footerOffset <= element[0].scrollHeight) {
                    angular.element(element[0]).addClass('scrollable-absolute');

                } else {*/
                    angular.element(element[0]).removeClass('scrollable-absolute');
                    angular.element(element[0]).addClass('scrollable-fixed');
               // }
            }

        };

        if (attrs.watchElements) {
            angular.forEach(attrs.watchElements.split(' '), function (id) {
                if (id.trim()) {
                    DomHelper.onElementHeightChange(id, positioning);
                }
            });
        }

        DomHelper.onDocumentHeightChange(positioning);
        angular.element($window).bind("scroll", positioning);



        /*angular.element($window).bind("resize", function () {
            if (element[0].style.position === "fixed") {
                element[0].style.left = DomHelper.getOffset(element[0].parentElement).left + element[0].parentElement.scrollWidth - element[0].scrollWidth + "px";
            }
        });*/

        /**
         * @description forces the element to stay fixed on the page
         */
        scope.$on('forceElementFix', function(e, data) {
            var el = $window.document.getElementById(data.id);
            angular.element(el).removeClass('scrollable-absolute');
            angular.element(el).addClass('scrollable-fixed');
        })
    };
}]);