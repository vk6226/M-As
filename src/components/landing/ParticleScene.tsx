import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { SHAPES, pedestal } from './shapes';

/* ==========================================================================
   Cinematic particle object.
   - ~24k points morph between three finance forms. During a morph each
     particle dissolves outward on its own delay, drifts, and re-forms.
   - The cursor pushes particles away like wind through leaves.
   - Glowing shards drift down through light shafts.
   - Pauses when off-screen or the tab is hidden; static under reduced motion.
   ========================================================================== */

export interface SceneAnchor {
  x: number;
  y: number;
  visible: boolean;
}

export interface ParticleSceneHandle {
  morphTo: (index: number) => void;
}

interface Props {
  shape: number;
  onAnchors?: (anchors: SceneAnchor[]) => void;
  /** Anchor points (world space) per shape, projected to screen each frame. */
  anchors: [number, number, number][][];
  className?: string;
}

const VERT = /* glsl */ `
  attribute vec3 aShape0;
  attribute vec3 aShape1;
  attribute vec3 aShape2;
  attribute vec4 aRand;          // x: delay, y: size, z: hue, w: drift phase
  uniform float uTime;
  uniform float uFrom;
  uniform float uTo;
  uniform float uProgress;       // 0..1 overall morph progress
  uniform vec3 uMouse;           // world-space cursor on z = 0 plane
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vAlpha;
  varying float vHue;
  varying float vHeight;

  vec3 shapeAt(float idx) {
    if (idx < 0.5) return aShape0;
    if (idx < 1.5) return aShape1;
    return aShape2;
  }

  // Cheap smooth noise for drift.
  vec3 drift(vec3 p, float t, float ph) {
    return vec3(
      sin(p.y * 1.7 + t * 0.6 + ph * 6.28),
      cos(p.x * 1.3 + t * 0.5 + ph * 4.0),
      sin(p.z * 1.9 + t * 0.7 + ph * 2.0)
    );
  }

  void main() {
    vec3 a = shapeAt(uFrom);
    vec3 b = shapeAt(uTo);

    // Staggered progress: each particle leaves on its own delay.
    float d = aRand.x * 0.45;
    float t = clamp((uProgress - d) / 0.55, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(a, b, e);

    // Dissolve: particles burst outward and upward mid-flight, like petals.
    float burst = sin(e * 3.14159);
    vec3 outward = normalize(p - vec3(0.0, -0.2, 0.0) + 0.0001);
    p += outward * burst * (0.6 + aRand.y * 0.9);
    p.y += burst * (0.35 + aRand.w * 0.6);
    p += drift(p, uTime, aRand.w) * burst * 0.35;

    // Idle breathing.
    p += drift(p, uTime * 0.6, aRand.w) * 0.012;

    // Cursor wind.
    vec3 toP = p - uMouse;
    float dist = length(toP.xy);
    float push = uMouseStrength * smoothstep(0.95, 0.0, dist);
    p.xy += normalize(toP.xy + 0.0001) * push * 0.55;
    p.z += push * 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aRand.y * 1.1) * (1.0 + burst * 0.6);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);

    vHue = aRand.z;
    vHeight = p.y;
    vAlpha = (0.7 + aRand.y * 0.5) * (1.0 - burst * 0.3);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vAlpha;
  varying float vHue;
  varying float vHeight;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float core = smoothstep(0.5, 0.0, r);
    core = core * core * 1.6;
    vec3 col = mix(uColorA, uColorB, smoothstep(0.35, 1.0, vHue));
    col = mix(col, uColorC, smoothstep(0.9, 1.0, vHue));
    col *= 0.85 + 0.35 * smoothstep(-1.5, 2.2, vHeight);
    gl_FragColor = vec4(col, core * vAlpha);
  }
`;

