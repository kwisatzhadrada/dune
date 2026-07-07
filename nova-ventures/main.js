import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const isMobile = window.matchMedia('(max-width: 860px)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ============================================================
   WEBGL AVAILABILITY CHECK
   ============================================================ */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (!hasWebGL()) {
  document.body.classList.add('no-webgl');
}

/* ============================================================
   LOADER
   ============================================================ */
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
let loaderPct = 0;
const loaderTimer = setInterval(() => {
  loaderPct = Math.min(96, loaderPct + Math.random() * 18);
  loaderFill.style.width = loaderPct + '%';
}, 180);

function finishLoading() {
  clearInterval(loaderTimer);
  loaderFill.style.width = '100%';
  setTimeout(() => loader.classList.add('hidden'), 260);
}

/* ============================================================
   NOISE — Ashima simplex 3D (MIT)
   ============================================================ */
const GLSL_NOISE = `
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ============================================================
   NOVA CORE — the iridescent hero object
   ============================================================ */
const novaVertexShader = `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vNoise;
${GLSL_NOISE}
void main(){
  vec3 nrm = normalize(normal);
  float n = snoise(position * uFreq + vec3(0.0, 0.0, uTime * 0.12));
  vNoise = n;
  vec3 displaced = position + nrm * n * uAmp;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * nrm);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const novaFragmentShader = `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vNoise;
void main(){
  vec3 viewDir = normalize(vViewPos);
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.1);
  float hue = clamp(fresnel * 1.3 + vNoise * 0.4 + sin(uTime * 0.18) * 0.12, 0.0, 1.0);
  vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, hue));
  col = mix(col, uColorC, fresnel * 0.35);
  col += fresnel * fresnel * 0.4;
  gl_FragColor = vec4(col, uOpacity);
}
`;

function makeSpriteTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/* ============================================================
   SCENE SETUP
   ============================================================ */
let renderer, composer, scene, camera, clock;
let novaCore, novaUniforms, ringsGroup, particles, monolith, glassCube;
let pointWarm, pointCool;
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

function initScene() {
  const canvas = document.getElementById('webgl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040406, 0.02);

  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  clock = new THREE.Clock();

  scene.add(new THREE.AmbientLight(0x8899ff, 0.35));
  pointWarm = new THREE.PointLight(0xff8a4c, 4, 20, 2);
  pointWarm.position.set(2, 1.5, -4);
  scene.add(pointWarm);
  pointCool = new THREE.PointLight(0x8b6bff, 3, 20, 2);
  pointCool.position.set(-3, -1, -8);
  scene.add(pointCool);
  const rim = new THREE.PointLight(0x4fe3d0, 2.2, 14, 2);
  rim.position.set(0, 2, 2);
  scene.add(rim);

  buildNovaCore();
  buildRings();
  buildParticles();
  buildMonolith();
  buildGlassCube();
  buildStarBackdrop();

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.45 : 0.6,
    0.45,
    0.42
  );
  bloom.threshold = 0.42;
  composer.addPass(bloom);

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
}

function buildNovaCore() {
  const detail = isMobile ? 3 : 5;
  const geo = new THREE.IcosahedronGeometry(1.05, detail);
  novaUniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.16 },
    uFreq: { value: 1.6 },
    uColorA: { value: new THREE.Color(0x8b6bff) },
    uColorB: { value: new THREE.Color(0xff5fae) },
    uColorC: { value: new THREE.Color(0xffffff) },
    uOpacity: { value: 1.0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: novaVertexShader,
    fragmentShader: novaFragmentShader,
    uniforms: novaUniforms,
    transparent: true,
  });
  novaCore = new THREE.Mesh(geo, mat);
  novaCore.position.set(2.35, -0.15, -1.2);
  scene.add(novaCore);
}

function buildRings() {
  ringsGroup = new THREE.Group();
  const count = isMobile ? 7 : 11;
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb9bcc7,
    metalness: 0.6,
    roughness: 0.45,
    emissive: 0x140b06,
    emissiveIntensity: 0.3,
  });
  // rings are threaded exactly onto the camera path so the camera always
  // flies through the open hole instead of clipping the tube geometry
  const tStart = 0.07, tEnd = 0.5;
  const up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const curveT = lerp(tStart, tEnd, t);
    const center = cameraCurve.getPointAt(curveT);
    const tangent = cameraCurve.getTangentAt(curveT).normalize();
    const radius = lerp(1.9, 2.8, Math.sin(t * Math.PI * 1.4) * 0.5 + 0.5);

    const torusGeo = new THREE.TorusGeometry(radius, 0.035, 12, 64);
    torusGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(torusGeo, metalMat);
    ring.position.copy(center);
    ring.quaternion.setFromUnitVectors(up, tangent);
    ring.userData.isRing = true;
    ringsGroup.add(ring);

    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * Math.PI * 2 + t * 3;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), metalMat);
      const localOffset = new THREE.Vector3(Math.cos(a) * (radius + 0.25), Math.sin(a) * (radius + 0.25), 0);
      localOffset.applyQuaternion(ring.quaternion);
      spoke.position.copy(center).add(localOffset);
      spoke.quaternion.copy(ring.quaternion);
      spoke.rotateX(Math.PI / 2);
      ringsGroup.add(spoke);
    }
  }
  scene.add(ringsGroup);
}

