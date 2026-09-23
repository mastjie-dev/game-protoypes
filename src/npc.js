import {
    CapsuleGeometry, MeshPhongMaterial, Mesh, Object3D,
    BoxGeometry, MeshBasicMaterial, CircleGeometry, Vector3,
} from 'three'

import Healthbar from './healthbar.js'

const NPC_STATE = {
    MOVE: 1,
    WORK: 2,
};

export class Checkpoint {
    constructor(signal) {
        this.position = new Vector3();
        this.signal = signal;
        this.innerRadius = 3;
        this.outerRadius = 5;

        const geometry = new BoxGeometry(.5, 4, .5);
        const material = new MeshPhongMaterial({ color: 0xEE22D3 });
        this.mesh = new Mesh(geometry, material);

        const cGeometry = new CircleGeometry(1, 16);
        const cMaterial = new MeshBasicMaterial({ color: 0xEEDD11, wireframe: true })
        const inner = new Mesh(cGeometry, cMaterial);
        inner.scale.set(2.5, 2.5, 2.5);
        const outer = new Mesh(cGeometry, cMaterial);
        outer.scale.set(5, 5, 5);
        this.circles = new Object3D();
        this.circles.add(inner, outer);
        this.circles.rotation.x = -Math.PI * .5;
        this.circles.position.y = .5;
    
        this.mainTimer = 0;
        this.phase = 0;
        this.damage = 100;
    }

    addToScene(scene) {
        scene.add(this.mesh);
        scene.add(this.circles);
    }

    begin() {
        this.phase = 1;
    }
   
    repair(rate) {
        this.damage -= rate;

        if (this.damage >= 80 && this.damage < 100) {
            console.log("phase 1")
        }
        else if (this.damage >= 60 && this.damage < 80) {
            console.log("phase 2")
        }
        else if (this.damage >= 40 && this.damage < 60) {
            console.log("phase 3")
        }
        else if (this.damage >= 20 && this.damage < 40) {
            console.log("phase 4")
        }
        else if (this.damage >= 0 && this.damage < 20) {
            console.log("phase 5")
        }
        else {
            console.log("done");
        }
    }

    update(delta) {
        if (this.phase === 0) return;
    }
}

export class NPC {
    constructor(signal) {
        this.signal = signal;
        this.health = 100;

        const geometry = new BoxGeometry(2, 4, 2);
        const material = new MeshPhongMaterial({ color: 0x0022FF })
        this.mesh = new Mesh(geometry, material);
        this.mesh.castShadow = true;

        // TODO: health accept offset position
        //this.healthbar = new Healthbar();
        //this.healthbar.addToParent(this.mesh);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    onHit(amount) {
        if (this.health === 0) {
            this.signal.emit("npc-dead");
            return;
        }

        this.health = Math.max(0, this.health - amount);
    }

    update(delta) {}
}
