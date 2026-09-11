import {
	Quaternion, Vector3, Euler 
} from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

export default class CameraShake {
	constructor(camera) {
		this.camera = camera;

		this.time = 0;
		this.active = false;
		this.seed = Math.random() * 1000;
		this.noise = new ImprovedNoise();

        this.decay = .8;
        this.trauma = 0;
        this.traumaPower = 2;

		this.baseQuaternion = new Quaternion();
        this.euler = new Euler();

		this.shakeRotation = new Vector3();
		this.shakeQuaternion = new Quaternion();
	}

	shake(trauma, decay = .8, traumaPower = 2) {
		this.active = true;
        this.trauma = trauma;
        this.decay = decay;
        this.traumaPower = traumaPower;
		this.baseQuaternion.copy(this.camera.quaternion);
	}

    update(delta) {
        if (!this.active || (this.trauma <= 0)) return;
       
        this.trauma = Math.max(this.trauma - this.decay * delta, 0.);
        const strength = Math.pow(this.trauma, this.traumaPower);
        const time = delta * this.seed;
		
        this.shakeRotation.set(
			this.noise.noise(time, 10, 0),
			this.noise.noise(0, time, 10),
			this.noise.noise(10, 0, time)
		);
        
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

    }
}