function buildParticles() {
  const count = isMobile ? 1400 : 3200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const warm = new THREE.Color(0xff8a4c);
  const teal = new THREE.Color(0x4fe3d0);
  const violet = new THREE.Color(0x8b6bff);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = -6 - Math.random() * 11;

    velocities[i * 3] = (Math.random() - 0.5) * 0.03;
    velocities[i * 3 + 1] = Math.random() * 0.02 + 0.01;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

    const roll = Math.random();
    const col = roll < 0.12 ? warm : roll < 0.56 ? teal : violet;
    colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    sizes[i] = Math.random() * 0.14 + 0.03;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.userData.velocities = velocities;

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: makeSpriteTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    opacity: 0,
    sizeAttenuation: true,
  });

  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

function buildMonolith() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x14141a, metalness: 0.85, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.4, 1.5), mat);
  group.add(body);
  const edges = new THREE.EdgesGeometry(body.geometry);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0 });
  const lines = new THREE.LineSegments(edges, lineMat);
  lines.name = 'monolithEdges';
  group.add(lines);
  group.position.set(-1.4, 0.2, -15.5);
  body.material.transparent = true;
  body.material.opacity = 0;
  monolith = group;
  scene.add(monolith);
}

function buildGlassCube() {
  const geo = new THREE.BoxGeometry(2.1, 2.1, 2.1, 4, 4, 4);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe8e2ff,
    metalness: 0,
    roughness: 0.12,
    transmission: 1,
    thickness: 1.6,
    ior: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    transparent: true,
    opacity: 0,
  });
  glassCube = new THREE.Mesh(geo, mat);
  glassCube.position.set(0.4, -0.1, -19.5);
  glassCube.rotation.set(0.4, 0.6, 0.1);
  scene.add(glassCube);

  const finaleLight = new THREE.PointLight(0xffffff, 4, 10, 2);
  finaleLight.position.set(1.4, 1.1, -18);
  scene.add(finaleLight);
  const finaleLight2 = new THREE.PointLight(0x8b6bff, 3, 10, 2);
  finaleLight2.position.set(-1, -1, -20.5);
  scene.add(finaleLight2);
}

function buildStarBackdrop() {
  const count = isMobile ? 900 : 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 30 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = -r * Math.abs(Math.cos(phi)) - 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.05, color: 0xffffff, transparent: true, opacity: 0.55,
    map: makeSpriteTexture(), depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
}

/* ============================================================
   CAMERA PATH — cinematic route through the whole scene
   ============================================================ */
const pathPoints = [
  new THREE.Vector3(0, 0, 7.6),
  new THREE.Vector3(0, 0.15, 3.6),
  new THREE.Vector3(0.6, -0.1, 0.4),
  new THREE.Vector3(0.9, 0.35, -2.6),
  new THREE.Vector3(-1.1, 0.1, -5.4),
  new THREE.Vector3(-0.7, -0.35, -8.6),
  new THREE.Vector3(0.8, 0.4, -12.2),
  new THREE.Vector3(0.2, 0.9, -15.8),
  new THREE.Vector3(0.5, 0.15, -19.8),
];
const lookPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0.2, 0, -3),
  new THREE.Vector3(0, 0.1, -5.5),
  new THREE.Vector3(-0.3, 0, -8),
  new THREE.Vector3(0.2, -0.1, -11),
  new THREE.Vector3(0.3, 0.3, -14.5),
  new THREE.Vector3(0.2, 0.2, -18),
  new THREE.Vector3(0.4, -0.1, -21.5),
];
const cameraCurve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
const lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.5);

/* ============================================================
   SCROLL PROGRESS
   ============================================================ */
let rawProgress = 0;
let smoothProgress = 0;
let sections = [];
let maxScroll = 1;

function computeSections() {
  const els = Array.from(document.querySelectorAll('.chapter'));
  const total = document.documentElement.scrollHeight - window.innerHeight;
  maxScroll = Math.max(total, 1);
  sections = els.map((el) => ({
    el,
    idx: Number(el.dataset.chapter),
    top: el.offsetTop,
    height: el.offsetHeight,
  }));
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  computeSections();
}

