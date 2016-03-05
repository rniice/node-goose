var Dobot = require('./private/drivers/dobot_serial.js');
var count = 8;

//open the connection and take control of the machine
var dobotInstance = new Dobot('COM11', 256000);

//load a file to run instructions from
dobotInstance.loadProgram('./test/cube_2in_simplify.gcode');

var countdown = setInterval(countdownFunction,1000);

//run the program from the currently loaded file
setTimeout( function(){
				console.log("made it into runProgram call");
				//dobotInstance._STATE = "WAITING"; }
				dobotInstance.runProgram(); }
			, 8000);




//dobotInstance.streamProgram();


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


