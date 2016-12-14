var express = require('express');
var fs = require('fs');
var path = require('path');

module.exports = {
    start : startServer
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

    port = port || 8080;
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


    return start_server_recursive(port).then(server => {
        opts.silent || console.log('Server started at %s:%s', server.address().address, server.address().port);
        return server;
    });


    /**
     * Start server. Look up for free port starting from {@link port}
     * @param {number} port
     * @resturn {Promise<Nodejs.server>}
     */
    function start_server_recursive(port) {
        return start_server(port)
            .catch(e => {
                //console.log(e);
                return start_server_recursive(port + 1);
            });
    }

    /**
     * Make attempt to start server on specified port
     * @param {number} port\
     * @resturn {Promise<Nodejs.server>}
     */
    function start_server(port) {
        return new Promise((pass, fail) => {
            var server = app.listen(port, function() {
                pass(server);
            });
            server.on('error', err => {
                if (err.errno === 'EADDRINUSE') {
                    console.log('Port %s is busy', port);
                    fail(err);
                } else {
                    throw err;
                }
            });
        });
    }

}