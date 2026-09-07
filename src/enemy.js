import * as THREE from 'three';

export default class Enemy {
    constructor(position = new THREE.Vector3()) {
        this.group = new THREE.Object3D();
        this.group.position.copy(position);

        // --- Body ---
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4444
        });

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        geometry.computeBoundingBox();

        this.body = new THREE.Mesh(geometry, material);
        this.body.scale.multiplyScalar(1.5);
        this.group.add(this.body);

        // Animation settings
        this.speed = 2;
        this.hopHeight = 0.4;
        this.hopSpeed = 8;
        this.yOffset = 1.25;

        this.time = Math.random() * Math.PI * 2;
    }

    addToScene(scene) {
        scene.add(this.group);
    }

    update(player, delta) {
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

