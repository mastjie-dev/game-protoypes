import {
	Quaternion,
	Vector3,
    Euler,
} from "three";
import {
	ImprovedNoise
} from "three/addons/math/ImprovedNoise.js";

export default class CameraShake {
	constructor(camera, {
		intensity = 0.15,
		duration = 0.3,
		speed = 20
	} = {}) {
		this.camera = camera;
		this.intensity = intensity;
		this.duration = duration;
		this.speed = speed;

		this.time = 0;
		this.active = false;
		this.seed = Math.random() * 1000;

		this.noise = new ImprovedNoise();

		this.basePosition = new Vector3();
		this.baseQuaternion = new Quaternion();

        this.euler = new Euler();

		this.shakePosition = new Vector3();
		this.shakeRotation = new Vector3();
		this.shakeQuaternion = new Quaternion();
	}

	shake(intensity = this.intensity, duration = this.duration) {
		this.intensity = intensity;
		this.duration = duration;
		this.time = duration;
		this.active = true;
	}

	update(delta) {
		this.basePosition.copy(this.camera.position);
		this.baseQuaternion.copy(this.camera.quaternion);

		if (!this.active)
			return;

		this.time -= delta;

		if (this.time <= 0) {
			this.time = 0;
			this.active = false;
			return;
		}

		const elapsed = this.duration - this.time;
		const progress = this.time / this.duration;
		const strength = this.intensity * progress;
		const time = this.seed + elapsed * this.speed;

		this.shakePosition.set(
			this.noise.noise(time, 0, 0),
			this.noise.noise(0, time, 0),
			this.noise.noise(0, 0, time)
		);

		this.shakeRotation.set(
			this.noise.noise(time, 10, 0),
			this.noise.noise(0, time, 10),
			this.noise.noise(10, 0, time)
		);

		this.camera.position
			.copy(this.basePosition)
			.addScaledVector(this.shakePosition, strength);

        /*
        this.euler.set(
             this.shakeRotation.x * strength,
             this.shakeRotation.y * strength,
             this.shakeRotation.z * strength,
             "XYZ")
		this.shakeQuaternion
			.setFromEuler(this.euler);

		this.camera.quaternion
			.copy(this.baseQuaternion)
			.multiply(this.shakeQuaternion);
        */
	}
}

