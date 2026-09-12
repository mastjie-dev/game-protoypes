import {
    Sprite, SpriteMaterial,
} from 'three'

export default class Healthbar {
    constructor(yOffset = 2.2, scaleX = 4, scaleY = .8) {
        this.material = new SpriteMaterial({ color: 0x11EE11 })
        this.sprite = new Sprite(this.material);
        this.sprite.position.y = yOffset;
        this.sprite.scale.set(scaleX, scaleY);
    }

    addToParent(parent) {
        parent.add(this.sprite);
    }

    update() {
        //TODO
    }
}
