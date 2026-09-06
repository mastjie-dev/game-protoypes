import * as THREE from 'three';

const _dummy = new THREE.Object3D();
const _vector = new THREE.Vector3();

export default class ParticleSystem {
	constructor({
		geometry,
		material,

		amount = 100,
		lifetime = 1,
		oneShot = false,
		preprocess = 0,
		randomness = 0,
		localCoords = false,

		emission = {},
		direction = {},
		initial = {},
		velocity = {},
		scale = {},
		color = {},
		rotation = {},
	}) {
		this.geometry = geometry;
		this.material = material;

		this.amount = amount;
		this.lifetime = lifetime;
		this.oneShot = oneShot;
		this.preprocess = preprocess;
		this.randomness = randomness;
		this.localCoords = localCoords;

		this.emission = {
			shape: 'point',
			radius: 1,
			boxExtents: new THREE.Vector3(1, 1, 1),
			...emission,
		};

		this.direction = {
			direction: new THREE.Vector3(0, 1, 0),
			spread: 0,
			...direction,
		};

		this.initial = {
			velocity: 1,
			velocityRandom: 0,
			...initial,
		};

		this.velocity = {
			gravity: new THREE.Vector3(0, -9.8, 0),
			damping: 0,
			dampingRandom: 0,
			radial: 0,
			radialRandom: 0,
			tangential: 0,
			tangentialRandom: 0,
			orbit: 0,
			orbitRandom: 0,
			...velocity,
		};

		this.scale = {
			value: 1,
			random: 0,
			curve: null,
			...scale,
		};

		this.color = {
			value: new THREE.Color(1, 1, 1),
			curve: null,
			...color,
		};

		this.rotation = {
			value: 0,
			random: 0,
			speed: 0,
			speedRandom: 0,
			...rotation,
		};

		this._normalize();

		this.mesh = new THREE.InstancedMesh(
			geometry,
			material,
			amount
		);

		this.mesh.instanceMatrix.setUsage(
			THREE.DynamicDrawUsage
		);

		this.particles = [];

		for (let i = 0; i < amount; i++) {
			this.particles.push(
				this._createParticle()
			);

			this._hide(i);
		}

		this._time = 0;
		this._emissionTime = 0;
		this._emissionAccumulator = 0;
		this._nextParticle = 0;

		this._randomState = 12345;

		this._emitting = false;
		this._finished = false;

		if (preprocess > 0) {
			this._preprocess(preprocess);
		}
	}

	_normalize() {
		this.direction.direction =
			this.direction.direction.clone().normalize();

		this.velocity.gravity =
			this.velocity.gravity.clone();

		this.emission.boxExtents =
			this.emission.boxExtents.clone();

		this.color.value =
			this.color.value.clone();
	}

	addTo(parent) {
		parent.add(this.mesh);
		this.parent = parent;

		return this;
	}

	play() {
		this._emitting = true;
		this._finished = false;

		return this;
	}

	stop() {
		this._emitting = false;

		return this;
	}

	restart() {
		this.clear();

		this._time = 0;
		this._emissionTime = 0;
		this._emissionAccumulator = 0;
		this._finished = false;
		this._emitting = true;

		return this;
	}

	clear() {
		this._emitting = false;

		for (let i = 0; i < this.amount; i++) {
			this.particles[i].alive = false;
			this._hide(i);
		}

		this.mesh.instanceMatrix.needsUpdate = true;

		return this;
	}

	emit(count = 1) {
		for (let i = 0; i < count; i++) {
			this._spawn();
		}

		this.mesh.instanceMatrix.needsUpdate = true;

		return this;
	}

	update(delta) {
		if (delta <= 0) {
			return;
		}

		this._updateEmission(delta);
		this._updateParticles(delta);

		this.mesh.instanceMatrix.needsUpdate = true;
	}

