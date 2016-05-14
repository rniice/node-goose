/*************** LOAD DEPENDENCIES *****************/
//var util		= require('util');
var modelo		= require('modelo'); //to support multiple inheritance


/***************** LOAD COMPONENTS *****************/
var DobotSerial 			= require('./DobotSerial');
var DobotFileManager 		= require('./DobotFileManager');
var DobotCommandBuffer 		= require('./DobotCommandBuffer');
var DobotCommandQueue 		= require('./DobotCommandQueue');
var DobotJogCommand 		= require('./DobotJogCommand');
var DobotGcodeInterpreter	= require('./DobotGcodeInterpreter');
var DobotResponseParser		= require('./DobotResponseParser');
var DobotComputerVision		= require('./DobotComputerVision');



/************** DOBOT CONSTRUCTOR ******************/
var Dobot = function(connection) {
	//var that = this;

	//generic connection, for Dobot of form: {COM: XY, BAUD: XYZ}
	this._CONNECTION = connection;

	DobotSerial.call(this);				//superclass constructor
	DobotFileManager.call(this);		//superclass constructor
	DobotCommandBuffer.call(this);		//superclass constructor
	DobotCommandQueue.call(this);		//superclass constructor
	DobotJogCommand.call(this);			//superclass constructor
	DobotGcodeInterpreter.call(this);	//superclass constructor
	DobotResponseParser.call(this);		//superclass constructor
	DobotComputerVision.call(this);		//superclass constructor

};


/**** EXTEND DOBOT BASE CLASS WITH MULTIPLE INHERITANCE*******/
modelo.inherits(Dobot,DobotSerial, DobotFileManager,
				DobotCommandBuffer, DobotCommandQueue,
				DobotJogCommand, DobotGcodeInterpreter,
				DobotResponseParser, DobotComputerVision);


/*************** EXPORT DOBOT CLASS ****************/
module.exports = Dobot;
