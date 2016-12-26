/**
 * @ngdoc controller
 * @name vbet5.controller:showHide
 * @description Toggle show/hide password visibility
 */
VBET5.controller('mainCtrl', ['$scope', function( $scope ){
    'use strict';

    $scope.inputType = 'password';
    $scope.hideShowPassword = function(){
        if ($scope.inputType == 'password')
            $scope.inputType = 'text';
        else
            $scope.inputType = 'password';
    };
}]);