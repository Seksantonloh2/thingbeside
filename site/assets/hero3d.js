/* THINGBESIDE — 3D hero

   The retro computer from the hero video, rebuilt as a real-time 3D model (Three.js).
   The visitor drives it: moving the mouse moves the little mouse and the pointer on its screen,
   clicking builds the next project, dragging spins it, and typing presses its keys.
   Each build sends three layers (structure, design, launch) flying out of the screen and back.

   If WebGL or the library can't load, the hero falls back to the current looping video. */

const ASSETS = new URL('./', import.meta.url).href;

const PROJECTS = [
  { slug: 'fernmoorphysiotherapy', name: 'Fernmoor Physiotherapy', host: 'fernmoor-physiotherapy.vercel.app', url: 'https://fernmoor-physiotherapy.vercel.app/' },
  { slug: 'umbra', name: 'Umbra Architecture', host: 'umbra-architecture.vercel.app', url: 'https://umbra-architecture.vercel.app/' },
  { slug: 'voltsonelectrical', name: 'Voltson Electrical', host: 'voltson-electrical.vercel.app', url: 'https://voltson-electrical.vercel.app/' },
  { slug: 'saltmereweddings', name: 'Saltmere Weddings', host: 'saltmere-weddings.vercel.app', url: 'https://saltmere-weddings.vercel.app/' },
];

const BG = 0x111212;          // --dark
const ACCENT = 0xf90918;      // --accent
const BUILD = 4.6;            // seconds for one build
const LAND = [0.36, 0.62, 0.9]; // share of the build at which each layer snaps back into the screen
const STAGES = ['Structure', 'Design', 'Launch'];
const HOLD = 6.5;             // seconds a finished site stays up before the next build starts by itself

/* ---------- small maths helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const easeInCubic = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mkSpring = (x = 0) => ({ x, v: 0 });
function stepSpring(s, target, k, c, dt) {
  const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
  for (let i = 0; i < n; i++) { s.v += ((target - s.x) * k - s.v * c) * h; s.x += s.v * h; }
}

/* ---------- boot ---------- */
const hero = document.querySelector('.hero3d');
if (hero) init(hero);

async function init(hero) {
  const card = hero.querySelector('.hero__card');
  const canvas = hero.querySelector('.hero3d__canvas');

  const fallback = (why) => {
    console.warn('[hero3d] 3D is unavailable, showing the video instead.', why);
    hero.classList.add('no-3d');
    const v = hero.querySelector('.hero__video');
    if (v) { v.querySelectorAll('source').forEach((s) => { s.src = s.dataset.src; }); v.load(); const p = v.play(); p && p.catch(() => {}); }
    const imgs = [...hero.querySelectorAll('.pic--sync img')];
    let i = 0;
    if (imgs.length > 1) setInterval(() => { imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); }, 1800);
  };

  if (!card || !canvas || !window.WebGL2RenderingContext) return fallback('WebGL 2 is not supported');

  let T;
  try {
    const [THREE, a, b, c, d, e, f, g] = await Promise.all([
      import('three'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
      import('three/addons/objects/Reflector.js'),
    ]);
    T = { THREE, RoundedBoxGeometry: a.RoundedBoxGeometry, RoomEnvironment: b.RoomEnvironment, EffectComposer: c.EffectComposer,
      RenderPass: d.RenderPass, UnrealBloomPass: e.UnrealBloomPass, OutputPass: f.OutputPass, Reflector: g.Reflector };
  } catch (err) { return fallback(err); }

  try { build(T, hero, card, canvas); } catch (err) { fallback(err); }
}

