import { Vector3 } from 'three';

export default class CharacterController {
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
        /*
		if (this.direction.lengthSq() === 0) {
			return;
		}
        */

		this.direction.normalize();
		this.direction.multiplyScalar(this.speed * delta);
		this.object.position.add(this.direction);
	}
}

