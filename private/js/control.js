var myApp = angular.module('myApp', ['btford.socket-io', 'ngTouch', 'rzModule', 'ui.bootstrap']);

myApp.factory('mySocket', function (socketFactory) {
  return socketFactory();
});

//var base_query = "http://localhost:8080";
var base_query = "http://localhost:80";

myApp.controller('userCtrl', ['$scope', '$http', '$interval', '$timeout', '$window', 'mySocket', function($scope,$http,$interval,$timeout,$window,mySocket) {
  //$TouchProvider.ngClickOverrideEnabled(true);  //override onClick using angular with the touch provider library for mobile devices

  var cameraImageSourceURL = "http://localhost:8080/status/camera";
  var cameraInterval       = null;

  $scope.server_response   = null;
  $scope.dobot_state       = null;

  /*********LEFT COLUMN CONTROL BUTTONS********/

  $scope.connectDobot = function(){
    mySocket.emit('dobot client', { connect: true });
    $window.updateStateResponseInterval = setInterval(function(){
      mySocket.emit({getState: true});
    },2000);

  };

  $scope.disconnectDobot = function(){
    mySocket.emit('dobot client', {disconnect: true});
    clearInterval($window.updateStateResponseInterval);
  };

  $scope.pauseDobot = function(){
    mySocket.emit('dobot client', {pause: true});
  };

  $scope.resumeDobot = function(){
    mySocket.emit('dobot client', {resume: true});
  };

  $scope.runStreamDobot = function(){
    mySocket.emit('dobot client', {streamProgram: true});
  };

  $scope.checkDobotState = function(){
    mySocket.emit('dobot client', {getState: true});
  };

  $scope.startCamera = function(){
    mySocket.emit('dobot client', {startCamera: true});

    //delay before accessing the camera api
    $timeout(function(){
      var c=0;
      cameraInterval=$interval(function(){
        mySocket.emit('dobot client', {getCamera: true});
        },1000);
    },2000);
  };

  $scope.stopCamera = function() {
    if(angular.isDefined(cameraInterval)) {
      $interval.cancel(cameraInterval);
      cameraInterval=undefined;
      //$scope.message="Timer is killed :-(";
    }
  };

  $scope.startTrackFace = function(){
    mySocket.emit('dobot client', {startFaceTracking: true});
  };

  /*********************************************/

  
  /*********JOG MOVEMENT CONTROL BUTTONS********/

  $scope.jogStop = function(){
    mySocket.emit('dobot client', {jog: true, axis: "STOP", direction: null});
  }; 

  $scope.jogXpos = function(){
    mySocket.emit('dobot client', {jog: true, axis: "X", direction: 1});
  };

  $scope.jogXneg = function(){
    mySocket.emit('dobot client', {jog: true, axis: "X", direction: -1});
  };

  $scope.jogYpos = function(){
    mySocket.emit('dobot client', {jog: true, axis: "Y", direction: 1});
  };

  $scope.jogYneg = function(){
    mySocket.emit('dobot client', {jog: true, axis: "Y", direction: -1});
  };

  $scope.jogZpos = function(){
    mySocket.emit('dobot client', {jog: true, axis: "Z", direction: 1});
  };

  $scope.jogZneg = function(){
    mySocket.emit('dobot client', {jog: true, axis: "Z", direction: -1});
  };

  //put in rotation of each axis in table too



  /*********************************************/

  /*********EFFECTOR CONTROL BUTTONS********/

  $scope.jogRpos = function(){
    mySocket.emit('dobot client', {jog: true, axis: "R", direction: 1});
  };

  $scope.jogRneg = function(){
    mySocket.emit('dobot client', {jog: true, axis: "R", direction: -1});
  };

  $scope.jogGRPopen = function(){
    mySocket.emit('dobot client', {jog: true, axis: "GRP", direction: 1});
  };

  $scope.jogGRPclose = function(){
    mySocket.emit('dobot client', {jog: true, axis: "GRP", direction: -1});
  };

  $scope.jogPUMPon = function(){
    mySocket.emit('dobot client', {jog: true, axis: "P", direction: 1});
  };

  $scope.jogPUMPoff = function(){
    mySocket.emit('dobot client', {jog: true, axis: "P", direction: -1});
  };

  $scope.jogLSRon = function(){
    mySocket.emit('dobot client', {jog: true, axis: "LSR", direction: 1});
  };

  $scope.jogLSRoff = function(){
    mySocket.emit('dobot client', {jog: true, axis: "LSR", direction: -1});
  };

  /*********************************************/


  /************** UPLOAD PROGRAM ***************/

  $scope.loadProgramDobot = function(){
    mySocket.emit('dobot client', {loadProgram: true});
  };

  $scope.runProgramDobot = function(){
    mySocket.emit('dobot client', {runProgram: true});
  };

  /*********************************************/

  /* CLIENT SOCKET LISTENERS */
  
  mySocket.on('server response', function(data) {

    if(data.message) {
      console.log("message from server: " + data.message);
    }
    else if(data.dobotState) {
      $scope.state_x_pos            = data.dobotState.x_pos.toFixed(1);
      $scope.state_y_pos            = data.dobotState.y_pos.toFixed(1);
      $scope.state_z_pos            = data.dobotState.z_pos.toFixed(1);
      $scope.state_head_rot         = data.dobotState.head_rot.toFixed(1);
      $scope.state_base_angle       = data.dobotState.base_angle.toFixed(1);
      $scope.state_long_arm_angle   = data.dobotState.long_arm_angle.toFixed(1);
      $scope.state_short_arm_angle  = data.dobotState.short_arm_angle.toFixed(1);
      $scope.state_paw_arm_angle    = data.dobotState.paw_arm_angle.toFixed(1);
      $scope.state_is_grab          = data.dobotState.is_grab;
      $scope.state_gripper_angle    = data.dobotState.gripper_angle.toFixed(1);

      mySocket.emit('dobot client', { message: 'Client Received Dobot State' });
    }
    else if(data.cameraImage) {
      $scope.cameraImage  = data.cameraImage;
    }

  });


  //USER CONFIGURATION CHANGE DETECTION
  /*
  $scope.slider_nozzle_temp = {
    value: 220,
    options: {
      id: 'nozzle-temp',
      floor: 120,
      ceil: 300,
      onChange: function(sliderId, temp_nozzle) {
        $scope.changeTempExtrudeDefault(temp_nozzle);
        //alert("nozzle temp value is: " + temp_nozzle);
      },
      translate: function(temp_nozzle) {
        return temp_nozzle + '\u00B0' + 'C';
      }
    }
  };
  */
}]);

