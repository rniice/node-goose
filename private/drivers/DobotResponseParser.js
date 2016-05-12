/**************** DOBOT RESPONSEPARSER CONSTRUCTOR ******************/
var DobotResponseParser = function( ) { };


DobotResponseParser.prototype.receiveDobotState = function(buffer) {
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

/*************** EXPORT DOBOT FILEMANAGER CLASS ****************/
module.exports = DobotResponseParser;