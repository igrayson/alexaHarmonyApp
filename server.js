//var hotswap = require('hotswap');
var fs = require('fs');
var path = path = require('path');
var express = require('express');
var alexa = require('alexa-app');
var bodyParser = require('body-parser');
var https = require('https');
var LEX = require('letsencrypt-express');
var winston = require('winston'),
    expressWinston = require('express-winston');

var privateKey = fs.readFileSync('./cert/private-key.pem', 'utf8');
var certificate = fs.readFileSync('./cert/certificate.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate,
                   //requestCert: true, rejectUnauthorized: true
                   requestCert: true
                   };
// this code is largely taken from
// https://github.com/matt-kruse/alexa-app-server

// Start up the server
var expressApp = express();
var httpsServer = https.createServer(credentials, expressApp);

expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());

expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
expressApp.use(expressWinston.logger({
      transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        })
      ],
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
      colorStatus: true, // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
      ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
    }));

expressApp.set('view engine', 'ejs');

// Register Alexa apps
//register_apps('./','/');
var app = require('./remote.js');
var endpoint = '/remote';
expressApp.post(endpoint,function(req,res) {
    app.request(req.body).then(function(response) {
        res.json(response);
    },function(response) {
        res.status(500).send("Server Error");
    });
});
// Configure GET requests to run a debugger UI
expressApp.get(endpoint,function(req,res) {
    res.render('test',{"app":app,"schema":app.schema(),"utterances":app.utterances(),"intents":app.intents});
});

// LEX.create({
//   debug: true,
//   configDir: './letsencrypt.config'                 // ~/letsencrypt, /etc/letsencrypt, whatever you want

// , onRequest: expressApp                                    // your express app (or plain node http app)

// , letsencrypt: null                                 // you can provide you own instance of letsencrypt
//                                                     // if you need to configure it (with an agreeToTerms
//                                                     // callback, for example)

// , approveRegistration: function (hostname, cb) {    // PRODUCTION MODE needs this function, but only if you want
//                                                     // automatic registration (usually not necessary)
//                                                     // renewals for registered domains will still be automatic
//     if (hostname !== 'goetter.duckdns.org') {
//       console.log('Bad domain', hostname);
//       cb(null, null);
//     }
//     cb(null, {
//       domains: [hostname]
//     , email: 'ian133@gmail.com'
//     , agreeTos: true              // you
//     });
//   }
// }).listen([80], [443,9191], function () {
//   console.log("ENCRYPT __ALL__ THE DOMAINS!");
// });



// Serve static files
//expressApp.use(express.static('public_html'));

//expressApp.listen(PORT);
httpsServer.listen(443);
//console.log("Listening.);
