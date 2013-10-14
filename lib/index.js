var library = require('fs').readFileSync(__dirname + '/client/resource.js', 'utf-8')
  , resource = require('load').compiler(library).resource;

/**
 * Expose server.
 */

exports.server = function server(primus) {

  var Resource = require('./server/resource');

  /**
   * List of resources.
   *
   * @type {Object}
   * @api private
   */

  primus.resources = {};

  /**
   * Define the global $ namespace if its 
   * not yet defined.
   *
   * @type {Object}
   * @api private
   */

  primus.$ = primus.$ || {};

  /**
   * Register Resource under $ as a plugin 
   * for other plugins to be aware of it.
   *
   * @type {Object}
   * @api private
   */

  primus.$.PrimusResource = Resource;

  /**
   * Create a new resource.
   *
   * @param {String} name Namespace id
   * @returns {Resource}
   * @api private
   */

  primus.resource = function resource(name) {
    return this.resources[name] || Resource(this, name);
  };

};

/**
 * Expose client.
 */

exports.client = function client(primus) {

  var Resource = resource(Primus.Stream);

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
   * @param {String} name Namespace id
   * @returns {Resource}
   * @api private
   */
   
  primus.resource = function resource(name) {
    return this.resources[name] || Resource(this, name);
  };
};

/**
 * Expose library
 */

exports.library = library;