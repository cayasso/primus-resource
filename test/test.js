var Primus = require('primus');
var resource = require('../');
var http = require('http').Server;
var expect = require('expect.js');
var opts = { transformer: 'websockets', parser: 'JSON' };

// creates the client
function client(srv, primus, port, op){
  var addr = srv.address();
  var url = 'http://' + addr.address + ':' + (port || addr.port);
  return new primus.Socket(url, op);
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
      expect(e).to.be.an(Error);
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
      expect(e).to.be.an(Error);
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

  it('should have a resource name', function(){
    var srv = http();
    var primus = server(srv, opts);
    var creature = primus.resource('creature');
    expect(creature.resourceName).to.be('creature');
  });

  it('should throw error when no resource name is passed', function(){
    var srv = http();
    var primus = server(srv, opts);

    try {
      primus.resource('creature');
    } catch (e) {
      expect(e).to.be.an(Error);
      return expect(e.message).to.contain('specified with a name');
    }
  });

  it('should throw error if invalid resource type is pased', function(){
    var srv = http();
    var primus = server(srv, opts);

    try {
      primus.resource('creature', 'a');
    } catch (e) {
      expect(e).to.be.an(Error);
      expect(e.message).to.contain('Object');
      expect(e.message).to.contain('Function');
    }
  });

  it('should return an object', function (){
    var srv = http();
    var primus = server(srv, opts);
    var creature = primus.resource('creature');
    expect(creature).to.be.an(Object);
    creature = primus.resource('creature', {});
    expect(creature).to.be.an(Object);
  });

  it('should return a Function if function is passed', function (){
    var srv = http();
    var primus = server(srv, opts);
    var creature = primus.resource('creature', function(){});
    expect(creature).to.be.an(Function);
  });

  it('should fire ready event', function(done){
    var srv = http();
    var primus = server(srv, opts);
    srv.listen(function(){
      var creature = primus.resource('creature');
    });
    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.on('ready', function () {
      done();
    });
  });

  it('should bind and receive remote events', function(done){
    var srv = http();
    var primus = server(srv, opts);

    function Creature(){}

    Creature.prototype.onfetch = function (spark, data) {
      expect(data).to.be('hi');
      done();
    };

    srv.listen(function(){
      primus.resource('creature', new Creature());
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');

    creature.on('ready', function () {
      creature.fetch('hi');
    });

  });

  it('should allow getting a resource for binding events', function(done){
    var srv = http();
    var primus = server(srv, opts);

    srv.listen(function(){
      var Creature = primus.resource('creature');
      Creature.onfetch = function (spark, data) {
        expect(data).to.be('hi');
        done();
      };
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');

    creature.on('ready', function () {
      creature.fetch('hi');
    });

  });

  it('first argument of binded event should be the Spark', function(done){
    var srv = http();
    var primus = server(srv, opts);
    function Creature() {}    
    Creature.prototype.onfetch = function (spark, data) {
      expect(spark).to.be.a(require('primus-multiplex').multiplex.server.Spark);
      expect(data).to.be('hi');
      done();
    };
    srv.listen(function(){
      primus.resource('creature', new Creature());

      var cl = client(srv, primus);
      var creature = cl.resource('creature');
      creature.on('ready', function () {
        creature.fetch('hi');
      });
    });
    
  });

  it('should expose channel in resource instance', function(done){
    var srv = http();
    var primus = server(srv, opts);
    function Creature() {}
    Creature.prototype.onfetch = function (spark, hi) {
      expect(this.channel).to.be.a(require('primus-multiplex').multiplex.server.Channel);
      done();
    };
    srv.listen(function () {
      primus.resource('creature', new Creature());
    });
    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.on('ready', function () {
      creature.fetch('hi');
    });
  });

  it('should allow disabling multiplexing', function(done){
    var srv = http();
    var primus = server(srv, opts);
    function Creature() {}
    Creature.prototype.onfetch = function (spark, data) {
      expect(spark).to.be.a(primus.Spark);
      expect(this.channel).to.be.a(Primus);
      expect(data).to.be('hi');
      done();
    };
    srv.listen(function(){
      primus.resource('creature', new Creature(), false);
    });
    var cl = client(srv, primus);
    var creature = cl.resource('creature', false);
    creature.on('ready', function () {
      creature.fetch('hi');
    });
  });

  it('should not throw error if multiplex is off and primus-multiplex is missing', function (){
    var srv = http();
    var primus = Primus(srv, opts)
    .use('emitter', 'primus-emitter')
    .use('resource', resource);
    primus.resource('creature', {}, false);
  });

  it('should be able to enforce timeouts', function(done){
    var srv = http();
    var primus = server(srv, opts);

    function Creature(){}
    Creature.prototype.onfetch = function (spark, respond, fn) {
      if (respond) fn('reply'); 
    };
    srv.listen(function(){
      primus.resource('creature', new Creature());
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.on('ready', function () {
      creature.timeout = 5000;  // over test framework timeout, would fail test
      creature.fetch(true).then((data) => {
        expect(data).to.be('reply');
        creature.fetch.timeout = 500;
        creature.fetch(false).then((data) => {
          expect().fail('did not time out as expected');
        }).catch((reason) => {
          if (typeof reason === 'string') {
            expect(reason).to.be('timeout');
            done();
          } else {
            throw reason;
          }
        });
      });
    });
  });
  
  it('Promise should reject on undefined reply', function(done){
    var srv = http();
    var primus = server(srv, opts);

    function Creature(){}
    Creature.prototype.onfetch = function (spark, fn) {
      fn('\0');
    };
    srv.listen(function(){
      primus.resource('creature', new Creature());
    });

    var cl = client(srv, primus);
    var creature = cl.resource('creature');
    creature.on('ready', function () {
      creature.fetch().then((res) => {
        expect().fail('did not reject as expected');
      }).catch((reason) => {
        if (typeof reason === 'string') {
          expect(reason).to.be('error');
          done();
        } else {
          throw reason;
        }
      });
    });
  });
  
});