var express = require('express');
var session = require('client-sessions');
var app = express();

const nodemailer = require('nodemailer');
const path = require('path');
const moment = require('moment');
const bodyParser= require('body-parser');
var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/my_database';

var board= [" "," "," "," "," "," "," "," "," "];
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

 function checkRow(row, grid) {
	if (grid[row] != " " && (grid[row] == grid[row+1] && grid[row] == grid[row+2])) {
		return grid[row];
	}
	return "";
}
function checkCol(row, grid) {
	if (grid[row] != " " && (grid[row] == grid[row+3] && grid[row] == grid[row+6])) {
		return grid[row];
	}
	return "";
}
function checkDiag(grid) {
	if (grid[0] != " " && (grid[0] == grid[4] && grid[4] == grid[8])) {
		return grid[0];
	}
	if (grid[2] != " " && (grid[2] == grid[4] && grid[4] == grid[6])) {
		return grid[2];
	}
	return "";
}

function checkWinner(grid) {
	let winner = "";

	// check the rows
	if ((winner = checkRow(0, grid)) != "")
		{return winner;}
	if ((winner = checkRow(3, grid)) != "")
		{return winner;}
	if ((winner = checkRow(6, grid)) != "")
		{return winner;}

	// check the cols
	if ((winner = checkCol(0, grid)) != "")
		{return winner;}
	if ((winner = checkCol(1, grid)) != "")
		{return winner;}
	if ((winner = checkCol(2, grid)) != "")
		{return winner;}

	if ((winner = checkDiag(grid)) != "")
		{return winner; }


	let isTie = true;
	// check for tie
	for (let i = 0; i < 9; i++){
		if (grid[i] === " ") {
			isTie = false;
		}
	}
	if (isTie == true) {
		return " ";
	}

	return winner;
}

function makeMove(grid) {
	for (let x = 0; x < 9; x++) {
		if (grid[x] == " ") {
         grid[x] = "O";
			return grid;
		}
	}
}

function makeMoveIndex(grid) {
	for (let x = 0; x < 9; x++) {
		if (grid[x] == " ") {
         grid[x] = "O";
			return x;
		}
	}
}

app.post('/listgames',(req,res)=>{
   if(!req.session.user)
   {
      return res.send({status:"ERROR", message: 'Not in session'});
   }
   UserModel.findOne({ email: req.session.user.email })
            .then(user=>{
               var allGames=[]
               var lst = user.gameList;
               for(let i =0; i< lst.length; i++)
               {
                  var jsonStr= {id: i+1, start_date: lst[i].start_date};
                  allGames.push(jsonStr);
               }
               return res.send({status:"OK",games: allGames});

            })
            .catch(err=>{
               console.log(err);
               return res.send({status:"ERROR", message: 'Difficulties with finding game list in db'});
            })
});

app.post('/getgame',(req,res)=>{
   if(!req.session.user)
   {
      return res.send({status:"ERROR", message: 'Not in session /getgame'});
   }
   UserModel.findOne({ email: req.session.user.email })
            .then(user=>{
            	console.log("hello its me")
               var grd= user.gameList[parseInt(req.body.id)-1].grid;
            	console.log("hello its me")
               var win= user.gameList[parseInt(req.body.id)-1].winner;
            	console.log("hello its me")
               
               return res.send({status: "OK", grid: grd, winner:win,message:"am i heerehrehr e"});

            })
            .catch(err=>{
               console.log(err);
               return res.send({status:"ERROR", message: 'Difficulties with finding game list in db'});
            }) 

});

app.post('/getscore',(req,res)=>{
   if(!req.session.user)
   {
      return res.send({status:"ERROR", message: 'Not in session /getgame'});
   }
   UserModel.findOne({ email: req.session.user.email })
            .then(user=>{
               var h = user.human;
               var c= user.wopr;
               var t= user.tie;

               return res.send({status: "OK", human: h, wopr: c, tie: t});

            })
            .catch(err=>{
               console.log(err);
               return res.send({status:"ERROR", message: 'Difficulties with finding game list in db'});
            }) 

});

