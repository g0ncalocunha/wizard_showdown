import * as THREE from 'three';
// import vertexShader from '../shaders/vertexShader.glsl'
// import fragmentShader from '../shaders/fragmentShader.glsl'
import { FBXLoader } from 'https://threejs.org/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';
let vertexShader, fragmentShader;

fetch('./shaders/vertexShader.glsl')
    .then(response => response.text())
    .then(data => vertexShader = data)
    .catch(err => console.error(err));

fetch('./shaders/fragmentShader.glsl')
    .then(response => response.text())
    .then(data => fragmentShader = data)
    .catch(err => console.error(err));
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
let clock = new THREE.Clock();
let mixer, scene, renderer, camera;
let floor;
let wizard_model, wizard_skeleton;
let fireButton, grassButton, waterButton, resultDisplay;
let spell_direction, spell_speed;
let enemy_spellKF = new THREE.VectorKeyframeTrack(
  '.position', // property to animate
  [0, 1, 2], // times (in seconds)
  [-100, 2, 0, 0, 150, 0, 200, 150, 0] // values
);
let player_spellKF = new THREE.VectorKeyframeTrack(
  '.position', // property to animate
  [0, 1, 2], // times (in seconds)
  [150, 2, 0, 0, 150, 0, -150, 150, 0] // values
);
let spell_mixer;

// init();
const play = document.getElementById('playButton');
play.addEventListener('click', playGame);
const help = document.getElementById('helpButton');
help.addEventListener('click', openHelp);

animate();


function openHelp() {
	document.querySelector('.helpScreen').style.display = 'flex';
	document.querySelector('.titleScreen').style.display = 'none';
	const back = document.getElementById('backButton');
	back.addEventListener('click', closeHelp);
}
function closeHelp() {
	document.querySelector('.titleScreen').style.display = 'flex';
	document.querySelector('.helpScreen').style.display = 'none';
}

function playGame() {
	document.querySelector('.titleScreen').style.display = 'none';
	document.querySelector('.HUD').style.display = 'flex';
	document.querySelector('.spellChoice').style.display = 'block';
	fireButton = document.getElementById('fire');
	grassButton = document.getElementById('grass');
	waterButton = document.getElementById('water');
	resultDisplay = document.getElementById('result');
	if (fireButton) { // Check if the button exists
		fireButton.addEventListener('click', function () {
			playRound('fireblast')
		});
	}
	if (grassButton) { // Check if the button exists
		grassButton.addEventListener('click', function () {
			playRound('leafstorm')
		});
	}
	if (waterButton) { // Check if the button exists
		waterButton.addEventListener('click', function () {
			playRound('waterpulse')
		});
	}
	init();
}


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
	camera.position.set(200, 200, 0);
	camera.lookAt(-75, 100, 0);

	const light = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(light);

	const top_light = new THREE.SpotLight(0xffffff, 200000);
	top_light.position.set(200, 500, 0);
	top_light.target.position.set(-100, 0, 0);
	top_light.castShadow = true;
	scene.add(top_light);


	const stone_texture = new THREE.TextureLoader().load('./textures/stone-texture.jpg')
	const table_geometry = new THREE.BoxGeometry(200, 5, 300);
	const table_material = new THREE.MeshPhongMaterial({ map: stone_texture });
	const table = new THREE.Mesh(table_geometry, table_material);
	table.receiveShadow = true;
	table.castShadow = true;
	table.position.set(0, 90, 0)
	scene.add(table);

	const floor_texture = new THREE.TextureLoader().load('./textures/vortex.jpg')
	const floor_geometry = new THREE.PlaneGeometry(1024, 1024);
	const floor_material = new THREE.MeshPhongMaterial({ map: floor_texture, side: THREE.DoubleSide });
	floor = new THREE.Mesh(floor_geometry, floor_material);
	floor.receiveShadow = true;
	floor.rotateX(Math.PI / 2)
	scene.add(floor);

	const room_geometry = new THREE.BoxGeometry(512, 512, 512);
	const room_material = new THREE.MeshPhongMaterial({ map: stone_texture, side: THREE.DoubleSide })
	const room = new THREE.Mesh(room_geometry, room_material);
	room.receiveShadow = true;
	room.position.set(0, 254, 0)
	scene.add(room);


	importWizard();
	importClock();
	importPotions();
	importBook();
	// importOrb();

	window.onresize = function () {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	};
}

