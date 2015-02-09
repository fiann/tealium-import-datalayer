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

var livereload = require("livereload");
server = livereload.createServer();
server.watch(__dirname);