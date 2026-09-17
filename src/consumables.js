import {
    InstancedMesh, Vector3, Matrix4, MathUtils, Box3,
} from "three"

export default class Consumables {
    constructor(geometry, material) {
        this.spawnTimer = 0;
        this.spawnLimit = 5;
        this.onCooldown = true;
   
        this.matrix = new Matrix4();
        this.count = 2;
        this.mesh = new InstancedMesh(geometry, material, this.count);

        this.boxes = [];
        this.boxSize = new Vector3(2, 2, 2);
        for (let i = 0; i < this.count; i++) {
            this.boxes.push(new Box3(new Vector3(-1, 0, -1), new Vector3(1, 2, 1)));
        }
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    spawn() {
        for (let i = 0; i < this.count; i++) {
            const x = MathUtils.randFloat(-10, 10);
            const z = MathUtils.randFloat(-10, 10);
            this.matrix.makeTranslation(x, 0, z);
            this.mesh.setMatrixAt(i, this.matrix);
            this.boxes[i].setFromCenterAndSize(new Vector3(x, 1, z), this.boxSize);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
   
    despawn() {
        for (let i = 0; i < this.count; i++) {
            this.matrix.makeScale(0, 0, 0);
            this.mesh.setMatrixAt(i, this.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.spawnTimer = 0;
        this.onCooldown = true;
    }

    update(delta, consumer) {
        if (this.onCooldown) {
            this.spawnTimer += delta;
            if (this.spawnTimer > this.spawnLimit) {
                this.spawn();
                this.spawnTimer = 0;
                this.onCooldown = false;
            }
        }

        for (let box of this.boxes) {
            if (box.containsPoint(consumer)) {
                this.despawn();
            }
        }
    }
}
