import KeyboardInput from './keyboard_input.js';
import MouseInput from './mouse_input.js';

export default class Input {
    constructor(bindings = {}, mouseTarget = document.body) {
        this.keyboard = new KeyboardInput(bindings);
        this.mouse = new MouseInput(mouseTarget);
    }

    endFrame() {
        this.keyboard.endFrame();
        this.mouse.endFrame();
    }

    reset() {
        this.keyboard.reset();
        this.mouse.reset();
    }

    dispose() {
        this.keyboard.dispose();
        this.mouse.dispose();
    }
}

