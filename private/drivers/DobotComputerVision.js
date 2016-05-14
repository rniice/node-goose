/*************** LOAD DEPENDENCIES *****************/
try{
	var cv = require('../node-opencv/lib/opencv');
	} 
catch (e){
	  console.log("Couldn't load opencv bindings:", e)
	}

/**************** DOBOT COMPUTER VISION CONSTRUCTOR ******************/
var DobotComputerVision = function( ) { 
	var that = this;

	this._camera = null;
	this._cameraWindow = null;

	try {
		this._camera 			= new cv.VideoCapture(0);
		this._cameraWindow 		= new cv.NamedWindow('Video', 0)

		setInterval(function() {
			that._camera.read(function(err, im) {
				if (err) throw err;
					console.log(im.size())
				if (im.size()[0] > 0 && im.size()[1] > 0){
					that._cameraWindow.show(im);
				}
					that._cameraWindow.blockingWaitKey(0, 50);
			});
		}, 20);

	} catch (e){
	  console.log("Couldn't start camera:", e)
	}


};


DobotComputerVision.prototype.trackObject = function (object_params) {	



};

/*************** EXPORT DOBOT COMPUTER VISION CLASS ****************/
module.exports = DobotComputerVision;