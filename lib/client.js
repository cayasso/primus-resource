/**
 * Exports `resource`.
 */

module.exports = function resource(primus, options) {

  'use strict';

  var Emitter
    , slice = [].slice;

  try {
    Emitter = require('events').EventEmitter;
  } catch (e) {
    Emitter = Primus.EventEmitter;
  }

  /**
   * Initialize a new resource.
   *
   * @param {Stream} stream
   * @param {String} name
   * @param {Boolean} multiplex
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

  Resource.prototype = Object.create(Emitter.prototype);
  Resource.prototype.constructor = Resource;
  Resource.prototype._on = Resource.prototype.on;

  /**
   * Bind resource events.
   *
   * @param {String} name Namespace id
   * @return {Resource} this
   * @api private
   */

  Resource.prototype.on = function on(ev, fn) {
    if ('ready' === ev) return this._on(ev, fn);
    this.stream.on(this.ns + ev, fn);
  };

  /**
   * Bind resource events.
   *
   * @return {Resource} this
   * @api private
   */

  Resource.prototype._bind = function _bind() {
    var resource = this
      , ev = resource.ns + 'ready';

    // bind end event
    resource.stream.on('open', function onend() {

      // rebind onready event
      resource.stream.once(ev, ready);

    });

    /**
     * Ready event for binding.
     *
     * @param {Array} methods
     * @api private
     */

    function ready(methods) {
      resource.onready(methods);
    }

    return this;
  };

  /**
   * Called upon resource ready.
   *
   * @param {Array} methods
   * @return {Resource} this
   * @api private
   */

  Resource.prototype.onready = function onready(methods) {

    var i = 0
      , resource = this
      , ns = resource.ns
      , stream = this.stream
      , len = methods.length;

    for (; i < len; ++i) setup(methods[i]);

    // we need to setup each remote method
    // make the corresponding namespace on the
    // resource so we can call it.
    function setup(method) {
      // create the remote method
      if ('function' === typeof resource[method]) return;
      resource[method] = function () {
        var args = slice.call(arguments);
        // manage timer if applicable
        const fn = args.length > 0 && args[args.length-1];
        const timeout = (fn && fn.timeout) || resource.timeout;
        if (timeout) {
          args[args.length-1] = function wrap() {
            clearTimeout(fn.timer);
            fn.apply(this, arguments);
          }
          fn.timer = setTimeout(() => {
            fn.apply(this, [fn.timeoutVal || resource.timeoutVal]);
          }, timeout);
        }
        // lets send event with the corresponding arguments
        stream.send.apply(stream, [ns + method].concat(args));
      };
    }

    // emit the ready event
    resource.emit('ready', resource.name, methods);
    return this;
  };

  return Resource;
};