	_updateEmission(delta) {
		if (!this._emitting) {
			return;
		}

		this._emissionTime += delta;

		const rate =
			this.amount / this.lifetime;

		this._emissionAccumulator += rate * delta;

		while (this._emissionAccumulator >= 1) {
			this._spawn();

			this._emissionAccumulator -= 1;
		}

		if (
			this.oneShot &&
			this._emissionTime >= this.lifetime
		) {
			this._emitting = false;
		}
	}

	_updateParticles(delta) {
		let alive = false;

		for (let i = 0; i < this.amount; i++) {
			const p = this.particles[i];

			if (!p.alive) {
				continue;
			}

			alive = true;
			p.age += delta;

			if (p.age >= p.lifetime) {
				p.alive = false;
				this._hide(i);

				continue;
			}

			const t = p.age / p.lifetime;

			this._processVelocity(p, delta);
			this._processScale(p, t);
			this._processRotation(p, delta);
			this._processColor(p, t);

			p.position.addScaledVector(
				p.velocity,
				delta
			);

			this._updateInstance(i, p);
		}

		if (
			this.oneShot &&
			!this._emitting &&
			!alive &&
			!this._finished
		) {
			this._finished = true;
		}
	}

	_spawn() {
		const index = this._findFree();

		if (index === -1) {
			return;
		}

		const p = this.particles[index];

		p.alive = true;
		p.age = 0;

		p.lifetime =
			this.lifetime *
			(
				1 -
				this.randomness * this._random()
			);

		p.random = this._random();

		p.position.copy(
			this._emissionPosition()
		);

		p.velocity.copy(
			this._initialVelocity()
		);

		p.scale = this._scale(0, p);
		p.color.copy(this._color(0));

		p.rotation =
			this.rotation.value +
			this._signed(
				this.rotation.random
			) * Math.PI;

		p.angularVelocity =
			this.rotation.speed *
			(
				1 +
				this._signed(
					this.rotation.speedRandom
				)
			);

		this._updateInstance(index, p);
	}

	_createParticle() {
		return {
			alive: false,
			age: 0,
			lifetime: 0,

			position: new THREE.Vector3(),
			velocity: new THREE.Vector3(),

			scale: 1,
			color: new THREE.Color(),

			rotation: 0,
			angularVelocity: 0,

			random: 0,
		};
	}

	_initialVelocity() {
		const direction =
			this.direction.direction.clone();

		const spread =
			THREE.MathUtils.degToRad(
				this.direction.spread
			);

		if (spread > 0) {
			const angle =
				this._random() * Math.PI * 2;

			const radius =
				this._random() * spread;

			const local =
				new THREE.Vector3(
					Math.sin(radius) *
						Math.cos(angle),
					Math.cos(radius),
					Math.sin(radius) *
						Math.sin(angle)
				);

			const q =
				new THREE.Quaternion();

			q.setFromUnitVectors(
				new THREE.Vector3(0, 1, 0),
				direction
			);

			direction.copy(
				local.applyQuaternion(q)
			);
		}

		const speed =
			this.initial.velocity *
			(
				1 +
				this._signed(
					this.initial.velocityRandom
				)
			);

		return direction.multiplyScalar(speed);
	}

	_processVelocity(p, delta) {
		const v = this.velocity;

		/*
		 * Gravity.
		 */
		p.velocity.addScaledVector(
			v.gravity,
			delta
		);

		/*
		 * Radial velocity.
		 */
		if (v.radial !== 0) {
			_vector.copy(p.position);

			if (_vector.lengthSq() < 0.0001) {
				_vector.copy(
					this.direction.direction
				);
			}

			_vector.normalize();

			const amount =
				v.radial *
				(
					1 +
					this._signed(
						v.radialRandom
					)
				);

			p.velocity.addScaledVector(
				_vector,
				amount * delta
			);
		}

		/*
		 * Tangential velocity.
		 */
		if (v.tangential !== 0) {
			_vector.crossVectors(
				this.direction.direction,
				p.position
			);

			if (_vector.lengthSq() > 0.0001) {
				_vector.normalize();

				const amount =
					v.tangential *
					(
						1 +
						this._signed(
							v.tangentialRandom
						)
					);

				p.velocity.addScaledVector(
					_vector,
					amount * delta
				);
			}
		}

		/*
		 * Damping.
		 */
		if (v.damping > 0) {
			const damping =
				v.damping *
				(
					1 +
					this._signed(
						v.dampingRandom
					)
				);

			p.velocity.multiplyScalar(
				Math.max(
					0,
					1 - damping * delta
				)
			);
		}
	}

