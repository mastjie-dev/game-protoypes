// main.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

import ParticleSystem from './particles_system.js';


// ------------------------------------------------------------
// Scene
// ------------------------------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

document.body.appendChild(
    renderer.domElement
);


// ------------------------------------------------------------
// Camera controls
// ------------------------------------------------------------

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.target.set(0, 1, 0);
controls.enableDamping = true;


// ------------------------------------------------------------
// Lights
// ------------------------------------------------------------

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x222222,
        2
    )
);

const directionalLight =
    new THREE.DirectionalLight(
        0xffffff,
        2
    );

directionalLight.position.set(
    3,
    6,
    4
);

scene.add(
    directionalLight
);


// ------------------------------------------------------------
// Ground
// ------------------------------------------------------------

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 1,
    })
);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

scene.add(
    new THREE.GridHelper(
        20,
        20,
        0x444444,
        0x222222
    )
);


// ------------------------------------------------------------
// Particle geometry
// ------------------------------------------------------------

const particleGeometry =
    new THREE.BoxGeometry();


// ------------------------------------------------------------
// Particle material
// ------------------------------------------------------------

const particleMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });


// ------------------------------------------------------------
// Particle system
// ------------------------------------------------------------

let particles;


// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const config = {
    lifetime: 0.6,

    emission: 'sphere',
    emissionRadius: 0.05,

    direction: new THREE.Vector3(
        0,
        1,
        0
    ),

    spread: 60,

    speed: 8,
    speedRandom: 0.5,

    gravity: new THREE.Vector3(
        0,
        -10,
        0
    ),

    damping: 0,

    scale: 0.15,
    scaleRandom: 0.3,

    scaleOverLifetime: [
        1,
        1.5,
        0,
    ],

    color: '#ffffff',

    rotation: 0,
    rotationRandom: Math.PI,
    rotationSpeed: 5,
    rotationSpeedRandom: 0.5,

    lifetimeRandom: 0.2,

    emitCount: 30,
};


// ------------------------------------------------------------
// Create particle system
// ------------------------------------------------------------

function createParticles() {
    if (particles) {
        scene.remove(
            particles.mesh
        );

        particles.clear();
    }

    particles =
        new ParticleSystem(
            particleGeometry,
            particleMaterial,
            200,
            {
                lifetime:
                    config.lifetime,

                emission:
                    config.emission,

                emissionRadius:
                    config.emissionRadius,

                direction:
                    config.direction,

                spread:
                    config.spread,

                speed:
                    config.speed,

                speedRandom:
                    config.speedRandom,

                gravity:
                    config.gravity,

                damping:
                    config.damping,

                scale:
                    config.scale,

                scaleRandom:
                    config.scaleRandom,

                scaleOverLifetime:
                    config.scaleOverLifetime,

                color:
                    config.color,

                colorOverLifetime: [
                    [0, '#ffffff'],
                    [0.15, '#ffffaa'],
                    [0.5, '#ff6600'],
                    [1, '#220000'],
                ],

                rotation:
                    config.rotation,

                rotationRandom:
                    config.rotationRandom,

                rotationSpeed:
                    config.rotationSpeed,

                rotationSpeedRandom:
                    config.rotationSpeedRandom,

                lifetimeRandom:
                    config.lifetimeRandom,
            }
        );

    particles.addTo(scene);
}


// ------------------------------------------------------------
// Initial particle system
// ------------------------------------------------------------

createParticles();


// ------------------------------------------------------------
// GUI
// ------------------------------------------------------------

const gui = new GUI({
    title: 'Particle System',
});


// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

const actions = {
    emit() {
        particles.emit(
            config.emitCount
        );
    },

    clear() {
        particles.clear();
    },

    restart() {
        particles.restart();
    },

    play() {
        particles.play();
    },

    stop() {
        particles.stop();
    },

    explosion() {
        Object.assign(config, {
            lifetime: 0.6,

            emission: 'sphere',
            emissionRadius: 0.05,

            direction:
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),

            spread: 180,

            speed: 8,
            speedRandom: 0.5,

            gravity:
                new THREE.Vector3(
                    0,
                    -10,
                    0
                ),

            damping: 0,

            scale: 0.15,
            scaleRandom: 0.4,

            scaleOverLifetime: [
                1,
                1.5,
                0,
            ],

            rotation: 0,
            rotationRandom: Math.PI,
            rotationSpeed: 5,
            rotationSpeedRandom: 0.5,

            lifetimeRandom: 0.3,

            emitCount: 40,
        });

        updateGUI();
        createParticles();

        particles.emit(
            config.emitCount
        );
    },

    trail() {
        Object.assign(config, {
            lifetime: 0.5,

            emission: 'point',
            emissionRadius: 0,

            direction:
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),

            spread: 15,

            speed: 1,
            speedRandom: 0.2,

            gravity:
                new THREE.Vector3(
                    0,
                    0,
                    0
                ),

            damping: 0,

            scale: 0.15,
            scaleRandom: 0.2,

            scaleOverLifetime: [
                1,
                0,
            ],

            rotation: 0,
            rotationRandom: Math.PI,
            rotationSpeed: 2,
            rotationSpeedRandom: 0.5,

            lifetimeRandom: 0.2,

            emitCount: 10,
        });

        updateGUI();
        createParticles();

        particles.play();
    },
};


