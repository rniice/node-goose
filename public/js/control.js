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

	$scope.server_response = "Available Materials: ";

  //initialize values to these settings
  $scope.technology = "FDM";
  $scope.composition = "";
  $scope.filament_diameter = "1.75";
  $scope.color = ""; 
  $scope.opacity = "";                   

  //non-initialized settings values:
  $scope.location = "";
  $scope.manufacturer = "";
  $scope.cost = ["",""];
  $scope.tags = "";
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


  //initialize the first query to send out with the presets
 	generateFullQuery(scope_struct);


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

  /*********************************************/


  //USER CONFIGURATION CHANGE DETECTION

  $scope.changeJogMode = function(manufacturer) {
    $scope.manufacturer = manufacturer;
    scope_struct.manufacturer = manufacturer; //update the scope_struct
    generateFullQuery(scope_struct);
  };




  $scope.resetFiltering = function(){
    $scope.server_response = "Available Materials: ";
    //initialize values to these settings
    $scope.technology = "FDM";
    $scope.composition = "";
    $scope.filament_diameter = "1.75";
    $scope.color = ""; 
    $scope.opacity = "";                   

    //non-initialized settings values:
    $scope.location = "";
    $scope.manufacturer = "";   
    $scope.cost = ["",""];
    $scope.slider_cost.minValue = 10;
    $scope.slider_cost.maxValue = 60;
    $scope.tags = "";
    $scope.bed_material = "";
    $scope.slider_bed_temp.value = 25;
    $scope.min_nozzle_diameter = "";
    $scope.slider_nozzle_temp.value = 220;

    scope_struct = (JSON.parse(JSON.stringify(scope_struct_reset)));
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




  $scope.changeNozzleDiameter = function(min_nozzle_diameter) {
    $scope.min_nozzle_diameter = min_nozzle_diameter;
    scope_struct.min_nozzle_diameter = min_nozzle_diameter; //update the scope_struct
    generateFullQuery(scope_struct);
  };

  $scope.changeTempExtrudeDefault = function(temp_extrude_default) {
    $scope.temp_extrude_default = temp_extrude_default;
    scope_struct.temp_extrude_default = temp_extrude_default; //update the scope_struct
    generateFullQuery(scope_struct);
  };

  $scope.showMaterialDetails = function(material) {           //set all the properties shown in suggested processing parameters area

    $scope.processing_name                        = material.name;
    $scope.processing_technology                  = material.technology;
    $scope.processing_composition                 = material.composition;
    $scope.processing_filament_diameter           = material.filament_diameter;
    $scope.processing_location                    = material.location;
    $scope.processing_manufacturer                = material.manufacturer;
    $scope.processing_cost                        = material.cost;
    $scope.processing_temp_extrude_default        = material.temp_extrude_default;
    $scope.processing_temp_min_extrude            = material.temp_min_extrude;
    $scope.processing_temp_max_extrude            = material.temp_max_extrude;
    $scope.processing_temp_bed                    = material.temp_bed;
    $scope.processing_extruder_fan_speed          = material.extruder_fan_speed;
    $scope.processing_bed_material                = material.bed_material;
    $scope.processing_extrusion_to_flow_multiplier= material.filament_extrusion_to_flow_multiplier;

    $scope.processing_color                       = material.color;
    $window.reserved_color_variable               = material.color;
    //logic to decompose the integer for opacity into a string
    if(material.opacity == 1){
      $scope.processing_opacity                   = "Opaque";
      $window.reserved_opacity_variable           = 1.0;
    }
    else if (material.opacity == 2){
      $scope.processing_opacity                   = "Translucent";
      $window.reserved_opacity_variable           = 0.50;
    }
    else {
      $scope.processing_opacity                   = "Transparent";
      $window.reserved_opacity_variable           = 0.10;
    }

    $scope.processing_website                     = material.website;
    $scope.processing_buy_now                     = material.buy_now;

    $scope.addScript();                           //call addScript to update the render color
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

        $scope.server_response = response;

        }, function error(response) {
          alert("there was an error with your request");
      });
    }


	function styleResponse(response) {  //takes the response from server and styles

    response = demangleJSON(response.data);  //decode the encoded buffer

    var sorted_by_cost = sortByKey(response, "cost");
    var lower_10 = sorted_by_cost.slice(0,10);

    $scope.server_response = lower_10;
	}

  function demangleJSON(data_json_mangled) {
    var data_json;
    //var encoding = "base64";
    //var encoding = "utf-8";

    //data_json = JSON.parse(JSON.stringify(data_json_mangled));
    data_json = data_json_mangled;

    //alert("data_json_mangled.data" + " = " + data_json_mangled['data']);

    return data_json;
  }

  /*http://jsfiddle.net/6Dgbu/ */
  function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }


}]);







