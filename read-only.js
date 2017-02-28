var debug = require('debug')('loopback-readonly-mixin');
var _ = require('lodash');

module.exports = function(Model, options) {
  Model.on('attached', function() {
    ReadOnly(Model, options)
  });
};

function ReadOnly(Model, options) {
  options = options || [];
  'use strict';

  debug('ReadOnly mixin for Model %s', Model.modelName);
  var props = options.only;
  if (options.except && options.except.length) {
    props = _.difference(_.keys(Model.definition.properties), options.only);
  }

  stripReadOnlyProperties = function(ctx, modelInstance, next) {
    var body = ctx.req.body;
    if (!body) {
      return next();
    }
    if (props.length > 0) {
      debug('Creating %s : Read only properties are %j', Model.modelName, props);
      props.forEach(function(key) {
        debug('The \'%s\' property is read only, removing incoming data', key);
        delete body[key];
      });
      next();
    } else {
      var err = new Error('Unable to update: ' + Model.modelName + ' is read only.');
      err.statusCode = 403;
      next(err);
    }
  };
  Model.beforeRemote('create', function(ctx, modelInstance, next) {
    stripReadOnlyProperties(ctx, modelInstance, next);
  });
  Model.beforeRemote('upsert', function(ctx, modelInstance, next) {
    stripReadOnlyProperties(ctx, modelInstance, next);
  });
  Model.beforeRemote('prototype.updateAttributes', function(ctx, modelInstance, next) {
    stripReadOnlyProperties(ctx, modelInstance, next);
  });
  Model.beforeRemote('updateAll', function(ctx, modelInstance, next) {
    stripReadOnlyProperties(ctx, modelInstance, next);
  });
}
