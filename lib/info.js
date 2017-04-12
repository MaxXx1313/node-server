
// //
// var app2 = express();
// app2.use(bodyParser.json()); // for parsing application/json

// app2.use(function(req, res, next){
//   console.log('%s\t%s', req.method.toUpperCase(), req.url);
//   console.log('\theaders: ', req.headers);
//   console.log('\tbody    : ', req.body);
//   res.send('ok');
// });
// //create node.js http server and listen on port
// var server2 = http.createServer(app2).listen(9090, function(){
//   console.log('Server2 started at %s', server2.address().port);
// });



const http = require('http');

const server = http.createServer();

server.on('request', (request, response) => {
  console.log('[%s] %s\t%s', new Date().toISOString(), request.method.toUpperCase(), request.url);
  console.log('headers:', request.headers );
  request.headers['X-Test'] = 1;
  response.writeHead(200, request.headers);

  var dataShowed = false;
  request.on('data', function(data){
    if(!dataShowed){
      dataShowed = true;
      console.log('data:');
    }
    console.log(data+"");
    response.write(data);
  });

  request.on('aborted', function(data){
    console.log('aborted');
    response.end();
  });
  request.on('close', function(data){
    response.end();
  });
  request.on('end', function(data){
    response.end();
  });
  request.on('finish', function(data){
    response.end();
  });

});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(9090, () => {
  console.log('Server started at %s', server.address().port);
});