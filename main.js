import './style.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const clock = new THREE.Clock();
const renderer = new THREE.WebGLRenderer({
    antialias : true,
    canvas: document.querySelector('#bg'),
  });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;


const scene = new THREE.Scene();
const spaceTexture = new THREE.TextureLoader().load('./textures/space.jpg');
scene.background = spaceTexture;

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
camera.position.set( 220, 200, 0 );
const controls = new OrbitControls( camera, renderer.domElement );
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
const floor = new THREE.Mesh( floor_geometry, floor_material );
floor.rotateX(Math.PI/2)
scene.add( floor );



//---------------------------------MODEL IMPORTS--------------------------------------------------------------
const wizard_texture = new THREE.TextureLoader().load('./textures/56x56texture.png' ); 

const wizard_loader = new GLTFLoader();

wizard_loader.load( 'models/Wizard-Finished.glb', function ( wizard ) {
		wizard.scene.scale.set(100,100,100);
		wizard.scene.position.set(-150,0,0);
		wizard.scene.rotateY(Math.PI/2);
		scene.add( wizard.scene);
		wizard.scene.traverse( function ( object ) {

			if ( object.isMesh ) object.castShadow = true;

		} );
		
		//get all children inside gltf file
		wizard.scene.traverse( function ( child ) {
			//get the meshes
			if ( child.isMesh ) {
				// only replace texture if a texture map exist
				if (child.material){
				//replace the map with another THREE texture
				child.material.map = wizard_texture;
				//update
				child.material.map.needsUpdate = true;
				}
			}
		});
	
	}, undefined, function ( error ) {
	
		console.error( error );
	
	} );

const book_texture = new THREE.TextureLoader().load('./textures/book.png' ); 

animate();


window.onresize = function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

};

function animate() {

    requestAnimationFrame( animate );

    const delta = clock.getDelta();

    // mixer.update( delta );
	floor.rotateZ(-0.001);
    controls.update();

    renderer.render( scene, camera );

}
