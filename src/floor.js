import {
    PlaneGeometry, MeshPhongMaterial, Mesh, Group,
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
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
}