function playRound(playerChoice) {
	const choices = ['fireblast', 'leafstorm', 'waterpulse'];
	const computerChoice = choices[Math.floor(Math.random() * choices.length)];

	// Determine the winner and update the resultDisplay with the outcome
	if (playerChoice === computerChoice) {
		resultDisplay.textContent = 'It\'s a draw!';
	} else if (
		(playerChoice === 'fireblast' && computerChoice === 'leafstorm') ||
		(playerChoice === 'leafstorm' && computerChoice === 'waterpulse') ||
		(playerChoice === 'waterpulse' && computerChoice === 'fireblast')
	) {
		launchSpell(playerChoice, 'player');
		resultDisplay.textContent = 'You win!';
	} else {
		launchSpell(computerChoice, 'enemy');
		resultDisplay.textContent = 'You lose!';
	}
	setTimeout(function() {
		resultDisplay.textContent = '';
	}, 1000);
}

// function endRound(result) {
// 	if (result == 'win') {
// 		resultDisplay.textContent = 'You win!';
// 		scene.remove(spell);
// 	}
// }

function animate() {

	requestAnimationFrame(animate);

	// let delta = clock.getDelta();

	// mixer.update(delta);
	floor.rotateZ(-0.001);
	

	renderer.render(scene, camera);

}

function createFireBlast(x, y, z, r) {
	let fireblast = new THREE.Group();
	let fireball_loader = new GLTFLoader();

	fireball_loader.load('./models/spells/fireball.glb', function (fireball) {
		let energyball = fireball.scene;
		fireball.scene.scale.set(2, 2, 2);
		fireball.scene.position.set(x, y, z);
		fireblast.add(energyball);
	}, undefined, function (error) {
		console.error(error);
	});
	let ball = new THREE.SphereGeometry(15, 32, 16);
	let glow = new THREE.ShaderMaterial(
		{
			uniforms:
			{
				"c": { type: "f", value: 0.4 },
				"p": { type: "f", value: 2.0 },
				glowColor: { type: "c", value: new THREE.Color(0xfbb741) },
				viewVector: { type: "v3", value: camera.position },
			},
			vertexShader,
			fragmentShader,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});
	let fireglow = new THREE.Mesh(ball, glow)
	fireglow.position.set(x, y, z);
	fireglow.scale.multiplyScalar(1.3);
	fireblast.add(fireglow);
	scene.add(fireblast);
	setTimeout(function() {
		scene.remove(fireblast);
	}, 1000);
}

function createWaterPulse(x, y, z, r) {
	// const water_texture = new THREE.TextureLoader().load('textures/ice_crystal.jpg');
	const pulse = new THREE.TorusGeometry(35, 3);
	const water = new THREE.MeshBasicMaterial({ color: "#d4f1f9", side: THREE.DoubleSide });
	const waterpulse1 = new THREE.Mesh(pulse, water);
	waterpulse1.position.set(x, y, z);
	waterpulse1.rotateY(Math.PI / 2);
	let glow = new THREE.ShaderMaterial(
		{
			uniforms:
			{
				"c": { type: "f", value: 1.0 },
				"p": { type: "f", value: 0.7 },
				glowColor: { type: "c", value: new THREE.Color(0xd4f1f9) },
				viewVector: { type: "v3", value: camera.position },
			},
			vertexShader,
			fragmentShader,
			side: THREE.FrontSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});
	let pulseouter = new THREE.TorusGeometry(35, 5);
	let pulseglow = new THREE.Mesh(pulseouter, glow)
	pulseglow.position.set(x, y, z);
	pulseglow.rotateY(Math.PI / 2);
	const waterpulse = new THREE.Group();
	waterpulse.add(waterpulse1);
	waterpulse.add(pulseglow);
	scene.add(waterpulse);
	setTimeout(function() {
		scene.remove(waterpulse);
	}, 1000);
}

