import * as THREE from "./node_modules/three/build/three.module.js";
import * as OrbitControls from './lib/three-controls/OrbitControls.js';
import { supportBoltTo3dFromRocplaneData, defaultOptions, wedgeSettingsToOptions, isRocPlaneData, textTo3d, textGenerator, textTo3dWithBackground, defaultTextWithBackgroundOptions} from "./json_to_3d.js";
import {radToDeg, degToRad, floatsEqual, floatsLess, eps} from "./helperFunctions.js";
import { InfiniteGridHelper } from "./lib/three-infinitegridhelper/InfiniteGridHelper.js"
import { EffectComposer } from './lib/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/postprocessing/RenderPass.js';
import { SSAARenderPass } from './lib/postprocessing/SSAARenderPass.js';
import { ShaderPass } from './lib/postprocessing/ShaderPass.js';
import { CopyShader } from './lib/shaders/CopyShader.js';
import { FXAAShader } from './lib/shaders/FXAAShader.js';
import { OutlinePass } from './lib/postprocessing/OutlinePass.js';
import * as TWEEN from '../../tween.esm.js';
import { Line2 } from './lib/lines/Line2.js';
import { LineMaterial } from './lib/lines/LineMaterial.js';
import { LineGeometry } from './lib/lines/LineGeometry.js';

export function getAllWithName(scene, name) {
    const textObjs = [];
    scene.traverse(obj => {
        // const cond = obj?.geometry?.type == 'TextGeometry';
        const cond = obj?.name?.includes(name);
        if (cond) {
            textObjs.push(obj);
        }
    })
    return textObjs;
}

export function getAllTextObjs(scene) {
    return getAllWithName(scene, 'text');
}

export function textsLookAtCamera(textObjs, camera) {
    textObjs.forEach(textObj => {
        textObj.lookAt(camera.position);
    })
}

// function getSceneCenter(scene) {
//     const vectorSum = scene.children.reduce((prev, current) => {
//         return prev.add(current.position);
//     }, new THREE.Vector3(0, 0, 0));
//     const mean = vectorSum.divideScalar(scene.children.length);
//     return mean;
// }

function onMouseMoveGenerator(mouse) {
    function onMouseMove(event) {

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }
    return onMouseMove;
}


function addSupportBoltAtPoint(location : [number, number], angle : number, rocPlaneData, scene, options=defaultOptions) {
    const supportBolt = {
        location: location,
        // vector: [number, number],
        angle: angle,
        isActive: true,
        opacity: 1,
        color: "#444433",
        value: '',
        length: 100
    }
    const mesh = supportBoltTo3dFromRocplaneData(supportBolt, rocPlaneData, options);
    scene.add(mesh)
    return {
        supportBolt: supportBolt,
        supportBoltMesh: mesh
    }
}

// verifies if the object or any ancestor has a string in their name
// if yes, returns the object with the name
function ancestorWithName (threeObject, name) {
    let current = threeObject;
    while (current != null) {
        if (current?.name?.includes(name)) {
            return current;
        }
        current = current.parent;
    }
    return null;
}

function isWedge(threeObject) {
    return ancestorWithName(threeObject, 'Wedge') != null;
}

const rocPlaneObjectTypes = [
    'Wedge',
    'Base',
    'Ponding_Water',
    'SupportBolt',
    'Contact_Water',
    'Forces',
    'Seismic'
];

function getRocplaneObjectJsonData(objectType, rocPlaneData, objectId=-1) {
    if (!rocPlaneData || ! objectType) {
        return {};
    }
    let typeJsons = [];
    if (objectType == 'SupportBolt') {
        typeJsons = rocPlaneData.Support?.Bolt ?? [];
    }
    else {
        typeJsons = rocPlaneData[objectType] ?? [];
        if (! Array.isArray(typeJsons)) {
            typeJsons = [typeJsons];
        }
    }

    if (!typeJsons || typeJsons.length == 0) {
        return {};
    }
    let obj = {};
    if (objectId != -1) {
        obj = typeJsons.find(jsonData => parseInt(jsonData.id ?? -1) == objectId)
    }
    else {
        obj = typeJsons[0];
    }
    return obj;
}

function getGroupOfRocplaneObject(threeObject) {
    for (let rocplaneType of rocPlaneObjectTypes) {
        let ancestor = ancestorWithName(threeObject, rocplaneType);
        if (ancestor) {
            return ancestor;
        }
    }
    return null;
}

function rocplaneNameToType(rocplaneName) {
    for (let rocplaneType of rocPlaneObjectTypes) {
        if (rocplaneName.includes(rocplaneType)) {
            return rocplaneType;
        }
    }
    return '';
}

function rocplaneNameToId(rocplaneName) {
    const match = rocplaneName.match(/id[0-9]+/gi);
    if (! match || match.length <= 0) {
        return -1;
    }
    const id = match[0].replace('id', '');
    return id;
}

const objectClickedEventName = 'click'
// if intersects with any object, dispatches a event' event
export function onClickGenerator(viewer3d, rocPlaneData, options=defaultOptions) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(event) {
        const {renderer, camera, scene} = viewer3d;
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ( (event.clientX - rect.left) / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -( (event.clientY - rect.top) / renderer.domElement.clientHeight) * 2 + 1;
    
        raycaster.setFromCamera(mouse, camera);
        raycaster.near = 0;
        raycaster.far = 99999;
        
        const objects = scene.children;
        const recursive = true;
        const intersects = raycaster.intersectObjects( objects, recursive);
        if (! intersects || intersects.length <= 0) {
            return;
        }

        const firstIntersected = intersects[0];
        const object = firstIntersected.object;
        // if you click the edge of the base, I want the base, not the edge lines.
        const objectGroup = getGroupOfRocplaneObject(object);
        const objectName = objectGroup?.name ?? '';
        const objectType = rocplaneNameToType(objectName);
        const objectId = rocplaneNameToId(objectType);
        const objectJsonData = getRocplaneObjectJsonData(objectType, rocPlaneData, objectId);
        const info = 'info' in objectJsonData ? objectJsonData['info'] : '';

        const objectInformation = {
            object: objectGroup,
            type: objectType,
            info: info,
            jsonData: objectJsonData,
            intersectionInformation: intersects[0]
        };
        if (objectId != -1) {
            objectInformation['id'] = objectId;
        }

        const objectsClickedEvent = new CustomEvent(objectClickedEventName, {
            detail : {
                objectClicked: objectInformation,
                onClickEvent : event,
                raycaster : raycaster,
                intersects : intersects,
            }
        })
        renderer.domElement.dispatchEvent(objectsClickedEvent);
    }
    return onClick;
}

