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

var creature = primus.resource('creature');

creature.onmessage = function (spark, message, fn) {
  console.log('Message is', message);
  fn('Message received');
};


function Blog(title) {
  this.name = title;
}

Blog.prototype.onpost = function (spark, data, fn) {
  console.log('Message is', data);
  fn('Post created');
};

var blog = new Blog('My blog');



/*blog.on('hoola', function () {
  console.log('SALUDOS');
});*/

primus.resource('blog', blog);

//setTimeout(function () {
  blog.broadcast('hola', 'tata');
//}, 10000);

// Start server listening
server.listen(process.env.PORT || 8081, function(){
  console.log('\033[96mlistening on localhost:8081 \033[39m');
});