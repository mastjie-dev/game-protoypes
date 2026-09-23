import {
    Scene, Color, PerspectiveCamera, WebGLRenderer, MeshStandardMaterial,
    DirectionalLight, AmbientLight, Timer, CapsuleGeometry, PlaneGeometry,
    PCFShadowMap, Mesh, TextureLoader, Vector3, SphereGeometry,
    MeshBasicMaterial, BoxGeometry, Box3, Box3Helper, Object3D,
    MeshPhongMaterial, BasicShadowMap, MathUtils,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import Signal from './signal.js'
import MouseInput from './mouse_input.js';
import KeyboardInput from './keyboard_input.js';
import ScreenRaycaster from './screen_raycaster.js';
import CameraShake from './camera_shake.js'

import { Player, PlayerController, PlayerCamera } from './player.js';
import { PawnManager } from './pawn.js'
import { NPC } from './npc.js'
import { Parts } from './collectible.js'
import Consumables from './consumables.js'
import Floor from './floor.js'
import ArcProjectiles from './arc_projectiles.js'
import TargetMarker from './target_marker.js'
import ParticleSystem from './particles_system.js'

import './style.css'

/* 
   TODO:
   - collectibles
   - particles manager
    - on projectiles hit
    - on enemies die
    - etc...
   - reactive healthbar
   - design
    - floor
    - enemies & npc
   - animations
   - audios
*/

async function main() {
    const width = 800;
    const height = 480;
    
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = BasicShadowMap;
    document.body.appendChild(renderer.domElement);
    
    const mouse = new MouseInput(renderer.domElement)
    const keyboard = new KeyboardInput()

    const scene = new Scene();
    scene.background = new Color(0x87ceeb);

    const aspect = width  / height;
    const camera = new PerspectiveCamera(70, aspect, 0.1,200);
    camera.position.set(0, 10, 8);
    camera.lookAt(0, 0, 0)
  
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
    player.mesh.position.set(-3, 0, 28);
    player.addToScene(scene);
    
    const playerController = new PlayerController(player.mesh, keyboard, 8)
    const playerCamera = new PlayerCamera(camera, player.mesh, {
        offset: new Vector3(0, 18, 8),
        lookOffset: new Vector3(0, 1, 0),
        smoothing: 10,
        minDistance: 5,
        maxDistance: 30
    });

    const targetMarker = new TargetMarker(8, 16);
    targetMarker.addToScene(scene);

    const npc = new NPC(signal);
    npc.addToScene(scene);
    
    const pawns = new PawnManager(new BoxGeometry(), 
        new MeshPhongMaterial({ color: 0xFF0000 }), 16, signal)
    pawns.addToScene(scene);
    pawns.spawn(400);

    const arrows = new ArcProjectiles(new BoxGeometry(.2, 1, .2),
        new MeshBasicMaterial({color: 0x0055EE}), 32, signal); 
    arrows.addToScene(scene);

    /*
    const parts = new Consumables(new BoxGeometry(), new MeshPhongMaterial({ color: 0xEE22EE }));
    parts.addToScene(scene);

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
    */
    
    const screenRaycaster = new ScreenRaycaster(camera, renderer.domElement);
    const shake = new CameraShake(camera);
    const raycastPosition = new Vector3();
    const timer = new Timer();
    const stats = new Stats();
    stats.showPanel(0); // 0 = FPS, 1 = ms, 2 = memory
    document.body.appendChild(stats.dom);

    renderer.setAnimationLoop(() => {
        stats.begin();
        timer.update();
        const delta = timer.getDelta();
     
        const hits = screenRaycaster.intersects(
            mouse.x, mouse.y, floor.mesh.children);
        if (hits.length) {
            raycastPosition.copy(hits[0].point);
        }
    
        playerController.update(delta, raycastPosition)
        playerCamera.update(delta);
        targetMarker.update(player.mesh.position, raycastPosition);
        arrows.update(delta)
        arrows.checkCollision(floor.hitbox, pawns.pawns);
        //pawns.spawn(delta);
        pawns.update(delta);
        //shake.update(delta);
        //explosion.update(delta);        
        //parts.update(delta, player.mesh.position);
        
        renderer.render(scene, camera);
        stats.end();
    });

    signal.register("hit-floor", () => {
        shake.shake(.3, .7);
    });
    signal.register("npc-dead", () => {
        console.log("game over, show menu, yada yada yada...");
    })
    signal.register("start-phase-01", () => {
        
    })
    signal.register("arrow-hit-floor", position => {
        /*
            show particles, check if enemies nearby
        */
        for (let P of pawns.pawns) {
            const dist = P.position.distanceTo(position);
            if (dist < .5) {
                P.onHit(100);
            }
            else if (dist < 2) {
                const t = 1 - MathUtils.clamp((dist - .5) / 1.5, 0, 1);
                const damage = 80 * t;
                P.onHit(damage);
            }
        }
    })
    signal.register("pawn-explode", () => {
        npc.onHit(40);
    })

    window.addEventListener('resize', () => {
          camera.aspect =
            window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    renderer.domElement.addEventListener("click", e => {
        e.preventDefault();
        arrows.shoot(player.mesh.position, targetMarker.mesh.position)
    })

    renderer.domElement.addEventListener("contextmenu", e => {
        e.preventDefault();
    })
}

main()
