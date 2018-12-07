/*
 *  Primary file for the API
 *
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers')
var helpers = require('./lib/helpers');

// Core server logic to be shared between the http and https servers
var unifiedServerCoreLogic = function (req, res) {

    var payloadBuffer = '';
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path 
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an Object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the Headers as an object
    var headers = req.headers;

    // Get the Payload, if any
    var decoder = new StringDecoder('utf-8');

    req.on('data', function (data) {
        payloadBuffer += decoder.write(data);
    });

    req.on('end', function () {
        payloadBuffer += decoder.end();

        // Choose the handler this request should go to. If one is not found, use the not found handler
        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(payloadBuffer)
        };

        // sendResponse = function (statusCode, payload) {
        //     // Use the status code called back by the handler or default to 200
        //     statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

        //     // Use the paylaod called back by the handler or default to an empty object
        //     payload = typeof (payload) == 'object' ? payload : {};

        //     // Convert payload to a string
        //     var payloadString = JSON.stringify(payload);

        //     // Return the response
        //     res.writeHead(statusCode);

        //     // Send the response    
        //     res.end(payloadString);

        //     // Log the response
        //     console.log("Returning the response: ", statusCode, payloadString)
        // } 


        // // Route the request to the handler specified in the router
        // chosenHandler(data, sendResponse);

        // Simplified way for chosen handler
        chosenHandler(data, function (statusCode, payload) {
            // Use the status code called back by the handler or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the paylaod called back by the handler or default to an empty object
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);

            // Send the response    
            res.end(payloadString);

            // Log the response
            console.log("Returning the response: ", statusCode, payloadString)
        });

    });

    // Log the payload
    //console.log('Request was received with this payload: ', payloadBuffer);

    //res.end('Hello World'+ '\n Path: '+path+ '\n Trimmed Path: ' + trimmedPath + '\n Method: '+ method ) ;

    // Log the request path
    //console.log("Request received on " + trimmedPath + ' with the method: ' + method + '\n and with the query String: ', queryStringObject);

    // Log the Header
    //console.log('Request received with these Headers: ', headers);

}

// Instantiating the https server
var httpServer = http.createServer(function (req, res) {
    unifiedServerCoreLogic(req, res);
});

// Instantiating the https server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.perm')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServerCoreLogic(req, res);
});

//Start the http server and have it listen on port 3000
httpServer.listen(config.httpPort, function () {
    console.log("The server is listening on port " + config.httpPort);
});

//Start the https server and have it listen on port 3000
httpsServer.listen(config.httpsPort, function () {
    console.log("The server is listening on port " + config.httpsPort);
});

// Define a request router

var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
}