// if intersects with any object, dispatches a event' event
const objectRightClickName = "objectRightClicked";
export function onRightClickGenerator(viewer3d) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
  
    function callback(event) {
    const {renderer, camera, scene} = viewer3d;
      event.preventDefault();
      event.stopPropagation();
  
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ( (event.clientX - rect.left) / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -( (event.clientY - rect.top) / renderer.domElement.clientHeight) * 2 + 1;
  
      raycaster.setFromCamera(mouse, camera);
      raycaster.near = 0;
      raycaster.far = 99999;
      
      const objects = scene.children ?? [];
      const recursive = true;
  
      const intersects = raycaster.intersectObjects(objects, recursive);
      
      if (!intersects || intersects.length <= 0) {
        return;
      }
  
      const objectsRightClickedEvent = new CustomEvent(objectRightClickName, {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        },
      });
      
      renderer.domElement.dispatchEvent(objectsRightClickedEvent);
    }
  
    return callback;
  }

const supportBoltAddedVisuallyEventName = 'supportBoltAddedVisually'
export function onClickAddSupportBoltGenerator(viewer3d, rocPlaneData, options=defaultOptions) {
    function on3dObjectsClicked(event) {
        const {renderer, camera, scene} = viewer3d;
        // this references the function itself
        // 'this' doesn't work and I wasn't going to change the entire code to a class
        // just for this one feature
        if (! on3dObjectsClicked.nextClickAddsSupportBolt) {
            return;
        }
        if (event.detail.objectClicked.type != 'Wedge') {
            return;
        }
        const intersectionInformation = event.detail.objectClicked.intersectionInformation;

        if (! intersectionInformation.face) {
            return;
        }
        const faceNormal = intersectionInformation.face.normal;
        const isSideFace = floatsEqual(faceNormal.x, 0);
        const isLowerFace = floatsLess(faceNormal.y, 0);
        if (isSideFace || isLowerFace) {
            return;
        }

        const directionVector = intersectionInformation.face.normal;
        const baseVector = new THREE.Vector3(1, 0, 0);
        const rad = baseVector.angleTo(directionVector);
        const angle = radToDeg(rad);
        const [x, y, z] = intersectionInformation.point.toArray();
        const location = [x, y] as [number, number];

        const settingsData = rocPlaneData.Settings;
        const newOptions = wedgeSettingsToOptions(settingsData, options);
        const result = addSupportBoltAtPoint(location, angle, rocPlaneData, scene, newOptions)

        const customEvent = new CustomEvent(supportBoltAddedVisuallyEventName, {
            detail : {
                objectClickedEvent: event,
                ...result
            }
        })
        renderer.domElement.dispatchEvent(customEvent);
    }
    on3dObjectsClicked.nextClickAddsSupportBolt = false;
    return on3dObjectsClicked;
}

export function initializeEventListeners(viewer3d, rocPlaneData, options=defaultOptions) {
    const {renderer, camera, scene} = viewer3d;
    const onClick = onClickGenerator(viewer3d, rocPlaneData, options);
    renderer.domElement.addEventListener('click', onClick);

    const onRightClick = onRightClickGenerator(viewer3d);
    
    renderer.domElement.addEventListener("contextmenu", onRightClick);

    renderer.domElement.addEventListener(objectRightClickName, (event) => {
        console.log(event);
    });

    const onClickAddSupportBolt = onClickAddSupportBoltGenerator(viewer3d, rocPlaneData, options);
    if (isRocPlaneData(rocPlaneData)) {
        renderer.domElement.addEventListener(objectClickedEventName, (event) => {
            if (! onClickAddSupportBolt.nextClickAddsSupportBolt) {
                return;
            }
            onClickAddSupportBolt(event)
        })
        renderer.domElement.addEventListener(objectClickedEventName, (event) => {
            console.log(`Clicked object info: "${event.detail.objectClicked.info}"`)
        })
        renderer.domElement.addEventListener(supportBoltAddedVisuallyEventName, (event) => {
            onClickAddSupportBolt.nextClickAddsSupportBolt = false;
        })
    }
    return {
        onClickAddSupportBolt : onClickAddSupportBolt
    }
}

// works like rotating your head
// number is the axis
// 1 is x
// 2 is y
// 3 is z
// -1 is -x
export function lookToAxis(controls, number : number) {
    const axis = Math.abs(number);
    const direction = Math.sign(number);
    let newTarget = [0, 0, 0];
    newTarget[axis - 1] = direction * 100;
    let lookAt = new THREE.Vector3(...newTarget);

    const camera = controls.object;
    lookAt = lookAt.add(camera.position);

    // camera.lookAt(lookAt);
    // console.log(camera.rotation)
    // controls.update();
    controls.target.set(...lookAt.toArray());
}

// works like circling around an object
export function viewFromAxis(controls, number : number) {
    const axis = Math.abs(number);
    const direction = Math.sign(number);

    const camera = controls.object;

    const distanceToTarget = camera.position.distanceTo(controls.target);
    const newCameraPosition = controls.target.toArray();

    newCameraPosition[axis] = newCameraPosition[axis] + distanceToTarget * direction;
    const coords = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
    new TWEEN.Tween(coords)
    .to({x: newCameraPosition[0], y: newCameraPosition[1], z: newCameraPosition[2]})
    .onUpdate(() => {
        return camera.position.set(coords.x, coords.y, coords.z)
    })
    .start();
}


// works like circling around an object
export function viewTop(controls) {
    const axisNum = 1;
    const axis = Math.abs(axisNum);
    const direction = Math.sign(axisNum);
    const camera = controls.object;
    const distanceToTarget = camera.position.distanceTo(controls.target);
    const newCameraPosition = controls.target.toArray();
    newCameraPosition[axis] = newCameraPosition[axis] + distanceToTarget * direction;
    camera.position.set(...newCameraPosition);
}

