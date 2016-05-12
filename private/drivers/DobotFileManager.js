/*************** LOAD DEPENDENCIES *****************/
var fs 				= require('fs');			//fs for loading files to run

/**************** DOBOT FILEMANAGER CONSTRUCTOR ******************/
var DobotFileManager = function( ) { };


DobotFileManager.prototype.loadProgram = function (path) {		//utf-8 encoded Gcode string, newline delimited

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

/*************** EXPORT DOBOT FILEMANAGER CLASS ****************/
module.exports = DobotFileManager;