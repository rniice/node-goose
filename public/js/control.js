var myApp = angular.module('myApp', ['ngTouch','mp.colorPicker', 'rzModule', 'ui.bootstrap']);

var base_query = "http://localhost:8080";
//var base_query = "https://stark-tundra-90514.herokuapp.com/materials";

var filtered_query = "";      

var scope_struct = {
	technology: "FDM", 
	composition: "", 
	filament_diameter: "1.75", 
	color: "",
	opacity: "",                           //opacity is broken for some reason
	location: "",
  manufacturer: "", 
	cost: "",
	tags: "",
	bed_material: "",
	temp_bed: "",
	min_nozzle_diameter: ""
};

var scope_struct_reset = (JSON.parse(JSON.stringify(scope_struct)));   //make a deep clone of the scope struct


myApp.controller('userCtrl', ['$scope', '$http', '$window', function($scope,$http,$window) {
  //$TouchProvider.ngClickOverrideEnabled(true);  //override onClick using angular with the touch provider library for mobile devices

	$scope.server_response = null;
  $scope.dobot_state     = null;


  //initialize values to these settings
  $scope.technology = "FDM";                  

  //non-initialized settings values:
  $scope.manufacturer = "";
  $scope.bed_material = "";
  $scope.temp_bed = "";
  $scope.min_nozzle_diameter = "";
  $scope.temp_extrude_default = "";


    /*STUFF FOR THREEJS SCRIPTS*/
  $scope.scripts = [];

  $scope.addScript = function() {
    //$scope.scripts.push({src: 'js/render_application.js'});
    //$scope.scripts.push({src: 'js/RenderObject.js'});
    $scope.scripts[0] = ({src: 'js/update_render.js'});
  }



  /*********LEFT COLUMN CONTROL BUTTONS********/

  $scope.connectDobot = function(){
    getQuery(base_query + "/run/connect");
  };

  $scope.disconnectDobot = function(){
    getQuery(base_query + "/run/disconnect");
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

  $scope.loadProgramDobot = function(){
    getQuery(base_query + "/load/program");
  };

  $scope.runProgramDobot = function(){
    getQuery(base_query + "/run/runProgram");
  };

  $scope.checkDobotState = function(){
    getState(base_query + "/status/state'");
  };

  /*********************************************/

  
  /*********JOG MOVEMENT CONTROL BUTTONS********/
  
  $scope.jogX_pos = function(){
    //alert("you have tried to jog z up!");

  };

  $scope.jogX_neg = function(){
    //alert("you have tried to jog z up!");

  };

  $scope.jogY_pos = function(){
    //alert("you have tried to jog z up!");

  };

  $scope.jogY_neg = function(){
    //alert("you have tried to jog z up!");

  };

  $scope.jogZ_pos = function(){
    //alert("you have tried to jog z up!");

  };

  $scope.jogZ_neg = function(){
    //alert("you have tried to jog z up!");

  };

  /*********************************************/


  //USER CONFIGURATION CHANGE DETECTION

  $scope.changeJogMode = function(manufacturer) {
    $scope.manufacturer = manufacturer;
    scope_struct.manufacturer = manufacturer; //update the scope_struct
    generateFullQuery(scope_struct);
  };


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

  $scope.slider_bed_temp = {
    value: 25,
    options: {
      id: 'bed-temp',
      floor: 25,
      ceil: 150,
      onChange: function(sliderId, temp_bed) {
        $scope.changeBedTemp(temp_bed);
        //alert("bed temp value is: " + temp_bed);
      },
      translate: function(temp_bed) {
        return temp_bed + '\u00B0' + 'C';
      }
    }
  };



	//for each value in the component,value array, run generate query
	function generateFullQuery(obj){
		
		filtered_query = base_query;

		for (var key in obj) {
		  generateQueryItem(key, obj[key]);    //component = key; value = obj[key]
		}

		getQuery(filtered_query);
	}


	function generateQueryItem(component, value){
	  component = component.toString();               //make sure value is made into a string
	  value = value.toString();                       //make sure value is made into a string
	  
	  if(value!=""){              										//the user has entered content in filter
	    if(filtered_query.indexOf('?')>-1){  					//if there already is a filter in place
	      filtered_query = filtered_query + "&" + component + "=" + value;
	    }
	    else{
	      filtered_query = filtered_query + "?" + component + "=" + value;
	    }
	  }

	  else {                      										//the user is trying to remove content in filter
	    if(filtered_query.indexOf('&')>-1){  					//if there is more than one filter in place      
	      filtered_query = filtered_query.replace("&" + component + "=", "");

	    }
	    else{
	      filtered_query = filtered_query.replace("?" + component + "=", "");
	    }
	  }
	}


	function getQuery(address){

	  //alert("new query is: " + filtered_query);

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

  function getState(address){

    //alert("new query is: " + filtered_query);

    // Simple GET request example:
    $http({
      method: 'GET',
      url: address,
      config: "",
      }).then(function success(response) {

        $scope.dobot_state = response;

        }, function error(response) {
          alert("there was an error with your request");
      });
    }


  /*http://jsfiddle.net/6Dgbu/ */
  function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }


}]);







