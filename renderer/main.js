import * as THREE from 'three';

const file = './shaders/intro-to-raymarching/13-vertical-box-movement.frag';
let frag;
let container;
let camera, scene, renderer, clock;
let uniforms;
const loader = new THREE.FileLoader();

await load();
init();
animate();

async function load() {
    frag = await loader.loadAsync(file);
}

function init() {
    container = document.getElementById('container');

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    let geometry = new THREE.PlaneGeometry(2, 2);

    uniforms = {
        u_time: {
            type: "f",
            value: 1.0
        },
        u_resolution: {
            type: "v2",
            value: new THREE.Vector2()
        },
        u_mouse: {
            type: "v3",
            value: new THREE.Vector3(undefined, undefined, -1)
        }
    };

    let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document
            .getElementById('vertexShader')
            .textContent,
        fragmentShader: frag
    });

    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    document.onmousemove = function(e) {
        uniforms.u_mouse.value.x = e.pageX;
        uniforms.u_mouse.value.y = e.pageY;
    }

    document.onmousedown = function(e) {
        uniforms.u_mouse.value.z = e.button === 0
            ? 1
            : 0;
    }

    document.onmouseup = function(e) {
        uniforms.u_mouse.value.z = e.button === 0
            ? 0
            : uniforms.u_mouse.value.z;
    }
}

function onWindowResize(event) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    uniforms.u_time.value += clock.getDelta();
    renderer.render(scene, camera);
}