var fs = require('fs');


var input_gcode = "bernie_outline_print.gcode";
var output_gcode = "bernie_outline_gcode_dobot_targets.gcode"
var output_string = "";

var relative = false;			//if true, all x y z for "write" processing are additive (relative moves)

var travel_speed = 2;
var offsetX = 250.00 - 75.00;
var offsetY = -75.00;
var offsetZ = 0.00;
var precision = 2;

var stripped_gcode_array = fs.readFileSync(input_gcode, 'utf8').split("\n");
stripped_gcode_array = stripped_gcode_array.slice(0, stripped_gcode_array.length-1); //drop the last entry

var prev_x = 0;
var prev_y = 0;
var prev_z = 0;

for (var i = 0; i < stripped_gcode_array.length; i++) {

	//remove existing F values
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/( F[+-]?[\d]+[\.]?[\d]+]?)/i, "");

	//insert new F value for each command after the G1
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(G1[\s])/i, "G1 F" + travel_speed.toFixed(precision).toString() + " ");

	//find the existing X and Y values for each line
	var x_value = stripped_gcode_array[i].match(/X([+-]?[\d]+[\.]?[\d]+]?)/i);
	var y_value = stripped_gcode_array[i].match(/Y([+-]?[\d]+[\.]?[\d]+]?)/i);
	var z_value = stripped_gcode_array[i].match(/Z([+-]?[\d]+[\.]?[\d]+]?)/i);
	var e_value = stripped_gcode_array[i].match(/E([+-]?[\d]+[\.]?[\d]+]?)/i);

	if (x_value) { 
		x_value = parseFloat(x_value[1]) + offsetX; 			//apply the offset change
		stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(X[+-]?[\d]+[\.]?[\d]+]?)/i, "X" + x_value.toFixed(precision).toString());
	}
	else {	//use the previously set value for x
		x_value = parseFloat(prev_x); 			
		//append the x command anywhere, make cleaner later
		stripped_gcode_array[i] = stripped_gcode_array[i] + " X" + x_value.toFixed(precision).toString();
	}

	if (y_value) { 
		y_value = parseFloat(y_value[1]) + offsetY; 			//apply the offset change
		stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Y[+-]?[\d]+[\.]?[\d]+]?)/i, "Y" + y_value.toFixed(precision).toString());
	}
	else {  //use the previously set value for y
		y_value = parseFloat(prev_y);
		//append the y command anywhere, make cleaner later
		stripped_gcode_array[i] = stripped_gcode_array[i] + " Y" + y_value.toFixed(precision).toString();
	}

	if (z_value) { 
		z_value = parseFloat(z_value[1]) + offsetZ; 			//apply the offset change
		stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Z[+-]?[\d]+[\.]?[\d]+]?)/i, "Z" + z_value.toFixed(precision).toString());
	}
	else {  //use the previously set value for z
		z_value = parseFloat(prev_z);
		//append the y command anywhere, make cleaner later
		stripped_gcode_array[i] = stripped_gcode_array[i] + "Z" + z_value.toFixed(precision).toString();
	}

	//remove e value
	if (e_value) { 
		stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(E[+-]?[\d]+[\.]?[\d]+]?)/i, "");
		stripped_gcode_array[i] = stripped_gcode_array[i] + " LSR" + (1.00).toFixed(precision).toString();
	}
	else {  //turn the laser off 
		stripped_gcode_array[i] = stripped_gcode_array[i] + " LSR" + (0.00).toFixed(precision).toString();
	}

	//replace any instances of double spaces
	stripped_gcode_array[i] = stripped_gcode_array[i].replace(/([\s][\s])/i, " ");

	//if set to relative mode, calculate and overwrite gcodes with the additive coordinates
	if (relative===true) {

		var new_x = x_value - prev_x;
		var new_y = y_value - prev_y;
		var new_z = z_value - prev_z;

		if(i==0){
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(X[+-]?[\d]+[\.]?[\d]+]?)/i, "X0.00");
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Y[+-]?[\d]+[\.]?[\d]+]?)/i, "Y0.00");
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Z[+-]?[\d]+[\.]?[\d]+]?)/i, "Z0.00");
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(LSR[+-]?[\d]+[\.]?[\d]+]?)/i, "LSR1.00");
		}
		else {
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(X[+-]?[\d]+[\.]?[\d]+]?)/i, "X" + new_x.toFixed(precision).toString());
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Y[+-]?[\d]+[\.]?[\d]+]?)/i, "Y" + new_y.toFixed(precision).toString());
			stripped_gcode_array[i] = stripped_gcode_array[i].replace(/(Z[+-]?[\d]+[\.]?[\d]+]?)/i, "Z" + new_z.toFixed(precision).toString());	
		}

	}

	prev_x = x_value;		//assign previous values for the next loop
	prev_y = y_value;		//assign previous values for the next loop
	prev_z = z_value;		//assign previous values for the next loop

}


output_string = stripped_gcode_array.join("\n");				//combine all parts of the array

//write result to file
fs.writeFile(output_gcode, output_string, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 

