export default class MouseInput {
	constructor(target) {
		this.target = target;

		this.x = 0;
		this.y = 0;
		this.buttons = new Set();

		this.wheelX = 0;
		this.wheelY = 0;

		target.addEventListener('mousemove', this.onMove);
		target.addEventListener('mousedown', this.onDown);
		target.addEventListener('mouseup', this.onUp);
		target.addEventListener('wheel', this.onWheel);
	}

	onMove = (event) => {
		const rect = this.target.getBoundingClientRect();

		this.x = event.clientX - rect.left;
		this.y = event.clientY - rect.top;
	};

	onDown = (event) => {
        this.buttons.add(event.button);
	};

	onUp = (event) => {
		this.buttons.delete(event.button);
	};

	onWheel = (event) => {
		this.wheelX = event.deltaX;
		this.wheelY = event.deltaY;
	};

	isDown(button) {
		return this.buttons.has(button);
	}

	isUp(button) {
		return !this.buttons.has(button);
	}

	dispose() {
		this.target.removeEventListener('mousemove', this.onMove);
		this.target.removeEventListener('mousedown', this.onDown);
		this.target.removeEventListener('mouseup', this.onUp);
		this.target.removeEventListener('wheel', this.onWheel);
	}
}

