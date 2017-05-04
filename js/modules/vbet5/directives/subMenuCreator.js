/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:menuVisibleItems
 * @description Changes item visibility depending on menu wrapper width.
 */

VBET5.directive("subMenuCreator", ['$window', function ($window) {
    'use strict';
    return {
        link: function (scope, element, attrs, ctrl) {
            var childNodes = element[0].children;

            scope.$watchCollection(function () { return ( [childNodes.length, window.innerWidth] ); }, function (newVal, oldVal) {
                var menuItems = element[0].children;
                switch (attrs.subMenuCreator) {
                    case 'main':
                        scope.subMenuItemCount = 0;
                        break;
                    case 'casino':
                        scope.subMenuItemShowBtn = false;
                        break;
                }

                for(var i=0; i < menuItems.length; i++) {
                    menuItems[i].className = menuItems[i].className.replace(' sub-menu-item', '');
                }

                if(menuItems[1]){
                    for(var j=2; j < menuItems.length; j++) {
                        var item = menuItems[j].getBoundingClientRect(),
                            secondItem = menuItems[1].getBoundingClientRect();
                        if(secondItem.top < item.top){
                            switch (attrs.subMenuCreator) {
                                case 'main':
                                    menuItems[j].className += ' sub-menu-item';
                                    scope.subMenuItemCount += 1;
                                    break;
                                case 'casino':
                                    scope.subMenuItemShowBtn = true;
                                    break;
                            }
                        }
                    }
                }
            });
        }
    }
}]);