// https://stackoverflow.com/questions/45860183/threejs-2d-bounding-box-of-3d-object/45879073#45879073
function computeScreenSpaceBoundingBox(obj, camera) {
    var min;
    var max;

    // Is this an array of objects?
    if(Array.isArray(obj)) {
        for(var i = 0; i < obj.length; ++i) {
            let box2 = computeScreenSpaceBoundingBox(obj[i], camera);
            if(min === undefined) {
                min = box2.min.clone();
                max = box2.max.clone();
            } else {
                min.min(box2.min);
                max.max(box2.max);
            }
        }
    }

    // Does this object have geometry?
    if(obj.geometry !== undefined) {
        var vertices = obj.geometry.vertices;
        if(vertices === undefined
            && obj.geometry.attributes !== undefined
            && 'position' in obj.geometry.attributes) {
            // Buffered geometry
            var vertex = new THREE.Vector3();       
            var pos = obj.geometry.attributes.position;
            for(var i = 0; i < pos.count * pos.itemSize; i += pos.itemSize)
            {
                vertex.set(pos.array[i], pos.array[i + 1], pos.array[1 + 2]);
                var vertexWorldCoord = vertex.applyMatrix4(obj.matrixWorld);
                var vertexScreenSpace = vertexWorldCoord.project(camera);
                if(min === undefined) {
                    min = vertexScreenSpace.clone();
                    max = vertexScreenSpace.clone();
                }
                min.min(vertexScreenSpace);
                max.max(vertexScreenSpace);
            }
        } else {
            // Regular geometry
            var vertex = new THREE.Vector3();       
            for(var i = 0; i < vertices.length; ++i) {
                var vertexWorldCoord = vertex.copy(vertices[i]).applyMatrix4(obj.matrixWorld);
                var vertexScreenSpace = vertexWorldCoord.project(camera);
                if(min === undefined) {
                    min = vertexScreenSpace.clone();
                    max = vertexScreenSpace.clone();
                }
                min.min(vertexScreenSpace);
                max.max(vertexScreenSpace);
            }
        }
    }
    
    // Does this object have children?
    if(obj.children !== undefined) {
        for(var i = 0; i < obj.children.length; ++i) {
            let box2 = computeScreenSpaceBoundingBox(obj.children[i], camera);
            if(min === undefined) {
                min = box2.min.clone();
                max = box2.max.clone();
            } else {
                min.min(box2.min);
                max.max(box2.max);
            }
        }
    }
    
    return new THREE.Box2(min, max);
}

export function zoomTop(scene, controls, renderer, fitOffset = 1) {
    if (!scene || !controls) {
        return;
    }

    const camera = controls.object;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxSize = Math.max(size.x, size.y, size.z);

    let maxRadius = -1;

    const map = scene.children.filter(s => s.name === 'map')[0];
    const grid = scene.children.filter(s => s.name === 'Grid')[0];

    if(map) {
        maxRadius = map.geometry.boundingSphere.radius;
    } else if (grid) {
        maxRadius = grid.children[0].children[0].geometry?.boundingSphere?.radius ?? -1;
    }

    if(maxRadius === -1)
        maxRadius = maxSize;

    const desiredSize = maxRadius*1.2;

    const newZoom = Math.min(renderer.domElement.width, renderer.domElement.height) / desiredSize;
    if (newZoom <= 0) {
        return;
    }

    camera.zoom = newZoom;
    viewTop(controls);
    camera.updateProjectionMatrix();
    controls.update();
}

// https://discourse.threejs.org/t/camera-zoom-to-fit-object/936/23
export function zoomAll(scene, controls, renderer, fitOffset = 1.05, isPlan = false) {
    if (! scene || ! controls) {
        return;
    }


    const camera = controls.object;
    const aspect = camera.aspect;
    const fov = camera.fov; 
    
    const box = new THREE.Box3().setFromObject(scene);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // cube diagonal
    // const maxSize = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z )
    const maxSize = Math.max(size.x, size.y, size.z);

    if (camera.type == 'OrthographicCamera') {
        let desiredSize = maxSize*fitOffset;

        if(isPlan) {
            let maxRadius = -1;

            const map = scene.children.filter(s => s.name === 'map')[0];
            const grid = scene.children.filter(s => s.name === 'Grid')[0];

            if(map) {
                maxRadius = map.geometry.boundingSphere.radius;
            } else if (grid) {
                maxRadius = grid.children[0].children[0]?.geometry?.boundingSphere?.radius ?? -1;
            }

            if(maxRadius === -1)
                return;

            desiredSize = maxRadius*1.2;
        }

        const newZoom = Math.min(renderer.domElement.width, renderer.domElement.height) / desiredSize;
        if (newZoom <= 0) {
            return;
        }
        camera.zoom = newZoom;
        camera.updateProjectionMatrix();
        controls.update();
        return;
    }

    const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
    
    const direction = controls.target.clone()
      .sub(camera.position)
      .normalize()
      .multiplyScalar(distance);
  
    controls.maxDistance = distance * 10;
    controls.target.copy(center);
    
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
  
    camera.position.copy(controls.target).sub(direction);
    
    controls.update();
    
    controls.target.set(...center.toArray());
}

function removeFrustumCulled(scene) {
    scene.traverse(obj => {
        obj.frustumCulled = false;
    })
}

function coordinateToText (coordinate) {
    if (coordinate == null) {
        return '';
    }
    return coordinate.toLocaleString('en-us', {maximumFractionDigits : 0})
}

