var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var routes = require("./Routes");

var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

routes(app);

app.listen(port);

console.log('Vertretungsplan Leoninum RESTful API started on port  ' + port);