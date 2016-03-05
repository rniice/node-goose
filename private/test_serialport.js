var _ = require('underscore'),
    Heartbeat = require('heartbeater');
    require('bufferjs');					//extend the buffer library

SerialPort = require('serialport');     // NEEDS LIBUSB Binaries to work

var port_params = { baudrate : 256000, parser: SerialPort.parsers.byteDelimiter(0x5A) };
var _PORT = new SerialPort.SerialPort('COM11', port_params, false);


_PORT.open(function(error) {
    var port_scoped = _PORT;

    if (error) {
		console.log("unable to open port: " + error);
    } 
    else {
        port_scoped.on('data', function (data) {
			for (var i = 0; i < data.length; i++){
				data[i] = data[i].toString(16);
			}

			console.log("received data: " + data);
	
			var test_command = new Buffer([0xA5, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00,0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC8, 0x41, 0x5A]);
			port_scoped.write(command);
			console.log("sent data");

			//that.receiveDobotState(data);
        });

        port_scoped.on('close', function () {
            console.log("port is closing");
			//that.disconnect();
        });

        port_scoped.on('error', function (error) {
			console.log("port ended with error: " + error);
        });


        var command = new Buffer([0xA5,0x00,0x00,0x11,0x11,0x22,0x22,0x33,0x33,0x00,0x5A]);
        port_scoped.write(command);


		//begin communication sequence by sending start command
		//that.start();
    }

});





/*

    Dobot.prototype.start = function() {
	var that = this;
	//create the start command per Dobot API
	var command = new Buffer([0xA5,0x00,0x00,0x11,0x11,0x22,0x22,0x33,0x33,0x00,0x5A]);
	var test_command = new Buffer([0xA5, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00,0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC8, 0x41, 0x5A]);

	this.sendBuffer(command);
	this._STATE = "CONNECTED";
	setTimeout(function () {
	  console.log('sending first command now');
	  that.sendBuffer(test_command);
	}, 3000);

};
*/