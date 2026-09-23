import {
    Vector3, Object3D, DynamicDrawUsage, Mesh, MathUtils, 
    Box3,
} from 'three';

const TAU = Math.PI * 2;
const STATE = {
    SEEK: 1,
    ATTACK: 2,
    DYING: 3,
    DORMANT: 4,
};

const PAWN_BOX_SIZE = new Vector3(1.2, 2.4, 1.2);

export class Pawn {
    constructor(id) {
        this.id = id;
        this.health = 100;
        this.position = new Vector3();
        this.direction = new Vector3();
        this.speed = MathUtils.lerp(2.9, 3.8, Math.random());

        this.attackPower = 15;
        this.attackInterval = MathUtils.lerp(Math.random(), 12, 15);
        this.attackTimer = 0;
        this.invulnerable = true;
        this.invulnerableTimer = 3;

        this.state = STATE.DORMANT;
        this.box = new Box3();
        this.target = new Vector3();

        /* Animation settings
        this.speed = 2;
        this.hopHeight = 0.4;
        this.hopSpeed = 8;
        this.yOffset = 1.25;
        this.time = Math.random() * Math.PI * 2;
        */
    }

    spawn(position) {
        this.position.copy(position);
        this.direction.copy(this.target).sub(position).normalize();
        this.health = 100;
        this.invulnerable = true;
        
        this.invulnerableTimer = 3;
        this.state = STATE.SEEK;
        this.attackTimer = 0;
        this.box.setFromCenterAndSize(this.position, PAWN_BOX_SIZE);
    }

    onHit(damage) {
        if (this.invulnerable) {
            console.log("emit signal invulnerable");
            return;
        }
        this.health -= damage;
        if (this.health <= 0) {
            this.state = STATE.DYING;
        }
    }

    update(delta) {
        if (this.invulnerable) {
            this.invulnerableTimer -= delta;
            if (this.invulnerableTimer < 0) {
                this.invulnerable = false;
            }
            return;
        }

        if (this.state === STATE.SEEK) {
            const distance = this.position.length();
            if (distance < 1.5) {
                this.state = STATE.ATTACK;
                return;
            }
            
            const velocity = this.direction.clone().multiplyScalar(this.speed * delta);
            this.position.add(velocity);
            this.box.setFromCenterAndSize(this.position, PAWN_BOX_SIZE);
        }
        else {
            this.attackTimer++;
            if (this.attackTimer > this.attackInterval) {
                this.attackTimer = 0;
                // emit signal attack target
            }
        }
    }
}

export class PawnManager {
    constructor(geometry, material, count) {
        this.count = count;

        this.pawns = [];
        this.meshes = [];
        for (let i = 0; i < count; i++) {
            this.pawns.push(new Pawn(i));
            this.meshes.push(new Mesh(geometry, material));
        }

        this.index = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 20;
        this.keepSpawning = true;
        this.rounds = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    }

    addToScene(scene) {
        scene.add(...this.meshes);
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

    setSpawnState(bool) {
        this.keepSpawning = bool;
    }

    spawn(delta) {
        this.spawnTimer += delta;
        if ((this.spawnTimer > this.spawnInterval) && this.keepSpawning) {
            const rounds = [...this.rounds];
            this._shuffle(rounds);
            const position = new Vector3();
            for (let i = 0; i < 4; i++) {
                const radian = rounds.pop() / 8 * TAU;
                this.spawnTimer = 0;
                position.x = Math.cos(radian) * 25;
                position.z = Math.sin(radian) * 25;
                this.pawns[this.index].spawn(position);
                this.meshes[this.index].visible = true;
                this.meshes[this.index].position.copy(position);
                this.meshes[this.index].rotation.y = Math.atan2(
                    this.pawns[this.index].direction.x,
                    this.pawns[this.index].direction.z)
                this.index++;
            }
            if (this.index >= this.count) this.index = 0;
        }
    }

    update(delta) {
        for (let pawn of this.pawns) {
            if (pawn.state === STATE.DORMANT) continue;

            if (pawn.state === STATE.DYING) {
                this.meshes[pawn.id].visible = false;    
                pawn.state = STATE.DORMANT;
            }

            pawn.update(delta);
            this.meshes[pawn.id].position.copy(pawn.position);
            this.meshes[pawn.id].rotation.y = Math.atan2(pawn.direction.x,
                pawn.direction.z);
        }
    }
}
