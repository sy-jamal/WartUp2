var express = require('express');

var app = express();
const path = require('path');
const moment = require('moment');
const bodyParser= require('body-parser');

app.use(express.static(__dirname + 'public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.locals.pretty = true;

app.get('/', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/login', (req, res)=>{
   console.log(req.body.username);
});
app.listen(8080, '192.168.122.14');
