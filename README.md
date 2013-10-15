## Warning: this module is still in early development and API will change, consider it stable when this warning does not appear anymore :-)

# Primus Resource

[![Build Status](https://travis-ci.org/cayasso/primus-resource.png?branch=master)](https://travis-ci.org/cayasso/primus-resource)
[![NPM version](https://badge.fury.io/js/primus-resource.png)](http://badge.fury.io/js/primus-resource)

Define resources with auto-binded methods that can be called remotely on top of [Primus](https://github.com/3rd-Eden/primus). This plugin depends on `primus-multiplex` and `primus-emitter`.

Method on an object prototype in the form of `on` + method, like `onupdate` will be automatically binded as an `event` on all incoming `sparks`, then the event can be called remotely by the client by just invoking the method name without the `on` like `update`.

## Instalation

```bash
$ npm install primus-resource
```

`primus-resource` depends on `primus-emitter` and `primus-multiplex` plugins so you will need to install those plugins:

```bash
$ npm install primus-multiplex primus-emitter
```

## Usage

### On the Server

Initializing server like this:

```javascript
var resource = require('primus-resource')
  , Primus = require('primus')
  , http = require('http');

var server = http.createServer();

// Primus server
var primus = new Primus(server);

// Add dependencies and use resource plugin
primus
.use('multiplex', 'primus-multiplex')
.use('emitter', 'primus-emitter')
.use('resource', resource);
```

Or with `primus.io`:

```javascript
var resource = require('primus-resource')
  , Primus = require('primus.io')
  , http = require('http');

var server = http.createServer();

// Primus server
var primus = new Primus(server);

// Use resource plugin
primus.use('resource', resource);
```

Then create a resource like this:

```javascript
// Defining a resource
var Creature = primus.resource('creature');

Creature.prototype.oncommand = function (spark, command, fn) {
  console.log(command);
  fn('Creature just got command: ' + command);
};

Creature.prototype.onwalk = function (spark, fn) {
  // make the creature walk with some code
  console.log('walk');
  fn('Creature started to walk');
};

// Initialize our resource
var creature = new Creature();

server.listen(8080);
```

### On the Client

```javascript
var primus = Primus.connect('ws://localhost:8080');

// connect to resource
var creature = primus.resource('creature');

// wait until resource is ready
creature.ready(function () {
  
  // start calling remote events
  creature.command('sleep', function (res) {
    console.log(res);
  });

  // call the server remote walk event
  creature.walk(function (res) {
    console.log(res);
  });

});
```

## Some conventions

* The remote method naming convention is `on`+name example: `Blog.prototype.oncreate`.
* Names should be lowercase so use `Blog.prototype.onupdate` instead of `Blog.prototype.onUpdate`.
* Call method on the client side without the `on` so for calling the previous method do `blog.update(data, fn)`.

## Run tests

```bash
$ make test
```

## Todo

* Allow remote methods not only on prototype. I am using the prototype just to fit my needs but will extend soon.
* Make a better API.

## Other plugins

 * [primus-rooms](https://github.com/cayasso/primus-rooms)
 * [primus-emitter](https://github.com/cayasso/primus-emitter)
 * [primus-multiplex](https://github.com/cayasso/primus-multiplex)

## License

(The MIT License)

Copyright (c) 2013 Jonathan Brumley &lt;cayasso@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