const actionFolder =
    gui.addFolder('Actions');

actionFolder
    .add(actions, 'emit')
    .name('Emit');

actionFolder
    .add(actions, 'explosion')
    .name('Explosion');

actionFolder
    .add(actions, 'trail')
    .name('Trail');

actionFolder
    .add(actions, 'play')
    .name('Play');

actionFolder
    .add(actions, 'stop')
    .name('Stop');

actionFolder
    .add(actions, 'restart')
    .name('Restart');

actionFolder
    .add(actions, 'clear')
    .name('Clear');


// ------------------------------------------------------------
// Basic settings
// ------------------------------------------------------------

const basicFolder =
    gui.addFolder('Basic');

basicFolder
    .add(
        config,
        'lifetime',
        0.05,
        5,
        0.01
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'speed',
        0,
        30,
        0.1
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'speedRandom',
        0,
        1,
        0.01
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'spread',
        0,
        180,
        1
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'damping',
        0,
        10,
        0.1
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'lifetimeRandom',
        0,
        1,
        0.01
    )
    .onChange(createParticles);

basicFolder
    .add(
        config,
        'emitCount',
        1,
        200,
        1
    );


// ------------------------------------------------------------
// Emission
// ------------------------------------------------------------

const emissionFolder =
    gui.addFolder('Emission');

emissionFolder
    .add(
        config,
        'emission',
        [
            'point',
            'sphere',
            'box',
        ]
    )
    .onChange(createParticles);

emissionFolder
    .add(
        config,
        'emissionRadius',
        0,
        2,
        0.01
    )
    .onChange(createParticles);


// ------------------------------------------------------------
// Scale
// ------------------------------------------------------------

const scaleFolder =
    gui.addFolder('Scale');

scaleFolder
    .add(
        config,
        'scale',
        0.01,
        1,
        0.01
    )
    .onChange(createParticles);

scaleFolder
    .add(
        config,
        'scaleRandom',
        0,
        1,
        0.01
    )
    .onChange(createParticles);


// ------------------------------------------------------------
// Rotation
// ------------------------------------------------------------

const rotationFolder =
    gui.addFolder('Rotation');

rotationFolder
    .add(
        config,
        'rotation',
        -Math.PI,
        Math.PI,
        0.01
    )
    .onChange(createParticles);

rotationFolder
    .add(
        config,
        'rotationRandom',
        0,
        Math.PI,
        0.01
    )
    .onChange(createParticles);

rotationFolder
    .add(
        config,
        'rotationSpeed',
        -20,
        20,
        0.1
    )
    .onChange(createParticles);

rotationFolder
    .add(
        config,
        'rotationSpeedRandom',
        0,
        1,
        0.01
    )
    .onChange(createParticles);


// ------------------------------------------------------------
// Gravity
// ------------------------------------------------------------

const gravityFolder =
    gui.addFolder('Gravity');

gravityFolder
    .add(
        config.gravity,
        'x',
        -30,
        30,
        0.1
    )
    .onChange(createParticles);

gravityFolder
    .add(
        config.gravity,
        'y',
        -30,
        30,
        0.1
    )
    .onChange(createParticles);

gravityFolder
    .add(
        config.gravity,
        'z',
        -30,
        30,
        0.1
    )
    .onChange(createParticles);


// ------------------------------------------------------------
// GUI refresh
// ------------------------------------------------------------

function updateGUI() {
    gui.controllersRecursive().forEach(
        controller => controller.updateDisplay()
    );
}


// ------------------------------------------------------------
// Animation
// ------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    particles.update(delta);

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();


// ------------------------------------------------------------
// Resize
// ------------------------------------------------------------

window.addEventListener(
    'resize',
    () => {
        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);

