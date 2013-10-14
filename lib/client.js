function resource(primus, options) {

  var Emitter
    , slice = [].slice;

  try {
    Emitter = require('events').EventEmitter;
  } catch (e) {
    Emitter = Primus.EventEmitter;
  }

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

  /**
   * Initialize a new resource.
   *
   * @param {Stream} stream
   * @param {String} name
   * @api public
   */

  function Resource(stream, name) {
    if (!(this instanceof Resource)) return new Resource(stream, name);
    Emitter.call(this);
    this.name = name;
    this.stream = stream.channel(name);
    stream.resources = stream.resources || {};
    stream.resources[name] = this;
    this.bind();
  }

  /**
   * Inherits from `EventEmitter`.
   */

  Resource.prototype.__proto__ = Emitter.prototype;

  /**
   * Bind resource events.
   *
   * @param {String} name Namespace id
   * @return {Resource}
   * @api private
   */

  Resource.prototype.bind = function () {
    var resource = this;
    resource.stream.on('ready', function (methods) {
      resource.onready(methods);
    });
    return this;
  };

  /**
   * Called upon resource ready.
   *
   * @param {Array} methods
   * @return {Resource}
   * @api private
   */

  Resource.prototype.onready = function (methods) {
    var len = methods.length
      , resource = this
      , stream = this.stream;

    for (var i = 0; i < len; i++) {
      call(methods[i]);
    }

    function call(method) {
      resource[method] = function () {
        var args = slice.call(arguments);
        stream.emit.apply(stream, [method].concat(args));
      };
    }
    resource.emit('ready');
    return this;
  };

  /**
   * Register on ready event.
   *
   * @param {Function} fn
   * @return {Resource}
   * @api public
   */

  Resource.prototype.ready = function (fn) {
    this.on('ready', fn);
    return this;
  };

  return Resource;
}
