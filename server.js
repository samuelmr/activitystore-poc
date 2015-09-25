var express = require('express');
var bodyParser = require('body-parser');
var as = require('activitystrea.ms');
var MongoClient = require('mongodb').MongoClient;
// var exphbs  = require('express-handlebars');
var cors = require('cors');
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

var app = express();
app.use(cors());
app.use(bodyParser.json());

// var hbs = exphbs.create({
//   defaultLayout: 'main',
// });
// app.engine('handlebars', hbs.engine);
// app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.set('port', (process.env.PORT || 5000)); // set the port on the instance

app.all('/object', function(req, res) {
  var max = req.query.max || 20;
  MongoClient.connect(mongoUri, function(err, db) {
    if (err) {
      console.warn('Failed to open db connection: ' + err);
      res.status(500);
      res.send('Failed to open db connection: ' + err);
      return;
    }
    db.collection('objects', function(err, collection) {
      if (err || !collection) {
        console.warn('Could not find collection "objects": ' + err);
        res.status(500);
        res.send('Could not find collection "objects": ' + err);
        return;
      }
      var query = req.query;
      collection.find(query).sort({published: -1}).limit(max).toArray(function(err, objects) {
        if (err) {
          console.warn('Failed to retrieve objects from db: ' + err);
          res.status(500);
          res.send('Failed to retrieve objects from db: ' + err);
          return;
        }
        res.json(objects);
      });
    });
  });
});

// should rather PUT
app.all('/object/create', function(req, res) {

  var o = as.object().publishedNow();

  // just for testing - use PUT and req.body
  var props = req.query; // start with GET params
  for (var i in req.body) {
    props[i] = req.body[i]; // override with POST params
  }

  console.log(props);

  for (var i in props) {
    if (i == 'displayName') {
      o.displayName(props[i]);
    }
    else {
      o.content(props[i]);
    }
  }

  o.get().export(function(err, obj) {
    MongoClient.connect(mongoUri, function(err, db) {
      if (err || !db) {
        console.warn('Failed to open db connection: ' + err);
        res.status(500);
        res.send('Failed to open db connection: ' + err);
        return;
      }
      db.collection('objects', function(err, collection) {
        if (err || !collection) {
          console.warn('Could not find collection "objects": ' + err);
          res.status(500);
          res.send('Could not find collection "objects": ' + err);
          return;
        }
        collection.insert(obj, {safe: true}, function(err, result) {
          if (err || !result) {
            if (err.code == 11000) {
              console.warn('Failed to save object into db: ' + err);
              res.status(500);
              res.send('Failed to save object into db: ' + err);
              return;
            }
          }
          else {
            res.json(obj);
          }
        });
      });
    });
  });
});

var server = app.listen(app.get('port'), function () {
  console.log('Server listening on port %s', app.get('port'));
});
