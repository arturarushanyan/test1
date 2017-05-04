/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:paymentsCtrl
 * @description
 *  payments controller
 */
VBET5.controller('paymentsCtrl', ['$scope', '$rootScope', '$sce', '$window', '$location', '$interval', '$filter', 'Utils', 'Config', 'Zergling', 'Translator', 'AuthData', 'Moment', 'analytics', 'Storage', 'Script', 'Tracking', 'TimeoutWrapper', 'RegConfig', function ($scope, $rootScope, $sce, $window, $location, $interval, $filter, Utils, Config, Zergling, Translator, AuthData, Moment, analytics, Storage, Script, Tracking, TimeoutWrapper, RegConfig) {
    'use strict';

    TimeoutWrapper = TimeoutWrapper($scope);
    var userConfirmedDepositListener = null;
    $scope.authData = AuthData.get();
    $scope.withdrawFormData = {};
    $scope.depositFormData = {};
    $scope.withdrawHistory = [];
    $scope.withdrawStatus = ['Pending', 'Canceled', 'Confirmed', 'Paid'];
    $scope.cancelButton = {disabled : false };

    $scope.paymentAmount = {
        deposit: 0,
        withdraw: 0
    };

    $scope.cartExpiry = {

        month : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
        year: []
    };
    $scope.fieldBirthday={
        day: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15',  '16', '17', '18', '19', '20', '21', '22', '23', '24',  '25', '26', '27', '28', '29', '30', '31'],
        month : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
        year: []
    };
    /**
     * @ngdoc method
     * @name calculateAge
     * @methodOf vbet5.controller:paymentsCtrl
     * @description Recalculate user age and set to userAge
     */
    $scope.calculateAge = function calculateAge() {
        var d1 = new Date($scope.depositFormData.year, $scope.depositFormData.month-1, $scope.depositFormData.day);
        var d2 = new Date();
        d2.setHours(0,0,0);
        var diff = d2.getTime() - d1.getTime();
        $scope.userAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    $scope.amountMinLimit = 1 / Math.pow(10, $rootScope.conf.balanceFractionSize);

    var amountWatcher, userConfirmed = false, userConfirmationConfig = {
        name: 'user_confirmation',
        canDeposit: true,
        canWithdraw: true,
        hideDepositAmmount: true,
        hideWithdrawAmount: true,
        hideDepositButton: true,
        hideWithdrawButton: true,
        userConfirmationButton: true,

        withdrawFormFields: [
            {name: 'user_confirmation_password', type: 'password', label: 'Еnter your password'}
        ],
        depositFormFields: [
            {name: 'user_confirmation_password', type: 'password', label: 'Еnter your password'}
        ]

    };


    /**
     * @ngdoc method
     * @name fieldBirthdayYears
     * @methodOf vbet5.controller:paymentsCtrl
     * @description initializes deposit form. Generates years range for select box
     */
    $scope.fieldBirthdayYears = function fieldBirthdayYears() {
        var i, start = 1920;
        var length = new Date().getFullYear() - 18;

        for (i = start; i <= length; i += 1) {
            $scope.fieldBirthday.year.push(i.toString());
        }
    };

    /**
     * @ngdoc method
     * @name cartExpiryYears
     * @methodOf vbet5.controller:paymentsCtrl
     * @description initializes withdraw form. Generates years range for select box
     */
    $scope.cartExpiryYears = function cartExpiryYears() {
        var i, start = new Date().getFullYear();
        var length = start + (Config.main.withdrawCartExpiryYears || 10);

        for (i = start; i <= length; i += 1) {
            $scope.cartExpiry.year.push(i.toString());
        }
    };
    /**
     * @ngdoc method
     * @name filterPaymentsByCountry
     * @methodOf vbet5.controller:paymentsCtrl
     * @description Returns payments filtered by user country if needed
     * @param {Array} input all payment methods
     * @returns {Array} filtered payment methods
     */
    function filterPaymentsByCountry(input) {
        var countryCode = $rootScope.profile.country_code || $scope.userDetails.country_code || '';
        if (!countryCode) {
            return input;
        }
        return input.reduce(function (availablePayments, current) {
            if ((current.countryAllow && current.countryAllow.indexOf(countryCode) === -1) || (current.countryRestrict && current.countryRestrict.indexOf(countryCode) !== -1)) {
                console.log(countryCode, "restricted for", current.name);
            } else {
                availablePayments.push(current);
            }
            return availablePayments;
        }, []);
    }

    var getUserPromise = null;

    function generateInfoText (text) {
        if (typeof text === 'object') {
            text = '';
        }
        text = Translator.get(text.toString());
        if ($rootScope.profile && $rootScope.profile.currency_name && text && text.split) {
            text = text.split('{currency}').join($filter('currency')($rootScope.profile.currency_name));
        }
        return $sce.trustAsHtml(text);
    }

    function initPaymentConfig(type) {

        if (!$scope.userDetails && (Config.main.paymentsGetUserDetails || !$rootScope.profile.country_code)) {
            getUserPromise = getUserPromise || Zergling.get({}, 'get_user');
            getUserPromise.then(function (data) {
                $scope.userDetails = data;
                initPaymentConfig(type);
            });
            return;
        }

        if (Config.main.showAllAvailablePaymentSystems) {
            $scope.paymentConfig = Config.payments;
        } else {
            $scope.paymentConfig = $filter('allowedPayments')(Config.payments, type);
        }

        $scope.paymentConfig = filterPaymentsByCountry($scope.paymentConfig);

        //payment description text may contain html, mark it as safe to show
        angular.forEach($scope.paymentConfig, function (pSystem) {
            if (pSystem.depositIframe && pSystem.depositIframe.length) {
                pSystem.depositIframe = $sce.trustAsResourceUrl(pSystem.depositIframe);
            }
            if (pSystem.withdrawIframe && pSystem.withdrawIframe.length) {
                pSystem.withdrawIframe = $sce.trustAsResourceUrl(pSystem.withdrawIframe);
            }
            if (pSystem.depositInfoText) {
                pSystem.depositText = generateInfoText(pSystem.depositInfoText[Config.env.lang] || pSystem.depositInfoText['eng'] || pSystem.depositInfoText || '');
            } else if (pSystem.depositInfoTextKey) {
                pSystem.depositText = generateInfoText(Translator.get(pSystem.depositInfoTextKey));
            }

            if (pSystem.depositConfirmText && pSystem.depositConfirmText[Config.env.lang] && pSystem.depositConfirmText[Config.env.lang].length && typeof pSystem.depositConfirmText[Config.env.lang] === 'string') {
                pSystem.depositConfirmText = $sce.trustAsHtml(pSystem.depositConfirmText[Config.env.lang]);
            } else if (typeof pSystem.depositConfirmText === 'string') {
                console.log(Translator.get(pSystem.depositConfirmText));
                pSystem.depositConfirmText = $sce.trustAsHtml(Translator.get(pSystem.depositConfirmText));
            }

            if (pSystem.withdrawInfoText) {
                pSystem.withdrawText = generateInfoText(pSystem.withdrawInfoText[Config.env.lang] || pSystem.withdrawInfoText['eng'] || pSystem.withdrawInfoText);
            } else if (pSystem.withdrawInfoTextKey) {
                pSystem.withdrawText = generateInfoText(Translator.get(pSystem.withdrawInfoTextKey));
            }

        });
    }

    function getFieldValue(fields, name) {
        var i;
        for (i = 0;i < fields.length; i++) {
            if (fields[i].name === name) {
                return fields[i].value || '';
            }
        }
        return '';
    }

    function startWatchingWithdrawAmount() {
        if ((Config.main.GmsPlatform && !Config.main.GmsPlatformMultipleBalance) || $rootScope.isInSports()) {
            amountWatcher = $scope.$watch('profile.balance', function () {
                $scope.availableWithdrawAmount = $scope.profile.calculatedBalance;
            });
        } else {
            if (Config.main.GmsPlatformMultipleBalance) {
                amountWatcher = $scope.$watch('profile.casino_balance', function () {
                    $scope.availableWithdrawAmount = $rootScope.profile.casino_balance;
                });
            } else {
                amountWatcher = $scope.$watch('env.casinoBalance.balance', function () {
                    $scope.availableWithdrawAmount = $rootScope.env.casinoBalance.balance;
                });
            }

        }
    }

    /**
     * @ngdoc method
     * @name init
     * @methodOf vbet5.controller:paymentsCtrl
     * @description selects the firs available payment system initially
     * @param {String} type deposit or withdraw
     */
    $scope.init = function init(type) {
        if(Config.main.registration && Config.main.registration.type === 'partial') {
            if(Config.main.GmsPlatform) {
                $scope.isProfilePartial = isProfilePartial();
                startDoInit();
            } else {
                Zergling.get({}, 'get_user').then(function (data) {
                    Utils.MergeRecursive($rootScope.profile, data);
                    $rootScope.profile.last_name = data.sur_name;
                    $scope.isProfilePartial = isProfilePartial();
                    startDoInit();
                })['catch'](function (reason) {
                    console.log('Error:', reason);
                    $scope.isProfilePartial = true;
                });
            }
        } else {
            $scope.isProfilePartial = false;
            startDoInit();
        }

        function doInit() {
            if (!$scope.paymentConfig || !$rootScope.profile || !$rootScope.profile.paymentSystems) {
                TimeoutWrapper(doInit, 500);
                initPaymentConfig(type);
                return;
            }

            if ($rootScope.profile && $rootScope.profile.paymentSystems && $rootScope.profile.paymentSystems.status) {
                $rootScope.$broadcast('slider.processUserAuthorization');
                return;
            }

            if ($rootScope.profile && $rootScope.profile.paymentSystems && $rootScope.profile.paymentSystems.redirect) {
                $window.location = $rootScope.profile.paymentSystems.redirect;
                $rootScope.env.sliderContent = '';
                $rootScope.env.showSlider = false;
                return;
            }
            if (type === 'withdraw') {
                startWatchingWithdrawAmount();
            }
            initPaymentConfig(type);
            var i;
            var defaultPaymentIndex = NaN;
            for (i = 0; i < $scope.paymentConfig.length; i++) {
                if ($scope.paymentConfig[i]['can' + ($scope.env.sliderContent === 'withdraw' ? 'Withdraw' : 'Deposit')]) {
                    if ($location.search().system && $location.search().system.toLowerCase() === $scope.paymentConfig[i].name) {
                        $scope.selectPaymentSystem($scope.paymentConfig[i]);
                        defaultPaymentIndex = NaN;
                        break;
                    }
                    if (isNaN(defaultPaymentIndex) && (($scope.env.sliderContent === 'withdraw' && (!Config.enableDefaultPaymentSelection || Config.enableDefaultPaymentSelection.withdraw) && (!$rootScope.isInCasino() || $scope.paymentConfig[i].canWithdrawFromCasino === undefined || $scope.paymentConfig[i].canWithdrawFromCasino)) || ($scope.env.sliderContent === 'deposit' && (!Config.enableDefaultPaymentSelection || Config.enableDefaultPaymentSelection.withdraw)))) {
                        defaultPaymentIndex = i;
                    }
                }
            }
            if (!isNaN(defaultPaymentIndex)) {
                $scope.selectPaymentSystem($scope.paymentConfig[defaultPaymentIndex]); //by default select the first one
            }
        }

        function startDoInit() {
            $scope.env.sliderContent = type;
            if (Config.env.authorized) {
                doInit();
            } else {
                $rootScope.loginRestored.then(doInit);
            }
        }

    };

    function isProfilePartial() {
        var secondStep = RegConfig.step2.leftCol.concat(RegConfig.step2.rightCol);
        var i, length = secondStep.length;
        for (i = 0; i < length; i += 1) {
            var key = secondStep[i].name === 'birth_day' || secondStep[i].name === 'birth_month' || secondStep[i].name === 'birth_year' ? 'birth_date' : secondStep[i].name;
            if (secondStep[i].name && secondStep[i].required && (!$rootScope.profile[key] || $rootScope.profile[key] === '')) {
                return true;
            }
        }

        return false;
    }

    /**
     * @ngdoc method
     * @name reorderCitiesAndBetshops
     * @methodOf vbet5.controller:paymentsCtrl
     * @param cities {Array} list of cities with betshops
     * @param topBetshops {Array} list of betshops ids that should be brought to top
     * @description reorders cities and betshops so that topBetshops are brought to top
     */
    function reorderCitiesAndBetshops(cities, topBetshops) {
        var i, j, k, m;
        var reorderedBetshops = [];
        var topCities = [];
        //loop through cities
        for (i = cities.length - 1; i >= 0; i--) {
           // for each city loop through betshops and find top betshops
            for (j = 0; j < topBetshops.length; j++) {
                for (k = 0; k < cities[i].betshops.length; k++) {
                    if (cities[i].betshops[k].id === topBetshops[j].id) {
                        cities[i].betshops[k].type = topBetshops[j].type || "";
                        reorderedBetshops.push(cities[i].betshops[k]);
                        cities[i].betshops.splice(k, 1);
                        break;
                    }
                }
            }
            if (reorderedBetshops.length) {
                cities[i].betshops = reorderedBetshops.concat(cities[i].betshops);
                topCities.push(cities[i]);
                cities.splice(i, 1);
                reorderedBetshops = [];
            }
        }
        for (m = 0; m < topCities.length; m++) {
            cities.splice(0, 0, topCities[m]);
        }
    }



    /**
     * @ngdoc method
     * @name loadBetShops
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  loads bet shops from swarm
     */
    $scope.loadBetShops = function loadBetShops() {
        Zergling.get({}, 'get_bet_shops').then(function (data) {
            $scope.selectedPaymentSystem.betShops = data.result;

            var cities = $scope.selectedPaymentSystem.betShops.cities;
            // make default selection
            if (cities &&
                cities.length &&
                cities[0].betshops &&
                cities[0].betshops.length &&
                $scope.selectedPaymentSystem.topBetshops
            ) {

                reorderCitiesAndBetshops(cities, $scope.selectedPaymentSystem.topBetshops);


                if (cities.length === 1 && cities[0].betshops.length === 1 && cities[0].betshops[0].address == '') {
                    $scope.withdrawFormData.office_id  = cities[0].betshops[0].id;
                } else if ($scope.selectedPaymentSystem.defaultBetShop) {
                    concludes:
                    for (var i = 0, citiesLength = cities.length; i < citiesLength; i += 1) {
                        for (var j = 0, betshopsLength = cities[i].betshops.length; j < betshopsLength; j += 1) {
                            if (cities[i].betshops[j].id === $scope.selectedPaymentSystem.defaultBetShop) {
                                $scope.withdrawFormData.office_id  = cities[i].betshops[j].id;
                                break concludes;
                            }
                        }
                    }
                }
            }
        });
    };

    $scope.closePopup = function closePopup() {
        $scope.popupInfo = null;
        if ($scope.closeSliderOnPopupClose) {
            $scope.closeSliderOnPopupClose = false;
            $scope.$emit('slider.close');
        }
    };

    var knownErrors = {
        '-20099': Translator.get('Unknown error'),
        '-20001': Translator.get('Unsupported service'),
        '-20002': Translator.get('Currency unsupported'),
        '-20003': Translator.get('Amount is less than minimum allowed'),
        '-20004': Translator.get('Amount is greater than maximum allowed'),
        '-20005': Translator.get('Entered payee information is not correct.'),
        '-20006': Translator.get('Entered payer information is not correct.'),
        '-20007': Translator.get('Internal service fault'),
        '-20008': Translator.get('Withdraw request blocked.'),
        '21': Translator.get('User link blocked, please contact support.'),
        '22': Translator.get('Day limit reached. Please try later.'),
        '-2403': Translator.get('Withdraw request is already in progress'),
        '-1131': Translator.get("You have an Active Bonus therefore it's not possible to make a Withdrawal")
    };

    /**
     * @ngdoc method
     * @name getLinkedInfo
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  loads poker info from swarm
     */
    $scope.getLinkedInfo = function getLinkedInfo() {

        $scope.selectedPaymentSystem.linkedInfo = {firstTime: false};
        $scope.selectedPaymentSystem.linkedInfoLoaded = false;
        var message = null;
        Zergling.get({service: $scope.selectedPaymentSystem.name}, 'get_linked_user').then(function (data) {
            $scope.selectedPaymentSystem.linkedInfoLoaded = true;
            $scope.selectedPaymentSystem.linkedInfo = data;
            console.log('linked Info:', data);
        })['catch'](
            function (reason) {
                console.log('Error:', reason);
                if (reason.code !== undefined && knownErrors[reason.code] !== undefined) {
                    message = knownErrors[reason.code];
                } else {
                    message = Translator.get("Please try later or contact support.");
                }
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: message
                });
            }
        );
    };



    /**
     * @ngdoc method
     * @name currentLocationWithParam
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  returns current page location with additional parameter(if specified)
     * @param {String} [paramName] parameter name
     * @param {String} [paramValue] parameter value
     * @returns {String} location
     */
    function currentLocationWithParam(paramName, paramValue) {
        var location = $location.absUrl();
        if (!paramName) {
            return location;
        }
        var prefix =  location.substr(location.length - 1) === '/' ? '?' : '&';
        return location + prefix + paramName + '=' + encodeURIComponent(paramValue);
    }


    function depositeConfirmationAsDialog(action) {
        $rootScope.$broadcast("globalDialogs.addDialog", {
            type: 'confirm',
            title: 'Confirm',
            yesno: true,
            content: Translator.get('Please confirm money transfer') + ': ' + ($scope.paymentAmount.withdraw || $scope.paymentAmount.deposit) + ' ' + $rootScope.profile.currency_name,
            hideCloseButton: true,
            yesButton: 'withdraw.userConfirmedDeposit'
        });
        userConfirmedDepositListener && userConfirmedDepositListener();
        userConfirmedDepositListener = $scope.$on('withdraw.userConfirmedDeposit', function (){
            $window.document.getElementById("custum-payment-fields").submit();
        });
    }

    /**
     * @ngdoc method
     * @name doDepositRequest
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  Do deposit command to Zergling, getting the response and iterate with $scope
     * @param {Object} request request object
     * @param {String} message message
     * @returns {String} location
     */
    function doDepositRequest(request, message) {
        Zergling.get(request, 'deposit').then(
            function (data) {
                console.log('buyVC request:', request, 'response:', data);

                if (data && data.result !== undefined && data.result === 0 && (!data.details || !data.details.error || data.details.error == 0)) {
                    //on success
                    if (data.details.method && (data.details.method.toLowerCase() === 'post' || data.details.method.toLowerCase() === 'get')) {
                        $scope.externalFormParams = data.details;
                        if (Config.main.enableMixedView) {
                            depositeConfirmationAsDialog(data.details.action);
                        } else {
                            $scope.showConfirmation = true;
                            $scope.depositExternalForm = true;
                        }
                    } else if (data.details.method && data.details.method.toLowerCase() === 'form') {
                        $scope.showGetStatusForm = true;
                        $scope.depositStatus = 'pending';
                        $scope.depositInProgress = true;
                        $scope.externalFormParams = data.details;
                    } else if (data.details.method && data.details.method.toLowerCase() === 'formdraw') {
                        $scope.drawPaymentFormResponse(data.details, 'deposit');
                        return;
                    } else if (data.details.method && data.details.method.toLowerCase() === 'confirmation') {
                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: 'info',
                            title: 'Info',
                            yesno: true,
                            yesButton: ['deposit.yes', {request: request, message: message}],
                            content: Translator.get($scope.selectedPaymentSystem.depositConfirmationText || 'Tax deduction: {1} Do you want to continue?', [getFieldValue(data.details.fields, 'fee') + ' ' + getFieldValue(data.details.fields, 'currency')])
                        });
                        return;
                    } else if (data.details.method && data.details.method.toLowerCase() === 'iframe') {
                        $rootScope.$broadcast('slider.openCustomContent', {url: data.details.action});
                        return;
                    } else {  //payment is done already
                        $scope.paymentIsDone = true;
                        $scope.paymentStatusMessage = data.details.message;

                        analytics.gaSend('send', 'event', 'slider', 'deposit',  {'page': $location.path(), 'eventLabel': 'Success -' + request.service});
                        Tracking.event('deposit_completed', {'amount': request.amount, 'translation_id': $scope.profile.unique_id}, true);

                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: 'success',
                            title: 'Success',
                            content: data.details.message ? data.details.message : 'Deposit was successful.'
                        });

                        $scope.confirmDeposit();
                    }


                } else if (data && data.result !== undefined && knownErrors[data.result.toString()] !== undefined) {
                    message += knownErrors[data.result.toString()];
                    //$scope.popupInfo = message;
                    //$scope.messageType = 'error';
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: 'error',
                        title: 'Error',
                        content: message
                    });
                    analytics.gaSend('send', 'event', 'slider', 'deposit',  {'page': $location.path(), 'eventLabel': 'Error -' + request.service + ' (' + message + ')'});
                } else if (data.details && data.details.error) {
                    message += (data.details.message || '') + ' (' + data.details.error + ')';
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: 'error',
                        title: 'Error',
                        content: message
                    });
                    //$scope.popupInfo = message;
                    //$scope.messageType = 'error';
                    analytics.gaSend('send', 'event', 'slider', 'deposit',  {'page': $location.path(), 'eventLabel': 'Error -' + request.service + ' (' + message + ')'});
                } else {
                    message += Translator.get("Unknown error");
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: 'error',
                        title: 'Error',
                        content: message
                    });
                    //$scope.popupInfo = message;
                    //$scope.messageType = 'error';
                    analytics.gaSend('send', 'event', 'slider', 'deposit',  {'page': $location.path(), 'eventLabel': 'Error -' + request.service + ' (' + message + ')'});
                }
            },
            function (data) {
                console.warn('deposit error', data);
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: message
                });
                //$scope.popupInfo = message;
                analytics.gaSend('send', 'event', 'slider', 'deposit',  {'page': $location.path(), 'eventLabel': 'Error -' + request.service + ' (' + message + ')'});
            }
        )['finally'](function () {
            $scope.busy = false;
        });
    }

    /**
     * @ngdoc method
     * @name withdraw
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  sends withdraw request to swarm
     */
    $scope.withdraw = function withdraw(paymentFormData, withdrawAmount) {
        $scope.paymentAmount.withdraw = withdrawAmount || $scope.paymentAmount.withdraw;
        $scope.withdrawFormData = paymentFormData || $scope.withdrawFormData;
        $scope.busy = true;
        var forProduct = $rootScope.isInSports() ? "sport" : "casino";

        var request = {
            amount: $scope.selectedPaymentSystem.withdrawPrefilledAmount !== undefined ? $scope.selectedPaymentSystem.withdrawPrefilledAmount : ($scope.paymentAmount.withdraw === null ? null : parseFloat($scope.paymentAmount.withdraw)),
            service: $scope.selectedPaymentSystem.name,
            payee: {
                forProduct: forProduct
//                status_urls: {
//                    success: currentLocationWithParam('message', Translator.get('Withdrawal was successful.')),
//                    cancel: currentLocationWithParam(),
//                    fail: currentLocationWithParam('message', Translator.get('Withdraw failed.'))
//                }
//                test_mode: true,// @TODO remove after testing
//                test_mode_db: true
            }
        };

        if ($scope.selectedPaymentSystem.hasBetShops || $scope.selectedPaymentSystem.isTransferToLinkedService || ($scope.withdrawFormData && $scope.withdrawFormData.hasOwnProperty('confirmed')) || ($scope.selectedPaymentSystem.withdrawFormFields && $scope.selectedPaymentSystem.withdrawFormFields.length)) {
            angular.forEach($scope.selectedPaymentSystem.withdrawFormFields, function (field) {
                if ($scope.withdrawFormData[field.name] === undefined || field.dontSend) {
                    $scope.withdrawFormData[field.name] = null;
                }
            });
            Utils.MergeRecursive(request.payee, $scope.withdrawFormData);
        }
        request.payee.office_id = request.payee.office_id && parseInt(request.payee.office_id, 10);
        delete $scope.withdrawFormData.confirmed;
        console.log(request);

        function doRequest () {
            Zergling.get(request, 'withdraw').then(function (data) {
                console.log('withdraw request response', data);
                var message = Translator.get("There was an error processing your request.");

                if (data && data.details && data.details.method && (data.details.method.toLowerCase() === 'post' || data.details.method.toLowerCase() === 'get')) {
                    $scope.showConfirmation = true;
                    $scope.externalFormParams = data.details;
                    $scope.withdrawExternalForm = true;
                } else if (data && data.details && data.details.method && data.details.method.toLowerCase() === 'formdraw') {
                    $scope.drawPaymentFormResponse(data.details, 'withdraw');
                    return;
                } else if (data && data.details && data.details.method && data.details.method.toLowerCase() === 'confirmation') {
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: 'info',
                        title: 'Info',
                        yesno: true,
                        yesButton: ['withdraw.yes', {request: request, message: message}],
                        content: Translator.get($scope.selectedPaymentSystem.withdrawConfirmationText || 'Tax deduction: {1} Do you want to continue?', [getFieldValue(data.details.fields, 'fee') + ' ' + getFieldValue(data.details.fields, 'currency')])
                    });
                    return;
                } else if (data && data.details && data.details.method && data.details.method.toLowerCase() === 'iframe') {
                    $rootScope.$broadcast('slider.openCustomContent', {url: data.details.action});
                    return;
                }
                else if (data && data.result !== undefined && data.result === 0) {
                    message = Translator.get((data.details && data.details.status_message) || 'Withdrawal was successful');
                    $scope.messageType = 'success';
                } else if (data && data.result !== undefined && knownErrors[data.result.toString()] !== undefined) {
                    message += "\n" + knownErrors[data.result.toString()];
                    if (data.details && data.details.error) {
                        message += ' (' + data.details.error + ')';
                    }
                    $scope.messageType = 'error';
                } else if (data.details && data.details.error) {
                    message += (data.details.message || '') + ' (' + data.details.error + ')';
                    $scope.messageType = 'error';
                } else {
                    message += Translator.get("Please try later or contact support.");
                    $scope.messageType = 'error';
                }
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: $scope.messageType,
                    title: 'error' === $scope.messageType ? 'Error' : 'Success',
                    content: message
                });
                //$scope.popupInfo = message;
            }, function (failResponse) {
                $scope.popupInfo = Translator.get("Error") + '<br>' + Translator.get(failResponse.msg) + "<br>" + Translator.get(failResponse.data);
                $scope.messageType = 'error';
            })['finally'](function () {
                $scope.busy = false;
            });
        }
        if (Config.main.checkForUnplayedAmountForWithdraw) {
            Zergling.get({}, "check_unplayed_amount").then(function (response) {
                if(response.details.unplayed_amount && "0" !== response.details.unplayed_amount) {
                    $rootScope.$broadcast("globalDialogs.addDialog", {
                        type: 'confirm',
                        title: 'Confirm',
                        yesno: true,
                        content: Translator.get('You have an unplayed amount of {1} {2} . If you proceed with the withdrawal, 6% of that amount will be deducted as fees.?',[response.details.unplayed_amount, $rootScope.profile.currency_name]),
                        hideCloseButton: true,
                        yesButton: 'withdraw.unplayedAmountYesButtonPressed',
                        noButton: 'withdraw.unplayedAmountNoButtonPressed'
                    });
                    $scope.$on('withdraw.unplayedAmountYesButtonPressed', function (){
                        doRequest();
                    });
                    $scope.$on('withdraw.unplayedAmountNoButtonPressed', function (){
                        $scope.busy = false;
                    });

                } else {
                    doRequest();
                }
            });
        } else {
            doRequest();
        }

    };

    /**
     * @ngdoc method
     * @name selectPaymentSystem
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  selects payment system
     *
     * @param {Object} paymentSystem payment system
     */
    $scope.selectPaymentSystem = function selectPaymentSystem(paymentSystem) {

        if ($scope.selectedPaymentSystem === paymentSystem) {
            return;
        }

        if (!userConfirmed && paymentSystem.requireUserConfirmation) {
            userConfirmationConfig.paymentSystemCache = paymentSystem;

            if (paymentSystem.depositInfoText) {
                userConfirmationConfig.depositText = generateInfoText(paymentSystem.depositInfoText[Config.env.lang] || paymentSystem.depositInfoText['eng'] || paymentSystem.depositInfoText);
            }

            if (paymentSystem.withdrawInfoText) {
                userConfirmationConfig.withdrawText = generateInfoText(paymentSystem.withdrawInfoText[Config.env.lang] || paymentSystem.withdrawInfoText['eng'] || paymentSystem.withdrawInfoText);
            }

            paymentSystem = userConfirmationConfig;zz

        }
        $scope.withdrawCustomAmounts = paymentSystem.withdrawCustomAmounts || null;
        $scope.depositCustomAmounts = paymentSystem.depositCustomAmounts || null;
        $scope.selectedPaymentSystem = paymentSystem;
        if ($scope.selectedPaymentSystem.twoStepWithdraw && $scope.env.sliderContent === 'withdraw') {
            Zergling
                .get({'service': $scope.selectedPaymentSystem.name}, 'get_withdraw_status')
                .then(function (response) {
                    console.log('withdraw status  response', response);
                    if (response.withdraw_id) {
                        $scope.selectedPaymentSystem.withdrawFormFields = $scope.selectedPaymentSystem.withdraw2FormFields;
                        $scope.paymentAmount.withdraw = null;
                        $scope.hideWithdrawAmount = true;
                        $scope.closeSliderOnPopupClose = true;
                    }

                    $scope.withdrawReady = true;

                });
        } else {
            $scope.closeSliderOnPopupClose = !!$scope.selectedPaymentSystem.twoStepWithdraw;
            $scope.withdrawReady = true;
            $scope.hideWithdrawAmount = false;
        }

        $scope.preparePaymentForm(paymentSystem);

    };

    /**
     * @ngdoc method
     * @name drawPaymentFormResponse
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  selects payment system
     *
     * @param {Object} paymentSystem payment system
     */
    $scope.drawPaymentFormResponse = function drawPaymentFormResponse(paymentSystem, type) {

        var fields = [];
        var r, item, itemKey;

        if ($scope.selectedPaymentSystem) {
            for (itemKey in $scope.selectedPaymentSystem) {
                if ($scope.selectedPaymentSystem[itemKey] && !paymentSystem[itemKey]) {
                    paymentSystem[itemKey] = $scope.selectedPaymentSystem[itemKey];
                }
            }
        }

        for (r = 0; r < paymentSystem.fields.length; r++) {
            item = paymentSystem.fields[r];

            if (item.value) {
                for (itemKey in item.value) {
                    if (item.value[itemKey]) {
                        item[itemKey] = item.value[itemKey];
                    }
                }
            }

            fields.push(item);
        }

        if (type === 'deposit') {
            paymentSystem.depositFormFields = fields;
        }

        if (type === 'withdraw') {
            paymentSystem.withdrawFormFields = fields;
        }

        paymentSystem.hideDepositAmmount = true;
        $scope.hideWithdrawAmount = true;

        paymentSystem.depositButtonCaption = 'Next';
        paymentSystem.withdrawButtonCaption = 'Next';

        $scope.selectedPaymentSystem = paymentSystem;
        $scope.preparePaymentForm(paymentSystem);
    };

    /**
     * @ngdoc method
     * @name preparePaymentForm
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  selects payment system
     *
     * @param {Object} paymentSystem payment system
     */
    $scope.preparePaymentForm = function preparePaymentForm(paymentSystem) {
        $scope.withdrawFormData = {};
        $scope.depositFormData = {};

        // pre-fill deposit fields from profile if needed
        angular.forEach(paymentSystem.depositFormFields, function (field) {

            if (!field.type) {
                field.type = 'text';
            }

            if (field.prefillFromProfile) {
                $scope.depositFormData[field.name] = $rootScope.profile[field.prefillFromProfile];
            }

            if (field.setValue) {
                $scope.depositFormData[field.name] = field.setValue;
            }

            if(field.type === 'html') {
                field.html = $sce.trustAsHtml(field.value);
            }
        });

        // pre-fill withdraw fields from profile if needed
        angular.forEach(paymentSystem.withdrawFormFields, function (field) {

            if (!field.type) {
                field.type = 'text';
            }

            if (field.prefillFromProfile) {
                $scope.withdrawFormData[field.name] = $rootScope.profile[field.prefillFromProfile];
            }

            if (field.setValue) {
                $scope.withdrawFormData[field.name] = field.setValue;
            }

            if(field.type === 'select' && $scope.withdrawFormData[field.name] === undefined){
                $scope.withdrawFormData[field.name] = field.options[0].value;
            }
        });

        //external scripts part
        if ($scope.env.sliderContent === 'deposit' && paymentSystem.depositPageScripts && paymentSystem.depositPageScripts.length) {
            TimeoutWrapper(function() {
                angular.forEach(paymentSystem.depositPageScripts, function (url) { Script(url + '?' + Date.now());});
            });
        }
        if ($scope.env.sliderContent === 'withdraw' && paymentSystem.withdrawPageScripts && paymentSystem.withdrawPageScripts.length) {
            TimeoutWrapper(function() {
                angular.forEach(paymentSystem.withdrawPageScripts, function (url) { Script(url + '?' + Date.now());});
            });
        }

        $scope.showConfirmation = false;
        $scope.showGetStatusForm = false;
        $scope.depositInProgress = false;
        $scope.paymentIsDone = false;
    };


    $scope.getBcString = function getBcString() {
        // TODO: implement
    };

    /**
     * @ngdoc method
     * @name deposit
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  sends deposit request to swarm, gets result, displays "external" form
     */
    $scope.deposit = function deposit(paymentFormData, depositAmount) {
        $scope.depositFormData = paymentFormData || $scope.depositFormData;
        $scope.paymentAmount.deposit = depositAmount || $scope.paymentAmount.deposit;
        $scope.busy = true;
        depositAmount = $scope.depositFormData.depositAmount;
        var forProduct = $rootScope.isInSports() ? "sport" : "casino";
        var request = {
            amount: parseFloat($scope.selectedPaymentSystem.depositPrefilledAmount || $scope.paymentAmount.deposit),
            service: $scope.selectedPaymentSystem.name,
            payer: {
                status_urls: {
                    success: currentLocationWithParam('message', Translator.get('Deposit was successful.')),
                    cancel: currentLocationWithParam(),
                    fail: currentLocationWithParam('message', Translator.get('Deposit failed.'))
                },
                forProduct: forProduct
//                test_mode: true // @TODO remove after testing
//                test_mode_db: true // not needed
            }
        };

        if (($scope.selectedPaymentSystem.depositFormFields && $scope.selectedPaymentSystem.depositFormFields.length) || ($scope.depositFormData && $scope.depositFormData.hasOwnProperty('confirmed'))) {
            angular.forEach($scope.selectedPaymentSystem.depositFormFields, function (field) {
                if ($scope.depositFormData[field.name] === undefined || field.dontSend) {
                    $scope.depositFormData[field.name] = null;
                }
            });
            Utils.MergeRecursive(request.payer, $scope.depositFormData);
        }
        if ($scope.selectedPaymentSystem.predefinedFields) {
            Utils.MergeRecursive(request.payer, $scope.selectedPaymentSystem.predefinedFields);
        }
        var message = Translator.get("There was an error processing your request.");
        $scope.messageType = 'error';

        /* Server To Server Passing Track Id */
        if (Storage.get('trackId') && Config.serverToServerTracking) {
            request.payer.track_id = Storage.get('trackId');
            Storage.set('trackId', '');
        }

        delete $scope.depositFormData.confirmed;
        //console.log('test test test test test test test test test test test');
        //console.log(request);

        doDepositRequest(request, message);
    };

    /**
     * @ngdoc method
     * @name confirmDeposit
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  called when "Confirm" button is clicked on deposit page. Just closes the slider.
     * @param {Function} formSubmitFunc a callback function provided by externalForm directive, will call this to submit the form
     */
    $scope.confirmDeposit = function confirmDeposit(formSubmitFunc) {
        if (angular.isFunction(formSubmitFunc)) {
            formSubmitFunc();
        }
        TimeoutWrapper(function () { //required for Firefox, otherwise form will not be submitted
            $scope.showConfirmation = false;
            $scope.paymentIsDone = false;
            $scope.env.showSlider = false;
        }, 1);

    };

    /**
     * @ngdoc method
     * @name getDepositStatus
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  called when " " button is clicked on deposit page. Just closes the slider.
     * @param {Function} formSubmitFunc a callback function provided by externalForm directive, will call this to submit the form
     */
    $scope.getDepositStatus = function getDepositStatus(formSubmitFunc) {
        console.log('getDepositStatus', $scope.externalFormParams);

        $scope.getDepositStatusInProgress = true;
        var transId = Utils.getArrayObjectElementHavingFieldValue($scope.externalFormParams.fields, 'name', 'transaction_id').value;
        Zergling.get({service: $scope.selectedPaymentSystem.name, "transaction_id": transId}, 'get_deposit_status').then(function (data) {
            $scope.depositStatus = data.status;
            $scope.depositedAmount = data.amount;
        })['finally'](function (response) {
            console.log('get_deposit_status response', response);
            $scope.getDepositStatusInProgress = false;
        });

    };

    //---------------------------  Renew  ------------------------------------------

    var renewClockPromise;
    $scope.renewInit = function renewInit() {
        function clock() {
            if (!$rootScope.profile) {
                return;
            }
            $scope.timer = Moment.get().unix() < $rootScope.profile.credit_renew_time ? Moment.get().preciseDiff($rootScope.profile.credit_renew_time * 1000) : null;
        }
        if (Config.main.enableFreeRenew) {
            clock();
            renewClockPromise = $interval(clock, 1000);
        }
    };

    $scope.renew = function renew() {
        $scope.renewInProgress = true;
        $scope.renewDone = $scope.renewFailed = false;//reset state
        Zergling.get({}, 'renew_user_credits').then(function (response) {
            console.log('renew_user_credits repsponse', response);
            if (response.result === 0) {
                $rootScope.profile.credit_renew_time =  response.details.next_re_new_time;  //@TODO:
                $scope.renewDone = true;
            } else {
                $scope.renewFailed = true;
            }
        })['finally'](function () {
            $scope.renewInProgress = false;
        });
    };

    $scope.$on('$destroy', function () {
        $interval.cancel(renewClockPromise);
        $scope.renewDone = $scope.renewFailed = false;//reset state
        if (amountWatcher) {
            amountWatcher();
        }
    });

    $scope.$on('deposit.yes', function (event, data) {
        $scope.depositFormData.confirmed = true;
        doDepositRequest(data.request, data.message);
    });

    $scope.$on('withdraw.yes', function (event, data) {
        $scope.withdrawFormData.confirmed = true;
        $scope.withdraw();
    });
    //--------------------------- ! Renew  ------------------------------------------


    /**
     * @ngdoc method
     * @name buyVC
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  Buy virtual credit throught paypal
     * @param {Object}  point contains the price and amount of selected point
     */
    $scope.buyVC = function (point) {
        $scope.selectedPoint = point;
        var credit = parseFloat(point.vc),
            request = {
                amount: credit,
                service: 'paypal',
                payer: {
                    status_urls: {
                        success: currentLocationWithParam('message', Translator.get('Deposit was successful.')),
                        cancel: currentLocationWithParam(),
                        fail: currentLocationWithParam('message', Translator.get('Deposit failed.'))
                    }
                }
            },

            message = Translator.get("There was an error processing your request.");
        $scope.messageType = 'error';
        doDepositRequest(request, message);
    };


    /**
     * @ngdoc method
     * @name openVerifyAccountPage
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  Opens settings slider tab "verify account" page by sending broadcast message to mainheader controller
     */
    $scope.openVerifyAccountPage = function openVerifyAccountPage() {
        $location.search('settingspage', 'verifyaccount');
        $rootScope.$broadcast('toggleSliderTab', 'settings');
    };


	/**
	 * @ngdoc method
	 * @name loadWithdrawStatus
	 * @methodOf vbet5.controller:paymentsCtrl
	 * @description  Loads withdraw statuses
	 */
	$scope.loadWithdrawStatuses = function loadWithdrawStatuses () {
		Zergling.get({}, 'get_withdrawals').then(function (response) {
			if (response && response.withdrawal_requests && response.withdrawal_requests.request) {
                if (!response.withdrawal_requests.request[0]) {
                    response.withdrawal_requests.request = [response.withdrawal_requests.request];
                }
				$scope.withdrawHistory = response.withdrawal_requests.request.reverse();
            }

            if (response && response.result_status === "OK") {
                $scope.withdrawListLoaded = true;
            }
		});
	};

	/**
	 * @ngdoc method
	 * @name loadWithdrawStatus
	 * @methodOf vbet5.controller:paymentsCtrl
	 * @description  Cancels pending withdraw request
	 */
	$scope.cancelWithdrawRequest = function cancelWithdrawRequest () {
        $scope.cancelButton.disabled = true;

        Zergling.get({}, 'withdraw_cancel').then(function (response) {
            console.log(response);
            if(response.result == 2418) {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: Translator.get('This type of Withdrawal Requests cannot be Cancelled')
                });
                return;
            }
            $scope.loadWithdrawStatuses();
        },function (failResponse) {
            console.log('Error', failResponse);
        })['finally'](function () {
            $scope.cancelButton.disabled = false;
        });
	};

    /**
     * @ngdoc method
     * @name setInfo
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  Change payment info text based on dropdown value
     */
    $scope.setInfo = function setInfo(options, value, target) {
        var fieldValue;
        angular.forEach(options, function (option) {
            if (option.value === value) {
                if (option.info) {
                    $scope.selectedPaymentSystem[target] = $sce.trustAsHtml((option.info[Config.env.lang] || option.info));
                }
                if (option.depositData) {
                    angular.forEach(option.depositData, function (value, name) {
                        $scope.depositFormData[name] = value;
                    });
                }
                if (option.withdrawData) {
                    angular.forEach(option.withdrawData, function (value, name) {
                        $scope.withdrawFormData[name] = value;
                    });
                }
                if (option.withdrawCustomAmounts) {
                    $scope.withdrawCustomAmounts = option.withdrawCustomAmounts;
                }
                if (option.depositCustomAmounts) {
                    $scope.depositCustomAmounts = option.depositCustomAmounts;
                }
                if (option.withdrawFieldTypes) {
                    angular.forEach($scope.selectedPaymentSystem.withdrawFormFields, function(field){
                        fieldValue = option.withdrawFieldTypes[field.name];
                        if (fieldValue) {
                            field.type = fieldValue;
                            field.hideLabel = fieldValue === 'hidden';
                            field.dontSend = fieldValue === 'hidden';
                        }
                    });
                }
                if (option.depositFieldTypes) {
                    angular.forEach($scope.selectedPaymentSystem.depositFormFields, function(field){
                        fieldValue = option.depositFieldTypes[field.name];
                        if (fieldValue) {
                            field.type = fieldValue;
                            field.hideLabel = fieldValue === 'hidden';
                            field.dontSend = fieldValue === 'hidden';
                        }
                    });
                }

            }
        });
    };

    /**
     * @ngdoc method
     * @name openDatePicker
     * @methodOf vbet5.controller:mixedMyBetsCtrl
     * @description hide 'date to' picker and show or hide 'date from' picker
     */
    $scope.datePickers = {};

    $scope.openDatePicker = function openDatePicker(name, $event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.datePickers[name] = !$scope.datePickers[name];
    };

    /**
     * @ngdoc method
     * @name confirmUser
     * @methodOf vbet5.controller:paymentsCtrl
     * @description check user`s password
     */
    $scope.confirmUser = function confirmUser(password) {

        if (!password) {
            return;
        }

        $scope.depositFormData.user_confirmation_password = '';
        $scope.withdrawFormData.user_confirmation_password = '';

        Zergling.get({password: password}, 'check_password')
            .then(
                function (response) {
                    if (parseInt(response.result, 10) == 0) {
                        if (userConfirmationConfig.paymentSystemCache) {
                            userConfirmed = true;
                            $scope.selectPaymentSystem(userConfirmationConfig.paymentSystemCache);
                        }
                    } else {
                        $rootScope.$broadcast("globalDialogs.addDialog", {
                            type: "error",
                            title: "Error",
                            content: 'Wrong Password'
                        });
                    }
                },
                function (failResponse) {
                    console.log('failed user confirmation', failResponse);
                }
            );
    };



    /**
     * @ngdoc method
     * @name dateMaskFix
     * @methodOf vbet5.controller:paymentsCtrl
     * @description  Validate date
     */
    $scope.dateMaskFix = function dateMaskFix(d) {

        if(!/^\d{8}$/.test(d)) {
            return '';
        }

        var day = parseInt(d.substr(0,2), 10);
        var month = parseInt(d.substr(2,2), 10);
        var year = parseInt(d.substr(4,4), 10);

        // Check the ranges of month and year
        if(year < 1000 || year > 3000 || month == 0 || month > 12)
            return '';

        var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

        // Adjust for leap years
        if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
            monthLength[1] = 29;

        // Check the range of the day
        return (day > 0 && day <= monthLength[month - 1]? d : '');
    };
}]);
