"use strict"
var http           = require("http"),
    https          = require("https"),
    net            = require("net"),
    fs             = require("fs"),
    url            = require("url"),
    pathUtil       = require("path"),
    zlib           = require('zlib'),
    async          = require('async'),
    color          = require("colorful"),
    Buffer         = require('buffer').Buffer,
    util           = require("./lib/util"),
    getPort        = require("./lib/getPort"),
    Stream         = require("stream"),
    logUtil        = require("./lib/log"),
    punt = require("punt");

function requestRealServer(data, callback) {
    console.log(data);
    var protocol = data.protocol,
        options = data.options,
        reqData = data.data;
    options.rejectUnauthorized = false;
    try{
        delete options.headers['accept-encoding']; //avoid gzipped response
    }catch(e){}

    //update request data
    options.headers = util.lower_keys(options.headers);
    options.headers["content-length"] = reqData.length; //rewrite content length info
    var url = protocol+"://"+options.hostname+options.path;
    //send request
    var proxyReq = ( /https/.test(protocol) ? https : http).request(options, function(res) {
        var proxyRes = {};
        //deal response header
        proxyRes.statusCode = res.statusCode;
        var resHeader = res.headers;
        resHeader = util.lower_keys(resHeader);

        // remove gzip related header, and ungzip the content
        // note there are other compression types like deflate
        var ifServerGzipped =  /gzip/i.test(resHeader['content-encoding']);
        if(ifServerGzipped){
            delete resHeader['content-encoding'];
        }
        delete resHeader['content-length'];

        proxyRes.headers = resHeader;

        //deal response data
        var length,
            resData = [];

        res.on("data",function(chunk){
            resData.push(chunk);
        });

        res.on("end",function(){
            var serverResData;

            async.series([
                //ungzip server res
                function(callback){
                    serverResData = Buffer.concat(resData);
                    if(ifServerGzipped ){
                        zlib.gunzip(serverResData,function(err,buff){
                            serverResData = buff;
                            callback();
                        });
                    }else{
                        callback();
                    }
                    //get  response
                },function(callback){
                    proxyRes.resData = serverResData;
                    callback(null,proxyRes);
                }
            ],function(err,result){
                callback && callback(err,result);
            });
        });
        res.on('error',function(error){
            logUtil.printLog('error' + error, logUtil.T_ERR);
            callback(error);
        });

    });

    proxyReq.on("error",function(e){
        logUtil.printLog("err with request :" + e + "  " + url, logUtil.T_ERR);
        callback(e);
    });
}

module.exports.requestRealServer = requestRealServer;