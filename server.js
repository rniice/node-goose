var Dobot = require('./drivers/dobot_serial.js');
var count = 10;

var dobotInstance = new Dobot('COM11', 256000);

//open the connection and take control of the machine
dobotInstance.start();

//load a file to run instructions from
dobotInstance.loadProgram('./test/cube_2in_simplify.gcode');

var countdown = setInterval(countdownFunction,1000);
//run the program from the currently loaded file
setTimeout(dobotInstance.runProgram, 10000);




//dobotInstance.streamProgram();


//dobotInstance.computerVisionProgram();


function countdownFunction() {
	
	console.log(count);
	count--;

	if (count == 0) {
		clearTimeout(countdown);
	}
}