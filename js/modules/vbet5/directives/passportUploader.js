/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:passportUploader
 * @description Upload passport image to server
 */
VBET5.directive('passportUploader', ['$sce', 'Zergling', function ($sce, Zergling) {
    'use strict';
    var INPUT_ID = 'passportImage';
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'templates/directive/passport-uploader.html',
        scope: {},
        link: function ($scope) {
            if (window.File && window.FileReader && window.FileList) {
                $scope.inputId = INPUT_ID;
            } else {
                $scope.notSupported = true;
            }
            $scope.filePicked = false;
            function doUpload(imageData) {
                Zergling.get({image_data: imageData}, 'upload_image').then(function (response) {
                    if (response.result !== 0) { // There was an error
                        $scope.uploadError = true;
                    } else {
                        $scope.fileUploaded = true;
                    }
                    $scope.loadingProgress = false;
                }, function (err) {
                    $scope.uploadError = true;
                    $scope.loadingProgress = false;
                    console.log('Image upload error ', err);
                });
            }

            function fileLoaded(e) {
                $scope.filePicked = true;
                doUpload(e.target.result);
            }

            $scope.submitForm = function () {
                var file = document.getElementById(INPUT_ID).files[0],
                    fileReader = new FileReader();
                if (!file) {return;}
                $scope.loadingProgress = true;
                fileReader.onloadend = fileLoaded;
                fileReader.readAsDataURL(file);
            };
            setTimeout(function(){
                document.getElementById(INPUT_ID).onchange = function () {
                    document.getElementById("uploadFilePassport").value = this.value;
                };
            }, 200);
        }
    };
}]);