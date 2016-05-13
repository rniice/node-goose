/*************** LOAD DEPENDENCIES *****************/
var util		= require('util');


/************** DOBOT CONSTRUCTOR ******************/
var Dobot = function( ) { };


/***************** LOAD COMPONENTS *****************/
var DobotSerial 			= require('DobotSerial.js');
var DobotFileManager 		= require('DobotFileManager.js');
var DobotCommandBuffer 		= require('DobotCommandBuffer.js');
var DobotCommandQueue 		= require('DobotCommandQueue.js');
var DobotJogCommand 		= require('DobotJogCommand.js');
var DobotGcodeInterpreter	= require('DobotGcodeInterpreter.js');
var DobotResponseParser		= require('DobotResponseParser.js');

/************ EXTEND DOBOT BASE CLASS **************/
util.inherits(Dobot, DobotSerial);
util.inherits(Dobot, DobotFileManager);
util.inherits(Dobot, DobotCommandBuffer);
util.inherits(Dobot, DobotCommandQueue);
util.inherits(Dobot, DobotJogCommand);
util.inherits(Dobot, DobotGcodeInterpreter);
util.inherits(Dobot, DobotResponseParser);


/*************** EXPORT DOBOT CLASS ****************/
module.exports = Dobot;
