import * as THREE from 'three';
// import vertexShader from '../shaders/vertexShader.glsl'
// import fragmentShader from '../shaders/fragmentShader.glsl'
import { FBXLoader } from 'https://threejs.org/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'https://threejs.org/examples/jsm/controls/FirstPersonControls.js';

let vertexShader = `
    uniform vec3 glowColor;
    varying float intensity;
    void main()
    {
        intensity = 1.0; // or any value you want
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
let fragmentShader = `
		uniform vec3 glowColor;
		varying float intensity;
		void main()
		{
			vec3 glow = glowColor * intensity;
			gl_FragColor = vec4(glow, 1.0);
		}
`;

let mouseover = false;
let startTime = null;
let tornado;
let progress = 0;
let fireblast, waterpulse, leafstorm, spellChoices, spell;

// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
let clock;
let fireLight, fireLight2, scene, renderer, camera, controls;
let floor, playerScore, playerLives;
let wizard, wizard_skeleton;
let fireButton, grassButton, waterButton;
let shakeDuration = 0;
let shakeIntensity = 0;
let livesDisplay;

playGame();

function playGame() {
	fireButton = document.getElementById('fire');
	grassButton = document.getElementById('grass');
	waterButton = document.getElementById('water');
	if (fireButton) { // Check if the button exists
		fireButton.addEventListener('click', function () {
			controls.lookAt(0, -2000, 0);
			playRound('fireblast')
		});
		fireButton.addEventListener('mouseover', function () {
			mouseover = true;
		});
		fireButton.addEventListener('mouseout', function () {
			mouseover = false;
		});
	}
	if (grassButton) { // Check if the button exists
		grassButton.addEventListener('click', function () {
			controls.lookAt(0, -2000, 0);
			playRound('leafstorm')
		});
		grassButton.addEventListener('mouseover', function () {
			mouseover = true;
		});
		grassButton.addEventListener('mouseout', function () {
			mouseover = false;
		});
	}
	if (waterButton) { // Check if the button exists
		waterButton.addEventListener('click', function () {
			controls.lookAt(0, -2000, 0);
			playRound('waterpulse')
		});
		waterButton.addEventListener('mouseover', function () {
			mouseover = true;
		});
		waterButton.addEventListener('mouseout', function () {
			mouseover = false;
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

	playerScore = 0;
	playerLives = 5;
	scene = new THREE.Scene();
	const spaceTexture = new THREE.TextureLoader().load('./textures/space.jpg');
	//scene.background = spaceTexture;

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.set(150, 170, 0);
	camera.lookAt(0, -2000, 0);

	// Create FirstPersonControls
	controls = new FirstPersonControls(camera, document.getElementById("HUD"));

	// Set look speed and movement speed
	controls.activeLook = false;
	controls.lookSpeed = 0.05;
	controls.constrainVertical = true;
	controls.movementSpeed = 0;
	controls.verticalMin = 1;
	controls.verticalMax = 1.8;
	controls.lookAt(0, -2000, 0);
	document.addEventListener('mousedown', function () {
		if (mouseover) {
			controls.activeLook = false;
		} else {
			controls.activeLook = true;
		}
	});

	document.addEventListener('mouseup', function () {
		controls.activeLook = false;
	});

	const light = new THREE.AmbientLight(0xffaa22, 0.3);
	scene.add(light);

	const floor_light = new THREE.SpotLight(0xffddcc, 100000);
	floor_light.position.set(-100, 500, 0);
	floor_light.target.position.set(200, 0, 0);
	floor_light.castShadow = true;
	scene.add(floor_light);

	fireLight = new THREE.PointLight(0xff4500, 30000, 100);
	fireLight2 = fireLight.clone();
	fireLight.position.set(0, 210, 190);
	fireLight2.position.set(0, 210, -190);
	fireLight.castShadow = true;
	fireLight2.castShadow = true;
	scene.add(fireLight);
	scene.add(fireLight2);

	// Texture Loader
	const obsidian_texture = new THREE.TextureLoader().load('./textures/obsidian.jpg')
	const brick_texture = new THREE.TextureLoader().load('./textures/brick.jpg')
	const floor_texture = new THREE.TextureLoader().load('./textures/vortex.jpg')


	const table_geometry = new THREE.BoxGeometry(150, 5, 225);
	const table_material = new THREE.MeshPhongMaterial({ map: obsidian_texture });
	const table = new THREE.Mesh(table_geometry, table_material);
	table.receiveShadow = true;
	table.castShadow = true;
	table.position.set(0, 90, 0)
	scene.add(table);

	const floor_geometry = new THREE.PlaneGeometry(600, 600);
	const floor_material = new THREE.MeshBasicMaterial({ map: floor_texture, side: THREE.DoubleSide });
	floor = new THREE.Mesh(floor_geometry, floor_material);
	floor.receiveShadow = true;
	floor.rotateX(Math.PI / 2)
	scene.add(floor);

	const room_geometry = new THREE.BoxGeometry(400, 250, 400);
	const room_material = new THREE.MeshPhongMaterial({ map: brick_texture, side: THREE.DoubleSide })
	const room = new THREE.Mesh(room_geometry, room_material);
	room.receiveShadow = true;
	room.position.set(0, 124, 0)
	scene.add(room);

	importWizard();
	importClock();
	importPotions();
	importBook();
	placeTorches();

	fireblast = new THREE.Group();
	fireblast.position.set(0, -200, 0);
	let fireball_loader = new GLTFLoader();

	fireball_loader.load('./models/spells/fireball.glb', function (fireball) {
		let energyball = fireball.scene;
		fireball.scene.scale.set(2, 2, 2);
		fireball.scene.position.set(0, 0, 0);
		fireblast.add(energyball);
	}, undefined, function (error) {
		console.error(error);
	});
	let ball = new THREE.SphereGeometry(15, 32, 16);
	const glow = new THREE.ShaderMaterial(
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
	fireglow.position.set(0, 0, 0);
	fireglow.scale.multiplyScalar(1.3);
	fireblast.add(fireglow);
	scene.add(fireblast);


	waterpulse = new THREE.Group();
	waterpulse.position.set(-200, 0, 0)
	const water_texture = new THREE.TextureLoader().load('textures/water.png');
	const pulse = new THREE.TorusGeometry(35, 3);
	const water = new THREE.MeshBasicMaterial({ map: water_texture, side: THREE.DoubleSide });
	const waterpulse1 = new THREE.Mesh(pulse, water);
	waterpulse1.position.set(0, 0, 0);
	waterpulse1.rotateY(Math.PI / 2);
	let waterglow = new THREE.ShaderMaterial(
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
	let pulseglow = new THREE.Mesh(pulseouter, waterglow)
	pulseglow.position.set(0, 0, 0);
	pulseglow.rotateY(Math.PI / 2);
	waterpulse.add(waterpulse1);
	waterpulse.add(pulseglow);
	scene.add(waterpulse);


	leafstorm = new THREE.Group();
	leafstorm.position.set(0, -200, 0)
	let tornado_loader = new GLTFLoader();

	tornado_loader.load('./models/spells/leaf_tornado.glb', function (object) {
		tornado = object.scene;
		tornado.scale.set(100, 75, 100);
		tornado.position.set(0, 0, 0);
		leafstorm.add(tornado);
	}, undefined, function (error) {
		console.error(error);
	});
	scene.add(leafstorm);

	window.onresize = function () {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	};
	spellChoices = {
		'fireblast': fireblast,
		'waterpulse': waterpulse,
		'leafstorm': leafstorm
	};
	gameLoop();
}


function playRound(playerChoice) {
	const choices = ['fireblast', 'leafstorm', 'waterpulse'];
	const computerChoice = choices[Math.floor(Math.random() * choices.length)];

	// Determine the winner
	if ((playerChoice === computerChoice) ||
		(playerChoice === 'fireblast' && computerChoice === 'leafstorm') ||
		(playerChoice === 'leafstorm' && computerChoice === 'waterpulse') ||
		(playerChoice === 'waterpulse' && computerChoice === 'fireblast')
	) {
		playerScore = playerScore + 100; // Increment the score
		document.getElementById('score').textContent = 'Score: ' + playerScore;
		launchSpell(spellChoices[playerChoice], 'player');
	} else {
		playerLives--; // Decrement player lives when they lose
		livesDisplay = '';
		for (let i = 0; i < playerLives; i++) {
			livesDisplay += '&hearts;'; // Add a heart for each life
		}
		launchSpell(spellChoices[computerChoice], 'enemy');
		shakeCamera(0.7, 100);
		document.getElementById('lives').innerHTML = 'Lives: ' + livesDisplay;
		if (playerLives === 0) {
			document.getElementById('HUD').style.display = 'none';
			document.getElementById('gameover').style.display = 'block';
			document.getElementById('titleScreenButton').addEventListener('click', function () {
				window.location.href = 'index.html'; // Replace with the path to your title screen
			});
		}
	}
}

function gameLoop() {
	requestAnimationFrame(gameLoop);
	const delta = clock.getDelta();
	if (startTime) {
		progress = progress + 0.05;

		if (progress >= 1) progress = 1;
		spell.position.lerp(spell.endPosition, progress);

		if (progress >= 1) {
			startTime = null;
			progress = 0;
			spell.position.set(-200, 0, 0);
			spell = null;
		} // Animation complete
	}
	// Get the elapsed time
	const elapsedTime = clock.getElapsedTime();

	// Change the intensity of the light over time
	fireLight.intensity = 30000 + Math.sin(elapsedTime * 2) * 10000;
	fireLight2.intensity = 30000 + Math.sin(elapsedTime * -2) * 10000;
	updateCamera();
	floor.rotateZ(-0.001);

	// Update controls
	if (controls !== undefined)
		controls.update(delta);

	renderer.render(scene, camera);

}


function launchSpell(spelled, user) {
	if (user == "player") {
		spelled.position.set(120, 150, 0);
		spelled.endPosition = new THREE.Vector3(-150, 150, 0);
	} else if (user == 'enemy') {
		spelled.position.set(-120, 150, 0);
		spelled.endPosition = new THREE.Vector3(150, 150, 0);
	}
	spell = spelled;

	startTime = true;
}

function importWizard() {
	wizard = new THREE.Group
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/Standing Block React Large.fbx', function (wizard_model) {
		wizard_model.scale.set(1, 1, 1)
		wizard_model.receiveShadow = true;
		wizard_model.castShadow = true;
		wizard_model.position.set(-150, 2, 0);
		wizard_model.rotateY(Math.PI / 2);
		wizard_model.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (wizard_model.material) {
					wizard_model.material.transparent = false
					wizard_model.material = new THREE.MeshPhongMaterial;
				}
			}
		});
		wizard.add(wizard_model);
		scene.add(wizard);

		// let wizard_animations = wizard.animations;
		// mixer = new THREE.AnimationMixer(wizard_model);

	}, undefined, function (error) {

		console.error(error);

	});
}

function importClock() {
	const clock_texture = new THREE.TextureLoader().load('./textures/clock_base.png');
	const fbxLoader = new FBXLoader()
	fbxLoader.load('./models/clock.fbx', function (clock) {
		clock.scale.set(0.08, 0.08, 0.08);
		clock.position.set(0, 95, -95);
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
	fbxLoader.load('./models/potions/Potion_Orange.fbx', function (Potion_orange) {
		Potion_orange.scale.set(0.08, 0.08, 0.08);
		Potion_orange.position.set(-10, 95, 90);
		Potion_orange.rotateY(0.7);
		Potion_orange.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_orange);
	});
	const fbxLoader1 = new FBXLoader()
	fbxLoader1.load('./models/potions/Potion_Pink.fbx', function (Potion_pink) {
		Potion_pink.scale.set(0.08, 0.08, 0.08);
		Potion_pink.position.set(-30, 95, 70);
		Potion_pink.rotateY(0.2);
		Potion_pink.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_pink);
	});
	const fbxLoader2 = new FBXLoader()
	fbxLoader2.load('./models/potions/Potion_Blue.fbx', function (Potion_blue) {
		Potion_blue.scale.set(0.08, 0.08, 0.08);
		Potion_blue.position.set(-50, 95, 90);
		Potion_blue.rotateY(0.2);
		Potion_blue.traverse(function (child) {
			if (child.isMesh) {
				child.material.transparent = false;
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		potions.add(Potion_blue);
	});
	scene.add(potions)
}

function importBook() {
	const book_texture = new THREE.TextureLoader().load('./textures/book.png');
	const fbxLoader = new FBXLoader();
	fbxLoader.load('./models/book/book.fbx', function (book) {
		book.scale.set(0.5, 0.5, 0.5);
		book.position.set(70, 103, 70);
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

function placeTorches() {
	const fbxLoader = new FBXLoader();
	fbxLoader.load('./models/torch/torch.fbx', function (torch) {
		torch.scale.set(0.1, 0.1, 0.1);
		torch.position.set(0, 110, 200);
		torch.rotateY(Math.PI)
		torch.traverse(function (child) {
			if (child.isMesh) {
				child.visible = true;
			}
		});
		scene.add(torch);
		const torchCopy = torch.clone();
		torchCopy.position.set(0, 110, -200);
		scene.add(torchCopy);

	}, undefined, function (error) {

		console.error(error);

	});
}

function shakeCamera(intensity, duration) {
	shakeIntensity = intensity;
	shakeDuration = duration;
}

function updateCamera() {
	if (shakeDuration > 0) {
		const shakeX = Math.random() * shakeIntensity - shakeIntensity / 2;
		const shakeY = Math.random() * shakeIntensity - shakeIntensity / 2;
		const shakeZ = Math.random() * shakeIntensity - shakeIntensity / 2;

		camera.position.x += shakeX;
		camera.position.y += shakeY;
		camera.position.z += shakeZ;

		shakeDuration -= 1;
	}
}

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
