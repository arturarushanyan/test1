'use strict';
var $frame = $('.sly-frame');

var sly = new Sly($('.sly-frame'));

//DEFAULTS
var defaultOptions = {
  horizontal: 1,
  itemNav: 'basic',
  activateMiddle: 0,
  smart: 1,
  activateOn: 'click',
  mouseDragging: 1,
  touchDragging: 1,
  releaseSwing: 1,
  startAt: 1,
  activatePageOn: 'click',
  speed: 200,
  moveBy: 600,
  elasticBounds: 1,
  dragHandle: 1,
  dynamicHandle: 1,
  clickBar: 1,
	scrollBy: 1,
	forward : 1,
	backward: 1,
  prev: $frame.find('.prevPage'),
  next: $frame.find('.nextPage'),
  prevPage: $frame.find(''),
  nextPage: $frame.find('')
};

var defaultOptions_simple = {
  horizontal: 1,
  itemNav: 'basic',
  activateMiddle: 1,
  smart: 1,
  activateOn: 'click',
  mouseDragging: 0,
  touchDragging: 0,
  releaseSwing: 1,
  startAt: 0,
  activatePageOn: 'click',
  speed: 500,
  elasticBounds: 1,
  dragHandle: 0,
  dynamicHandle: 1,
  easing: 'swing',
  clickBar: 1,
  scrollBy: 0,
  forward : 1,
  backward: 1,
  prev: $frame.find(''),
  next: $frame.find(''),
  prevPage: $frame.find('.left-arrow-winners'),
  nextPage: $frame.find('.right-arrow-winners')
};


VBET5.directive('slyHorizontalRepeat', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        if (scope.$last === true) {
          $timeout(function () {
            var cont = $('.sly-frame');
            var frame = $(el[0]).parent().parent();
            var wrap = $(el[0]).parent().parent().parent();
            defaultOptions.horizontal = 1;
            var defaultControls = {
                scrollBar: wrap.find('.scrollbar') || null,
                pagesBar: wrap.find('.pages') || null,
                forward: wrap.find('.forward') || null,
                backward: wrap.find('.backward') || null,
                prev: wrap.find('.prevPage') || null,
                next: wrap.find('.nextPage') || null,
                prevPage: wrap.find('.left-arrow-winners') || null,
                nextPage: wrap.find('.right-arrow-winners') || null
              };
            // Merge parts into options object for sly argument
            var options = $.extend({}, defaultOptions, defaultControls, scope.$eval(attrs.slyOptions));
            var callback = scope.$eval(attrs.slyCallback) || function (cb) {};
          
            $(window).on('resize', function () {
              frame.sly('reload');
            });
          
            scope.$watch(
              function(){ return cont.width() },
              function(newValue, oldValue) {
                if ( newValue !== oldValue ) {
                  frame.sly('reload');                 
                }
              }
            );

            scope.$watch(
                function () {
                    return scope.value;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(oldValue, newValue)) {
                      frame.sly("reload");
                    }
                },
            true);
            
            // Call Sly on frame
            frame.sly(options, callback()); 
          });
        }
      }
    };
  }
]);


VBET5.directive('slyHorizontalRepeatSimple', [
  '$timeout',
  function($timeout,$window) { 
    return {
        restrict: 'A',
        link: function(scope, el, attrs) {
            if (scope.$last === true) {
                $timeout(function() {
                    var cont = $(el[0]);
                  //  var _timeout  = null;
                    var frame = $(el[0]).parent().parent();
                    var wrap = $(el[0]).parent().parent().parent();
                    defaultOptions_simple.horizontal = 1;

                    var defaultControls = {
                        scrollBar: wrap.find('.scrollbar') || null,
                        pagesBar: wrap.find('.pages') || null,
                        forward: wrap.find('.forward') || null,
                        backward: wrap.find('.backward') || null,
                        prev: wrap.find('.prev') || null,
                        next: wrap.find('.next') || null,
                        prevPage: wrap.find('.left-arrow-winners') || null,
                        nextPage: wrap.find('.right-arrow-winners') || null
                    };
                    // Merge parts into options object for sly argument
                    var options = $.extend({}, defaultOptions_simple, defaultControls, scope.$eval(attrs.slyOptions));
                    var callback = scope.$eval(attrs.slyCallback) || function(cb) {};
                    // Call Sly on frame
                    frame.sly(options, callback());
                    //         scope.$emit('ngRepeatFinished');
                    $(window).on("resize", function() {
                        frame.sly("reload");
                    });

                    var watcher = scope.$watch(

                      function () {
                         return scope.value;
                      },

                      function (newValue, oldValue) {
                         if (!angular.equals(oldValue, newValue)) {
                              $timeout(function() { 
                                  frame.sly("reload");                              
                                  watcher();
                                  console.log('aaa');
                              }, 300)
                         }

                    }  ,true);

                    // Call Sly on frame
                    frame.sly(options, callback());
                });
            }
        }
  }
}]);