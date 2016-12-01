/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:settingsCtrl
 * @description
 *  settings controller
 */
VBET5.controller('settingsCtrl', ['$scope', '$rootScope', '$location', 'Zergling', 'Translator', 'AuthData', 'Config', 'Utils', 'Moment', function ($scope, $rootScope, $location, Zergling, Translator, AuthData, Config, Utils, Moment) {
    'use strict';

    var REG_FORM_BIRTH_YEAR_LOWEST = 1900;
    var referralStartDate = Config.main.friendReferral;

    $scope.patterns = {
        email: "^([a-zA-Z0-9]+([_+\.-]?[a-zA-Z0-9]+)*)@([a-zA-Z0-9]+)([a-zA-Z0-9\\-\.]+)([\.])([a-z]+)([^~@!#$%^&*()_+|{}:<>?,/;'-=\\[\\]\\`\"\.\\\\])$",
        userName: "^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$",
        docNumber: "^[A-Za-z][A-Za-z0-9]*$"
    };
    $scope.settingsPage = $location.search().settingspage || Config.main.settingsDefaultPage; //deep linking
    $location.search('settingspage', undefined);
    $scope.changepasswordData = {
        oldpassword: '',
        password: '',
        password2: ''
    };

    $scope.preferences = {
        oddFormat: 'american',
        language: $rootScope.env.lang
    };

    $scope.monthNames = Config.main.monthNames;
    // if field name is not in this object then name of the field in get_user and update_user requests is the same
    var fieldNamesInUpdateUserInfo = {
        sur_name: 'last_name',
        phone_number: 'phone'
    };

    /**
     * @ngdoc method
     * @name changePassword
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user password using data from corresponding form
     */
    $scope.changePassword = function changePassword() {
        $scope.changepasswordForm.oldpassword.$invalid = $scope.changepasswordForm.oldpassword.$error.incorrect = false;
        $scope.working = true;
        $scope.changepasswordForm.$setPristine();
        var request = {
            password: $scope.changepasswordData.oldpassword,
            new_password: $scope.changepasswordData.password
        };
        Zergling.get(request, 'update_user_password').then(function (response) {
            $scope.working = false;
            console.log(response);
            if (response.auth_token) {
                var authData = AuthData.get();
                authData.auth_token = response.auth_token;
                AuthData.set(authData);
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get('Password changed')
                });
            } else {
                throw response;
            }
        })['catch'](function (response) {
            $scope.working = false;
            if (response.data.match("1006")) {
                $scope.changepasswordForm.oldpassword.$invalid = $scope.changepasswordForm.oldpassword.$error.incorrect = true;
                return;
            }
            var message = response.code == 12 ? 'Incorrect Current Password' : (Translator.get('Error occured') + ' : ' +response.msg);
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: message
            });
        });

    };

    /**
     * @ngdoc method
     * @name changeDetails
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user details using data from corresponding form
     */
    $scope.changeDetails = function changeDetails() {
        $scope.working = true;
        var request = {user_info:{}};
        if (Config.main.personalDetails.editableFields.length) {
            var index, i;
            for(i = 0; i < Config.main.personalDetails.editableFields.length; i++) {
                index = Config.main.personalDetails.editableFields[i];
                if(index === 'birth_date' && $scope.birthDate && $scope.birthDate.year && $scope.birthDate.month && $scope.birthDate.day) {
                    $scope.details[index] = $scope.birthDate.year.toString() + '-' + $scope.birthDate.month.toString() + '-' + $scope.birthDate.day.toString();
                }
                request.user_info[fieldNamesInUpdateUserInfo[index] || index] = $scope.details[index];
            }
        }
        request.user_info.password = $scope.details.password;
        if(Config.main.GmsPlatform) {
            request.user_info.subscribed_to_news = $scope.details.subscribed_to_news;
        }

        console.log("changeDetails", Config.main.personalDetails.editableFields, request, $scope.details);
        Zergling.get(request, 'update_user').then(function (response) {
            $scope.working = false;
            if (response.result === 0) {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: 'Personal information updated.'
                });
                prepareOnceEditableFields();

            } else if (response.result === '-1002' || response.result === '-1003') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Wrong Password' // No need to translate since its translated on the dialog side already
                });
            } else if (response.result === '-1119') {
                $scope.detailsForm.email.$invalid = $scope.detailsForm.email.$error.dublicate = true;
            } else if (response.result === '-1123') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Passport Number is already registered for another account' // No need to translate since its translated on the dialog side already
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });

    };

    /**
     * @ngdoc method
     * @name savePreferences
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user preferences using data from corresponding form
     */
    $scope.savePreferences = function savePreferences() {
        $scope.working = true;

    };

    /**
     * @ngdoc method
     * @name loadUserInfo
     * @methodOf vbet5.controller:settingsCtrl
     * @description loads user information from swarm
     */
    $scope.loadUserInfo = function loadUserInfo() {
        $scope.loadingInfo = true;
        Zergling.get({}, 'get_user').then(function (data) {
            $scope.details = data;
            $scope.details.phone_number = $scope.details.phone; // field name is different when loading/saving  :/

            if (Config.main.getBankInfoToProfile) {
                Zergling.get({}, 'get_bank_info').then(function (response) {
                    if (response && response.details) {
                        $scope.details.bank_info = response.details.bank_info;
                        if ($scope.details.bank_info) {
                            var index = Config.main.personalDetails.editableFields.indexOf('bank_info');
                            if (index > -1) {
                                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
                            }
                        }
                    }
                });
            }

            prepareOnceEditableFields(); // must be refactored '5163'

            $scope.loadingInfo = false;
        });
    };

    function prepareOnceEditableFields () {
        var index;

        if (!$scope.details.sex) {
            $scope.details.sex = 'M';
        } else {
            index = Config.main.personalDetails.editableFields.indexOf('gender');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }
        $scope.details.viewGender = Translator.get({'M': 'Male', 'F': 'Female'}[$scope.details.sex]);

        if ($scope.details.first_name) {
            index = Config.main.personalDetails.editableFields.indexOf('first_name');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.sur_name) {
            index = Config.main.personalDetails.editableFields.indexOf('sur_name');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.email) {
            index = Config.main.personalDetails.editableFields.indexOf('email');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.doc_number) {
            index = Config.main.personalDetails.editableFields.indexOf('doc_number');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if($scope.details.birth_date) {  // can edit if birthdate is empty and functionality of edit  enabled from config
            var birthOptions = $scope.details.birth_date.split('-');
            $scope.birthDate = {'year': birthOptions[0],'month': birthOptions[1], 'day' : birthOptions[2]};

            var index = Config.main.personalDetails.editableFields.indexOf('birth_date');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        } else if(Config.main.personalDetails.editableFields.indexOf('birth_date') !== -1) {
            $scope.birthDate = $scope.birthDate || {};
            $scope.birthDate.years = [];
            var i, max = new Date().getFullYear() - Config.main.registration.minimumAllowedAge;
            for (i = max; i >= REG_FORM_BIRTH_YEAR_LOWEST; i -= 1) {
                $scope.birthDate.years[i] = i.toString();
            }
        }

        if ($scope.details.bank_info) {
            index = Config.main.personalDetails.editableFields.indexOf('bank_info');
            if (index > -1) {
                Config.main.personalDetails.readOnlyFields.push(Config.main.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }


    }


    $scope.depositLimitsData = {
        amount: '',
        day: '',
        week: '',
        month: ''
    };

    $scope.selfExclusionData = {period: ''};

    /**
     * @ngdoc method
     * @name getLimits
     * @methodOf vbet5.controller:settingsCtrl
     * @description loads deposit limits into $scope.depositLimitsData
     */
    $scope.getLimits = function getLimits() {
        Zergling.get({type : 'deposit'}, 'user_limits').then(function (response) {
            $scope.working = false;
            if (response.result === 0) {
                console.log(response.details);
                $scope.depositLimitsData = response.details;
            }

        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
    };

    /**
     * @ngdoc method
     * @name setDepositLimits
     * @methodOf vbet5.controller:settingsCtrl
     * @description sets deposit limits
     */
    $scope.setDepositLimits = function setDepositLimits() {
        $scope.working = true;
        var request = {
            type: 'deposit',
            limits: {
                single: $scope.depositLimitsData.max_single_deposit,
                daily: $scope.depositLimitsData.max_day_deposit,
                weekly: $scope.depositLimitsData.max_week_deposit,
                monthly: $scope.depositLimitsData.max_month_deposit
            }
        };
        Zergling.get(request, 'set_user_limits').then(function (response) {
            $scope.working = false;
            if (response.result === 0 || response.result === 'OK') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get('Deposit limits set.')
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: Translator.get('Please try later or contact support.')
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
        console.log(request);
    };

    /**
     * @ngdoc method
     * @name setSelfExclusion
     * @methodOf vbet5.controller:settingsCtrl
     * @description sets self-exclusion periods
     */
    $scope.setSelfExclusion = function setSelfExclusion() {
        $scope.working = true;
        var limits = {
            '1-year' : {years: "1"},
            '6-month' : {months: "6"},
            '3-month' : {months: "3"},
            '1-month' : {months: "1"},
            '7-day' : {days: "7"},
            '1-day' : {days: "1"},
            'forever' : {years: "10"}
        };
        var request = {
            type: 'self-exclusion',
            limits: limits[$scope.selfExclusionData.period]
        };
        var command = "set_user_limits";
        if (Config.main.selfExclusionByExcType) {
            command = "set_client_self_exclusion";
            request = Utils.clone(limits[$scope.selfExclusionData.period]);
            request.exc_type = Config.main.selfExclusionByExcType;
        }

        Zergling.get(request, command).then(function (response) {
            $scope.working = false;
            if (response.result === 0 || response.result === 'OK') {
                if (Config.main.logoutAfterExclusion) {
                    $scope.logOut();
                    console.log('Logout After Exclusion');
                }
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get('Self-Exclusion period set.')
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: Translator.get('Error occured')
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
        console.log(request);
    };

    /**
     * @ngdoc method
     * @name initFriendReferral
     * @methodOf vbet5.controller:settingsCtrl
     * @description initialize
     */
    $scope.initFriendReferral = function initFriendReferral() {
        $scope.loadingReferralsList = false;
        if (!$scope.refDatesArray) {
            var startDate = Moment.moment([referralStartDate.year, referralStartDate.month - 2]);// (month - 2) because momentjs starts month count from 0 and because we need to include current month
            var monthsPeriod =  Moment.get().diff(startDate, 'months');
            var firstMonth = Config.main.GmsPlatform ? 1 : 0;

            $scope.refDatesArray = [];
            for(var i = firstMonth; i < monthsPeriod; i++) {
                var item = Moment.get().subtract('months', i).startOf('month');
                var date = {
                    text: item.format(('MMMM YYYY')),
                    month: item.month() + 1,
                    year: item.year(),
                    id: i
                };
                $scope.refDatesArray.push(date);
            }
            $scope.selectedFriendRefData = {
                date: $scope.refDatesArray[0]
            };
        }

        $scope.loadFriendReferralData();
    };


    /**
     * @ngdoc method
     * @name loadFriendReferralData
     * @methodOf vbet5.controller:settingsCtrl
     * @description load data for friend referral
     */
    $scope.loadFriendReferralData = function loadFriendReferralData() {
        $scope.loadingReferralsList = true;
        var request = {
            month: $scope.selectedFriendRefData.date.month,
            year: $scope.selectedFriendRefData.date.year
        };
        Zergling.get(request, 'get_ref_client_info').then(function(response) {
            if(response && response.details) {
                console.log("Friend Referral Data:", response);
                $scope.friendReferralData = response.details;
                if(response.details.sub_clients) {
                    if(angular.isArray(response.details.sub_clients.sub_client)) {
                        $scope.friendReferralList =  response.details.sub_clients.sub_client;
                    } else {
                        $scope.friendReferralList = [response.details.sub_clients.sub_client] || "";
                    }
                }
                $scope.loadingReferralsList = false;
            }
        })['catch'](function(error) {
            console.log(error);
        });
    };

    /**
     * @ngdoc method
     * @name calculateAge
     * @methodOf vbet5.controller:settingsCtrl
     * @description Recalculate user age and set to userAge
     */
    $scope.calculateAge = function calculateAge() {
        if ($scope.birthDate && $scope.birthDate.year && $scope.birthDate.month && $scope.birthDate.day)
        {
            var birthDate = new Date($scope.birthDate.year, $scope.birthDate.month - 1, $scope.birthDate.day);
            var today = new Date();
            var age = today.getFullYear() - birthDate.getFullYear();
            var mounts = today.getMonth() - birthDate.getMonth();
            if (mounts < 0 || (mounts === 0 && today.getDate() < birthDate.getDate())){
                age--;
            }
            $scope.userAge = age;
        } else {
            $scope.userAge = null;
        }

    };
}]);
