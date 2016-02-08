var _ = require('underscore'),
    Heartbeat = require('heartbeater');
    require('bufferjs');					//extend the buffer library

// loading serialport may fail, so surround it with a try
var SerialPort = null;
try {
    SerialPort = require('serialport');     // NEEDS LIBUSB Binaries to work
} catch (ex) {
    console.log('cannot find serialport module');
}


var Dobot = function(COM, BAUD) {
    var that = this;

  /*baudrate: Baud Rate, defaults to 9600. Must be one of: 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, or 50.
	databits: Data Bits, defaults to 8. Must be one of: 8, 7, 6, or 5.
	stopbits: Stop Bits, defaults to 1. Must be one of: 1 or 2.
	parity: Parity, defaults to 'none'. Must be one of: 'none', 'even', 'mark', 'odd', 'space'
	buffersize: Size of read buffer, defaults to 255. Must be an integer value.
	parser: The parser engine to use with read data, defaults to rawPacket strategy which just 
	emits the raw buffer as a "data" event. Can be any function that accepts EventEmitter as 
	first parameter and the raw buffer as the second parameter
	*/

    var port_params = { baudrate : 256000, parser: SerialPort.parsers.byteDelimiter(0x5A) };

    /*parser: The parser engine to use with read data, defaults to rawPacket 
    strategy which just emits the raw buffer as a "data" event. 
    Can be any function that accepts EventEmitter as first parameter 
    and the raw buffer as the second parameter.
	*/

    this._PORT = new SerialPort.SerialPort(COM, port_params, false);

    this._STATE = "OPENED";
    this._WAIT = 2000;
    this._RETRIES = 5;
    this._HEART_BEAT_INTERVAL = 200;

    /*
    this._HEARTBEAT = new Heartbeat();
    this._HEARTBEAT.interval(this._HEART_BEAT_INTERVAL);
    this._HEARTBEAT.add(_.bind(this.heartbeat, this));
    this._HEARTBEAT.start();
	*/

    //current response data stream
    /*
    this._STREAM_CHUNK = new Buffer(0);  //buffer of size 0 octets
    this._STREAM_PARSED = false;
	*/

    // Open our port and register our stub handers
    this._PORT.open(function(error) {
        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
            that._PORT.on('data', function (data) {
				data = new Buffer(data);
				console.log("buffer rx length: " + data.length);
				
				if(data.length ===42){
					that.receiveDobotState(data);
				}

				that.next();
            });

            that._PORT.on('close', function () {
                that.disconnect();
            });

            that._PORT.on('error', function (error) {
				console.log("port ended with error: " + error);
            });

			//begin communication sequence by sending start command
			that.start();
        }

    });
};


Dobot.prototype.start = function() {
	var that = this;
	//create the start command per Dobot API
	var command = new Buffer([0xA5,0x00,0x00,0x11,0x11,0x22,0x22,0x33,0x33,0x00,0x5A]);
	
	this.sendBuffer(command);
	this._STATE = "CONNECTED";

};


Dobot.prototype.receiveDobotState = function(buffer) {
	this._STATE = "DATA_RECEIVED";

	//parse up the data buffer to extract Dobot state information
	var header          = buffer.readUInt8(0);  		//should register 0xA5

	var x_pos           = buffer.readFloatLE(1);		//effector coordinate system
	var y_pos           = buffer.readFloatLE(5);
	var z_pos           = buffer.readFloatLE(9);
	var head_rot        = buffer.readFloatLE(13);

	var base_angle      = buffer.readFloatLE(17);
	var long_arm_angle  = buffer.readFloatLE(21);
	var short_arm_angle = buffer.readFloatLE(25);
	var paw_arm_angle   = buffer.readFloatLE(29);
	var is_grab         = buffer.readFloatLE(34);

	var tail	        = buffer.readUInt8(37);			//should register 0x5A

	var dobot_state = {
		header: header, 
		x_pos: x_pos, y_pos: y_pos, z_pos: z_pos, head_rot: head_rot,
		base_angle: base_angle, long_arm_angle: long_arm_angle, short_arm_angle: short_arm_angle, 
		paw_arm_angle: paw_arm_angle, is_grab: is_grab,
		tail: tail
	};

	console.log("current robot state is: \n" + JSON.stringify(dobot_state, null, 2));

};


Dobot.prototype.setDobotState = function(command) {
	

	//take standard GCODE commands and convert into buffer structure per Dobot API
	//parse out the X Y Z and the Other components (rotation, grip, laser, etc.)

	//G1 X[$FLOAT] Y[$FLOAT] Z[$FLOAT] 

	//extract x

	//extract y

	//extract z


	//break up the desired command to generate the buffer and send


	//if Access Byte = 2: this is an individual axis movement control


	//if Access Byte = 7: this is like a jog mode for forward, rotate, and up down


};


Dobot.prototype.next = function () {
	var test_command = new Buffer([0xA5, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
										0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 
										0x00, 0x00, 0x00,0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
										0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC8, 0x41, 0x5A]);

	  console.log('sending next command now');
	  this.sendBuffer(test_command);
};


Dobot.prototype.disconnect = function() {
	var command = new Buffer([0xA5,0x44,0x44,0x55,0x55,0x66,0x66,0x77,0x77,0x00,0x5A]);
	this.sendBuffer(command);

};


Dobot.prototype.close = function () {
    this._PORT.close(function(err) {
        if (err) {
            console.log("error closing the port: " + error);
        }
    });
};


Dobot.prototype.pause = function() {
    this._STATE = "PAUSED";
}


//send the command buffered command over the serialport
Dobot.prototype.sendBuffer = function (buffer) {
    if (this._STATE === "CONNECTED") {
        try {
            this._PORT.write(buffer);
        } 
        catch (error) {
            console.log("error sending buffer: " + error);
        }
    }
    else {
    	console.log("error sending buffer: Dobot is not in state to receive buffer");
    }
};


module.exports = Dobot;
