import * as jsonTo3d from "./json_to_3d.js";
import * as viewer from "./viewer.js";
import * as GLTFLoader from './lib/three-loaders/GLTFLoader.js';
// import * as GLTFExporter from './lib/three-exporters/GLTFExporter.js';
// import * as SVGLoader from './lib/three-loaders/SVGLoader.js';
const materialsDictPromise = jsonTo3d.initializeMaterialsDict({ ...jsonTo3d.defaultOptions });
const fontPromise = jsonTo3d.initializeFont("./node_modules/three/examples/fonts/helvetiker_regular.typeface.json");
async function onClickConvertAny() {
    const jsonData = await viewer.openJson();
    let materialsDict = await materialsDictPromise;
    let font = await fontPromise;
    let options = { ...jsonTo3d.defaultOptions, materialsDict: materialsDict, font: font };
    const { mesh, minRealCoordinates } = await jsonTo3d.jsonToMesh(jsonData, options);
    const scene = jsonTo3d.initialize3d();
    scene.add(mesh);
    const viewer3d = new viewer.Viewer3D(scene, minRealCoordinates);
    viewer.initializeEventListeners(viewer3d, jsonData);
    jsonTo3d.exportToGLTF(mesh);
    // jsonTo3d.exportToOBJ(mesh);
}
async function onClickLoadGltf() {
    const data = await viewer.openFileAsString();
    const loader = new GLTFLoader.GLTFLoader();
    loader.parse(data, '', (result) => {
        const scene = jsonTo3d.initialize3d();
        result.scene.children.forEach(obj => {
            scene.add(obj);
        });
        const minRealCoordinates = jsonTo3d.getMeshesminRealCoordinates(scene);
        const { renderer, camera } = new viewer.Viewer3D(scene, minRealCoordinates);
    });
}
function main() {
    document.querySelector('.convert').addEventListener('click', onClickConvertAny);
    // document.querySelector('.convertGLTF').addEventListener('click', onClickLoadGltf);
}
main();
