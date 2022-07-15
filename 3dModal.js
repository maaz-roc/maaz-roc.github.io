// @ts-check
import * as jsonTo3d from "./lib/3D_Viewer_conversion/json_to_3d.js";
import * as viewer from "./lib/3D_Viewer_conversion/viewer.js";

const hatchFolderLocation = "./";
const conversionFolderLocation = "./lib/3D_Viewer_conversion/";
function getInitializeMaterialsDictOptions () {
  return {
    ...jsonTo3d.defaultOptions,
    textureFilenames: jsonTo3d.defaultOptions.textureFilenames.map(
      (filename) => hatchFolderLocation + filename
    ),
    // hatchFilesDict is updated with the new colored hatches while
    // the original hatchFilesArr isn't
    hatchFilesArr : Object.values(hatchFilesDict) ?? []
  };
}
async function initializeMaterialsDict() {
  const options = getInitializeMaterialsDictOptions();
  return jsonTo3d.initializeMaterialsDict(options);
}

async function updateMaterialsDict() {
  const options = getInitializeMaterialsDictOptions();
  const materialsDict = await materialsDictPromise;
  materialsDictPromise = jsonTo3d.insertNewInMaterialsDict(materialsDict, options);
  const newMaterialsDict = await materialsDictPromise;
}

async function initializeFont() {
  const filename =
    conversionFolderLocation +
    "node_modules/three/examples/fonts/helvetiker_regular.typeface.json";
  return jsonTo3d.initializeFont(filename);
}

var materialsDictPromise = initializeMaterialsDict();
const fontPromise = initializeFont();

// just so it can be used by CrossSectionCanvas.js
function disposeMesh (obj) {
  viewer.disposeMesh(obj);
}

function fixBoreHoleNamePositionOnPlan (viewer3d) {
  const { scene } = viewer3d;

  viewer3d.textObjs = viewer.getAllTextObjs(scene);

  const allTexts = viewer3d.textObjs;
  allTexts.forEach(o => {
    if(o.axis !== 'X' && o.axis !== 'Y') {
      o.position.z = o.position.z - 2;
      o.position.x = o.position.x - 1.5;
    }
  })
}

function positionTextOnPlan (viewer3d) {
  const { scene } = viewer3d;

  viewer3d.textObjs = viewer.getAllTextObjs(scene);

  const allTexts = viewer3d.textObjs;
  allTexts.forEach(o => {
    if(o.axis === 'Y')
      o.rotation.x = -Math.PI/2;
    else if(o.axis === 'X') {
      o.rotation.x = -Math.PI/2;
      o.rotation.z = -Math.PI/2;
    } else {
      o.rotation.x = -Math.PI/2;
      o.rotation.z = Math.PI*2;
      o.rotation.y = Math.PI*2;
    }
    let updatedPosition = false;
    const updatePosition = () => {
      if (updatedPosition) {
        return;
      }
      o?.geometry?.computeBoundingBox();
      const bbox = o?.geometry?.boundingBox;
      if (bbox) {
        const [scaleX, scaleY, scaleZ] = o.scale.toArray();
        const dx = Math.abs(bbox.max.x - bbox.min.x) * scaleX;
        const dy = Math.abs(bbox.max.y - bbox.min.y) * scaleY;
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
          if (o.axis === 'X') {
            o.position.x = o.position.x + dy / 2;
            o.position.z = o.position.z - dx / 2;
          }
          if (o.axis === 'Y') {
            o.position.x = o.position.x - dx / 2;
            o.position.z = o.position.z - dy / 2;
          }
          updatedPosition = true;
        }
      }
    }
    if (o.sync != null) {
      o.sync(() => updatePosition());
      updatePosition();
    }
  });
}

function updateTextObjSizesPlan (viewer3d, textSize) {
  const { scene } = viewer3d;

  viewer3d.textObjs = viewer.getAllTextObjs(scene);
  const textObjs = viewer3d.textObjs;

  textObjs.forEach(t => {
    if(t.name === 'text') {
      let currentTSize = t.fontSize;
      let textSizeDifference = currentTSize - textSize;
      let positionShift = textSizeDifference * t.scale.x;
      t.fontSize = textSize;
      t.position.x = t.position.x + positionShift;
      t.position.z = t.position.z + positionShift;
    }
  })
}

export const changeAxisLabel = async (crossSectionCanvas, newText, labelType, isPlan) => {
  const { scene, minRealCoordinates } = crossSectionCanvas.storage.viewer3d; 
  const options = await get3dOptions(crossSectionCanvas);
  options[labelType] = newText;

  viewer.addGrid(scene, minRealCoordinates, options, !isPlan, crossSectionCanvas.storage.gridFontSize*10);
  crossSectionCanvas.storage.viewer3d.textObjs = viewer.getAllTextObjs(scene);

  if(isPlan) {
    positionTextOnPlan(crossSectionCanvas.storage.viewer3d);
  }
}

export const changeGridTextSize = async (crossSectionCanvas, tSize, isPlan) => {
  const { scene, minRealCoordinates } = crossSectionCanvas.storage.viewer3d;
  const options = await get3dOptions(crossSectionCanvas);

  if(tSize != 'auto')
    viewer.addGrid(scene, minRealCoordinates, options, !isPlan, tSize);
  else
    viewer.addGrid(scene, minRealCoordinates, options, !isPlan);
  
  crossSectionCanvas.storage.viewer3d.textObjs = viewer.getAllTextObjs(scene);

  if(isPlan) {
    updateTextObjSizesPlan(crossSectionCanvas.storage.viewer3d, tSize)
    positionTextOnPlan(crossSectionCanvas.storage.viewer3d);
  }
}

export const toggleGridOutline = async (crossSectionCanvas, value) => {
  const { scene } = crossSectionCanvas.storage.viewer3d;
  const grid = scene.children.filter(c => c.name === 'Grid')[0];

  if(!grid)
    return;
  
  const outline = grid.children[0].children.filter(c => c.name === 'OutlineMesh')[0];

  if(!outline)
    return;

  outline.visible = value;
}

function dispose (viewer3d) {
  if (! viewer3d) {
    return;
  }
  let scene, camera, renderer, animationId, minRealCoordinates;

  if (viewer3d) {
    scene = viewer3d.scene;
    camera = viewer3d.camera;
    renderer = viewer3d.renderer;
    animationId = viewer3d.animationId;
    minRealCoordinates = viewer3d.minRealCoordinates;
  } else {
    return;
  }

  viewer.disposeMesh(scene);

  scene = null;
  camera = null;
  renderer && renderer.renderLists.dispose();
  renderer = null;
  minRealCoordinates = null;

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  console.log("Dispose!");
};

