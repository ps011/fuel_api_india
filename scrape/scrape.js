/**
 * Created by ps11 on 24/08/17.
 */
var router = require('express').Router();
var cheerio = require('cheerio');
var request = require('request');
var mongodb = require('mongodb').MongoClient;
var util = require('./scrapeUtils');


//GPS
// 1. Get Coordinates from Request.
// 2. Call a function from utilities to convert coordinates to formatted name.
// 3. Call a function that converts that cityName to its city_id.
// If state exists in DB then get city_id directly
// else call a function that gets stateName and inserts all the cities of the given state in the database
// 4. Call a function to get fuel prices in city with that city_id.



//SEARCH





// var dbUrl = 'mongodb://localhost:27017/fuel_api';
var dbUrl = 'mongodb://pransh:12345@ds159274.mlab.com:59274/fuel_api';
// AIzaSyD8CAcnPdwxtI4K4HsVbrbsch_l_zJNHFQ
router.get('/gps',function(req,res){
  console.log('Request Received');
  util.geocodeToName(req.query.location,'gps').then(function(name){
    console.log('Got name : '+name);
    var names = name.split(',');
    var formattedStateName = names[1].replace(' ','_');

    mongodb.connect(dbUrl,function(mongoErr,db){
      db.collection('cities').findOne({"name": new RegExp(names[0])}).then(function(data){
        console.log('Got City availability : '+data!==null);
        if(!data){

          console.log('City %s not in DB, Searching and inserting city...', names[0]);
          util.insertCitiesIntoDb(names, db).then(function(data){
            console.log('Data Inserted  : '+data);
            db.collection('cities').findOne({name:new RegExp(names[0])}).then(function(rcd, err){
              var response = {};
              if (rcd) {
                // request({
                //   url: "http://www.mypetrolprice.com/Default.aspx?LocationID=" + rcd.city_id, headers: {
                //     'User-Agent': 'request'
                //   }
                // }, function (errPrice, responsePrice, htmlPrice) {
                //   var $ = cheerio.load(htmlPrice);
                //   $('.hideInMobileDiv').filter(function () {
                //     var data = $(this);
                //     response['city'] = names[0];
                //     if(!data.attr('id')) {
                //       var text = data.text();
                //       text = text.replace('Rs','');
                //       response[data.siblings().first().text()] = "₹ " + text;
                //       text='';
                //     }
                //   });
                //   res.send(JSON.stringify(response));
                // });
                util.getPricesInCity(rcd.city_id, rcd.name).then(function(data){
                  res.send(data);
                })
              }
              else {
                db.collection('cities').findOne(
                  {name: {$regex :new RegExp(names[1])}}
                ).then(function (err,stateRcd) {
                  if(stateRcd){
                    util.getPricesInCity(rcd.city_id, rcd.name).then(function (value) {
                      res.send(value);
                    }).catch(function (reason) { console.log('===========reason4=========',reason); })
                  }
                  else{
                    response['city'] = null;
                    res.send(JSON.stringify(response));
                  }
                }).catch(function (error) {
                  console.log('===========rerror=========',error);
                })
              }
            }).catch(function(err){
              console.log(err);
            });
          }).catch(function(err){
            console.log(err)
          })


        }
        else{
          console.log(names[0]+", "+names[1]+", India");
          db.collection('cities').findOne(
            {name: {$regex :new RegExp(names[0])}}
          ).then(function(rcd, err){
            if (rcd) {
              util.getPricesInCity(rcd.city_id, rcd.name).then(function (value) {
                res.send(value);
              }).catch(function (reason) { console.log('===========reason1=========',reason); })
            }
            else {
              db.collection('cities').findOne(
                {name: {$regex :new RegExp(names[0])}}
              ).then(function (stateRcd, err) {
                if(stateRcd){
                  util.getPricesInCity(stateRcd.city_id, stateRcd.name).then(function (value) {
                    res.send(value);
                  }).catch(function (reason) { console.log('===========reason3=========',reason); })
                }
                else{
                  response['city'] = null;
                  res.send(JSON.stringify(response));
                }
              }).catch(function (reason) { console.log('===========reason2=========',reason); })
            }
          }).catch(function(err){
            console.log(err);
          });
        }
      }).catch(function (reason) { console.log('===========reason5=========',reason); })
    });
  })
});



router.get('/search', function(req,res){
  console.log('===========City=========',req.query.city);
  var url = 'mongodb://pransh:12345@ds159274.mlab.com:59274/fuel_api';
  // var url = 'mongodb://localhost:27017/fuel_api';
  mongodb.connect(url,function(mongoErr,db){
    db.collection('cities').findOne({name : {$regex : new RegExp(req.query.city, "i")}}, function(err, rcd){
      var response = {};
      if (rcd) {
        util.getPricesInCity(rcd.city_id, rcd.name).then(function(response){
          res.send(response);
        })
      }
      else {
        console.log('City %s not in DB, Searching and inserting city...', req.query.city);
        util.insertCitiesIntoDb([req.query.city, ''], db).then(function(data){
          console.log('Data Inserted  : '+data);
          db.collection('cities').findOne({name:new RegExp(req.query.city)}).then(function(rcd, err){
            var response = {};
            if (rcd) {
              // request({
              //   url: "http://www.mypetrolprice.com/Default.aspx?LocationID=" + rcd.city_id, headers: {
              //     'User-Agent': 'request'
              //   }
              // }, function (errPrice, responsePrice, htmlPrice) {
              //   var $ = cheerio.load(htmlPrice);
              //   $('.hideInMobileDiv').filter(function () {
              //     var data = $(this);
              //     response['city'] = names[0];
              //     if(!data.attr('id')) {
              //       var text = data.text();
              //       text = text.replace('Rs','');
              //       response[data.siblings().first().text()] = "₹ " + text;
              //       text='';
              //     }
              //   });
              //   res.send(JSON.stringify(response));
              // });
              util.getPricesInCity(rcd.city_id, rcd.name).then(function(data){
                res.send(data);
              })
            }
            else {
              db.collection('cities').findOne(
                {name: {$regex :new RegExp(names[1])}}
              ).then(function (err,stateRcd) {
                if(stateRcd){
                  util.getPricesInCity(rcd.city_id, rcd.name).then(function (value) {
                    res.send(value);
                  }).catch(function (reason) { console.log('===========reason4=========',reason); })
                }
                else{
                  response['city'] = null;
                  res.send(JSON.stringify(response));
                }
              }).catch(function (error) {
                console.log('===========rerror=========',error);
              })
            }
          }).catch(function(err){
            console.log(err);
          });
        }).catch(function(err){
          console.log(err)
        })
      }
    });
  });
});
module.exports = router;
