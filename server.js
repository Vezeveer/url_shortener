'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const validUrl = require('valid-url')
const shortid = require('shortid')
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'))
db.once('open', function(){
  console.log('connected to database...')
})
console.log(db.readyState)
app.use(cors());

const urlSchema = new mongoose.Schema({
    url: {
    type: String,
    required: [true, 'URL input required...']
  },
  id: {
    type: String,
    default: shortid.generate()
  }
})
const urlModel = mongoose.model('urlModel', urlSchema);

/** this project needs to parse POST bodies **/
const bodyParser = require('body-parser')
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended:true}));


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// create new shorturl
app.post('/api/shorturl/new', function(req, res, next){
  let urlInstance = new urlModel({url: validUrl.isUri(req.body.url)})
  urlInstance.save(function(err){
    if(err){
      return console.log(err)
    }
    urlModel.find({url:req.body.url},function(err, dataFound){
      res.send({original_url: req.body.url, short_url: dataFound[0].id})
    })
  })
})

// redirect from shorturl
app.get('/api/shorturl/:shorturl', function(req, res, next){
  console.log(req.params.shorturl)
  
  urlModel.find({id:req.params.shorturl}, function(err, dataFound){
    if(err){
      console.log(err)
      res.status(500).send()
    }else{
      console.log(dataFound)
      res.redirect(dataFound[0].url)
    }
  })
})


app.listen(port, function () {
  console.log('Node.js listening on port..' + port);
});