function flipElemVisibility(htmlElem) {
  if (!htmlElem || !htmlElem.classList) {
    return;
  }
  const invizClassName = "invisible";
  if (htmlElem.classList.contains(invizClassName)) {
    htmlElem.classList.remove(invizClassName);
  } else {
    htmlElem.classList.add(invizClassName);
  }
}

const propertyGridShowing3dClass = 'propertyGridShowing3d';
const buttonsThatOnlyShowOn2DSelectors = ['.focusCenter', '.menu-item.zoom', '.drawLine', '.drawPolygon', '.drawText', '.toggleWaterfrontModeButton'];

function getElemFromSelectorArray(rootElem, selectorArray) {
  if (! rootElem || ! selectorArray) {
    return null;
  }
  return selectorArray.map(x => rootElem?.querySelector(x));
}

const buttonsThatOnlyShowOn3DSelectors = ['.panCanvas', '.rotateCanvas', '.toggleCamera'];

//ADD NEW BUTTONS NEEDED FOR PLAN VIEW HERE
const buttonsThatOnlyShowOnPlanSelectors = [];

const hideSeparatorOnPlan = ['.hideSeparatorOnPlan'];

export async function open2d(crossSectionCanvas, buttonElem) {
  const shouldShow2d = crossSectionCanvas?.storage?.isShowing3d;
  const shouldShowPlan = crossSectionCanvas?.storage?.isShowingPlan;

  document.body.removeEventListener('keydown', keyPressedRotate, true);

  if (! shouldShow2d) {
    return;
  }

  crossSectionCanvas.initializePropertyGrid(false);

  if(crossSectionCanvas.storage.isShowing3d || crossSectionCanvas.storage.isShowingPlan){
    const mainElem = crossSectionCanvas.storage.rootElem.querySelector(".view3d");
    const canvasWindowElem =
      crossSectionCanvas.storage.rootElem.querySelector(".windowContainer");
  
    flipElemVisibility(mainElem);
    flipElemVisibility(canvasWindowElem);
  }

  crossSectionCanvas.storage.isShowingPlan = false;

  buttonsThatOnlyShowOn3DSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "none";
  })
  buttonsThatOnlyShowOnPlanSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "none";
  })

  hideSeparatorOnPlan.forEach(separator => {
    const s = crossSectionCanvas.storage.rootElem?.querySelector(separator);
    if(!s){
      return
    }
    s.style.display = 'inline-block'
  })
  
  const buttons = getElemFromSelectorArray(crossSectionCanvas.storage.rootElem, buttonsThatOnlyShowOn2DSelectors);
  buttons.forEach(button => {
    button?.classList.remove('invisible');
  })
  const gridButton = crossSectionCanvas.storage.rootElem.querySelector(".toggleGridButton");
  if (crossSectionCanvas.storage.ShowGridlines) {
      crossSectionCanvas.enableButton(gridButton);
  }
  else {
      crossSectionCanvas.disableButton(gridButton);
  }
  crossSectionCanvas.zoomExtent();

  crossSectionCanvas.storage.isShowing3d = false;
  
  const panelElem = crossSectionCanvas?.storage?.rootElem?.querySelector("#propertyGrid");
  if (panelElem) {
    panelElem.classList.remove(propertyGridShowing3dClass);
  }

  crossSectionCanvas.refreshLegend();

  //Remove Terrain when switching to profile view
  if(crossSectionCanvas.storage.terrainObj != null){
    window['toggleTerrain'](crossSectionCanvas)
  }

  if(crossSectionCanvas.storage.mapObj != null){
    window['toggleMap'](crossSectionCanvas)
  }
}

function getJsonData(crossSectionCanvas) {
  const jsonString = crossSectionCanvas.exportToJson();
  const jsonData = JSON.parse(jsonString);
  return jsonData;
}

function onProgressFactory (crossSectionCanvas) {
  const progressContainer = crossSectionCanvas?.storage?.rootElem?.querySelector('.progress3D');
  const elem = progressContainer?.querySelector('.customProgressBar');
  if (! elem) {
    return (percent) => null;
  }
  return (percent) => {
    if (percent == 0) {
      progressContainer.classList.add('inviz');
    }
    else {
      progressContainer.classList.remove('inviz');
    }
    elem.style.width = `${percent}%`;
    console.log(percent, elem.style.width);
    if (percent == 100) {
      setTimeout(() => {
        progressContainer.classList.add('inviz');
      }, 1000);
    }
  }
}

function hatchScaleToHatchRepeat(hatchScale) {
  // factor to make the hatch on 3D model repeat as much as the hatch on 2D
  const hatchScaleToHatchRepeatFactor = 16;
  hatchScale = Math.max(1, hatchScale);
  const hatchRepeat = hatchScaleToHatchRepeatFactor/hatchScale;
  return hatchRepeat
}

async function get3dOptions(crossSectionCanvas = null) {
  let materialsDict = await materialsDictPromise;
  let font = await fontPromise;

  const options = {
    ...jsonTo3d.defaultOptions,
    materialsDict: materialsDict,
    font: font,
    yAxisTitle : "Elevation",
    xAxisTitle : "X",
    zAxisTitle : "Y",
  };

  if (crossSectionCanvas) {
    options.yAxisTitle = crossSectionCanvas.storage.gridZText ? crossSectionCanvas.storage.gridZText : crossSectionCanvas.storage.scaleIsFeet ? 'Elevation (ft)' : 'Elevation (m)';
    options.xAxisTitle = crossSectionCanvas.storage.gridHorText ? crossSectionCanvas.storage.gridHorText : crossSectionCanvas.storage.scaleIsFeet ? 'X (ft)' : 'X (m)';
    options.zAxisTitle = crossSectionCanvas.storage.gridVertText ? crossSectionCanvas.storage.gridVertText : crossSectionCanvas.storage.scaleIsFeet ? 'Y (ft)' : 'Y (m)';

    options.lineStyleScale = crossSectionCanvas.storage.lineStyleScale ?? 1;
    options.lineThickness = crossSectionCanvas.storage.LineThickness ?? 2;
    options.hatchRepeat = hatchScaleToHatchRepeat(crossSectionCanvas.storage.HatchScale);
    options.interrogationPointFontSize = parseFloat(crossSectionCanvas.storage.interrogationPointFontSize) / 20;
    options.ProjectDepth_Unit = crossSectionCanvas.storage.ProjectDepth_Unit;
    options.Coordinates_Unit = crossSectionCanvas.storage.Coordinates_Unit;
    options.Unit = crossSectionCanvas.storage.Unit;
    options.boreholeOptions.boreholeRadius = parseFloat(crossSectionCanvas.storage.boreholeWidth ?? 3) / 2;

  }
  if (hatchFilesArr) {
    options.hatchFilesArr = hatchFilesArr;
  }

  return options;
}

