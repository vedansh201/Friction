import * as THREE from 'three';
import html2canvas from 'html2canvas-pro';

const container = document.getElementById('prism-container');
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function initializePrism() {
  if (!container || motion.matches) return;

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
  } catch {
    container.hidden = true;
    return;
  }

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);

  camera.position.set(0, 0, 6);

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const group = new THREE.Group();

  group.scale.setScalar(0.62);
  group.position.set(2.8, 0.8, 0);

  scene.add(group);

  const geometry = new THREE.CylinderGeometry(
    1.35,
    1.35,
    3.2,
    3,
    1
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uResolution: { value: new THREE.Vector2() },
      uTexture: { value: null },
      uRefraction: { value: 0.035 },
      uOpacity: { value: 0.62 },
      uDispersion: { value: 0.035 }
    },

    vertexShader: `
      varying vec3 vNormal;

      void main() {
        vNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      varying vec3 vNormal;

      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      uniform float uRefraction;
      uniform float uOpacity;
      uniform float uDispersion;

      void main() {
        vec3 normal = normalize(vNormal);
        vec2 uv = gl_FragCoord.xy / uResolution;

        float edge = clamp(
          1.0 - abs(normal.z),
          0.0,
          1.0
        );

        vec2 distortion = normal.xy * uRefraction * (0.45 + pow(edge, 1.4) * 2.8);

        distortion.x *= uResolution.y / uResolution.x;

        vec2 margin = vec2(0.5) / uResolution;

        vec2 redUV = clamp(uv + distortion * (1.0 + uDispersion), margin, 1.0 - margin);

        vec2 greenUV = clamp(uv + distortion, margin, 1.0 - margin);

        vec2 blueUV = clamp(uv + distortion * (1.0 - uDispersion), margin,1.0 - margin);

        vec3 refracted = vec3(
          texture2D(uTexture, redUV).r,
          texture2D(uTexture, greenUV).g,
          texture2D(uTexture, blueUV).b
        );

        refracted = sRGBTransferEOTF(vec4(refracted, 1.0)).rgb;

        float face = max(dot(normal, normalize(vec3(-0.45, 0.55, 1.0))), 0.0);

        vec3 reflection = vec3(0.78, 0.92, 1.0) * ( pow(edge, 8.4) * 0.3 + pow(face, 2.5) * 0.09);

        float rim = pow(edge, 4.0);

        reflection += vec3(0.55, 0.82, 1.0) * rim * 0.12;

        gl_FragColor = vec4(refracted + reflection, uOpacity);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,

    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const prism = new THREE.Mesh(geometry, material);

  prism.rotation.x = Math.PI / 2;
  group.add(prism);

  const edges = new THREE.EdgesGeometry(geometry);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.38
  });

  const lines = new THREE.LineSegments(
    edges,
    edgeMaterial
  );

  lines.rotation.x = Math.PI / 2;
  group.add(lines);

  let texture;
  let capturing = false;
  let pendingCapture = false;
  let captureTimer;
  let disposed = false;
  let frame;

  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  group.visible = false;

  async function capturePage() {
    if (disposed || document.hidden || motion.matches) return;

    if (capturing) {
      pendingCapture = true;
      return;
    }

    capturing = true;

    try {
      const canvas = await html2canvas(document.body, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,

        scale: 1,
        useCORS: true,
        allowTaint: false,
        logging: false,

        width: innerWidth,
        height: innerHeight,

        x: scrollX,
        y: scrollY,
        scrollX,
        scrollY,

        windowWidth: innerWidth,
        windowHeight: innerHeight,
        imageTimeout: 5000,

        ignoreElements: (element) =>
          [
            'prism-container',
            'openingScreen',
            'themePanel',
            'transition',
            'returnMessage',
            'marvel-tribute'
          ].includes(element.id) ||
          element.classList.contains('cursor-dot') ||
          element.classList.contains('cursor-ring'),

        onclone: (document) => {
          const style = document.createElement('style');

          style.textContent = `
            * {
              animation: none !important;
              transition: none !important;
            }
          `;

          document.head.appendChild(style);

          document.querySelectorAll(
            '.navbar, .intro, .eyebrow, .intro h1, .description, .door, .footer'
          ).forEach((element) => {
            element.style.opacity = '1';
            element.style.transform = 'none';
          });
        }
      });

      if (disposed) return;

      if (!texture) {
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        material.uniforms.uTexture.value = texture;
      } else {
        texture.image = canvas;
        texture.needsUpdate = true;
      }

      group.visible = true;
    } catch (error) {
      console.warn(
        'Friction prism capture unavailable:',
        error
      );
    } finally {
      capturing = false;

      if (pendingCapture) {
        pendingCapture = false;
        scheduleCapture();
      }
    }
  }

  function scheduleCapture() {
    clearTimeout(captureTimer);
    captureTimer = setTimeout(capturePage, 850);
  }

  function onPointer(event) {
    const left = innerWidth * 0.45;
    const top = innerHeight * 0.05;

    const inside =
      event.clientX >= left &&
      event.clientY >= top &&
      event.clientY <= innerHeight * 0.75;

    targetX = inside
      ? ((event.clientX - left) / (innerWidth - left)) * 2 - 1
      : 0;

    targetY = inside
      ? ((event.clientY - top) / (innerHeight * 0.7)) * 2 - 1
      : 0;
  }

  function animate() {
    if (disposed || document.hidden || motion.matches) {
      frame = null;
      return;
    }

    x += (targetX - x) * 0.045;
    y += (targetY - y) * 0.045;

    group.rotation.set(
      y * 0.35,
      x * 0.55,
      x * 0.08
    );

    material.uniforms.uRefraction.value = 0.035 + (Math.abs(x) + Math.abs(y)) * 0.012;

    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }

  function resume() {
    if (frame != null) cancelAnimationFrame(frame);
    frame = null;

    if (!document.hidden && !motion.matches) {
      animate();
      scheduleCapture();
    }
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    renderer.setSize(innerWidth, innerHeight);

    renderer.getDrawingBufferSize(material.uniforms.uResolution.value);

    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *camera.position.z;

    const width = height * camera.aspect;

    group.scale.setScalar(Math.min(0.62, width * 0.16));

    group.position.set(
      width * 0.24,
      height * 0.18,
      0
    );

    scheduleCapture();
  }

  renderer.domElement.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      dispose();
    },
    { once: true }
  );

  function dispose() {
    if (disposed) return;
    disposed = true;

    themeObserver.disconnect();

    cancelAnimationFrame(frame);
    clearTimeout(captureTimer);

    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', scheduleCapture);

    document.removeEventListener(
      'visibilitychange',
      resume
    );

    document.removeEventListener(
      'friction:themechange',
      scheduleCapture
    );

    document.removeEventListener(
      'friction:ready',
      scheduleCapture
    );

    motion.removeEventListener('change', resume);

    geometry.dispose();
    edges.dispose();
  
    material.dispose();
    edgeMaterial.dispose();
    texture?.dispose();

    renderer.dispose();
    renderer.domElement.remove();
  }

  window.addEventListener(
    'pointermove',
    onPointer,
    { passive: true }
  );

  window.addEventListener('resize', resize);



  window.addEventListener(
    'scroll',
    scheduleCapture,
    { passive: true }
  );

  document.addEventListener(
    'visibilitychange',
    resume
  );

  document.addEventListener(
    'friction:themechange',
    scheduleCapture
  );

  document.addEventListener(
    'friction:ready',
    scheduleCapture
  );

  motion.addEventListener('change', resume);

  document.querySelectorAll('.door img').forEach((image) => {
    if (!image.complete) {
      image.addEventListener(
        'load',
        scheduleCapture,
        { once: true }
      );
    }
  });

  document.fonts?.ready.then(scheduleCapture);

  const themeObserver = new MutationObserver(scheduleCapture);

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  if (import.meta.hot) {import.meta.hot.dispose(dispose);}

  resize();
  animate();

  setTimeout(scheduleCapture, 3000);
}

initializePrism();