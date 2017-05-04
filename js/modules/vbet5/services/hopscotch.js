/* global VBET5 */
/**
 * @ngdoc service
 * @name vbet5.service:DemoTour
 * @description  hopscotch.js(website demo tour) lib wrapper service
 */
VBET5.service('DemoTour', ['$rootScope', '$window', 'Utils', 'Translator', 'Storage', 'Config', 'TimeoutWrapper', function($rootScope, $window, Utils, Translator, Storage, Config, TimeoutWrapper) {
    'use strict';

    var demoTourJson = Config.main.demoTour.enabled ? {
        demo:{
            order: 0,
            steps: [
                {
                    target: 'faq-header',
                    order: 1,
                    title: 'Start Tour',
                    content: 'By clicking here, you can walk through demo tour',
                    showCondition: 'all', //options: <all>, <login>, <logout>
                    position: 'left',
                    addClass: 'active',
                    classTarget: 'faq-header',
                    xOffset: -100,
                    yOffset: 60
                }
            ]
        },
        header: {
            order: 1,
            steps: [
                {
                    target: 'wallet',
                    order: 1,
                    title: 'Wallet',
                    content: 'Open your Wallet, Deposit, Withdrawal sections and Balance History here!',
                    showCondition: 'login', //options: <all>, <login>, <logout>
                    position: 'bottom'
                },
                {
                    target: 'myBets',
                    order: 2,
                    title: 'My bets',
                    content: 'Open Мy Bets, check Recent Bets and Bet History here!',
                    showCondition: 'login',
                    position: 'bottom'
                }
            ]
        },
        sportsbook: {
            order: 2,
            steps: []
        },
        casino: {
            order: 3,
            steps: []
        },
        footer: {
            order: 4,
            steps: []
        }
    } : [];


    var DemoTour = {};
    var classToRemoveOnEndTour = {};
    DemoTour.hopscotch = hopscotch;

    function configureNewTour() {
        DemoTour.hopscotch.configure({
            showCloseButton: true,
            showPrevButton: true,
            i18n: {
                nextBtn: Translator.get('Next'),
                prevBtn: Translator.get('Back'),
                doneBtn: Translator.get('Done'),
                skipBtn: Translator.get('Skip')
            }
        });
    }

    function generateTourSteps(tourList) {
        var steps = [];
        for(var i = 0; i < tourList.length; i++) {
            var step = {};
            step.title = Translator.get(tourList[i].title);
            step.content = Translator.get(tourList[i].content);
            step.target = tourList[i].target;
            step.placement = tourList[i].position;
            step.xOffset = tourList[i].xOffset || 0;
            step.yOffset = tourList[i].yOffset || 0;
            if(tourList[i].addClass) {
                step.onShow = ['addClass', tourList[i].classTarget || step.target, tourList[i].addClass];
                step.onNext = ['removeClass', tourList[i].classTarget || step.target, tourList[i].addClass];
            }

            if(tourList[i].showCondition === 'all') {
                steps.push(step);
            } else {
                if(Config.env.authorized && tourList[i].showCondition === 'login') {
                    steps.push(step);
                } else if(!Config.env.authorized && tourList[i].showCondition === 'logout') {
                    steps.push(step);
                }
            }
        }
        return steps;
    }

    function getSortedItems() {
        var items = Object.keys(demoTourJson).map(function(key) {
            return [key, demoTourJson[key]];
        });

        items.sort(function(first, second) {
            return first[1].order - second[1].order;
        });
        return items;
    }

    function goToNextItem() {
        console.log('Start watching scroll');
        var currentTour = hopscotch.getCurrTour();
        var numberOfTourSteps = currentTour ? currentTour.steps.length : 0;
        var currentStep = hopscotch.getCurrStepNum() || 0;

        DemoTour.endCurrentTour();
        if( currentStep < numberOfTourSteps -1 ) {
            TimeoutWrapper(function() {
                hopscotch.startTour(currentTour, currentStep + 1);
                angular.element($window).bind('scroll', goToNextItem);
            }, 1000);

        }
    }

    DemoTour.endCurrentTour = function endCurrentTour() {
        if(DemoTour.hopscotch.getCurrTour()) {
            DemoTour.hopscotch.endTour();
            angular.element($window).unbind('scroll', goToNextItem);
        }
        configureNewTour();
    }
    DemoTour.hopscotch.registerHelper('addClass', function(domTarget, className) {
        if(!angular.element(document.querySelector('#'+ domTarget)).hasClass(className)) {
            angular.element(document.querySelector('#' + domTarget)).addClass(className);
            classToRemoveOnEndTour = {'domTarget': domTarget, 'className': className}
        }
    });

    DemoTour.hopscotch.registerHelper('removeClass', function(domTarget, className, tourEnds) {
        if(tourEnds) {
            angular.element(document.querySelector('#' + classToRemoveOnEndTour.domTarget)).removeClass(classToRemoveOnEndTour.className);
            classToRemoveOnEndTour = {};
        } else {
            angular.element(document.querySelector('#' + domTarget)).removeClass(className);
        }

    });

    DemoTour.hopscotch.registerHelper('writeToStorage', function(tourId) {
        var storageKey = 'demo' + tourId + (Config.env.authorized ? 'login' : 'logout');
       Storage.set(storageKey, true);
    });

    DemoTour.hopscotch.registerHelper('removeScrollWatcher', function() {
        angular.element($window).unbind('scroll', goToNextItem);
    });

    DemoTour.startTour = function startTour(sections, doNotCheckStorage){
        var array = [];
        var tourSteps = [];
        var tourId = 'all';

        if(sections) {
            if(angular.isArray(sections)) {
                tourId = sections.join('');
                var items = getSortedItems();

                var model = items;
                angular.forEach(model, function(object, index) {
                    var key = object[0];
                    var value = object[1];
                    if(sections.indexOf(key) >-1 && value.hasOwnProperty('steps')) {
                        var steps = value.steps.sort(Utils.orderSorting);
                        array = array.concat(steps);
                    }
                });
            } else if(demoTourJson[sections]) {
                tourId = sections;
                array = demoTourJson[sections].steps.sort(Utils.orderSorting);
            }
        } else {
            var items = getSortedItems();

            angular.forEach(items, function(object, index) {
                var key = object[0];
                var value = object[1];
                if(value.hasOwnProperty('steps')) {
                    var steps = value.steps.sort(Utils.orderSorting);
                    array = array.concat(steps);
                }
            });

        }

        tourSteps = generateTourSteps(array);
        var tour = {
            id: tourId,
            steps: tourSteps,
            onClose:[['writeToStorage', tourId],['removeClass', '', '', true], 'removeScrollWatcher'],
            onEnd: [['writeToStorage', tourId],['removeClass', '', '', true], 'removeScrollWatcher']
        };
        DemoTour.endCurrentTour();
        if(doNotCheckStorage || !Storage.get('demo' + tourId + (Config.env.authorized ? 'login' : 'logout'))) {
            DemoTour.hopscotch.startTour(tour);
            //start watching scroll
            angular.element($window).bind('scroll', goToNextItem);

        }
    }

    $rootScope.$on('$routeChangeSuccess',function(){
        DemoTour.hopscotch.endTour();

    });

    return DemoTour;
}]);
