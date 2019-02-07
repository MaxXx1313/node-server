var express = require('express');
var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var https = require('https');

module.exports = {
    start : startServer
};




var certOptions = {
  key: fs.readFileSync(path.resolve(__dirname + '/server.key')),
  cert: fs.readFileSync(path.resolve(__dirname + '/server.crt')),
  passphrase: 'test'
};

/**
 * Try to start server on passed folder and specified port.
 * Note that there is no guarantee that server will be started on that port.
 * If it's busy, it will be started on another port
 *
 * @param {string} webrootDir - webroot folder
 * @param {number} [port=8080] - initial port.
 * @return {Promise<number>} resolves with port, on which server is actually started
 */
function startServer(webrootDir, port, opts){
    opts = opts || {};

    var app = express();

    port = port || (opts.ssl ? 8443 : 8080);
    // var port = process.argv[2] || 8080;
    // var webrootDir = process.cwd();


    // add logger
    if(!opts.silent){
        app.use(function(req, res, next) {
            console.log('[%s] %s\t%s', new Date().toISOString(), req.method.toUpperCase(), req.url);
            next();
        });
    }

    app.use(express.static(webrootDir));
    app.get('/favicon.ico', (req, res) => fs.createReadStream(__dirname + '/../nodejs.ico').pipe(res));
    app.use((req, res, next) => {
        // try to list files in folder
        fs.readdir(path.join(webrootDir, req.url), (err, files) => {
            if (!err)
                res.send(files);
            else
                next();
        });

    });
    //app.use(express.errorHandler());


    return start_server_recursive(port, opts.ssl).then(server => {
        var port = server.address().port;
        // opts.silent || console.log('Server started at %s:%s', server.address().address, server.address().port);
        if(!opts.silent) {
          console.log('Server started:');
          getIps().forEach(function(ip){
            const protocol = opts.ssl ? 'https' : 'http';
            console.log('\t%s://%s:%s', protocol, ip, port);
          });
        }
        return server;
    });

    /**
     * @return {Array<string>} array of ip addresses
     */
    function getIps() {
      var interfaces = os.networkInterfaces();
      return Object.keys(interfaces).map(function(name){
        return interfaces[name].filter(function(configDetails){
          return !configDetails.family || configDetails.family == 'IPv4';
        });
      }).reduce(function(res, item){
        res.push.apply(res, item);
        return res;
      }, []).map(function(configDetails){
        return configDetails.address;
      });
    }

    /**
     * Start server. Look up for free port starting from {@link port}
     * @param {number} port
     * @resturn {Promise<Nodejs.server>}
     */
    function start_server_recursive(port, isSsl) {
        return start_server(port, isSsl)
            .catch(e => {
                //console.log(e);
                return start_server_recursive(port + 1, isSsl);
            });
    }

    /**
     * Make attempt to start server on specified port
     * @param {number} port
     * @param {boolean} isSsl
     * @resturn {Promise<Nodejs.server>}
     */
    function start_server(port, isSsl) {
        return new Promise((pass, fail) => {
            var server;
            if(isSsl){
              server = https.createServer(certOptions, app);
            }else{
              // server = app;
              server = http.createServer(app);
            }
            server.on('error', err => {
                if (err.errno === 'EADDRINUSE') {
                    console.log('Port %s is busy', port);
                    fail(err);
                } else {
                    throw err;
                }
            });
            server.listen(port, function() {
                pass(server);
            });
        });
    }

}