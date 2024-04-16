import './style.css';
import * as THREE from 'three';
import vertexShader from './shaders/vertexShader.glsl'
import fragmentShader from './shaders/fragmentShader.glsl'
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let clock, mixer, scene, renderer, camera, controls;
let floor;
let wizard_model, wizard_skeleton;

// init();
document.getElementById('playButton').addEventListener('click',function(){
	init();
	document.querySelector('.titleScreen').style.display = 'none';
});
animate();

function init() {

	clock = new THREE.Clock();
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: document.querySelector('#threejs'),
		alpha: true,
	});

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;


	scene = new THREE.Scene();
	const spaceTexture = new THREE.TextureLoader().load('./textures/space.jpg');
	//scene.background = spaceTexture;

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.set(150, 200, 0);
	// controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 150, 0);
	// controls.update();
	// controls.enablePan = false;
	// controls.enableDamping = true;
	camera.lookAt(0, 150, 0);

	const light = new THREE.SpotLight(0xffffff, 2000000);
	light.position.set(100, 1000, 0);

	light.castShadow = true;
	scene.add(light);

	const floor_light = new THREE.SpotLight(0xffffff, 100000);
	floor_light.position.set(0, -100, 0);
	floor_light.castShadow = true;
	scene.add(floor_light);

	//----------------------------------------NATIVE OBJECTS-------------------------------------------------------

	let stone_texture = new THREE.TextureLoader().load('./textures/stone-texture.jpg')
	let table_geometry = new THREE.BoxGeometry(200, 5, 300);
	let table_material = new THREE.MeshLambertMaterial({ map: stone_texture });
	let table = new THREE.Mesh(table_geometry, table_material);
	table.receiveShadow = true;
	table.position.set(0, 90, 0)
	scene.add(table);

	let floor_texture = new THREE.TextureLoader().load('./textures/vortex.jpg')
	let floor_geometry = new THREE.PlaneGeometry(1024, 1024);
	let floor_material = new THREE.MeshBasicMaterial({ map: floor_texture, side: THREE.DoubleSide });
	floor = new THREE.Mesh(floor_geometry, floor_material);
	floor.receiveShadow = true;
	floor.rotateX(Math.PI / 2)
	scene.add(floor);

	let room_geometry = new THREE.BoxGeometry(512,512,512);
	let room_material = new THREE.MeshLambertMaterial({map: stone_texture, side: THREE.DoubleSide})
	let room = new THREE.Mesh(room_geometry,room_material);
	room.receiveShadow = true;
	room.position.set(0,254,0)
	scene.add(room);

	//---------------------------------MODEL IMPORTS--------------------------------------------------------------

	let spell = launchSpell('leaftornado','player');

	let wizard_texture = new THREE.TextureLoader().load('./textures/56x56texture.png');

	let wizard_loader = new GLTFLoader();

	wizard_loader.load('models/Wizard-Finished.glb', function (wizard) {
		wizard.scene = wizard.scene;
		wizard.scene.scale.set(100, 100, 100);
		wizard.scene.position.set(-150, 2, 0);
		wizard.scene.rotateY(Math.PI / 2);
		wizard.scene.receiveShadow = true;
		scene.add(wizard.scene);

		//get all children inside gltf file
		wizard.scene.traverse(function (child) {
			//get the meshes
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// only replace texture if a texture map exist
				if (child.material) {
					//replace the map with another THREE texture
					child.material.map = wizard_texture;
					//update
					child.material.map.needsUpdate = true;
				}
			}
		});
		wizard_skeleton = new THREE.SkeletonHelper(wizard.scene);
		wizard_skeleton.visible = false;
		scene.add(wizard_skeleton);

		let wizard_animations = wizard.animations;
		mixer = new THREE.AnimationMixer(wizard_model);

	}, undefined, function (error) {

		console.error(error);

	});

	//const book_texture = new THREE.TextureLoader().load('./textures/book.png' ); 

	window.onresize = function () {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	};

	var model;
	var onProgress = function (xhr) {
		if (xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log(Math.round(percentComplete, 2) + '% downloaded');
		}
	};
	var onError = function (xhr) { };
	// var mtlLoader = new THREE.MTLLoader();
	// mtlLoader.setPath('./');
	// mtlLoader.load('object.mtl', function (materials) {
	// 	materials.preload();
	// 	var objLoader = new THREE.OBJLoader();
	// 	objLoader.setMaterials(materials);
	// 	objLoader.setPath('./');
	// 	objLoader.load('object.obj', function (object) {
	// 		object.scale.x = object.scale.y =
	// 			object.scale.z = 20;
	// 		object.position.set(1100, 0, -600);
	// 		object.castShadow = true;
	// 		object.receiveShadow = true;
	// 		model = object;
	// 		scene.add(model);
	// 	}, onProgress, onError);
	// });
}