	_processScale(p, t) {
		p.scale = this._scale(t, p);
	}

	_processRotation(p, delta) {
		p.rotation +=
			p.angularVelocity * delta;
	}

	_processColor(p, t) {
		p.color.copy(
			this._color(t)
		);
	}

	_scale(t, p) {
		let value =
			this.scale.value *
			(
				1 +
				this._signed(
					this.scale.random
				)
			);

		if (this.scale.curve) {
			value *= this._curve(
				this.scale.curve,
				t
			);
		}

		return value;
	}

	_color(t) {
		const color =
			this.color.value.clone();

		if (this.color.curve) {
			const value =
				typeof this.color.curve ===
				'function'
					? this.color.curve(t)
					: this.color.curve;

			color.multiply(value);
		}

		return color;
	}

	_emissionPosition() {
		const e = this.emission;

		switch (e.shape) {
			case 'sphere':
				return this._sphere(
					e.radius,
					false
				);

			case 'sphere_surface':
				return this._sphere(
					e.radius,
					true
				);

			case 'box':
				return new THREE.Vector3(
					this._signed(
						e.boxExtents.x
					),
					this._signed(
						e.boxExtents.y
					),
					this._signed(
						e.boxExtents.z
					)
				);

			default:
				return new THREE.Vector3();
		}
	}

	_sphere(radius, surface) {
		const direction =
			new THREE.Vector3(
				this._signed(1),
				this._signed(1),
				this._signed(1)
			).normalize();

		const distance = surface
			? radius
			: Math.cbrt(this._random()) * radius;

		return direction.multiplyScalar(
			distance
		);
	}

	_curve(curve, t) {
		if (typeof curve === 'function') {
			return curve(t);
		}

		if (!Array.isArray(curve)) {
			return curve;
		}

		if (curve.length === 0) {
			return 1;
		}

		if (curve.length === 1) {
			return curve[0];
		}

		const x =
			t * (curve.length - 1);

		const index = Math.floor(x);

		if (index >= curve.length - 1) {
			return curve[curve.length - 1];
		}

		return THREE.MathUtils.lerp(
			curve[index],
			curve[index + 1],
			x - index
		);
	}

	_updateInstance(index, p) {
		_dummy.position.copy(p.position);

		_dummy.rotation.set(
			0,
			0,
			p.rotation
		);

		_dummy.scale.setScalar(
			p.scale
		);

		_dummy.updateMatrix();

		this.mesh.setMatrixAt(
			index,
			_dummy.matrix
		);
	}

	_hide(index) {
		_dummy.position.set(0, 0, 0);
		_dummy.rotation.set(0, 0, 0);
		_dummy.scale.setScalar(0);

		_dummy.updateMatrix();

		this.mesh.setMatrixAt(
			index,
			_dummy.matrix
		);
	}

	_findFree() {
		for (let i = 0; i < this.amount; i++) {
			const index =
				(
					this._nextParticle + i
				) % this.amount;

			if (!this.particles[index].alive) {
				this._nextParticle =
					(index + 1) % this.amount;

				return index;
			}
		}

		return -1;
	}

	_preprocess(time) {
		const step = 1 / 60;

		for (
			let elapsed = 0;
			elapsed < time;
			elapsed += step
		) {
			this.update(step);
		}
	}

	_signed(amount) {
		return (
			(this._random() * 2 - 1) *
			amount
		);
	}

	_random() {
		let x = this._randomState;

		x ^= x << 13;
		x ^= x >> 17;
		x ^= x << 5;

		this._randomState = x;

		return (
			(x >>> 0) /
			4294967295
		);
	}
}