function generateGridWithTexts(xSize, zSize, divisions, realCenterCoordinates : [number, number, number], options, size = 100, is3D = true) {
    if (xSize <= 0 || zSize <= 0 || divisions <= 0 || ! options.font) {
        return;
    }

    const [x, y, z] = realCenterCoordinates;
    const textOffsetToGrid = size/30;
    const xOffsets = [];
    let xNumberOfDivisions = Math.round(xSize / divisions);
    let zNumberOfDivisions = Math.round(zSize / divisions);
    for (let i=0; i < xNumberOfDivisions + 1; i += 1) {
        const offset = i * divisions;
        xOffsets.push(offset);
    }
    const zOffsets = [];
    for (let i=0; i < zNumberOfDivisions + 1; i += 1) {
        const offset = i * divisions;
        zOffsets.push(offset);
    }

    const xAxis = xOffsets.map(offset => {
        const realXCoordinate = x - xSize/2 + offset;
        const position = [-xSize/2 + offset, 0, - zSize/2];
        const textPosition = [-xSize/2 + offset, 0, + zSize/2 + textOffsetToGrid];
        return {
            position: position,
            textPosition: textPosition,
            // realCoordinate : [realXCoordinate, y, z - size/2],
            text: coordinateToText(realXCoordinate),
            axis: 'X'
        }
    });
    const zAxis = zOffsets.map(offset => {
        const realZCoordinate = -z - zSize/2 + offset;
        const position = [-xSize/2, 0, -zSize/2 + offset];
        const textPosition = [-xSize/2 - textOffsetToGrid, 0, +zSize/2 - offset];
        return {
            position: position,
            textPosition: textPosition,
            // realCoordinate : [x - size/2, y, realZCoordinate],
            text: coordinateToText(realZCoordinate),
            axis: 'Y'
        }
    })
    const dicts = [...xAxis, ...zAxis];
    
    const vertices = [];
    xAxis.forEach(dict => {
        const p1 = [...dict.position];
        const p2 = [...dict.position];
        p2[2] = p2[2] + zSize;
        vertices.push(...[...p1, ...p2]);
    });
    zAxis.forEach(dict => {
        const p1 = [...dict.position];
        const p2 = [...dict.position];
        p2[0] = p2[0] + xSize;
        vertices.push(...[...p1, ...p2]);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    const material = new THREE.LineBasicMaterial( { vertexColors: true, toneMapped: false } );
    material.transparent = true;
    material.opacity = 0.5;
    material.depthWrite = false;
    const gridMesh = new THREE.LineSegments(geometry, material);

    //https://threejs.org/examples/webgl_lines_fat.html
    let outlineMeshGroup = new THREE.Group();
    outlineMeshGroup.name = 'OutlineMesh';

    if(!is3D){
        let outlineMeshArr = [];

        for(let i = 3; i < vertices.length-1; i+=3){
            let p1 = {
                x: vertices[i - 3],
                y: vertices[i - 2],
                z: vertices[i-  1],
            }
            let p2 = {
                x: vertices[i],
                y: vertices[i+1],
                z: vertices[i+2]
            }           
    
            if( p1.x !== p2.x && p1.z !== p2.z)
                continue;
            
            outlineMeshArr.push({p1, p2})
        }
    
        outlineMeshArr.forEach(points => {
            const outlineGeo = new LineGeometry();
            outlineGeo.setPositions([points.p1.x, points.p1.y, points.p1.z, points.p2.x, points.p2.y, points.p2.z]);
            let linewidth = 0.003;

            if(points.p1.x === points.p2.x)
                linewidth = linewidth/2;

            const outlineMat = new LineMaterial({ 
                color: 0xffffff, 
                linewidth: linewidth
            });
            const gridMeshOutline = new Line2(outlineGeo, outlineMat);
            outlineMeshGroup.add(gridMeshOutline);
        })
    }

    // gridMeshOutline.scale.multiplyScalar(1.5);

    const useTroikaLib = ! is3D;
    const useOutline = ! is3D;
    let generateText = textGenerator(options, 0x000000, useTroikaLib, useOutline);

    //THIS BREAKS TEXT RESIZING IN 3D
    //May need to change planeHeight and positioning in textTo3dWithbackground

    const textMeshes = dicts.map(dict => {
        const mesh = generateText(dict.text, size);
        mesh.name = mesh.name + ' gridText';
        const [x, y, z] = dict.textPosition;
        mesh.position.set(x, y, z);
        mesh.axis = dict.axis;
        mesh.text = dict.text;
        return mesh;
    })

    const zLabel = generateText(options['zAxisTitle'] ?? 'Y', size);
    zLabel.position.set(- xSize / 2, 0, - zSize / 2 - textOffsetToGrid);
    zLabel.axis = 'Y';
    const xLabel = generateText(options['xAxisTitle'] ?? 'X', size);
    xLabel.position.set(xSize / 2 + textOffsetToGrid, 0, zSize / 2);
    xLabel.axis = 'X';

    const meshes = [gridMesh, ...( !is3D ? [outlineMeshGroup] : []), ...textMeshes, xLabel, zLabel];
    const group = new THREE.Group();
    meshes.forEach(mesh => {
        group.add(mesh);
    })

    return group;
}

export function disposeMesh (mesh) {
    if (! mesh) {
        return;
    }
    // dispose geometries and materials in scene
    const toBeDisposed = [];
    mesh.traverse((o) => {
      if (o.geometry) {
        toBeDisposed.push(o.geometry);
        // console.log("dispose geometry ", o.geometry);
      }
  
      if (o.material) {
        if (o.material.length) {
          for (let i = 0; i < o.material.length; ++i) {
            toBeDisposed.push(o.material[i]);
            // console.log("dispose material ", o.material[i]);
          }
        } else {
          toBeDisposed.push(o.material);
          // console.log("dispose material ", o.material);
        }
      }
    });
    toBeDisposed.forEach(o => {
      o.dispose();
    })
}

function generateVerticalAxis(verticalSize, verticalDivisions, sceneMinY : number, tickLength = 1, color = 0xffffff as any, options=defaultOptions, size = 100) {
    if (verticalSize == null || verticalSize <= 0 || verticalDivisions == null || verticalDivisions < 0 || sceneMinY == null || tickLength == null || ! color) {
        return null;
    }
    const tickPoints = [[0, 0, 0], [tickLength, 0, 0]].map(point => new THREE.Vector3(...point));
    const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
    const tickMaterial = new THREE.LineBasicMaterial( { color: color } );
    const tick = new THREE.Line(tickGeometry, tickMaterial);
    const tickEuler = new THREE.Euler(0, 3 * Math.PI/4, 0);
    tick.setRotationFromEuler(tickEuler);

    const offsets = [];
    const textOffsetToGrid = size/30*0.7071; // textsize/30 * sin 45 degrees
    for (let i=0; i < verticalDivisions + 1; i += 1) {
        const offset = verticalSize * i / verticalDivisions;
        offsets.push(offset);
    }
    
    const ticks = offsets.map(offset => {
        const newTick = tick.clone();
        newTick?.position.setComponent(1, offset);
        return newTick;
    });

    const generateText = textGenerator(options);
    const texts = offsets.map(offset => {
        const text = coordinateToText(sceneMinY + offset);
        const mesh = generateText(text, size);
        mesh?.position.set(-textOffsetToGrid, offset, +textOffsetToGrid);
        return mesh;
    })

    const p1 = new THREE.Vector3(0, 0, 0);
    const p2 = new THREE.Vector3(0, verticalSize, 0);
    const points = [p1, p2];
    const verticalAxisGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const verticalAxisMaterial = new THREE.LineBasicMaterial( { color: color } );
    const verticalAxis = new THREE.Line(verticalAxisGeometry, verticalAxisMaterial);

    const axisLabel = generateText(options['yAxisTitle'] ?? 'Z', size);
    axisLabel.position.set(0, verticalSize + textOffsetToGrid, 0);

    const group = new THREE.Group();
    [verticalAxis, ...ticks, ...texts, axisLabel].forEach(mesh => {
        if (! mesh) {
            return;
        }
        group.add(mesh);
    })
    return group;
}

function generateGrid(scene, minRealCoordinates : [number, number, number], options, is3D = true, tSize = null) {
    if (! scene) {
        return null;
    }

    const sceneClone = scene.clone();
    sceneClone.children.forEach(c => {
        if(c.name === 'map' || c.name === 'terrain')
            sceneClone.remove(c)
    })

    const boundingBox = new THREE.Box3().setFromObject(sceneClone);

    window['disposeMesh'](sceneClone);

    const [minX, minY, minZ] = boundingBox.min.toArray();
    const [maxX, maxY, maxZ] = boundingBox.max.toArray();
    const sceneCenter = boundingBox.min.add(boundingBox.max).divideScalar(2);

    const xSize  = Math.ceil((maxX - minX) * 1.10 / 10) * 10;
    const divisions = xSize / 10;
    // makes it a multiple of the cell size
    const zSize = Math.ceil((maxZ - minZ) * 1.10 / divisions) * divisions;
    const gridColor = 0xa0a0a0
    // const gridHelper = new THREE.GridHelper(size, divisions, gridColor, gridColor);
    // gridHelper.material.transparent = true;
    // gridHelper.material.opacity = 0.5;
    // gridHelper.material.depthWrite = false;

    const verticalSize = maxY - minY
    const verticalDivisions = 10;

    const textSize = tSize === null ? xSize*zSize*0.0008 + 141.5 : tSize; //Ratio determined via testing

    let verticalAxis = null;

    if(is3D) {
        verticalAxis = generateVerticalAxis(verticalSize, verticalDivisions, minY, 1, gridColor, options, textSize);
        verticalAxis.position.set(-xSize/2, 0, +zSize/2);
    }
    
    // const realCenterCoordinates = [0, 0, 0] as [number, number, number];
    const minCoordVector = new THREE.Vector3(...minRealCoordinates);
    const realCenterCoordinates = new THREE.Vector3().addVectors(sceneCenter, minCoordVector).toArray();
    const gridTexts = generateGridWithTexts(xSize, zSize, divisions, realCenterCoordinates, options, textSize, is3D);
    
    const grid = new THREE.Group();
    [gridTexts, verticalAxis].forEach(mesh => {
        if (! mesh) {
            return;
        }
        grid.add(mesh);
    })
    grid.position.set(...(sceneCenter.toArray()));
    grid.position.setComponent(1, minY);
    grid.name = "Grid";

    return grid;
}

function generateInfiniteGrid(scene, minRealCoordinates) {
    const grid = new InfiniteGridHelper(10, 100, new THREE.Color(0xa0a0a0));
    grid.name = "Grid";

    const boundingBox = new THREE.Box3().setFromObject(scene);
    const [minX, minY, minZ] = boundingBox.min.toArray();
    const sceneCenter = boundingBox.min.add(boundingBox.max).divideScalar(2);
    grid.position.set(...(sceneCenter.toArray()));
    grid.position.setComponent(1, minY);
    return grid;
}

export function addGrid(scene, minRealCoordinates : [number, number, number], options, is3D = true, tSize = null) {
    if (! scene) {
        return null;
    }
    // remove old grid before adding so it isn't computed in the size of the scene
    removeGrids(scene);
    const grid = generateGrid(scene, minRealCoordinates, options, is3D, tSize);
    if (! grid) {
        return null;
    }
    
    scene.add(grid);
    return grid;
}

export function findGrids(scene) {
    if (! scene) {
        return [];
    }
    const toBeRemoved = [];
    scene.traverse(obj => {
        if (obj?.name == "Grid") {
          toBeRemoved.push(obj);
        }
    })
    return toBeRemoved;
}

export function removeGrids(scene) {
    if(! scene) {
        return;
    }
    const toBeRemoved = findGrids(scene);
    toBeRemoved.forEach(obj => {
        obj.removeFromParent()
        disposeMesh(obj);
    });
}

export function toggleGrids(scene, bool) {
    if (! scene) {
        return;
    }
    const grids = findGrids(scene);
    grids.forEach(grid => {
        if (! grid) {
            return;
        }
        grid.visible = bool;
    })
}

// https://codepen.io/jerryasher/pen/qOKgeM heavily adapted
class WorldAxis {
    axisRenderer: any;
    axesMesh: any;
    axisScene: any;
    axisCamera: any;
    camera: any;
    controls: any;
    axisDistance: number;

    constructor ({camera, scene, renderer, controls}, {axisWidth = 200, axisHeight = 200, axisDistance = 300, lineLength = 100, textOffset = 10}, options = defaultOptions) {

        this.camera = camera;
        this.controls = controls;

        this.axisDistance = axisDistance;

        // renderer
        this.axisRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha : true
        });
        this.axisRenderer.setPixelRatio( window.devicePixelRatio );
        this.axisRenderer.setClearColor( 0x000000, 0 );
        this.axisRenderer.setSize( axisWidth, axisHeight );
        this.axisRenderer.domElement.classList.add('worldAxis');

        // scene
        this.axisScene = new THREE.Scene();

        // camera
        this.axisCamera = new THREE.PerspectiveCamera( 50, axisWidth / axisHeight, 1, 1000 );
        this.axisCamera.up = camera.up; // important!

        const coneLength = lineLength * 0.2;
        const coneRadius = 0.15;
        const positions = [
            [lineLength - coneLength / 2, 0, 0],
            [0, lineLength - coneLength / 2, 0],
            [0, 0, - lineLength + coneLength / 2],
        ];
        const eulers = [
            [0, 0, - Math.PI / 2],
            [0, Math.PI / 2, 0],
            [- Math.PI / 2, 0, 0],
        ]
        const colors = [0xff0000, 0x00ff00, 0x0000ff];

        // axes
        this.axesMesh = new THREE.Group();
        positions.forEach((position, index) => {
            const vertices = [0, 0, 0, ...position];
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const color = colors[index];
            const material = new THREE.LineBasicMaterial( { color : color} );
            const mesh = new THREE.Line(geometry, material);
            this.axesMesh.add(mesh);
        })

        const cones = positions.map((position, index) => {
            const geometry = new THREE.ConeGeometry(coneRadius, coneLength, 32);
            const material = new THREE.MeshBasicMaterial({color : colors[index]});
            const cone = new THREE.Mesh(geometry, material);
            cone.position.set(...position);
            const eulerArr = eulers[index];
            const euler = new THREE.Euler(...eulerArr);
            cone.setRotationFromEuler(euler);
            return cone;
        })
        this.axisScene.add( this.axesMesh );
        cones.forEach(cone => {
            this.axisScene.add(cone);
        })
        const textDistance = lineLength + textOffset;
        const zText = textTo3d('Y', options);
        const yText = textTo3d('Z', options);
        const xText = textTo3d('X', options);
        zText.position.set(0, 0, - textDistance);
        yText.position.set(0, textDistance, 0);
        xText.position.set(textDistance, 0, 0);
        [zText, yText, xText].forEach(mesh => {
            this.axisScene.add(mesh);
        })
        this.axisScene.traverse(mesh => {
            if (! mesh?.material) {
                return;
            }
            mesh.material.renderOrder = 10;
            mesh.material.depthWrite = false;
            mesh.material.depthTest = false;
        })

        const worldAxis = this;
        getCompassPlane(lineLength * 6).then(plane => {
            worldAxis.axisScene.add(plane);
            const euler = new THREE.Euler(- Math.PI / 2, 0, 0)
            plane.setRotationFromEuler(euler);
        })
        
        this.axisRenderer.domElement.onclick = (evt) => {
            viewFromAxis(controls, 2);
        }

    }
    // animate
    // -----------------------------------------------

    render() {
        this.axisRenderer.render( this.axisScene, this.axisCamera );
    }

    // to be called inside the animate of your viewer
    animate(time) {
        this.axisCamera.position.copy( this.camera.position );
        this.axisCamera.position.sub( this.controls.target ); // added by @libe
        this.axisCamera.position.setLength( this.axisDistance );

        this.axisCamera.lookAt( this.axisScene.position );
        this.render();
        TWEEN.update(time);
    };
}

