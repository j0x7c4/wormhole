"use strict"
var punt = require("punt");

var server = punt.bind("0.0.0.0:5000");
var wormhole = require("./remote");

server.on("error", function (err) {
    console.log("server error:\n" + err.stack);
    server.close();
});

server.on("message", function (msg, rinfo) {
    wormhole.requestRealServer(msg, function(err, data) {
        console.log(err,data);
    });
});

server.on("listening", function () {
    var address = server.address();
    console.log("server listening " +
        address.address + ":" + address.port);
});