function onMouseMove(e) {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
}
function onTouchMove(e) {
  if (!e.touches[0]) return;
  mouse.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
}

/* ============================================================
   PER-CHAPTER UNIFORM / SCENE STATE BLENDING
   ============================================================ */
const NOVA_PALETTES = [
  { a: 0x8b6bff, b: 0xff5fae, amp: 0.1 },   // hero
  { a: 0x8b6bff, b: 0x4fe3d0, amp: 0.22 },  // thesis (ignition breathing)
  { a: 0xff8a4c, b: 0x8b6bff, amp: 0.12 },  // focus
  { a: 0x4fe3d0, b: 0xff5fae, amp: 0.08 },  // portfolio
  { a: 0xffffff, b: 0xff8a4c, amp: 0.06 },  // scale
  { a: 0x8b6bff, b: 0x4fe3d0, amp: 0.04 },  // contact
];
const colA = new THREE.Color();
const colB = new THREE.Color();

function updateSceneForProgress(p, dt, elapsed) {
  novaUniforms.uTime.value = elapsed;

  // chapter blending (6 chapters spread across full progress)
  const chapterF = p * 5;
  const idx = clamp(Math.floor(chapterF), 0, 4);
  const localT = clamp(chapterF - idx, 0, 1);
  const pa = NOVA_PALETTES[idx];
  const pb = NOVA_PALETTES[Math.min(idx + 1, NOVA_PALETTES.length - 1)];
  colA.set(pa.a).lerp(colB.set(pb.a), localT);
  novaUniforms.uColorA.value.copy(colA);
  colA.set(pa.b).lerp(colB.set(pb.b), localT);
  novaUniforms.uColorB.value.copy(colA);
  novaUniforms.uAmp.value = lerp(pa.amp, pb.amp, localT);

  // nova core shrinks / fades well before the camera reaches the tunnel,
  // otherwise its residual bloom balloons as the camera flies past it
  const coreVisibility = 1 - smoothstep(0.07, 0.19, p);
  const coreScale = lerp(1, 0.2, smoothstep(0.07, 0.19, p));
  novaCore.scale.setScalar(coreScale);
  novaUniforms.uOpacity.value = Math.max(coreVisibility, 0.0001);
  novaCore.visible = coreVisibility > 0.01;

  // rings tunnel: visible roughly 0.14 - 0.5
  const ringsIn = smoothstep(0.13, 0.24, p);
  const ringsOut = 1 - smoothstep(0.46, 0.56, p);
  const ringsVis = ringsIn * ringsOut;
  ringsGroup.children.forEach((child) => {
    child.material.opacity = ringsVis;
    child.material.transparent = true;
    if (child.userData.isRing) child.rotateZ(dt * 0.18);
  });
  ringsGroup.visible = ringsVis > 0.01;

  // particle field: visible roughly 0.42 - 0.78
  const partIn = smoothstep(0.4, 0.52, p);
  const partOut = 1 - smoothstep(0.74, 0.86, p);
  particles.material.opacity = 0.85 * partIn * partOut;

  // monolith: visible roughly 0.6 - 0.85
  const monoIn = smoothstep(0.58, 0.68, p);
  const monoOut = 1 - smoothstep(0.82, 0.9, p);
  const monoVis = monoIn * monoOut;
  monolith.children.forEach((c) => { c.material.opacity = c.name === 'monolithEdges' ? monoVis * 0.9 : monoVis; });
  monolith.rotation.y = elapsed * 0.06;

  // glass cube: visible roughly 0.86 - 1
  const glassVis = smoothstep(0.85, 0.96, p);
  glassCube.material.opacity = glassVis;
  glassCube.rotation.y = elapsed * 0.15;
  glassCube.rotation.x = elapsed * 0.08;

  // lights drift for atmosphere
  pointWarm.intensity = lerp(6, 10, Math.sin(elapsed * 0.4) * 0.5 + 0.5);
  pointCool.position.z = -8 + Math.sin(elapsed * 0.15) * 2;
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  rawProgress = clamp(window.scrollY / maxScroll, 0, 1);
  smoothProgress += (rawProgress - smoothProgress) * (prefersReduced ? 1 : 0.085);

  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  if (!document.body.classList.contains('no-webgl')) {
    const camPos = cameraCurve.getPointAt(smoothProgress);
    const lookPos = lookCurve.getPointAt(smoothProgress);

    camera.position.copy(camPos);
    camera.position.x += mouse.x * 0.35;
    camera.position.y += -mouse.y * 0.25;
    camera.lookAt(lookPos);

    updateSceneForProgress(smoothProgress, dt, elapsed);

    const posAttr = particles.geometry.getAttribute('position');
    const vel = particles.geometry.userData.velocities;
    for (let i = 0; i < posAttr.count; i++) {
      const ix = i * 3;
      posAttr.array[ix] += vel[ix];
      posAttr.array[ix + 1] += vel[ix + 1];
      posAttr.array[ix + 2] += vel[ix + 2];
      if (posAttr.array[ix + 1] > 5) posAttr.array[ix + 1] = -5;
    }
    posAttr.needsUpdate = true;

    composer.render();
  }

  updateChapterFocus(smoothProgress);
  updateProgressUI(smoothProgress);
}