const compassMaterialPromise = new Promise((resolve, reject) => {
    const compassFilename = './Hatch_Files/compass.svg'
    let textureLoader = new THREE.TextureLoader();

    const onLoad = (texture) => {
        const material = new THREE.MeshBasicMaterial({
            map : texture,
            side: THREE.DoubleSide,
        });
        material.map.needsUpdate = true;
        resolve(material)
    }
    const onError = (something) => {
        reject('error');
    };
    textureLoader.load(compassFilename, onLoad, null, onError);
});

async function getCompassPlane(width) {
    const compassMaterial = await compassMaterialPromise;
    const geometry = new THREE.PlaneGeometry(width, width);
    const plane = new THREE.Mesh(geometry, compassMaterial);
    return plane;
}

class ViewCube {
    cubeScene: any;
    cubeCamera: any;
    cubeRenderer: any;
    cubeController: any;
    scene: any;
    camera: any;
    controls: any;
    cubeCameraDistance: number;

    constructor ({scene, camera, controls}, {width, height}) {
        this.cubeCameraDistance = 2.4;

        this.scene = scene;
        this.camera = camera;
        this.controls = controls;

        this.cubeScene = new THREE.Scene();
        this.cubeCamera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
        this.cubeRenderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.cubeRenderer.setPixelRatio( window.devicePixelRatio );
        this.cubeRenderer.domElement.classList.add('viewCube')
        this.cubeController = new OrbitControls.OrbitControls(this.camera, this.cubeRenderer.domElement);
        this.cubeController.enablePan = false;
        this.cubeController.enableZoom = false;
        this.cubeController.rotateSpeed = 0.125;

        this.cubeRenderer.setSize(width, height); //SETS THE SIZE OF THE CU

        let materials = [];
        let texts = ['RIGHT', 'LEFT', 'TOP', 'BOTTOM', 'FRONT', 'BACK'];

        let textureLoader = new THREE.TextureLoader();

        const viewCube = this;
        getCompassPlane(4).then(plane => {
            viewCube.cubeScene.add(plane);
            const euler = new THREE.Euler(- Math.PI / 2, 0, 0)
            plane.position.set(0, - 0.5, 0)
            plane.setRotationFromEuler(euler);
            plane.scale.set(0.7,0.7,0.7);
        })

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        
        let size = 64;
        canvas.width = size;
        canvas.height = size;

        ctx.font = 'bolder 12px "Open sans", Arial';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        let mainColor = '#fff';
        let otherColor = '#ccc';

        let bg = ctx.createLinearGradient(0, 0, 0, size);
        bg.addColorStop(0, mainColor);
        bg.addColorStop(1,  otherColor);

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = mainColor;

            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = '#777';
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);
            ctx.fillStyle = '#777';
            ctx.fillText(texts[i], size / 2, size / 2);
            materials[i] = new THREE.MeshBasicMaterial({
                map: textureLoader.load(canvas.toDataURL()),
                polygonOffset: true,
                polygonOffsetFactor: -10
            });
        }

        let planes = [];

        let planeMaterial = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x00c0ff,
            transparent: true,
            opacity: 0,
            depthTest: false,
            polygonOffset: true,
            polygonOffsetFactor: -1
        });
        let planeSize = 0.7;
        let planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);

        let a = 0.51;

        let plane1 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane1.position.z = a;
        this.cubeScene.add(plane1);
        planes.push(plane1);

        let plane2 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane2.position.z = -a;
        this.cubeScene.add(plane2);
        planes.push(plane2);

        let plane3 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane3.rotation.y = Math.PI / 2;
        plane3.position.x = a;
        this.cubeScene.add(plane3);
        planes.push(plane3);

        let plane4 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane4.rotation.y = Math.PI / 2;
        plane4.position.x = -a;
        this.cubeScene.add(plane4);
        planes.push(plane4);

        let plane5 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane5.rotation.x = Math.PI / 2;
        plane5.position.y = a;
        this.cubeScene.add(plane5);
        planes.push(plane5);

        let plane6 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
        plane6.rotation.x = Math.PI / 2;
        plane6.position.y = -a;
        this.cubeScene.add(plane6);
        planes.push(plane6);

        let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
        this.cubeScene.add(cube);

        let activePlane = null;

        this.cubeRenderer.domElement.onmousemove = (evt) => {

            if (activePlane) {
                activePlane.material.opacity = 0;
                activePlane.material.needsUpdate = true;
                activePlane = null;
            }

            let x = evt.offsetX;
            let y = evt.offsetY;
            let size = this.cubeRenderer.getSize(new THREE.Vector2());
            let mouse = new THREE.Vector2(x / size.width * 2 - 1, -y / size.height * 2 + 1);
            
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.cubeCamera);
            let intersects = raycaster.intersectObjects(planes.concat(cube));

            if (intersects.length > 0 && intersects[0].object != cube) {
                activePlane = intersects[0].object;
                activePlane.material.opacity = 0.2;
                activePlane.material.needsUpdate = true;
            }
        }

        let startTime = 0;
        let duration = 500;
        let oldPosition = new THREE.Vector3();
        let newPosition = new THREE.Vector3();
        let play = false;

        let hasMoved = false;

        this.cubeRenderer.domElement.onclick = (evt) => {

            this.cubeRenderer.domElement.onmousemove(evt);

            if (!activePlane || hasMoved) {
                return false;
            }

            oldPosition.copy(camera.position);

            let distance = this.camera.position.clone().sub(controls.target).length();
            newPosition.copy(controls.target);

            if (activePlane.position.x !== 0) {
                newPosition.x += activePlane.position.x < 0 ? -distance : distance;
            } else if (activePlane.position.y !== 0) {
                newPosition.y += activePlane.position.y < 0 ? -distance : distance;
            } else if (activePlane.position.z !== 0) {
                newPosition.z += activePlane.position.z < 0 ? -distance : distance;
            }

            //play = true;
            //startTime = Date.now();
            this.camera.position.copy(newPosition);
        }

        this.cubeRenderer.domElement.ontouchmove = function(e) {
            let rect = e.target.getBoundingClientRect();
            let x = e.targetTouches[0].pageX - rect.left;
            let y = e.targetTouches[0].pageY - rect.top;
            this.cubeRenderer.domElement.onmousemove({
                offsetX: x,
                offsetY: y
            });
        }

        this.cubeRenderer.domElement.ontouchstart = function(e) {
            let rect = e.target.getBoundingClientRect();
            let x = e.targetTouches[0].pageX - rect.left;
            let y = e.targetTouches[0].pageY - rect.top;
            this.cubeRenderer.domElement.onclick({
                offsetX: x,
                offsetY: y
            });
        }
    }

    updateCubeCamera() {
        this.cubeCamera.rotation.copy(this.camera.rotation);
        let dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.cubeCamera.position.copy(dir.multiplyScalar(this.cubeCameraDistance));
    }

    render() {
        this.updateCubeCamera();
		this.cubeRenderer.render(this.cubeScene, this.cubeCamera);
    }

    animate() {
        this.cubeCamera.position.copy(this.camera.position );
        this.cubeCamera.lookAt(this.cubeScene.position);
        this.render();
    }
}

