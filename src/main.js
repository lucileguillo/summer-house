import * as THREE from 'three'; 
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; 
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
let dayNightValue = 0;

let lumieres = [];

const slider = document.getElementById("dayNight");

slider.addEventListener("input", (e) => {
    dayNightValue = parseFloat(e.target.value);
});

function updateLighting() {
    dirLight.intensity = THREE.MathUtils.lerp(5, 0.1, dayNightValue);

    ambLight.intensity = THREE.MathUtils.lerp(1, 0.2, dayNightValue);

    // couleur du ciel jour vs nuit
    const dayColor = new THREE.Color(0xEEFFEE); // bleu ciel
    const nightColor = new THREE.Color(0x0b0c1a); // bleu nuit

    const currentColor = dayColor.clone().lerp(nightColor, dayNightValue);

    lumieres.forEach((lumiere) => {
    const light = lumiere.userData.light;

    if (light) {
        light.intensity = THREE.MathUtils.lerp(0, 10, dayNightValue);
    }
    
    if (lumiere.material) {
        lumiere.material.emissive = new THREE.Color(0xffcc88);
        lumiere.material.emissiveIntensity = THREE.MathUtils.lerp(0, 2, dayNightValue);
    }

});

    scene.background = currentColor;
}

const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45, // field of view
    viewport.width / viewport.height, // aspect ratio
    0.1, // distance min
    1000 // distance max
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(viewport.width, viewport.height);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.cursorStyle = 'grab';
controls.autoRotate = true;
controls.autoRotateSpeed = 3;
controls.enableDamping = true;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load("./scene.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true; 

            node.material = node.material.clone();

            if (node.name.toLowerCase().includes("lumiere")) {
                lumieres.push(node);
            }
        }
    });

    
lumieres.forEach((lumiere) => {
     // eclairage nocturne

    const worldPos = new THREE.Vector3();
    lumiere.getWorldPosition(worldPos);

    const light = new THREE.PointLight(0xffee88, 0, 30, 1);
    light.position.copy(worldPos);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.02;

    scene.add(light);
    lumiere.userData.light = light;
});


});

window.onresize = () => {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;

    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(viewport.width, viewport.height);
    renderer.render(scene, camera);
};

camera.position.set(15, 5, 15); 

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.3 })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

// soleil de jour

const ambLight = new THREE.AmbientLight(0xFFFFFF, 1);

const dirLight = new THREE.DirectionalLight(0xFFFFFF, 5);
dirLight.position.set(0, 5, 10);
dirLight.target.position.set(-10, 0, 2);
dirLight.castShadow = true;

dirLight.shadow.mapSize.set(2048, 2048);

dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;

dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;

dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.02;

scene.add(ambLight, dirLight, dirLight.target);

function animate(time){
    controls.update();

    updateLighting(); 

    renderer.render(scene, camera);
};

renderer.setAnimationLoop(animate);

renderer.render(scene, camera);