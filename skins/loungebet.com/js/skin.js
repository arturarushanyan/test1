VBET5.controller('loungebetPaymentsCtrl', ['$scope', '$rootScope', '$window', 'Zergling', 'Utils', 'Translator', function ($scope, $rootScope, $window, Zergling, Utils, Translator) {
    'use strict';

    $scope.step = 1;

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
        PAYINBANK_NAME: "",
        PAYINBANK_USERNAME: $rootScope.profile.username,
        PAYINBANK_DATA: $rootScope.profile.birth_date,
        PAYINBANK_EMAIL: $rootScope.profile.email,
        PAYINBANK_CPF1: $scope.userDocNumber[0] || null,
        PAYINBANK_CPF2: $scope.userDocNumber[1] || null,
        PAYINBANK_CPF3: $scope.userDocNumber[2] || null,
        PAYINBANK_CPF4: $scope.userDocNumber[3] || null,
        PAYINBANK_SUM: "",
        PAYINBANK_STEPNAME: "" // will be filled on step 2
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
                forProduct: 'sport'
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

    console.clear();
    console.log($rootScope);
}]);


