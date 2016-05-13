/**************** DOBOT GCODEINTERPRETER CONSTRUCTOR ******************/
var DobotGcodeInterpreter = function( ) { };


/*Take standard GCODE commands and convert into buffer structure per Dobot API
  G1 X[$FLOAT] Y[$FLOAT] Z[$FLOAT] RH[$FLOAT] GRP[$FLOAT] LSR[$FLOAT] F[$FLOAT]
*/

DobotGcodeInterpreter.prototype.sendDobotState = function(command) {
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

		//need to add PUMP for pump setting

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
				default_pause_time		: 0,		
				default_jump_height		: 0
			};

			this.jogMoveCartesian({axis: "LSR", direction: -1});			
			command_buffer = this.generateCommandBuffer(selected_state);

		}

		else if(command.indexOf('WRITE') > -1) {
			selected_state 	= {
				settings				: true,							//toggle the settings mode
				state           		: 9,
				playback_config			: 1,
				max_joint_move_speed	: 1,
				max_joint_move_accel 	: 1,
				max_servo_speed 		: 1,
				max_servo_accel 		: 1,
				max_linear_move_speed 	: 1,
				max_linear_move_accel	: 1,
				default_pause_time		: 0,		
				default_jump_height		: 0
			};

			this.jogMoveCartesian({axis: "LSR", direction: 1});			
			command_buffer = this.generateCommandBuffer(selected_state);

		}

		//extract selected configuration settings [implement later]


		//call function to create command buffer
		//command_buffer = this.generateCommandBuffer(selected_state);
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

/*************** EXPORT DOBOT GCODEINTERPRETER CLASS ****************/
module.exports = DobotGcodeInterpreter;