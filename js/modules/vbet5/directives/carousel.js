'use strict';
var $frame = $('#frame');
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
};

var sly = new Sly(document.getElementById('#frame')); 

VBET5.directive('slyHorizontalRepeat', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        if (scope.$last === true) {
          $timeout(function () {
            var cont = $('#frame')
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
                //prevPage: wrap.find('.prevPage') || null,
               // nextPage: wrap.find('.nextPage') || null
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
            // Call Sly on frame
            frame.sly(options, callback());  //         scope.$emit('ngRepeatFinished');
          });
        }
      }
    };
  }
]);

//METHODS
//Positioning
VBET5.directive('slyToBegin', function () {
  //slyToStart doesnt seem to work :( 
  return {
    restrict: 'A',
    link: function (scope, el, attrs) {
      el.on('click', function () {
        // Need to pass the sly frame element Id
        var frame = $('#' + attrs.slyFrame);
        var item = attrs.slyDataItem || undefined;
        // Animate a particular item to the start of the frame.
        // If no item is provided, the whole content will be animated.
        frame.sly('toStart', item);
      });
    }
  };
});
VBET5.directive('slyToCenter', function () {
  return {
    restrict: 'A',
    link: function (scope, el, attrs) {
      el.on('click', function () {
        // Need to pass the sly frame element Id
        var frame = $('#' + attrs.slyFrame);
        var item = attrs.slyDataItem || undefined;
        // Animate a particular item to the center of the frame.
        // If no item is provided, the whole content will be animated.
        frame.sly('toCenter', item);
      });
    }
  };
});
VBET5.directive('slyToEnd', function () {
  return {
    restrict: 'A',
    link: function (scope, el, attrs) {
      el.on('click', function () {
        // Need to pass the sly frame element Id
        var frame = $('#' + attrs.slyFrame);
        var item = attrs.slyDataItem || undefined;
        // Animate a particular item to the center of the frame.
        // If no item is provided, the whole content will be animated.
        frame.sly('toEnd', item);
      });
    }
  };
});