/***************** LOAD DEPENDENCIES ****************/
var SerialPort = null;

try {										// loading serialport may fail on some systems
    SerialPort = require('serialport');     // requires LIBUSB available to OS
} catch (ex) {
    console.log('cannot find serialport module');
}

/*****************************************************/

var DobotSerial = function(connection) {
    var that	= this;

    var COM 	= this._CONNECTION.COM;
    var BAUD 	= this._CONNECTION.BAUD;

    var port_params = { baudrate : BAUD, parser: SerialPort.parsers.byteDelimiter(0x5A) };

    this._PORT = new SerialPort.SerialPort(COM, port_params, false);

	this._WAIT 					= 2000;
    this._RETRIES 				= 5;
    this._HEART_BEAT_INTERVAL 	= 60;			//60ms is expected/default by controller

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

    //this._MODE 					= null;			//MOVE, CUT, ETC. 				

    
    this._PORT.open(function(error) {

        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
        	console.log("port opened");
        	//after opened define all the callbacks and listeners
            that.start();
        }

    });
    

};


DobotSerial.prototype.open = function() {
    // Open port and define event handlers
    this._PORT.open(function(error) {
        if (error) {
			console.log("unable to open port: " + error);
        } 
        else {
        	console.log("port opened");
        	//after opened define all the callbacks and listeners
            that.start();
        }

    });

};


DobotSerial.prototype.start = function() {
	var that = this;

	this._heartbeater_update = setInterval(this.updateCommandQueue.bind(this), this._HEART_BEAT_INTERVAL);
	//this._heartbeater_next   = setInterval(this.next.bind(this), this._HEART_BEAT_INTERVAL);


    this._PORT.on('data', function (data) {

		data = new Buffer(data);
				
		if(data.length == 42) {
			that._STATE = "WAITING";
			that.receiveDobotState(data);
			//console.log(data.toString('hex'));
		}
		
    });

    this._PORT.on('close', function () {
        that.disconnect();
        that._STATE = "DISCONNECTED";

       	clearInterval(that._heartbeater_update);
    });

    this._PORT.on('error', function (error) {
		console.log("port ended with error: " + error);
		that._STATE = "ERROR";

       	clearInterval(that._heartbeater_update);

    });

	this.sendBuffer(this.start_command);
	//this._STATE = "CONNECTED";

};


DobotSerial.prototype.runProgram = function() {
	if(this._FILE_LOADED) {
		this._PROGRAM_STATE = "STARTED";
		this.next();
		//this._STATE	= "WAITING";
	}
	else {
		console.log("there is no program loaded");
	}

};


DobotSerial.prototype.streamProgram = function() {
	this._PROGRAM_STATE = "STREAMING";
	this._STATE 		= "STREAMING";   	//"WAITING" is ready for next command, "RUNNING" is a current program

	this.next();
	//this._STATE	= "WAITING";

};

	
DobotSerial.prototype.next = function () {

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


DobotSerial.prototype.disconnect = function() {

	this.sendBuffer(this.disconnect_command);
    this._STATE = "DISCONNECTED";
   	clearInterval(this._heartbeater_update);

    this.close();
    console.log("disconnected dobot.");

};


DobotSerial.prototype.close = function () {
    this._PORT.close(function(error) {
        if (error) {
            console.log("error closing the port: " + error);
        }
    });

   	clearInterval(this._heartbeater_update);
	console.log("closed serialport.");
};


DobotSerial.prototype.pause = function() {
    this._STATE = "PAUSED";
   	clearInterval(this._heartbeater_update);

  	console.log("paused.");
};


DobotSerial.prototype.resume = function() {
    this._STATE = "CONNECTED";
	this._heartbeater_update = setInterval(this.updateCommandQueue.bind(this), this._HEART_BEAT_INTERVAL);

  	console.log("paused.");
};


//send the command buffered command over the serialport
DobotSerial.prototype.sendBuffer = function (buffer) {
    
    try {
    	//console.log("sending: " + buffer.toString('hex'));
        this._PORT.write(buffer);
    } 
    catch (error) {
        console.log("error sending buffer: " + error);
    }

};



module.exports = DobotSerial;
