import {
    BoxGeometry, MeshPhongMaterial, Mesh,
} from 'three'

import Healthbar from './healthbar.js'

export default class NPC {
    constructor(signal) {
        this.signal = signal;
        this.health = 100;

        const geometry = new BoxGeometry(2, 2, 2);
        const material = new MeshPhongMaterial({ color: 0x0022FF })
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.y = 1;
        this.mesh.castShadow = true;
        
        this.healthbar = new Healthbar();
        this.healthbar.addToParent(this.mesh);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    takeDamage(amount) {
        if (this.health === 0) {
            this.signal.emit("npc-dead");
            return;
        }

        this.health = Math.max(0, this.health - amount);
    }

    get position() {
        return this.mesh.position;
    }
}
