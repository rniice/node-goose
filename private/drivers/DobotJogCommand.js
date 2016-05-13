var DobotJogCommand = function( ) {
    this._COMMAND_JOG			= null;			//used to handle jog type inputs, stores sampled one to send
};


//CARTESIAN JOG MODE COMMAND PARSING AND GENERATING BUFFER FROM SERVER
DobotJogCommand.prototype.jogMoveCartesian = function (args) {

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

};


module.exports = DobotJogCommand;
