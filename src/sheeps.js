import { InstancedMesh, DynamicDrawUsage, Vector3,
    Object3D, Vector2,
} from 'three'

export default class Sheeps {
	constructor(geometry, material, count) {
		this.geometry = geometry;
		this.material = material;
		this.count = count;

        this.timer = 0;
        this.radius = 2; 
        this.speed = 4;
        this.sheeps = [];
        for (let i = 0; i < count; i++)
        {
            this.sheeps.push({
                isAlive: true,
                position: new Vector3().randomDirection()
                    .multiply(new Vector3(2, 0, 2)),
                velocity: new Vector3(),
                separation: new Vector3(),
                alignment: new Vector3(),
                cohesion: new Vector3(),
            }) 
        }

        this.dummy = new Object3D();
		this.mesh = new InstancedMesh(geometry, material, count);
		this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this.mesh.frustumCulled = false;
	}

    addToScene(scene) {
        scene.add(this.mesh)
    }

    findNeighbours(sheep) {
        const neighbours = [];
        for (let s of this.sheeps) {
            if (s === sheep) continue;
            const distance = sheep.position.distanceTo(s.position);
            if (distance < this.radius) {
                neighbours.push(s);
            }
        }
        return neighbours;
    }

    separation(sheep, neighbours) {
        sheep.separation.set(0, 0, 0);
        for (let n of neighbours) {
            const s = sheep.position.clone().sub(n.position);
            sheep.separation.add(s);
        }
    }

    alignment(sheep, neighbours) {
        if (neighbours.length === 0) return;
        
        const average = new Vector3();
        for (let n of neighbours) {
            average.add(n.velocity);
        }
        average.divideScalar(neighbours.length);
        sheep.alignment.subVectors(average, sheep.velocity);
    }

    cohesion(sheep, neighbours) {
        if (neighbours.length === 0) return;
        
        const center = new Vector3();
        for (let n of neighbours) {
            center.add(n.position);
        }
        center.divideScalar(neighbours.length);
        sheep.cohesion.subVectors(center, sheep.position);
    }

    seek(sheep, target) {
        const desired = target.clone().sub(sheep.position);
        return desired.sub(sheep.velocity);
    }

	update(deltaTime, _target) {
        const target = _target.clone();
        target.y = 0;
        let i = 0
        for (let sheep of this.sheeps) {
            const N = this.findNeighbours(sheep);
            this.separation(sheep, N);
            this.alignment(sheep, N);
            this.cohesion(sheep, N);
            const steering = new Vector3()
                .addScaledVector(sheep.separation, 2.)
                //.addScaledVector(sheep.alignment, 1.5)
                .addScaledVector(sheep.cohesion, .8)
                .addScaledVector(this.seek(sheep, target), .5)
            
            sheep.velocity.addScaledVector(steering, deltaTime);
            sheep.position.addScaledVector(sheep.velocity, deltaTime*.5);
          
            const direction = sheep.velocity.clone().normalize()
            this.dummy.position.copy(sheep.position);
            this.dummy.rotation.y = Math.atan2(direction.x, direction.z);
            this.dummy.updateMatrixWorld();
            this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}

