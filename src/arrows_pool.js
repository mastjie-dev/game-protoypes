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
                start: new Vector3(),
                target: new Vector3(),
                distance: 0,
                elapsed: 0,
                flightTime: 0,
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
        
        const arrow = this.arrows[this.index];
        arrow.start.copy(position);
        arrow.target.copy(target);
        arrow.distance = position.distanceTo(target);
        arrow.active = true;

        const t = (arrow.distance - 8) / 16; // TODO: remove hardcoded
        arrow.flightTime = MathUtils.lerp(.5, .65, t);
        
		this.index++;
	}

    // for stylized effect, xz lerp(start, target, t)
    _getTrajectoryPosition(arrow, t, curveAmount = 0.35) {
        const { start, target, distance } = arrow;
        const x = MathUtils.lerp(start.x, target.x, t);
        const z = MathUtils.lerp(start.z, target.z, t);

        const arc = Math.sin(Math.PI * t)
            * distance
            * curveAmount;
        return new Vector3(x, arc, z);
    }

	update(deltaTime) {
	    let i = 0;
        for (let arrow of this.arrows) {
            if (!arrow.active) {
                i++;
                continue;
            };
            if (arrow.position.y < -1) {
                this.clear(arrow);
                i++;
                continue;
            }

            const t = arrow.elapsed / arrow.flightTime;
            const V = this._getTrajectoryPosition(arrow, t);
            arrow.position.copy(V);
            const direction = arrow.target.clone().sub(V).normalize();
            arrow.elapsed += deltaTime;

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

    clear(arrow) {
        arrow.active = false;
        arrow.elapsed = 0;
        arrow.flightTime = 0;
        arrow.position.set(0, 0, 0);
        arrow.start.set(0, 0, 0);
        arrow.target.set(0, 0, 0);
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

