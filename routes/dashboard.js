var express = require('express');
var router = express.Router();


var config = require('../config.js'); // get our config file

// load the Cloudant library
var async = require('async');

// Load the Cloudant library.
var Cloudant = require('cloudant');
// Initialize the library with my account.
var cloudant = Cloudant(config.database);
var db = cloudant.db.use("pankil");

router.get('/', function(req, res, next) {
  res.render('dashboard', { title: 'Health Data Portal' });
});

router.get('/control/add/:org', function(req, res, next) {
    console.log("add: " + req.params.org);
    
    db.get("organizations", function(err, data) {
        // The rest of your code goes here. For example:
        console.log("Found organizaitons:", data);
        var spliceIndex = data.available.indexOf(req.params.org);
        
        if (spliceIndex != -1) {
            data.available.splice(spliceIndex, 1);
        
            data.whitelist.push(req.params.org);
            
            db.insert(data, function(err, body, header) {
                if (err) {
                    return console.log('Update Error ', err.message);
                } else {
                    console.log("Update complete:");
                    console.log(JSON.stringify(body));    
                }
                res.redirect('/dashboard/control');
            });
            
        } else {
            res.redirect('/dashboard/control');
        }
  });
});

router.get('/control/remove/:org', function(req, res, next) {
    console.log("remove: " + req.params.org);
    
    db.get("organizations", function(err, data) {
        // The rest of your code goes here. For example:
        console.log("Found organizaitons:", data);
        var spliceIndex = data.whitelist.indexOf(req.params.org);
        
        if (spliceIndex != -1) {
            data.whitelist.splice(spliceIndex, 1);
        
            data.available.push(req.params.org);
            
            db.insert(data, function(err, body, header) {
                if (err) {
                    return console.log('Update Error ', err.message);
                } else {
                    console.log("Update complete:");
                    console.log(JSON.stringify(body));    
                }
                res.redirect('/dashboard/control');
            });
            
        } else {
            res.redirect('/dashboard/control');
        }
  });
    
});

router.get('/control', function(req, res, next) {

  db.get("organizations", function(err, data) {
    // The rest of your code goes here. For example:
    console.log("Found organizations:", data);
    res.render('control', { title: 'Health Data Portal', organizations : data});
  });
  
});

/*

  "available": [
    "IBM Health API",
    "Insurance Company",
    "Local Public Health",
    "We Care"
  ],
  "whitelist": [
    "Dr. Joy (Family Doctor)"
  ]
*/

router.get('/visualization', function(req, res, next) {
    
    db.get("accessgrantlog", function(err, accessdata) {
        if (err){
            
        } else {
            db.get("accessdenylog", function(err, denydata) {
                if (err) {
                    
                } else {
                    res.render('linechart', 
                    { title: 'Health Data Portal', accessdata: accessdata, denydata: denydata });
                }
            });
        }
    });
});


module.exports = router;
