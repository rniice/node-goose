/***************** LOAD DEPENDENCIES ****************/

var _ 			= require('underscore'),
    Heartbeat 	= require('heartbeater'),
    			  require('bufferjs'),		//extend the buffer library
    fs 			= require('fs');			//fs for loading files to run


var SerialPort = null;
try {										// loading serialport may fail on some systems
    SerialPort = require('serialport');     // requires LIBUSB available to OS
} catch (ex) {
    console.log('cannot find serialport module');
}

/*****************************************************/

var Dobot = function(COM, BAUD) {
    var that = this;

    var port_params = { baudrate : BAUD, parser: SerialPort.parsers.byteDelimiter(0x5A) };

    this._PORT = new SerialPort.SerialPort(COM, port_params, false);

    this.test_command 		= new Buffer([0xA5,
											0x00,0x00,0x80,0x3F,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x40,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0xC8,0x41,
										0x5A]);

	this.start_command 		= new Buffer([0xA5,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
										  	0x11,0x11,0x22,0x22,0x33,0x33,
										0x00,0x5A]);

	this.disconnect_command = new Buffer([0xA5,
											0x44,0x44,0x55,0x55,0x66,0x66,0x77,0x77,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
											0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
										 0x5A]);

    this._STATE 				= "OPENED";
    this._WAIT 					= 2000;
    this._RETRIES 				= 5;
    this._HEART_BEAT_INTERVAL 	= 200;

    this._NEXT_COMMAND			= this.test_command;
    this._COMMAND_QUEUE			= null;

    this._FILE_LOADED			= false;   //file containing gcode to run


    // Open port and define event handlers
    this._PORT.open(function(error) {
        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
            that._PORT.on('data', function (data) {
			    that._STATE = "CONNECTED";

				data = new Buffer(data);
				console.log("buffer rx length: " + data.length);
						
				if(data.length == 42) {
					that.receiveDobotState(data);
					that.next();
				}
				
            });

            that._PORT.on('close', function () {
                that.disconnect();
                that._STATE = "DISCONNECTED";
            });

            that._PORT.on('error', function (error) {
				console.log("port ended with error: " + error);
				that._STATE = "ERROR";

            });

            that.start();
        }

    });
};


Dobot.prototype.start = function() {
	
	this.sendBuffer(this.start_command);
	this._STATE = "CONNECTED";

};


Dobot.prototype.receiveDobotState = function(buffer) {
	//this._STATE = "DATA_RECEIVED";

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
	var is_grab         = buffer.readFloatLE(34);		//should be a boolean

	var tail	        = buffer.readUInt8(37);			//should register 0x5A

	var dobot_state = {
		header: 			header, 
		x_pos: 				x_pos, 
		y_pos: 				y_pos, 
		z_pos: 				z_pos, 
		head_rot: 			head_rot,
		base_angle: 		base_angle, 
		long_arm_angle: 	long_arm_angle, 
		short_arm_angle: 	short_arm_angle, 
		paw_arm_angle: 		paw_arm_angle, 
		is_grab: 			is_grab,
		tail: 				tail
	};

	//that.next();

	console.log("current robot state is: \n" + JSON.stringify(dobot_state, null, 2));

};

	
/*Take standard GCODE commands and convert into buffer structure per Dobot API
  G1 X[$FLOAT] Y[$FLOAT] Z[$FLOAT] RH[$FLOAT] GRP[$FLOAT] LSR[$FLOAT] F[$FLOAT]
*/

Dobot.prototype.sendDobotState = function(command) {

	//verify it is a G code
	var regex_G 		= new RegExp('^G([\d]+)' , 'i');
	var g_command 		= command.match(regex_G);

	if(regex_G == '1'){

		//extract x
		var regex_X			= new RegExp('X([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var x_coordinate	= command.match(regex_X);

		//extract y
		var regex_Y			= new RegExp('Y([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var y_coordinate	= command.match(regex_Y);

		//extract z
		var regex_Z			= new RegExp('Z([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var z_coordinate	= command.match(regex_Z);

		//extract rotation head
		var regex_RH		= new RegExp('RH([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var rh_angle		= command.match(regex_RH);	

		//extract grip head
		var regex_GRP		= new RegExp('GRP([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var grp_angle		= command.match(regex_GRP);		

		//extract laser power
		var regex_LSR		= new RegExp('LSR([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var lsr_power		= command.match(regex_GRP);

		//extract feed rate
		var regex_FEED		= new RegExp('F([+-]?[\d]+[\.]?[\d]+]?)' , 'i');
		var feed_rate		= command.match(regex_FEED);		

		//create an object with the selected dobot command parameters
		var selected_state 	= {
			x_pos 			: x_coordinate,
			y_pos			: y_coordinate,
			z_pos 			: z_coordinate,
			head_rot 		: rh_angle,
			is_grab 		: grp_angle,
			laser_pwr 		: lsr_power,
			feed_rate		: feed_rate
		}

		//call function to create command buffer
		var command_buffer = this.generateCommandBuffer(selected_state);

	}

	else {
		console.log("not a valid GCODE command");
		//return some sort of buffer structure that keeps the robot in place
	}

	return command_buffer;
};


Dobot.prototype.generateCommandBuffer = function(data) {
	//break out the elements from "data"
	var command_buffer = new Buffer(42);					//create 42 byte buffer

	command_buffer.writeFloatLE(0xA5, 0);					//write the header
	
	//2 = single axis control; 7 = straight line control
	command_buffer.writeFloatLE(7, 1);						//write the state
	command_buffer.writeFloatLE(0xA5, 5);					//write the axis ??????
	command_buffer.writeFloatLE(data.x_pos, 9);				//write the x
	command_buffer.writeFloatLE(data.y_pos, 13);			//write the y
	command_buffer.writeFloatLE(data.z_pos, 17);			//write the z
	command_buffer.writeFloatLE(data.head_rot, 21);			//write the rotation_head
	command_buffer.writeFloatLE(data.is_grab, 25);			//write the grabber state (boolean)
	command_buffer.writeFloatLE(data.feed_rate/10, 29);		//write the start velocity
	command_buffer.writeFloatLE(data.feed_rate/10, 34);		//write the end velocity
	command_buffer.writeFloatLE(data.feed_rate, 37);		//write the max velocity

	command_buffer.writeFloatLE(0x5A, 41);					//write the tail

	return command_buffer;
};



Dobot.prototype.next = function () {

	  console.log('sending next command now');
	  this.sendBuffer(this._NEXT_COMMAND);


	  //update commandQueue and the next command
	  this.updateCommandQueue();

};


Dobot.prototype.disconnect = function() {

	this.sendBuffer(this.disconnect_command);
    this._STATE = "DISCONNECTED";

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


Dobot.prototype.updateCommandQueue = function () {

	//remove the first item of the command_queue and assign to next command
	//this._NEXT_COMMAND = this._COMMAND_QUEUE.shift();

}


Dobot.prototype.loadFile = function (path) {




}


module.exports = Dobot;
