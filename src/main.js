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
import ScreenRaycaster from './screen_raycaster.js';
import CameraShake from './camera_shake.js'

import { Player, PlayerController, PlayerCamera } from './player.js';
import { Enemies } from './enemy.js'
import NPC from './npc.js'
import Floor from './floor.js'
import ArcProjectiles from './arc_projectiles.js'
import TargetMarker from './target_marker.js'
import ParticleSystem from './particles_system.js'

import './style.css'

async function main() {
    const width = 800;
    const height = 480;

    const scene = new Scene();
    scene.background = new Color(0x87ceeb);

    const aspect = width  / height;
    const camera = new PerspectiveCamera(70, aspect, 0.1,200);
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

    const ambientLight = new AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const sun = new DirectionalLight(0xffffff, 3);
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

    const floor = new Floor(uvTexture);
    floor.addToScene(scene);

    const player = new Player();
    player.addToScene(scene);

    const targetMarker = new TargetMarker(8, 16);
    targetMarker.addToScene(scene);
    
    const npc = new NPC();
    npc.addToScene(scene);

    const enemies = new Enemies(new BoxGeometry(), 
        new MeshPhongMaterial({ color: 0xFF0000 }), 10, player.mesh)
    enemies.addToScene(scene);

    const mouse = new MouseInput(renderer.domElement)
    const keyboard = new KeyboardInput()
    const screenRaycaster = new ScreenRaycaster(camera, renderer.domElement);
    const playerController = new PlayerController(player.mesh, keyboard, 8)
    const playerCamera = new PlayerCamera(camera, player.mesh, {
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

    /* 
       TODO:
       - particles manager??        
    */

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
    const raycastPosition = new Vector3();

    renderer.setAnimationLoop(() => {
        stats.begin();
        timer.update();
        const delta = timer.getDelta();
        
        const hits = screenRaycaster.intersects(
            mouse.x, mouse.y, floor.mesh.children);
        if (hits.length) {
            raycastPosition.copy(hits[0].point);
        }
               
        //arrows.update(delta)
        playerController.update(delta, raycastPosition)
        playerCamera.update(delta);
        targetMarker.update(player.mesh.position, raycastPosition);
        //enemies.update(delta);
        //shake.update(delta);
        //explosion.update(delta);        
        
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
        //arrows.shoot(player.position, marker.position)
    })
}

main()
