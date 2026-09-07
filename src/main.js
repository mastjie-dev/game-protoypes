import {
    Scene, Color, PerspectiveCamera, WebGLRenderer, MeshStandardMaterial,
    DirectionalLight, AmbientLight, Timer, CapsuleGeometry, PlaneGeometry,
    PCFShadowMap, Mesh, TextureLoader, Vector3, SphereGeometry,
    MeshBasicMaterial, BoxGeometry, Box3, Box3Helper,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import MouseInput from './mouse_input.js';
import KeyboardInput from './keyboard_input.js';
import PlayerController from './player_controller.js';
import ScreenRaycaster from './screen_raycaster.js';
import PlayerCamera from './player_camera.js'
import ArrowsPool from './arrows_pool.js'
import Enemy from './enemy.js'

import './style.css'

async function main() {
    
    const scene = new Scene();
    scene.background = new Color(0x87ceeb);

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new PerspectiveCamera(
        60,
        aspect,
        0.1,
        200
    );
    camera.position.set(0, 10, 8);
    camera.lookAt(0, 0, 0)

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(
        800, //window.innerWidth,
        480  //window.innerHeight
    );
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    document.body.appendChild(renderer.domElement);
   
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    const ambientLight = new AmbientLight(
      0xffffff,
      1.5
    );
    scene.add(ambientLight);
    const sun = new DirectionalLight(
      0xffffff,
      3
    );
    sun.position.set(10, 15, 10);
    sun.castShadow = true;

    sun.shadow.mapSize.set(1048, 1048);
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    scene.add(sun);

    const textureLoader = new TextureLoader();
    const uvTexture = textureLoader.load('/uv_checker256.png');

    const floorGeometry = new PlaneGeometry(50, 50);
    const floorMaterial = new MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0,
        map: uvTexture,
    });
    const floor = new Mesh(
      floorGeometry,
      floorMaterial
    );

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const capsuleGeometry = new CapsuleGeometry(
      0.5,  // radius
      1.5,  // length
      16,   // cap segments
      32    // radial segments
    );
    const capsuleMaterial = new MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.45,
      metalness: 0.05
    });
    
    const player = new Mesh(
      capsuleGeometry,
      capsuleMaterial
    );
    player.position.y = 1.25;
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
    
    const boxGeometry = new BoxGeometry(.4, .4, 1);
    const boxMaterial = new MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.45,
      metalness: 0.05
    });
    const box = new Mesh(boxGeometry, boxMaterial)
    box.position.set(0, .8, -.5)
    player.add(box)
   
    const rPos = new Vector3().randomDirection().multiplyScalar(10);
    rPos.y = 2;
    const enemy = new Enemy(rPos);
    enemy.addToScene(scene);
    
    const enemyBBox = new Box3(new Vector3(-3.25, 0, -3.25), new Vector3(3.25, 0, 3.25));
    const enemyBBoxH = new Box3Helper(enemyBBox);
    scene.add(enemyBBoxH);

    const mouse = new MouseInput(renderer.domElement)
    const keyboard = new KeyboardInput()
    const controller = new PlayerController(player, keyboard, 8)
    const screenRaycaster = new ScreenRaycaster(camera, renderer.domElement);
    const playerCamera = new PlayerCamera(camera, player, {
        offset: new Vector3(0, 20, 8),
        lookOffset: new Vector3(0, 1, 0),
        smoothing: 10,
        minDistance: 5,
        maxDistance: 30
    });

    const timer = new Timer();
    const stats = new Stats();
    stats.showPanel(0); // 0 = FPS, 1 = ms, 2 = memory
    document.body.appendChild(stats.dom);

    const floorPosition = new Vector3()
    const arrows = new ArrowsPool(boxGeometry, boxMaterial, 20)
    scene.add(arrows.mesh)

    const markerMaterial = new MeshBasicMaterial({ color: 0x00FF00 });
    const marker = new Mesh(boxGeometry, markerMaterial);
    marker.scale.set(1.5*2, .5, 1.5);
    scene.add(marker);

    const minDistance = 8;
    const maxDistance = 16;

    renderer.setAnimationLoop(() => {
        stats.begin();
        timer.update();
        const delta = timer.getDelta();
        
        const hits = screenRaycaster.intersect(
            mouse.x, mouse.y, floor);

        if (hits.length > 0) {
            floorPosition.copy(hits[0].point);
            const distance = hits[0].point.distanceTo(player.position);
            marker.position.copy(hits[0].point);
            if (distance < minDistance) {
                const p = new Vector3(player.position.x, 0, player.position.z);
                marker.position.sub(p);
                marker.position.normalize().multiplyScalar(minDistance).add(p);
            }
            else if (distance > maxDistance) {
                const p = new Vector3(player.position.x, 0, player.position.z);
                marker.position.sub(p);
                marker.position.normalize().multiplyScalar(maxDistance).add(p);
            }
        }
        
        /*
        enemyBBox.setFromObject(enemy.group);
        for (let arrow of arrows.arrows) {
            if (enemyBBox.containsPoint(arrow.position)) {
                console.log("enemy being hit");
            }
        }
        */

        arrows.update(delta)
        controller.update(delta, floorPosition)
        playerCamera.update(delta)
        //enemy.update(player, delta);

        renderer.render(scene, camera);
        stats.end();
    });

    window.addEventListener('resize', () => {
          camera.aspect =
            window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    renderer.domElement.addEventListener("click", () => {
        arrows.shoot(player.position, marker.position)     
    })

    /*
    renderer.domElement.addEventListener('pointerdown', (event) => {
        const hits = screenRaycaster.intersect(
            event.clientX,
            event.clientY,
            [floor]
        );

        if (hits.length > 0) {
            player.position.copy(hits[0].point)
        }
    });
    */
}

main()