export function update3dViewerSize(viewer3d, width, height) {
  const {camera, renderer, scene, fxaaPass, composer, outlinePass} = viewer3d;
  if (width <= 0 || height <= 0 || ! renderer || ! camera || ! scene) {
    return;
  }
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
  renderer.setSize(width, height);
  outlinePass.setSize(width, height);
  composer.setSize(width, height);
  const pixelRatio = renderer.getPixelRatio();
  if (fxaaPass) {
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( width * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( height * pixelRatio );
  }
}

function removeBoreholesWithSameName(scene) {
  if (! scene) {
    return;
  }
  const names = {};
  const toBeRemoved = [];
  scene.traverse(obj => {
    if (! obj?.name?.includes('borehole')) {
      return;
    }
    if (obj.name in names) {
      toBeRemoved.push(obj);
    }
    names[obj.name] = true;
  })
  // this is done afterwards so the tree isn't modified during traverse
  // which apparently results in some objects not being found
  toBeRemoved.forEach(obj => {
    if (! obj) {
      return;
    }
    obj.parent.remove(obj);
    obj.clear();
    viewer.disposeMesh(obj);
  })
}

export function zoomAll(viewer3d, isPlan) {
  if (! viewer3d) {
    return;
  }
  const {scene, controls, renderer, camera, orthographicCamera} = viewer3d;
  if (! scene || ! controls) {
    return;
  }

  viewer.zoomAll(scene, controls, renderer, 1.05, isPlan);
}

export function zoomTop(viewer3d) {
  if (! viewer3d) {
    return;
  }
  const {scene, controls, renderer, camera, orthographicCamera} = viewer3d;
  if (! scene || ! controls) {
    return;
  }
  viewer.zoomTop(scene, controls, renderer);
}


const default3dZoomStep = 10;
export function zoomBy(viewer3d, step = default3dZoomStep, isPerspectiveCamera = true) {
  if (! viewer3d) {
    return;
  }

  const {scene, controls} = viewer3d;
  const camera = controls?.object
  if (! scene || ! controls || ! camera) {
    return;
  }

  // https://stackoverflow.com/questions/47674036/three-js-move-camera-distance-to-object-by-z
  const directionVector = new window['THREE'].Vector3().subVectors(camera.position, controls.target);
  const newDistance = Math.max(0, directionVector.length() - step);
  if (! newDistance || newDistance <= 0) {
    return;
  }

  if(isPerspectiveCamera) {
    directionVector.setLength(newDistance);
    const newPosition = new window['THREE'].Vector3().addVectors(directionVector, controls.target);
    camera.position.set(...(newPosition.toArray()));
  } else {
    if(step < 0)
      camera.zoom = camera.zoom - 1;
    else
      camera.zoom = camera.zoom + 1;
  }
  
  controls.update();
}

export function zoomIn(viewer3d, isPerspectiveCamera) {
  zoomBy(viewer3d, default3dZoomStep, isPerspectiveCamera);
}

export function zoomOut(viewer3d, isPerspectiveCamera) {
  zoomBy(viewer3d, - default3dZoomStep, isPerspectiveCamera);
}

export function toggleGrids(viewer3d, bool) {
  if (! viewer3d) {
    return;
  }
  const {scene} = viewer3d;
  if (! scene) {
    return;
  }
  viewer.toggleGrids(scene, bool);
}

export async function updateOutlinedObjects (viewer3d) {
  if (! viewer3d?.scene || ! viewer3d?.outlinePass) {
    return;
  }
  const outlined = [];
  viewer3d.scene.traverse(obj => {
    if (obj?.name?.includes('outlined')) {
      outlined.push(obj);
    }
  })
  viewer3d.outlinePass.selectedObjects = outlined;
}

export async function addGrid(viewer3d, crossSectionCanvas=null) {
  if (! viewer3d) {
    return;
  }
  const {scene, minRealCoordinates} = viewer3d;
  const options = await get3dOptions(crossSectionCanvas);
  if (! scene || ! minRealCoordinates || ! options) {
    return;
  }
  viewer.addGrid(scene, minRealCoordinates, options);
  viewer3d.textObjs = viewer.getAllTextObjs(scene);
  updateOutlinedObjects(viewer3d);
}

const keyPressedRotate = (e) => {
  var type = e.target.getAttribute("type");
  if(type != 'text'){
    switch(e.key) {
        case 'ArrowUp':
          document.body.camera.translateY(20);
          break;
      case 'ArrowDown':
        document.body.camera.translateY(-20);
          break;
      case 'ArrowLeft':
        document.body.camera.translateX(-20);
          break;
      case 'ArrowRight':
        document.body.camera.translateX(20);
          break;
    }
    e.preventDefault();
  }
}

function setPanLeftClick (controls, camera, bool=true) {
  if (! controls) {
    return;
  }
 
  controls.enablePan = bool;  
  document.body.camera = camera;

  const {LEFT, MIDDLE, RIGHT} = controls.mouseButtons;
  let leftBehavior = window['THREE'].MOUSE.PAN;
  let rightBehavior = window['THREE'].MOUSE.ROTATE;
  
  if (! bool) {
    leftBehavior = window['THREE'].MOUSE.ROTATE;
    rightBehavior = window['THREE'].MOUSE.PAN;
    
    document.body.addEventListener('keydown', keyPressedRotate, true);
  } else {
    document.body.removeEventListener('keydown', keyPressedRotate, true);
  }

  controls.mouseButtons.LEFT = leftBehavior;
  controls.mouseButtons.RIGHT = rightBehavior;
}

function setPanLeftClickPanMode (controls, camera) {
  if (! controls) {
    return;
  }
 
  controls.enablePan = true;
  let leftBehavior = window['THREE'].MOUSE.PAN;
  let rightBehavior = null;
  controls.mouseButtons.LEFT = leftBehavior;
  controls.mouseButtons.RIGHT = rightBehavior;
}

function switchCameraToPerspective(viewer3d, bool) {
  if (! viewer3d) {
    return;
  }
  const {controls, camera, renderer, perspectiveCamera, orthographicCamera, ssaaRenderPassPerspective, ssaaRenderPassOrthographic, outlinePass, viewCube, worldAxis} = viewer3d;
  let receiving = perspectiveCamera;
  let sending = orthographicCamera;
  let message = 'Perspective';
  if (! bool) {
    receiving = orthographicCamera;
    sending = perspectiveCamera;
    message = "Isometric";
  }
  if (receiving == camera) {
    return;
  }
  viewer.copyCamera(receiving, sending);
  viewer3d.camera = receiving;
  controls.object = receiving;
  controls.update();
  zoomAll(viewer3d);
  const cameraTypeElem = renderer?.domElement?.parentElement.querySelector('.cameraType');
  if (cameraTypeElem) {
    cameraTypeElem.innerText = message;
  }

  viewCube.camera = receiving;
  worldAxis.camera = receiving;
  outlinePass.camera = receiving;

  if(camera.originalZoom)
    camera.zoom = camera.originalZoom;

  ssaaRenderPassPerspective.enabled = bool;
  ssaaRenderPassOrthographic.enabled = ! bool;
}

async function setScale(viewer3d, horizontal, vertical, hatchScale, crossSectionCanvas = null) {
  if (horizontal <= 0 || vertical <= 0) {
    return;
  }
  const {scene} = viewer3d;
  if (! scene) {
    return;
  }
  const factor = vertical/horizontal;
  if (Number.isNaN(factor)) {
    return;
  }
  const options = await get3dOptions(crossSectionCanvas);
  scene.scale.y = factor;
  const textObjs = viewer.getAllTextObjs(scene);
  textObjs.forEach(obj => {
    obj.scale.x = 0.01 * options.textSize;
    obj.scale.z = 0.01 * options.textSize;
    // texts were scaled to 1/100 of their size
    obj.scale.y = 0.01 * options.textSize / factor;
  })
  const interrogationPoints = viewer.getAllWithName(scene, 'interrogationPoint');
  interrogationPoints.forEach(obj => {
    obj.scale.x = 0.01 * options.interrogationPointFontSize;
    obj.scale.z = 0.01 * options.interrogationPointFontSize;
    // texts were scaled to 1/100 of their size
    obj.scale.y = 0.01 * options.interrogationPointFontSize / factor;
  })
  const sectionNamesBackground = viewer.getAllWithName(scene, 'sectionNameBackground');
  const waterSymbols = viewer.getAllWithName(scene, 'waterSymbol');
  const maintainAspect = [...sectionNamesBackground, ...waterSymbols]
  maintainAspect.forEach(obj => {
    obj.scale.y = 1 / factor;
  })
  const sectionNameTexts = viewer.getAllWithName(scene, 'sectionNameText');
  sectionNameTexts.forEach(obj => {
    obj.scale.x = 1.2 * 0.01 * options.textSize;
    obj.scale.z = 1.2 * 0.01 * options.textSize;
    // texts were scaled to 1/100 of their size
    obj.scale.y = 1.2 * 0.01 * options.textSize / factor;
  })

  // correct textures
  const objsWithTexture = [];
  scene.traverse(obj => {
    const texture = obj?.material?.map;
    if (texture && ! obj.name.includes('dontFixTextureWhenScaling')) {
      objsWithTexture.push(obj);
    }
  })
  const hatchRepeat = hatchScaleToHatchRepeat(hatchScale)
  objsWithTexture.forEach(obj => {
    const texture = obj.material.map;
    let {repeatX, repeatY} = jsonTo3d.calculateBestTextureScale(texture, hatchRepeat);
    if (obj?.geometry?.type == 'CylinderGeometry') {
      const radius = obj.geometry.parameters?.radiusBottom ?? 1;
      const meshWidth = 2 * Math.PI * radius;
      const meshHeight = Math.abs(obj.geometry.parameters?.height) ?? 1;
      repeatX = repeatX * meshWidth;
      repeatY = repeatY * meshHeight;
    }
    texture?.repeat?.set(repeatX, repeatY * factor);
    if (texture.image) {
      texture.needsUpdate = true;
    }
  })
}

function getLineSegments2(scene) {
  const lines = [];
  scene.traverse(obj => {
    if (obj.type == "LineSegments2") {
      lines.push(obj)
    }
  });
  return lines;
}

function updateLineStyleScale(scene, lineStyleScale) {
  const lines = getLineSegments2(scene);

  const newDashSizes = lines.map(line => {
    const material = line?.material;
    if (! material) {
      return null;
    }
    if (! material.dashed) {
      return null;
    }
    const lineWidth = material.linewidth;
    const dashSize = material.dashSize;
    const gapSize = material.gapSize;
    const isDot = lineWidth == dashSize && dashSize == gapSize;
    if (isDot) {
      return dashSize;
    }
    return jsonTo3d.getLine2DashSize(lineWidth / jsonTo3d.line2ThicknessFactor, lineStyleScale) ?? dashSize;
  });
  newDashSizes.forEach((dashSize, index) => {
    const material = lines[index]?.material;
    if (dashSize == null || dashSize <= 0 || ! material) {
      return;
    }
    material.dashSize = dashSize;
    material.gapSize = dashSize;
    material.needsUpdate = true;
  })
}

function updateLineThickness(scene, lineThickness) {
  const affectedLines = [];
  scene.traverse(obj => {
    if (obj.name.includes('edgeLines')) {
      affectedLines.push(obj);
    }
  })
  if (affectedLines.length == 0) {
    return;
  }
  const newWidth = lineThickness * jsonTo3d.line2ThicknessFactor;
  // lines may share same material so we need to modify them only after
  // determining the new values
  const newProperties = affectedLines.map(line => {
    const material = line?.material;
    if (! material) {
      return null;
    }
    const oldWidth = material.linewidth;
    if (! oldWidth || oldWidth <= 0) {
      return null;
    }
    const factor = newWidth / oldWidth;
    return {
      linewidth: newWidth,
      dashSize: factor * material.dashSize,
      gapSize: factor * material.gapSize
    }
  });
  newProperties.forEach((properties, index) => {
    if (properties == null) {
      return;
    }
    const material = affectedLines[index]?.material;
    if (! material) {
      return;
    }
    material.linewidth = properties.linewidth;
    if (material.dashed) {
      material.dashSize = properties.dashSize;
      material.gapSize = properties.gapSize;
    }
    material.needsUpdate = true;
  })
}

export function get3DPolygonPoints (scene) {
  if (! scene) {
    return;
  }
  const points = {};
  scene.traverse(obj => {
    if(! obj?.name?.includes('polygon') || ! obj?.parent?.name?.includes("polygonGroup")) {
      return;
    }
    const timestamp = obj.parent.name.replace('polygonGroup', '');
    const polyPoints = [];
    const geometry = obj?.geometry?.clone();
    if (! geometry) {
      return;
    }
    // apply rotation and position
    obj.parent.updateMatrixWorld();
    geometry.applyMatrix4(obj.parent.matrixWorld);
    const arr = geometry?.attributes?.position?.array;
    if (! arr) {
      return;
    }
    // += 6 instead of += 3
    // so it only takes first point of each segment to avoid repetition
    for(let i = 0; i < arr.length; i += 6) {
      const point = Array.from(arr.slice(i, i + 3))
      if (point.length >= 3) {
        point[2] = - point[2]
      }
      polyPoints.push({coordinate : point})
    }
    points[timestamp] = polyPoints;
  })
  return points;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function openPlan(crossSectionCanvas, buttonElem) {
  const shouldShowPlan = !crossSectionCanvas?.storage?.isShowingPlan;
  const shouldShow3d = !crossSectionCanvas?.storage.isShowing3d;

  if(!shouldShowPlan)
    return;

  crossSectionCanvas.initializePropertyGrid(true);

  const spinner = crossSectionCanvas.storage.rootElem?.querySelector('.loading3D');
  spinner.style.visibility = "visible";
  void(spinner.offsetHeight);
  await sleep(10);

  const mainElem = crossSectionCanvas.storage.rootElem.querySelector(".view3d");
  const rootElem = mainElem.querySelector(".container3d");
  const canvasWindowElem = crossSectionCanvas.storage.rootElem.querySelector(".windowContainer");
  const svgElem = crossSectionCanvas.storage.rootElem.querySelector(".svgWindow");

  dispose(crossSectionCanvas.storage.viewer3d);

  document.body.removeEventListener('keydown', keyPressedRotate, true);

  const removeCurrentChosen = () => {
      let listImages = document.getElementsByClassName('listItemPlan');

      for(let i = 0; i < listImages.length; i++ ){
          listImages[i].classList.remove('chosenPlan');
      }
  }

  rootElem.innerHTML = `
  <div class="topLeftCorner">
    <div class="canvasTooltip terrainTooltip hidden" style="background-color: rgba(255,255,255,0.8); border-radius: 5px;">
      <span>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Hold alt and drag the map to move it
      </span>
    </div>
  </div>
  
  <div class="bottomRightCorner">
    <div class="contourLine" style="background-color: rgba(255,255,255,0.8); margin-right: 5px; padding: 5px; border-radius: 5px; font-size: 14px; display: none; line-height: normal">
      
    </div>
    <div class="cameraType" style="background-color: rgba(255,255,255,0.8); display: inline-block; padding: 5px; border-radius: 5px; font-size: 14px; line-height: normal">
      Perspective
    </div>
  </div>
  
  <div class="btnPlan topRightCorner">
    <span class="listItemContainerPlan planDisplayIcon"><img id="planDisplayIcon" src="./Hatch_Files/PNG/Texture/PlanMode_sat.png" title="Satellite"/></span>
    <ul class="planList">
      <li class="listItemContainerPlan " onclick="handleIconClickPlan('StreetMap')"><img class="listItemPlan" src="./Hatch_Files/PNG/Texture/PlanMode_map.png" id="StreetMap" title="Street Map"/></li>
      
      <li class="listItemContainerPlan " onclick="handleIconClickPlan('None')"><img class="listItemPlan" src="./Hatch_Files/PNG/Texture/PlanMode_off.png" id="None" title="No Map"/></li>
      
      <li class="listItemContainerPlan " onclick="handleIconClickPlan('Satellite')"><img class="listItemPlan chosenPlan" src="./Hatch_Files/PNG/Texture/PlanMode_sat.png"  id = "Satellite" title="Satellite"/></li>

      <li class="listItemContainerPlan " onclick="handleIconClickPlan('Terrain')"><img class="listItemPlan" src="./Hatch_Files/PNG/Texture/PlanMode_terrain.png" id="Terrain" title="Street Map (with contours)"/></li>          
    </ul>
  </div>
  `;

  const jsonData = getJsonData(crossSectionCanvas);
  const options = await get3dOptions(crossSectionCanvas);

  const viewer3d = await $(rootElem).threeViewer(jsonData, options, false);

  crossSectionCanvas.storage.viewer3d = viewer3d;
  const { renderer, scene, minRealCoordinates, controls, fxaaPass, composer, camera, outlinePass} = viewer3d;

  showOtherCrossSections(crossSectionCanvas, scene, minRealCoordinates, options);
  showOtherTestHoles(crossSectionCanvas, scene, minRealCoordinates, options);

  if(crossSectionCanvas.storage.gridFontSize)
    viewer.addGrid(scene, minRealCoordinates, options, false, crossSectionCanvas.storage.gridFontSize*10);
  else
    viewer.addGrid(scene, minRealCoordinates, options, false);

  
  updateOutlinedObjects(viewer3d);

  controls.enableRotate = false;

  const handleIconClickPlan = async (iconType) => {
    removeCurrentChosen();

    if(crossSectionCanvas.storage.mapObj && iconType === 'None')
      await window['toggleMap'](crossSectionCanvas);
    else {

      switch(iconType) {
        case 'StreetMap':
          crossSectionCanvas.storage.mapSettings.terrain = 'Street Map';
          break;
        case 'Terrain':
          crossSectionCanvas.storage.mapSettings.terrain = 'Street Map (with contours)'
          break;
        case 'Satellite':
          crossSectionCanvas.storage.mapSettings.terrain = 'Satellite'
          break;
        default: break;
      }
      

      if(crossSectionCanvas.storage.mapObj){
        await window['addMap'](crossSectionCanvas);
      } else {
        await window['toggleMap'](crossSectionCanvas)
      }
    }  

    //update source of display image
    const displayIcon = document.getElementById('planDisplayIcon');
    const clickedIcon = document.getElementById(iconType);

    // @ts-ignore
    displayIcon.src = clickedIcon?.src;
    // @ts-ignore
    displayIcon.title = clickedIcon?.title;

    //add new chosen item
    document.getElementById(iconType)?.classList.add('chosenPlan');
  }

  window['handleIconClickPlan'] = handleIconClickPlan;

  if (crossSectionCanvas.storage.isShowingTerrain) {
    await window['addTerrain'](crossSectionCanvas);
  }
  // scene.add(new window['THREE'].AxesHelper(100));

  const canvasWidth = svgElem.getAttribute("width");
  const canvasHeight = svgElem.getAttribute("height");
  renderer.setSize(canvasWidth, canvasHeight);
  composer.setSize(canvasWidth, canvasHeight);
  outlinePass.setSize(canvasWidth, canvasHeight);
  if (fxaaPass) {
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( canvasWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( canvasHeight * pixelRatio );
  }

  if(!crossSectionCanvas.storage.isShowing3d){
    flipElemVisibility(mainElem);
    flipElemVisibility(canvasWindowElem);
  }

  const buttons = getElemFromSelectorArray(crossSectionCanvas.storage.rootElem, buttonsThatOnlyShowOn2DSelectors)
  buttons.forEach(button => {
    button?.classList.add('invisible');
  })

  buttonsThatOnlyShowOn3DSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "none";
  })

  buttonsThatOnlyShowOnPlanSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "initial";
  })

  hideSeparatorOnPlan.forEach(separator => {
    const s = crossSectionCanvas.storage.rootElem?.querySelector(separator);
    if(!s){
      return
    }
    s.style.display = 'None'
  })

  const gridButton = crossSectionCanvas.storage.rootElem.querySelector(".toggleGridButton");
  if (crossSectionCanvas.storage.ShowGridlines_3D) {
      crossSectionCanvas.enableButton(gridButton);
  }
  else {
      crossSectionCanvas.disableButton(gridButton);
      // initial state has grid, we have to turn it off
      viewer.toggleGrids(scene, false);
  }
  crossSectionCanvas.storage.isShowing3d = true;
  crossSectionCanvas.storage.isShowingPlan = true;

  const panelElem = crossSectionCanvas?.storage?.rootElem?.querySelector("#propertyGrid");
  if (panelElem) {
    panelElem.classList.add(propertyGridShowing3dClass);
  }

  removeBoreholesWithSameName(scene);

  switchCameraToPerspective(viewer3d, false);
  crossSectionCanvas.storage.isPerspectiveCamera = false;

  positionTextOnPlan(viewer3d);
  fixBoreHoleNamePositionOnPlan(viewer3d);
  
  setScale(viewer3d, crossSectionCanvas.storage.AX, crossSectionCanvas.storage.AY, crossSectionCanvas.storage.HatchScale, crossSectionCanvas);
  
  scene.children.forEach(c => {
    if(c.name === 'Grid'){
      c.remove(c.children[1])
    }
  })
  
  viewer3d.textObjs = viewer.getAllTextObjs(scene);
  viewer3d.rotateGridText = false;
  positionTextOnPlan(viewer3d);

  const worldAxis = crossSectionCanvas.storage.rootElem?.querySelector('.worldAxis');
  const viewCube = crossSectionCanvas.storage.rootElem?.querySelector('.viewCube');
  worldAxis.style.pointerEvents = 'none';
  viewCube.style.display = 'none';

  updateLineThickness(scene, 2);
  document.getElementsByClassName('LineThickness')[0].children[1].children[0].value = 2;

  setPanLeftClickPanMode(controls, camera);

  camera.originalZoom = camera.zoom;

  //Remove Terrain when switching to profile view
  if(crossSectionCanvas.storage.terrainObj != null){
    window['toggleTerrain'](crossSectionCanvas)
  }

  await window['toggleMap'](crossSectionCanvas)
  
  zoomTop(viewer3d);

  spinner.style.visibility = "hidden";
}

