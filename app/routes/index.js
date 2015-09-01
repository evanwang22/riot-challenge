var express = require('express');
var router = express.Router();
var db = require('../db');
var _ = require('lodash');

var cacheData;

var matchData511 = db.get('511');
var matchData514 = db.get('514');

var promises = [matchData511.find({}), matchData514.find({})];

Promise.all(promises).then(function(values){
  var data = values.map(function(docs){
    return buildMatchData(docs);
  });
  cacheData = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Riot Challenge' });
});

/* GET data for all items, async */
router.get('/data', function(req, res, next) {
  res.json({ itemData511: cacheData[0], itemData514: cacheData[1], winRate511: null, winRate514: null });
});

/* GET data for a single item in fixed slot, async */
router.get('/singleItemData', function(req, res, next) {

  var searchQuery = {};

  if (req.query.champion) {
    searchQuery['champion'] = req.query.champion;
  }

  if (req.query.lockedBars) {
    req.query.lockedBars.forEach(function(lockedBar){
      var field = 'items.' + lockedBar.slot;
      searchQuery[field] = lockedBar.item;
    });
  }

  if (_.isEmpty(searchQuery)) {
    res.status(400).json({'error':'Bad request'});
  }

  var itemData511 = db.get('511');
  var itemData514 = db.get('514');

  var promises = [itemData511.find(searchQuery), itemData514.find(searchQuery)];

  Promise.all(promises).then(function(values){
    var data = values.map(function(docs){
      return buildMatchData(docs);
    });

    var winRates = values.map(function(docs){
      var winners = docs.filter(function(doc){
        return doc.win === true;
      }).length;

      return winners/docs.length;
    });

    res.json({ itemData511: data[0], itemData514: data[1], winRate511: winRates[0], winRate514: winRates[1] });
  });
});

var buildMatchData = function(docs){
  var items = [{}, {}, {}, {}, {}, {}];
  items.forEach(function(itemSlot, slotIndex){
    docs.forEach(function(doc){
      if (doc.items[slotIndex]) {
        var boughtItem = doc.items[slotIndex];
        if (itemSlot[boughtItem]) {
          itemSlot[boughtItem] += 1;
        } else {
          itemSlot[boughtItem] = 1;
        }
      }
    });
  });
  return items;
};
module.exports = router;
