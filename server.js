var express = require('express');
var http = require('http');
var url = require('url');
var app = express();
var path = require('path');
var fs = require('fs');



var Dobot = require('./private/drivers/dobot_serial.js');

var dobotInstance = null; //placeholder


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
	//dobotInstance = new Dobot('COM11', 256000); 	//V1.0 Firmware
	dobotInstance = new Dobot('COM11', 9600); 		//V1.1 Firmware
	res.send('Connected to Dobot');
});

app.get('/run/disconnect', function(req, res) {
	//open the connection and take control of the machine
	dobotInstance.disconnect();
	res.send('Disconnected Dobot');
});

app.get('/run/pause', function(req, res) {
	//open the connection and take control of the machine
	dobotInstance.pause();
	res.send('Pausing Dobot');
});


app.get('/run/resume', function(req, res) {
	//open the connection and take control of the machine
	dobotInstance.resume();
	res.send('Resuming Dobot');
});


app.get('/run/streamProgram', function(req, res) {
	//dobotInstance._STATE = "WAITING";
	console.log("triggering stream Mode"); 
	dobotInstance.streamProgram(); 
	res.send('Streaming to Dobot');
});


//NEED TO CONVERT TO POST AND UPLOAD LATER
app.get('/load/program', function(req, res) {
	//dobotInstance.loadProgram('./test/cube_2in_simplify.gcode');
	//dobotInstance.loadProgram('./test/test_move_jog.gcode');
	//dobotInstance.loadProgram('./test/test_move_target.gcode');
	//dobotInstance.loadProgram('./test/bernie_gcode_dobot.gcode');
	//dobotInstance.loadProgram('./test/bernie_outline_gcode_dobot.gcode');
	dobotInstance.loadProgram('./test/bernie_outline_gcode_dobot_targets.gcode');
	//dobotInstance.loadProgram('./test/test_rectangles.gcode');
	res.send('Program Loaded');
});


app.get('/run/runProgram', function(req, res) {
	dobotInstance.runProgram(); 
	res.send('Connected to Dobot');
});



app.get('/run/jog', function(req, res) {
	
	var query = url.parse(req.url,true).query;  

	dobotInstance.jogMoveCartesian( query );
	res.send('Jog Command Sent');
});


app.get('/status/state', function(req, res) {
	res.send(dobotInstance._dobot_state);

});



//starts the server listening
app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});


/*

//dobotInstance.computerVisionProgram();

*/