export async function open3d(crossSectionCanvas, buttonElem) {
  const shouldShow3d = ! crossSectionCanvas?.storage?.isShowing3d;
  const shouldShowPlan = crossSectionCanvas?.storage?.isShowingPlan;

  if (! shouldShow3d && !shouldShowPlan) {
    return;
  }

  crossSectionCanvas.initializePropertyGrid(true, true);

  const spinner = crossSectionCanvas.storage.rootElem?.querySelector('.loading3D');
  spinner.style.visibility = "visible";
  void(spinner.offsetHeight);
  await sleep(10);

  const mainElem = crossSectionCanvas.storage.rootElem.querySelector(".view3d");
  const rootElem = mainElem.querySelector(".container3d");
  const canvasWindowElem =
    crossSectionCanvas.storage.rootElem.querySelector(".windowContainer");
  const svgElem =
    crossSectionCanvas.storage.rootElem.querySelector(".svgWindow");

  // dispose all three.js instances
  // https://stackoverflow.com/questions/55131538/three-js-how-to-correctly-dispose-a-scene-in-memory/55184487
  dispose(crossSectionCanvas.storage.viewer3d);

  const removeCurrentChosen = () => {
    let listImages = document.getElementsByClassName('listItemThreeD');

    for(let i = 0; i < listImages.length; i++ ){
        listImages[i].classList.remove('chosenThreeD');
    }
}


const handleIconClick3D = async (iconType) => {
  removeCurrentChosen();

  if(crossSectionCanvas.storage.terrainObj && iconType === 'None')
    await window['toggleTerrain'](crossSectionCanvas);
  else {

    switch(iconType) {
      case 'StreetMap':
        crossSectionCanvas.storage.terrainSettings.terrain = 'Street Map';
        break;
      case 'Terrain':
        crossSectionCanvas.storage.terrainSettings.terrain = 'Street Map (with contours)'
        break;
      case 'Satellite':
        crossSectionCanvas.storage.terrainSettings.terrain = 'Satellite'
        break;
      case 'Wireframe':
        crossSectionCanvas.storage.terrainSettings.terrain = 'Wireframe'
        break;
      case 'SolidContours':
        crossSectionCanvas.storage.terrainSettings.terrain = 'Solid Contours'
        break;
      default: break;
    }
    

    if(crossSectionCanvas.storage.terrainObj){
      await window['addTerrain'](crossSectionCanvas);
    } else {
      await window['toggleTerrain'](crossSectionCanvas)
    }
  }  

  //update source of display image
  const displayIcon = document.getElementById('ThreeDDisplayIcon');
  const clickedIcon = document.getElementById(iconType);

  // @ts-ignore
  displayIcon.src = clickedIcon?.src;
  // @ts-ignore
  displayIcon.title = clickedIcon?.title;

  //add new chosen item
  document.getElementById(iconType)?.classList.add('chosenThreeD');
}

window['handleIconClick3D'] = handleIconClick3D;

  rootElem.innerHTML = `
  <div class="topLeftCorner">
    <div class="canvasTooltip terrainTooltip hidden" style="background-color: rgba(255,255,255,0.8); border-radius: 5px;">
      <span style="color: #8b0000">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Hold Shift and drag the terrain to move it vertically. Hold Alt and drag to move it horizontally.
      </span>
    </div>
    
    <div class="canvasTooltip terrainToolTip moveTerrainImage " style="width: 20%; height: 20%; opacity: 0.6; margin-left: 2%; display: none"></div>
  </div>
  
  <div class="bottomRightCorner">
    <div class="contourLine" style="background-color: rgba(255,255,255,0.8); margin-right: 5px; padding: 5px; border-radius: 5px; font-size: 14px; display: none; line-height: normal">
      
    </div>
    <div class="cameraType" style="background-color: rgba(255,255,255,0.8); display: inline-block; padding: 5px; border-radius: 5px; font-size: 14px; line-height: normal">
      Perspective
    </div>
  </div>
  
  <div class="btnThreeD topRightCornerUnderCube">
    <span class="listItemContainerThreeD ThreeDDisplayIcon"><img id="ThreeDDisplayIcon" src="./Hatch_Files/PNG/Texture/PlanMode_off.png" title="No Terrain"/></span>
    <ul class="ThreeDList">
      <li class="listItemContainerThreeD" onclick="handleIconClick3D('StreetMap')"><img class="listItemThreeD" src="./Hatch_Files/PNG/Texture/PlanMode_map.png" id="StreetMap" title="Street Map"/></li>
      
      <li class="listItemContainerThreeD" onclick="handleIconClick3D('None')"><img class="listItemThreeD chosenThreeD" src="./Hatch_Files/PNG/Texture/PlanMode_off.png" id="None" title="No Terrain"/></li>
      
      <li class="listItemContainerThreeD" onclick="handleIconClick3D('Satellite')"><img class="listItemThreeD" src="./Hatch_Files/PNG/Texture/PlanMode_sat.png"  id = "Satellite" title="Satellite"/></li>

      <li class="listItemContainerThreeD" onclick="handleIconClick3D('Terrain')"><img class="listItemThreeD" src="./Hatch_Files/PNG/Texture/PlanMode_terrain.png" id="Terrain" title="Street Map (with contours)"/></li>  
      
      <li class="listItemContainerThreeD" onclick="handleIconClick3D('Wireframe')"><img class="listItemThreeD" src="./Hatch_Files/PNG/Texture/Wireframe.png" id="Wireframe" title="Wireframe"/></li>  

      <li class="listItemContainerThreeD" onclick="handleIconClick3D('SolidContours')"><img class="listItemThreeD" src="./Hatch_Files/PNG/Texture/PlanMode_SolidContours.png" id="SolidContours" title="Solid Contours"/></li>  
    </ul>
  </div>
  `;

  const jsonData = getJsonData(crossSectionCanvas);
  const options = await get3dOptions(crossSectionCanvas);
  await window['updateMaterialsDict']();
  options.materialsDict = await materialsDictPromise;

  const viewer3d = await $(rootElem).threeViewer(jsonData, options);
  crossSectionCanvas.storage.viewer3d = viewer3d;
  const { renderer, scene, minRealCoordinates, controls, keyControls, fxaaPass, composer, camera} = viewer3d;

  controls.enableRotate = true;

  showOtherCrossSections(crossSectionCanvas, scene, minRealCoordinates, options);
  showOtherTestHoles(crossSectionCanvas, scene, minRealCoordinates, options);

  if(crossSectionCanvas.storage.gridFontSize)
    viewer.addGrid(scene, minRealCoordinates, options, true, crossSectionCanvas.storage.gridFontSize*10);
  else
    viewer.addGrid(scene, minRealCoordinates, options, true);

  if (crossSectionCanvas.storage.isShowingTerrain) {
    await window['addTerrain'](crossSectionCanvas);
  }
  updateOutlinedObjects(viewer3d);

  viewer3d.textObjs = viewer.getAllTextObjs(scene);
  viewer3d.rotateGridText = true;
  // scene.add(new window['THREE'].AxesHelper(100));


  const canvasWidth = svgElem.getAttribute("width");
  const canvasHeight = svgElem.getAttribute("height");
  renderer.setSize(canvasWidth, canvasHeight);
  composer.setSize(canvasWidth, canvasHeight);
  if (fxaaPass) {
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( canvasWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( canvasHeight * pixelRatio );
  }

  if(!crossSectionCanvas.storage.isShowing3d){
    flipElemVisibility(mainElem);
    flipElemVisibility(canvasWindowElem);
  }

  buttonsThatOnlyShowOn3DSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "initial";
  })

  buttonsThatOnlyShowOnPlanSelectors.forEach(selector => {
    const btn = crossSectionCanvas.storage.rootElem?.querySelector(selector);
    if (! btn) {
      return;
    }
    btn.style.display = "none";
  })

  hideSeparatorOnPlan.forEach(separator => {
    const s = crossSectionCanvas.storage.rootElem?.querySelector(separator);
    if(!s){
      return
    }
    s.style.display = 'none'
  })

  const buttons = getElemFromSelectorArray(crossSectionCanvas.storage.rootElem, buttonsThatOnlyShowOn2DSelectors)
  buttons.forEach(button => {
    button?.classList.add('invisible');
  })
  const gridButton = crossSectionCanvas.storage.rootElem.querySelector(".toggleGridButton");
  if (crossSectionCanvas.storage.ShowGridlines_3D) {
      crossSectionCanvas.enableButton(gridButton);
  }
  else {
      crossSectionCanvas.disableButton(gridButton);
      // initial state has grid, we have to turn it off
      viewer.toggleGrids(scene, false);
  }

  crossSectionCanvas.storage.isShowing3d = true;
  crossSectionCanvas.storage.isShowingPlan = false;

  const panelElem = crossSectionCanvas?.storage?.rootElem?.querySelector("#propertyGrid");
  if (panelElem) {
    panelElem.classList.add(propertyGridShowing3dClass);
  }

  removeBoreholesWithSameName(scene);
  // perspective camera is the default
  // if orthographic is chosen, use orthographic
  // if not, don't do anything
  if (! crossSectionCanvas.storage.isPerspectiveCamera) {
    switchCameraToPerspective(false);
    crossSectionCanvas.storage.isPerspectiveCamera = true;
  }

  setScale(viewer3d, crossSectionCanvas.storage.AX, crossSectionCanvas.storage.AY, crossSectionCanvas.storage.HatchScale, crossSectionCanvas);
  zoomAll(viewer3d);
  viewer3d.textObjs = viewer.getAllTextObjs(scene);
  viewer3d.toBeRotated = viewer.getAllWithName(scene, 'toBeRotated');

  const worldAxis = crossSectionCanvas.storage.rootElem?.querySelector('.worldAxis');
  const viewCube = crossSectionCanvas.storage.rootElem?.querySelector('.viewCube');
  worldAxis.style.display = 'block';
  viewCube.style.display = 'block';

  setPanLeftClick(controls, camera, crossSectionCanvas.storage.isInPanMode);
  camera.originalZoom = camera.zoom;

  //Remove map when switching to different view
  if(crossSectionCanvas.storage.mapObj != null){
    window['toggleMap'](crossSectionCanvas)
  }

  spinner.style.visibility = "hidden";
}

