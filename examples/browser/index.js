var resource = require('../../')
  , Primus = require('primus')
  , http = require('http')
  , fs = require('fs');

var server = http.createServer(function server(req, res) {
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

// Primus server.
var primus = new Primus(server);

primus.use('multiplex', 'primus-multiplex');
primus.use('emitter', 'primus-emitter');
primus.use('resource', resource);



function Creature() {
  this.name = 'test';
}
Creature.prototype.onmessage = function (spark, message, fn) {
  console.log('Message is', message);
  fn('Message received');
};


Creature.prototype.construct = function () {
  console.log('CONSTRUCT', arguments);
};

Creature = primus.resource('creature', Creature);

new Creature('Dog');


var Blog = primus.resource('blog');

Blog.prototype.onpost = function (spark, data, fn) {
  console.log('Message is', data);
  fn('Post created');
};

Blog.prototype.construct = function (name) {
  this.name = name;
  console.log('CONSTRUCT', arguments);
};

new Blog('My blog');

// Start server listening
server.listen(process.env.PORT || 8081, function(){
  console.log('\033[96mlistening on localhost:8081 \033[39m');
});
