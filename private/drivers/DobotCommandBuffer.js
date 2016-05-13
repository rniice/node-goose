/**************** DOBOT COMMANDBUFFER CONSTRUCTOR ******************/
var DobotCommandBuffer = function( ) { };


DobotCommandBuffer.prototype.generateCommandBuffer = function(data) {		//create buffer to send to dobot from desired values from sendDobotState
	
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

/*************** EXPORT DOBOT COMMANDBUFFER CLASS ****************/
module.exports = DobotCommandBuffer;