import './style.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let clock, mixer, scene, renderer, camera, controls;
let floor;
let wizard_model, wizard_skeleton;

init();

animate();

function init() {

	clock = new THREE.Clock();
	renderer = new THREE.WebGLRenderer({
		antialias : true,
		canvas: document.querySelector('#bg'),
	});

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;


	scene = new THREE.Scene();
	const spaceTexture = new THREE.TextureLoader().load('./textures/space.jpg');
	scene.background = spaceTexture;

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
	camera.position.set( 220, 200, 0 );
	controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 50, 0 );
	controls.update();
	controls.enablePan = false;
	controls.enableDamping = true;
	camera.lookAt(0.0,10,0.0);
	//camera.lookAt(0.0,100.0,0.0);

	// const axesHelper = new THREE.AxesHelper( 30 );
	// scene.add( axesHelper );

	// const light = new THREE.PointLight(0xffffff, 20000)
	// light.position.set(0.8, 1.4, 1.0)
	// scene.add(light)

	const light = new THREE.SpotLight( 0xffffff, 2000000);
	light.position.set(100, 1000, 0);

	light.castShadow = true;
	scene.add(light);

	const floor_light = new THREE.SpotLight( 0xffffff, 100000);
	floor_light.position.set(0, -100, 0);
	floor_light.castShadow = true;
	scene.add(floor_light);

	//----------------------------------------NATIVE OBJECTS-------------------------------------------------------

	const stone_texture = new THREE.TextureLoader().load('./textures/stone-texture.jpg')
	const table_geometry = new THREE.BoxGeometry( 250, 5, 300 );
	const table_material = new THREE.MeshLambertMaterial( { map: stone_texture } );
	const table = new THREE.Mesh( table_geometry, table_material );
	table.position.set(0,100,0)
	scene.add( table );

	const floor_texture = new THREE.TextureLoader().load('./textures/vortex.jpg')
	const floor_geometry = new THREE.CircleGeometry(256, 64);
	const floor_material = new THREE.MeshBasicMaterial( { map: floor_texture, side: THREE.DoubleSide} );
	floor = new THREE.Mesh( floor_geometry, floor_material );
	floor.receiveShadow = true;
	floor.rotateX(Math.PI/2)
	scene.add( floor );



	//---------------------------------MODEL IMPORTS--------------------------------------------------------------
	const wizard_texture = new THREE.TextureLoader().load('./textures/56x56texture.png' ); 

	const wizard_loader = new GLTFLoader();

	wizard_loader.load( 'models/Wizard-Finished.glb', function ( wizard ) {
			wizard.scene = wizard.scene;
			wizard.scene.scale.set(100,100,100);
			wizard.scene.position.set(-150,0,0);
			wizard.scene.rotateY(Math.PI/2);
			wizard.scene.receiveShadow = true;
			scene.add( wizard.scene);

			//get all children inside gltf file
			wizard.scene.traverse( function ( child ) {
				//get the meshes
				if ( child.isMesh ) {
					child.castShadow = true;
					// only replace texture if a texture map exist
					if (child.material){
					//replace the map with another THREE texture
					child.material.map = wizard_texture;
					//update
					child.material.map.needsUpdate = true;
					}
				}
			});
			wizard_skeleton = new THREE.SkeletonHelper( wizard.scene );
			wizard_skeleton.visible = false;
			scene.add( wizard_skeleton );
			
			const wizard_animations = wizard.animations;
			mixer = new THREE.AnimationMixer( wizard_model );
		
		}, undefined, function ( error ) {
		
			console.error( error );
		
		} );

	//const book_texture = new THREE.TextureLoader().load('./textures/book.png' ); 
	
	window.onresize = function () {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	};

	var model;
var onProgress = function (xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    } 
}; 
	var onError = function (xhr) { }; 
	var mtlLoader = new THREE.MTLLoader(); 
	mtlLoader.setPath('./'); 
	mtlLoader.load('object.mtl', function (materials) { 
		materials.preload(); 
		var objLoader = new THREE.OBJLoader(); 
		objLoader.setMaterials(materials); 
		objLoader.setPath('./'); 
		objLoader.load('object.obj', function (object) { 
				object.scale.x = object.scale.y = 
			object.scale.z = 20; 
				object.position.set(1100, 0, -600);
				object.castShadow = true; 
				object.receiveShadow = true;
				model = object;
				scene.add(model); 
		}, onProgress, onError); });
}

function animate() {

    requestAnimationFrame( animate );

    let delta = clock.getDelta();

    mixer.update( delta );
	floor.rotateZ(-0.001);
    controls.update();

    renderer.render( scene, camera );

}
