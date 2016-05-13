/*************** LOAD DEPENDENCIES *****************/
var util		= require('util');

/***************** LOAD COMPONENTS *****************/
var DobotSerial 			= require('./DobotSerial');
var DobotFileManager 		= require('./DobotFileManager');
var DobotCommandBuffer 		= require('./DobotCommandBuffer');
var DobotCommandQueue 		= require('./DobotCommandQueue');
var DobotJogCommand 		= require('./DobotJogCommand');
var DobotGcodeInterpreter	= require('./DobotGcodeInterpreter');
var DobotResponseParser		= require('./DobotResponseParser');



/************** DOBOT CONSTRUCTOR ******************/
var Dobot = function(connection) {
	//var that = this;

	//generic connection, for Dobot of form: {COM: XY, BAUD: XYZ}
	this._CONNECTION = connection;

	DobotSerial.call(this);
	DobotFileManager.call(this);
	DobotCommandBuffer.call(this);
	DobotCommandQueue.call(this);
	DobotJogCommand.call(this);
	DobotGcodeInterpreter.call(this);
	DobotResponseParser.call(this);

};


/************ EXTEND DOBOT BASE CLASS **************/
util.inherits(Dobot, DobotSerial);
util.inherits(Dobot, DobotFileManager);
util.inherits(Dobot, DobotCommandBuffer);
util.inherits(Dobot, DobotCommandQueue);
util.inherits(Dobot, DobotJogCommand);
util.inherits(Dobot, DobotGcodeInterpreter);
util.inherits(Dobot, DobotResponseParser);


//Dobot.open();


/*************** EXPORT DOBOT CLASS ****************/
module.exports = Dobot;
