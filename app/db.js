var monk = require('monk');

var uri = 'localhost:27017/riot_challenge'
if (process.env["VCAP_SERVICES"]) {
  var vcap_services = JSON.parse(process.env["VCAP_SERVICES"]);
  uri = vcap_services.mongolab[0].credentials.uri;
}

var db = monk(uri);
module.exports = db;
