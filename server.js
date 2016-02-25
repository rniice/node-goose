var Dobot = require('./drivers/dobot_serial.js');


var dobotInstance = new Dobot('COM11', 256000);


dobotInstance.start();


