//EXECUTE THE BELOW CODE NO MATTER WHAT

var target_canvas = document.getElementById('threeJS-Canvas');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 100, target_canvas.width/target_canvas.height, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({canvas: target_canvas});
  renderer.setSize(250, 250);
//renderer.setSize( window.innerWidth, window.innerHeight );
//document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 3, 3, 3 );

var color_selected = parseInt( ("0x" + window.reserved_color_variable), 16);
//var color_selected = parseInt( ("0x" + "00ff00"), 16);
var material = new THREE.MeshBasicMaterial( { color: color_selected }, {alphaMap: 0x000000} );  //set the color of the material

//var cube = new THREE.Mesh( geometry, material );
//scene.add( cube );
window.cube = new THREE.Mesh( geometry, material );
scene.add( window.cube );

camera.position.z = 5;

function render() {
	var new_animation_frame = requestAnimationFrame( render );

	window.cube.rotation.x += 0.01;   //rotate the cube at this rate on refresh
	window.cube.rotation.y += 0.01;   //rotate the cube at this rate on refresh

	renderer.render( scene, camera );
}


render();