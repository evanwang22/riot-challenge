var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Riot Challenge' });
});

/* GET data for all items, async */
router.get('/data', function(req, res, next) {
  var matchData511 = db.get('511');
  var matchData514 = db.get('514');

  var promises = [matchData511.find({}), matchData514.find({})];

  Promise.all(promises).then(function(values){
    var data = values.map(function(docs){
      return buildMatchData(docs);
    });
    res.json({ matchItemData511: data[0], matchItemData514: data[1] });
  });
});

/* GET data for a single item in fixed slot, async */
router.get('/singleItemData', function(req, res, next) {
  var itemName = req.query.item;
  var slotIndex = req.query.slot;

  if (!itemName || !slotIndex) {
    res.status(400).json({'error':'Bad request'});
  }

  var itemData511 = db.get('511');
  var itemData514 = db.get('514');

  var queryField = 'players.items.' + (parseInt(slotIndex)-1);
  var singleItemQuery = {};
  singleItemQuery[queryField] = itemName;

  var promises = [itemData511.find(singleItemQuery), itemData514.find(singleItemQuery)];

  Promise.all(promises).then(function(values){
    var data = values.map(function(docs){
      return buildItemData(docs, req.query);
    });
    res.json({ singleItemData511: data[0], singleItemData514: data[1] });
  });

});

var buildMatchData = function(docs){
  var items = [{}, {}, {}, {}, {}, {}];
  items.forEach(function(itemSlot, slotIndex){
    docs.forEach(function(doc){
      doc.players.forEach(function(player) {
        if (player.items[slotIndex]) {
          var boughtItem = player.items[slotIndex];
          if (itemSlot[boughtItem]) {
            itemSlot[boughtItem] += 1;
          } else {
            itemSlot[boughtItem] = 1;
          }
        }
      });
    });
  });
  return items;
};

var buildItemData = function(docs, query){
  var items = [{}, {}, {}, {}, {}, {}];
  items.forEach(function(itemSlot, slotIndex){
    docs.forEach(function(doc){
      var wantedPlayers = doc.players.filter(function(player) {
        return player.items[parseInt(query.slot)-1] === query.item
      });
      wantedPlayers.forEach(function(player) {
        if (player.items[slotIndex]) {
          var boughtItem = player.items[slotIndex];
          if (itemSlot[boughtItem]) {
            itemSlot[boughtItem] += 1;
          } else {
            itemSlot[boughtItem] = 1;
          }
        }
      });
    });
  });
  return items;
};

module.exports = router;
