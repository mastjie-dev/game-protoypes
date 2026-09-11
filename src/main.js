import {
    Scene, Color, PerspectiveCamera, WebGLRenderer, MeshStandardMaterial,
    DirectionalLight, AmbientLight, Timer, CapsuleGeometry, PlaneGeometry,
    PCFShadowMap, Mesh, TextureLoader, Vector3, SphereGeometry,
    MeshBasicMaterial, BoxGeometry, Box3, Box3Helper, Object3D,
    MeshPhongMaterial, BasicShadowMap,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import Signal from './signal.js'
import MouseInput from './mouse_input.js';
import KeyboardInput from './keyboard_input.js';
import PlayerController from './player_controller.js';
import ScreenRaycaster from './screen_raycaster.js';
import PlayerCamera from './player_camera.js'
import ArrowsPool from './arrows_pool.js'
import Sheeps from './sheeps.js'
import Enemy from './enemy.js'
import ParticleSystem from './particles_system.js'
import CameraShake from './camera_shake.js'

import './style.css'

async function main() {
    const width = 800;
    const height = 480;

    const scene = new Scene();
    scene.background = new Color(0x87ceeb);

    const aspect = width  / height;
    const camera = new PerspectiveCamera(
        70,
        aspect,
        0.1,
        200
    );
    camera.position.set(0, 10, 8);
    camera.lookAt(0, 0, 0)

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = BasicShadowMap;
    document.body.appendChild(renderer.domElement);
  
    /*
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    */

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

    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);

    const signal = new Signal();
    
    const textureLoader = new TextureLoader();
    const uvTexture = textureLoader.load('/uv_texture_bw.png');

    const floorGeometry = new PlaneGeometry(20, 20);
    const floorMaterial = new MeshPhongMaterial({ map: uvTexture });
    const floors = [];
    
    for (let y = -20; y <= 20; y+=20) {
        for (let x = -20; x <= 20; x+=20) {
            const floor = new Mesh(
              floorGeometry,
              floorMaterial
            );
            floor.position.set(x, 0, y)
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            scene.add(floor);
            floors.push(floor);
        }
    }

    const capsuleGeometry = new CapsuleGeometry(
      0.5,  // radius
      1.5,  // length
      16,   // cap segments
      32    // radial segments
    );
    const capsuleMaterial = new MeshPhongMaterial({ color: 0x22EE41 })
    
    const player = new Mesh(
      capsuleGeometry,
      capsuleMaterial
    );
    player.position.y = 1.25;
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
    
    const boxGeometry = new BoxGeometry(.4, .4, 1);
    const box = new Mesh(boxGeometry, capsuleMaterial)
    box.position.set(0, .8, -.5)
    player.add(box)
   
    const enemies = []; 
    for (let i = 0; i < 5; i++) {
        const rPos = new Vector3().randomDirection().multiplyScalar(20);
        rPos.y = 1;
        const enemy = new Enemy(rPos);
        enemy.addToScene(scene);
        enemies.push(enemy);
    }
    
    const sheepGeo = new BoxGeometry(1.5, 1.5, 1.5);
    const sheepMat = new MeshPhongMaterial({ color: 0xeeff33 });
    const sheeps = new Sheeps(sheepGeo, sheepMat, 20);
    sheeps.addToScene(scene);

    const enemyBBox = new Box3(new Vector3(-3.25, 0, -3.25), new Vector3(3.25, 0, 3.25));
    //const enemyBBoxH = new Box3Helper(enemyBBox);
    //scene.add(enemyBBoxH);

    const mouse = new MouseInput(renderer.domElement)
    const keyboard = new KeyboardInput()
    const controller = new PlayerController(player, keyboard, 8)
    const screenRaycaster = new ScreenRaycaster(camera, renderer.domElement);
    const playerCamera = new PlayerCamera(camera, player, {
        offset: new Vector3(0, 18, 8),
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
    const arrows = new ArrowsPool(boxGeometry, capsuleMaterial, 20, signal)
    scene.add(arrows.mesh)

    const markerMaterial = new MeshBasicMaterial({ color: 0x00FF00 });
    const marker = new Mesh(boxGeometry, markerMaterial);
    marker.scale.set(1.5*2, .5, 1.5);
    //scene.add(marker);

    const minDistance = 8;
    const maxDistance = 16;
    
    const bx = new BoxGeometry();
    const bm = new MeshBasicMaterial({ color: 0xEE0000 });
    const explosion = new ParticleSystem(bx, bm, 50, {
        lifetime: .6,
        emission: 'sphere',
        emissionRadius: 0.05,
        direction: new Vector3(0, 1, 0),
        spread: 180,
        speed: 8,
        speedRandom: 0.5,
        gravity: new Vector3(0, -10, 0),
        damping: 0,
        scale: .35,
        scaleRandom: 0.4,
        scaleOverLifetime: [1, 1.5, 0],
        rotation: 0,
        rotationRandom: Math.PI,
        rotationSpeed: 5,
        rotationSpeedRandom: 0.5,
        lifetimeRandom: 0.3,
        emitCount: 30,
    })
    const exParent = new Object3D();
    explosion.addTo(exParent);
    scene.add(exParent);
    
    const shake = new CameraShake(camera);

    renderer.setAnimationLoop(() => {
        stats.begin();
        timer.update();
        const delta = timer.getDelta();
        
        const hits = screenRaycaster.intersects(
            mouse.x, mouse.y, floors);

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
       
        arrows.update(delta)
        controller.update(delta, floorPosition)
        playerCamera.update(delta);
        shake.update(delta);
        //explosion.update(delta);        
        
        /*
        for (let enemy of enemies) {
            if (!enemy.group.visible) continue;
            enemyBBox.setFromObject(enemy.group);
            for (let arrow of arrows.arrows) {
                if (enemyBBox.containsPoint(arrow.position)) {
                    exParent.position.copy(enemy.group.position);
                    enemy.group.visible = false;
                    explosion.emit(30);
                }
            }
            enemy.update(player, delta);
        }
        */

        renderer.render(scene, camera);
        stats.end();
    });

    signal.register("hit-floor", () => {
        shake.shake(.3, .7);
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

}

main()
