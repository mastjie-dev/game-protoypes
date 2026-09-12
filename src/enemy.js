import {
    Vector3, Object3D, DynamicDrawUsage, InstancedMesh, MathUtils, 
} from 'three';

export class Enemy {
    constructor() {
        this.isAlive = false;
        this.health = 100;
        this.position = new Vector3();
        this.speed = 5;
        
        // Animation settings
        this.speed = 2;
        this.hopHeight = 0.4;
        this.hopSpeed = 8;
        this.yOffset = 1.25;
        this.time = Math.random() * Math.PI * 2;
    }

    update(delta) {

    }
}

export class Enemies {
    constructor(geometry, material, count, target) {
        this.target = target;
        this.count = count;
        this.spawnTimer = 3; // in seconds
        this.timer = 0;

        this.mesh = new InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this.mesh.castShadow = true;

        this.dummy = new Object3D();
        this.shell = new Object3D();
    
        this.index = 0;
        this.enemies = [];
        for (let i = 0; i < count; i++) {
            this.enemies.push(new Enemy());
        }
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    radiusSpawn(minRadius, maxRadius) {
        const radius = MathUtils.lerp(minRadius, maxRadius, Math.random());
        this.enemies[this.index].position
            .set((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2)
            .multiplyScalar(radius);
        this.enemies[this.index].isAlive = true;
        this.index++;

        if (this.index === (this.count - 1)) this.index = 0;
    }

    update(delta) {
        let i = 0;
        for (let enemy of this.enemies) {
            if (!enemy.isAlive) {
                i++;
                continue;
            }
            enemy.update(delta);
            
            const diff = this.target.position.clone().sub(enemy.position);
            const distance = Math.sqrt(diff.x * diff.x + diff.y * diff.y
                + diff.z * diff.z);

            if (distance > 1.5) {
                const direction = diff.divideScalar(distance);
                const velocity = direction.multiplyScalar(enemy.speed * delta);
                enemy.position.add(velocity);
                this.dummy.position.copy(enemy.position);
                this.dummy.rotation.y = Math.atan2(direction.x, direction.z);
                this.dummy.updateMatrixWorld();

                this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            }

            this.mesh.instanceMatrix.needsUpdate = true;
            i++;
        }

        this.timer += delta;
        if (this.timer > this.spawnTimer) {
            this.timer = 0;
            this.radiusSpawn(20, 25);
        }
    }

    update2(player, delta) {
        this.time += delta;

        // ----------------
        // Move toward player
        // ----------------

        const dx = player.position.x - this.group.position.x;
        const dz = player.position.z - this.group.position.z;

        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 1.5) {
            const dirX = dx / distance;
            const dirZ = dz / distance;

            this.group.position.x += dirX * this.speed * delta;
            this.group.position.z += dirZ * this.speed * delta;

            // Face player
            this.group.rotation.y = Math.atan2(dirX, dirZ);
        }

        // ----------------
        // Hop animation
        // ----------------

        const hop = Math.abs(
            Math.sin(this.time * this.hopSpeed)
        );

        this.group.position.y = hop * this.hopHeight + this.yOffset;

        // ----------------
        // Squash / stretch
        // ----------------

        this.group.scale.y = 1 + hop * 0.1;
        this.group.scale.x = 1 - hop * 0.05;
        this.group.scale.z = 1 - hop * 0.05;

        // ----------------
        // Slight swinging
        // ----------------

        this.group.rotation.z =
            Math.sin(this.time * this.hopSpeed) * 0.12;
    }

    get position() {
        return this.group.position;
    }
}

