var express = require('express');

var app = express();
const nodemailer = require('nodemailer');
const path = require('path');
const moment = require('moment');
const bodyParser= require('body-parser');
var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB, {useNewUrlParser:  true});

mongoose.Promise = global.Promise;
var db= mongoose.connection;

db.on('error', console.error.bind(console,'MongoDB connection error'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.locals.pretty = true;

var transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: 'mycloud.verify@gmail.com',
     pass: 'cloud356'
   }
 });

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
app.get('/verification', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/public/html/verify.html'));
});
app.post('/login', (req, res)=>{
   console.log(req.body.username);
});
app.post('/adduser',(req, res)=>{
   let secKey= makeid();
   let newUser = new UserModel({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      verified: false,
      key: secKey
   });


   newUser.save()
   .then(doc=>{
      console.log(doc)
      let mailOptions = {
         from: 'mycloud.verify@gmail.com',
         to: req.body.email,
         subject: 'verification Key',
         text: secKey
       };
       transporter.sendMail(mailOptions, function(error, info){
         if (error) {
           console.log(error);
           UserModel.findOneAndRemove({
              email: req.body.email
           })
           .then(response =>{
           res.status(500).sendFile(path.join(__dirname + '/public/html/emailError.html'));
            })
            .catch(err =>{
               console.log(err)
            })
         } else {
           console.log('Email sent: ' + info.response);
           res.status(200).sendFile(path.join(__dirname + '/public/html/verify.html'));
         }
       });
   })
   .catch(err=>{
      console.error(err);
      res.status(500).sendFile(path.join(__dirname + '/public/html/errorFile.html'));
   })
   

});

app.post('/verify', (req, res)=>{
   console.log(req.body.email);
   console.log(req.body.key);
   if(req.body.key === "abracadabra")
   {
      UserModel.findOneAndUpdate(
         {
            email:req.body.email           
         },
         {
             verified : true
         },
         {
            new: true
         })
         .then(doc =>{
            res.status(200).send("ok");
         })
         .catch(err =>{
            console.error(err)
            res.status(500).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
   
         })

   }
   else{
      UserModel.findOneAndUpdate(
         {
            email:req.body.email, key:req.body.key
           
         },
         {
             verified : true
         },
         {
            new: true
         },
         function(err, doc)
         {
            if(err){
               console.error(err)
               res.status(500).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
   
            }
            res.status(200).send("ok");
         }         
      )
         // .then(doc =>{
         //    res.status(200).send("ok");
         // })
         // .catch(err =>{
         //    console.error(err)
         //    res.status(500).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
   
         // })
   }
   
       
      
});
app.listen(8080, '192.168.122.14');
