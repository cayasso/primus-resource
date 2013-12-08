

'use strict';

/**
 * Module dependencies.
 */

var resourceServer = require('./server')
  , resourceClient = require('./client');

/**
 * Plugin server method.
 *
 * @api public
 */

exports.server = resourceServer;

/**
 * Plugin client method.
 *
 * @param {Primus} primus The primus instance.
 * @api public
 */

exports.client = function client(primus) {

  var Resource = Primus.$.resource.Resource;

  /**
   * List of resources.
   *
   * @type {Object}
   * @api private
   */

  primus.resources = {};

  /**
   * Create a new resource.
   *
   * @param {String} name The resource name
   * @returns {Resource}
   * @api private
   */
   
  primus.resource = function _resource(name, multiplex) {
    return this.resources[name] || Resource(this, name, multiplex);
  };
};

/**
 * Source code for plugin library.
 *
 * @type {String}
 * @api public
 */

exports.library = [
  ';(function (Primus, undefined) {',
    resourceClient.toString(),
  ' if (undefined === Primus) return;',
  ' Primus.$ = Primus.$ || {};',
  ' Primus.$.resource = {}',
  ' Primus.$.resource.resource = resource;',
  ' Primus.$.resource.Resource = resource();',
  '})(Primus);'
].join('\n');