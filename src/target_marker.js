import {
    Vector3, Mesh, PlaneGeometry, MeshBasicMaterial, MathUtils,
} from 'three'

export default class TargetMarker {
    constructor(minDistance, maxDistance) {
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;

        const geometry = new PlaneGeometry(3, 3);
        geometry.rotateX(-Math.PI * .5);
        const material = new MeshBasicMaterial({ color: 0xEEDD11 });

        this.mesh = new Mesh(geometry, material);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    update(anchor, target) {
        const _anchor = anchor.clone();
        _anchor.y = 0;
        const distance = MathUtils.clamp(_anchor.distanceTo(target), 
            this.minDistance, this.maxDistance);
        const direction = target.clone().sub(_anchor).normalize();
        this.mesh.position.copy(direction).multiplyScalar(distance)
            .add(_anchor);
        this.mesh.position.y = .2;
    }
}
