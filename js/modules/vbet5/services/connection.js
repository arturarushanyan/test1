/* global VBET5 */
/**
 * @ngdoc service
 * @name vbet5.service:connection
 * @description connection service
 *
 */
VBET5.service('ConnectionService', ['$q', 'Zergling', 'Utils', function ($q, Zergling, Utils) {
    'use strict';

    function ConnectionService($scope) {
        // used to unsubscribe from all, on scope destroy
        this.allSubscriptionSubIds = {};

        this.allSubscriptionPromises = {};

        // used to keep history of requests,
        // so in case of unresolved subscriptions (fast clicks, slow connectivity)
        // we're subscribing only to last request (to skip intermediate subscriptions)
        this.allSubscriptionHashes = {};

        var self = this;
        $scope.$on('$destroy', function () {
            Zergling.unsubscribe(Object.keys(self.allSubscriptionSubIds));

            Utils.emptyObject(self.allSubscriptionSubIds);
            Utils.emptyObject(self.allSubscriptionPromises);
            Utils.emptyObject(self.allSubscriptionHashes);

            self.allSubscriptionSubIds = {};
            self.allSubscriptionPromises = {};
            self.allSubscriptionHashes = {};
        });
    }

    ConnectionService.prototype.subscribe = function subscribe (request, successCallback, additionalCallbacks, hashFullRequest) {
        var self = this;
        var requestHash = null;

        // keeping request history per category (using "request"."what" for that),
        // in order to separate e.g. left menu related requests, from for example main header requests
        // so that if fast requests happen from both areas one will not unsubscribe the other.
        var requestCategory = this.allSubscriptionHashes[JSON.stringify(request.what)];
        if (!requestCategory) {
            requestCategory = [];
        }
        requestCategory.push(JSON.stringify(request));

        if (hashFullRequest) {
            requestHash = JSON.stringify(request);
        } else {
            // we're hashing only "what" part of requests, to be able to categorize them,
            // to prevent requests from different categories to interfer (affect, unsubscribe) with each other.
            //
            // E.g. if user selects a game from left menu in classic view or selects a sport from top menu in modern view,
            // they will belong to separate categories, thus one will not unsubscribe the other)
            requestHash = JSON.stringify(request.what);
        }

        if (this.allSubscriptionPromises[requestHash] !== undefined) {
            var unresolvedSubscription = this.allSubscriptionPromises[requestHash];
            unresolvedSubscription.then(function (subId) {
                Zergling.unsubscribe(subId);

                delete self.allSubscriptionPromises[self.allSubscriptionSubIds[subId]];
                delete self.allSubscriptionSubIds[subId];

                // subscribe only to last request, in series of fast clicks
                // using this to skip intermediate subscriptions.
                if (requestCategory && requestCategory[requestCategory.length-1] === JSON.stringify(request)) {
                    // deleting request history for a request category
                    self.allSubscriptionHashes[JSON.stringify(request.what)] = [];

                    self.subscribe(request, successCallback, additionalCallbacks, hashFullRequest);
                }
            });

            delete this.allSubscriptionPromises[requestHash];

            return;
        }

        var subscribingProgress = $q.defer();
        this.allSubscriptionPromises[requestHash] = subscribingProgress.promise;

        Zergling.subscribe(request, successCallback)
        .then(function (result) {
            if (result.subid) {
                self.allSubscriptionSubIds[result.subid] = requestHash;
                subscribingProgress.resolve(result.subid);
            }

            if (result.data) {
                successCallback(result.data, result.subid);
            }

            additionalCallbacks && additionalCallbacks.thenCallback && additionalCallbacks.thenCallback(result);
        })['catch'](function (reason) {
            subscribingProgress.resolve(null);
            additionalCallbacks && additionalCallbacks.failureCallback && additionalCallbacks.failureCallback(reason);
        });
    };

    ConnectionService.prototype.unsubscribe = function unsubscribe (subIds) {
        var self = this;

        if (!angular.isObject(subIds)) {
            var subIdsObject = {};
            subIdsObject[subIds] = subIds;
            subIds = subIdsObject;
        }

        var subIdsKeys = Object.keys(subIds);

        if (!subIdsKeys.length) {
            return $q.all([]);
        }

        var onlyRealSubIds = [];
        angular.forEach(subIds, function (subId) {
            if (!subId) {
                return;
            }

            onlyRealSubIds.push(subId);
            delete self.allSubscriptionPromises[self.allSubscriptionSubIds[subId]];
            delete self.allSubscriptionSubIds[subId];
        });

        var unsubscribePromise = Zergling.unsubscribe(onlyRealSubIds);

        Utils.emptyObject(subIds);

        return unsubscribePromise;
    };

    return ConnectionService;
}]);