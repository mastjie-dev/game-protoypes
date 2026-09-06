export default class KeyboardInput {
	constructor() {
		this.keys = new Set();

		window.addEventListener('keydown', (event) => {
			this.keys.add(event.code);
		});

		window.addEventListener('keyup', (event) => {
			this.keys.delete(event.code);
		});
	}

	isDown(code) {
		return this.keys.has(code);
	}

	isUp(code) {
		return !this.keys.has(code);
	}
}

