import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WebGL } from 'three/examples/jsm/capabilities/WebGL.js';
import { initUI } from './ui.js';

let controls = null;
let renderer = null;
let startLoop = () => {};
let stopLoop = () => {};
let renderOnce = () => {};
let reduceMotion = false;

const ui = initUI({
  onReduceMotionChange: handleReduceMotion
});

const canvas = document.getElementById('three-canvas');
if (!canvas) {
  throw new Error('Missing #three-canvas');
}

if (!WebGL.isWebGLAvailable()) {
  document.body.classList.add('no-webgl');
  ui.setSceneStatus('WebGL indisponivel');
  ui.updateLoader(1, 'WebGL ausente');
} else {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const sceneUrl = new URL('scene.glb', `${window.location.origin}${baseUrl}`).toString();

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  const mobileQuery = window.matchMedia('(max-width: 900px)');
  let isMobile = mobileQuery.matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060a12, 6, 20);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0.6, 1.55, 3.6);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.1, 0);
  controls.update();

  const updateControlsForDevice = () => {
    isMobile = mobileQuery.matches;
    const enableControls = !isMobile;
    controls.enabled = enableControls;
    controls.enableZoom = enableControls;
    controls.enableRotate = enableControls;
  };

  updateControlsForDevice();
  mobileQuery.addEventListener('change', updateControlsForDevice);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(4, 6, 3);
  const fillLight = new THREE.DirectionalLight(0x7ab8ff, 0.35);
  fillLight.position.set(-4, 3, 2);
  scene.add(ambient, keyLight, fillLight);

  const loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = () => {
    ui.updateLoader(0, 'Carregando');
    ui.setSceneStatus('Carregando');
  };

  loadingManager.onProgress = (_url, loaded, total) => {
    const progress = total > 0 ? loaded / total : 0;
    ui.updateLoader(progress, 'Carregando');
  };

  loadingManager.onLoad = () => {
    ui.updateLoader(1, 'Pronto');
    ui.setSceneStatus('Cena carregada');
    renderOnce();
  };

  loadingManager.onError = () => {
    ui.updateLoader(1, 'Falha');
    ui.setSceneStatus('Falha ao carregar');
  };

  const gltfLoader = new GLTFLoader(loadingManager);
  let sceneLoaded = false;

  const fallbackMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2af0c2,
      metalness: 0.2,
      roughness: 0.35,
      wireframe: true
    })
  );
  fallbackMesh.position.set(0, 1.1, 0);

  const loadScene = () => {
    gltfLoader.load(
      sceneUrl,
      (gltf) => {
        scene.add(gltf.scene);
        sceneLoaded = true;
        renderOnce();
      },
      undefined,
      () => {
        if (!sceneLoaded) {
          scene.add(fallbackMesh);
          ui.updateLoader(1, 'Fallback');
          ui.setSceneStatus('Fallback ativo');
          renderOnce();
        }
      }
    );
  };

  let rafId = null;
  reduceMotion = ui.getReduceMotion();

  renderOnce = () => {
    controls.update();
    renderer.render(scene, camera);
  };

  function animate() {
    rafId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  startLoop = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(animate);
    }
  };

  stopLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  loadScene();

  controls.addEventListener('change', () => {
    if (reduceMotion) {
      renderOnce();
    }
  });

  window.addEventListener('resize', () => {
    updateControlsForDevice();
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(width, height, false);
    renderOnce();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else if (!reduceMotion) {
      startLoop();
    }
  });

  ui.syncReduceMotion();

  if (!reduceMotion) {
    startLoop();
  }
}

function handleReduceMotion(enabled) {
  if (!controls) {
    return;
  }
  reduceMotion = enabled;
  controls.enableDamping = !enabled;
  if (enabled) {
    stopLoop();
    renderOnce();
  } else {
    startLoop();
  }
}
