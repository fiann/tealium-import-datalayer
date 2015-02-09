/**
 * Launch a simple web server to show the test pages
 */

/*jshint node:true*/

"use strict";

var finalhandler = require("finalhandler");
var http = require("http");
var serveStatic = require("serve-static");
 
// Serve up public/ftp folder 
var serve = serveStatic(__dirname);
 
// Create server 
var server = http.createServer(function(req, res){
  var done = finalhandler(req, res);
  serve(req, res, done);
});
 
// Listen 
server.listen(3000);
console.log("Server started on http://localhost:3000/");
console.log("Try opening http://localhost:3000/test/import-datalayer-test.html");

var livereload = require("livereload");
server = livereload.createServer();
server.watch(__dirname);
console.log("Livereload server running");