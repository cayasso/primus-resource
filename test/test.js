var Primus = require('primus');
var resource = require('../');
var http = require('http').Server;
var expect = require('expect.js');
var opts = { transformer: 'websockets', parser: 'JSON' };

// creates the client
function client(srv, primus, port){
  var addr = srv.address();
  var url = 'http://' + addr.address + ':' + (port || addr.port);
  return new primus.Socket(url);
}

// creates the server
function server(srv, opts) {
  return Primus(srv, opts)
  .use('multiplex', 'primus-multiplex')
  .use('emitter', 'primus-emitter')
  .use('resource', resource);
}

describe('primus-resource', function (){

  it('should throw error if `primus-multiplex` is missing', function (){
    var srv = http();
    var primus = Primus(srv, opts)
    .use('resource', resource);

    try {
      primus.resource('creature');
    } catch (e) {
      return expect(e.message).to.contain('primus-multiplex');
    }

    throw new Error('I should have throwed above');
  });

  it('should throw error if `primus-emitter` is missing', function (){
    var srv = http();
    var primus = Primus(srv, opts)    
    .use('multiplex', 'primus-multiplex')
    .use('resource', resource);

    try {
      primus.resource('creature');
    } catch (e) {
      return expect(e.message).to.contain('primus-emitter');
    }

    throw new Error('I should have throwed above');
  });

  it('should have required methods', function (done){
    var srv = http();
    var primus = server(srv, opts);
    srv.listen(function(){
      var cl = client(srv, primus);
      expect(primus.resource).to.be.a('function');
      expect(cl.resource).to.be.a('function');
      done();
    });
  });

  it('should return a constructor function', function (){
    var srv = http();
    var primus = server(srv, opts);
    var Creature = primus.resource('creature');
    expect(Creature).to.be.a(Function);
  });

  it('should fire ready event', function(done){
    var srv = http();
    var primus = server(srv, opts);
    

    srv.listen(function(){
      primus.resource('creature')();
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');

    creature.ready(done);
    
  });

  it('should bind and receive remote events', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var Creature = primus.resource('creature');

    Creature.prototype.onfetch = function () {
      done();
    };

    srv.listen(function(){
      Creature();
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');

    creature.ready(function(){
      creature.fetch('hi');
    });

  });

  it('first argument of binded event should be the Spark', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var Creature = primus.resource('creature');
    Creature.prototype.onfetch = function (spark, hi) {
      expect(spark).to.be.a(primus.$.Multiplex.Spark);
      expect(hi).to.be('hi');
      done();
    };
    srv.listen(function(){
      Creature();
    });
    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.ready(function(){
      creature.fetch('hi');
    });
  });

  it('should expose channel in resource instance', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var Creature = primus.resource('creature');
    Creature.prototype.onfetch = function (spark, hi) {
      expect(this.channel).to.be.a(primus.$.Multiplex.Channel);
      done();
    };
    srv.listen(Creature);
    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.ready(function(){
      creature.fetch('hi');
    });
  });

  it('should have a resource name', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var Creature = primus.resource('creature');

    Creature.prototype.onfetch = function (spark, hi) {
      expect(this.channel).to.be.a(primus.$.Multiplex.Channel);
      done();
    };
    srv.listen(function(){
      var creature = Creature();
      expect(creature.resourceName).to.be('creature');
      done();
    });
  });

});