export function copyCamera(receivingCamera, sendingCamera) {
    receivingCamera.position.copy(sendingCamera.position);
    receivingCamera.matrix.copy(sendingCamera.matrix);
}

export class Viewer3D {
    renderer : any
    camera : any
    perspectiveCamera : any
    orthographicCamera : any
    controls : any
    scene : any
    animationId : any
    minRealCoordinates : any
    textObjs : any
    worldAxisTextObjs : any
    toBeRotated : any
    viewCube : any
    worldAxis : any
    composer : any
    fxaaPass : any
    ssaaRenderPassPerspective : any
    ssaaRenderPassOrthographic : any
    outlinePass : any
    rotateGridText = true
    
    constructor (scene, minRealCoordinates : [number, number, number], rootElem=document.body, options=defaultOptions) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const lightPositions = [
            [1, 1, 1],
            [-1, 1, -1],
        ];
        lightPositions.forEach(lightPosition => {
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
            scene.add(directionalLight);
            directionalLight.position.set(...lightPosition);
    
            // const pointLight = new THREE.PointLight( 0xffffff, 0.5, 0);
            // pointLight.position.set(...(lightPosition.map(x => x * 5000)));
            // scene.add(pointLight);
        })

        const defaultOnViewerProgress = (percent) => null;
        const onViewerProgress = options['onViewerProgress'] ?? defaultOnViewerProgress;
        const rendererHeight = window.innerHeight - 50;
        const rendererWidth = window.innerWidth;
        