function createLeafStorm(x, y, z, r) {
	let leafstorm = new THREE.Group();
	let tornado_loader = new GLTFLoader();

	tornado_loader.load('./models/spells/leaf_tornado.glb', function (object) {
		let tornado = object.scene;
		object.scene.scale.set(100, 75, 100);
		object.scene.position.set(x, y, z);
		leafstorm.add(tornado);
	}, undefined, function (error) {
		console.error(error);
	});
	scene.add(leafstorm);
	setTimeout(function() {
		scene.remove(leafstorm);
	}, 1000);
}

function launchSpell(spell, user) {
	let spell_x, spell_y, spell_z, spell_r;
	if (user == 'player') {
		spell_x = -125;
		spell_y = 150;
		spell_z = 0;
		spell_r = 0;
	} else {
		spell_x = 125;
		spell_y = 150;
		spell_z = 0;
		spell_r = Math.PI;
	}
	switch (spell) {
		case 'fireblast':
			return createFireBlast(spell_x, spell_y, spell_z, spell_r);
		case 'waterpulse':
			return createWaterPulse(spell_x, spell_y, spell_z, spell_r);
		case 'leafstorm':
			return createLeafStorm(spell_x, spell_y, spell_z, spell_r);
	}
}

function importWizard() {
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/Standing Block React Large.fbx', function (wizard) {
		wizard.scale.set(1, 1, 1)
		wizard.receiveShadow = true;
		wizard.castShadow = true;
		wizard.position.set(-150, 2, 0);
		wizard.rotateY(Math.PI / 2);
		wizard.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (wizard.material) {
					wizard.material.transparent = false
					wizard.material = new THREE.MeshPhongMaterial;
				}
			}
		});
		scene.add(wizard);

		// let wizard_animations = wizard.animations;
		mixer = new THREE.AnimationMixer(wizard);

	}, undefined, function (error) {

		console.error(error);

	});
}

function importClock() {
	const clock_texture = new THREE.TextureLoader().load('./textures/clock_base.png');
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/clock.fbx', function (clock) {
		clock.scale.set(0.08, 0.08, 0.08);
		clock.position.set(0, 95, -120);
		// clock.rotateY(Math.PI / 2);
		clock.traverse(function (child) {
			if (child.isMesh) {
				child.material = new THREE.MeshPhongMaterial;
				child.material.map = clock_texture;
				child.material.map.needsUpdate = true;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(clock);
	}, undefined, function (error) {

		console.error(error);

	});
}

function importPotions() {
	const potions = new THREE.Group();
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/potions/Potion_orange.fbx', function (Potion_orange) {
		Potion_orange.scale.set(0.08, 0.08, 0.08);
		Potion_orange.position.set(-20, 95, 110);
		Potion_orange.rotateY(0.7);
		Potion_orange.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_orange);
	}, undefined, function (error) {

		console.error(error);

	});
	const fbxLoader1 = new FBXLoader()
	fbxLoader.load('./models/potions/Potion_pink.fbx', function (Potion_pink) {
		Potion_pink.scale.set(0.08, 0.08, 0.08);
		Potion_pink.position.set(-40, 95, 90);
		Potion_pink.rotateY(0.2);
		Potion_pink.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_pink);
	}, undefined, function (error) {

		console.error(error);

	});
	const fbxLoader2 = new FBXLoader()
	fbxLoader.load('./models/potions/Potion_blue.fbx', function (Potion_blue) {
		Potion_blue.scale.set(0.08, 0.08, 0.08);
		Potion_blue.position.set(-60, 95, 110);
		Potion_blue.rotateY(0.2);
		Potion_blue.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_blue);
	}, undefined, function (error) {

		console.error(error);

	});
	scene.add(potions)
}

