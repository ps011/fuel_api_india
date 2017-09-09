/**
 * Created by ps11 on 24/08/17.
 */
var router = require('express').Router();
var cheerio = require('cheerio');
var request = require('request');
var NodeGeocoder = require('node-geocoder');
var mongodb = require('mongodb').MongoClient;
router.get('/',function(req,res){
  var geocoder = NodeGeocoder();
  geocoder.geocode(req.query.location)
    .then(function(result) {
      var cityName = result[1].administrativeLevels.level2long+", "+result[1].administrativeLevels.level1long+", "+'India';
      var stateName = result[1].administrativeLevels.level1long;
      console.log(cityName);
      stateName = stateName.replace(' ','_');
      var url = "mongodb://localhost:27017/fuel_api";
      mongodb.connect(url,function(mongoErr,db){
        url = 'http://www.mypetrolprice.com/?state='+stateName;
        request(url, function(err,response,html) {
          db.listCollections().toArray(function(err,collections){
            var exist = collections.filter(function(item){
              return item.name === stateName;
            });
            var records = [];
            var $ = cheerio.load(html);
            if(!exist.length > 0) {
              $('#ddlCity').filter(function () {
                var data = $(this);
                var record = {};
                for (var i = 0; i < data.children().length; i++) {
                  record.name = data.children().get(i).children[0].data;
                  record.city_id = data.children().get(i).attribs.value;
                  records.push(record);
                  record = {};
                }
                db.collection(stateName).insertMany(records);
                var title = data.children().first().text();
              });
            }
          });
          db.collection(stateName).findOne({name:cityName},function(err,rcd){
            if(!err) {
              var response = {};
              if (rcd) {
                request({
                  url: "http://www.mypetrolprice.com/Default.aspx?LocationID=" + rcd.city_id, headers: {
                    'User-Agent': 'request'
                  }
                }, function (errPrice, responsePrice, htmlPrice) {
                  var $ = cheerio.load(htmlPrice);
                  $('.hideInMobileDiv').filter(function () {
                    var data = $(this);
                    response['city'] = cityName;
                    console.log(data.attr('id'));
                    if(!data.attr('id'))
                    response[data.siblings().first().text()] = data.text();
                  });
                  res.send(JSON.stringify(response));
                });
              }
              else {
                response['city'] = null;
                res.send(JSON.stringify(response));
              }
            }
          });
        })
      });
    })
    .catch(function(err) {
      var response = {};
      response.city = null;
      console.log(err);
      res.send(JSON.stringify(response));
    });
});
module.exports = router;