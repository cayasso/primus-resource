/**
 * Module dependencies.
 */

var library = require('fs').readFileSync(__dirname + '/client.js', 'utf-8')
  , client = require('load').compiler(library).resource
  , server = require('./server');

/**
 * Exporting modules.
 */

exports.server = server;
exports.client = client;
exports.library = library;