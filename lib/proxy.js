// const cors = require('cors');
const http = require('http');
const url = require('url');
var PORT = process.env.PORT || 8888;
var PROXY_HEADER = 'X-Request-To'.toLowerCase();

const server = http.createServer();


server.on('request', (req, res) => {
  console.log('[%s] %s\t%s', new Date().toISOString(), req.method.toUpperCase(), req.url);

  let urlInfo = url.parse(req.url);
  // console.log(urlInfo);

  if(req.method.toUpperCase() === 'OPTIONS'){
    return cors(req, res);
  }

  if(urlInfo.pathname === '/proxy'){
    return proxy(req, res);
  }

  badRequest(req, res);
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(PORT, () => {
  console.log('Server started at %s', server.address().port);
});


// preflight
function cors(req, res){
  let headers = {
    // 'Vary': 'Access-Control-Request-Headers',

    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '',

    // 'Access-Control-Expose-Headers':
  };

  res.writeHead(200, headers);
  res.end();
}


/**
 *
 */
function badRequest(req, res){
  res.writeHead(400);
  res.write('400 Bad Request');
  res.end();
}


/**
 *
 */
function proxy(req, res){
  var method = req.method.toLowerCase();
  var target = req.headers[PROXY_HEADER];
  console.log('\tto %s', target);

  if(target){
    delete req.headers[PROXY_HEADER];

    // console.log(req.body);
    let urlInfo = url.parse(target);
    urlInfo.method = method;
    urlInfo.headers = req.headers;
    var target = http.request(urlInfo, (response) => {

      res.writeHead(response.statusCode, response.headers);
      // console.log(`STATUS: ${res.statusCode}`);
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

      response.pipe(res);
    });
    req.pipe(target);
  }
  else{
    badRequest(req,res);
  }
}


// ///





//  console.log('headers:',  request.headers );
//   response.writeHead(200, request.headers);

//   var dataShowed = false;
//   request.on('data', function(data){
//     if(!dataShowed){
//       dataShowed = true;
//       console.log('data:');
//     }
//     console.log(data+"");
//     response.write(data);
//   });

//   request.on('aborted', function(data){
//     console.log('aborted');
//     response.end();
//   });
//   request.on('close', function(data){
//     response.end();
//   });
//   request.on('end', function(data){
//     response.end();
//   });
//   request.on('finish', function(data){
//     response.end();
//   });