function animate() {

	requestAnimationFrame(animate);

	let delta = clock.getDelta();

	mixer.update(delta);
	floor.rotateZ(-0.001);
	// controls.update();

	renderer.render(scene, camera);

}

function createPyroball(x,y,z) {
	let pyroball = new THREE.Group();
	let fireball_loader = new GLTFLoader();

	fireball_loader.load('models/fireball.glb', function (fireball) {
		let energyball = fireball.scene;
		fireball.scene.scale.set(2, 2, 2);
		fireball.scene.position.set(x,y,z);
		pyroball.add(energyball);
	}, undefined, function (error) {
		console.error(error);
	});
	let ball = new THREE.SphereGeometry(15, 32, 16);
	let glow = new THREE.ShaderMaterial(
	{
		uniforms:
		{
			"c": {type: "f", value: 0.4},
			"p": {type: "f", value: 2.0},
			glowColor: {type: "c", value: new THREE.Color(0xfbb741)},
			viewVector: {type: "v3", value: camera.position},
		},
		vertexShader,
		fragmentShader,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}	);
	let pyroglow = new THREE.Mesh(ball, glow)
	pyroglow.position.set(x,y,z);
	pyroglow.scale.multiplyScalar(1.3);
	pyroball.add(pyroglow);
	scene.add(pyroball)
	return pyroball;
}

function createWaterPulse(x,y,z) {
	const water_texture = new THREE.TextureLoader().load('./textures/ice_crystal.jpg');
	const pulse = new THREE.TorusGeometry(35, 3);
	const water = new THREE.MeshBasicMaterial({ color: "#d4f1f9", side: THREE.DoubleSide });
	const waterpulse1 = new THREE.Mesh(pulse, water);
	waterpulse1.position.set(x,y,z);
	waterpulse1.rotateY(Math.PI/2);
	let glow = new THREE.ShaderMaterial(
	{
		uniforms:
		{
			"c": {type: "f", value: 1.0},
			"p": {type: "f", value: 0.7},
			glowColor: {type: "c", value: new THREE.Color(0xd4f1f9)},
			viewVector: {type: "v3", value: camera.position},
		},
		vertexShader,
		fragmentShader,
		side: THREE.FrontSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}	);
	let pulseouter = new THREE.TorusGeometry(35, 5);
	let pulseglow = new THREE.Mesh(pulseouter, glow)
	pulseglow.position.set(x,y,z);
	pulseglow.rotateY(Math.PI/2);
	const waterpulse = new THREE.Group();
	waterpulse.add(waterpulse1);
	waterpulse.add(pulseglow);
	waterpulse.castShadow = true;
	const waterpulse2 = waterpulse1.clone()
	waterpulse2.position.set(x - 15,y,z);
	waterpulse2.scale.multiplyScalar(0.8),
	waterpulse.add(waterpulse2);
	scene.add(waterpulse);
	return waterpulse;
}

function createLeafStorm(x,y,z) {
	let leafstorm = new THREE.Group();
	let tornado_loader = new GLTFLoader();

	tornado_loader.load('models/leaf_tornado.glb', function (object) {
		let tornado = object.scene;
		object.scene.scale.set(100, 75, 100);
		object.scene.position.set(x,y,z);
		leafstorm.add(tornado);
	}, undefined, function (error) {
		console.error(error);
	});
	leafstorm.castShadow = true;
	scene.add(leafstorm);
	return leafstorm;
}

function launchSpell(spell,user){
	let spell_x, spell_y, spell_z;
	if(user == 'player') {
		spell_x = -50;
		spell_y = 150;
		spell_z = 0;
	} else {
		spell_x = 50;
		spell_y = 150;
		spell_z = 0;
	}
	switch (spell) {
		case 'pyroball':
			return createPyroball(spell_x,spell_y,spell_z);
		case 'waterpulse':
			return createWaterPulse(spell_x,spell_y,spell_z);
		case 'leafstorm':
			return createLeafStorm(spell_x,spell_y,spell_z);
	}
}