/* ====================================================================== */
function build(T, hero, card, canvas) {
  const { THREE, RoundedBoxGeometry, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, Reflector } = T;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const params = new URLSearchParams(location.search);

  let W = Math.max(1, card.clientWidth), H = Math.max(1, card.clientHeight);

  /* Quality: full effects on desktops, a lighter scene on phones and weak machines. ?q=high or ?q=low forces one. */
  const wantHigh = params.get('q') ? params.get('q') === 'high' : (fine && W >= 900 && (navigator.hardwareConcurrency || 8) >= 4);
  const Q = { high: wantHigh, bloom: wantHigh, mirror: wantHigh, dpr: 1 };
  const pickDpr = () => {
    let d = Math.min(window.devicePixelRatio || 1, Q.high ? 2 : 1.75);
    const cap = Q.high ? 3.6e6 : 2.2e6;                       // never shade more pixels than this
    if (W * H * d * d > cap) d = Math.sqrt(cap / (W * H));
    return Math.max(0.75, d);
  };

  /* ---------- renderer, scene, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q.high, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  const bgColor = new THREE.Color(BG);
  scene.background = bgColor;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 90);
  const V = { az: 0.02, el: 0.2, dist: 11.6, shiftX: 0.2, shiftY: 0, target: new THREE.Vector3(-0.35, 1.6, 0.7) };

  /* ---------- materials ---------- */
  const std = (o) => new THREE.MeshStandardMaterial({ metalness: 0, envMapIntensity: 0.32, ...o });
  const M = {
    plastic: std({ color: 0xd9d1bf, roughness: 0.6 }),
    plasticDark: std({ color: 0xb8b09e, roughness: 0.68 }),
    key: std({ color: 0xffffff, roughness: 0.52 }),
    slot: std({ color: 0x141312, roughness: 0.85, envMapIntensity: 0.1 }),
    tube: std({ color: 0x050505, roughness: 0.18, envMapIntensity: 0.9 }),
    badge: std({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.6, roughness: 0.4 }),
    led: std({ color: 0x16a34a, emissive: 0x16a34a, emissiveIntensity: 0, roughness: 0.4 }),
    cable: std({ color: 0xcfc7b5, roughness: 0.7 }),
  };

  /* ---------- canvas helpers ---------- */
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const FONT = (weight, size) => `${weight} ${size}px Switzer, Inter, system-ui, sans-serif`;
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const canvasTex = (c, aniso = 4) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(aniso, renderer.capabilities.getMaxAnisotropy());
    return t;
  };
  function radialTex(inner, outer) {
    const c = mkCanvas(128, 128), g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, inner); grd.addColorStop(1, outer);
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return canvasTex(c, 1);
  }

  /* ---------- geometry helpers ---------- */
  function rrPath(path, x, y, w, h, r) {
    path.moveTo(x + r, y);
    path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
    return path;
  }
  function roundedPlane(w, h, r) {           // flat rounded rectangle with 0..1 UVs
    const g = new THREE.ShapeGeometry(rrPath(new THREE.Shape(), -w / 2, -h / 2, w, h, r), 8);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    return g;
  }
  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const rbox = (w, h, d, r, mat, x = 0, y = 0, z = 0, seg = 4) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat); m.position.set(x, y, z); return m; };

  /* ====================================================================
     The computer
     ==================================================================== */
  const BASE_YAW = -0.42;                     // the whole desk set is turned towards the headline
  const rig = new THREE.Group(); rig.rotation.y = BASE_YAW; scene.add(rig);
  const pcYaw = new THREE.Group(); rig.add(pcYaw);      // swivel (follows the pointer, spins when dragged)
  const pcTilt = new THREE.Group(); pcYaw.add(pcTilt);  // nod, hop, squash

  const PW = 2.5, PH = 3.1, BH = 0.2, BD = 2.3, FZ = 1.0;   // body size, base height, body depth, front of the body
  const FRONT = FZ + 0.26;                                   // front of the bezel
  const SCY = BH + PH / 2 + 0.48;                            // centre of the screen
  const SW = 1.68, SH = 1.26;                                // picture size (4:3)

  pcTilt.add(rbox(2.2, BH, 2.0, 0.06, M.plasticDark, 0, BH / 2, FZ - BD / 2, 3));
  pcTilt.add(rbox(PW, PH, BD, 0.14, M.plastic, 0, BH + PH / 2, FZ - BD / 2, 6));

  {  // front bezel: one piece with a real opening for the tube
    const shape = rrPath(new THREE.Shape(), -PW / 2, -PH / 2, PW, PH, 0.14);
    shape.holes.push(rrPath(new THREE.Path(), -0.92, 0.48 - 0.7, 1.84, 1.4, 0.08));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelOffset: -0.03, bevelSegments: 3, curveSegments: 14 });
    const bezel = new THREE.Mesh(g, M.plastic); bezel.position.set(0, BH + PH / 2, FZ + 0.03);
    pcTilt.add(bezel);
  }
  pcTilt.add(box(1.94, 1.5, 0.02, M.tube, 0, SCY, FZ + 0.035));   // dark glass behind the picture

  // the picture itself: a slightly bulged plane with a CRT shader
  const crtUniforms = { map: { value: null }, uTime: { value: 0 }, uPower: { value: 0 }, uFlash: { value: 0 }, uGain: { value: 1.6 }, uStatic: { value: reduce ? 0 : 1 } };
  const screenGeo = new THREE.PlaneGeometry(SW, SH, 24, 18);
  {
    const p = screenGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (SW / 2), y = p.getY(i) / (SH / 2); p.setZ(i, 0.045 * (1 - x * x) * (1 - y * y)); }
    screenGeo.computeVertexNormals();
  }
  const screenMat = new THREE.ShaderMaterial({
    uniforms: crtUniforms,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map;
      uniform float uTime; uniform float uPower; uniform float uFlash; uniform float uGain; uniform float uStatic;
      varying vec2 vUv;

      float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

      vec3 picture(vec2 uv) {
        // switching on: the picture opens from a bright dot, to a line, to the full frame
        float py = max(pow(uPower, 2.4), 0.006);
        float px = max(smoothstep(0.0, 0.5, uPower), 0.006);
        vec2 q = vec2((uv.x - 0.5) / px + 0.5, (uv.y - 0.5) / py + 0.5);
        if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec3(0.0);
        float ca = 0.0014;
        vec3 c = vec3(texture2D(map, q + vec2(ca, 0.0)).r, texture2D(map, q).g, texture2D(map, q - vec2(ca, 0.0)).b);
        float hot = (1.0 - uPower) * (1.0 - uPower);
        return c + hot * 2.2;
      }

      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        float r2 = dot(c, c);
        vec2 uv = c * (1.0 + 0.03 * r2) * 0.5 + 0.5;               // tube curvature
        float inside = 1.0 - smoothstep(-0.012, 0.004, rbox(uv - 0.5, vec2(0.5), 0.05));
        vec3 col = vec3(0.0);
        if (uPower > 0.001) {
          col = picture(uv);
          col *= 0.9 + 0.1 * sin(uv.y * 480.0 * 3.14159265);        // scanlines
          col *= 0.955 + 0.045 * smoothstep(0.0, 0.25, fract(uv.y - uTime * 0.11) ) * uStatic + 0.045 * (1.0 - uStatic);
          col *= 1.0 + 0.012 * sin(uTime * 97.0) * uStatic;         // flicker
          col *= 1.0 - 0.15 * r2;                                   // darker corners
          col += uFlash * vec3(1.0, 0.94, 0.9);
        }
        col *= inside;
        col += smoothstep(0.4, 1.15, vUv.y * 0.9 + vUv.x * 0.45) * 0.03 * inside;   // a little sheen on the glass
        gl_FragColor = vec4(col * uGain, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat); screen.position.set(0, SCY, FZ + 0.055);
  pcTilt.add(screen);

  // chin details: disk slot, red badge, wordmark, power light
  pcTilt.add(box(0.9, 0.1, 0.012, M.plasticDark, 0.45, 1.0, FRONT + 0.001));
  pcTilt.add(box(0.74, 0.034, 0.02, M.slot, 0.45, 1.0, FRONT + 0.004));
  pcTilt.add(rbox(0.12, 0.12, 0.02, 0.018, M.badge, -0.96, 0.84, FRONT + 0.004, 2));
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), M.led); led.position.set(1.02, 0.62, FRONT + 0.004); pcTilt.add(led);
  const wordCanvas = mkCanvas(512, 64);
  const wordTex = canvasTex(wordCanvas);
  function drawWordmark() {
    const g = wordCanvas.getContext('2d');
    g.clearRect(0, 0, 512, 64);
    g.fillStyle = 'rgba(60, 56, 48, .82)'; g.font = FONT(600, 42); g.textBaseline = 'middle';
    try { g.letterSpacing = '-1.4px'; } catch (e) { /* older browsers */ }
    g.fillText('THINGBESIDE', 4, 34);
    wordTex.needsUpdate = true;
  }
  drawWordmark();
  const word = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.0825), new THREE.MeshBasicMaterial({ map: wordTex, transparent: true, depthWrite: false }));
  word.position.set(-0.52, 0.84, FRONT + 0.006); pcTilt.add(word);

  {  // side vents, a carry handle recess and a port panel on the back (seen when it spins)
    const vents = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.03, 0.9), M.slot, 14);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 14; i++) { m4.makeTranslation((i < 7 ? -1 : 1) * (PW / 2 + 0.001), BH + PH - 0.36 - (i % 7) * 0.078, FZ - BD / 2 - 0.15); vents.setMatrixAt(i, m4); }
    pcTilt.add(vents);
    pcTilt.add(box(1.0, 0.012, 0.3, M.slot, 0, BH + PH + 0.001, FZ - BD + 0.55));
    pcTilt.add(box(1.5, 0.46, 0.012, M.plasticDark, 0, 0.92, FZ - BD - 0.001));
    for (let i = 0; i < 4; i++) pcTilt.add(box(0.2, 0.12, 0.012, M.slot, -0.54 + i * 0.36, 0.92, FZ - BD - 0.006));
  }

  const hitProxy = box(PW + 0.1, PH + BH, BD + 0.4, new THREE.MeshBasicMaterial({ visible: false }), 0, (PH + BH) / 2, FZ - BD / 2 + 0.1);
  hitProxy.userData.kind = 'pc'; pcTilt.add(hitProxy);

  const screenLight = new THREE.PointLight(0xdfe8ff, 0, 8, 2); screenLight.position.set(0, SCY - 0.1, FRONT + 0.85); pcTilt.add(screenLight);

  // light the screen throws on the desk, and soft shadows where things touch it
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.2), new THREE.MeshBasicMaterial({ map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.008, FRONT + 1.2); pcYaw.add(pool);
  const shadowTex = radialTex('rgba(0,0,0,1)', 'rgba(0,0,0,0)');
  const shadow = (w, d, x, z, o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: o })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.005, z); m.renderOrder = 1; return m; };
  const pcShadow = shadow(4.4, 4.4, 0, FZ - BD / 2, 0.9); rig.add(pcShadow);

  /* ====================================================================
     Keyboard: one instanced mesh, every key can be pressed
     ==================================================================== */
  const KU = 0.2;   // key pitch
  const letters = (s) => [...s].map((ch) => [ch, 1]);
  const ROWS = [
    [...letters('`1234567890-='), ['Backspace', 1.8, 'mod']],
    [['Tab', 1.4, 'mod'], ...letters('qwertyuiop[]'), ['\\', 1.4]],
    [['CapsLock', 1.7, 'mod'], ...letters("asdfghjkl;'"), ['Enter', 2.1, 'accent']],
    [['ShiftLeft', 2.2, 'mod'], ...letters('zxcvbnm,./'), ['ShiftRight', 2.6, 'mod']],
    [['ControlLeft', 1.3, 'mod'], ['AltLeft', 1.3, 'mod'], ['MetaLeft', 1.5, 'mod'], [' ', 6.6], ['MetaRight', 1.5, 'mod'], ['AltRight', 1.3, 'mod'], ['ControlRight', 1.3, 'mod']],
  ];
  const SHIFTED = { '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' };
  const kb = new THREE.Group(); kb.position.set(-0.18, 0.13, 2.32); kb.rotation.set(0.085, 0.05, 0); rig.add(kb);
  kb.add(rbox(3.16, 0.16, 1.18, 0.05, M.plasticDark, 0, 0, 0, 3));
  const keyDefs = [], KEYMAP = {};
  ROWS.forEach((row, r) => {
    let x = -1.48;
    row.forEach(([label, u, kind]) => {
      const w = u * KU;
      KEYMAP[label] = keyDefs.length;
      keyDefs.push({ label, kind, x: x + w / 2, z: -0.4 + r * KU, sx: (w - 0.032) / 0.168 });
      x += w;
    });
  });
  const KEY_Y = 0.137;
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(0.168, 0.09, 0.168, 2, 0.024), M.key, keyDefs.length);
  const keyPress = new Float32Array(keyDefs.length), activeKeys = new Set();
  const letterKeys = keyDefs.map((d, i) => (d.label.length === 1 && d.label !== ' ' ? i : -1)).filter((i) => i >= 0);
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _col = new THREE.Color();
  const setKey = (i) => { const d = keyDefs[i]; _m.compose(_p.set(d.x, KEY_Y - 0.042 * keyPress[i], d.z), _q, _s.set(d.sx, 1, 1)); keys.setMatrixAt(i, _m); };
  keyDefs.forEach((d, i) => { setKey(i); keys.setColorAt(i, _col.set(d.kind === 'accent' ? ACCENT : d.kind === 'mod' ? 0xb7b0a0 : 0xe9e3d6)); });
  keys.instanceColor.needsUpdate = true; kb.add(keys);
  rig.add(shadow(4.3, 2.2, -0.18, 2.34, 0.75));

  const keyQueue = [];   // delayed presses, used for the ripple
  function pressKey(i, strength = 1) { if (i == null || i < 0) return; keyPress[i] = Math.max(keyPress[i], strength); activeKeys.add(i); }
  function rippleKeys(time, fromLeft = true) {
    keyDefs.forEach((d, i) => keyQueue.push({ at: time + ((fromLeft ? d.x + 1.5 : 1.5 - d.x) / 3) * 0.32 + (d.z + 0.4) * 0.05, i }));
  }

  /* ====================================================================
     Mouse and cables
     ==================================================================== */
  const mouseG = new THREE.Group(); mouseG.position.set(1.98, 0, 2.42); mouseG.rotation.y = -0.1; rig.add(mouseG);
  const mouseBody = rbox(0.4, 0.15, 0.6, 0.06, M.plastic, 0, 0.085, 0, 4); mouseG.add(mouseBody);
  const mouseBtn = rbox(0.33, 0.03, 0.2, 0.012, M.key, 0, 0.158, -0.17, 2); mouseBtn.material = std({ color: 0xe9e3d6, roughness: 0.52 }); mouseG.add(mouseBtn);
  const mouseShadow = shadow(1.0, 1.2, 1.98, 2.42, 0.7); rig.add(mouseShadow);
  const MOUSE_HOME = mouseG.position.clone();

  function cable(points, turns, radius, tube, from = 0.14, to = 0.86) {
    const centre = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const N = 720, pts = [], up = new THREE.Vector3(0, 1, 0), tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = centre.getPointAt(t); centre.getTangentAt(t, tan);
      nrm.crossVectors(up, tan).normalize(); bin.crossVectors(tan, nrm).normalize();
      const env = turns ? smooth(from - 0.07, from, t) * (1 - smooth(to, to + 0.07, t)) : 0;   // coil only in the middle
      const a = t * turns * Math.PI * 2;
      p.addScaledVector(nrm, Math.cos(a) * radius * env).addScaledVector(bin, Math.sin(a) * radius * env);
      p.y += radius * env;
      pts.push(p);
    }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns ? N : 80, tube, 5, false), M.cable);
  }
  rig.add(cable([[-1.72, 0.1, 2.2], [-2.3, 0.05, 1.95], [-2.42, 0.05, 1.2], [-1.95, 0.06, 0.55], [-1.24, 0.32, 0.42]], 24, 0.05, 0.014));
  const mouseCable = cable([[1.98, 0.09, 2.12], [1.95, 0.03, 1.7], [1.7, 0.03, 1.3], [1.24, 0.3, 0.9]], 0, 0, 0.012);
  rig.add(mouseCable);

  /* ====================================================================
     Floor: a dark polished desk. On desktops it reflects the scene (rendered small, so it reads as a soft reflection).
     ==================================================================== */
  let floor = null;
  if (Q.mirror) {
    const res = 512;
    floor = new Reflector(new THREE.PlaneGeometry(70, 70), {
      textureWidth: res, textureHeight: Math.round(res * 0.6), clipBias: 0.002, multisample: 0,
      shader: {
        name: 'TBDesk',
        uniforms: {
          color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
          uBase: { value: bgColor.clone() }, uStrength: { value: 0.34 }, uCentre: { value: new THREE.Vector2(-0.4, 0.9) }, uTexel: { value: new THREE.Vector2(1 / res, 1 / (res * 0.6)) },
        },
        vertexShader: /* glsl */`
          uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
          void main() { vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          uniform sampler2D tDiffuse; uniform vec3 uBase; uniform float uStrength; uniform vec2 uCentre; uniform vec2 uTexel;
          varying vec4 vUv; varying vec3 vWorld;
          void main() {
            vec2 uv = vUv.xy / vUv.w;
            float d = length(vWorld.xz - uCentre);
            float spread = 1.0 + d * 0.12;                         // blurrier further from the objects
            vec3 r = vec3(0.0);
            for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) r += texture2D(tDiffuse, uv + vec2(float(i), float(j)) * uTexel * spread).rgb;
            r = max(r / 9.0 - uBase, 0.0);                         // only what is brighter than the room
            float fade = 1.0 - smoothstep(1.5, 7.5, d);
            gl_FragColor = vec4(uBase + r * uStrength * fade, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      },
    });
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
  }

  /* ====================================================================
     Back wall: a slow, curved wall of real project screens
     ==================================================================== */
  const wallG = new THREE.Group(); scene.add(wallG);
  const WALL = { r: 9.6, y: 2.75, step: THREE.MathUtils.degToRad(30), n: 6 };
  const cardGeo = roundedPlane(3.7, 2.31, 0.12);
  const cards = [];
  for (let i = 0; i < WALL.n; i++) {
    const m = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, fog: false }));
    m.userData = { kind: 'card', project: i % PROJECTS.length, bright: 0, slot: i };
    wallG.add(m); cards.push(m);
  }

  /* ====================================================================
     Layers that fly out of the screen during a build
     ==================================================================== */
  const layersG = new THREE.Group(); layersG.position.set(0, SCY, FRONT + 0.03); pcTilt.add(layersG);
  const LW = 512, LH = 384;
  const layerCanvas = [mkCanvas(LW, LH), mkCanvas(LW, LH), mkCanvas(LW, LH)];
  const layerTex = layerCanvas.map((c) => canvasTex(c));
  const layers = layerTex.map((t, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: i === 1 ? THREE.NormalBlending : THREE.AdditiveBlending }));
    m.visible = false; m.renderOrder = 5 + i; layersG.add(m); return m;
  });
  const LAYER_Z = [0.75, 1.45, 2.15], LAYER_Y = [0.04, 0.13, 0.22], LAYER_S = [1.1, 1.2, 1.3];

  /* ====================================================================
     Dust in the light, and the burst when a site goes live
     ==================================================================== */
  const PN = Q.high ? 380 : 140;
  const dustGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(PN * 3), seed = new Float32Array(PN);
    for (let i = 0; i < PN; i++) { pos[i * 3] = (Math.random() - 0.5) * 20 - 0.5; pos[i * 3 + 1] = Math.random() * 6.4; pos[i * 3 + 2] = (Math.random() - 0.5) * 13; seed[i] = Math.random(); }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  }
  const dustU = { uTime: { value: 0 }, uSize: { value: 5 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color(0xffe9d6) } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime; uniform float uSize; varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.04 + aSeed * 0.07), 6.4) + 0.1;
        p.x += sin(uTime * 0.21 + aSeed * 40.0) * 0.35;
        p.z += cos(uTime * 0.17 + aSeed * 31.0) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.5 + aSeed) * (10.0 / -mv.z);
        vA = (0.3 + 0.7 * abs(sin(uTime * (0.5 + aSeed) + aSeed * 60.0))) * smoothstep(0.1, 1.2, p.y) * (1.0 - smoothstep(5.2, 6.5, p.y));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uAlpha; varying float vA;
      void main() {
        float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(uColor, a * vA * uAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  dust.frustumCulled = false; scene.add(dust);

  const BN = 64;
  const burstPos = new Float32Array(BN * 3), burstLife = new Float32Array(BN), burstVel = new Float32Array(BN * 3);
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3)); burstGeo.setAttribute('aLife', new THREE.BufferAttribute(burstLife, 1));
  const burstU = { uSize: { value: 9 } };
  const burst = new THREE.Points(burstGeo, new THREE.ShaderMaterial({
    uniforms: burstU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aLife; uniform float uSize; varying float vL;
      void main() { vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (0.35 + aLife) * (10.0 / -mv.z); }`,
    fragmentShader: /* glsl */`
      varying float vL;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        vec3 col = mix(vec3(0.976, 0.035, 0.094), vec3(1.0, 0.9, 0.85), vL * vL);
        gl_FragColor = vec4(col * 1.6, a * vL);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  burst.frustumCulled = false; burst.visible = false; scene.add(burst);
  let burstOn = false;
  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
  function fireBurst() {
    if (reduce) return;
    layersG.getWorldPosition(_v); layersG.getWorldDirection(_v2);       // out of the screen
    for (let i = 0; i < BN; i++) {
      burstPos[i * 3] = _v.x + (Math.random() - 0.5) * 1.2; burstPos[i * 3 + 1] = _v.y + (Math.random() - 0.5) * 0.9; burstPos[i * 3 + 2] = _v.z + (Math.random() - 0.5) * 0.3;
      const sp = 1.2 + Math.random() * 3.2;
      burstVel[i * 3] = _v2.x * sp + (Math.random() - 0.5) * 2.6; burstVel[i * 3 + 1] = 0.6 + Math.random() * 2.6; burstVel[i * 3 + 2] = _v2.z * sp + (Math.random() - 0.5) * 2.6;
      burstLife[i] = 0.6 + Math.random() * 0.4;
    }
    burstOn = true; burst.visible = true;
  }

  /* ====================================================================
     Lights
     ==================================================================== */
  const keyLight = new THREE.DirectionalLight(0xfff0dd, 0); keyLight.position.set(-5, 8, 7); scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xa9b9ff, 0); fillLight.position.set(7, 3, 6); scene.add(fillLight);
  const rim = new THREE.SpotLight(ACCENT, 0, 0, 0.6, 0.75, 2); rim.position.set(6.5, 6.2, -6); rim.target.position.set(0, 1.6, 0); scene.add(rim, rim.target);
  const rim2 = new THREE.SpotLight(0xffffff, 0, 0, 0.6, 0.8, 2); rim2.position.set(-7.5, 5, -5); rim2.target.position.set(0, 1.6, 0); scene.add(rim2, rim2.target);
  const cursorLight = new THREE.PointLight(0xff5a4a, 0, 10, 2); cursorLight.position.set(0, 2, 4); scene.add(cursorLight);
  const LIGHT = { key: 1.7, fill: 0.3, rim: 620, rim2: 150, cursor: 9, screen: 9 };

  /* ====================================================================
     The picture on the screen (a 2D canvas drawn every frame)
     ==================================================================== */
  const CW = 640, CH = 480, BAR = 44, VH = CH - BAR;
  const crtCanvas = mkCanvas(CW, CH), g = crtCanvas.getContext('2d');
  const crtTex = canvasTex(crtCanvas, 8); crtUniforms.map.value = crtTex;
  const scratch = mkCanvas(64, 48), sg = scratch.getContext('2d');

  // the wireframe of a typical page, in 0..1 units of the viewport
  const WIRE = [
    { k: 'box', r: [0.04, 0.05, 0.11, 0.045] },
    { k: 'bar', r: [0.62, 0.06, 0.07, 0.024] }, { k: 'bar', r: [0.71, 0.06, 0.07, 0.024] }, { k: 'bar', r: [0.8, 0.06, 0.06, 0.024] },
    { k: 'pill', r: [0.885, 0.04, 0.085, 0.062] },
    { k: 'h', r: [0.04, 0.19, 0.5, 0.08] }, { k: 'h', r: [0.04, 0.292, 0.38, 0.08] },
    { k: 'p', r: [0.04, 0.41, 0.42, 0.024] }, { k: 'p', r: [0.04, 0.452, 0.45, 0.024] }, { k: 'p', r: [0.04, 0.494, 0.33, 0.024] },
    { k: 'cta', r: [0.04, 0.56, 0.19, 0.085] }, { k: 'ghost', r: [0.245, 0.56, 0.17, 0.085] },
    { k: 'img', r: [0.6, 0.17, 0.36, 0.47] },
    { k: 'card', r: [0.04, 0.735, 0.29, 0.21] }, { k: 'card', r: [0.355, 0.735, 0.29, 0.21] }, { k: 'card', r: [0.67, 0.735, 0.29, 0.21] },
  ];
  const FILL = { box: '#f4f4f2', bar: '#8d8e8a', pill: '#f4f4f2', h: '#f4f4f2', p: '#6c6d6a', cta: '#f90918', ghost: '#2a2b2b', card: '#2a2b2b' };

  function drawWire(c, x0, y0, w, h, reveal, fill, img, lw) {
    const n = WIRE.length;
    WIRE.forEach((e, i) => {
      const k = clamp01(reveal * (n + 3) - i);
      if (k <= 0) return;
      const x = x0 + e.r[0] * w, y = y0 + e.r[1] * h, ww = e.r[2] * w, hh = e.r[3] * h;
      const rad = e.k === 'pill' || e.k === 'cta' || e.k === 'ghost' ? hh / 2 : e.k === 'img' || e.k === 'card' ? w * 0.014 : hh * 0.22;
      const f = clamp01(fill * (n + 5) - i);
      if (f > 0) {
        c.save(); rr(c, x, y, ww, hh, rad); c.clip();
        if (e.k === 'img') {
          c.fillStyle = '#2a2b2b'; c.fillRect(x, y, ww, hh);
          if (img) {   // the photo "loads": blocky at first, then sharper
            const steps = Math.round(lerp(6, 44, f * f));
            sg.imageSmoothingEnabled = true; sg.clearRect(0, 0, 64, 48); sg.drawImage(img, img.width * 0.5, img.height * 0.12, img.width * 0.46, img.height * 0.62, 0, 0, steps, Math.round(steps * 0.75));
            c.imageSmoothingEnabled = false; c.globalAlpha = f; c.drawImage(scratch, 0, 0, steps, Math.round(steps * 0.75), x, y, ww, hh); c.globalAlpha = 1; c.imageSmoothingEnabled = true;
          }
        } else { c.fillStyle = FILL[e.k]; c.fillRect(x, y, ww * easeOutCubic(f), hh); }
        c.restore();
      }
      const per = 2 * (ww + hh);
      c.setLineDash([per * k, per]); c.lineWidth = lw; c.strokeStyle = k < 1 ? '#f90918' : 'rgba(244,244,242,.82)';
      rr(c, x, y, ww, hh, rad); c.stroke();
      if (e.k === 'img' && k >= 1 && f <= 0) { c.setLineDash([]); c.globalAlpha = 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + ww, y + hh); c.moveTo(x + ww, y); c.lineTo(x, y + hh); c.stroke(); c.globalAlpha = 1; }
    });
    c.setLineDash([]);
  }

  function drawShot(c, P, x, y, w, h, t) {      // a finished page, gently drifting as if someone is looking around it
    if (!P.img) { c.fillStyle = '#16181a'; c.fillRect(x, y, w, h); drawWire(c, x, y, w, h, 1, 1, null, 1.4); return; }
    const zoom = 1.02 + 0.035 * (0.5 - 0.5 * Math.cos(t * 0.5));
    const s = Math.max(w / P.img.width, h / P.img.height) * zoom, dw = P.img.width * s, dh = P.img.height * s;
    const pan = 0.5 + 0.42 * Math.sin(t * 0.21 - 1.2);
    c.drawImage(P.img, x + (w - dw) * pan, y, dw, dh);
  }

  function arrow(c, x, y, s) {                    // the classic pointer
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 17); c.lineTo(4.4, 13.2); c.lineTo(7.6, 20.4); c.lineTo(10.4, 19.2); c.lineTo(7.3, 12.2); c.lineTo(12.6, 12.2); c.closePath();
    c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = '#0b0c0c'; c.stroke(); c.fillStyle = '#fff'; c.fill();
    c.restore();
  }

  const S = {                                     // what the computer is doing
    mode: 'off', project: 0, next: 0, t: 0, liveT: 0, bootT: 0, landed: [false, false, false], builds: 0,
    px: CW * 0.62, py: CH * 0.55, click: -9, clickX: 0, clickY: 0, typed: '', typedAt: -99,
  };

  function drawCRT(time) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]);
    g.fillStyle = '#0a0b0b'; g.fillRect(0, 0, CW, CH);
    if (S.mode === 'off') return;

    if (S.mode === 'boot') {                      // start-up screen
      const k = clamp01(S.bootT / 1.25);
      g.fillStyle = '#f90918'; rr(g, CW / 2 - 150, CH / 2 - 46, 44, 44, 9); g.fill();
      g.fillStyle = '#f4f4f2'; g.font = FONT(600, 40); g.textBaseline = 'middle'; g.textAlign = 'left';
      try { g.letterSpacing = '-1.5px'; } catch (e) { /* ignore */ }
      g.fillText('THINGBESIDE', CW / 2 - 92, CH / 2 - 22);
      try { g.letterSpacing = '0px'; } catch (e) { /* ignore */ }
      g.fillStyle = '#2a2b2b'; rr(g, CW / 2 - 150, CH / 2 + 34, 300, 6, 3); g.fill();
      g.fillStyle = '#f4f4f2'; rr(g, CW / 2 - 150, CH / 2 + 34, 300 * easeInOut(k), 6, 3); g.fill();
      g.fillStyle = '#8d8e8a'; g.font = FONT(500, 17); g.fillText('Starting up', CW / 2 - 150, CH / 2 + 66);
      return;
    }

    const cur = PROJECTS[S.project], nxt = PROJECTS[S.next], building = S.mode === 'building';
    const b = building ? S.t / BUILD : 1;

    // ---- the page inside the little browser
    g.save(); g.beginPath(); g.rect(0, BAR, CW, VH); g.clip();
    if (!building) drawShot(g, cur, 0, BAR, CW, VH, S.liveT);
    else {
      const a = clamp01(b / LAND[0]), f = clamp01((b - LAND[0]) / (LAND[1] - LAND[0])), w = clamp01((b - LAND[1]) / (LAND[2] - LAND[1]));
      g.fillStyle = '#0d1012'; g.fillRect(0, BAR, CW, VH);
      g.strokeStyle = 'rgba(244,244,242,.055)'; g.lineWidth = 1; g.beginPath();
      for (let x = 0; x <= CW; x += 32) { g.moveTo(x + 0.5, BAR); g.lineTo(x + 0.5, CH); }
      for (let y = BAR; y <= CH; y += 32) { g.moveTo(0, y + 0.5); g.lineTo(CW, y + 0.5); }
      g.stroke();
      drawWire(g, 0, BAR, CW, VH - 34, a, f, nxt.img, 1.7);
      if (w > 0) {                                // the finished design wipes down over the wireframe
        const hh = VH * easeInOut(w);
        g.save(); g.beginPath(); g.rect(0, BAR, CW, hh); g.clip(); drawShot(g, nxt, 0, BAR, CW, VH, 0); g.restore();
        if (w < 1) { g.fillStyle = '#fff'; g.fillRect(0, BAR + hh - 2, CW, 3); g.fillStyle = 'rgba(249,9,24,.5)'; g.fillRect(0, BAR + hh + 1, CW, 5); }
      }
      // stage strip
      const stage = b < LAND[0] ? 0 : b < LAND[1] ? 1 : 2;
      g.fillStyle = 'rgba(10,11,11,.9)'; g.fillRect(0, CH - 34, CW, 34);
      g.font = FONT(600, 14); g.textBaseline = 'middle'; g.textAlign = 'left';
      STAGES.forEach((name, i) => {
        g.fillStyle = i === stage ? '#f90918' : i < stage ? '#f4f4f2' : '#6c6d6a';
        g.fillText(`0${i + 1}  ${name.toUpperCase()}`, 18 + i * 150, CH - 16);
      });
      g.fillStyle = '#f4f4f2'; g.textAlign = 'right'; g.fillText(`${Math.round(b * 100)}%`, CW - 18, CH - 16); g.textAlign = 'left';
      g.fillStyle = '#f90918'; g.fillRect(0, CH - 3, CW * b, 3);
    }
    g.restore();

    // ---- browser bar
    g.fillStyle = '#161717'; g.fillRect(0, 0, CW, BAR);
    ['#f90918', '#4a4b49', '#4a4b49'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(22 + i * 18, BAR / 2, 5.5, 0, 7); g.fill(); });
    g.fillStyle = '#242525'; rr(g, 84, 9, CW - 84 - 124, 26, 13); g.fill();
    const host = building ? nxt.host.slice(0, Math.ceil(nxt.host.length * clamp01(b / 0.3))) : cur.host;
    g.font = FONT(500, 15); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#c9c9c5';
    g.fillText(host + (building && b < 0.3 && Math.floor(time * 6) % 2 ? '|' : ''), 100, BAR / 2 + 1);
    const live = !building;
    g.fillStyle = live ? '#16a34a' : (Math.floor(time * 3) % 2 ? '#f90918' : '#5c0d12');
    g.beginPath(); g.arc(CW - 104, BAR / 2, 5, 0, 7); g.fill();
    g.fillStyle = '#f4f4f2'; g.font = FONT(600, 13); g.fillText(live ? 'LIVE' : 'BUILDING', CW - 92, BAR / 2 + 1);

    // ---- what the visitor typed
    const sinceType = time - S.typedAt;
    if (S.typed && sinceType < 4) {
      const txt = '> ' + S.typed + (Math.floor(time * 3) % 2 ? '_' : ' ');
      g.font = FONT(500, 18); const tw = Math.min(CW - 60, g.measureText(txt).width + 28);
      g.globalAlpha = clamp01((4 - sinceType) * 2);
      g.fillStyle = 'rgba(10,11,11,.92)'; rr(g, 16, CH - 34 - 46, tw, 36, 10); g.fill();
      g.strokeStyle = 'rgba(244,244,242,.25)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#f4f4f2'; g.fillText(txt, 30, CH - 34 - 27);
      g.globalAlpha = 1;
    }

    // ---- pointer (mirrors the visitor's mouse) and its click ring
    const sinceClick = time - S.click;
    if (sinceClick < 0.5) { g.strokeStyle = `rgba(249,9,24,${1 - sinceClick * 2})`; g.lineWidth = 3; g.beginPath(); g.arc(S.clickX, S.clickY, 6 + sinceClick * 60, 0, 7); g.stroke(); }
    arrow(g, S.px, S.py, 1.35);
  }

  // textures for the three flying layers
  function tag(c, x, y, text) {
    c.font = FONT(600, 17); c.textBaseline = 'middle'; c.textAlign = 'left';
    const tw = c.measureText(text).width;
    c.fillStyle = '#f90918'; rr(c, x, y, tw + 26, 30, 15); c.fill();
    c.fillStyle = '#fff'; c.fillText(text, x + 13, y + 16);
  }
  function frameLayer(c) {
    c.clearRect(0, 0, LW, LH);
    rr(c, 3, 3, LW - 6, LH - 6, 20); c.fillStyle = 'rgba(244,244,242,.045)'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(244,244,242,.8)'; c.stroke();
  }
  function drawLayers(project) {
    let c = layerCanvas[0].getContext('2d');
    frameLayer(c); drawWire(c, 14, 44, LW - 28, LH - 58, 1, 0, null, 2.4); tag(c, 16, 14, '01  STRUCTURE'); layerTex[0].needsUpdate = true;

    c = layerCanvas[1].getContext('2d');
    c.clearRect(0, 0, LW, LH);
    c.save(); rr(c, 3, 3, LW - 6, LH - 6, 20); c.clip();
    const P = PROJECTS[project];
    if (P.img) { const s = Math.max(LW / P.img.width, LH / P.img.height), dw = P.img.width * s; c.drawImage(P.img, (LW - dw) * 0.3, 0, dw, P.img.height * s); }
    else { c.fillStyle = '#1c1d1d'; c.fillRect(0, 0, LW, LH); }
    c.restore();
    rr(c, 3, 3, LW - 6, LH - 6, 20); c.lineWidth = 2.5; c.strokeStyle = 'rgba(244,244,242,.9)'; c.stroke();
    tag(c, 16, 14, '02  DESIGN'); layerTex[1].needsUpdate = true;

    c = layerCanvas[2].getContext('2d');
    frameLayer(c);
    c.fillStyle = '#f90918'; rr(c, 150, 150, 212, 76, 38); c.fill();
    c.fillStyle = '#fff'; c.font = FONT(600, 30); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Go live', 256, 190);
    c.fillStyle = '#16a34a'; c.beginPath(); c.arc(203, 268, 8, 0, 7); c.fill();
    c.fillStyle = '#f4f4f2'; c.font = FONT(600, 22); c.textAlign = 'left'; c.fillText('LIVE', 220, 270);
    c.textAlign = 'left'; arrow(c, 330, 204, 2.2);
    tag(c, 16, 14, '03  LAUNCH'); layerTex[2].needsUpdate = true;
  }
  drawLayers(0);

  /* ---------- load the real project screenshots ---------- */
  const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
  PROJECTS.forEach((P, i) => {
    loadImage(`${ASSETS}work-${P.slug}.jpg`).then((img) => {
      P.img = img;
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const ia = img.width / img.height, ca = 4.3 / 2.69;                 // crop the screenshot to the card's shape
      if (ia > ca) { t.repeat.set(ca / ia, 1); t.offset.set((1 - ca / ia) * 0.25, 0); } else { t.repeat.set(1, ia / ca); t.offset.set(0, 1 - ia / ca); }
      t.needsUpdate = true; P.tex = t;
      cards.forEach((m) => { if (m.userData.project === i) { m.material.map = t; m.material.color.setScalar(0.0001); m.material.needsUpdate = true; } });
      if (i === S.next || i === S.project) drawLayers(S.mode === 'building' ? S.next : S.project);
      dirty = true;
    }).catch(() => { /* the wireframe stands in for a missing screenshot */ });
  });
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('600 20px Switzer'), document.fonts.load('500 20px Switzer')]).then(() => { drawWordmark(); drawLayers(S.mode === 'building' ? S.next : S.project); dirty = true; }).catch(() => {});
  }

  /* ====================================================================
     Page elements that follow the scene
     ==================================================================== */
  const $status = hero.querySelector('.hero3d__status'), $stage = hero.querySelector('.hero3d__stage'), $name = hero.querySelector('.hero3d__name');
  const $tip = hero.querySelector('.hero3d__tip'), $content = hero.querySelector('.hero__content');
  const pics = [...hero.querySelectorAll('.pic--sync img')];
  let hudKey = '';
  function hud(stage, project, live) {
    const key = stage + project + live;
    if (key === hudKey) return;
    hudKey = key;
    if ($stage) $stage.textContent = stage;
    if ($name) $name.textContent = PROJECTS[project].name;
    if ($status) { $status.href = PROJECTS[project].url; $status.classList.toggle('is-live', live); }
  }
  const showPic = (i) => pics.forEach((im, j) => im.classList.toggle('is-on', j === i));

  /* ====================================================================
     State: boot, build, live
     ==================================================================== */
  const sq = mkSpring(0);            // squash and stretch
  const nod = mkSpring(0);           // pitch
  const yaw = mkSpring(0);           // swivel towards the pointer
  const spin = mkSpring(0);          // extra turns from dragging
  let hopY = 0, hopV = 0, flash = 0, rimPulse = 0, screenPulse = 0, ghost = 0, time = 0, introT = 0, dirty = true;

  function hop(power = 1) { if (reduce) return; if (hopY <= 0.001) { hopV = 3.6 * power; sq.v += 2.2 * power; } }

  function startBuild(i, byUser) {
    if (S.mode !== 'live' && !(S.mode === 'boot' && S.bootT >= 1.3)) return false;
    S.mode = 'building'; S.next = i; S.t = 0; S.landed = [false, false, false];
    drawLayers(i);
    if (byUser) { nod.v -= 0.5; }
    if (reduce) { S.t = BUILD; }
    return true;
  }
  function land(i) {                 // a layer has just snapped back into the screen
    flash = 1; screenPulse = 1; nod.v += 0.9; sq.v -= 0.9;
    rippleKeys(time, i % 2 === 0);
    if (i === 2) { rimPulse = 1; fireBurst(); hop(1); showPic(S.next); }
  }
  function finishBuild() {
    S.project = S.next; S.mode = 'live'; S.liveT = 0; S.builds++;
    hero.classList.add('is-on');
  }

  /* ====================================================================
     Pointer, drag, click, typing
     ==================================================================== */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, cx: W * 0.7, cy: H * 0.5, inside: false, overUI: false, down: false, moved: 0, sx: 0, sy: 0, last: 0, lastX: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -3.4), aim = new THREE.Vector3(0, 2, 3.4);
  const pickables = [hitProxy, ...cards];
  let hover = null, dragging = false, needPick = false, mouseClick = 0, userAt = -99;

  const setPtr = (e) => {
    const r = card.getBoundingClientRect();
    ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
    ptr.tx = clamp((ptr.cx / r.width) * 2 - 1, -1, 1); ptr.ty = clamp((ptr.cy / r.height) * 2 - 1, -1, 1);
    ptr.inside = true; needPick = true; userAt = time;
  };
  card.addEventListener('pointermove', (e) => {
    setPtr(e);
    ptr.overUI = !!(e.target.closest && e.target.closest('a, button'));
    if (ptr.down && !dragging && ptr.kind === 'pc' && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { dragging = true; hero.classList.add('is-grabbing'); }
    if (dragging) { const dx = e.clientX - ptr.lastX; spin.x += dx * 0.011; spin.v = (dx * 0.011) / Math.max(0.008, (e.timeStamp - ptr.last) / 1000); }
    ptr.lastX = e.clientX; ptr.last = e.timeStamp;
  }, { passive: true });
  card.addEventListener('pointerleave', () => { ptr.inside = false; ptr.overUI = false; hover = null; });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    setPtr(e); pickNow();
    ptr.down = true; ptr.sx = e.clientX; ptr.sy = e.clientY; ptr.lastX = e.clientX; ptr.last = e.timeStamp;
    ptr.kind = hover ? hover.userData.kind : null; ptr.hit = hover;
    mouseClick = 1; S.click = time; S.clickX = S.px; S.clickY = S.py;
    if (ptr.kind === 'pc' && canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
  });
  const release = (e) => {
    if (!ptr.down) return;
    ptr.down = false;
    if (dragging) { dragging = false; hero.classList.remove('is-grabbing'); spin.v = clamp(spin.v, -14, 14); return; }
    if (e.type === 'pointercancel') return;
    // a plain click: build the project on the card that was clicked, or the next one
    const target = ptr.kind === 'card' && ptr.hit ? ptr.hit.userData.project : (S.project + 1) % PROJECTS.length;
    if (!startBuild(target, true) && S.mode === 'building') { nod.v -= 0.4; hop(0.5); }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function pickNow() {
    ndc.set((ptr.cx / W) * 2 - 1, -((ptr.cy / H) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hits = ptr.overUI ? [] : ray.intersectObjects(pickables, false);
    hover = hits.length ? hits[0].object : null;
    ray.ray.intersectPlane(aimPlane, aim);
    needPick = false;
  }

  // the primary button gets a little reaction from the computer
  hero.querySelectorAll('.hero__cta .btn').forEach((b) => b.addEventListener('pointerenter', () => { hop(0.55); rippleKeys(time); }));

  addEventListener('keydown', (e) => {
    if (!inView || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
    const typing = time - S.typedAt < 4 && S.typed.length > 0;
    if (e.key.length === 1) {
      if (e.key === ' ') { if (!typing) return; e.preventDefault(); }       // space only types once you're typing, otherwise it scrolls
      const ch = e.key.toLowerCase();
      pressKey(KEYMAP[ch] ?? KEYMAP[SHIFTED[e.key]] ?? KEYMAP[e.code]);
      if (!typing) S.typed = '';
      if (S.typed.length < 26) S.typed += e.key;
      S.typedAt = time; userAt = time;
    } else if (e.key === 'Backspace' && typing) {
      pressKey(KEYMAP.Backspace); S.typed = S.typed.slice(0, -1); S.typedAt = time;
    } else if (e.key === 'Enter' && typing) {
      pressKey(KEYMAP.Enter); S.typedAt = time - 3.2;
      startBuild((S.project + 1) % PROJECTS.length, true);
    } else if (KEYMAP[e.code] !== undefined) pressKey(KEYMAP[e.code]);
  });

  /* ====================================================================
     Rendering
     ==================================================================== */
  let composer = null, bloom = null;
  if (Q.bloom) {
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.42, 0.55, 1.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  function layout() {
    const a = W / H, t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let setW = 6.1, fracW = 0.5, fracH = 0.6;
    if (a >= 1.35) { V.shiftX = 0.2; V.shiftY = 0.035; mouseG.visible = true; }
    else if (a >= 0.8) { V.shiftX = 0.1; V.shiftY = 0.17; fracW = 0.74; fracH = 0.45; mouseG.visible = true; }
    else { V.shiftX = 0.04; V.shiftY = 0.3; setW = 5.3; fracW = 0.98; fracH = 0.36; mouseG.visible = false; }
    wallG.visible = a >= 0.8; V.layerK = a >= 0.8 ? 1 : 0.55;   // phones: no back wall, and layers stay closer to the screen
    mouseShadow.visible = mouseCable.visible = mouseG.visible;
    V.dist = Math.max(setW / (fracW * 2 * t * a), 3.8 / (fracH * 2 * t));
    camera.aspect = a;
    camera.setViewOffset(W, H, -V.shiftX * W, -V.shiftY * H, W, H);
  }
  function resize() {
    W = Math.max(1, card.clientWidth); H = Math.max(1, card.clientHeight);
    Q.dpr = pickDpr();
    renderer.setPixelRatio(Q.dpr); renderer.setSize(W, H, false);
    if (composer) { composer.setPixelRatio(Q.dpr); composer.setSize(W, H); }
    dustU.uSize.value = 2.6 * Q.dpr; burstU.uSize.value = 9 * Q.dpr;
    layout(); dirty = true;
  }
  resize();
  new ResizeObserver(() => resize()).observe(card);

  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0 }).observe(card);

  /* ====================================================================
     One step of the whole show
     ==================================================================== */
  const INTRO = reduce ? 0 : 1;
  if (reduce) { introT = 99; S.mode = 'live'; S.project = 0; hero.classList.add('is-on'); crtUniforms.uPower.value = 1; }

  function tick(dt) {
    time += dt; introT += dt;
    const it = introT;

    /* ---- intro: the computer drops in, the set pops up, the tube warms up */
    const drop = reduce ? 1 : easeOutCubic(clamp01((it - 0.15) / 1.05));
    const turnIn = reduce ? 1 : easeOutExpo(clamp01((it - 0.15) / 1.7));
    const setIn = reduce ? 1 : easeOutExpo(clamp01((it - 0.85) / 0.9));
    const camIn = reduce ? 1 : easeOutCubic(clamp01(it / 2.8));
    const lightIn = reduce ? 1 : smooth(0.5, 2.0, it);
    if (!tick.landed && drop >= 1) { tick.landed = true; if (!reduce) { sq.v -= 3.4; rippleKeys(time); } }
    if (S.mode === 'off' && it > 1.45) { S.mode = 'boot'; S.bootT = 0; }

    /* ---- pointer */
    ptr.x = damp(ptr.x, ptr.inside ? ptr.tx : 0, 7, dt); ptr.y = damp(ptr.y, ptr.inside ? ptr.ty : 0, 7, dt);
    if (needPick && ptr.inside) pickNow();
    const idle = !ptr.inside || time - userAt > 4;
    hero.classList.toggle('is-grab', !!hover && hover.userData.kind === 'pc' && !dragging);
    hero.classList.toggle('is-point', !!hover && hover.userData.kind === 'card');

    /* ---- state machine */
    if (S.mode === 'boot') {
      S.bootT += dt;
      crtUniforms.uPower.value = easeOutCubic(clamp01(S.bootT / 0.55));
      M.led.emissiveIntensity = 2.4;
      hud('Starting up', 0, false);
      if (S.bootT >= 1.45) startBuild(0, false);
    } else if (S.mode === 'building') {
      S.t += dt; const b = S.t / BUILD;
      for (let i = 0; i < 3; i++) if (!S.landed[i] && b >= LAND[i]) { S.landed[i] = true; land(i); }
      ghost += dt;
      if (ghost > 0.06 && b < LAND[2]) { ghost = 0; pressKey(letterKeys[(Math.random() * letterKeys.length) | 0], 0.85); }
      hud(STAGES[b < LAND[0] ? 0 : b < LAND[1] ? 1 : 2], S.next, false);
      if (b >= 1) finishBuild();
    } else if (S.mode === 'live') {
      S.liveT += dt;
      hud('Live', S.project, true);
      if (!reduce && !dragging && S.liveT > HOLD) startBuild((S.project + 1) % PROJECTS.length, false);
    }

    /* ---- the computer: swivel, nod, hop, squash */
    const lookX = idle ? Math.sin(time * 0.45) * 0.16 : ptr.x * 0.34;
    const lookY = idle ? Math.sin(time * 0.31) * 0.02 : ptr.y * 0.07;
    if (!reduce) {
      stepSpring(yaw, lookX, 46, 11, dt);
      stepSpring(nod, lookY + (S.mode === 'building' ? -0.045 : 0), 60, 9, dt);
      stepSpring(sq, 0, 190, 13, dt);
      if (!dragging) stepSpring(spin, Math.round(spin.x / (Math.PI * 2)) * Math.PI * 2, 14, 6.4, dt);
      if (hopY > 0 || hopV > 0) { hopV -= 19 * dt; hopY += hopV * dt; if (hopY <= 0) { hopY = 0; hopV = 0; sq.v -= 3.2; rippleKeys(time); } }
    }
    pcYaw.rotation.y = yaw.x + spin.x + (1 - turnIn) * -2.8;
    pcTilt.rotation.x = nod.x;
    pcTilt.rotation.z = reduce ? 0 : Math.sin(time * 0.9) * 0.006;
    pcTilt.position.y = hopY + (1 - drop) * 3.4;
    const sy = clamp(1 + sq.x, 0.82, 1.2), introS = lerp(0.72, 1, drop);
    pcTilt.scale.set(introS / Math.sqrt(sy), introS * sy, introS / Math.sqrt(sy));
    const lift = clamp01((pcTilt.position.y) / 1.2);
    pcShadow.material.opacity = 0.9 * (1 - lift * 0.75) * smooth(0.1, 0.8, it + (reduce ? 9 : 0)); pcShadow.scale.setScalar(1 + lift * 0.35);

    /* ---- keyboard, mouse */
    kb.scale.setScalar(Math.max(0.001, setIn)); kb.position.z = 2.32 + (1 - setIn) * 1.1;
    mouseG.scale.setScalar(Math.max(0.001, setIn));
    mouseG.position.x = damp(mouseG.position.x, MOUSE_HOME.x + (idle ? 0 : ptr.x * 0.22), 10, dt);
    mouseG.position.z = damp(mouseG.position.z, MOUSE_HOME.z + (idle ? 0 : ptr.y * 0.16), 10, dt);
    mouseShadow.position.x = mouseG.position.x; mouseShadow.position.z = mouseG.position.z;
    mouseClick = Math.max(0, mouseClick - dt * 6); mouseBtn.position.y = 0.158 - 0.02 * mouseClick;
    for (let i = keyQueue.length - 1; i >= 0; i--) if (keyQueue[i].at <= time) { pressKey(keyQueue[i].i, 0.9); keyQueue.splice(i, 1); }
    if (activeKeys.size) {
      activeKeys.forEach((i) => { keyPress[i] = Math.max(0, keyPress[i] - dt * 6.5); setKey(i); if (keyPress[i] <= 0) activeKeys.delete(i); });
      keys.instanceMatrix.needsUpdate = true;
    }

    /* ---- the pointer on the screen follows the visitor's pointer */
    S.px = damp(S.px, idle ? CW * (0.55 + 0.25 * Math.sin(time * 0.7)) : CW * (0.06 + 0.88 * (ptr.x * 0.5 + 0.5)), 9, dt);
    S.py = damp(S.py, idle ? BAR + VH * (0.5 + 0.28 * Math.cos(time * 0.53)) : BAR + VH * (0.06 + 0.84 * (ptr.y * 0.5 + 0.5)), 9, dt);

    /* ---- flying layers */
    const building = S.mode === 'building';
    for (let i = 0; i < 3; i++) {
      const L = layers[i];
      if (!building || reduce) { if (L.visible) { L.visible = false; L.material.opacity = 0; } continue; }
      const out = easeOutExpo(clamp01((S.t - (0.2 + i * 0.11)) / 0.85));
      const back = easeInCubic(clamp01((S.t - (LAND[i] * BUILD - 0.36)) / 0.36));
      const k = out * (1 - back);
      L.visible = out > 0.001 && back < 1;
      L.position.set(Math.sin(time * 1.3 + i * 2.1) * 0.03 * k + (i - 1) * 0.16 * k, LAYER_Y[i] * k + Math.sin(time * 1.7 + i) * 0.035 * k, LAYER_Z[i] * k * (V.layerK || 1));
      L.rotation.set(-0.05 * k, (i - 1) * 0.05 * k + Math.sin(time * 0.9 + i) * 0.03 * k, 0);
      L.scale.setScalar(lerp(1, lerp(1, LAYER_S[i], V.layerK || 1), k));
      L.material.opacity = Math.min(1, out * 1.5) * (1 - back * back * back) * (i === 1 ? 0.96 : 1);
    }

    /* ---- back wall */
    const wallIn = reduce ? 1 : smooth(1.3, 3.2, it);
    const span = WALL.step * WALL.n, drift = reduce ? 0 : time * 0.03;
    cards.forEach((m, i) => {
      let a = ((i * WALL.step + drift) % span + span) % span - span / 2;           // wraps around behind the camera's view
      const edge = 1 - smooth(span / 2 - 0.42, span / 2 - 0.1, Math.abs(a));
      m.position.set(Math.sin(a) * WALL.r, WALL.y + (reduce ? 0 : Math.sin(time * 0.5 + i * 1.7) * 0.08), -Math.cos(a) * WALL.r + 0.5);
      m.rotation.y = -a;
      const P = PROJECTS[m.userData.project];
      const want = !P.tex ? 0 : hover === m ? 0.85 : (building && S.next === m.userData.project) ? 0.42 : (!building && S.project === m.userData.project) ? 0.26 : 0.13;
      _v.copy(m.position).project(camera);
      const side = 0.05 + 0.95 * smooth(-0.15, 0.55, _v.x);                         // keep the area behind the headline quiet
      m.userData.bright = damp(m.userData.bright, want * side, 6, dt);
      m.material.color.setScalar(Math.max(0.0001, m.userData.bright));
      m.material.opacity = edge * wallIn * (P.tex ? 1 : 0);
      m.scale.setScalar(damp(m.scale.x, hover === m ? 1.05 : 1, 8, dt));
      m.visible = m.material.opacity > 0.002;
    });

    /* ---- lights */
    flash = Math.max(0, flash - dt * 3.2); rimPulse = Math.max(0, rimPulse - dt * 1.4); screenPulse = Math.max(0, screenPulse - dt * 2.4);
    const on = crtUniforms.uPower.value;
    const breathe = reduce ? 1 : 0.94 + 0.06 * Math.sin(time * 1.3);
    keyLight.intensity = LIGHT.key * lightIn; fillLight.intensity = LIGHT.fill * lightIn;
    rim.intensity = LIGHT.rim * smooth(0.2, 1.4, it + (reduce ? 9 : 0)) * breathe * (1 + rimPulse * 1.6);
    rim2.intensity = LIGHT.rim2 * lightIn;
    const screenBright = on * (S.mode === 'building' ? 0.55 : S.mode === 'boot' ? 0.5 : 1) * (1 + screenPulse * 0.45);
    screenLight.intensity = LIGHT.screen * screenBright;
    pool.material.color.setRGB(0.04 * screenBright, 0.045 * screenBright, 0.06 * screenBright);
    cursorLight.position.lerp(_v.set(aim.x, clamp(aim.y, 0.6, 5.5), 3.4), 1 - Math.exp(-8 * dt));
    cursorLight.intensity = damp(cursorLight.intensity, ptr.inside && !reduce ? LIGHT.cursor : 0, 5, dt);
    crtUniforms.uTime.value = time; crtUniforms.uFlash.value = flash * 0.2;
    dustU.uTime.value = time; dustU.uAlpha.value = (reduce ? 0.2 : 0.3) * smooth(0.8, 3.0, it + (reduce ? 9 : 0));
    if (bloom) bloom.strength = 0.4 + flash * 0.1 + rimPulse * 0.12;

    /* ---- burst */
    if (burstOn) {
      let alive = 0;
      for (let i = 0; i < BN; i++) {
        if (burstLife[i] <= 0) continue;
        burstLife[i] = Math.max(0, burstLife[i] - dt * 0.75);
        burstVel[i * 3 + 1] -= 3.2 * dt;
        burstPos[i * 3] += burstVel[i * 3] * dt; burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt; burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt;
        if (burstPos[i * 3 + 1] < 0.03) { burstPos[i * 3 + 1] = 0.03; burstVel[i * 3 + 1] *= -0.35; }
        alive++;
      }
      burstGeo.attributes.position.needsUpdate = true; burstGeo.attributes.aLife.needsUpdate = true;
      if (!alive) { burstOn = false; burst.visible = false; }
    }

    /* ---- camera: a slow push in on load, a little parallax, and it pulls away as the page scrolls */
    const rect = card.getBoundingClientRect();
    const sp = clamp01(-rect.top / Math.max(1, rect.height));
    const az = V.az + (1 - camIn) * -0.5 + (reduce ? 0 : ptr.x * 0.07 + Math.sin(time * 0.23) * 0.022) + sp * 0.35;
    const el = V.el + (1 - camIn) * -0.13 + (reduce ? 0 : -ptr.y * 0.035 + Math.sin(time * 0.31) * 0.008) + sp * 0.1;
    const d = V.dist + (1 - camIn) * 5.5 + sp * 3.5;
    camera.position.set(V.target.x + d * Math.sin(az) * Math.cos(el), V.target.y + d * Math.sin(el), V.target.z + d * Math.cos(az) * Math.cos(el));
    camera.lookAt(V.target);

    /* ---- page elements */
    if ($content && !reduce) $content.style.transform = `translate3d(${(-ptr.x * 7).toFixed(2)}px, ${(-ptr.y * 4 + sp * 46).toFixed(2)}px, 0)`;
    if ($tip && fine) {
      const show = ptr.inside && !ptr.overUI && !dragging && S.mode !== 'off';
      $tip.classList.toggle('is-on', show);
      if (show) {
        const label = hover && hover.userData.kind === 'card' ? `Build ${PROJECTS[hover.userData.project].name}`
          : hover && hover.userData.kind === 'pc' ? 'Drag to spin'
          : building ? 'Building' : 'Click to build the next site';
        if ($tip.textContent !== label) $tip.textContent = label;
        tick.tx = damp(tick.tx ?? ptr.cx, ptr.cx, 16, dt); tick.ty = damp(tick.ty ?? ptr.cy, ptr.cy, 16, dt);
        $tip.style.transform = `translate3d(${(tick.tx + 16).toFixed(1)}px, ${(tick.ty + 18).toFixed(1)}px, 0)`;
      }
    }

    drawCRT(time); crtTex.needsUpdate = true;
  }

  function render() { if (composer && Q.bloom) composer.render(); else renderer.render(scene, camera); }

  /* ---- adaptive quality: if frames run long on a desktop, drop the heavy parts */
  let slow = 0, measured = 0;
  function watchSpeed(dt) {
    if (!Q.high || introT < 4 || measured > 600) return;
    measured++;
    slow = dt > 0.03 ? slow + 1 : Math.max(0, slow - 0.25);
    if (slow > 45) {
      slow = 0;
      if (Q.dpr > 1.05) { const old = pickDpr; Q.dprCap = 1; renderer.setPixelRatio(1); Q.dpr = 1; if (composer) { composer.setPixelRatio(1); composer.setSize(W, H); } void old; }
      else if (Q.bloom) Q.bloom = false;
      else if (floor) { floor.visible = false; measured = 9999; }
    }
  }

  const pageEl = document.querySelector('.page');
  let last = performance.now(), ready = false;
  function frame(now) {
    requestAnimationFrame(frame);
    const raw = (now - last) / 1000; last = now;
    if (!inView || document.hidden) return;
    if (pageEl && pageEl.classList.contains('entering')) return;   // the show starts when the preloader lifts
    if (reduce && !dirty && ready) return;                  // reduced motion: only redraw when something changed
    const dt = Math.min(raw, 1 / 20);
    tick(reduce ? 0.016 : dt); render(); dirty = false;
    if (raw < 0.2) watchSpeed(raw);
    if (!ready) { ready = true; hero.classList.add('is-ready'); }
  }
  requestAnimationFrame(frame);
  if (reduce) { card.addEventListener('pointerup', () => { dirty = true; }); addEventListener('keydown', () => { dirty = true; }); }

  /* ---- for testing: step the show forward by hand (the preview pane pauses animation when hidden) */
  window.__hero3d = {
    S, Q, renderer, scene, camera,
    advance(seconds = 1, step = 1 / 60) { for (let t = 0; t < seconds; t += step) tick(step); render(); if (!ready) { ready = true; hero.classList.add('is-ready'); } return { time: +time.toFixed(2), mode: S.mode, project: S.project, build: +(S.t / BUILD).toFixed(2) }; },
    point(nx, ny) { ptr.tx = nx; ptr.ty = ny; ptr.cx = (nx * 0.5 + 0.5) * W; ptr.cy = (ny * 0.5 + 0.5) * H; ptr.inside = true; needPick = true; userAt = time; },
    leave() { ptr.inside = false; hover = null; },
    build(i) { return startBuild(i ?? (S.project + 1) % PROJECTS.length, true); },
    spin(v) { spin.v = v; },
    type(text) { [...text].forEach((ch) => { pressKey(KEYMAP[ch.toLowerCase()]); S.typed += ch; }); S.typedAt = time; },
    hover: () => (hover ? hover.userData : null),
    info: () => ({ W, H, dpr: Q.dpr, bloom: Q.bloom, mirror: !!floor && floor.visible, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
  };
}
