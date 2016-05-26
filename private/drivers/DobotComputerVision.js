/*************** LOAD DEPENDENCIES *****************/
var request = require('request');

try{
	var cv = require('../node-opencv/lib/opencv');
	} 
catch (e){
	  console.log("Couldn't load opencv bindings:", e)
	}

/**************** DOBOT COMPUTER VISION CONSTRUCTOR ******************/
var DobotComputerVision = function( ) { 

	this._base_query 				= "http://localhost:80";

	this._camera 					= null;
	this._cameraWindow 				= null;
	this._cameraImage				= null;
	this._cameraImageTracked		= null;

	this._cameraImageWidthCenter	= 640/2;	//pixels
	this._cameraImageHeightCenter	= 480/2;	//pixels

	this._cameraTrackingState		= false;
	this._cameraTrackingPrimary		= null;

	this._cameraTrackingTolerance	= 20;		//number of pixels to consider point same
	this._cameraTrackingSamples		= 5;		//number of tracked samples for average object position
	this._cameraTrackingObjectX		= [];		//array to hold last 10 results
	this._cameraTrackingObjectY		= [];		//array to hold last 10 results
	this._cameraTrackingObjectZ		= [];		//array to hold last 10 results

	this._cameraTrackingObjectAVG_X	= null;
	this._cameraTrackingObjectAVG_Y	= null;
	this._cameraTrackingObjectAVG_Z	= null;

	this._cameraTrackingObject_X_done = false;
	this._cameraTrackingObject_Y_done = false;	
	this._cameraTrackingObject_Z_done = false;
};


DobotComputerVision.prototype.startCamera = function (params) {
	var that = this;		//shallow reference

	try {
	  	this._camera 			= new cv.VideoCapture(0);
	  	//this._cameraWindow 	= new cv.NamedWindow('Video', 0);
	  
		setInterval(function() {
			var ref = that;		//another reference variable...ugh callbacks= /

			that._camera.read(function(err, im) {
				if (err) {
					throw err;
				}
				//console.log(im.size())
				else if (im.size()[0] > 0 && im.size()[1] > 0){
					ref._cameraImage = im;

					if(ref._cameraTrackingState === false) {
						ref._cameraImageTracked	= im;		
					}
					//ref._cameraWindow.show(im);
					//ref.trackFace();
				}
			});
			
		}, 200);
	  
	} catch (e){
	  console.log("Couldn't start camera:", e)
	}

};


DobotComputerVision.prototype.startTrackFace = function (params) {

	var that 			= this;
	//var tracking_rate 	= params.tracking_rate | 200;
	var tracking_rate = 400;

	setInterval(function() {
		that.trackFace();
		that.trackObjectYZPlane();
		//console.log(that._cameraTrackingPrimary);
	}, tracking_rate);

};


DobotComputerVision.prototype.updateVisionControlMode = function (params) {	



};


DobotComputerVision.prototype.trackObject = function (object_params) {	



};


DobotComputerVision.prototype.trackFace = function () {

	var that = this;
	this._cameraTrackingState = true;


	var COLOR = [0, 255, 0];  	// draw green rectangle
	var thickness = 2;      	// default 1

	try{

	  	this._cameraImage.detectObject('../node-opencv/data/haarcascade_frontalface_alt2.xml', {}, function(err, faces) {
	  	//this._cameraImage.detectObject('../node-opencv/data/haarcascade_frontalface_default.xml', {}, function(err, faces) {

		    if(faces.length > 0) {
			    for (var i = 0; i < faces.length; i++) {
			        face = faces[i];			        //TO DO: need to include some time averaging for consistency
			        //console.log("face: " + i + " is at x = " + face.x + " and y = " + face.y);

					that._cameraImageTracked = that._cameraImage;             //set cameraImageTracked to base image
			        that._cameraImageTracked.rectangle([face.x, face.y], [face.width, face.height], COLOR, 2);  //draw a rectangle around face

			        if (i === 0) {
			        	//console.log("in i === 0 loop");
			   			that._cameraTrackingPrimary	= {primaryX:face.x, primaryY:face.y, primary_width:face.width, primary_height: face.height};
			        }
			    }
		    }
		    else {
		    	that._cameraImageTracked = that._cameraImage;             //set cameraImageTracked to base image
		    	that._cameraTrackingPrimary = null;
		    }
	  	});
	} catch (error) {
		console.log(error);
		that._cameraTrackingPrimary = null;
	}

};


//do some averaging of the discovered faces


