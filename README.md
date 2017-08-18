# Primus Resource

[![Build Status](https://travis-ci.org/cayasso/primus-resource.png?branch=master)](https://travis-ci.org/cayasso/primus-resource)
[![NPM version](https://badge.fury.io/js/primus-resource.png)](http://badge.fury.io/js/primus-resource)

Define resources with auto-binded methods that can be called remotely on top of [Primus](https://github.com/3rd-Eden/primus). This plugin depends on `primus-multiplex` and `primus-emitter` however if you disable multiplexing then you can omit installing `primus-multiplex`.

Method on an object prototype in the form of `on` + method, like `onupdate` will be automatically binded as an `event` on all incoming `sparks`, then the event can be called remotely by the client by just invoking the method name without the `on` like `update`.

## Compatibility
This plugin works with any Primus version, just make sure the `primus-emitter` or `primus-multiplex` are compatible with the primus version you are using.

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
function Creature() {}

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
primus.resource('creature', new Creature());

server.listen(8080);
```

You can also create a resource like this:

```javascript

// Create our resource
var Creature = primus.resource('creature');

Creature.oncommand = function (spark, command, fn) {
  console.log(command);
  fn('Creature just got command: ' + command);
};

Creature.onwalk = function (spark, fn) {
  // make the creature walk with some code
  console.log('walk');
  fn('Creature started to walk');
};

server.listen(8080);
```

Or like this by passing the object directly to the resource method:

```javascript

// Create our resource
var Creature = {
  
  oncommand: function (spark, command, fn) {
    console.log(command);
    fn('Creature just got command: ' + command);
  },

  onwalk: function (spark, fn) {
    // make the creature walk with some code
    console.log('walk');
    fn('Creature started to walk');
  }

};

// Initialize resource
primus.resource('creature', Creature);

server.listen(8080);
```

### On the Client

```javascript
var primus = Primus.connect('ws://localhost:8080');

// connect to resource
var creature = primus.resource('creature');

// wait until resource is ready
creature.on('ready', function () {
  
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

#### Promises

Nowadays (August 2017) Promises are very well supported. If no callback is provided when invoking a resource method, a promise will be returned. The example above can be rewritten as:
  
```javascript
var primus = Primus.connect('ws://localhost:8080');

// connect to resource
var creature = primus.resource('creature');

// wait until resource is ready
creature.on('ready', function () {
  
  // start calling remote events
  creature.command('sleep').then(function (res) {
    console.log(res);
  });

  // call the server remote walk event
  creature.walk().then(function (res) {
    console.log(res);
  });

});
```

#### Timeouts

Next to being the current standard for asynchronous operations, Promises are useful in combination with timeout handling: it is possible to define a `timeout` either globally on the resource or local to each resource method (the latter having precedence). In case of timeout (no return value / acknowledgement from server) the promise will reject with the reason `'timeout'`.
Timeout are optional, by default the Promise will never reject.
Timeout handling only works with Promises.


```javascript
var primus = Primus.connect('ws://localhost:8080');

// connect to resource
var creature = primus.resource('creature');
creature.timeout = 5000;  // global default timeout, will apply to sleep

// wait until resource is ready
creature.on('ready', function () {
  creature.walk.timeout = 1;  // specific timeout for the 'walk' method
  
  // start calling remote events
  creature.command('sleep').then(function (res) {
    console.log(res);
  });

  // call the server remote walk event
  creature.walk().then((res) => {
    console.log(res);
  }).catch(() => {
    console.log('did not start walking in time!');
  });

});
```


## Disabling multiplex

You can always disable multiplexing by passing a `false` as the last parameter on the server and on the client, this is required on both sides. If you disable multiplexing you can omit installing `primus-multiplex`.

On the server:

```javascript
primus.resource('creature', Creature, false);
```

On the client:

```javascript
primus.resource('creature', false);
```

## Some conventions

* The remote method naming convention is `on`+name example: `blog.oncreate`.
* Names should be lowercase so use `blog.onupdate` instead of `blog.onUpdate`.
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
