import * as THREE from 'three';

const _dummy = new THREE.Object3D();
const _up = new THREE.Vector3(0, 1, 0);
const _quaternion = new THREE.Quaternion();

export default class ParticleSystem {
    constructor(
        geometry,
        material,
        count = 100,
        {
            lifetime = 1,
            oneShot = false,

            emission = 'point',
            emissionRadius = 1,
            emissionExtents = new THREE.Vector3(1, 1, 1),

            direction = new THREE.Vector3(0, 1, 0),
            spread = 0,

            speed = 1,
            speedRandom = 0,

            gravity = new THREE.Vector3(0, -9.8, 0),
            damping = 0,

            scale = 1,
            scaleRandom = 0,
            scaleOverLifetime = null,

            color = new THREE.Color(1, 1, 1),
            colorOverLifetime = null,

            rotation = 0,
            rotationRandom = 0,
            rotationSpeed = 0,
            rotationSpeedRandom = 0,

            lifetimeRandom = 0,
        } = {}
    ) {
        this.geometry = geometry;
        this.material = material;
        this.count = count;

        this.lifetime = lifetime;
        this.oneShot = oneShot;

        this.emission = emission;
        this.emissionRadius = emissionRadius;
        this.emissionExtents = emissionExtents.clone();

        this.direction = direction.clone().normalize();
        this.spread = spread;

        this.speed = speed;
        this.speedRandom = speedRandom;

        this.gravity = gravity.clone();
        this.damping = damping;

        this.scale = scale;
        this.scaleRandom = scaleRandom;
        this.scaleOverLifetime = scaleOverLifetime;

        this.color = this._normalizeColor(color);
        this.colorOverLifetime =
            this._normalizeColorGradient(colorOverLifetime);

        this.rotation = rotation;
        this.rotationRandom = rotationRandom;

        this.rotationSpeed = rotationSpeed;
        this.rotationSpeedRandom = rotationSpeedRandom;

        this.lifetimeRandom = lifetimeRandom;

        this.mesh = new THREE.InstancedMesh(
            geometry,
            material,
            count
        );

        this.mesh.instanceMatrix.setUsage(
            THREE.DynamicDrawUsage
        );

        this.particles = [];

        for (let i = 0; i < count; i++) {
            this.particles.push(
                this._createParticle()
            );

            this._hide(i);
        }

        this._nextParticle = 0;
        this._emitting = false;
        this._emissionAccumulator = 0;
        this._time = 0;

        this._randomState = 12345;
    }

    addTo(parent) {
        parent.add(this.mesh);
        return this;
    }

    play() {
        this._emitting = true;
        return this;
    }

    stop() {
        this._emitting = false;
        return this;
    }

    restart() {
        this.clear();

        this._time = 0;
        this._emissionAccumulator = 0;
        this._emitting = true;

        return this;
    }

    clear() {
        this._emitting = false;
        this._emissionAccumulator = 0;

        for (let i = 0; i < this.count; i++) {
            this.particles[i].alive = false;
            this._hide(i);
        }

        this.mesh.instanceMatrix.needsUpdate = true;

        return this;
    }

    /*
     * Immediately spawn particles.
     *
     * Great for:
     * - explosions
     * - impacts
     * - hit sparks
     * - muzzle flashes
     * - bursts
     */
    emit(count = 1) {
        for (let i = 0; i < count; i++) {
            this._spawn();
        }

        this.mesh.instanceMatrix.needsUpdate = true;

        return this;
    }

