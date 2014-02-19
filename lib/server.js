'use strict';

/**
 * Expose `resource`.
 */

module.exports = function resource(primus, options) {
 
  /**
   * List of resources.
   *
   * @type {object}
   * @api private
   */

  primus.resources = {};

  /**
   * Define the global $ namespace if its 
   * not yet defined.
   *
   * @type {object}
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

  primus.$.resource = {};
  primus.$.resource.resource = createResource;

  /**
   * Create a new resource.
   *
   * @param {String} name Namespace id
   * @returns {Resource}
   * @api private
   */

  primus.resource = function create(name, resource, multiplex) {
    return this.resources[name] || createResource(name, resource, multiplex);
  };

  /**
   * Create a resource object to be used.
   *
   * @param {String} name Resource name
   * @param {Object} resource The resource object
   * @param {Boolean} multiplex
   * @return {Resource}
   * @api public
   */

  function createResource(name, resource, multiplex) {

    resource = resource || {};

    multiplex = ('undefined' === typeof multiplex) ? true : multiplex;

    var ns = multiplex ? '' : name + '::';

    // Validate resource definitions

    if (!name) {
      throw new Error('Resource should be specified with a name');
    }
    
    if ('string' !== typeof name) {
      throw new Error('Resource names should be a `String`');
    }

    if (!/^(object|function)$/.test(typeof resource)) {
      throw new Error('Resource should be an `Object` or `Function`');
    }

    if (multiplex && !primus.$.multiplex) {
      throw new Error('Missing `primus-multiplex` required plugin for `primus-resource`');
    }

    if (!primus.$.emitter) {
      throw new Error('Missing `primus-emitter` required plugin for `primus-resource`.');
    }

    /**
     * Blacklisted event methods.
     */

    var events = [
      'ready',
      'connection',
      'disconnection'
    ];

    // events regex
    var evRE = new RegExp('^on(?!(ce|' + events.join('|') + ')$)(.+)');

    var slice = [].slice;

    /**
     * Add resource name.
     *
     * @type {String}
     * @api private
     */

    resource.resourceName = name;

    /**
     * Add resource channel.
     *
     * @type {Channel}
     * @api private
     */

    resource.channel = multiplex ? primus.channel(name) : primus;

    /**
     * Broadcast a message to all resource clients.
     *
     * @param {String} event
     * @param {Mixed} data
     * @api public
     */

    resource.broadcast = function brodcast(event, data) {
      var args = slice.call(arguments, 1);
      resource.channel.forEach(function each(spark, id, connections) {
        spark.send.apply(spark, [ns + event].concat(args));
      });
    };

    /**
     * Bind connection event.
     *
     * @param {Spark} spark
     * @api private
     */

    resource.channel.on('connection', function connection(spark) {
      var key, ev, events = [];
      for (key in resource) {
        if (evRE.test(key)) {
          ev = key.replace('on', '');
          spark.on(ns + ev, resource[key].bind(resource, spark));
          events.push(ev);
        }
      }
      spark.send(ns + 'ready', events);
    });

    // Add resource to resource collection
    primus.resources[name] = resource;

    return resource;
  }
};