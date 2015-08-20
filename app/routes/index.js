var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Riot Challenge' });
});

router.get('/data', function(req, res, next) {
  var matchData = db.get('match_data');

  matchData.find({}, function(err, results){
    res.json({ matchData: results });
  });
});

module.exports = router;
