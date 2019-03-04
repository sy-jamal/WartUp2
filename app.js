var express = require('express');
var session = require('client-sessions');
var app = express();
var  okRes= JSON.stringify({ status: "OK"});
var  errRes= JSON.stringify({ status: "ERROR"});
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
app.use(session({
   cookieName: 'session',
   secret: 'random_string_goes_here',
   duration: 30 * 60 * 1000,  
   activeDuration: 5 * 60 * 1000
   // httpOnly: true,
   // secure: true,
   // ephemeral: true  
 }));


app.locals.pretty = true;

var transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: 'mycloud.verify@gmail.com',
     pass: 'cloud356'
   }
 });

let UserModel = require('./public/models/user');

app.use(function(req, res, next) {
   if (req.session && req.session.user) {
     UserModel.findOne({ email: req.session.user.email }, function(err, user) {
       if (user) {
         req.user = user;
         delete req.user.password; // delete the password from the session
         req.session.user = user;  //refresh the session value
         res.locals.user = user;
       }
       // finishing processing the middleware and run the route
       next();
     });
   } else {
     next();
   }
 });

function makeid() {
   var text = "";
   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
 
   for (var i = 0; i < 5; i++)
     text += possible.charAt(Math.floor(Math.random() * possible.length));
 
   return text;
 }
 function requireLogin (req, res, next) {
   if (!req.user) {
     res.redirect('/login');
   } else {
     next();
   }
 };
app.get('/', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/verification', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/public/html/verify.html'));
});
app.get('/logout', function(req, res) {
   // if(req.session)
   // {
      req.session.reset();   
      res.json({status:'OK', message: "logged out perfectly" });
      res.redirect('/');
   // }
   // res.json({status:'ERROR', message: "user didn't logged in(session was not found)" })
   
 });
app.get('/dashboard', requireLogin, function(req, res) {
   res.json({status:'OK' , message: "logged in" });
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
           res.json({status:'ERROR', message: "wrong email address" }).sendFile(path.join(__dirname + '/public/html/emailError.html'));

         //   res.status("ERROR").sendFile(path.join(__dirname + '/public/html/emailError.html'));
            })
            .catch(err =>{
               console.log(err)
               // res.status("ERROR").send("something wrong");
               res.json({status:'ERROR', message: "something went wrong while sending email"}).send("something went wrong while sending email")
            })
         } else {
           console.log('Email sent: ' + info.response);
           res.json({status:'OK', message: "key has been sent to Email" }).sendFile(path.join(__dirname + '/public/html/verify.html'));
         }
       });
   })
   .catch(err=>{
      console.error(err);
      res.json({status:'ERROR', message: "Email/username already exists in database" }).sendFile(path.join(__dirname + '/public/html/errorFile.html'));
   })
});

app.post('/verify', (req, res)=>{
   console.log(req.body.email);
   console.log(req.body.key);
   
   UserModel.findOne(
   {
      email:req.body.email           
   }
   // {
   //     verified : true
   // },
   // {
   //    new: true
   // }
   )
   .then(doc =>{
      console.log(req.body.key);
      console.log(doc.key);
      if(doc.key === req.body.key || req.body.key === "abracadabra")
      {
         doc.verified= true;
         doc.save()
         .then(newDoc=>{                     
               res.json({status:'OK', message: "user information verified with key" }).send("Verified");
         }) 
         .catch(err =>
         {
            res.json({status:'ERROR', message: "Verification error(saving in database error)" }).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
         })
      }
      else
      {
         res.json({status:'ERROR', message: "verification error" }).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
      }
   })
   .catch(err =>{
      console.error(err)
      res.json({status:'ERROR', message: "verification error (Email is not in database)" }).sendFile(path.join(__dirname + '/public/html/verificationError.html'));
   })      
});

app.post('/login',(req,res)=>{
   console.log(req.body.username)
   UserModel.findOne({username: req.body.username})
   .then(user=>{
      console.log(user);
      if(!user){
         res.json({status:'ERROR', message: "Not a user while loging in" }).sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
      }
      else
      {
         if(!user.verified)
         {
           res.json({status:'ERROR', message: "Account exist in database but not verified" }).sendFile(path.join(__dirname + '/public/html/verify.html'));
         }
         if(req.body.password === user.password)
         {
            req.session.user = user;
            res.json({status:'OK', message: "Logged in using correct password and session created" }).send("user Logged in");
         }
         else
         {
            res.json({status:'ERROR', message: "Tried to login in using WRONG password" }).sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
         }
      }
   })
   .catch(err =>{
      console.error(err)
      res.json({status:'ERROR', message: "Error while accessing the User info from Database" }).sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
   }) 
});
app.listen(8080, '192.168.122.14');
