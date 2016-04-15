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

    this._MODE 					= null;			//MOVE, CUT, ETC. 				
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
	//var header          = buffer.readUInt8(0);  					//should register 0xA5

	var x_pos           = buffer.readFloatLE(1);					//effector coordinate system
	var y_pos           = buffer.readFloatLE(5);
	var z_pos           = buffer.readFloatLE(9);
	var head_rot        = buffer.readFloatLE(13);

	var base_angle      = buffer.readFloatLE(17);
	var long_arm_angle  = buffer.readFloatLE(21);					//long and short arm switched in 1.1 firmware
	var short_arm_angle = buffer.readFloatLE(25);					//long and short arm switched in 1.1 firmware

	var paw_arm_angle   = buffer.readFloatLE(29);
	var is_grab         = Boolean(buffer.readFloatLE(33));		//should be a boolean
	var gripper_angle	= buffer.readFloatLE(37)

	//var tail	        = buffer.readUInt8(41);						//should register 0x5A

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
		gripper_angle:  	gripper_angle
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
	if(command.indexOf('G') > -1 ) {
		var g_command 			= command.match(/^G([\d]+)/i)[1];
		var write_mode			= false;		
	}
	//see if it is a C configuration code
	else if(command.indexOf('C') > -1){
		var c_command 			= command.match(/^C([\d]+)/i)[1];
		var config_mode			= false;
	}

	else {
		console.log("not a G or C command");
	}


	//make G2 write mode?  G1 jog mode?

	if(g_command === '1') {

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
			if ( (lsr_power) || (lsr_power==0) ) { 
				lsr_power = parseFloat(lsr_power[1]); 
				write_mode = true;
			}
			//console.log("lsr_power is: " + lsr_power);

		var pen_state		= null;		//put a condition here that checks for writing, but not laser
			if (pen_state) { 
				pen_state = parseFloat(pen_state[1]); 
				write_mode = true;
			}
			//console.log("lsr_power is: " + lsr_power);


		//extract feed rate
		var feed_rate		= command.match(/F([+-]?[\d]+[\.]?[\d]+]?)/i);		
			if (feed_rate) { feed_rate = parseFloat(feed_rate[1]); }
			//console.log("feed_rate is: " + feed_rate);

		//create an object with the selected dobot command parameters
		var selected_state 	= {
			write           : write_mode,
			x_pos 			: x_coordinate,
			y_pos			: y_coordinate,
			z_pos 			: z_coordinate,
			head_rot 		: rh_angle,
			is_grab 		: grp_angle,
			laser_pwr 		: lsr_power,
			feed_rate		: feed_rate,
			settings		: false					//need to detect settings values from G code, break out of G1 loop
		};

		//console.log(selected_state);

		//call function to create command buffer
		command_buffer = this.generateCommandBuffer(selected_state);
		console.log("sending gcode: " + command);


	}

	else if ( c_command === '9' ) {

		var selected_state;							//create an object with the selected dobot command parameters

		if(command.indexOf('JUMP') > -1) {			//for the hacked jump mode without turning off lazer
			selected_state 	= {
				settings				: true,							//toggle the settings mode
				state           		: 9,
				playback_config			: 1,
				max_joint_move_speed	: 100,
				max_joint_move_accel 	: 200,
				max_servo_speed 		: 100,
				max_servo_accel 		: 200,
				max_linear_move_speed 	: 100,
				max_linear_move_accel	: 200,
				default_pause_time		: 1,		
				default_jump_height		: 0
			};
		}

		else if(command.indexOf('WRITE') > -1) {
			selected_state 	= {
				settings				: true,							//toggle the settings mode
				state           		: 9,
				playback_config			: 1,
				max_joint_move_speed	: 1,
				max_joint_move_accel 	: 1,
				max_servo_speed 		: 2,
				max_servo_accel 		: 2,
				max_linear_move_speed 	: 8,
				max_linear_move_accel	: 2,
				default_pause_time		: 0,		
				default_jump_height		: 0
			};

		}


		//extract selected configuration settings [implement later]


		//call function to create command buffer
		command_buffer = this.generateCommandBuffer(selected_state);
		console.log("sending gcode: " + command);	

	}


	else if ( c_command === '10' ) {



		/*
		state              = 10    float1
		playback speed adj = 0     float2
		playbackmove accel %       float3
		playbackmovspeed %         float4
		teachmodemovspeed %        float5


		//all other cells to 0

		*/


	}


	else {
		console.log("not a valid GCODE command");
	}

	return command_buffer;
};