    update(delta) {
        if (delta <= 0) {
            return;
        }

        this._time += delta;

        this._updateEmission(delta);
        this._updateParticles(delta);

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    _updateEmission(delta) {
        if (!this._emitting) {
            return;
        }

        const rate =
            this.count / this.lifetime;

        this._emissionAccumulator +=
            rate * delta;

        while (this._emissionAccumulator >= 1) {
            this._spawn();
            this._emissionAccumulator -= 1;
        }

        if (
            this.oneShot &&
            this._time >= this.lifetime
        ) {
            this._emitting = false;
        }
    }

    _updateParticles(delta) {
        for (let i = 0; i < this.count; i++) {
            const p = this.particles[i];

            if (!p.alive) {
                continue;
            }

            p.age += delta;

            if (p.age >= p.lifetime) {
                p.alive = false;
                this._hide(i);
                continue;
            }

            const t =
                p.age / p.lifetime;

            this._updateVelocity(p, delta);

            p.position.addScaledVector(
                p.velocity,
                delta
            );

            p.scale =
                p.baseScale *
                this._getScale(t);

            this._getColor(
                t,
                p.color
            );

            p.rotation +=
                p.rotationSpeed * delta;

            this._updateInstance(i, p);
        }
    }

    _spawn() {
        const index = this._findFree();

        if (index === -1) {
            return;
        }

        const p = this.particles[index];

        p.alive = true;
        p.age = 0;

        p.lifetime =
            this.lifetime *
            (
                1 -
                this._random() *
                this.lifetimeRandom
            );

        p.position.copy(
            this._emissionPosition()
        );

        p.velocity.copy(
            this._initialVelocity()
        );

        p.baseScale =
            this.scale *
            (
                1 +
                this._signed(this.scaleRandom)
            );

        p.scale = p.baseScale;

        this._getColor(
            0,
            p.color
        );

        p.rotation =
            this.rotation +
            this._signed(this.rotationRandom);

        p.rotationSpeed =
            this.rotationSpeed *
            (
                1 +
                this._signed(
                    this.rotationSpeedRandom
                )
            );

        this._updateInstance(index, p);
    }

    _createParticle() {
        return {
            alive: false,

            age: 0,
            lifetime: 0,

            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),

            baseScale: 1,
            scale: 1,

            color: new THREE.Color(),

            rotation: 0,
            rotationSpeed: 0,
        };
    }

    _initialVelocity() {
        const direction =
            this.direction.clone();

        if (this.spread > 0) {
            const angle =
                this._random() *
                Math.PI *
                2;

            const spread =
                THREE.MathUtils.degToRad(
                    this.spread
                );

            const radius =
                Math.sqrt(
                    this._random()
                ) * spread;

            const local =
                new THREE.Vector3(
                    Math.sin(radius) *
                        Math.cos(angle),

                    Math.cos(radius),

                    Math.sin(radius) *
                        Math.sin(angle)
                );

            _quaternion.setFromUnitVectors(
                _up,
                direction
            );

            direction.copy(
                local.applyQuaternion(
                    _quaternion
                )
            );
        }

        const speed =
            this.speed *
            (
                1 +
                this._signed(
                    this.speedRandom
                )
            );

        return direction.multiplyScalar(
            Math.max(0, speed)
        );
    }

    _updateVelocity(p, delta) {
        if (this.gravity.lengthSq() > 0) {
            p.velocity.addScaledVector(
                this.gravity,
                delta
            );
        }

        if (this.damping > 0) {
            p.velocity.multiplyScalar(
                Math.max(
                    0,
                    1 -
                        this.damping *
                        delta
                )
            );
        }
    }

    _getScale(t) {
        if (!this.scaleOverLifetime) {
            return 1;
        }

        return this._curve(
            this.scaleOverLifetime,
            t
        );
    }

    /*
     * Returns the color at lifetime t.
     *
     * Supported:
     *
     * colorOverLifetime: [
     *     [0, '#ffffff'],
     *     [0.5, '#ff6600'],
     *     [1, '#000000']
     * ]
     *
     * Or simply:
     *
     * colorOverLifetime: [
     *     '#ffffff',
     *     '#ff6600',
     *     '#000000'
     * ]
     *
     * Each color may also be:
     *
     * {
     *     color: '#ff6600',
     *     alpha: 0.5
     * }
     */
    _getColor(t, target) {
        if (!this.colorOverLifetime) {
            target.copy(this.color);
            return;
        }

        const gradient =
            this.colorOverLifetime;

        if (gradient.length === 0) {
            target.copy(this.color);
            return;
        }

        if (gradient.length === 1) {
            target.copy(
                gradient[0].color
            );

            return;
        }

        let a = gradient[0];
        let b = gradient[
            gradient.length - 1
        ];

        for (
            let i = 0;
            i < gradient.length - 1;
            i++
        ) {
            if (
                t >= gradient[i].position &&
                t <= gradient[i + 1].position
            ) {
                a = gradient[i];
                b = gradient[i + 1];
                break;
            }
        }

        const range =
            b.position - a.position;

        const localT =
            range <= 0
                ? 0
                : THREE.MathUtils.clamp(
                      (t - a.position) /
                          range,
                      0,
                      1
                  );

        target.copy(a.color).lerp(
            b.color,
            localT
        );
    }

