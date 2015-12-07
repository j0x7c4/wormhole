"use strict"
var punt = require('punt');
var DEFAULT_SERVER_PORT = 5000;
var DEFAULT_LOCAL_PORT = 5001;
function proxy (protocol, options, reqData, callback) {
    var receiver = punt.bind('0.0.0.0:'+DEFAULT_LOCAL_PORT);
    receiver.on("message", function(data) {
        callback(data);
    });
    var sender = punt.connect('0.0.0.0:'+DEFAULT_SERVER_PORT);
    sender.send({protocol:protocol,options:options,data:reqData});
}

module.exports.proxy = proxy;