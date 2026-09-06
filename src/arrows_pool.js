import { 
    InstancedMesh, Vector3, Object3D, Vector2, MathUtils,
} from 'three'

export default class ArrowsPool {
	constructor(geometry, material, count) {
		this.count = count;
		this.index = 0;

		this.mesh = new InstancedMesh(
			geometry,
			material,
			count
		);

        this.dummy = new Object3D()
		this.velocity = new Vector3();
		this.position = new Vector3();
        this.offset = new Vector3(0, 1, 0)
		this.speed = 5;
		this.gravity = 9.81;

		this.arrows = [];

		for (let i = 0; i < count; i++) {
			this.arrows.push({
                position: new Vector3(),
                velocity: new Vector3(),
				active: false
			});
		}
	}

    _calculateBallisticVelocity1(start, target, flightTime) {
        const velocity = new Vector3();

        velocity.x = (target.x - start.x) / flightTime;
        velocity.z = (target.z - start.z) / flightTime;

        velocity.y =
            (target.y - start.y + 0.5 * this.gravity * flightTime * flightTime)
            / flightTime;

        return velocity;
    }
    
	shoot(position, target) {
		if (this.index === this.count) {
			this.index = 0;
		}
        
        const T = target.clone();
        const D = T.distanceTo(position);
        const G = Math.min(15, Math.max(0, D - 6)) / 15;
        const flightTime = MathUtils.lerp(.3, .5, G);

        const arrow = this.arrows[this.index];
        const start = position.clone().add(this.offset);
        const velocity = this._calculateBallisticVelocity1(start, T, flightTime);
        arrow.velocity.copy(velocity);
        arrow.position.copy(start);
        arrow.distance = position.distanceTo(T);
        arrow.elapsed = 0;
		arrow.active = true;

		this.index++;
	}

    // for stylized effect, xz lerp(start, target, t)
    _getTrajectoryPosition(t, distance, curveAmount = 0.25) {
        const arc = Math.sin(Math.PI * t)
            * distance
            * curveAmount;
        return arc;
    }

	update(deltaTime) {
	    let i = 0;
        for (let arrow of this.arrows) {
            if (!arrow.active) continue;
            arrow.velocity.y -= this.gravity * deltaTime;
            const vel = arrow.velocity.clone();
            vel.multiplyScalar(deltaTime)
            arrow.position.add(vel);

            const direction = arrow.velocity.clone().normalize();
            this.dummy.position.copy(arrow.position);
			this.dummy.quaternion.setFromUnitVectors(
				new Vector3(0, 0, 1),
				direction
			);
			this.dummy.updateMatrix();
			this.mesh.setMatrixAt(i, this.dummy.matrix);
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

	reset() {
		this.index = 0;

		for (const arrow of this.arrows) {
			arrow.position.set(0, 0, 0);
            arrow.velocity.set(0, 0, 0);
			arrow.speed = 0;
			arrow.active = false;
		}
	}
}

