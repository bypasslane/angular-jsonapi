(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .filter('angularJsonapiSearchObject', searchFilter);

  function searchFilter($jsonapi) {
    var names = $jsonapi.factoriesNames();

    return function(items, search, relationship, polymorphic) {
      // console.log(items);
      if (!search) {
        if (polymorphic === true) {
          return [];
        } else if (angular.isArray(relationship)) {
          return items.filter(function(value) {
            return relationship.indexOf(value) === -1;
          });
        } else {
          return items;
        }
      }

      console.log(relationship);
      var results = [];
      var words = search.split(' ');
      var searchWord;

      if (polymorphic === false) {
        searchWord = search;
        angular.forEach(items, function(value) {
          if (relationship.indexOf(value) === -1 && value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
            console.log(value.toString(), searchWord);
            results.push(value);
          }
        });
      } else {
        if (words.length > 1) {
          searchWord = words.splice(1).join(' ');
          angular.forEach(items, function(value) {
            if (relationship.indexOf(value) === -1 && value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
              console.log(value.toString(), searchWord);
              results.push(value);
            }
          });
        } else if (names.indexOf(words[0]) > -1) {
          return items.filter(function(value) {
            return relationship.indexOf(value) === -1;
          });
        }
      }

      return results;
    };
  }

})();
