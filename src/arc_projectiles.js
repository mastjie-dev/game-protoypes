import { 
    InstancedMesh, Vector3, Object3D, Vector2, MathUtils,
} from 'three'

const STATE = {
    DORMANT: 0,
    ACTIVE: 1,
    HIT: 2,
};

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

        this.dummy.position.y = -5;
        this.dummy.updateMatrix();
        for (let i = 0; i < count; i++) {
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.frustumCulled = false;

		this.projectiles = [];
		for (let i = 0; i < count; i++) {
			this.projectiles.push({
                position: new Vector3(),
                start: new Vector3(),
                target: new Vector3(),
                direction: new Vector3(),
                distance: 0,
                elapsed: 0,
                flightTime: 0,
			    state: STATE.DORMANT,
            });
		}
	}

	shoot(position, target) {
		if (this.index === this.count) {
			this.index = 0;
		}
        
        const arrow = this.projectiles[this.index];
        arrow.start.copy(position).add(this.offset);
        arrow.target.copy(target);
        arrow.distance = position.distanceTo(target);
        arrow.state = STATE.ACTIVE;

        const t = (arrow.distance - 8) / 16; // TODO: remove hardcoded
        arrow.flightTime = MathUtils.lerp(.65, .85, t);
		this.index++;
	}

    _getTrajectoryPosition(arrow, t, curveAmount = 0.35) {
        const { start, target, distance } = arrow;
        const x = MathUtils.lerp(start.x, target.x, t);
        const z = MathUtils.lerp(start.z, target.z, t);
        const y = Math.sin(Math.PI * t) * distance * curveAmount;
        arrow.position.set(x, y, z);

        arrow.direction.set(
            target.x - start.x,
            Math.PI * Math.cos(Math.PI * t) * distance * curveAmount,
            target.z - start.z
        ).normalize();
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    checkCollision(floor, enemies) {
        for (let arrow of this.projectiles) {
            if (arrow.state !== STATE.ACTIVE) continue;

            const head = arrow.direction.clone().multiplyScalar(.5)
                .add(arrow.position);
            if (floor.containsPoint(head)) {
                this.clear(arrow); 
                this.signal.emit("arrow-hit-floor", head);
                continue;
            }
            
            /*
            for (let enemy of enemies) {
                if (enemy.box.containsPoint(head)) {
                    this.clear(arrow);
                    this.signal.emit("arrow-hit-enemy", enemy);
                    break;
                }
            }
            */
        }        
    }
	
    update(deltaTime) {
	    let i = 0;
        for (let arrow of this.projectiles) {
            if (arrow.state === STATE.DORMANT) {
                i++;
                continue;
            };

            if (arrow.state === STATE.HIT) {
                arrow.state = STATE.DORMANT;
                this.dummy.scale.set(0, 0, 0);
            }
            else {
                const t = arrow.elapsed / arrow.flightTime;
                this._getTrajectoryPosition(arrow, t);
                //arrow.direction.copy(arrow.target).sub(arrow.position).normalize();
                arrow.elapsed += deltaTime;
                const unit = new Vector3(0, 1, 0).normalize();

                this.dummy.position.copy(arrow.position);
                this.dummy.quaternion.setFromUnitVectors(
                    unit, arrow.direction);
                this.dummy.scale.set(1, 1, 1);
            }
            
            this.dummy.updateMatrix();
			this.mesh.setMatrixAt(i, this.dummy.matrix);
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    clear(projectile) {
        projectile.state = STATE.HIT;
        projectile.elapsed = 0;
        projectile.flightTime = 0;
        projectile.position.set(0, -5, 0);
    }
}

