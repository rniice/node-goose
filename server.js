var Dobot = require('./drivers/dobot_serial.js');


var dobotInstance = new Dobot('COM11', 9600);

dobotInstance.start();