    _normalizeColor(value) {
        if (value instanceof THREE.Color) {
            return value.clone();
        }

        return new THREE.Color(value);
    }

    _normalizeColorGradient(value) {
        if (!value) {
            return null;
        }

        /*
         * Simple colors:
         *
         * ['#ffffff', '#ff6600', '#000000']
         */
        if (
            Array.isArray(value) &&
            value.every(
                item =>
                    typeof item === 'string' ||
                    item instanceof THREE.Color ||
                    typeof item === 'number'
            )
        ) {
            return value.map(
                (color, index) => ({
                    position:
                        index /
                        Math.max(
                            1,
                            value.length - 1
                        ),

                    color:
                        color instanceof
                        THREE.Color
                            ? color.clone()
                            : new THREE.Color(
                                  color
                              ),
                })
            );
        }

        /*
         * Gradient:
         *
         * [
         *     [0, '#ffffff'],
         *     [0.5, '#ff6600'],
         *     [1, '#000000']
         * ]
         */
        return value.map(point => {
            if (Array.isArray(point)) {
                return {
                    position: point[0],
                    color:
                        point[1] instanceof
                        THREE.Color
                            ? point[1].clone()
                            : new THREE.Color(
                                  point[1]
                            ),
                };
            }

            return {
                position:
                    point.position ?? 0,

                color:
                    point.color instanceof
                    THREE.Color
                        ? point.color.clone()
                        : new THREE.Color(
                              point.color
                        ),
            };
        });
    }

    _curve(curve, t) {
        if (typeof curve === 'function') {
            return curve(t);
        }

        if (!Array.isArray(curve)) {
            return curve;
        }

        if (curve.length === 0) {
            return 1;
        }

        if (curve.length === 1) {
            return curve[0];
        }

        const x =
            t * (curve.length - 1);

        const index =
            Math.floor(x);

        if (
            index >=
            curve.length - 1
        ) {
            return curve[
                curve.length - 1
            ];
        }

        return THREE.MathUtils.lerp(
            curve[index],
            curve[index + 1],
            x - index
        );
    }

    _emissionPosition() {
        switch (this.emission) {
            case 'sphere':
                return this._sphere(
                    this.emissionRadius
                );

            case 'box':
                return new THREE.Vector3(
                    this._signed(
                        this.emissionExtents.x
                    ),
                    this._signed(
                        this.emissionExtents.y
                    ),
                    this._signed(
                        this.emissionExtents.z
                    )
                );

            case 'point':
            default:
                return new THREE.Vector3();
        }
    }

    _sphere(radius) {
        const direction =
            new THREE.Vector3(
                this._signed(1),
                this._signed(1),
                this._signed(1)
            ).normalize();

        const distance =
            Math.cbrt(
                this._random()
            ) * radius;

        return direction.multiplyScalar(
            distance
        );
    }

    _updateInstance(index, p) {
        _dummy.position.copy(
            p.position
        );

        _dummy.rotation.set(
            0,
            0,
            p.rotation
        );

        _dummy.scale.setScalar(
            p.scale
        );

        _dummy.updateMatrix();

        this.mesh.setMatrixAt(
            index,
            _dummy.matrix
        );
    }

    _hide(index) {
        _dummy.position.set(0, 0, 0);

        _dummy.rotation.set(
            0,
            0,
            0
        );

        _dummy.scale.setScalar(0);

        _dummy.updateMatrix();

        this.mesh.setMatrixAt(
            index,
            _dummy.matrix
        );
    }

    _findFree() {
        for (let i = 0; i < this.count; i++) {
            const index =
                (
                    this._nextParticle +
                    i
                ) % this.count;

            if (
                !this.particles[index]
                    .alive
            ) {
                this._nextParticle =
                    (index + 1) %
                    this.count;

                return index;
            }
        }

        return -1;
    }

    _signed(amount) {
        return (
            (this._random() * 2 - 1) *
            amount
        );
    }

    _random() {
        let x =
            this._randomState;

        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;

        this._randomState = x;

        return (
            (x >>> 0) /
            4294967295
        );
    }
}

