/***************** LOAD DEPENDENCIES ****************/

var _ 			= require('underscore'),
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

    this._STATE 				= "OPENED";   	//"WAITING" is ready for next command, "RUNNING" is a current program
    this._PROGRAM_STATE			= "NONE";		//NONE, STARTED, PAUSED, STOPPED
    this._WAIT 					= 2000;
    this._RETRIES 				= 5;
    this._HEART_BEAT_INTERVAL 	= 60;			//60ms is expected/default by controller

    this._CURRENT_COMMAND_INDEX = 0;
    this._NEXT_COMMAND			= null;
    this._COMMAND_QUEUE			= null;

    this._COMMAND_JOG			= null;			//used to handle jog type inputs, stores sampled one to send

    this._FILE_LOADED			= false;   		//file containing gcode to run
    this._GCODE_DATA			= null;	   		//currently no data loaded to run

	this._dobot_state			= null;			//status/position response from dobot

    // Open port and define event handlers
    this._PORT.open(function(error) {
        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
        	//after opened define all the callbacks and listeners
            that.start();
        }

    });
};


Dobot.prototype.start = function() {
	var that = this;

	this._heartbeater_update = setInterval(this.updateCommandQueue.bind(this), this._HEART_BEAT_INTERVAL);
	//this._heartbeater_next   = setInterval(this.next.bind(this), this._HEART_BEAT_INTERVAL);


    this._PORT.on('data', function (data) {

		data = new Buffer(data);
		//console.log("buffer rx length: " + data.length);
				
		if(data.length == 42) {
			that._STATE = "WAITING";
			that.receiveDobotState(data);
		}
		
    });

    this._PORT.on('close', function () {
        that.disconnect();
        that._STATE = "DISCONNECTED";

       	that._heartbeater.stop();
    });

    this._PORT.on('error', function (error) {
		console.log("port ended with error: " + error);
		that._STATE = "ERROR";

		that._heartbeater.stop();

    });

	this.sendBuffer(this.start_command);
	//this._STATE = "CONNECTED";

};


Dobot.prototype.runProgram = function() {
	if(this._FILE_LOADED) {
		this._PROGRAM_STATE = "STARTED";
		this.next();
		//this._STATE	= "WAITING";
	}
	else {
		console.log("there is no program loaded");
	}

};


Dobot.prototype.streamProgram = function() {
	this._PROGRAM_STATE = "STREAMING";
	this._STATE 		= "STREAMING";   	//"WAITING" is ready for next command, "RUNNING" is a current program

	this.next();
	//this._STATE	= "WAITING";

};


Dobot.prototype.receiveDobotState = function(buffer) {
	//this._STATE = "DATA_RECEIVED";

	//parse up the data buffer to extract Dobot state information
	//var header          = buffer.readUInt8(0);  		//should register 0xA5

	var x_pos           = buffer.readFloatLE(1);		//effector coordinate system
	var y_pos           = buffer.readFloatLE(5);
	var z_pos           = buffer.readFloatLE(9);
	var head_rot        = buffer.readFloatLE(13);

	var base_angle      = buffer.readFloatLE(17);
	var long_arm_angle  = buffer.readFloatLE(21);
	var short_arm_angle = buffer.readFloatLE(25);
	var paw_arm_angle   = buffer.readFloatLE(29);
	var is_grab         = buffer.readFloatLE(34);		//should be a boolean

	//var tail	        = buffer.readUInt8(37);			//should register 0x5A

	this._dobot_state = {
		//header: 			header, 
		x_pos: 				x_pos, 
		y_pos: 				y_pos, 
		z_pos: 				z_pos, 
		head_rot: 			head_rot,
		base_angle: 		base_angle, 
		long_arm_angle: 	long_arm_angle, 
		short_arm_angle: 	short_arm_angle, 
		paw_arm_angle: 		paw_arm_angle, 
		is_grab: 			is_grab,
		//tail: 				tail
	};

	//console.log("current robot state is: \n" + JSON.stringify(this._dobot_state, null, 2));
	this.next();	//send the next command if one is available

};

	
/*Take standard GCODE commands and convert into buffer structure per Dobot API
  G1 X[$FLOAT] Y[$FLOAT] Z[$FLOAT] RH[$FLOAT] GRP[$FLOAT] LSR[$FLOAT] F[$FLOAT]
*/

