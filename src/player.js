import {
    Vector3, CapsuleGeometry, MeshPhongMaterial, Mesh, BoxGeometry,
} from 'three';

import Healthbar from './healthbar.js'

export class Player {
    constructor() {
        const geometry = new CapsuleGeometry(0.5, 1.5, 8, 16);
        const material = new MeshPhongMaterial({ color: 0x22EE41 })
        
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.y = 1.25;
        this.mesh.castShadow = true;
        
        const boxGeometry = new BoxGeometry(.4, .4, 1);
        const box = new Mesh(boxGeometry, material)
        box.position.set(0, .8, -.5)
        this.mesh.add(box)

        this.healthbar = new Healthbar(2.5);
        this.healthbar.addToParent(this.mesh);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
}

export class PlayerController {
	constructor(object, keyboard, speed = 15) {
		this.object = object;
		this.keyboard = keyboard;
		this.speed = speed;

		this.direction = new Vector3();
	}

	update(delta, position) {
		let x = 0;
		let z = 0;

        const direction = new Vector3();
        direction.subVectors(this.object.position, position);
        direction.y = 0;
        direction.normalize();

        this.object.rotation.y = Math.atan2(direction.x, direction.z);

		if (this.keyboard.isDown('KeyA')) {
			x -= 1;
		}

		if (this.keyboard.isDown('KeyD')) {
			x += 1;
		}

		if (this.keyboard.isDown('KeyW')) {
			z -= 1;
		}

		if (this.keyboard.isDown('KeyS')) {
			z += 1;
		}

		if (x === 0 && z === 0) return;

        this.direction.set(x, 0, z);
        
		this.direction.normalize();
		this.direction.multiplyScalar(this.speed * delta);
		this.object.position.add(this.direction);
	}
}

export class PlayerCamera {
	constructor(camera, player, options = {}) {
		this.camera = camera;
		this.player = player;

		this.offset = options.offset?.clone() ?? new Vector3(0, 20, 2);
		this.lookOffset = options.lookOffset?.clone() ?? new Vector3(0, 0, 0);
		this.smoothing = options.smoothing ?? 2;
		this.minDistance = options.minDistance ?? 3;
		
        this.maxDistance = options.maxDistance ?? 20;
		this.scrollSpeed = options.scrollSpeed ?? 0.5;
        this.scrollExponent = options.scrollExponent ?? 2;
		this.target = new Vector3();
		
        this.lookTarget = new Vector3();
	}

	update(deltaTime) {
		this.target.copy(this.player.position).add(this.offset);

		const factor = 1 - Math.exp(-this.smoothing * deltaTime);
		this.camera.position.lerp(this.target, .9);

		this.lookTarget.copy(this.player.position).add(this.lookOffset);
		this.camera.lookAt(this.lookTarget);
	}

    // Delete ???
	scroll(delta) {
		const distance = this.offset.length();

		if (distance === 0) {
			return;
		}

		const direction = this.offset.clone()
			.normalize();

		const normalized = (
			distance - this.minDistance
		) / (
			this.maxDistance - this.minDistance
		);

		const factor = Math.pow(
			Math.max(0, Math.min(1, normalized)),
			this.scrollExponent
		);

		const amount = delta *
			this.scrollSpeed *
			(0.2 + factor);

		const newDistance = Math.max(
			this.minDistance,
			Math.min(
				this.maxDistance,
				distance + amount
			)
		);

		this.offset.copy(direction)
			.multiplyScalar(newDistance);
	}

    // Delete ???
	setOffset(x, y, z) {
		this.offset.set(x, y, z);

		const distance = Math.max(
			this.minDistance,
			Math.min(
				this.maxDistance,
				this.offset.length()
			)
		);

		this.offset.normalize()
			.multiplyScalar(distance);
	}

	setLookOffset(x, y, z) {
		this.lookOffset.set(x, y, z);
	}

	setLerpFactor(factor) {
		this.smoothing = factor;
	}

	setDistanceLimits(min, max) {
		this.minDistance = min;
		this.maxDistance = Math.max(min, max);

		this.setOffset(
			this.offset.x,
			this.offset.y,
			this.offset.z
		);
	}
}

