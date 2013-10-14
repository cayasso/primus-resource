/**
 * Expose `createResource`.
 */

module.exports = createResource;

/**
 * Create a resource object to be used.
 *
 * @param {Primus} primus
 * @return {Resource}
 * @api public
 */

function createResource(primus, name) {

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
  var evRE = new RegExp('^on(?!(ce|'+ events.join('|')+')$)(.+)');

  /**
   * Initialize a new resource.
   *
   * @param {Object} attrs
   * @api public
   */

  function Resource() {
    if (!(this instanceof Resource)) return new Resource(name);
    this.name = name;
    this.channel = primus.channel(name);
    primus.resources[name] = this;
    this.initialize();
    this.bind();
  }

  /**
   * Abstract initialize method.
   *
   * @return {Resource} self
   * @api public
   */

  Resource.prototype.initialize = function () {
    return this;
  };

  /**
   * Bind resource events.
   *
   * @param {String} name Namespace id
   * @return {Resource} self
   * @api private
   */

  Resource.prototype.bind = function () {
    this.channel.on('connection', this.onconnection.bind(this));
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
    primus.resources = primus.resources || {};
    primus.resources[this.name] = this;
    spark.emit('ready', events);
    return this;
  };

  return Resource;
}

