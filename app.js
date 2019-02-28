var express = require('express');

var app = express();
app.get('/', function(req, res){
   res.send("Hello World!");
});
app.post('/login', (req, res)=>{
   console.log(req.body.username);
});
app.listen(8080, '192.168.122.14');
