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
    this.bind();
  }

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
   * @param {Spark} stream The spark
   * @return {Resource} self
   * @api private
   */

  Resource.prototype.onconnection = function (stream) {
    var key, ev, events = [];
    for (key in this) {
      if (key !== 'once' && /^on(.+)/.test(key)) {
        ev = key.replace('on', '');
        stream.on(ev, this[key].bind(this));
        events.push(ev);
      }
    }
    primus.resources = primus.resources || {};
    primus.resources[this.name] = this;
    stream.emit('ready', events);
    return this;
  };

  return Resource;
}