function showOtherCrossSections(crossSectionObj, scene, sceneMinRealCoordinates, options=jsonTo3d.defaultOptions) {
  if (! crossSectionObj || ! scene || sceneMinRealCoordinates == null) {
    return;
  }
  const crossSectionsToShow = crossSectionObj.storage?.otherCrossSectionsOption;
  const allData = crossSectionObj.storage?.otherCrossSectionsData;
  if (! allData) {
    return;
  }

  allData.forEach(data => {
    if (! data.mesh) {
      return;
    }
    data.mesh.removeFromParent();
    viewer.disposeMesh(data.mesh);
    data.mesh = null;
  })

  const dataArr = allData.filter(data => crossSectionsToShow.includes(data.title));

  dataArr?.forEach(crossSection => {
    if (! crossSection.data) {
      return null;
    }
    const meshes = jsonTo3d.crossSectionTo3dFromData(crossSection.data, options)
    if(! meshes) {
      return;
    }

    const group = new window['THREE'].Group();
    meshes.forEach(mesh => {
        group.add(mesh);
    })

    crossSection.mesh = group;
    scene.add(group);

    positionChildrenInsideMesh(group, sceneMinRealCoordinates);
    if (crossSectionObj.storage.positionMeshAddedAsSceneChildAfterTerrain) {
      crossSectionObj.storage.positionMeshAddedAsSceneChildAfterTerrain(group);
    }
 })
  removeBoreholesWithSameName(scene);
}