const SHARD_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vRot;
  varying float vAlpha;
  void main() {
    float speed = 0.12 + aSeed.y * 0.18;
    float y = mod(aSeed.x * 6.0 - uTime * speed, 6.0) - 2.4;
    vec3 p = vec3(
      position.x + sin(uTime * 0.4 + aSeed.z * 6.28) * 0.35,
      y,
      position.z + cos(uTime * 0.3 + aSeed.w * 6.28) * 0.25
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (10.0 + aSeed.y * 14.0) * uPixelRatio * (6.0 / -mv.z);
    vRot = uTime * (0.6 + aSeed.w) + aSeed.z * 6.28;
    vAlpha = smoothstep(-2.4, -1.6, y) * smoothstep(3.6, 2.6, y) * (0.45 + aSeed.y * 0.5);
  }
`;

const SHARD_FRAG = /* glsl */ `
  varying float vRot;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot), co = cos(vRot);
    c = vec2(c.x * co - c.y * s, c.x * s + c.y * co);
    float d = length(c / vec2(0.18, 0.42)); // elongated petal / shard
    if (d > 1.0) discard;
    vec3 col = mix(vec3(0.55, 0.62, 1.0), vec3(0.82, 0.88, 1.0), 1.0 - d);
    gl_FragColor = vec4(col, (1.0 - d) * vAlpha);
  }
