import {
    PlaneGeometry, MeshPhongMaterial, Mesh, Group, Box3, Vector3,
} from 'three'

export default class Floor {
    constructor(texture) {
        const floorGeometry = new PlaneGeometry(20, 20);
        const floorMaterial = new MeshPhongMaterial({ map: texture });

        this.mesh = new Group();

        for (let y = -20; y <= 20; y+=20) {
            for (let x = -20; x <= 20; x+=20) {
                const floor = new Mesh(
                  floorGeometry,
                  floorMaterial
                );
                floor.position.set(x, 0, y)
                floor.rotation.x = -Math.PI / 2;
                floor.receiveShadow = true;
                this.mesh.add(floor);
            }
        }

        this.hitbox = new Box3(new Vector3(-30, -2, -30), new Vector3(30, 0, 30));
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
}
