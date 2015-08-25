var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Riot Challenge' });
});

/* GET data for all items, async */
router.get('/data', function(req, res, next) {
  var matchData = db.get('match_data');
  matchData.find({}, function(err, docs){

    var items = [{}, {}, {}, {}, {}, {}];
    items.forEach(function(itemSlot, slotIndex){
      docs.forEach(function(doc){
        for (var player in doc) {
          if (doc[player].items && doc[player].items[slotIndex]) {
            var boughtItem = doc[player].items[slotIndex];
            if (itemSlot[boughtItem]) {
              itemSlot[boughtItem] += 1;
            } else {
              itemSlot[boughtItem] = 1;
            }
          }
        }
      });
    });
    res.json({ matchItemData: items });
  });
});

/* GET data for a single item in fixed slot, async */
// NOT IMPLEMENTED
router.get('/singleItemData', function(req, res, next) {
  var itemName = req.query.item;
  var slotIndex = req.query.slot;

  if (!itemName || !slotIndex) {
    res.status(400).json({'error':'Bad request'});
  }
});

module.exports = router;


