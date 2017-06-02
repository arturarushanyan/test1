/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:balanceCtrl
 * @description
 *  bet history controller.
 */
VBET5.controller('balanceCtrl', ['$rootScope', '$scope', 'Utils', 'Zergling', 'Moment', 'Translator', 'Config', function ($rootScope, $scope, Utils, Zergling, Moment, Translator, Config) {
    'use strict';

    var balanceHistory, ITEMS_PER_PAGE = Config.main.balanceHistoryDefaultItemsCount || 10;

    // don't show these operations in filter
    var disabledOperationsInFilter = [18, 23, 24, 29, 30, 31, 32, 19, 20, 21, 4];

    var balanceTypesFilter = {};

    $scope.balanceHistoryLoaded = false;

    $scope.balanceTypes = Config.main.betHistoryBalanceTypes;

    $scope.casinoBalanceTypes = {
        0: Translator.get('Bet'),
        1: Translator.get('Win'),
        2: Translator.get('Correction'),
        3: Translator.get('Deposit'),
        4: Translator.get('Withdraw'),
        5: Translator.get('Tip'),
        6: Translator.get('Bonus')
    };

    $scope.balanceHistoryParams = {
        dateRanges: [],
        dateRange: null,
        balanceTypes: balanceTypesFilter,
        balanceType: '-1'
    };

    (function init () {
        if (Config.main.balanceHistoryDisabledOperations) {
            angular.forEach(Config.main.balanceHistoryDisabledOperations, function (val) {
                if (disabledOperationsInFilter.indexOf(val) === -1) {
                    disabledOperationsInFilter.push(val);
                }
            });
        }

        angular.forEach($scope.balanceTypes, function (value, key) {
            $scope.balanceTypes[key] = Translator.translationExists('BalanceHistory ' + value) ? Translator.get('BalanceHistory ' + value) : Translator.get(value);

            if (disabledOperationsInFilter.indexOf(parseInt(key, 10)) === -1) {
                balanceTypesFilter[key] = $scope.balanceTypes[key];
            }
        });
    })();

    /**
     * @ngdoc method
     * @name initbalanceHistory
     * @methodOf vbet5.controller:balanceCtrl
     * @description init function. Generates  month and weeks data for select box and loads entries
     * for the first month and default type
     */
    $scope.initbalanceHistory = function initbalanceHistory(product) {
        var i, time;

        for (i = 0; i < 6; i++) {
            time = Moment.get().subtract('months', i).startOf('month');
            $scope.balanceHistoryParams.dateRanges.push({
                fromDate: time.unix(),
                toDate: time.clone().add('months', 1).unix(),
                str: time.format('MMMM YYYY'),
                type: 'month'
            });

            var monthDays = i === 0 ? Moment.get().lang('en').format('D') : time.clone().endOf('month').lang('en').format('D'),
                wCount = parseInt(monthDays / 7, 10),
                moreDaysCount = monthDays % 7;
            var j, fromDate, toDate, weekDates = [];
            for (j = 0; j < wCount; j++) {
                fromDate = time.clone().add('days', j * 7);
                toDate = time.clone().add('days', (j + 1) * 7);
                weekDates.push({
                    fromDate: fromDate.unix(),
                    toDate: toDate.unix(),
                    str: "· " + (fromDate.format('DD MMM') + " - " + toDate.format('DD MMM')),
                    type: 'week'
                })
            }
            if (moreDaysCount > 0) {
                fromDate = time.clone().add('days', j * 7);
                toDate = fromDate.clone().add('days', moreDaysCount);
                var str = moreDaysCount == 1 ? fromDate.format('DD MMM') : fromDate.format('DD MMM') + " - " + toDate.format('DD MMM');
                weekDates.push({fromDate: fromDate.unix(), toDate: toDate.unix(), str: "· " + str, type: 'week'});
            }
            $scope.balanceHistoryParams.dateRanges = $scope.balanceHistoryParams.dateRanges.concat(weekDates.reverse());
        }
        $scope.dataSelectedIndex  =  product === 'Casino' ? "1" : "0";
        $scope.loadBalanceHistory(product);
    };

    /**
     * @ngdoc method
     * @name loadBalanceHistory
     * @methodOf vbet5.controller:balanceCtrl
     * @description loads balance history according to selected parameters from  **$scope.balanceHistoryParams**
     * and selects first page
     * @param {String} [product] optional.  Sport, Casino or Poker.  Default is sport
     */
    $scope.loadBalanceHistory = function loadBalanceHistory(product, customDateRange) {
        $scope.balanceHistoryParams.dateRange = customDateRange || $scope.balanceHistoryParams.dateRanges[$scope.dataSelectedIndex];
        var timeZoneOffset = new Date().getTimezoneOffset() / 60;
        var where = {
            time_shift: -timeZoneOffset
        },
            balanceType = parseInt($scope.balanceHistoryParams.balanceType, 10);

        if ($scope.balanceHistoryParams.dateRange.fromDate !== -1) {
            where.from_date = $scope.balanceHistoryParams.dateRange.fromDate;
            where.to_date = $scope.balanceHistoryParams.dateRange.toDate + (Config.main.GmsPlatform ? 0: 1);
        }

        if (balanceType !== -1) {
            where.type = balanceType;
        }
        $scope.balanceHistoryLoaded = false;
        var request = {'where': where};
        if (product) {
            request.product = product;
        }
        Zergling.get(request, 'balance_history')
            .then(
                function (response) {
                    if (response.history) {
                        var i, length;
                        if (Config.main.balanceHistoryDisabledOperations && Config.main.balanceHistoryDisabledOperations.length) {
                            balanceHistory = [];
                            for (i = 0, length = response.history.length; i < length; i += 1) {
                                if (Config.main.balanceHistoryDisabledOperations.indexOf(parseInt(response.history[i].operation, 10)) === -1) {
                                    balanceHistory.push(response.history[i]);
                                }
                            }
                        } else {
                            balanceHistory = response.history;
                        }

                        for (i = 0, length = balanceHistory.length; i < length; i += 1) {
                            balanceHistory[i].amount = parseFloat(balanceHistory[i].amount);
                            balanceHistory[i].bonus = parseFloat(balanceHistory[i].bonus);
                        }

                        $scope.balanceHistoryGotoPage(1);
                        console.log('balance history:', balanceHistory, "response", response, "where", where);
                    } else {
                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: "warning",
                            title: "Warning",
                            content: response.details || Translator.get('Error')
                        });
                    }
                    $scope.balanceHistoryLoaded = true;
                },
                function (failResponse) {
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: "error",
                        title: "Error",
                        content: failResponse.data
                    });
                    $scope.balanceHistoryLoaded = true;
                }
            )['finally'](function () {
                if (Config.partner.balanceRefreshPeriod) { // refresh balance right after opening bet history in integration skin
                    $rootScope.$broadcast('refreshBalance');
                }
            });
    };

    /**
     * @ngdoc method
     * @name balanceHistoryGotoPage
     * @methodOf vbet5.controller:balanceCtrl
     * @description selects slice of bet history data according to given page number
     *
     * @param {Number} page page number
     */
    $scope.balanceHistoryGotoPage = function balanceHistoryGotoPage(page) {
        $scope.totalPages = parseInt(balanceHistory.length / ITEMS_PER_PAGE + (balanceHistory.length % ITEMS_PER_PAGE ? 1 : 0), 10);
        $scope.balanceHistoryPages = Utils.createPaginationArray($scope.totalPages, page, 10);
        $scope.balanceHistoryActivePage = page;
        var start = (page - 1) * ITEMS_PER_PAGE;
        var end = page * ITEMS_PER_PAGE;
        end = end > balanceHistory.length ? balanceHistory.length : end;
        $scope.balanceHistory = balanceHistory.slice(start, end);
    };
    /**
     * @ngdoc method
     * @name balanceHistoryLoadMoreInfo
     * @methodOf vbet5.controller:balanceCtrl
     * @description load more ITEMS_PER_PAGE number of history
     */
    $scope.balanceHistoryLoadMoreInfo = function balanceHistoryLoadMoreInfo () {
        var length = $scope.balanceHistory.length;
        $scope.balanceHistory = balanceHistory.slice(0, length + ITEMS_PER_PAGE);
    };

    $scope.balanceHistoryIsMoreItemsAvailable = function balanceHistoryIsMoreItemsAvailable() {
        return $scope.balanceHistory && balanceHistory && $scope.balanceHistory.length !== balanceHistory.length;
    }
}]);