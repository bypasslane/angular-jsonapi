(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('namedFunction', namedFunction);

  function namedFunction(name, fn) {
    var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
    var MOZ_HACK_REGEXP = /^moz([A-Z])/;

    name = name.
      replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
        return offset ? letter.toUpperCase() : letter;
      }).
      replace(MOZ_HACK_REGEXP, 'Moz$1');

    return new Function('fn',
      'return function ' + name + '(){ return fn.apply(this,arguments)}'
    )(fn);
  }
})();
