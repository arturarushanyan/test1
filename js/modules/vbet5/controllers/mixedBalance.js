/**
 * @ngdoc controller
 * @name vbet5.controller:mixedMyBetsCtrl extended from myBetsCtrl
 * @description
 *  New bet history controller.
 */
VBET5.controller('mixedBalanceCtrl', ['$scope','$rootScope', '$controller', 'Config', '$sce', 'Moment', '$window', 'Zergling', 'Utils', 'Translator', '$filter', function($scope, $rootScope, $controller, Config, $sce, Moment, $window, Zergling, Utils, Translator, $filter) {
    'use strict';
    angular.extend(this, $controller('paymentsCtrl', {
        $scope: $scope
    }));

    angular.extend(this, $controller('balanceCtrl', {
        $scope: $scope
    }));

    $scope.requestData = {
        dateFrom: $scope.today,
        dateTo: $scope.today,
        live: false
    };

//new//
    $scope.userDocNumber = [];

    if ($rootScope.profile.doc_number) {
        if ($rootScope.profile.doc_number.indexOf('-') !== -1) {
            $scope.userDocNumber = $rootScope.profile.doc_number.split('-');
        } else {
            $scope.userDocNumber = $rootScope.profile.doc_number.match(/.{1,3}/g);
        }
    }


    $scope.amountwrite = $window.amountwrite = function amountWrite(inputText) {
        inputText = inputText.replace(",", "");
        inputText = inputText.replace(".", "");
        var erk = inputText.length;
        var kp, poch1, poch2, poch3;
        if (erk > 2 && erk < 4) {
            poch1 = inputText.substr(-3, 1);
            poch2 = inputText.substr(-2, 2);

            inputText = poch1 + "," + poch2;
        } else if (erk > 3 && erk < 6) {
            kp = erk - 2;
            poch1 = inputText.substr(-7, kp);
            poch2 = inputText.substr(-2, 2);

            inputText = poch1 + "," + poch2;
        } else if (erk > 5 && erk < 8) {
            kp = erk - 5;
            poch1 = inputText.substr(-7, kp);
            poch2 = inputText.substr(-2, 2);
            poch3 = inputText.substr(-5, 3);

            inputText = poch1 + "." + poch3 + "," + poch2;
        } else if (erk > 7) {
            poch1 = inputText.substr(-7, 2);
            poch2 = inputText.substr(-2, 2);
            poch3 = inputText.substr(-5, 3);

            inputText = poch1 + "." + poch3 + "," + poch2;
        }
        return inputText;
    };

    $scope.paymentData = {
        PAYINBANK_CODE: "246	Banco ABC Brasil S.A.",
        PAYINBANK_AGENCY: "",
        PAYINBANK_AGENCY2: "",
        PAYINBANK_ACCOUNT: "",
        PAYINBANK_ACCOUNT2: "",
        PAYINBANK_TYPEACCOUNT: "CONTA CORRENTE",
        PAYINBANK_NAME: $rootScope.profile.first_name,
        PAYINBANK_SURNAME: $rootScope.profile.last_name,
        PAYINBANK_USERNAME: $rootScope.profile.username,
        PAYINBANK_DATA: $rootScope.profile.birth_date,
        PAYINBANK_EMAIL: $rootScope.profile.email,
        PAYINBANK_CPF1: $scope.userDocNumber[0] || null,
        PAYINBANK_CPF2: $scope.userDocNumber[1] || null,
        PAYINBANK_CPF3: $scope.userDocNumber[2] || null,
        PAYINBANK_CPF4: $scope.userDocNumber[3] || null,
        PAYINBANK_SUM: ""
    };


    $scope.deposit = function deposit(bankName) {
        $scope.paymentData.PAYINBANK_STEPNAME = bankName;
        $scope.resultError = null;
        $scope.resultMessage = null;
        $scope.busy = true;
        var request = {
            amount: parseFloat($scope.paymentData.PAYINBANK_SUM.replace(".", "").replace(".", "")),
            service: "cpfform",
            payer: {
                status_urls: {
                    success: "",
                    cancel: "",
                    fail: ""
                }
            }
        };
        Utils.MergeRecursive(request.payer, $scope.paymentData);
        Zergling.get(request, 'deposit').then(
            function (data) {
                console.log('deposit request:', request, 'response:', data);
                if (data && data.result !== undefined && data.result === 0 && (!data.details || !data.details.error || data.details.error == 0)) {
                    $scope.step = 3;
                    console.log('success');
                    if (data.details) {
                        $scope.resultMessage = data.details.message;
                    }
                } else {
                    $scope.resultError = (data.details && data.details.error) || Translator.get("Unknown error");
                    $scope.step = 1;
                }
            },
            function (data) {
                console.warn('deposit error', data);
                $scope.resultError = Translator.get("Unknown error");
                $scope.step = 1;
            }
        );
    };


    $scope.withdraw = function withdraw() {
        $scope.resultError = null;
        var request = {
            amount: parseFloat($scope.paymentData.PAYINBANK_SUM.replace(".", "").replace(",", ".")),
            service: "cpfform",
            payee: {

            }
        };
        Utils.MergeRecursive(request.payee, $scope.paymentData);
        Zergling.get(request, 'withdraw').then(
            function (data) {
                console.log('withdraw request', request, 'response', data);
                if (data && data.result !== undefined && data.result === 0) {
                    $scope.step = 2;
                    console.log('success');
                } else {
                    console.log(data);
                    $scope.resultError = (data.details && data.details.error) || Translator.get("Please try later or contact support.");
                    $scope.step = 1;
                }
            },
            function (data) {
                console.warn('withdraw error', data);
                $scope.resultError = Translator.get("Unknown error");
                $scope.step = 1;
            }
        );
    };
//new//

    $scope.balanceHistoryParams.availableProducts = {};

    if (Config.main.sportEnabled || Config.main.GmsPlatform) {
        $scope.balanceHistoryParams.availableProducts[0] = 'Main'
    }

    if (Config.main.enableCasinoBalanceHistory) {
        $scope.balanceHistoryParams.availableProducts[1] = 'Casino'
    }

    $scope.currencyHolder = {};
    $scope.dateOptions = { showWeeks: 'false' };
    $scope.$sce = $sce;

    $scope.today = Moment.get().format("YYYY-MM-DD");
    $scope.datePickerLimits = {
        maxToDate: $scope.today,
        maxFromDate: $scope.today
    };


    if (Config.payments && Config.payments.length) {
        $scope.paymentSystems = Config.payments.reduce(function (accumulator, current) {
            if (!current.isTransferToLinkedService && (current.canDeposit || current.canWithdraw)) {
                accumulator.push(current);
            }
            return accumulator;
        }, []);
    }
    $scope.paymentFormData = {};

    $scope.selectFirstSystem = function selectFirstSystem () {
        var current_systems = $filter('faqPayment')($scope.paymentSystems, $scope.env.sliderContent, $scope.currencyHolder.selectedCurrency) || [];
        current_systems[0] && $scope.selectPaymentSystem(current_systems[0]);
    };

    $scope.$watch("env.sliderContent", function() {
        if ("deposit" === $scope.env.sliderContent || "withdraw" === $scope.env.sliderContent) {
            $scope.currencyHolder.selectedCurrency = $scope.currencyHolder.selectedCurrency || ($scope.env.authorized ? $scope.profile.currency_name : $scope.conf.availableCurrencies[0]);
            if($scope.env.authorized){
                $scope.init($scope.env.sliderContent);
            } else if ($scope.currencyHolder) {
                $scope.selectFirstSystem();
            }
        }
    });



    $scope.loadMixedBalanceHistory = function loadMixedBalanceHistory() {
        $scope.loadBalanceHistory($scope.balanceHistoryParams.balanceCategory === '1' ? 'Casino' : false, {
            fromDate : $scope.balanceHistoryParams.dateRange.fromDate,
            toDate: $scope.balanceHistoryParams.dateRange.toDate
        });
    };

    var initialRange = {
        fromDate: Moment.get().subtract('week', 1).startOf('day').unix(),
        toDate: Moment.get().subtract('today').endOf('day').unix(),
        str: Moment.get().subtract('week', 1).format('MMMM YYYY'),
        type: 'month'
    };

    $scope.initMixedBalanceHistory = function initMixedBalanceHistory () {
        var balanceHistoryDataRangeChanged = $scope.$watch("balanceHistoryParams.dateRange", function() {
            if("balanceHistory" === $scope.env.sliderContent) {
                $scope.requestData.dateFrom = moment.unix($scope.balanceHistoryParams.dateRange.fromDate).format('YYYY-MM-DD');
                $scope.requestData.dateTo = moment.unix($scope.balanceHistoryParams.dateRange.toDate).format('YYYY-MM-DD');
                balanceHistoryDataRangeChanged();
            }
        }, true);

        if (!$scope.balanceHistoryParams.dateRange) {
            $scope.loadBalanceHistory($scope.balanceHistoryParams.balanceCategory === '1' ? 'Casino' : false, initialRange);
        }


    };

    $scope.adjustDate = function adjustDate(type) {
        switch (type) {
            case 'from':
                if (Moment.get($scope.requestData.dateFrom).unix() > Moment.get($scope.requestData.dateTo).unix()) {
                    $scope.requestData.dateTo = Moment.moment($scope.requestData.dateFrom).format("YYYY-MM-DD");
                }

                if (Moment.get($scope.requestData.dateFrom).add(1, "M").isAfter($scope.today)) {
                    $scope.datePickerLimits.maxToDate = $scope.today;
                } else {
                    $scope.requestData.dateTo = Moment.get($scope.requestData.dateFrom).add(1, "M").format("YYYY-MM-DD");
                    $scope.datePickerLimits.maxToDate = Moment.moment($scope.requestData.dateFrom).add(1, "M").format("YYYY-MM-DD");
                }

                break;
            case 'to':
                if (Moment.get($scope.requestData.dateFrom).unix() > Moment.get($scope.requestData.dateTo).unix()) {
                    $scope.requestData.dateFrom = Moment.moment($scope.requestData.dateTo).format("YYYY-MM-DD");
                    $scope.datePickerLimits.maxToDate = Moment.moment($scope.requestData.dateFrom).add(1, "M").format("YYYY-MM-DD");
                }
                break;
        }

        $scope.balanceHistoryParams.dateRange.fromDate = Moment.get(Moment.moment($scope.requestData.dateFrom).format().split('T')[0] + 'T00:00:00').unix();
        $scope.balanceHistoryParams.dateRange.toDate = Moment.get(Moment.moment($scope.requestData.dateTo).format().split('T')[0] + 'T23:59:59').unix();
    };

    console.clear();
    console.log($rootScope);

}]);