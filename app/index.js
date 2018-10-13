/*
 *  Primary file for the API
 *
*/

//Dependencies
var http = require('http');
var url = require('url'); 


//The server should respond to all requests with a string
var server = http.createServer(function(req,res){

    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path 
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an Object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Send the response
    res.end('Hello World'+ '\n Path: '+path+ '\n Trimmed Path: ' + trimmedPath + '\n Method: '+ method ) ;

    // Log thet request path
    console.log("Request received on "+ trimmedPath+ ' with the method: '+ method + '\n and with the query String: ',queryStringObject);
});

//Start the server and have it listen on port 3000
server.listen(3000, function(){
    console.log("The server is listening on port 3000 now");
});
