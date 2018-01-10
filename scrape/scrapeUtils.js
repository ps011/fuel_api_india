/**
 * Created by ps11 on 21/09/17.
 */
var request = require('request');
var promise = require('promise');
var cheerio = require('cheerio');
var _ = require('lodash');

module.exports = {
  geocodeToName : function(location, type){
    return new promise(function(resolve, reject){
      var stateName = '', cityName = '';
      if(type === 'gps') {
        var locationUrl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + location + '&key=AIzaSyD8CAcnPdwxtI4K4HsVbrbsch_l_zJNHFQ';
        request(locationUrl, function (err, result) {
          var response = JSON.parse(result.body);

          var data = response.results[2].address_components;
          data.forEach(function (obj) {
            if (obj.types[0] === 'administrative_area_level_1') {
              stateName = obj.long_name;
            }
          });
          data.forEach(function (obj) {
            if (obj.types[0] === 'administrative_area_level_2') {
              cityName = obj.long_name;
            }
          });
          if (!cityName) {
            data = response.results[3].address_components;
            data.forEach(function (obj) {
              if (obj.types[0] === 'locality') {
                cityName = obj.long_name;
              }
            });
          }
          if (!stateName) {
            data = response.results[3].address_components;
            data.forEach(function (obj) {
              if (obj.types[0] === 'administrative_area_level_1') {
                stateName = obj.long_name;
              }
            });
          }
          cityName = cityName.split(' ')[0];
          console.log(cityName);
          console.log(stateName);
          return resolve(cityName + "," + stateName + ",India");
        });
      }
      else if(type === 'city'){
        var locationUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=AIzaSyD8CAcnPdwxtI4K4HsVbrbsch_l_zJNHFQ';
        request(locationUrl, function (err, result) {
          if(!err) {
            var cityData = JSON.parse(result.body);
            var name = cityData.results[0].formatted_address;
            var names = name.split(',');
            console.log(names[0] + "," + names[1] + ",India");
            return resolve(names[0] + "," + names[1] + ",India");
          }
          else{
            return reject(err);
          }
        });
      }
    })
  },
  insertCitiesIntoDb : function(name,db){
    return new promise(function(resolve,reject){
      var priceUrl = 'https://www.mypetrolprice.com/SearchResults.aspx?TextString='+name[0];
      request(priceUrl, function(err,response,html) {
        var records = [];
        var $ = cheerio.load(html);
        $('.searchDiv').filter(function () {
          var data = $(this);
          var names = data.text().split(',');
          var record = {};
          record.name = names[0];
          record.stateName = names[1];
          record.city_id = data.attr('id');

          records.push(record);
          db.collection('cities').insertMany(records);
          return resolve('success');
        });
      });
    });
  },
  getPricesInCity : function(cityId, name){
    return new promise(function(resolve,reject){
      var response = {};
      var fuelNames = [];
      var fuelPrices = [];
      request({
        url: "http://www.mypetrolprice.com/" + cityId + "/Fuel-prices-in", headers: {
          'User-Agent': 'request'
        }
      }, function (errPrice, responsePrice, htmlPrice) {
        var $ = cheerio.load(htmlPrice);
        $('.UCFuelName').filter(function () {
          var fuelNameData = $(this);
          response['city'] = name.split(',')[0];
          fuelNames.push(fuelNameData.text());
        });
        $('.UCPrice').filter(function(){
          var fuelPriceData = $(this);
          fuelPrices.push(fuelPriceData.text());
        });
        for(var i=0;i< fuelNames.length;i++) {
          response[fuelNames[i]] = fuelPrices[i];
        }
        return resolve(JSON.stringify(response));
      });

    });
  }
};