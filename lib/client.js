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
   * @param {String} name The resource name
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
      setup(methods[i]);
    }

    // we need to setup each remote method
    // make the corresponding namespace on the
    // resource so we can call it.
    function setup(method) {

      // create the remote method
      resource[method] = function () {
        var fn, args = slice.call(arguments);
        
        // check to see if we have a callback function
        // if so we replace it with one that emit events
        // on results.
        if ('function' === typeof args[args.length-1]) {
          fn = args.pop();
        }
        
        // here we push the new callback function
        // as argument, it will call emit on the
        // resource.
        args.push(function proxy(error, res) {
          if (fn) fn(error, res);
          if (error) return resource.emit('error', error);
          resource.emit(method, res);
        });

        // lets emit the event with the corresponding arguments
        stream.emit.apply(stream, [method].concat(args));
      };
    }

    // emit the ready event
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
