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
   
  primus.resource = function resource(name, multiplex) {    
    return this.resources[name] || Resource(this, name, multiplex);
  };

  /**
   * Initialize a new resource.
   *
   * @param {Stream} stream
   * @param {String} name
   * @api public
   */

  function Resource(stream, name, multiplex) {
    if (!(this instanceof Resource)) return new Resource(stream, name, multiplex);
    Emitter.call(this);
    multiplex = ('undefined' === typeof multiplex) ? true : multiplex;
    this.ns = multiplex ? '' : name + '::';
    this.stream = multiplex ? stream.channel(name) : stream;
    stream.resources = stream.resources || {};
    stream.resources[name] = this;
    this.name = name;
    this._bind();
  }

  /**
   * Inherits from `EventEmitter`.
   */

  Resource.prototype.__proto__ = Emitter.prototype;

  /*['on', 'off', 'once', 'send'].forEach(function(fn){
    Resource.prototype['_'+fn] = Resource.prototype[fn];
    Resource.prototype[fn] = function(ev) {
      var args = slice.call(arguments, 1);
      this.stream[fn].apply(this.stream, [this.ns + ev].concat(args));
    };
  });*/

  Resource.prototype.send = function send(ev) {
    var args = slice.call(arguments, 1);
    this.stream.send.apply(this.stream, [this.ns + ev].concat(args));
  };

  /**
   * Bind resource events.
   *
   * @param {String} name Namespace id
   * @return {Resource}
   * @api private
   */

  Resource.prototype._bind = function () {
    var resource = this;
    resource.stream.on(resource.ns + 'ready', function ready(methods) {
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
    var resource = this
      , ns = resource.ns
      , len = methods.length
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
          //fn = args.pop();
        }
        
        // here we push the new callback function
        // as argument, it will call emit on the
        // resource.
        /*args.push(function proxy(error, res) {
          if (fn) fn(error, res);
          if (error) return resource.emit('error', error);
          if (res && res.item && res.ttl && res.stored) res = res.item; // this is for mongo-live only
          if (method === method.replace(ns, '')) {
            console.log('sending', ns + method, ns, method);
            resource.emit(method, res);
          }
        });*/

        // lets emit the event with the corresponding arguments
        stream.send.apply(stream, [ns + method].concat(args));
      };
      
    }

    // emit the ready event
    resource.emit('ready', resource.name, methods);
    
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
    //this.on('ready', fn);
    return this;
  };

  return Resource;
}