function showOtherTestHoles(crossSectionObj, scene, sceneMinRealCoordinates, options=jsonTo3d.defaultOptions) {
  if (! crossSectionObj || ! scene || sceneMinRealCoordinates == null) {
    return;
  }
  const testholesToShow = crossSectionObj.storage?.otherTestHolesOption;
  const allData = crossSectionObj.storage?.otherTestHolesData;
  if (! allData) {
    return;
  }

  if (crossSectionObj.storage.testHolesMeshes) {
    crossSectionObj.storage.testHolesMeshes.forEach(mesh => {
      if (! mesh) {
        return;
      }
      mesh.removeFromParent();
      viewer.disposeMesh(mesh);
    })
    crossSectionObj.storage.testHolesMeshes = null;
  }

  const dataArr = allData.filter(data => testholesToShow.includes(data.th_title));

  const meshes = dataArr.map(boreholeData => {
    const boreholeMesh = jsonTo3d.boreholeTo3dFromData(boreholeData, options);
    return boreholeMesh;
  })

  const group = new window['THREE'].Group();
    meshes.forEach(mesh => {
      if (! mesh) {
        return;
      }
      group.add(mesh);
  })


  crossSectionObj.storage.testHolesMeshes = [group];
  
  scene.add(group);
  removeBoreholesWithSameName(scene);
  positionChildrenInsideMesh(group, sceneMinRealCoordinates);
  if (crossSectionObj.storage.positionMeshAddedAsSceneChildAfterTerrain) {
    crossSectionObj.storage.positionMeshAddedAsSceneChildAfterTerrain(group);
  }
}

