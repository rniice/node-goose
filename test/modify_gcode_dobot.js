var fs = require('fs');


var input_gcode = "bernie_gcode_stripped.gcode";
var output_gcode = "bernie_gcode_dobot.gcode"
var output_string = "";

var travel_speed = 100.00;
var offsetX = 250.00 - 75.00;
var offsetY = -75.00;
var offsetZ = 0.00;


var stripped_gcode_array = fs.readFileSync(input_gcode, 'utf8').split("\n");
stripped_gcode_array = stripped_gcode_array.slice(0, stripped_gcode_array.length-1); //drop the last entry

for (var i = 0; i < stripped_gcode_array.length; i++) {

	//remove existing F values
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(F[+-]?[\d]+[\.]?[\d]+]?)/i, "");

	//insert new F value for each command after the G1
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(G1[\s])/i, "G1 F" + travel_speed.toFixed(2).toString() + " ");

	//remove existing E values
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(E[+-]?[\d]+[\.]?[\d]+]?)/i, "");

	//remove existing Z value for each command
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Z[+-]?[\d]+[\.]?[\d]+]?)/i, "");

	//add Z value for each command
	stripped_gcode_array[i] = stripped_gcode_array[i] + "Z" + offsetZ.toFixed(2).toString();

	//find the existing X and Y values for each line
	var x_value = stripped_gcode_array[i].match(/X([+-]?[\d]+[\.]?[\d]+]?)/i);
		if (x_value) { 

			x_value = parseFloat(x_value[1]) + offsetX; 			//apply the offset change
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(X[+-]?[\d]+[\.]?[\d]+]?)/i, "X" + x_value.toFixed(2).toString());
		}

	var y_value = stripped_gcode_array[i].match(/Y([+-]?[\d]+[\.]?[\d]+]?)/i);
		if (y_value) { 

			y_value = parseFloat(y_value[1]) + offsetY; 			//apply the offset change
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Y[+-]?[\d]+[\.]?[\d]+]?)/i, "Y" + y_value.toFixed(2).toString());
		}


	//replace any instances of double spaces
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/([\s][\s])/i, " ");
}

output_string = stripped_gcode_array.join("\n");

//write result to file
fs.writeFile(output_gcode, output_string, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 

