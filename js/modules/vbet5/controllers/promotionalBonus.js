/* global VBET5 */

/**
 * @ngdoc controller
 * @name vbet5.controller:promotionalBonusCtrl
 * @description  promotional bonuses controller.
 */

VBET5.controller('promotionalBonusCtrl', ['$scope', 'Zergling', 'BackendConstants', '$rootScope', 'Translator', '$q', 'Config', function($scope, Zergling, BackendConstants, $rootScope, Translator, $q, Config) {
    'use strict';

    $scope.backendBonusConstants = BackendConstants.PromotionalBonus;
    $scope.bonusList = [];
    $scope.activeBonusTab = Config.main.promotionalBonuses.casino && $rootScope.isInCasino() ? $scope.backendBonusConstants.BonusSource.Casino : $scope.backendBonusConstants.BonusSource.SportsBook;
    $scope.loadingBonus = false;

    /**
     * @ngdoc method
     * @name showConfirmationDialog
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {String) Dialog message text
     * @param {String) Dialog message Type // prompt, error, success
     * @description show confirmation dialog in case of claim / cancel bonus operations
     */
    function showConfirmationDialog(messageText, messageType) {
        if (messageType === 'success') {
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'success',
                title: 'Success',
                content: Translator.get(messageText)
            });
        }

        if (messageType === 'error') {
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get(messageText)
            });
        }

        if (messageType === 'prompt') {
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'confirm',
                title: 'Confirm',
                cancel: true,
                content: Translator.get(messageText),
                okButton: ['bonusDialog.confirm'],
                cancelButton: ['bonusDialog.reject'],
                closeButton: ['bonusDialog.reject']
            });

            return $q(function(resolve, reject) {
                var confirm = $scope.$on('bonusDialog.confirm', function () {
                    reject();
                    resolve('user confirm');
                });
                var reject = $scope.$on('bonusDialog.reject', function () {
                    confirm();
                    reject('user reject');
                });
            });
        }
    }

    /**
     * @ngdoc method
     * @name processActiveBonusData
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Object) Active bonus data
     * @description processing Active bonus data
     */
    function processActiveBonusData(activeBonusData) {
        if (activeBonusData) {
            $scope.activeBonusDetails = activeBonusData;
        }
        $scope.loadingActiveBonusDetails = false;
    }

    /**
     * @ngdoc method
     * @name getActiveBonusDetails
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @description get active bonus details from backend
     */
    function getActiveBonusDetails() {
        $scope.loadingActiveBonusDetails = true;
        Zergling.get({},'get_casino_bonuse_details').then(processActiveBonusData)['catch'](function (reason) {
            showConfirmationDialog(BackendConstants.ErrorCodesByValue[reason.result], 'error');
        })['finally'](function () {
            $scope.loadingActiveBonusDetails = false;
        });
    }

    /**
     * @ngdoc method
     * @name processBonusData
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Object) Bonus data
     * @description processing bonus data
     */
    function processBonusData(bonusData) {
        if (bonusData && bonusData.bonuses) {
            $scope.bonusList = bonusData.bonuses;
            angular.forEach ($scope.bonusList, function (bonusVal){
                if (bonusVal && bonusVal.money_requirenments && $rootScope.currency_name && bonusVal.money_requirenments[$rootScope.currency_name.toLowerCase()]) {
                    bonusVal.max_amount = bonusVal.money_requirenments[$rootScope.currency_name.toLowerCase()].max_amount;
                    bonusVal.min_amount = bonusVal.money_requirenments[$rootScope.currency_name.toLowerCase()].min_amount;
                }
                if (bonusVal && bonusVal.bonus_type === $scope.backendBonusConstants.BonusType.DepositBonus && bonusVal.acceptance_type === $scope.backendBonusConstants.BonusAcceptanceType.Activated) {
                    getActiveBonusDetails();
                }
            });
        }
        $scope.loadingBonus = false;
    }

    /**
     * @ngdoc method
     * @name getPromotionalBonus
     * @methodOf vbet5.controller:promotionalBonusCtrl
     *
     * @description get bonus data from backend
     */
    function getPromotionalBonus() {
        var request = {
            free_bonuses: $scope.activeBonusTab === $scope.backendBonusConstants.BonusSource.SportsBook
        };
        $scope.loadingBonus = true;
        Zergling.get(request,'get_bonus_details').then(processBonusData)['catch'](function (reason) {
            showConfirmationDialog(BackendConstants.ErrorCodesByValue[reason.result], 'error');
        })['finally'](function () {
            $scope.loadingBonus = false;
        });
    }

    /**
     * @ngdoc method
     * @name cancelBonus
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Number} Bonus id
     * @description Cancel active bonus
     */
    $scope.cancelBonus = function cancelBonus(bonusId) {
        var response = {
            amount: 50,
            currency: 'USD'
        }
        $scope.cancelBonusResponse(bonusId, response);
    };

    /**
     * @ngdoc method
     * @name cancelBonus
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Number} Bonus id
     * @description Cancel active bonus
     */
    $scope.cancelBonus = function cancelBonus(bonusId) {
        var msg = Translator.get('Are you sure want to cancel this bonus?');
        if ($rootScope.profile && $rootScope.profile.frozen_balance) {
            msg = msg + '<br />' + Translator.get('After the Cancellation {1} will be returned to you`r main balance.', [$rootScope.profile.frozen_balance + ' ' + $rootScope.profile.currency_name]);
        }

        var promise = showConfirmationDialog(msg, 'prompt');
        var request = {bonus_id: bonusId};
        promise.then(function () {
            Zergling.get(request,'cancel_bonus').then(function (response) {
                if (response.result === 0){
                    showConfirmationDialog('Bonus canceled', 'success');
                    getPromotionalBonus();
                } else {
                    showConfirmationDialog(BackendConstants.ErrorCodesByValue[response.result], 'error');
                }
            });
        }, function (reason) {
            console.log(reason);
        });
    };

    /**
     * @ngdoc method
     * @name claimBonus
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Number} Bonus id
     * @description Claim bonus
     */
    $scope.claimBonus = function claimBonus(bonusId) {
        var promise = showConfirmationDialog('Are you sure want to claim this bonus?', 'prompt');
        var request = {bonus_id: bonusId};
        promise.then(function () {
            Zergling.get(request,'claim_bonus').then(function (response) {
                if (response.result === 0){
                    showConfirmationDialog('Bonus claimed', 'success');
                    getPromotionalBonus();
                } else {
                    showConfirmationDialog(BackendConstants.ErrorCodesByValue[response.result], 'error');
                }
            });
        }, function (reason) {
            console.log(reason)
        })
    };

    /**
     * @ngdoc method
     * @name switchBonusTab
     * @methodOf vbet5.controller:promotionalBonusCtrl
     * @param {Number} Bonus Product type
     * @description Switch between bonus types
     */
    $scope.switchBonusTab = function switchBonusTab(target) {

        if (target !== $scope.activeBonusTab){
            $scope.bonusList = [];
            $scope.activeBonusTab = target;
            getPromotionalBonus();
        }
    };

    getPromotionalBonus(); //first step
}]);