var express = require('express');

var app = express();
const path = require('path');
const moment = require('moment');
const bodyParser= require('body-parser');
var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB, {useNewUrlParser:  true});

mongoose.Promise = global.Promise;
var db= mongoose.connection;

db.on('error', console.error.bind(conlose,'MongoDB connection error'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.locals.pretty = true;

let UserModel = require('./public/models/user')

function makeid() {
   var text = "";
   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
 
   for (var i = 0; i < 5; i++)
     text += possible.charAt(Math.floor(Math.random() * possible.length));
 
   return text;
 }


app.get('/', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.post('/login', (req, res)=>{
   console.log(req.body.username);
});
app.post('/adduser',(req, res)=>{
   let newUser = new UserModel({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      varified: false,
      key: 125325

   });

   newUser.save()
   .then(doc=>{
      console.log(doc)
   })
   .catch(err=>{
      console.error(err)
   })
});
app.listen(8080, '192.168.122.14');