/* ============================================================
   DOM: focus-list active item + progress UI
   ============================================================ */
const focusSection = document.getElementById('focus');
const focusItems = Array.from(document.querySelectorAll('.focus-item'));

function updateChapterFocus() {
  if (!focusSection) return;
  const rect = focusSection.getBoundingClientRect();
  const range = rect.height - window.innerHeight;
  const local = clamp(-rect.top / Math.max(range, 1), 0, 1);
  const activeIdx = Math.min(focusItems.length - 1, Math.floor(local * focusItems.length));
  focusItems.forEach((item, i) => item.classList.toggle('active', i === activeIdx && rect.top < window.innerHeight && rect.bottom > 0));
}

const progressCurrentEl = document.getElementById('progressCurrent');
const progressFillEl = document.getElementById('progressFill');
function updateProgressUI(p) {
  const chapter = Math.min(5, Math.floor(p * 6));
  progressCurrentEl.textContent = String(chapter).padStart(2, '0');
  progressFillEl.style.width = (p * 100).toFixed(1) + '%';
}

/* ============================================================
   CHAPTER IN-VIEW (text reveal) via IntersectionObserver
   ============================================================ */
function initChapterObserver() {
  const chapters = document.querySelectorAll('.chapter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
      if (entry.isIntersecting) runCounters(entry.target);
    });
  }, { threshold: 0 });
  chapters.forEach((c) => io.observe(c));
}

/* ============================================================
   STAT COUNTERS
   ============================================================ */
const countedEls = new WeakSet();
function runCounters(scope) {
  const nums = scope.querySelectorAll('.stat-n[data-count]');
  nums.forEach((el) => {
    if (countedEls.has(el)) return;
    countedEls.add(el);
    const target = Number(el.dataset.count);
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ============================================================
   SCROLL CUE FADE (hero)
   ============================================================ */
function initScrollCue() {
  const cue = document.getElementById('scrollCue');
  window.addEventListener('scroll', () => {
    cue.classList.toggle('faded', window.scrollY > 60);
  }, { passive: true });
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (isMobile || matchMedia('(hover: none)').matches) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
  let tx = rx, ty = ry;
  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  document.querySelectorAll('[data-cursor-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
  function loop() {
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();
}

/* ============================================================
   MENU
   ============================================================ */
function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const overlay = document.getElementById('menuOverlay');
  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', () => {
    const open = overlay.classList.toggle('open');
    overlay.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
  });
  overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   AMBIENT SOUND — procedural, no external audio assets
   ============================================================ */
function initSound() {
  const btn = document.getElementById('soundToggle');
  let ctx, gain, on = false;
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 55 * 1.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gain);

    osc1.start(); osc2.start(); lfo.start();
  }
  btn.addEventListener('click', () => {
    if (!ctx) build();
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(on ? 0.05 : 0, now, 0.6);
    if (on && ctx.state === 'suspended') ctx.resume();
  });
}

/* ============================================================
   CONTACT FORM (front-end only)
   ============================================================ */
function initForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = 'Transmission received — we’ll be in touch.';
    form.reset();
    form.querySelectorAll('label').forEach((l) => {});
  });
}

/* ============================================================
   SMOOTH ANCHOR SCROLL FOR HEADER LOGO
   ============================================================ */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  computeSections();
  initChapterObserver();
  initScrollCue();
  initCursor();
  initMenu();
  initSound();
  initForm();
  initAnchors();

  if (!document.body.classList.contains('no-webgl')) {
    try {
      initScene();
      animate();
    } catch (err) {
      console.error('Nova Ventures: WebGL scene failed, falling back.', err);
      document.body.classList.add('no-webgl');
      requestAnimationFrame(function fallbackLoop() {
        updateChapterFocus();
        updateProgressUI(clamp(window.scrollY / maxScroll, 0, 1));
        requestAnimationFrame(fallbackLoop);
      });
    }
  } else {
    requestAnimationFrame(function fallbackLoop() {
      updateChapterFocus();
      updateProgressUI(clamp(window.scrollY / maxScroll, 0, 1));
      requestAnimationFrame(fallbackLoop);
    });
  }

  window.addEventListener('load', finishLoading);
  setTimeout(finishLoading, 2600);
}

boot();
