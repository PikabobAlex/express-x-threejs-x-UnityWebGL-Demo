import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

import sceneGLB from './assets/scene.glb?url';
import hdr from './assets/studio_small_03_1k.hdr?url';

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;

let composer: EffectComposer;

const clock = new THREE.Clock();
const loader: GLTFLoader = new GLTFLoader();
const hdrLoader = new RGBELoader();

const canvas_score = document.createElement("canvas");
canvas_score.width = 256;
canvas_score.height = 256;
const ctx_score = canvas_score.getContext("2d");
const texture_score = new THREE.CanvasTexture(canvas_score);
const canvas_angle = document.createElement("canvas");
canvas_angle.width = 256;
canvas_angle.height = 256;
const ctx_angle = canvas_angle.getContext("2d");
const texture_angle = new THREE.CanvasTexture(canvas_angle);
const canvas_name = document.createElement("canvas");
canvas_name.width = 256;
canvas_name.height = 256;
const ctx_name = canvas_name.getContext("2d");
const texture_name = new THREE.CanvasTexture(canvas_name);

let name = "Player";
let score = 0;
let angle = 0;

let angleTunnerMesh: THREE.Mesh
let launchButtonMesh: THREE.Mesh

export function updateUserName(newName: string) {
    name = newName;
}

export function updateGameScore(newScore: number) {
    score = newScore;
}

export function updateGameAngle(newAngle: number) {
    angle = newAngle;
}

export function InitThreeScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.05;
    document.body.appendChild(renderer.domElement);

    // composer
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.95;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.25;
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(window.devicePixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    // composer.addPass(bloomPass);

    // light
    const light = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    scene.add(pointLight);
    pointLight.position.y = 1;

    const skyMap = hdrLoader.load(hdr, () => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        skyMap.mapping = THREE.EquirectangularReflectionMapping;
    });

    loader.load(sceneGLB, (gltf) => {

        const model = gltf.scene

        model.traverse((o) => {
            if (o instanceof THREE.Mesh) {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    if (o.name === "Plane01" || o.name === "angle_raycast_target") {
                        o.visible = false;
                        return;
                    }
                    if (o.material instanceof THREE.Material) {

                        const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setScalar(0.25), roughness: 0.25, metalness: 0, envMap: skyMap, envMapIntensity: .5 });;

                        mat.name = o.name + "_mat";

                        switch (o.name) {
                            case "Plane001":
                                mat.visible = false;
                                break;
                            case "angle_raycast_target":
                                mat.visible = false;
                                break;
                            case "launchbutton":
                                mat.color = new THREE.Color().setStyle("#4d0202");
                                mat.metalness = 0.15;
                                mat.roughness = 0.05;
                                launchButtonMesh = o;
                                break
                            case "angletunner":
                                mat.color = new THREE.Color().setStyle("#3b3a3a");
                                mat.metalness = 0.75;
                                angleTunnerMesh = o;
                                break
                            case "panel":
                                mat.color = new THREE.Color().setStyle("#283029");
                                mat.metalness = 0.75;
                                mat.roughness = 0.95;
                                break
                            case "reading_score":
                                // mat.color = new THREE.Color().setStyle("#000000");
                                mat.metalness = 0;
                                mat.roughness = 0.025;
                                mat.map = texture_score;
                                mat.map.flipY = false;
                                break
                            case "reading_angle":
                                // mat.color = new THREE.Color().setStyle("#000000");
                                mat.metalness = 0;
                                mat.roughness = 0.025;
                                mat.map = texture_angle;
                                mat.map.flipY = false;
                                break
                            case "nameplate":
                                // mat.color = new THREE.Color().setStyle("#000000");
                                mat.metalness = 0;
                                mat.roughness = 0.025;
                                mat.map = texture_name;
                                mat.map.flipY = false;
                                mat.transparent = true;
                        }
                        o.material = mat;
                    }
                }
            }
        });
        scene.add(gltf.scene);


        camera.position.z = 1;
        camera.position.y = 2;
        camera.lookAt(0, 0, 0);
        animate();
        updateScore(1);
        updateAngle(0);
        updateName("Player");
    })
}

export function animationButtonPressed() {
    // gsap.to(launchButtonMesh.scale, { duration: 0.1, x: 0.95, y: 0.95, z: 0.95, ease: "power1.inOut", yoyo: true, repeat: 1 });
    gsap.to(launchButtonMesh.position, { duration: 0.25, y: -0.05, ease: "power1.inOut", yoyo: true, repeat: 1 });
    const e = { v: 0 }
    gsap.to(e, {
        duration: 0.1, v: 1, ease: "power1.inOut", yoyo: true, repeat: 1, onUpdate: () => {
            const mat = launchButtonMesh.material as THREE.MeshPhysicalMaterial;
            mat.emissive = new THREE.Color().setStyle("#4d0202").multiplyScalar(e.v);
        }
    });
}

export function animationAngleTunnerSet(value: number) {
    gsap.to(angleTunnerMesh.position, { duration: 0.1, x: value * 0.5, ease: "power1.inOut" });
}

function updateScore(score: number) {
    if (ctx_score == null) return;
    ctx_score.clearRect(0, 0, canvas_score.width, canvas_score.height);
    // fill background with black
    ctx_score.fillStyle = "black";
    ctx_score.fillRect(0, 0, canvas_score.width, canvas_score.height);
    ctx_score.font = "bold 90px monospace";
    ctx_score.fillStyle = "white";
    ctx_score.textAlign = "center";
    ctx_score.fillText(score.toString(), canvas_score.width / 2, canvas_score.height / 2 + 24);
    texture_score.needsUpdate = true;
}



function updateAngle(angle: number) {
    if (ctx_angle == null) return;
    ctx_angle.clearRect(0, 0, canvas_angle.width, canvas_angle.height);
    // fill background with black
    ctx_angle.fillStyle = "black";
    ctx_angle.fillRect(0, 0, canvas_angle.width, canvas_angle.height);
    ctx_angle.font = "bold 80px monospace";
    ctx_angle.fillStyle = "white";
    ctx_angle.textAlign = "center";
    ctx_angle.fillText(angle.toString(), canvas_angle.width / 2, canvas_angle.height / 2 + 28);
    texture_angle.needsUpdate = true;
}

export function updateName(name: string) {
    if (ctx_name == null) return;
    ctx_name.clearRect(0, 0, canvas_name.width, canvas_name.height);
    // fill background with black
    // ctx_name.fillStyle = "black";
    // // ctx_name.fillRect(0, 0, canvas_name.width, canvas_name.height);
    ctx_name.font = "bold 48px monospace";
    ctx_name.fillStyle = "white";
    ctx_name.textAlign = "center";
    ctx_name.fillText(name, canvas_name.width / 2, canvas_name.height / 2, canvas_name.width - 20);
}

function animate() {
    const delta = clock.getDelta();
    updateAngle(angle);
    updateName(name);
    updateScore(score);
    composer.render(delta);
    requestAnimationFrame(animate);
}

