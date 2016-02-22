var express = require('express');
var moment = require('moment');
var router = express.Router();


var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('../config.js'); // get our config file

// Load the Cloudant library.
var Cloudant = require('cloudant');
// Initialize the library with my account.
var cloudant = Cloudant(config.database);
var db = cloudant.db.use("pankil");

// Check for JWT
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "Authorization");
	// check header for token
	var token = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, config.secret, function(err, decoded) {			
			if (err) {
				return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No JWT token provided.'
		});
		
	}
	
});

// would be /:user/data
router.get('/pankil/data', function(req, res, next) {
    db.get("organizations", function(err, data) {
        // The rest of your code goes here. For example:
        //console.log("Found organizaitons:", data);
        var spliceIndex = data.whitelist.indexOf(req.decoded.sub);
        
        var success = false;
        
        if (spliceIndex != -1) {
            success = true;
            db.get("healthdata", function(err, data) { 
                if (err) {
                    res.json({success: false, error: "Error occured!"});
                } else {
                    res.json({success: true, healthdata: data})
                }
            });
            
            
            db.get("accessgrantlog", function(err, data) {
                if (err) {
                    console.log("Error getting accessgrantlog");
                } else {
                    updateCounter(data, req.decoded.sub);
                    console.log("Found accessgrantlog: ", data);
                }
                
            });
    } else {
        success = false;
        res.status(403).send({ 
            success: false,
            message: 'The user has not granted you access to their data.'
            
        });
        
        
        db.get("accessdenylog", function(err, data) {
            
            if (err) {
                console.log("Error getting accessdenylog");
            } else {
                updateCounter(data, req.decoded.sub);
                console.log("Found accessdenylog: ", data);
            }
            
            
            /*
            var timestamp = Math.floor(Math.floor(new Date() / 1000)/60)*60;

            //console.log("Found accessdenylog: ", data);
            var tsData = data[timestamp];
            var orgName = req.decoded.sub;
            
            if (tsData) {
                
                if (tsData[orgName]) {
                    tsData[orgName] = tsData[orgName] + 1;
                } else {
                    //var tempObject = {};
                    //tempObject[orgName] = 1;
                    tsData[orgName] = 1;
                }
                
            } else {
                tsData = {};
                tsData.timestamp = timestamp;
                var formattedDate = moment.unix(timestamp).format("YYYY MMM DD hh:mm");
                tsData.date = formattedDate;
                tsData[orgName] = 1;
            }
            data[timestamp] = tsData;
            
            db.insert(data, function(err, body, header) {
                if (err) {
                    return console.log('Access Deny Log Update Error ', err.message);
                } else {
                    console.log("Access Deny Log Update complete");
                }
            });
            */
         });
    }
  });
});


function updateCounter(data, orgName) {
    var timestamp = Math.floor(Math.floor(new Date() / 1000)/60)*60;
    var tsData = data[timestamp];

    // Increment Total Counter
    if (data.total === undefined) {
        data.total = {};
    }
    if (data.total[orgName]) {
        data.total[orgName] += 1;
    } else {
        data.total[orgName] = 1;
    }
    
    // Timestamp value
    if (tsData) {
        if (tsData[orgName]) {
            tsData[orgName] = tsData[orgName] + 1;
        } else {
            tsData[orgName] = 1;
        }
        
    } else {
        // Create a new timestamp
        tsData = {};
        tsData.timestamp = timestamp;
        var formattedDate = moment.unix(timestamp).format("YYYY-MM-DD HH:mm");
        tsData.date = formattedDate;
        tsData[orgName] = 1;
    }
    data[timestamp] = tsData;
    
    db.insert(data, function(err, body, header) {
        if (err) {
            return console.log('Access Log Update Error ', err.message);
        } else {
            console.log("Access Log Update complete");
        }
    });
}

module.exports = router;
