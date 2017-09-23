/**
 * Created by ps11 on 21/09/17.
 */
var request = require('request');
var promise = require('promise');
var cheerio = require('cheerio');

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
        var locationUrl = 'https://maps.googleapis.com/maps/api/geocode/json?city=' + location + '&key=AIzaSyD8CAcnPdwxtI4K4HsVbrbsch_l_zJNHFQ';
        request(locationUrl, function (err, result) {
          var cityData = JSON.parse(result.body);
          var name = cityData.results[0].formatted_address;
          var names = name.split(',');
          console.log(names[0] + "," + names[1] + ",India");
          return resolve(names[0] + "," + names[1] + ",India");
        });
      }
    })
  },
  insertCitiesIntoDb : function(formattedStateName,db){
    return new promise(function(resolve,reject){

      var priceUrl = 'http://www.mypetrolprice.com/?state='+formattedStateName;
      request(priceUrl, function(err,response,html) {
        console.log("Enter");
        var records = [];
        var $ = cheerio.load(html);
        $('#ddlCity').filter(function () {
          var data = $(this);
          var record = {};
          for (var i = 0; i < data.children().length; i++) {
            record.name = data.children().get(i).children[0].data;
            record.stateName = formattedStateName;
            record.city_id = data.children().get(i).attribs.value;
            records.push(record);
            record = {};
          }
          db.collection('cities').insertMany(records);
          return resolve('success');
        });
      });
    });
  },
  getPricesInCity : function(cityId, name){
    return new promise(function(resolve,reject){
      var response = {};
      request({
        url: "http://www.mypetrolprice.com/Default.aspx?LocationID=" + cityId, headers: {
          'User-Agent': 'request'
        }
      }, function (errPrice, responsePrice, htmlPrice) {
        var $ = cheerio.load(htmlPrice);
        $('.hideInMobileDiv').filter(function () {
          var data = $(this);
          response['city'] = name.split(',')[0];
          if(!data.attr('id')) {
            var text = data.text();
            text = text.replace('Rs','');
            response[data.siblings().first().text()] = "₹ " + text;
            text='';
          }
        });
        return resolve(JSON.stringify(response));
      });
    })
  }
};