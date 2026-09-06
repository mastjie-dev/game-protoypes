import GUI from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three';

import ParticleSystem from './particles_system.js';

export default class ParticleSystemTest {
	constructor(scene) {
		this.scene = scene;

		this.geometry = new THREE.SphereGeometry(
			0.05,
			6,
			6
		);

		this.material = new THREE.MeshBasicMaterial({
			color: 0xffaa33,
			transparent: true,
			depthWrite: false,
		});

		this.params = {
			amount: 1000,
			lifetime: 2,
			oneShot: false,
			preprocess: 0,
			randomness: 0,
			localCoords: true,

			emission: {
				shape: 'point',
				radius: 1,
				boxExtents: new THREE.Vector3(1, 1, 1),
			},

			direction: {
				direction: new THREE.Vector3(0, 1, 0),
				spread: 20,
			},

			initial: {
				velocity: 3,
				velocityRandom: 0,
			},

			velocity: {
				gravity: new THREE.Vector3(0, -9.8, 0),
				damping: 0,
				dampingRandom: 0,
				radial: 0,
				radialRandom: 0,
				tangential: 0,
				tangentialRandom: 0,
				orbit: 0,
				orbitRandom: 0,
			},

			scale: {
				value: 1,
				random: 0,
				curve: [0, 1, 1, 0],
			},

			color: {
				value: '#ffaa33',
			},

			rotation: {
				value: 0,
				random: 1,
				speed: 2,
				speedRandom: 0,
			},
		};

		this.particles = null;

		this._createParticles();
		this._createGUI();

		this.particles.play();
	}

	update(delta) {
		this.particles?.update(delta);
	}

	dispose() {
		this.gui?.destroy();

		this.particles?.clear();
		this.particles?.mesh.removeFromParent();

		this.geometry.dispose();
		this.material.dispose();
	}

	_createParticles() {
		if (this.particles) {
			this.particles.clear();
			this.particles.mesh.removeFromParent();
		}

		const p = this.params;

		this.particles = new ParticleSystem({
			geometry: this.geometry,
			material: this.material,

			amount: p.amount,
			lifetime: p.lifetime,

			oneShot: p.oneShot,
			preprocess: 0,
			randomness: p.randomness,

			localCoords: p.localCoords,

			emission: {
				shape: p.emission.shape,
				radius: p.emission.radius,
				boxExtents:
					p.emission.boxExtents.clone(),
			},

			direction: {
				direction:
					p.direction.direction.clone(),
				spread: p.direction.spread,
			},

			initial: {
				velocity: p.initial.velocity,
				velocityRandom:
					p.initial.velocityRandom,
			},

			velocity: {
				gravity:
					p.velocity.gravity.clone(),

				damping: p.velocity.damping,
				dampingRandom:
					p.velocity.dampingRandom,

				radial: p.velocity.radial,
				radialRandom:
					p.velocity.radialRandom,

				tangential:
					p.velocity.tangential,

				tangentialRandom:
					p.velocity.tangentialRandom,

				orbit: p.velocity.orbit,
				orbitRandom:
					p.velocity.orbitRandom,
			},

			scale: {
				value: p.scale.value,
				random: p.scale.random,
				curve: [...p.scale.curve],
			},

			color: {
				value: new THREE.Color(
					p.color.value
				),
			},

			rotation: {
				value: p.rotation.value,
				random: p.rotation.random,
				speed: p.rotation.speed,
				speedRandom:
					p.rotation.speedRandom,
			},
		});

		this.particles.addTo(this.scene);

		if (p.preprocess > 0) {
			this.particles.preprocess = p.preprocess;
		}

		this.particles.play();
	}

	_createGUI() {
		this.gui = new GUI({
			title: 'Particles',
			width: 320,
		});

		this._systemGUI();
		this._emissionGUI();
		this._directionGUI();
		this._initialGUI();
		this._velocityGUI();
		this._scaleGUI();
		this._rotationGUI();
		this._controlsGUI();
	}

	_systemGUI() {
		const p = this.params;

		const folder = this.gui.addFolder(
			'System'
		);

		folder
			.add(p, 'amount', 1, 5000, 1)
			.onFinishChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'lifetime', 0.1, 10, 0.1)
			.onFinishChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'oneShot')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'preprocess', 0, 10, 0.1)
			.onFinishChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'randomness', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'localCoords')
			.onChange(() => {
				this._createParticles();
			});
	}

	_emissionGUI() {
		const p = this.params.emission;

		const folder = this.gui.addFolder(
			'Emission'
		);

		folder
			.add(p, 'shape', [
				'point',
				'sphere',
				'sphere_surface',
				'box',
			])
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'radius', 0, 5, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.boxExtents, 'x', 0, 5, 0.01)
			.name('Box X')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.boxExtents, 'y', 0, 5, 0.01)
			.name('Box Y')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.boxExtents, 'z', 0, 5, 0.01)
			.name('Box Z')
			.onChange(() => {
				this._createParticles();
			});
	}

	_directionGUI() {
		const p = this.params.direction;

		const folder = this.gui.addFolder(
			'Direction'
		);

		folder
			.add(p.direction, 'x', -1, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.direction, 'y', -1, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.direction, 'z', -1, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'spread', 0, 180, 1)
			.onChange(() => {
				this._createParticles();
			});
	}

	_initialGUI() {
		const p = this.params.initial;

		const folder = this.gui.addFolder(
			'Initial'
		);

		folder
			.add(p, 'velocity', 0, 20, 0.1)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'velocityRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});
	}

	_velocityGUI() {
		const p = this.params.velocity;

		const folder = this.gui.addFolder(
			'Velocity'
		);

		folder
			.add(p.gravity, 'x', -20, 20, 0.1)
			.name('Gravity X')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.gravity, 'y', -20, 20, 0.1)
			.name('Gravity Y')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.gravity, 'z', -20, 20, 0.1)
			.name('Gravity Z')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'damping', 0, 10, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'dampingRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'radial', -20, 20, 0.1)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'radialRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'tangential', -20, 20, 0.1)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'tangentialRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'orbit', -20, 20, 0.1)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'orbitRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});
	}

	_scaleGUI() {
		const p = this.params.scale;

		const folder = this.gui.addFolder(
			'Scale'
		);

		folder
			.add(p, 'value', 0, 5, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'random', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.curve, 0, 0, 3, 0.01)
			.name('Start')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.curve, 1, 0, 3, 0.01)
			.name('Middle')
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p.curve, 2, 0, 3, 0.01)
			.name('End')
			.onChange(() => {
				this._createParticles();
			});
	}

	_rotationGUI() {
		const p = this.params.rotation;

		const folder = this.gui.addFolder(
			'Rotation'
		);

		folder
			.add(
				p,
				'value',
				-Math.PI,
				Math.PI,
				0.01
			)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'random', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'speed', -20, 20, 0.1)
			.onChange(() => {
				this._createParticles();
			});

		folder
			.add(p, 'speedRandom', 0, 1, 0.01)
			.onChange(() => {
				this._createParticles();
			});
	}

	_controlsGUI() {
		const folder = this.gui.addFolder(
			'Controls'
		);

		folder.add({
			play: () => {
				this.particles.play();
			},
		}, 'play');

		folder.add({
			restart: () => {
				this.particles.restart();
			},
		}, 'restart');

		folder.add({
			stop: () => {
				this.particles.stop();
			},
		}, 'stop');

		folder.add({
			clear: () => {
				this.particles.clear();
			},
		}, 'clear');

		folder.add({
			burst: () => {
				this.particles.emit(100);
			},
		}, 'burst');
	}
}

