var express = require('express');
var mongo = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/urlshortener" 
var validUrl = require('valid-url');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Url Shortener' });
});



router.get('/new/:url(*)', function(req, res) {
  mongo.connect(mongoUrl, function(err, db) {
    if (err) throw err;
    console.log("Connected!");

    var urldb = db.collection('urldb');
    var url = req.params.url;

    function urlFunction (db, callback) {
      if (validUrl.isWebUri(url)) {
        urldb.findOne({ original_url:url }, function(err, doc) {
          if (err) throw err;
          if (!doc) {
            console.log("Creating new entry!")
            urldb.find({}).sort({_id:-1}).limit(1).toArray(function(err,doc) {
              var short = doc[0]._id;  
              if (short == undefined) {
                short = 1;
              }
              short++;
              var shortUrl = "https://urlshorts.herokuapp.com/" + short;
              var dataInsert = { "_id":short, original_url:url, short_url:shortUrl }
              var data = { original_url:url, short_url:shortUrl }
              urldb.insert(dataInsert);
              res.json(data);
            });
          } else {
            console.log("Url already in database!")
            var data = { original_url:doc.original_url, short_url:doc.short_url };
            res.json(data);
          }
        });      
      } else {
        res.json({ error: "Not a valid url!" })
      }
    }

    urlFunction(db, function() {
      db.close();
    });
  })
})

router.get('/:short', function(req, res) {
  var short = req.params.short;
  if(!isNaN(short)) {
    res.json(short);
  } else if (isNaN(short)) {
    res.json("Oops! This isn't in our database!")
  }
})

module.exports = router;
