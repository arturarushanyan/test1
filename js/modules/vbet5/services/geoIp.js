/* global VBET5 */
/**
 * @ngdoc service
 * @name vbet5.service:Geoip
 * @description
 *
 * service to get geolocation data by ip.  uses ipinfodb.com public API
 * account login/password is vbetcom/vbetcom
 *
 */

VBET5.service('Geoip', ['$http', '$q', function ($http, $q) {
    'use strict';
    var Geoip = {};

    var key = '86c9b7f353f7a09e19d74905019f873e3c0a0501037a5a17dbcf7ea84ce01022';

    var apiUrl = 'https://api.ipinfodb.com/v3';

    var data = null;
    /**
     * @ngdoc method
     * @name getCountry
     * @methodOf vbet5.service:Geoip
     * @description returns promise that will be resolved with object containing geo data (country).
     *
     */
    Geoip.getCountry = function getCountry() {
        var promise = $q.defer();
        $http.jsonp(apiUrl + '/ip-country/?key=' + key + '&format=json&callback=JSON_CALLBACK')
             .success(function (response) {
                return promise.resolve(response);
            }).error(function (response) {
                return $q.reject(response);
            });
        return promise.promise;
    };


    /**
     * @ngdoc method
     * @name getGeoData
     * @methodOf vbet5.service:Geoip
     * @description returns promise that will be resolved with object containing geo data.
     *
     * example:
     *
     *    {
     *     "statusCode" : "OK",
     *     "statusMessage" : "",
     *     "ipAddress" : "91.103.58.142",
     *     "countryCode" : "AM",
     *     "countryName" : "ARMENIA",
     *     "regionName" : "YEREVAN",
     *     "cityName" : "YEREVAN",
     *     "zipCode" : "-",
     *     "latitude" : "40.1811",
     *     "longitude" : "44.5136",
     *     "timeZone" : "+05:00"
     *   }
     *
     * @param {Boolean} noCache if true, requests will be done on every call, if no, only once and response will be cached
     * @returns {Object} promise
     */
    Geoip.getGeoData = function getGeoData(noCache) {
        var deferred = $q.defer();
        if (!noCache && data) {
            console.log("getGeoData returning cached data", data);
            deferred.resolve(data);
            return deferred.promise;
        }
        $http.jsonp(apiUrl + '/ip-city/?key=' + key + '&format=json&callback=JSON_CALLBACK')
            .success(function (response) {
                data = response;
                deferred.resolve(response);
            }).error(function (response) {
                console.log("error getting geo data", response);
                deferred.reject(response);
            });
        return deferred.promise;
    };

    return Geoip;

}]);
