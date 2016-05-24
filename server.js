/* LOAD NPM DEPENDENCIES */
var app 	= require('express')();
var server 	= require('http').Server(app);
var io 		= require('socket.io')(server);
var path 	= require('path');
var url 	= require('url');

/* LOAD DOBOT CLASS DEPENDENCIES */
var Dobot = require('./private/drivers/Dobot');
var dobotInstance = null; //placeholder

/* START UP THE SERVER */
var port 	= process.env.PORT || 80;

server.listen(port, function() {
	console.log('Our app is running on http://localhost:' + port);
});



// make express look in the public directory for assets (css/js/img)
var public_directory = path.join(__dirname, "public")

app.use(express.static(public_directory));

//MAIN landing URL
app.get('/', function(req, res) {
	//console.log("operating in dirname: " + __dirname);
	res.sendFile(path.join(public_directory + '/index.html'));
});


//Socket IO events
io.on('connection', function (socket) {

	//server sends "dobot server" data packets
  socket.emit('dobot server', { data: 'socket connected' });

  //server receives "dobot client" data packets
  socket.on('dobot client', function (data) {
		/*if(data.login == true) {
			//parse out data.username
			//parse out data.password
			//set authenticated true
		} */

		if(data.connect === true) {
			console.log('received request to connect dobot serialport ...');
			dobotInstance = new Dobot( {COM:'COM11', BAUD:9600} ); 		//V1.1 Firmware
			socket.emit('server response', { message: 'Connected to Dobot' });
		}
		else if(data.disconnect === true) {
			console.log('received request to disconnect dobot serialport ...');
			dobotInstance.disconnect();
			socket.emit('server response', { message: 'Disconnected from Dobot' });
		}
		else if(data.pause === true) {
			console.log('received request to pause Dobot ...');
			dobotInstance.pause();
			socket.emit('server response', { message: 'Paused Dobot' });
		}
		else if(data.resume === true) {
			console.log('received request to resume Dobot ...');
			dobotInstance.resume();
			socket.emit('server response', { message: 'Resumed Dobot' });
		}
		else if(data.streamProgram === true) {
			console.log('received request to stream mode Dobot ...');
			dobotInstance.streamProgram(); 
			socket.emit('server response', { message: 'Streaming Dobot Mode' });
		}
		else if(data.loadProgram === true) {
			console.log('received request to load gcode program ...');
			dobotInstance.loadProgram('./test/node_goose_targets.gcode');
			socket.emit('server response', { message: 'Program Loaded' });
		}
		else if(data.runProgram === true) {
			console.log('received request to run gcode program ...');
			dobotInstance.runProgram(); 
			socket.emit('server response', { message: 'Running Program' });
		}
		else if(data.startCamera === true) {
			console.log('received request to start dobot camera ...');
			dobotInstance.startCamera(); 
			socket.emit('server response', { message: 'Enabling Dobot Camera' });
		}
		else if(data.startFaceTracking === true) {
			console.log('received request to stream mode Dobot ...');
			dobotInstance.startTrackFace(); 
			socket.emit('server response', { message: 'Enabling Dobot Face Tracking' });
		}		

		else if(data.jog === true) {
			var query = url.parse(data.url,true).query;  
			dobotInstance.jogMoveCartesian( query );
			res.send('Jog Command Sent');
			socket.emit('server response', { message: 'Jog Command Sent' });
		}	

		else if(data.getState === true) {
			var dobot_state = dobotInstance._dobot_state;
			//socket.emit('server response', { message: dobot_state });
			socket.emit('server response', dobot_state);
		}	

		else if(data.getCamera === true) {
			var img = dobotInstance._cameraImageTracked.toBuffer(); 	//convert the matrix into an image buffer
			//socket.emit('server response', { message: img });
			socket.emit('server response', img);
		}			


		else{
			console.log('did not receive foobar!!! = (');
		}
  });

  socket.on('disconnect', function(data){
		console.log('client disconnected');
  });

});


/*

//dobotInstance.computerVisionProgram();

*/


