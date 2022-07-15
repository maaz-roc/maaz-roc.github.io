import * as jsonTo3d from "./json_to_3d.js";
import * as viewer from "./viewer.js"

const materialsDictPromise = jsonTo3d.initializeMaterialsDict({...jsonTo3d.defaultOptions});
const fontPromise = jsonTo3d.initializeFont("./node_modules/three/examples/fonts/helvetiker_regular.typeface.json")

function addEventListeners(result) {
    const {controls, camera, onClickAddSupportBolt} = result;
    const axisList = [-1, 1, -2, 2, -3, 3]
    Array.from(document.querySelectorAll('.orthogonalControls > button')).forEach((button, index) => {
        const axis = axisList[index];
        button.addEventListener('click', (event) => {
            viewer.viewFromAxis(controls, axis);
        })
    })

    document.querySelector('.addSupportBolt').addEventListener('click', event => {
        onClickAddSupportBolt.nextClickAddsSupportBolt = true;
    })
}

async function onClickUsePlugin(rootElem=document.body) {
    const jsonData = await viewer.openJson();

    let materialsDict = await materialsDictPromise;
    let font = await fontPromise;

    const options = {...jsonTo3d.defaultOptions, materialsDict : materialsDict, font: font};

    const result = await $(rootElem).threeViewer(jsonData, options);
    addEventListeners(result);
}

document.querySelector('.convert').addEventListener('click', () => {
    const rootElem = document.querySelector('.viewerContainer');
    onClickUsePlugin(rootElem);
});