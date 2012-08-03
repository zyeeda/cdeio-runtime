// Generated by CoffeeScript 1.3.3
(function() {
  var createManager;

  createManager = require('coala/manager').createManager;

  exports.createService = function() {
    return {
      createManager: function(entityClass, entityManagerFactoryName) {
        if (entityManagerFactoryName == null) {
          entityManagerFactoryName = false;
        }
        return createManager(entityClass, entityManagerFactoryName);
      },
      __noSuchMethod__: function(name, args) {
        var dao;
        dao = this.createManager(args[0]);
        return dao[name](args[1]);
      }
    };
  };

}).call(this);
