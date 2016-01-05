(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPIModelErrorsManager,
    $rootScope,
    $injector,
    $log,
    $q
  ) {

    AngularJsonAPICollection.prototype.fetch = fetch;
    AngularJsonAPICollection.prototype.refresh = fetch;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.hasErrors = hasErrors;

    return {
      create: AngularJsonAPICollectionFactory
    };

    function AngularJsonAPICollectionFactory(resource, params) {
      return new AngularJsonAPICollection(resource, params);
    }

    /**
     * Constructor
     * @param {AngularJsonAPIResource} resource Factory associated with the collection
     * @param {object} params  Params associated with this resource (such as filters)
     */
    function AngularJsonAPICollection(resource, params) {
      var _this = this;

      _this.resource = resource;
      _this.type = resource.schema.type;
      _this.params = params || {};

      _this.errors = {
        synchronization: AngularJsonAPIModelErrorsManager.create(
          'Source',
          'Errors of synchronizations',
          AngularJsonAPIModelSourceError
        )
      };

      _this.data = _this.resource.cache.index(_this.params);

      _this.loading = false;
      _this.loadingCount = 0;
      _this.synchronized = false;
      _this.pristine = _this.data === undefined;
      _this.paginated = false;
      _this.url = void 0;

      _this.promise = $q.resolve(_this);

      _this.first = first;
      _this.last = last;
      _this.prev = prev;
      _this.next = next;

      var onObjectRemove = $rootScope.$on('angularJsonAPI:' + _this.type + ':object:remove', remove);
      var onFactoryClear = $rootScope.$on('angularJsonAPI:' + _this.type + ':resource:clearCache', clear);
      var onObjectAdd = $rootScope.$on('angularJsonAPI:' + _this.type + ':object:add', add);

      $rootScope.$on('$destroy', clearWatchers);

      function remove(event, status, object) {
        var index;

        if (status === 'resolved' && _this.data !== undefined) {
          index = _this.data.indexOf(object);
          if (index > -1) {
            _this.data.splice(index, 1);
            _this.resource.cache.setIndexIds(_this.data);
          }
        }
      }

      function clear() {
        _this.data = undefined;
        _this.pristine = true;
      }

      function add(event, status, object) {
        if (status === 'resolved') {
          _this.data = _this.data || [];
          _this.data.push(object);
        }
      }

      function clearWatchers() {
        onObjectRemove();
        onFactoryClear();
        onObjectAdd();
      }


      function first() {
        _this.url = _this.links.first;

        return _this.fetch();
      }

      function last() {
        _this.url = _this.links.last;

        return _this.fetch();
      }

      function prev() {
        _this.url = _this.links.prev;

        return _this.fetch();
      }

      function next() {
        _this.url = _this.links.next;

        return _this.fetch();
      }
    }

    /**
     * Check if the object has errors
     * @return {Boolean}
     */
    function hasErrors() {
      var _this = this;
      var answer = false;

      angular.forEach(_this.errors, function(error) {
        answer = error.hasErrors() || answer;
      });

      return answer;
    }

    /**
     * Shortcut to this.resource.get
     * @param  {string} id Id of object]
     * @return {AngularJsonAPIModel}          Model with id
     */
    function get(id, params) {
      var _this = this;

      return _this.resource.get(id, params);
    }

    /**
     * Synchronizes collection with the server
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function fetch() {
      var _this = this;
      var deferred = $q.defer();
      var $jsonapi = $injector.get('$jsonapi');
      var config = {
        action: 'all',
        params: _this.params,
        url: _this.url
      };

      __incrementLoadingCounter(_this);

      angular.forEach(_this.data, __incrementLoadingCounter);

      _this.resource.synchronizer.synchronize(config)
        .then(resolve, reject, notify)
        .finally(__decrementLoadingCounter.bind(_this, undefined));

      return deferred.promise;

      function resolve(response) {
        var results = $jsonapi.__proccesResults(response.data);
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'resolved', _this, response);
        $q.allSettled(results.included.map(synchronizeIncluded)).then(resolveIncluded, deferred.reject);

        angular.forEach(_this.data, __decrementLoadingCounter);

        _this.data = results.data;
        _this.links = response.data.links;

        _this.updatedAt = Date.now();
        _this.synchronized = true;

        _this.resource.cache.setIndexIds(_this.data);
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        function synchronizeIncluded(object) {
          __incrementLoadingCounter(object);

          return object.synchronize({
            action: 'include',
            object: object
          }).finally(__decrementLoadingCounter.bind(object, undefined));
        }

        function resolveIncluded(includedResponse) {
          angular.forEach(includedResponse, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + results.included[key].data.type + ':object:include', 'resolved', results.included[key], operation);

              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'rejected', _this, response);

        angular.forEach(_this.data, __decrementLoadingCounter);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'notify', _this, response);

        deferred.notify(response);
      }
    }
  }

  function __incrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount += 1;
    object.loading = true;
  }

  function __decrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount -= 1;
    object.loading = object.loadingCount > 0;
  }
})();
