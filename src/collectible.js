import {
    Vector3, InstancedMesh, Object3D,
} from 'three'

const STATE = {
    HIDE: 1,
    REST: 2,
    PICK: 3,
};

export class Collectible {
    constructor() {
        this.state = STATE.HIDE;
        this.position = new Vector3();
        this.offset = new Vector3(0, 1, -1);
    }

    spawn(position) {
        this.state = STATE.REST;
        this.position.copy(position);
    }

    onPick() {
        this.state = STATE.PICK;
        this.position.copy(this.offset);
    }

    onDrop(target) {
        this.state = STATE.REST;
        this.position.copy(target);
    }
}

export class Parts {
    constructor(geometry, material, count) {
        this.count = count;
        this.mesh = new InstancedMesh(geometry, material, count);
        this.dummy = new Object3D();   

        this.collectibles = [];
        for (let i = 0; i < count; i++) {
            this.collectibles.push(new Collectible());
        } 
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    spawn() {
        let i = 0;
        for (let coll of this.collectibles) {
            const position = new Vector3().randomDirection();
            position.multiply(new Vector3(10, 0, 10));
            coll.spawn(position);

            this.dummy.position.copy(position);
            this.dummy.updateMatrixWorld();
            this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    update(delta, target) {
        let i = 0;
        for (let C of this.collectibles) {
            if (C.state === STATE.PICK) {
                this.dummy.position.copy(C.position);
                this.dummy.updateMatrixWorld();
                this.dummy.matrixWorld.premultiply(target.mesh.matrixWorld);
                this.mesh.setMatrixAt(i, this.dummy.matrixWorld);
            }
            i++;
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