function importBook() {
	const book_texture = new THREE.TextureLoader().load('./textures/book.png' );
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/book/book.fbx', function (book) {
		book.scale.set(0.5, 0.5, 0.5);
		book.position.set(90, 103, 70);
		book.rotateX(-Math.PI / 2);
		book.rotateZ(Math.PI / 2);
		book.traverse(function (child) {
			if (child.isMesh) {
				child.material.map = book_texture;
				child.material.map.needsUpdate = true;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		scene.add(book);
	}, undefined, function (error) {

		console.error(error);

	});
}

// function importOrb() {
// 	const book_texture = new THREE.TextureLoader().load('textures/book.png' );
// 	const fbxLoader = new FBXLoader()
// 	fbxLoader.load('/models/palantiri/palantiri.fbx', function (orb) {
// 		orb.scale.set(0.2, 0.2, 0.2);
// 		orb.position.set(0, 110, 0);
// 		orb.traverse(function (child) {
// 			if (child.isMesh) {
// 				// child.material.map = book_texture;
// 				// child.material.map.needsUpdate = true;
// 				console.log(child);
// 				child.material[0].transparent = true;
// 				// child.material[0].emissiveMap = new THREE.TextureLoader().load('textures/palantiri/Inner_Emissive.png' );
// 				child.material[0].bumpMap = new THREE.TextureLoader().load('textures/palantiri/Outer shell_Height.png' );
// 				child.material[0].normalMap = new THREE.TextureLoader().load('textures/palantiri/Outer shell_Normal.png' );
// 				child.material[0].map = new THREE.TextureLoader().load('textures/palantiri/Outer shell_Base_Color.png' );
// 				console.log(child.material[1]);
// 				child.material[1].transparent = false;
// 				child.material[1].emissiveMap = new THREE.TextureLoader().load('textures/palantiri/Inner_Emissive.png' );
// 				child.material[1].bumpMap = new THREE.TextureLoader().load('textures/palantiri/Inner_Height.png' );
// 				child.material[1].normalMap = new THREE.TextureLoader().load('textures/palantiri/Inner_Normal.png' );
// 				child.material[1].map = new THREE.TextureLoader().load('textures/palantiri/Inner_Base_Color.png' );
// 				// child.castShadow = true;
// 				// child.receiveShadow = true;
// 			}
// 		});
// 		scene.add(orb);
// 	}, undefined, function (error) {

// 		console.error(error);

// 	});
// }

// var mtlLoader = new THREE.MTLLoader();
// mtlLoader.setPath('');
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


// let wizard_texture = new THREE.TextureLoader().load('textures/56x56texture.png');
// let wizard_loader = new GLTFLoader();
// wizard_loader.load('/models/Wizard-Finished.glb', function (wizard) {
// 	wizard.scene.scale.set(100, 100, 100);
// 	wizard.scene.position.set(-150, 2, 0);
// 	wizard.scene.rotateY(Math.PI / 2);
// 	wizard.scene.receiveShadow = true;
// 	scene.add(wizard.scene);

// 	//get all children inside gltf file
// 	wizard.scene.traverse(function (child) {
// 		//get the meshes
// 		if (child.isMesh) {
// 			child.castShadow = true;
// 			child.receiveShadow = true;
// 			// only replace texture if a texture map exist
// 			if (child.material) {
// 				//replace the map with another THREE texture
// 				child.material.map = wizard_texture;
// 				//update
// 				child.material.map.needsUpdate = true;
// 			}
// 		}
// 	});
// 	wizard_skeleton = new THREE.SkeletonHelper(wizard.scene);
// 	wizard_skeleton.visible = false;
// 	scene.add(wizard_skeleton);

// }, undefined, function (error) {

// 	console.error(error);

// });