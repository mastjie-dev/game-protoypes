import { Raycaster, Vector2 } from 'three';

export default class ScreenRaycaster {
	constructor(camera, element) {
		this.camera = camera;
		this.element = element;
		this.raycaster = new Raycaster();
		this.ndc = new Vector2();
	}

	screenToNDC(screenX, screenY) {
		const rect = this.element.getBoundingClientRect();
		const x = screenX - rect.left;
		const y = screenY - rect.top;

		this.ndc.x = (x / rect.width) * 2 - 1;
		this.ndc.y = -(y / rect.height) * 2 + 1;

		return this.ndc;
	}

	setFromScreen(screenX, screenY) {
		const ndc = this.screenToNDC(screenX, screenY);

		this.raycaster.setFromCamera(ndc, this.camera);

		return this.raycaster;
	}

	intersect(screenX, screenY, object, recursive = true) {
		this.setFromScreen(screenX, screenY);

		return this.raycaster.intersectObject(object, recursive);
	}
    
    intersects(screenX, screenY, objects, recursive = true) {
		this.setFromScreen(screenX, screenY);

		return this.raycaster.intersectObjects(objects, recursive);
	}

	getRay(screenX, screenY) {
		this.setFromScreen(screenX, screenY);

		return this.raycaster.ray;
	}
}