`;

export const ParticleScene = forwardRef<ParticleSceneHandle, Props>(({ shape, onAnchors, anchors, className }, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<{ morphTo: (i: number) => void } | null>(null);
  const anchorsRef = useRef(anchors);
  anchorsRef.current = anchors;
  const onAnchorsRef = useRef(onAnchors);
  onAnchorsRef.current = onAnchors;

  useImperativeHandle(ref, () => ({ morphTo: (i: number) => api.current?.morphTo(i) }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 760;
    const N = small ? 9000 : 24000;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch {
      host.dataset.webgl = 'unavailable';
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(0, 0.45, 8.6);
    camera.lookAt(0, 0.2, 0);

    const group = new THREE.Group();
    scene.add(group);

    /* --- main particle object --- */
    const geo = new THREE.BufferGeometry();
    const shapes = SHAPES.map((s, i) => s.build(N, i + 11));
    geo.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
    geo.setAttribute('aShape0', new THREE.BufferAttribute(shapes[0], 3));
    geo.setAttribute('aShape1', new THREE.BufferAttribute(shapes[1], 3));
    geo.setAttribute('aShape2', new THREE.BufferAttribute(shapes[2], 3));
    const rand = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

    const uniforms = {
      uTime: { value: 0 },
      uFrom: { value: shape },
      uTo: { value: shape },
      uProgress: { value: 1 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: dpr },
      uSize: { value: small ? 3.4 : 3.0 },
      uColorA: { value: new THREE.Color('#b4c2ea') },
      uColorB: { value: new THREE.Color('#f4f7ff') },
      uColorC: { value: new THREE.Color('#7d93ff') },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geo, mat);
    group.add(points);

    /* --- pedestal --- */
    const pGeo = new THREE.BufferGeometry();
    const pN = small ? 2500 : 6000;
    const pPos = pedestal(pN);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aShape0', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aShape1', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aShape2', new THREE.BufferAttribute(pPos, 3));
    const pRand = new Float32Array(pN * 4);
    for (let i = 0; i < pN * 4; i++) pRand[i] = Math.random() * (i % 4 === 0 ? 0 : 1);
    pGeo.setAttribute('aRand', new THREE.BufferAttribute(pRand, 4));
    const pUniforms = { ...uniforms, uFrom: { value: 0 }, uTo: { value: 0 }, uProgress: { value: 1 }, uSize: { value: 2.4 }, uColorA: { value: new THREE.Color('#8494c4') }, uColorB: { value: new THREE.Color('#d6def8') }, uColorC: { value: new THREE.Color('#d6def8') } };
    const pedMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: pUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(pGeo, pedMat));

    /* --- drifting shards --- */
    const sN = small ? 28 : 70;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(sN * 3);
    const sSeed = new Float32Array(sN * 4);
    for (let i = 0; i < sN; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 6.5;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      for (let k = 0; k < 4; k++) sSeed[i * 4 + k] = Math.random();
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 4));
    const sUniforms = { uTime: uniforms.uTime, uPixelRatio: uniforms.uPixelRatio };
    const sMat = new THREE.ShaderMaterial({ vertexShader: SHARD_VERT, fragmentShader: SHARD_FRAG, uniforms: sUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(sGeo, sMat));

    /* --- sizing --- */
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      // Keep the object a similar size on narrow screens.
      camera.position.z = camera.aspect < 0.9 ? 11.5 : 8.6;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* --- pointer --- */
    const ndc = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    let targetStrength = 0;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        const local = group.worldToLocal(hit.clone());
        uniforms.uMouse.value.lerp(local, 0.35);
        targetStrength = 1;
      }
    };
    const onLeave = () => (targetStrength = 0);
    window.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);

    /* --- morph control --- */
    let morphStart = -1;
    const MORPH_MS = 2600;
    api.current = {
      morphTo: (i: number) => {
        if (i === uniforms.uTo.value && uniforms.uProgress.value >= 1) return;
        uniforms.uFrom.value = uniforms.uProgress.value >= 1 ? uniforms.uTo.value : uniforms.uFrom.value;
        uniforms.uTo.value = i;
        uniforms.uProgress.value = 0;
        morphStart = performance.now();
        if (reduce) uniforms.uProgress.value = 1;
      },
    };

    /* --- loop --- */
    let raf = 0;
    let running = true;
    let visible = true;
    let lastT = performance.now();
    const delta = () => {
      const now = performance.now();
      const d = (now - lastT) / 1000;
      lastT = now;
      return d;
    };
    const proj = new THREE.Vector3();
    const tick = () => {
      raf = 0;
      if (!running || !visible) return;
      const dt = Math.min(delta(), 0.05);
      if (!reduce) uniforms.uTime.value += dt;
      if (morphStart >= 0) {
        const p = Math.min(1, (performance.now() - morphStart) / MORPH_MS);
        uniforms.uProgress.value = p;
        if (p >= 1) {
          morphStart = -1;
          uniforms.uFrom.value = uniforms.uTo.value;
        }
      }
      uniforms.uMouseStrength.value += (targetStrength - uniforms.uMouseStrength.value) * 0.08;
      if (!reduce) {
        if (uniforms.uTo.value === 0) {
          group.rotation.y += dt * 0.12; // the globe turns
        } else {
          // Other forms sway gently; ease back from wherever the globe left off.
          const cur = Math.atan2(Math.sin(group.rotation.y), Math.cos(group.rotation.y));
          const target = Math.sin(uniforms.uTime.value * 0.25) * (uniforms.uTo.value === 1 ? 0.28 : 0.35);
          group.rotation.y = cur + (target - cur) * Math.min(1, dt * 1.6);
        }
      }
      renderer.render(scene, camera);

      // Project hotspot anchors to screen space.
      const list = anchorsRef.current[uniforms.uTo.value] ?? [];
      if (onAnchorsRef.current) {
        const w = host.clientWidth;
        const h = host.clientHeight;
        const settled = uniforms.uProgress.value > 0.92;
        onAnchorsRef.current(
          list.map(([x, y, z]) => {
            proj.set(x, y, z);
            group.localToWorld(proj);
            const facing = proj.z > -0.6;
            proj.project(camera);
            return { x: (proj.x * 0.5 + 0.5) * w, y: (-proj.y * 0.5 + 0.5) * h, visible: settled && facing };
          })
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        delta();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(host);
    const onVis = () => {
      running = !document.hidden;
      if (running && !raf) {
        delta();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      geo.dispose();
      pGeo.dispose();
      sGeo.dispose();
      mat.dispose();
      pedMat.dispose();
      sMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
    // The scene is built once; shape changes go through morphTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.morphTo(shape);
  }, [shape]);

  return <div ref={hostRef} className={className} aria-hidden />;
});
ParticleScene.displayName = 'ParticleScene';
