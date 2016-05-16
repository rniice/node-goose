//var myApp = angular.module('myApp', ['ngTouch', 'rzModule', 'ui.bootstrap', 'ngSanitize']);
var myApp = angular.module('myApp', ['ngTouch', 'rzModule', 'ui.bootstrap']);

var base_query = "http://localhost:8080";
//var base_query = "https://stark-tundra-XXYYZZ.herokuapp.com/";

//myApp.controller('userCtrl', ['$scope', '$http', '$interval', '$window', '$sanitize', function($scope,$http,$interval,$window,$sanitize) {
myApp.controller('userCtrl', ['$scope', '$http', '$interval', '$window', function($scope,$http,$interval,$window) {
  //$TouchProvider.ngClickOverrideEnabled(true);  //override onClick using angular with the touch provider library for mobile devices
  var cameraImageSourceURL = "http://localhost:8080/status/camera";
  var cameraInterval       =  null;

	$scope.server_response     = null;
  $scope.dobot_state         = null;


  /*********LEFT COLUMN CONTROL BUTTONS********/
  $scope.connectDobot = function(){
    getQuery(base_query + "/run/connect");

    $window.updateStateResponseInterval = setInterval(function(){
      getState(base_query + "/status/state");
      },2000);

  };

  $scope.disconnectDobot = function(){
    getQuery(base_query + "/run/disconnect");
    clearInterval($window.updateStateResponseInterval);
  };

  $scope.pauseDobot = function(){
    getQuery(base_query + "/run/pause");
  };

  $scope.resumeDobot = function(){
    getQuery(base_query + "/run/resume");
  };

  $scope.runStreamDobot = function(){
    getQuery(base_query + "/run/streamProgram");
  };

  $scope.checkDobotState = function(){
    getState(base_query + "/status/state");
  };


  $scope.startCamera = function(){
    getQuery(base_query + "/run/startCamera");

    var c=0;
    cameraInterval=$interval(function(){
        //$scope.message="This DIV is refreshed "+c+" time.";
        $scope.cameraImageSource = cameraImageSourceURL + '?' + "c=" + c;

        if(c===100){
            c=0;
        } else {
          c++;
        }
      },100);

  };

  $scope.stopCamera = function() {

    if(angular.isDefined(cameraInterval)) {
      $interval.cancel(cameraInterval);
      cameraInterval=undefined;
      //$scope.message="Timer is killed :-(";
    }

  };


  /*********************************************/

  
  /*********JOG MOVEMENT CONTROL BUTTONS********/
  $scope.jogStop = function(){
    getQuery(base_query + "/run/jog?axis=STOP" );
  }; 

  $scope.jogXpos = function(){
    getQuery(base_query + "/run/jog?axis=X&direction=1" );
  };

  $scope.jogXneg = function(){
    getQuery(base_query + "/run/jog?axis=X&direction=-1" );
  };

  $scope.jogYpos = function(){
    getQuery(base_query + "/run/jog?axis=Y&direction=1" );
  };

  $scope.jogYneg = function(){
    getQuery(base_query + "/run/jog?axis=Y&direction=-1" );
  };

  $scope.jogZpos = function(){
    getQuery(base_query + "/run/jog?axis=Z&direction=1" );
  };

  $scope.jogZneg = function(){
    getQuery(base_query + "/run/jog?axis=Z&direction=-1" );
  };


  //put in rotation of each axis in table too



  /*********************************************/

  /*********EFFECTOR CONTROL BUTTONS********/
  
  $scope.jogRpos = function(){
    getQuery(base_query + "/run/jog?axis=R&direction=1" );
  };

  $scope.jogRneg = function(){
    getQuery(base_query + "/run/jog?axis=R&direction=-1" );
  };

  $scope.jogGRPopen = function(){
    getQuery(base_query + "/run/jog?axis=GRP&direction=1" );
  };

  $scope.jogGRPclose = function(){
    getQuery(base_query + "/run/jog?axis=GRP&direction=-1" );
  };

  $scope.jogPUMPon = function(){
    getQuery(base_query + "/run/jog?axis=P&direction=1" );
  };

  $scope.jogPUMPoff = function(){
    getQuery(base_query + "/run/jog?axis=P&direction=-1" );
  };

  $scope.jogLSRon = function(){
    getQuery(base_query + "/run/jog?axis=LSR&direction=1" );
  };

  $scope.jogLSRoff = function(){
    getQuery(base_query + "/run/jog?axis=LSR&direction=-1" );
  };

  /*********************************************/


  /************** UPLOAD PROGRAM ***************/

  $scope.loadProgramDobot = function(){
    getQuery(base_query + "/load/program");
  };

  $scope.runProgramDobot = function(){
    getQuery(base_query + "/run/runProgram");
  };

  /*********************************************/


  //USER CONFIGURATION CHANGE DETECTION

/*
  $scope.changeJogMode = function(manufacturer) {
    $scope.manufacturer = manufacturer;
    scope_struct.manufacturer = manufacturer; //update the scope_struct
    generateFullQuery(scope_struct);
  };
*/

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

  function getQuery(address){

    // Simple GET request example:
    $http({
      method: 'GET',
      url: address,
      config: "",
      }).then(function success(response) {

        $scope.server_response = response;

        }, function error(response) {
          alert("there was an error with your request");
      });
  }


  function getCamera(address){

    // Simple GET request example:
    $http({
      method: 'GET',
      url: address,
      config: "",
      }).then(function success(response) {
        //alert(JSON.stringify(response,null,2));
        $scope.cameraImage  = response.data;

        }, function error(response) {
          alert("there was an error with your request");
      });
  }

  function getState(address){

    $http({
      method: 'GET',
      url: address,
      config: "",
      }).then(function success(response) {
        //alert(JSON.stringify(response,null,2));
        $scope.state_x_pos            = response.data.x_pos.toFixed(1);
        $scope.state_y_pos            = response.data.y_pos.toFixed(1);
        $scope.state_z_pos            = response.data.z_pos.toFixed(1);
        $scope.state_head_rot         = response.data.head_rot.toFixed(1);
        $scope.state_base_angle       = response.data.base_angle.toFixed(1);
        $scope.state_long_arm_angle   = response.data.long_arm_angle.toFixed(1);
        $scope.state_short_arm_angle  = response.data.short_arm_angle.toFixed(1);
        $scope.state_paw_arm_angle    = response.data.paw_arm_angle.toFixed(1);
        $scope.state_is_grab          = response.data.is_grab;
        $scope.state_gripper_angle    = response.data.gripper_angle.toFixed(1);

        }, function error(response) {
          alert("there was an error with your request");
      });
    }

}]);

