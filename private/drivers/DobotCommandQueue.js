var DobotCommandQueue = function( ) { };


DobotCommandQueue.prototype.updateCommandQueue = function () {	//updates next() if more commands to send

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

module.exports = DobotCommandQueue;