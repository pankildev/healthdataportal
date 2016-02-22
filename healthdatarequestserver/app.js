var express = require('express');


var app = express();

var port = process.env.PORT || 4000;

app.use("/", express.static(__dirname));

app.listen(port, function(){
    console.log('Running app on PORT: ' + port);
});