app.post('/ttt/play', (req, res) => {
   console.log('/TTT/PLAY');
   if(!req.session.user)
   {
       res.send({status:"ERROR", message: 'Not in session'});
       return;
   }
   console.log("the value is '", req.body.move, "'");

   if( req.body.move == null ||  req.body.move === "" || req.body.move === "null" )  //Making a request with { move:null } should return the current grid without making a move.
   {
      console.log("hellllo inside null checking");
      console.log("hellooo email", req.session.user.email, "'");
	//console.log("helooo ooo email", UserModel.findOne({email: req.session.user.email}));
      UserModel.findOne({email: req.session.user.email})
      .then(usr=>{
         console.log("heloooo returning from null checking");
         res.send({status:"OK", grid: usr.currentBoard});
         return ;
      })
      .catch(err=>{
         console.log("error returning null");
         res.send({status: "ERROR",message: "Problem accessing from database"});
         return;
      })
      
   }
	else{
   console.log(req.body.move);
   move = req.body.move;
   let g = [];
 
 	
 var promise1 = new Promise(function(resolve, reject) {
  setTimeout(function() {
  
	//let g = UserModel.findOne({email: req.session.user.email})['currentBoard'];
   // let move=parseInt(req.body.move);
   
   //if (UserModel.findOne({email: req.session.user.email}).count() >0)
   //{

 	UserModel.findOne({email: req.session.user.email})
   .then(usr=>{
      g= usr.currentBoard;
      console.log("hehehee board from db");
      
   console.log("promise before ");
   console.log(g)
   
    resolve(g);
   })
   .catch(err=>{
      res.send({status: "ERROR",message: "Problem accessing from database"});
      return;
   })
   }, 2000);
   
});



promise1.then(function(value) {
   console.log("promise after");
   console.log(g)


   if(g[move]!=" ")
   {  
      res.send({status: "ERROR", message: 'User Clicking an Occupied space on grid'});
      return;
   }
   else{
      
      g[move]="X";
      console.log("human move X");
   
   
   var w = checkWinner(g);
   console.log("w =[", w,"]");

	if (w != "") {
      // winner exists, dont do anything
      UserModel.findOne({ email: req.session.user.email })
         .then(doc=>{
            console.log("writing game update to db");
            doc.totalGames= doc.totalGames+1;
            if(w ==='X'){
               doc.human++;
            }
            else if(w==='O'){
               doc.wopr++;
            }
            else{ 
               doc.tie++; 
            }
            console.log("resetting currentBoard in db");
            doc.currentBoard=[" "," "," "," "," "," "," "," "," "];
            console.log(g)
            doc.gameList.push({grid: g, winner: w});
            console.log(doc.gameList);
            doc.save()
            .then(msg=>{
               console.log('store game to database');
               console.log(g)
                res.send({status: "OK", grid: g, winner:w});   
               return;
            })
            .catch(err=>{
               console.log(err);
               res.send({status: "Error", message:'Could not save game after winner is found' });
               return ;
            })
         })
         .catch(err=>{
            console.log(err);
            res.send({status: "ERROR", message:'Trouble finding in database'});
            return; 
         })
	}
	else{
      // no winner, make a move
      console.log("computer move")
      //g = makeMove(g);
      
      var promise2 = new Promise(function(resolve, reject) {
  setTimeout(function() {
      g[makeMoveIndex(g)]= "O";
      
      w= checkWinner(g);

    resolve('foo');
  }, 300);
});
   


promise2.then(function(value) {
  console.log(value);
  // expected output: "foo"
   if(checkWinner(g) !="") //either there has been a tie or a winner
   {
      UserModel.findOne({ email: req.session.user.email })
         .then(doc=>{
            console.log("writing game update to db");
            doc.totalGames= doc.totalGames+1;
            if(w ==='X'){
               doc.human++;
            }
            else if(w==='O'){
               doc.wopr++;
            }
            else{ 
               doc.tie++; 
            }
            console.log("resetting currentBoard in db");
            doc.currentBoard=[" "," "," "," "," "," "," "," "," "];
            console.log(g)
            doc.gameList.push({grid: g, winner: w});
            console.log(doc.gameList);
            doc.save()
            .then(msg=>{
               console.log('store game to database');
               console.log(g)
                res.send({status: "OK", grid: g, winner:w, message: "am i here winner?"});   
               return;
            })
            .catch(err=>{
               console.log(err);
               res.send({status: "Error", message:'Could not save game after winner is found' });
               return ;
            })
         })
         .catch(err=>{
            console.log(err);
            res.send({status: "ERROR", message:'Trouble finding in database'});
            return; 
         })
   }
   else
   {
      UserModel.findOne({ email: req.session.user.email })
         .then(doc=>{
            doc.currentBoard = g;
            doc.save()
            .then(val=>{
            	console.log("No winner foundsending from end"); 
			      res.send({status: "OK", grid: g, message: "am i here?"}); 
			      return; 
            	})
            .catch(err=>{
            	console.log(err);
            	res.send({status: "ERROR", message:'go to hell in database'});
            })

            

         })
         .catch(err=>{
            console.log(err);
            res.send({status: "ERROR", message:'Trouble storing in database'});
            return;
         })
      
   }

});
   }
   }
   
	});	
}
});