// assuming mesh is positioned in its real coordinates
function positionMeshInScene(mesh, sceneMinRealCoordinates) {
  if (! mesh || sceneMinRealCoordinates == null) {
    return;
  }
  const [minX, minY, minZ] = sceneMinRealCoordinates;
  const [x, y, z] = mesh.position.toArray();
  mesh.position.set(x - minX, y, z - minZ);
}

function positionChildrenInsideMesh(mesh, sceneMinRealCoordinates) {
  if (! mesh || sceneMinRealCoordinates == null) {
    return;
  }
  const [minX, minY, minZ] = sceneMinRealCoordinates;
  const [x, y, z] = mesh.position.toArray();
  mesh.children?.forEach(child => {
    if (! child?.position) {
      return;
    }
    const [x, y, z] = child.position?.toArray().map(x => parseFloat(x ?? 0));
    child.position.set(x - minX, y, z - minZ);
  })
  mesh.position.set(0, 0, 0);
}

async function generate3dScene(crossSectionCanvas) {
  const jsonData = getJsonData(crossSectionCanvas);
  const options = await get3dOptions(crossSectionCanvas);
  
  const {mesh, minRealCoordinates} = await jsonTo3d.jsonToMesh(jsonData, options);
  const scene = jsonTo3d.initialize3d();
  scene.add(mesh);
  return {
    scene : scene,
    minRealCoordinates : minRealCoordinates
  };
}

