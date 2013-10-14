/**
 * Expose `resource`.
 */

module.exports = function resource(primus, options) {

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

  primus.$.PrimusResource = createResource;

  /**
   * Create a new resource.
   *
   * @param {String} name Namespace id
   * @returns {Resource}
   * @api private
   */

  primus.resource = function resource(name) {
    return this.resources[name] || createResource(name);
  };

  /**
   * Create a resource object to be used.
   *
   * @param {String} name resource name
   * @return {Resource}
   * @api public
   */

  function createResource(name) {

    if (!primus.$.Multiplex) {
      throw new Error('Missing `primus-multiplex` required plugin for `primus-resource`');
    }

    if (!primus.$.PrimusEmitter) {
      throw new Error('Missing `primus-emitter` required plugin for `primus-resource`.');
    }

    /**
     * Blacklisted events.
     */

    var events = [
      'ready',
      'connection',
      'disconnection'
    ];

    // events regex
    var evRE = new RegExp('^on(?!(ce|' + events.join('|') + ')$)(.+)');

    /**
     * Initialize a new `resource`.
     *
     * @api public
     */

    function Resource() {

      if (!(this instanceof Resource)) {
        var resource = Object.create(Resource.prototype);
        Resource.apply(resource, arguments);
        return resource;
      }

      primus.resources[name] = this;
      this.construct.apply(this, arguments);
      this.channel.on('connection', this.onconnection.bind(this));
    }

    /**
     * Resource name.
     *
     * @type {String}
     * @api private
     */

    Resource.prototype.resourceName = name;

    /**
     * Resource primus channel.
     *
     * @type {Channel}
     * @api private
     */

    Resource.prototype.channel = primus.channel(name);

    /**
     * Constructor method.
     *
     * @return {Resource} self
     * @api public
     */

    Resource.prototype.construct = function () {
      return this;
    };

    /**
     * Called upon incoming connection.
     *
     * @param {Spark} spark The spark
     * @return {Resource} self
     * @api private
     */

    Resource.prototype.onconnection = function (spark) {
      var key, ev, events = [];
      for (key in this) {
        if (evRE.test(key)) {
          ev = key.replace('on', '');
          spark.on(ev, this[key].bind(this, spark));
          events.push(ev);
        }
      }
      spark.emit('ready', events);
      return this;
    };

    return Resource;
  }
};