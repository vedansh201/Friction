import * as THREE from "three";
import html2canvas from "html2canvas-pro";
const container = document.getElementById("prism-container");

if (container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const prismGroup = new THREE.Group();

  prismGroup.scale.set(
    0.62,
    0.62,
    0.62
  );

  prismGroup.position.set(
    2.8,
    0.8,
    0
  );

  scene.add(prismGroup);

  const refractionTexture = new THREE.Texture();

  refractionTexture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.CylinderGeometry(
    1.35,
    1.35,
    3.2,
    3,
    1
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: {
        value: refractionTexture
      },

      uRefraction: {
        value: 0.075
      },

      uOpacity: {
        value: 0.62
      },

      uDispersion: {
        value: 0.035
      }
    },

    vertexShader: `
      varying vec2 vScreenUv;
      varying vec3 vNormal;

      void main() {

        vNormal =
          normalize(
            normalMatrix * normal
          );

        vec4 clipPosition =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);

        gl_Position =
          clipPosition;

        vScreenUv =
          clipPosition.xy /
          clipPosition.w;

        vScreenUv =
          vScreenUv * 0.5 + 0.5;
      }
    `,

    fragmentShader: `
      varying vec2 vScreenUv;
      varying vec3 vNormal;

      uniform sampler2D uTexture;

      uniform float uRefraction;
      uniform float uOpacity;
      uniform float uDispersion;

      void main() {

        vec3 normal =
          normalize(vNormal);

        
        float edge =
          1.0 - abs(normal.z);

        float edgeStrength =
          pow(edge, 2.4);


        float edgeFactor =
          pow(1.0 - abs(normal.z), 1.4);

        vec2 distortion =
          normal.xy *
          uRefraction *
          (0.45 + edgeFactor * 2.8);

        
        vec2 redOffset =
          distortion *
          (1.0 + uDispersion);

        vec2 greenOffset =
          distortion;

        vec2 blueOffset =
          distortion *
          (1.0 - uDispersion);

        

        float r =
          texture2D(
            uTexture,
            vScreenUv + redOffset
          ).r;

        float g =
          texture2D(
            uTexture,
            vScreenUv + greenOffset
          ).g;

        float b =
          texture2D(
            uTexture,
            vScreenUv + blueOffset
          ).b;

        vec3 refracted =
          vec3(r, g, b);

        

        vec3 glassTint =
          vec3(
            0.78,
            0.92,
            1.0
          );

        

        float sharpEdge =
          pow(edgeStrength, 3.5);

        vec3 lightDirection =
          normalize(
            vec3(
              -0.45,
              0.55,
              1.0
            )
          );

        float faceLight =
          max(
            dot(normal, lightDirection),
            0.0
          );

        float faceHighlight =
          pow(
            faceLight,
            2.5
          );

        vec3 reflected =
          glassTint *
          sharpEdge *
          1.15;

       
        reflected +=
          glassTint *
          faceHighlight *
          0.45;

       
        float internalAngle =
          pow(
            1.0 - abs(normal.z),
            1.5
          );

        float internalGlow =
          sin(
            (normal.x + normal.y) * 5.0
          ) * 0.5 + 0.5;

        vec3 internalColor =
          vec3(
            0.72,
            0.88,
            1.0
          );

        reflected +=
          internalColor *
          internalAngle *
          internalGlow *
          0.16;

        float silhouette =
          pow(
            1.0 - abs(normal.z),
            6.0
          );

        reflected +=
          vec3(
            0.85,
            0.95,
            1.0
          ) *
          silhouette *
          0.35;

        float rim =
          pow(
            1.0 - abs(
              dot(
                normal,
                vec3(0.0, 0.0, 1.0)
              )
            ),
            4.0
          );

        vec3 rimColor =
          vec3(
            0.55,
            0.82,
            1.0
          );

        reflected +=
          rimColor *
          rim *
          0.32;

        vec3 finalColor =
          refracted * 0.78 +
          reflected;

        float alpha =
          uOpacity *
          (
            0.35 +
            edgeStrength * 0.65
          );

        gl_FragColor =
          vec4(
            finalColor,
            alpha
          );
      }
    `,

    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const prism = new THREE.Mesh(
    geometry,
    material
  );

  prism.rotation.x = Math.PI / 2;

  prismGroup.add(prism);

  const innerGeometry =
    new THREE.CylinderGeometry(
      1.12,
      1.12,
      3.05,
      3,
      1
    );

  const innerMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.015,
      transmission: 1,
      roughness: 0,
      thickness: 1.2,
      ior: 1.5,
      side: THREE.DoubleSide,
      depthWrite: false
    });

  const innerPrism =
    new THREE.Mesh(
      innerGeometry,
      innerMaterial
    );

  innerPrism.rotation.x = Math.PI / 2;

  prismGroup.add(innerPrism);

  const edges =
    new THREE.EdgesGeometry(geometry);

  const edgeMaterial =
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38
    });

  const edgeLines =
    new THREE.LineSegments(
      edges,
      edgeMaterial
    );

  edgeLines.rotation.x = Math.PI / 2;

  prismGroup.add(edgeLines);

  const ambientLight =
    new THREE.AmbientLight(
      0xffffff,
      0.45
    );

  scene.add(ambientLight);

  const keyLight =
    new THREE.PointLight(
      0xd9efff,
      18,
      14
    );

  keyLight.position.set(
    3,
    2,
    4
  );

  scene.add(keyLight);

  const secondaryLight =
    new THREE.PointLight(
      0xffffff,
      7,
      10
    );

  secondaryLight.position.set(
    -3,
    -1,
    3
  );

  scene.add(secondaryLight);

  const topLight =
    new THREE.PointLight(
      0x6ea8ff,
      5,
      8
    );

  topLight.position.set(
    0,
    4,
    2
  );

  scene.add(topLight);

  let captureCanvas = null;
  let captureTexture = null;

  async function capturePage() {

    const prismContainer =
      document.getElementById("prism-container");

    try {

      if (prismContainer) {
        prismContainer.style.visibility = "hidden";
      }

      captureCanvas =
        await html2canvas(
          document.body,
          {
            backgroundColor: null,
            scale: Math.min(
              window.devicePixelRatio,
              1.5
            ),
            useCORS: true,
            allowTaint: false,
            logging: false
          }
        );

      if (!captureTexture) {

        captureTexture =
          new THREE.CanvasTexture(
            captureCanvas
          );

        captureTexture.colorSpace =THREE.SRGBColorSpace;
        captureTexture.minFilter =THREE.LinearFilter;
        captureTexture.magFilter =THREE.LinearFilter;
        captureTexture.generateMipmaps =false;
        material.uniforms.uTexture.value =captureTexture;
      } else {

        captureTexture.image =captureCanvas;

        captureTexture.needsUpdate =true;
      }

    } catch (error) {
      console.error(
        "Friction prism capture failed:",
        error
      );

    } finally {

      if (prismContainer) {
        prismContainer.style.visibility =
          "visible";
      }
    }
  }

  capturePage();
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  let mouseInsidePrismArea = false;

  window.addEventListener(
    "mousemove",
    (event) => {

      const x =event.clientX;
      const y =event.clientY;
      const areaLeft =window.innerWidth *0.45;
      const areaRight =window.innerWidth;
      const areaTop =window.innerHeight *0.05;
      const areaBottom =window.innerHeight *0.75;
      mouseInsidePrismArea =
        x >= areaLeft &&
        x <= areaRight &&
        y >= areaTop &&
        y <= areaBottom;

      if (mouseInsidePrismArea) {

        targetMouseX =((x - areaLeft) /(areaRight - areaLeft)) * 2 - 1;
        targetMouseY =((y - areaTop) / (areaBottom - areaTop)) * 2 - 1;
      } else {
        targetMouseX = 0;
        targetMouseY = 0;
      }
    }
  );

  function animate() {

    requestAnimationFrame(animate);

    mouseX +=(targetMouseX -mouseX) * 0.045;

    mouseY +=(targetMouseY -mouseY) * 0.045;

    prismGroup.rotation.y =mouseX * 0.55;
    prismGroup.rotation.x =mouseY * 0.35;
    prismGroup.rotation.z =mouseX * 0.08;
    material.uniforms.uRefraction.value =0.035 +(Math.abs(mouseX) +Math.abs(mouseY)) * 0.012;
    renderer.render(
      scene,
      camera
    );
  }

  animate();
  window.addEventListener(
    "resize",
    () => {
      camera.aspect = window.innerWidth /window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          2
        )
      );
      capturePage();
    }
  );
}