async function generateMeshesWithoutMoving(crossSectionCanvas) {
  const jsonData = getJsonData(crossSectionCanvas);
  const options = await get3dOptions(crossSectionCanvas);
  
  const meshes = await jsonTo3d.crossSectionTo3dFromData(jsonData, options);
  const group = new window['THREE'].Group();
  meshes.forEach(mesh => {
      group.add(mesh);
  })
  return {
    scene : group
  }
}

async function getScene(crossSectionCanvas) {
  let scene = crossSectionCanvas.storage.viewer3d?.scene;
  let minRealCoordinates = crossSectionCanvas.storage.viewer3d?.minRealCoordinates;
  if ( ! scene ) {
    const result = await generate3dScene(crossSectionCanvas);
    ({scene, minRealCoordinates} = result);
  }
  return {
    scene : scene,
    minRealCoordinates : minRealCoordinates
  }
}

async function exportToGLTF(crossSectionCanvas) {
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Exporting to GLTF ...';
  label.style.display = 'inline-block';
  
  const { scene, minRealCoordinates} = await getScene(crossSectionCanvas);
  const sceneClone = scene.clone();
  viewer.removeGrids(sceneClone);
  await jsonTo3d.exportToGLTF(sceneClone, crossSectionCanvas.getTitle() ?? 'scene');

  spinner.style.display = 'none';
  label.style.display = 'none';
}

async function exportToSTL(crossSectionCanvas) {
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Exporting to STL ...';
  label.style.display = 'inline-block';
  
  const { scene, minRealCoordinates} = await getScene(crossSectionCanvas);
  const sceneClone = scene.clone();
  viewer.removeGrids(sceneClone);

  sceneClone.rotation.set(Math.PI / 2, 0, 0)
  sceneClone.updateMatrixWorld();

  await jsonTo3d.exportToSTL(sceneClone, crossSectionCanvas.getTitle() ?? 'scene');

  spinner.style.display = 'none';
  label.style.display = 'none';
}

async function exportToOBJ(crossSectionCanvas) {
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Exporting to OBJ ...';
  label.style.display = 'inline-block';
  
  const { scene, minRealCoordinates} = await getScene(crossSectionCanvas);
  const sceneClone = scene.clone();
  viewer.removeGrids(sceneClone);
  sceneClone.updateMatrixWorld();

  await jsonTo3d.exportToOBJ(sceneClone, crossSectionCanvas.getTitle() ?? 'scene');

  spinner.style.display = 'none';
  label.style.display = 'none';
}

async function exportToCollada(crossSectionCanvas) {
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Exporting to OBJ ...';
  label.style.display = 'inline-block';
  
  const { scene, minRealCoordinates} = await getScene(crossSectionCanvas);
  const sceneClone = scene.clone();
  viewer.removeGrids(sceneClone);
  sceneClone.updateMatrixWorld();

  await jsonTo3d.exportToCollada(sceneClone, crossSectionCanvas.getTitle() ?? 'scene');

  spinner.style.display = 'none';
  label.style.display = 'none';
}

[open2d, open3d, openPlan, exportToGLTF, exportToSTL, exportToOBJ, exportToCollada, update3dViewerSize, showOtherCrossSections, showOtherTestHoles, get3dOptions, zoomAll, zoomIn, zoomOut, zoomTop, toggleGrids, dispose, addGrid, setPanLeftClick, switchCameraToPerspective, setScale, get3DPolygonPoints, generateMeshesWithoutMoving, disposeMesh, updateLineStyleScale, updateLineThickness, updateMaterialsDict, changeGridTextSize, toggleGridOutline, changeAxisLabel].forEach(fn => {
  window[fn.name] = fn;
})
window['getAllWithName'] = viewer.getAllWithName;