var express = require('express');
var http = require('http');
var app = express();
var path = require('path');
var fs = require('fs');



var Dobot = require('./private/drivers/dobot_serial.js');

var dobotInstance = null; //placeholder

var count = 4;



// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// make express look in the public directory for assets (css/js/img)
var public_directory = path.join(__dirname, "public")

app.use(express.static(public_directory));

//MAIN landing URL
app.get('/', function(req, res) {
	//console.log("operating in dirname: " + __dirname);
	res.sendFile(path.join(public_directory + '/index.html'));
});


app.get('/run/connect', function(req, res) {
	//open the connection and take control of the machine
	dobotInstance = new Dobot('COM11', 256000);
	res.send('Connected to Dobot');
});


app.get('/run/runProgram', function(req, res) {
	//load a file to run instructions from
	dobotInstance.loadProgram('./test/cube_2in_simplify.gcode');

	dobotInstance._STATE = "WAITING"; 
	dobotInstance.runProgram(); 
	res.send('Connected to Dobot');
});


app.get('/run/streamProgram', function(req, res) {
	dobotInstance._STATE = "WAITING"; 
	dobotInstance.streamProgram(); 
	res.send('Streaming to Dobot');
});


app.get('/run/jog', function(req, res) {
	//res.send('returning all materials');
	//materials.getMaterials(req, res);
	dobotInstance.jogMoveCartesian( {axis: "X", direction: 1} );

});


//starts the server listening
app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});


/*
var countdown = setInterval(countdownFunction,1000);

//run the program from the currently loaded file
setTimeout( function(){
				//console.log("made it into runProgram call");
				dobotInstance._STATE = "WAITING"; 
				dobotInstance.runProgram(); 

			}, 4000);

*/

//dobotInstance.streamProgram();
//dobotInstance.jogMoveCartesian( {axis: "X", direction: "1"} );


//dobotInstance.computerVisionProgram();


function countdownFunction() {
	//console.log("file loaded state: " + dobotInstance._FILE_LOADED);
	console.log(count);
	count--;

	if (count == 1) {
		clearTimeout(countdown);
	}
}



//use express to return a index.html that is used to communicate with the server


