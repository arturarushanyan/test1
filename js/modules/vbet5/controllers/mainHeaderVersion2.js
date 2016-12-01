VBET5.controller('mainHeaderVersion2Controller', ['$rootScope', '$scope', 'Config', 'Zergling', function ($rootScope, $scope, Config, Zergling) {
    'use strict';

    Config.main.dashboardEnabled = Config.main.dashboard.enabled; // @TODO need to remove after solution is  found

    $scope.init = function init () {
        $scope.headerVersion2Icons = {};
    };

    // posible verification codes
    /*
    EmailVerification = 1,
    PhoneVerification = 2,
    LetterVerification = 3,
    TsupisVerification = 4,
    SkypeVerification = 5
    18+ = 20
    */

    function checkSkypeRequestStatus () {
        if (Config.env.authorized && $rootScope.profile && $rootScope.profile.active_step) {
            switch ($rootScope.profile.active_step) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    if (!$scope.skypeRequestOpened) {
                        $scope.showSkypeRequest = true;
                        $scope.skypeRequestOpened = true;
                        $scope.activeStep = $rootScope.profile.active_step;
                    }
                    break;
                case 20:
                    $rootScope.env.showSlider = true;
                    $rootScope.env.sliderContent = 'customContent';
                    $rootScope.env.sliderCustomContent = {
                        contentType: 'userAgeConfirmation'
                    };
                    break;
            }

        }
    }

    $scope.selectBalanceMenuItem = function selectBalanceMenuItem (e, itemName) {
        if (!Config.main.enableMixedView) {
            $scope.headerVersion2Icons.balanceIsToggled = false;
        }
        $scope.env.paymentListShown = Config.main.showPaymentsDescriptionByDefault || false;
        if ($scope.env.sliderContent === itemName && $scope.env.showSlider) {
            $scope.env.showSlider = false;
            $scope.env.sliderContent = '';
            return;
        }
        $scope.env.showSlider = true;
        $scope.env.sliderContent = itemName;

        e.stopPropagation();
    };

    $scope.doSkypeRequest = function doSkypeRequest() {
        $rootScope.$broadcast('skypeAuthorization.show');
        $scope.showSkypeRequest = false;
    };

    $scope.hideSkypeRequest = function hideSkypeRequest() {
        $scope.showSkypeRequest = false;
    };

    $scope.$on('profile', function () {
        $rootScope.profile.skype_request = true;
        checkSkypeRequestStatus();
    });

    $scope.openHelpPage = function (helpPageItem) {
        if (helpPageItem === "payments" && Config.main.enableMixedView) {
            $scope.env.paymentListShown = true;
            $scope.toggleSliderTab('deposit');
        } else {
            $rootScope.$broadcast('openHelpPage', {slug: helpPageItem});
        }
    };

    function userDataConfirm() {
        Zergling.get({}, 'verify_user_age').then(function (result) {
            if (parseInt(result.code, 10) === 0) {
                $rootScope.env.showSlider = false;
                $scope.doSkypeRequest();
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: "error",
                    title: "Error",
                    content: 'Error occured.'
                });
            }

            console.log(result);
        })['catch'](function (reason) {
            console.log('Error:'); console.log(reason);
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: "error",
                title: "Error",
                content: 'Error occured.'
            });
        });
    }

    function processUserAuthorization(event, data) {
        if ($rootScope.profile && $rootScope.profile.paymentSystems && $rootScope.profile.paymentSystems.status) {
            $rootScope.env.showSlider = true;
            $rootScope.env.sliderContent = 'customContent';
            $rootScope.env.sliderCustomContent = {
                content: 'Authorization error.'
            };

            //$rootScope.profile.paymentSystems.status = 'UnknownCustomer';
            //$rootScope.profile.paymentSystems.redirect = '223322';

            switch ($rootScope.profile.paymentSystems.status) {
                case 'OutdatedCustomer':
                case 'UnidentifiedCustomer':
                    $rootScope.env.sliderCustomContent = {
                        content: 'Your account is not authorized yet'
                    };
                    break;
                case 'UnknownCustomer':
                    $rootScope.env.sliderCustomContent = {
                        content: 'In order to make a deposit you have to be authorized'
                    };
                    break;
            }

            $rootScope.env.sliderCustomContent.contentType = 'userAuthorization';
            $rootScope.env.sliderCustomContent.userConfirmationFaqUrl = Config.main.userConfirmationFaqUrl;

            if ($rootScope.profile.paymentSystems.redirect) {
                $rootScope.env.sliderCustomContent.buttonText = 'Goto autorization url';
                $rootScope.env.sliderCustomContent.buttonUrl = $rootScope.profile.paymentSystems.redirect;
            }
        }
    }

    $rootScope.$on('slider.processUserAuthorization', processUserAuthorization);
    $rootScope.$on('slider.userDataConfirm', userDataConfirm);

}]);