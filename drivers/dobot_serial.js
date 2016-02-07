var _ = require('underscore'),
    Heartbeat = require('heartbeater'),
    require('bufferjs');					//extend the buffer library

// loading serialport may fail, so surround it with a try
var SerialPort = null;
try {
    SerialPort = require('serialport');     // NEEDS LIBUSB Binaries to work
} catch (ex) {
    logger.warn('cannot find serialport module');
}


var Dobot = function(COM, BAUD) {
    var that = this;

    var port_params = { baudrate : BAUD, parser: SerialPort.parsers.raw };
    this._PORT = new SerialPort.SerialPort(COM, port_params, false);

    this._STATE = "OPENED";
    this._WAIT = 20;
    this._RETRIES = 4;
    this._HEART_BEAT_INTERVAL = 200;

    this._HEARTBEAT = new Heartbeat();
    this._HEARTBEAT.interval(this._HEART_BEAT_INTERVAL);
    this._HEARTBEAT.add(_.bind(this.heartbeat, this));
    this._HEARTBEAT.start();

    //current response data stream
    this._STREAM_CHUNK = new Buffer(0);  //buffer of size 0 octets
    this._STREAM_PARSED = false;


    // Open our port and register our stub handers
    this._PORT.open(function(error) {
        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
            that._PORT.on('data', function (data) {
            	if (that.rawParser(data)) {			//check the parser if received full response
					that.receiveDobotState(data);
            	}
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


Dobot.prototype.rawParser(buffered_byte) {
	var trigger_byte = new Buffer([0x5A]);

	if (buffered_byte == trigger_byte) {			//hit the trigger_byte in response
		this._STREAM_CHUNK.addChunk(buffered_byte);
		this._STREAM_PARSED = true;
		return true;
	}

	else if (this._STREAM_PARSED == true) {			//chunk was just parsed, reset it and add again
		this._STREAM_CHUNK = new Buffer(0);			//buffer of size 0 octets	
		this._STREAM_CHUNK.addChunk(buffered_byte);
		this._STREAM_PARSED = false;
		return false;
	}

	else{
		this._STREAM_CHUNK.addChunk(buffered_byte);
		this._STREAM_PARSED = false;
		return false;
	}
}


Dobot.prototype.start = function() {
	//create the start command per Dobot API
	var command = new Buffer([0xA5,0x00,0x00,0x11,0x11,0x22,0x22,0x33,0x33,0x00,0x5A]);
	this.sendCommand(command);
	this._STATE = "CONNECTED";
};


Dobot.prototype.receiveDobotState = function(buffer) {
	this._STATE = "DATA_RECEIVED";

	//parse up the data buffer to extract Dobot state information
	var header          = buffer.readUInt8(0);  		//should register 0xA5

	var x_pos           = buffer.readFloatLE(1);		//effector coordinate system
	var y_pos           = buffer.readFloatLE(5);
	var z_pos           = buffer.readFloatLE(9);
	var heat_rot        = buffer.readFloatLE(13);

	var base_angle      = buffer.readFloatLE(17);
	var long_arm_angle  = buffer.readFloatLE(21);
	var short_arm_angle = buffer.readFloatLE(25);
	var paw_arm_angle   = buffer.readFloatLE(29);
	var is_grab         = buffer.readFloatLE(34);

	var tail	        = buffer.readUInt8(37);			//should register 0x5A

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


Dobot.prototype.disconnect = function() {
	var command = new Buffer([0xA5,0x44,0x44,0x55,0x55,0x66,0x66,0x77,0x77,0x00,0x5A]);
	this.sendCommand(command);

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
Dobot.prototype.send = function (buffer) {
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


Dobot.prototype.heartbeat = function () {
    switch (this._STATE) {
	    case "DATA_RECEIVED":
	        // This is the common case after opening, we've received data and
	        // may expect more.
	        this._STATE = "DATA_EXPECTED";
	        this._WAIT  = 20; // refresh our wait count
	        return; // keep our heartbeat going

	    /*
	    case "DATA_EXPECTED":
	        // We were expecting data from the open, but it finally stopped.
	        // Issue the M115
	        this._PORT.write('M115\n'); // can't use 'send()' until connected
	        this._STATE = SerialConnection.State.M115_SENT;
	        this._WAIT  = 20; // refresh our wait count
	        return;
		*/

	    case "STATE_DATA_RECEIVED":  //the standard response from dobot saying it updated status
	        // OK, we have a clean handshake, our connection has been initialized
	        this._HEARTBEAT.clear();
	        this._STATE = "CONNECTED";
			//this.next();  call function to send next command
	        return;

	    case "OPENED":
	    case "RESPONSE_REQUESTED":            //wait to see if we get a response
	        if (--this._WAIT > 0) {
	            return; // wait a bit longer
	        }
	        else {
	        	console.log("connection broken: no response from Dobot");
	        }

	        break; //clean up the broken port connection

	    default:
	        console.log('Dobot State Enginer is Broken');
	        break;
	    }

    // Cleanup the heartbeat and close our port
    this._HEARTBEAT.clear();
    this._PORT.close(function(err) {
        if (err) {
            logger.error('Failed closing the port', err);
        }
    });
};


module.exports = Dobot;