        // const sceneCenter = getSceneCenter(scene);
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const [minX, minY, minZ] = boundingBox.min.toArray();
        const [maxX, maxY, maxZ] = boundingBox.max.toArray();
        const sceneCenter = boundingBox.min.add(boundingBox.max).divideScalar(2);
        
        const perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / rendererHeight, 0.1, 50000);
        const cameraHeight = rendererHeight;
        const cameraWidth = window.innerWidth;
        const orthographicCamera = new THREE.OrthographicCamera(cameraWidth / - 2, cameraWidth / 2, cameraHeight / 2, cameraHeight / - 2, 0.1, 50000 );
        const camera = perspectiveCamera;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer : true // allows line2 to render correctly on overlap
        });
        renderer.setSize(rendererWidth, rendererHeight);
        renderer.setPixelRatio( window.devicePixelRatio );
        rootElem.appendChild(renderer.domElement);

        const pixelRatio = renderer.getPixelRatio();
        const copyPass = new ShaderPass( CopyShader )
        const renderPass = new RenderPass(scene, camera);

        // fxaa didn't reduce the jagged polygon line2 issue
        // renderer with antialias = true and not using fxaa worked better
        // const fxaaPass = new ShaderPass( FXAAShader );
        // this.fxaaPass = fxaaPass;
        // this.composer = new EffectComposer(renderer);
        // this.composer.addPass(renderPass);
        // this.composer.addPass(fxaaPass);
        // fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( rendererWidth * pixelRatio );
        // fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( rendererHeight * pixelRatio );

        // multipass didn't reduce the jagged polygon line2 issue
        // const renderTarget = new THREE.WebGLRenderTarget(rendererWidth, rendererHeight, { samples: 4 } );
        // this.composer = new EffectComposer(renderer, renderTarget);
        // this.composer.addPass(renderPass);
        // this.composer.addPass(copyPass);
        
        // ssaa
        this.composer = new EffectComposer(renderer);
        this.composer.setPixelRatio(1); // always 1 for performance reasons
        const ssaaRenderPassPerspective = new SSAARenderPass( scene, perspectiveCamera);
        const ssaaRenderPassOrthographic = new SSAARenderPass( scene, orthographicCamera);
        // default is 4, too slow
        ssaaRenderPassPerspective.sampleLevel = 2;
        ssaaRenderPassOrthographic.sampleLevel = 2;
        this.ssaaRenderPassPerspective = ssaaRenderPassPerspective;
        this.ssaaRenderPassOrthographic = ssaaRenderPassOrthographic;
        ssaaRenderPassPerspective.enabled = true;
        ssaaRenderPassOrthographic.enabled = false;
        this.outlinePass = new OutlinePass(new THREE.Vector2(rendererWidth, rendererHeight), scene, orthographicCamera);
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.edgeStrength = 10;
        this.outlinePass.hiddenEdgeColor.set('#ffffff')
        this.composer.addPass(ssaaRenderPassPerspective);
        this.composer.addPass(ssaaRenderPassOrthographic);
        this.composer.addPass(copyPass);
        this.composer.addPass(this.outlinePass)

        this.composer.setSize(rendererWidth, rendererHeight);
        this.composer.render(scene, camera);
    
        const controls = new OrbitControls.OrbitControls( camera, renderer.domElement );
        controls.listenToKeyEvents(window);
        // controls.enablePan = true;
        //   controls.target.set( 0, 0, 0 )
        controls.update();
        controls.target.set(...sceneCenter.toArray())

        // const mouse = new THREE.Vector2();
        // const onMouseMove = onMouseMoveGenerator(mouse);
        // document.addEventListener('mousemove', onMouseMove, false);

        // see from an angle
        camera.lookAt(sceneCenter);
        const distanceToTarget = 150;
        // const distanceToTarget = camera.position.distanceTo(controls.target);
        const newCameraPosition = controls.target.toArray();
        const angleRad = Math.PI / 16;
        const dx = distanceToTarget * Math.cos(angleRad);
        const dy = distanceToTarget * Math.sin(angleRad);
        newCameraPosition[0] = newCameraPosition[0] - dx;
        newCameraPosition[1] = newCameraPosition[1] + dy;
        camera.position.set(...newCameraPosition)

        zoomAll(scene, controls, renderer);
        onViewerProgress(40);

        // grid is added last so to not interfere with the bounding box
        addGrid(scene, minRealCoordinates, options);
        onViewerProgress(60);

        const worldAxis = new WorldAxis({
            renderer : renderer,
            camera : camera,
            controls : controls,
            scene : scene,
        }, {
            axisWidth : 150,
            axisHeight : 150,
            axisDistance: 40,
            lineLength : 5,
            textOffset : 1
        }, options);
        rootElem.appendChild(worldAxis.axisRenderer.domElement);

        const viewCube = new ViewCube({
            scene : scene,
            camera : camera,
            controls : controls
        }, {width : 100, height:100});
        rootElem.appendChild(viewCube.cubeRenderer.domElement);


        const textObjs = getAllTextObjs(scene);
        const worldAxisTextObjs = getAllTextObjs(worldAxis.axisScene);
        const toBeRotated = getAllWithName(scene, 'toBeRotated');
        onViewerProgress(80);

        let animationId = null;
        
        this.renderer =  renderer;
        this.camera = camera;
        this.perspectiveCamera = perspectiveCamera;
        this.orthographicCamera = orthographicCamera;
        this.controls = controls;
        this.scene = scene;
        this.animationId = animationId;
        this.minRealCoordinates = minRealCoordinates;
        this.textObjs = textObjs;
        this.worldAxisTextObjs = worldAxisTextObjs;
        this.toBeRotated = toBeRotated;
        this.viewCube = viewCube;
        this.worldAxis = worldAxis;
        this.rotateGridText = this.rotateGridText;

        onViewerProgress(100);

        this.animate()
    }

    
    animate() {
        //   animationId = requestAnimationFrame(animate);
        requestAnimationFrame( () => this.animate() );
    
        // required if controls.enableDamping or controls.autoRotate are set to true
        this.controls.update();

        if (this.rotateGridText) {
            textsLookAtCamera(this.textObjs, this.camera);
        }
        textsLookAtCamera(this.worldAxisTextObjs, this.worldAxis.axisCamera);
        textsLookAtCamera(this.toBeRotated, this.camera);
        
        // `window['viewer3d'].camera` instead of just `camera`
        // allows the camera to be changed
        // this.renderer.render( this.scene, this.camera );
        this.composer.render( this.scene, this.camera );
        this.worldAxis.animate();
        this.viewCube.animate();
    }
}

export async function openFile() {
    let [fileHandle] = await (window as any).showOpenFilePicker();
    return fileHandle;
}

export async function openFileAsString() {
    let fileHandle = await openFile()
    let file = await fileHandle.getFile();
    let string = await file.text();
    return string;
}

export async function openJson() {
    let jsonString = await openFileAsString();
    let jsonData = JSON.parse(jsonString);
    return jsonData;
}