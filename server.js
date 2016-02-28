var Dobot = require('./drivers/dobot_serial.js');


var dobotInstance = new Dobot('COM11', 256000);

//open the connection and take control of the machine
dobotInstance.start();

//load a file to run instructions from
//dobotInstance.loadProgram('./test/cube_2in.gcode');

//run the program from the currently loaded file
//setTimeout(dobotInstance.runProgram, 8000);



//dobotInstance.streamProgram();


//dobotInstance.computerVisionProgram();