//follow in YZ Plane ( transform: x'-->y y'-->z )
DobotComputerVision.prototype.trackObjectYZPlane = function() {
	
	if(this._cameraTrackingPrimary !== null) {
		var current_y = this._cameraTrackingPrimary.primaryX;	//map X to Y
		var current_z = this._cameraTrackingPrimary.primaryY;	//map Y to Z

		this._cameraTrackingObjectY.push(current_y);	//add new data point
		this._cameraTrackingObjectZ.push(current_z);	//add new data point

		if(this._cameraTrackingObjectY.length > this._cameraTrackingSamples) {
			this._cameraTrackingObjectY.shift();
			this._cameraTrackingObjectZ.shift();

			//remove anything in the trackedobjects that is outside of the tolerance from average
			this._cameraTrackingObjectAVG_Y	= blockedAverageArray(this._cameraTrackingObjectY, this._cameraTrackingTolerance).toFixed(0);
			this._cameraTrackingObjectAVG_Z	= blockedAverageArray(this._cameraTrackingObjectZ, this._cameraTrackingTolerance).toFixed(0);
		
			console.log("object Y = " + this._cameraTrackingObjectAVG_Y);
			//console.log("object Z = " + this._cameraTrackingObjectAVG_Z);

		}

	}

	//console.log("y_average is: " + this._cameraTrackingObjectAVG_Y);
	//console.log("z_average is: " + this._cameraTrackingObjectAVG_Z);

	//jog move the robot until y and z approach center
	if ( (this._cameraTrackingObjectAVG_Y !== null) && (this._cameraTrackingObjectAVG_Z !== null) ) {
		
		//track on y first:
		if(!this._cameraTrackingObject_Y_done) {
			//check if object is to the right of center, and move right if it is:
			if( Math.abs(this._cameraTrackingObjectAVG_Y - this._cameraImageWidthCenter) < this._cameraTrackingTolerance ) {
		    	//getQuery(this._base_query + "/run/jog?axis=STOP" );
		    	this.jogMoveCartesian({axis: "STOP"});
		    	this._cameraTrackingObject_Y_done = true;
			}

			else if (this._cameraTrackingObjectAVG_Y > this._cameraImageWidthCenter) {
		    	//getQuery(this._base_query + "/run/jog?axis=Y&direction=-1" );
		    	this.jogMoveCartesian({axis: "Y", direction: -1});
		    	this._cameraTrackingObject_Y_done = false;

			}
			else {
		    	//getQuery(this._base_query + "/run/jog?axis=Y&direction=1" );
		    	this.jogMoveCartesian({axis: "Y", direction: 1});
		    	this._cameraTrackingObject_Y_done = false;
			}
		}
		//track on z second:
		else if (!this._cameraTrackingObject_Z_done) {
			//check if object is below of center, and move down if it is:
			if( Math.abs(this._cameraTrackingObjectAVG_Z - this._cameraImageHeightCenter) < this._cameraTrackingTolerance ) {
		    	//getQuery(this._base_query + "/run/jog?axis=STOP" );
		    	this.jogMoveCartesian({axis: "STOP"});
		    	this._cameraTrackingObject_Z_done = true;
			}
			else if (this._cameraTrackingObjectAVG_Z > this._cameraImageHeightCenter) {
		    	//getQuery(this._base_query + "/run/jog?axis=Z&direction=-1" );
		    	this.jogMoveCartesian({axis: "Z", direction: -1});
		    	this._cameraTrackingObject_Z_done = false;
			}
			else {
		    	//getQuery(this._base_query + "/run/jog?axis=Z&direction=1" );
		    	this.jogMoveCartesian({axis: "Z", direction: 1});
		    	this._cameraTrackingObject_Z_done = false;

			}
		}

		//double check to make sure object didn't move out of either range after tracking done previously
		else {  
			if( Math.abs(this._cameraTrackingObjectAVG_Y - this._cameraImageWidthCenter) < this._cameraTrackingTolerance ) {
		    	this._cameraTrackingObject_Y_done = false;
			}

			if( Math.abs(this._cameraTrackingObjectAVG_Z- this._cameraImageHeightCenter) < this._cameraTrackingTolerance ) {
		    	this._cameraTrackingObject_Z_done = false;

			}
		}

	} 

	//emergency stop if object dissapears
	/*else {
		//getQuery(this._base_query + "/run/jog?axis=STOP" );
		this.jogMoveCartesian({axis: "STOP"});
	} */
};

//follow in XY Plane


function blockedAverageArray (array, tolerance) {
	var array_length = array.length;

	//find the average of the whole array
	var average = array.reduce(function(previousVal, currentVal) {
		return previousVal + currentVal;
	})/array_length;

	//exlude anything that is outside of tolerance.	
	var blocked_average = array.reduce(function(previousVal, currentVal) {
		if( Math.abs(currentVal - average) < tolerance ){
			return previousVal + currentVal;
		}
		else {
			//console.log("discarding datapoint");
			array_length --;	//reduce count of average
			return previousVal;
		}
	})/array_length;

	//return blocked_average;
	return average;
}


function getQuery(address){
	//simple GET request
	console.log("get: " + address);
	request(address, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//console.log(response); 
		}
	});
}

/*************** EXPORT DOBOT COMPUTER VISION CLASS ****************/
module.exports = DobotComputerVision;