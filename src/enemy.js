import {
    Vector3, Object3D, DynamicDrawUsage, InstancedMesh, MathUtils, 
    Box3,
} from 'three';

const STATE = {
    SEEK: 1,
    ATTACK: 2,
};

const PAWN_BOX_SIZE = new Vector3(1.2, 2.4, 1.2);

export class Enemy {
    constructor() {
        this.isAlive = false;
        this.health = 100;
        this.position = new Vector3();
        this.direction = new Vector3();
        this.speed = 5;

        this.attackPower = 15;
        this.attackInterval = 1.5;
        this.attackTimer = 0;
        this.invulnerable = true;
        this.invulnerableTimer = 3;

        this.state = STATE.SEEK;
        this.box = new Box3();

        // Animation settings
        this.speed = 2;
        this.hopHeight = 0.4;
        this.hopSpeed = 8;
        this.yOffset = 1.25;
        this.time = Math.random() * Math.PI * 2;
    }

    spawn(position) {
        this.position.copy(position);
        this.isAlive = true;
        this.health = 100;
        this.invulnerable = true;
        this.invulnerableTimer = 3;
        this.state = STATE.SEEK;
        this.attackTimer = 0;
        this.box.setFromCenterAndSize(this.position, PAWN_BOX_SIZE);
    }

    update(delta, target) {
        if (this.state === STATE.SEEK) {
            const distance = this.position.distanceTo(target);
            if (distance < 1.5) {
                this.state = STATE.ATTACK;
                return;
            }
            
            this.direction.copy(target).sub(this.position);
            const velocity = this.direction.clone().multiplyScalar(this.speed * delta);
            this.position.add(velocity);
            this.box.setFromCenterAndSize(this.position, PAWN_BOX_SIZE);
        }
        else {
            this.attackTimer++;
            if (this.attackTimer > this.attackInterval) {
                this.attackTimer = 0;
                target.takeDamage(this.attackPower);
            }
        }

        this.invulnerableTimer -= delta;
        if (this.invulnerableTimer < 0) {
            this.invulnerable = false;
        }
    }
}

export class Pawns {
    constructor(geometry, material, count, target) {
        this.target = target;
        this.count = count;
        this.spawnTimer = 0; 
        this.spawnInterval = 5;

        this.mesh = new InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this.mesh.castShadow = true;

        this.dummy = new Object3D();
        this.shell = new Object3D();

        this.isSpawning = !false;
        this.index = 0;
        this.pawns = [];
        this.points = [];
        for (let i = 0; i < count; i++) {
            this.pawns.push(new Enemy(target));
            this.points.push(i);
        }
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
    
    _shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]];
        }
    }

    startSpawn() {}

    pauseSpawn() {}

    spawn(delta) {
        if (!this.isSpawning) return;
        this.spawnTimer += delta;
        if (this.spawnTimer < this.spawnInterval) return;
        this.spawnTimer = 0;

        const points = [...this.points];
        this._shuffle(points);

        const step = (Math.PI * 2) / this.count;
        for (let i = 0; i < 3; i++) {
            const radian = points.pop() * step;
            this.dummy.position.x = Math.cos(radian) * 28;
            this.dummy.position.z = Math.sin(radian) * 28;
            this.dummy.updateMatrixWorld();
            this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            this.pawns[this.index].spawn(this.dummy.position);
            this.index++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.index >= this.count) {
            this.index = 0;
        }
    }

    update(delta) {
        let i = 0;
        for (let enemy of this.pawns) {
            if (!enemy.isAlive) {
                i++;
                continue;
            }
            
            enemy.update(delta , this.target);
            if (enemy.state === STATE.SEEK) {
                this.dummy.position.copy(enemy.position);
                this.dummy.rotation.y = Math.atan2(enemy.direction.x, enemy.direction.z);
                this.dummy.updateMatrixWorld();
                this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            }
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
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
}

