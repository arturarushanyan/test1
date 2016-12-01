/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:lotteryCtrl
 * @description
 * lottery controller.
 */
VBET5.controller('lotteryCtrl', ['$rootScope', '$scope', '$interval', '$sce', 'Zergling', 'Moment', 'content', function ($rootScope, $scope, $interval, $sce, Zergling, Moment, content) {
    'use strict';

    $scope.tichetType = 0;
    $scope.loadedSections = 0;

    function loadLotteryTickets() {
        //$scope.ticketsLoading = true;
        Zergling
            .get({}, 'get_lottery_tickets')
            .then(function (data) {
                $scope.tickets = data.tickets;
                //$scope.ticketsLoading = false;
                $scope.loadedSections++;
                console.log('lottery tickets', data);
            }, function (reason) {
                console.log(reason);
                $scope.loadedSections++;
            });
    }

    function loadLotteryWinners(thisWeekOnly) {
        Zergling
            .get({}, 'get_lottery_winners')
            .then(function (data) {
                if (thisWeekOnly) {
                    $scope.winners = [];
                    angular.forEach(data.tickets, function (ticket) {

                        if (Moment.get().weekday(0).diff(Moment.get(ticket.date_time)) <= 0) {
                            $scope.winners.push(ticket);
                        }
                    });
                } else {
                    $scope.winners = data.tickets;
                }
                console.log('lottery loadLotteryWinners', data);
                $scope.loadedSections++;
            }, function (reason) {
                console.log(reason);
                $scope.loadedSections++;
            });
    }

    function loadMyTickets() {
        $scope.ticketsLoading = true;
        Zergling
            .get({
                'where': {
                    'outcome': 1
                }
            }, 'bet_history')
            .then(function (data) {
                $scope.myTickets = [];
                angular.forEach(data.bets.map(function (bet) { return {ticket_number: bet.loto_numbers, date_time: bet.date_time}; }), function (ticket) {
                    if (ticket.ticket_number.length > 0) {
                        $scope.myTickets.push(ticket);
                    }
                });
                $scope.ticketsLoading = false;
                console.log('my tickets', $scope.tickets);
            }, function (reason) {
                console.log(reason);
            });
    }

    function loadLotteryRules() {
        content.getPage('lottery-' + $rootScope.env.lang, true).then(function (response) {
            $scope.lotteryRules = [];
            $scope.loadedSections++;
            if (response.data && response.data.page && response.data.page.children) {
                $scope.lotteryRules = response.data.page;
                $scope.lotteryRules.title = $sce.trustAsHtml($scope.lotteryRules.title);
                $scope.lotteryRules.content = $sce.trustAsHtml($scope.lotteryRules.content);
            }
            // checkIfPageLoaded();
        }, function (reason) {
            console.log(reason);
            $scope.loadedSections++;
            //checkIfPageLoaded();
        });
    }


    function groupToGroups(list, perGroup) {
        var i, g = 0, j = list.length, groups = [];
        for (i = 0; i < j; i += 1) {
            if (groups[g] === undefined) {
                groups[g] = [];
            }
            groups[g].push(list[i]);
            if (groups[g].length === perGroup) {
                g++;
            }
        }

        return groups;
    }

    function loadSliderContent() {
        content.getPage('lottery-winners', true).then(function (response) {
            $scope.loadedSections++;
            if (response.data && response.data.page && response.data.page.children) {
                $scope.winnersList = groupToGroups(response.data.page.children, 4);
            }
        }, function (reason) {
            console.log(reason);
            $scope.loadedSections++;
        });
    }

    $scope.initData = function initData() {
        //load slider content
        loadSliderContent();
        //load lottery tickets
        loadLotteryTickets();
        //load lottery winners
        loadLotteryWinners();
        //load jackpot rules
        loadLotteryRules();

        if ($rootScope.env.authorized) {
            loadMyTickets();
        }
    };



    $scope.$on("profile", function () {
        loadMyTickets();
    });
    $scope.$on('login.loggedOut', function () {
        $scope.tichetType = 0;
        if ($scope.myTickets) {
            $scope.myTickets = [];
        }
    });






    $scope.sliderIndex = 0;
    $scope.sliderOffset = 0;
    $scope.rotationPaused = false;

    $scope.slideSmallImages = function slide(direction) {
        $scope.sliderIndex = direction === 'left' ? $scope.sliderIndex - 1 : $scope.sliderIndex + 1;
        $scope.sliderOffset = 0;
    };

    $scope.slideBigImage = function slideBigImage(diretion) {
        if (diretion === 'right') {
            if ($scope.sliderOffset < $scope.winnersList[$scope.sliderIndex].length - 1) {
                $scope.sliderOffset++;
            } else {
                $scope.sliderOffset = 0;
                $scope.sliderIndex++;
            }
        } else {
            if ($scope.sliderOffset > 0) {
                $scope.sliderOffset--;
            } else {
                $scope.sliderIndex--;
                $scope.sliderOffset = $scope.winnersList[$scope.sliderIndex].length - 1;
            }
        }
    };

    $scope.sliderItemClick = function sliderItemClick(index) {
        $scope.sliderOffset = index;
    };

    var slideInterval = $interval(function () {
        if ($scope.rotationPaused) {
            return;
        }
        if ($scope.sliderIndex === $scope.winnersList.length - 1 && $scope.sliderOffset === $scope.winnersList[$scope.sliderIndex].length - 1) {
            $scope.sliderIndex = 0;
            $scope.sliderOffset = -1;
        }
        $scope.slideBigImage('right');
    }, 5000);

    $scope.$on('$destroy', function () {
        $interval.cancel(slideInterval);
    });

    $scope.submitForm = function submitForm() {
        if ($rootScope.env.authorized) {
            Zergling.
                get({
                    'ticket_info': {
                        'name': $scope.form.name,
                        'phone': $scope.form.phone,
                        'ticket': $scope.form.ticketNumber
                    }
                }, 'lottery_ticket_check')
                .then(function (data) {
                    if (data.result) {
                        $scope.form = {};
                        $scope.form.successMsg = true;
                    } else {
                        $scope.form.errorMsg = true;
                    }
                });
        } else {
            $rootScope.broadcast('toggleSliderTab', 'signInForm');
        }
    };
}]);