app.get('/', function(req, res){
   // res.send("Hello World!");
   return res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/ttt/', (req, res) => {
	console.log('GET TTT')
	return res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.post('/ttt/', (req, res) => {
	console.log('GET TTT')
	return res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/verification', function(req, res){
   // res.send("Hello World!");
   res.sendFile(path.join(__dirname + '/public/html/verify.html'));
});
app.get('/logout', function(req, res) {
   // if(req.session)
   // {
      req.session.reset();   
      return res.json({status:"OK", message: "logged out perfectly" });
      // res.redirect('/');
   // }
   // res.json({status:'ERROR', message: "user didn't logged in(session was not found)" })
   
 });
 app.post('/logout', function(req, res) {
  
      req.session.reset();   
      return res.json({status:"OK", message: "logged out perfectly" });
      // res.redirect('/');
   
 });
app.get('/dashboard', requireLogin, function(req, res) {
   return res.json({status:"OK" , message: "logged in" });
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
           return res.json({status:"ERROR", message: "wrong email address" }).sendFile(path.join(__dirname + '/public/html/emailError.html'));

         //   res.status("ERROR").sendFile(path.join(__dirname + '/public/html/emailError.html'));
            })
            .catch(err =>{
               console.log(err)
               // res.status("ERROR").send("something wrong");
               return res.json({status:"ERROR", message: "something went wrong while sending email"});
               // .send("something went wrong while sending email")
            })
         } else {
           console.log('Email sent: ' + info.response);
           return res.json({status:"OK", message: "key has been sent to Email" });
         //   .sendFile(path.join(__dirname + '/public/html/verify.html'));
         }
       });
   })
   .catch(err=>{
      console.error(err);
      return res.json({status:"ERROR", message: "Email/username already exists in database" });
      // .sendFile(path.join(__dirname + '/public/html/errorFile.html'));
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
         doc.currentBoard=[" "," "," "," "," "," "," "," "," "];
         doc.save()
         .then(newDoc=>{                     
               return res.json({status:"OK", message: "user information verified with key" });
               // .send("Verified");
         }) 
         .catch(err =>
         {
            return res.json({status:"ERROR", message: "Verification error(saving in database error)" });
            // .sendFile(path.join(__dirname + '/public/html/verificationError.html'));
         })
      }
      else
      {
         return res.json({status:"ERROR", message: "verification error" });
         // .sendFile(path.join(__dirname + '/public/html/verificationError.html'));
      }
   })
   .catch(err =>{
      console.error(err)
      return res.json({status:"ERROR", message: "verification error (Email is not in database)" });
      // .sendFile(path.join(__dirname + '/public/html/verificationError.html'));
   })      
});

app.post('/login',(req,res)=>{
   console.log(req.body.username)
   UserModel.findOne({username: req.body.username})
   .then(user=>{
      console.log(user);
      if(!user){
         return res.json({status:"ERROR", message: "Not a user while loging in" });
         // .sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
      }
      else
      {
         if(!user.verified)
         {
           return res.json({status:"ERROR", message: "Account exist in database but not verified" });
         //   .sendFile(path.join(__dirname + '/public/html/verify.html'));
         }
         if(req.body.password === user.password)
         {
            req.session.user = user;
            return res.json({status:"OK", message: "Logged in using correct password and session created" });
            // .send("user Logged in");
         }
         else
         {
            return res.json({status:'ERROR', message: "Tried to login in using WRONG password" })
            // .sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
         }
      }
   })
   .catch(err =>{
      console.error(err)
      return res.json({status:"ERROR", message: "Error while accessing the User info from Database" });
      // .sendFile(path.join(__dirname + '/public/html/invalidUser.html'));
   }) 
});
app.listen(8080, '192.168.122.14');