Dobot.prototype.sendDobotState = function(command) {
	var command_buffer = null;

	//verify it is a G code
	var g_command 			= command.match(/^G([\d]+)/i)[1];

	if(g_command == '1'){

		//extract x
		var x_coordinate	= command.match(/X([+-]?[\d]+[\.]?[\d]+]?)/i);
			if (x_coordinate) { x_coordinate = parseFloat(x_coordinate[1]); }
			//console.log("x_coordinate is: " + x_coordinate);

		//extract y
		var y_coordinate	= command.match(/Y([+-]?[\d]+[\.]?[\d]+]?)/i);
			if (y_coordinate) { y_coordinate = parseFloat(y_coordinate[1]); }
			//console.log("y_coordinate is: " + y_coordinate);

		//extract z
		var z_coordinate	= command.match(/Z([+-]?[\d]+[\.]?[\d]+]?)/i);
			if (z_coordinate) { z_coordinate = parseFloat(z_coordinate[1]); }
			//console.log("z_coordinate is: " + z_coordinate);

		//extract rotation head
		var rh_angle		= command.match(/RH([+-]?[\d]+[\.]?[\d]+]?)/i);	
			if (rh_angle) { rh_angle = parseFloat(rh_angle[1]); }
			//console.log("rh_angle is: " + rh_angle);

		//extract grip head
		var grp_angle		= command.match(/GRP([+-]?[\d]+[\.]?[\d]+]?)/i);		
			if (grp_angle) { grp_angle = parseFloat(grp_angle[1]); }
			//console.log("grp_angle is: " + grp_angle);

		//extract laser power
		var lsr_power		= command.match(/LSR([+-]?[\d]+[\.]?[\d]+]?)/i);
			if (lsr_power) { lsr_power = parseFloat(lsr_power[1]); }
			//console.log("lsr_power is: " + lsr_power);

		//extract feed rate
		var feed_rate		= command.match(/F([+-]?[\d]+[\.]?[\d]+]?)/i);		
			if (feed_rate) { feed_rate = parseFloat(feed_rate[1]); }
			//console.log("feed_rate is: " + feed_rate);

		//create an object with the selected dobot command parameters
		var selected_state 	= {
			x_pos 			: x_coordinate,
			y_pos			: y_coordinate,
			z_pos 			: z_coordinate,
			head_rot 		: rh_angle,
			is_grab 		: grp_angle,
			laser_pwr 		: lsr_power,
			feed_rate		: feed_rate
		};

		//console.log(selected_state);

		//call function to create command buffer
		command_buffer = this.generateCommandBuffer(selected_state);

	}

	else {
		console.log("not a valid GCODE command");
	}

	return command_buffer;
};


Dobot.prototype.generateCommandBuffer = function(data) {	//create buffer to send to dobot from desired values from sendDobotState
	
	var command_buffer = new Buffer(42);					//create 42 byte buffer

	command_buffer[0] = 0xA5;								//write the header


	if(data.jog == true) {									
		var state = 7;										//assume linear jog (state = 7)

		var axis = data.axis;
		var speed = data.speed;

		command_buffer.writeFloatLE(7, 1);	//32831					//write the state
		command_buffer.writeFloatLE(axis, 5);						//write the axis
		command_buffer.writeFloatLE(speed, 29);						//write the start velocity  //moving mode

	}

	else {
		//2 = single axis control; 7 = straight line control
		command_buffer.writeFloatLE(1, 1);	//32831					//write the state
		command_buffer.writeFloatLE(0, 5);						//write the axis ??????
		command_buffer.writeFloatLE(data.x_pos, 9);				//write the x
		command_buffer.writeFloatLE(data.y_pos, 13);			//write the y
		command_buffer.writeFloatLE(data.z_pos, 17);			//write the z

		command_buffer.writeFloatLE(data.head_rot, 21);			//write the rotation_head
		command_buffer.writeFloatLE(data.is_grab, 25);			//write the grabber state (boolean)
		//command_buffer.writeFloatLE(1, 29);						//moving mode [ 0 = jump, 1 = moveL, 2 = movelJ ]
		//command_buffer.writeFloatLE(data.feed_rate/10, 29);		//write the start velocity  //moving mode
		//command_buffer.writeFloatLE(data.feed_rate/10, 34);		//write the end velocity
		//command_buffer.writeFloatLE(data.feed_rate, 37);		//write the max velocity

	}

	command_buffer[41] = 0x5A;								//write the tail

	return command_buffer;
};



Dobot.prototype.next = function () {

	if( this._NEXT_COMMAND && (this._STATE == "WAITING") ) {
		var buffer = this.sendDobotState(this._NEXT_COMMAND);		//create buffer using gcode command
		
		this._NEXT_COMMAND = null;								//loaded command already, remove it
		this.sendBuffer(buffer);
		//this.sendBuffer(this.test_command);
	}

	else if ( this._COMMAND_JOG && (this._STATE == "STREAMING") ) {
		this.sendBuffer(this._COMMAND_JOG);
		this._COMMAND_JOG = null;
	}

	else {
		//console.log('no buffer to send right now');
		//console.log('STATE IS: ' + this._STATE);
	}

};


