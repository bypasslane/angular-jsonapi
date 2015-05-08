(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest
  ) {
    var dietiesSchema = {
      type: 'dieties',
      id: 'uuid4',
      name: ['required', 'string'],
      power: ['required', 'integer'],
      links: {
        apearences: {
          type: 'hasMany',
          polymorphic: true
        }
      },
      functions: {
        toString: function() {
          if (!this.data.name) {
            return this.data.id;
          }

          return this.data.name;
        }
      }
    };

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var dietiesSynchro = new AngularJsonAPISynchronizationRest('/dieties');
    dietiesSynchro.extend(localeSynchro);

    $jsonapi.addModel(dietiesSchema, dietiesSynchro);
  })
  .factory('Dieties', Dieties);

  function Dieties(
    $jsonapi
  ) {
    return $jsonapi.getModel('dieties');
  }
})();