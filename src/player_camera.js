import { Vector3 } from 'three';

export default class PlayerCamera {
	constructor(camera, player, options = {}) {
		this.camera = camera;
		this.player = player;

		this.offset = options.offset?.clone() ??
			new Vector3(0, 5, 10);

		this.lookOffset = options.lookOffset?.clone() ??
			new Vector3(0, 1, 0);

		this.smoothing = options.smoothing ?? 10;

		this.minDistance = options.minDistance ?? 3;
		this.maxDistance = options.maxDistance ?? 20;

		this.scrollSpeed = options.scrollSpeed ?? 0.5;
		this.scrollExponent = options.scrollExponent ?? 2;

		this.target = new Vector3();
		this.lookTarget = new Vector3();
	}

	update(deltaTime) {
		this.target.copy(this.player.position)
			.add(this.offset);

		const factor = 1 - Math.exp(
			-this.smoothing * deltaTime
		);

		this.camera.position.lerp(
			this.target,
			factor
		);

		this.lookTarget.copy(this.player.position)
			.add(this.lookOffset);

		this.camera.lookAt(this.lookTarget);
	}

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

