import { 
    InstancedMesh, Vector3, Object3D, Vector2, MathUtils,
} from 'three'

export default class ArcProjectiles {
	constructor(geometry, material, count, signal) {
		this.count = count;
		this.index = 0;
        this.signal = signal;

		this.mesh = new InstancedMesh(geometry, material, count);

        this.dummy = new Object3D()
		this.velocity = new Vector3();
		this.position = new Vector3();
        this.offset = new Vector3(0, 1, 0)
		this.speed = 5;
		this.gravity = 9.81;

        this.dummy.position.y = -2;
        this.dummy.updateMatrix();
        for (let i = 0; i < count; i++) {
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;

		this.projectiles = [];
		for (let i = 0; i < count; i++) {
			this.projectiles.push({
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

    // DELETE ??
    _calculateBallisticVelocity(start, target, flightTime) {
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
        
        const arrow = this.projectiles[this.index];
        arrow.start.copy(position);
        arrow.target.copy(target);
        arrow.distance = position.distanceTo(target);
        arrow.active = true;

        const t = (arrow.distance - 8) / 16; // TODO: remove hardcoded
        arrow.flightTime = MathUtils.lerp(.65, .85, t);
        
		this.index++;
	}

    // for stylized effect, xz lerp(start, target, t)
    _getTrajectoryPosition(arrow, t, position, curveAmount = 0.35) {
        const { start, target, distance } = arrow;
        const x = MathUtils.lerp(start.x, target.x, t);
        const z = MathUtils.lerp(start.z, target.z, t);

        const arc = Math.sin(Math.PI * t) * distance * curveAmount;
        position.set(x, y, z);
    }

	update(deltaTime) {
	    let i = 0;
        for (let arrow of this.projectiles) {
            if (!arrow.active) {
                i++;
                continue;
            };
            if (arrow.position.y < -1) {
                this.clear(arrow);
                this.signal.emit('hit-floor');
                i++;
                continue;
            }

            const t = arrow.elapsed / arrow.flightTime;
            this._getTrajectoryPosition(arrow, t, arrow.position);
            const direction = arrow.target.clone().sub(V).normalize();
            arrow.elapsed += deltaTime;

            this.dummy.position.copy(arrow.position);
			this.dummy.quaternion.setFromUnitVectors(
				new Vector3(0, 0, 1), direction);
			this.dummy.updateMatrix();
			this.mesh.setMatrixAt(i, this.dummy.matrix);
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    clear(projectile) {
        projectile.active = false;
        projectile.elapsed = 0;
        projectile.flightTime = 0;
        projectile.position.set(0, 0, 0);
        projectile.start.set(0, 0, 0);
        projectile.target.set(0, 0, 0);
    }

	reset() {
		this.index = 0;

		for (const projectile of this.projectiles) {
			projectile.position.set(0, 0, 0);
            projectile.velocity.set(0, 0, 0);
			projectile.speed = 0;
			projectile.active = false;
		}
	}
}

