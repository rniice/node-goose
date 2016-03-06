function updateColor(color) {
	var new_color_selected = parseInt( ("0x" + color), 16);

	render_object_instance.material.color.setHex(new_color_selected);

}

updateColor(window.reserved_color_variable );