Dobot.prototype.disconnect = function() {

	this.sendBuffer(this.disconnect_command);
    this._STATE = "DISCONNECTED";

    this._heartbeater.stop();

    console.log("disconnected.");

};


Dobot.prototype.close = function () {
    this._PORT.close(function(err) {
        if (err) {
            console.log("error closing the port: " + error);
        }
    });

	this._heartbeater.stop();

	console.log("closed.");

};


Dobot.prototype.pause = function() {
    this._STATE = "PAUSED";
    this._heartbeater.pause();

  	console.log("paused.");

};


Dobot.prototype.resume = function() {
    this._STATE = "CONNECTED";
    this._heartbeater.resume();

  	console.log("paused.");

};


//send the command buffered command over the serialport
Dobot.prototype.sendBuffer = function (buffer) {
    
    try {
    	console.log("sending: ");
    	console.log(buffer.toString('hex'));
        this._PORT.write(buffer);
    } 
    catch (error) {
        console.log("error sending buffer: " + error);
    }

};


Dobot.prototype.updateCommandQueue = function () {	//updates next() if more commands to send

	//console.log("this._STATE is:       " + this._STATE);
	//console.log("this._NEXT_COMMAND is " + this._NEXT_COMMAND);

	if(this._FILE_LOADED) {

		if ( this._STATE == "WAITING" && !this._NEXT_COMMAND && (this._PROGRAM_STATE == "STARTED") ) {

			this._NEXT_COMMAND = this._GCODE_DATA[this._CURRENT_COMMAND_INDEX];
			//console.log("command added: " + this._NEXT_COMMAND);
			
			this._CURRENT_COMMAND_INDEX ++;
			this._STATE = "RUNNING";  
		}
		
		else if ( this._STATE == "WAITING" && this._NEXT_COMMAND) {
			//this.next();
			this._STATE = "RUNNING";  
		}

		else if ( this._STATE == "STREAMING" ) {
			this.next();

		}

		else {
			//this._STATE = "RUNNING";
			//console.log("program state is: " + this._PROGRAM_STATE);
			//console.log("no current gcode commands to send!!");
			//don't update, still waiting for system to want a new command
			//send over standard ping command if necessary

		}

	}

	else {  //no file is loaded, currently in stream mode
		if ( this._STATE == "STREAMING" ) {
			this.next();

		}

		//console.log("no file loaded, in stream mode awaiting command");
	}

};


Dobot.prototype.loadProgram = function (path) {		//utf-8 encoded Gcode string, newline delimited

	var that = this;

	fs.readFile(path, 'utf8', function(error,data) {
		if(error){
			console.log("there was an error reading the file");
		}
		else {
			console.log("the program has been loaded!");
			that._GCODE_DATA			= data.split('\n');		//array of gcode commands
			that._FILE_LOADED			= true;   				//file containing gcode to run
		}
	});

};


//Temporary Reverse Engineered Methods for Jog X-Y-Z
Dobot.prototype.jogMoveCartesian = function (args) {

	var selection = args.axis;
	var direction = parseInt(args.direction);

	console.log("jog query received by server:\n" + "selection: " + selection + "\n" + "direction: " + direction);

	switch(selection) {
		case "STOP":    //when button click is ended
			var jog_command = this.generateCommandBuffer({"jog": true, "axis": 0, "speed": 20});
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			break;

		case "X":

			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 1, "speed": 20});
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 2, "speed": 20});
			}

			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			break;

		case "Y":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 3, "speed": 20});
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 4, "speed": 20});
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			
			break;

		case "Z":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 6, "speed": 20});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 5, "speed": 20});	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;

		case "R":
			if(direction>0) {   //positive direction
				var jog_command = new Buffer([0xa5,0x00,0x00,0xe0,0x40,0x00,0x00,0xe0,0x40,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x5a]);
			}
			else {
				var jog_command = new Buffer([0xa5,0x00,0x00,0xe0,0x40,0x00,0x00,0x00,0x41,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x5a]);
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;

		case "P":
			if(direction>0) {   //positive direction
				var jog_command = new Buffer([0xa5,0x00,0x00,0xe0,0x40,0x00,0x00,0x10,0x41,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x5a]);
			}
			else {
				var jog_command = new Buffer([0xa5,0x00,0x00,0xe0,0x40,0x00,0x00,0x20,0x41,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x5a]);
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;		

		default: 
			console.log("not a valid jog command");
			console.log("--->selection is: " + selection);
			console.log("--->direction is: " + direction);
			break;

	}

	this.sendBuffer(this._COMMAND_JOG);

}	


module.exports = Dobot;
