var monk = require('monk');
var db = monk('localhost:27017/riot_challenge');

module.exports = db;