Dobot.prototype.generateCommandBuffer = function(data) {		//create buffer to send to dobot from desired values from sendDobotState
	
	var command_buffer = new Buffer(42);						//create 42 byte buffer

	command_buffer[0] = 0xA5;									//write the header


	if(data.jog === true) {										//Jog Mode: Incremental, Linear (state = 7) or Angular (state = 2)
		var state = 7;											//assume linear jog (state = 7)
		var axis = data.axis;
		var speed = data.speed;

		command_buffer.writeFloatLE(state, 1);					//write the state
		command_buffer.writeFloatLE(axis, 5);					//write the axis
		command_buffer.writeFloatLE(speed, 29);					//write the start velocity  //moving mode

	}


	else if(data.write === true) {								//Write Mode: Laser or Pen Modes

		var state = 4;
		var is_laser = 0;

		if(data.laser_pwr > 0) {
			is_laser = 1;
		}
		

		command_buffer.writeFloatLE(state, 1);					//write the state
		command_buffer.writeFloatLE(1, 5);						//mode: 0 = writing, 1 = laser

		command_buffer.writeFloatLE(data.x_pos, 9);				//write the x (additive value)
		command_buffer.writeFloatLE(data.y_pos, 13);			//write the y (additive value)
		command_buffer.writeFloatLE(data.z_pos, 17);			//write the z (additive value)
		
		command_buffer.writeFloatLE(0, 21);						//reserved space
		
		command_buffer.writeFloatLE(is_laser, 25);				//write isLaser: 0 = laser OFF; 1 = laser ON

		command_buffer.writeFloatLE(data.feed_rate/2, 29);		//write the initial velocity 
		command_buffer.writeFloatLE(data.feed_rate/2, 33);		//write the final velocity
		command_buffer.writeFloatLE(data.feed_rate, 37);		//write the max velocity 


	}


	else if (data.settings === true) {							//configure the dobot settings per Dobot API

		command_buffer.writeFloatLE(data.state, 1);					
		command_buffer.writeFloatLE(data.playback_config, 5);		
		command_buffer.writeFloatLE(data.max_joint_move_speed, 9);	
		command_buffer.writeFloatLE(data.max_joint_move_accel, 13);	
		command_buffer.writeFloatLE(data.max_servo_speed, 17);	
		command_buffer.writeFloatLE(data.max_servo_accel, 21);	
		command_buffer.writeFloatLE(data.max_linear_move_speed, 25);
		command_buffer.writeFloatLE(data.max_linear_move_accel, 29);
		command_buffer.writeFloatLE(data.default_pause_time, 33);
		command_buffer.writeFloatLE(data.default_jump_height, 37);

	} 


	else { 														//target move mode, 3 = linear path coordinated; 6 = angular path coordinated
		var state = 3;											//cartesian target move mode

		command_buffer.writeFloatLE(state, 1);	//32831			//write the state
		command_buffer.writeFloatLE(0, 5);						//reserved, set to 0
		command_buffer.writeFloatLE(data.x_pos, 9);				//write the x (absolute value)
		command_buffer.writeFloatLE(data.y_pos, 13);			//write the y (absolute value)
		command_buffer.writeFloatLE(data.z_pos, 17);			//write the z (absolute value)
		command_buffer.writeFloatLE(0, 21);						//write the rotation_head [data.head_rot] 
		command_buffer.writeFloatLE(0, 25);						//write the grabber state (boolean) [data.is_grab]
		command_buffer.writeFloatLE(1, 29);						//moving mode [ 0 = jump, 1 = moveL, 2 = movelJ ]
		command_buffer.writeFloatLE(0, 33);						//write the gripper value [90 to -90]
		command_buffer.writeFloatLE(0, 37);						//write the pause time after action (units: sec)

	}

	command_buffer[41] = 0x5A;									//write the tail in all cases

	return command_buffer;
};



Dobot.prototype.next = function () {

	if ( this._COMMAND_JOG ) {
		this.sendBuffer(this._COMMAND_JOG);
		this._COMMAND_JOG = null;
	}

	else if( this._NEXT_COMMAND && (this._STATE == "WAITING") ) {
		var buffer = this.sendDobotState(this._NEXT_COMMAND);		//create buffer using gcode command
		
		this._NEXT_COMMAND = null;								//loaded command already, remove it
		this.sendBuffer(buffer);
		//this.sendBuffer(this.test_command);
	}


	/*else if ( this._COMMAND_JOG && (this._STATE == "STREAMING") ) {
		this.sendBuffer(this._COMMAND_JOG);
		this._COMMAND_JOG = null;
	}*/

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
    	//console.log("sending: " + buffer.toString('hex'));
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
			this._STATE = "WAITING";
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
			this._STATE = "WAITING";
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


//CARTESIAN JOG MODE COMMAND PARSING AND GENERATING BUFFER FROM SERVER
Dobot.prototype.jogMoveCartesian = function (args) {

	this._STATE == "STREAMING";

	var selection = args.axis;
	var direction = parseInt(args.direction);

	console.log("jog query received by server:\n" + "selection: " + selection + "\n" + "direction: " + direction);

	switch(selection) {
		case "STOP":    //when button click is ended
			var jog_command = this.generateCommandBuffer({"jog": true, "axis": 0, "speed": 40});
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			break;

		case "X":

			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 1, "speed": 40});
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 2, "speed": 40});
			}

			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			break;

		case "Y":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 3, "speed": 40});
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 4, "speed": 40});
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called
			
			break;

		case "Z":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 5, "speed": 40});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 6, "speed": 40});	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;

		case "R":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 7, "speed": 60});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 8, "speed": 60});  	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;

		case "P":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 9, "speed": 0});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 10, "speed": 0});  	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;	

		case "GRP":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 12, "speed": 50});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 11, "speed": 50});  	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;	

		case "LSR":
			if(direction>0) {   //positive direction
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 13, "speed": 0});  	//currently 1.1 firmware has this inverted
			}
			else {
				var jog_command = this.generateCommandBuffer({"jog": true, "axis": 14, "speed": 0});  	//currently 1.1 firmware has this inverted
			}
			this._COMMAND_JOG = jog_command; 	//loaded to be sent when next() is called

			break;	

		default: 
			console.log("not a valid jog command");
			console.log("--->selection is: " + selection);
			console.log("--->direction is: " + direction);
			break;

	}

	//this.sendBuffer(this._COMMAND_JOG);

}	


module.exports = Dobot;
