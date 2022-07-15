// @ts-check
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWZraGFtaSIsImEiOiJja3lhdHBkd3EwOHhtMm9vMTg2b2JzMnN1In0.kdf_MvENMWTDNXnuuUM8zA";

let tgeo = null;
let mTerrain = null;
let terrainObj = null;
let selectObj = null;
let _crossSectionCanvas = null;
let axisHelper = null;
let wireframeMat = null;
let satelliteMats = {};
let objsInteractive = [];

import { meshToGltf } from "./lib/3D_Viewer_conversion/json_to_3d.js";
import { DragControls } from "./lib/3D_Viewer_conversion/lib/three-controls/DragControls.js";
import * as viewer from "./lib/3D_Viewer_conversion/viewer.js";

var THREE = window['THREE'];

const loadThree = async () => {
  window['THREE'] = await import(
    "./lib/3D_Viewer_conversion/node_modules/three/build/three.module.js"
  );
  THREE = window['THREE']
  window['showSelectionMesh'] = true;

  const ThreeGeo = (await import("./three-geo.esm.js")).default;
  axisHelper = new THREE.AxesHelper(100);

  tgeo = new ThreeGeo({
    tokenMapbox: MAPBOX_TOKEN,
    unitsSide: 1.0,
  });

  mTerrain = new window['mapTerrain']({
    tokenMapbox: MAPBOX_TOKEN,
    unitsSide: 1.0,
  });
};

const calculateNumberOfTiles = (crossSectionCanvas) => {
  const { resolution, radius, lat }  = crossSectionCanvas.storage.terrainSettings;
  let tilesNumber = 0;

  switch (resolution) {
      case 'Poor':
          tilesNumber = Math.ceil(( Math.PI * Math.pow(1000 * radius, 2) ) / Math.pow(( 512 * ( Math.pow(10, -7) * Math.pow(lat, 4) + 3*Math.pow(10, -6) * Math.pow(lat, 3) - 0.0059 * Math.pow(lat, 2) + 0.0012 * lat + 38.218 )), 2));
          break;
      case 'Basic':
          tilesNumber = Math.ceil(( Math.PI * Math.pow(1000 * radius, 2) ) / Math.pow(( 512 * ( 3*Math.pow(10, -8) * Math.pow(lat, 4) + 8*Math.pow(10, -7) * Math.pow(lat, 3) - 0.0015 * Math.pow(lat, 2) + 0.0002 * lat + 9.555 )), 2));
          break;
      case 'Standard':
          tilesNumber = Math.ceil(( Math.PI * Math.pow(1000 * radius, 2) ) / Math.pow(( 512 * ( 7*Math.pow(10, -9) * Math.pow(lat, 4) + 2*Math.pow(10, -7) * Math.pow(lat, 3) - 0.0004 * Math.pow(lat, 2) + 6*Math.pow(10, -5) * lat + 2.389 )), 2));
          break;
      default: tilesNumber = Math.ceil(( Math.PI * Math.pow(1000 * radius, 2) ) / Math.pow(( 512 * ( 8*Math.pow(10, -10) * Math.pow(lat, 4) + 2*Math.pow(10, -7) * Math.pow(lat, 3) - Math.pow(10, -4) * Math.pow(lat, 2) + Math.pow(10, -4) * lat + 0.597 )), 2));
      
  }
  
  return tilesNumber;
}

const toggleFlatTerrain = (crossSectionCanvas, bool) => {
  let terrain = crossSectionCanvas.storage.terrainObj;
  let {scene, controls, renderer} = crossSectionCanvas.storage.viewer3d;

  if(bool) {
    terrain.scale.set(1,1,0.00001);
    window['showSelectionMesh'] = false;
    crossSectionCanvas.storage.selectObj.visible = false;

    scene.children.forEach(c => {
      if(c.name !== 'terrain' && c.name !== 'SelectMesh')
        c.position.y = 0.05;
    });
  } else {
    terrain.scale.set(1,1,1);
    window['showSelectionMesh'] = true;

    if(crossSectionCanvas.storage.terrainSettings.selectionMesh)
      crossSectionCanvas.storage.selectObj.visible = true;

    scene.children.forEach(c => {
      if(c.name !== 'Grid' && c.name !== 'terrain' && c.name !== 'SelectMesh')
        c.position.y = crossSectionCanvas.storage.modelElevation;
      else if(c.name !== 'terrain' && c.name !== 'SelectMesh')
        c.position.y = crossSectionCanvas.storage.gridElevation;        
    });
  }

  if(!crossSectionCanvas.storage.isShowingPlan)
    viewer.zoomAll(scene, controls, renderer);
  else    
    viewer.zoomTop(scene, controls, renderer, 0.8);
}

// if(settings.flatTerrain && settings.terrain !== 'Solid Contours'){
//   // terrain.children.forEach(child => {
//   //   const position = child.geometry.attributes.position;
//   //   const arr = position.array;
//   //   for (let i = 0; i < arr.length; i += 3) {
//   //       arr[i+2] = 0; // set z value (height) to zero
//   //   }
//   //   position.needsUpdate = true;
//   // })
//   terrain.scale.set(1,1,0.00001);
// } else if(settings.flatTerrain && settings.terrain === 'Solid Contours'){
//   terrain.scale.set(1,1,0.00001);
// }

const openPerfModal = async (crossSectionCanvas, val) => {
  const modalElem = crossSectionCanvas.storage.rootElem.querySelector('.perfModal');
  const perfModalButton = modalElem.querySelector('.onClickPerf');

  perfModalButton.onclick = async () => {
      if (perfModalButton.disabled) {
          return;
      } else {
          const closeModal = () => $(modalElem).modal('hide');
          closeModal();
          window['addTerrain'](crossSectionCanvas);
          return true;
      }
  };

  // replaces default behavior since it was also closing the crossSection modal
  const closeButtons = [
      modalElem.querySelector(".closeButton")
  ]
  closeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
          if (button.disabled) {
              return;
          } else {
              $(modalElem).modal('hide');
              document.getElementsByClassName('resolution')[0].children[1].children[0].value = val;
              crossSectionCanvas.storage.terrainSettings['resolution'] = val;
              window['addTerrain'](crossSectionCanvas);
              return false;
          }
      })
  })

  $(modalElem).modal({
      show: true,
      backdrop: false
  });
}

const updateMode = (viewer3d, vis, terrainColor='#999999') => {
  const { scene } = viewer3d;

  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh) && !(node instanceof THREE.Line)) return;

    // console.log(node.name);
    if (!node.name) return;

    if (node.name.startsWith("dem-rgb-")) {
      if (vis === "Satellite" && node.name in satelliteMats) {
        node.material = satelliteMats[node.name];
        node.material.needsUpdate = true;
        node.visible = true;
      } else if (vis === "Wireframe") {
        wireframeMat = new THREE.MeshBasicMaterial({
          wireframe: true,
          color: terrainColor,
        });

        node.material = wireframeMat;
        node.material.needsUpdate = true;
        node.visible = true;
      } else if (vis === "Contours") {
        node.visible = false;
      }
    } else if (node.name.startsWith("dem-vec-")) {
      node.visible = vis === "Contours";
    }
  });
};

async function getTerrain(viewer3d, { lat, lng, radius, /*zoom*/resolution, terrain, opacity, terrainColor='#999999'}) {
  let terrainObj = null;
  const { renderer } = viewer3d;
  let zoom = 15;

  if(resolution == 'Poor')
    zoom = 13;
  else if(resolution == 'Basic')
    zoom = 15;
  else if(resolution == 'Standard')
    zoom = 17;
  else if(resolution == 'High')
    zoom = 19;

  // zoom = 21;

  const setOpacity = (material) => {
    if (! material) {
      return;
    }
    if (opacity == null || opacity >= 1 || opacity < 0) {
      material.transparent = false;
      material.needsUpdate = true;
      return;
    }
    material.transparent = true;
    material.opacity = opacity;
    material.depthWrite = false;
    material.needsUpdate = true;
  }

  if (terrain === "Satellite" || terrain === "Wireframe") {

    const contourLineElem = renderer?.domElement?.parentElement.querySelector('.contourLine');
    contourLineElem.innerText = ''
    contourLineElem.style.display = 'none'

    return new Promise((res) => {
      tgeo.getTerrain([lat, lng], radius, zoom, {
        onRgbDem: (objs) => {
          // dem-rgb-<zoompos>
          const group = new THREE.Group();

          objs.forEach((obj) => {
            objsInteractive.push(obj);
            group.add(obj);
            setOpacity(obj.material);
          });

          res(group);
        },
        onSatelliteMat: (plane) => {
          plane.material.side = THREE.DoubleSide;
          setOpacity(plane.material);
          satelliteMats[plane.name] = plane.material;

          if (terrain === "Wireframe") {
            updateMode(viewer3d, "Wireframe", terrainColor);
          }
        },
      });
    });
  } else if (terrain === "Solid Contours") {
    terrainObj = await tgeo.getTerrainVector([lat, lng], radius, zoom);    
    let contourLineValue = 10
    
    //https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-v2/
    switch (zoom) {
      case 11:
        contourLineValue = 100;
        break;
      case 12:
        contourLineValue = 50;
        break;
      case 13:
        contourLineValue = 20;
        break;
      case 14:
      case 15:
      case 16:
      case 17:
        contourLineValue = 10;
        break;
    }

    const contourLineElem = renderer?.domElement?.parentElement.querySelector('.contourLine');
    if (contourLineElem) {
      contourLineElem.innerText = `${contourLineValue} m Contours`
      contourLineElem.style.display = 'inline-block'
    } 

    terrainObj.children.forEach(node => {
      if ((node instanceof THREE.Mesh)) {
      node.material.color = new THREE.Color(terrainColor);
      setOpacity(node.material);
      }
    })
  } else if (terrain === 'Street Map' || terrain === 'Street Map (with contours)') {
    let isMap = false, isMapNotContours = false;

    if(terrain === 'Street Map')
      isMapNotContours = true;
    else
      isMap = true;

    // terrainObj = await tgeo.getTerrainRgb([lat, lng], radius, zoom);
    const contourLineElem = renderer?.domElement?.parentElement.querySelector('.contourLine');
    contourLineElem.innerText = ''
    contourLineElem.style.display = 'none'

    return new Promise((res) => {
      mTerrain.getTerrain([lat, lng], radius, zoom, isMap, isMapNotContours, {
        onRgbDem: (objs) => {
          // dem-rgb-<zoompos>
          const group = new THREE.Group();

          objs.forEach((obj) => {
            objsInteractive.push(obj);
            group.add(obj);
            setOpacity(obj.material);
          });

          res(group);
        },
        onSatelliteMat: (plane) => {
          plane.material.side = THREE.DoubleSide;
          setOpacity(plane.material);
          satelliteMats[plane.name] = plane.material;

        },
      });
    });
  }

  return terrainObj;
}

async function toggleTerrain(crossSectionCanvas) {
  const {scene, controls, renderer} = crossSectionCanvas.storage.viewer3d;

  if (crossSectionCanvas.storage.terrainObj != null) {
    if(crossSectionCanvas.storage.isShowingPlan)
      toggleFlatTerrain(crossSectionCanvas, false);

    ['terrainObj', 'terrainAxisHelper'].forEach(key => {
      const obj = crossSectionCanvas.storage[key];
      if (! obj) {
          return;
      }
      viewer.disposeMesh(obj);
      scene.remove(obj);
      crossSectionCanvas.storage[key] = null;
    })

    crossSectionCanvas.storage.isShowingTerrain = false;
    const terrainTooltip = crossSectionCanvas.storage.rootElem.querySelector('.terrainTooltip');
    terrainTooltip.classList.add('hidden');

    scene.scale.set(1,1,1)

    let bGroup = new THREE.Group()

    const children = scene.children ?? [];
 
    children.forEach(child => {
      if(child.name === 'Grid'){
        
        const sceneBBox = new THREE.Box3().setFromObject(bGroup)
        child.scale.set(1, 1, 1)
        const [minX, minY, minZ] = sceneBBox.min.toArray();
  
        const sceneCenter = sceneBBox.min.add(sceneBBox.max).divideScalar(2)
        child.position.set(...(sceneCenter.toArray())) 
        child.position.setComponent(1, minY)  
      } else {
        child.position.set(0, 0, 0)
        child.scale.set(1, 1, 1)
        bGroup.add(child.clone());
      }
    })

    scene.remove(scene.children.filter(c => c.name === 'SelectMesh')[0]);
  
    window['lineScalingFactor'] = 1;
    window['updateLineThickness'](scene, 0.5);

    const terrainPropertyGrid = crossSectionCanvas.storage?.rootElem?.querySelector(".propertyGridSelected");
    terrainPropertyGrid.innerHTML = '<div class="guidingText"><p>Click on any object to view properties</p></div>';

    const contourLineElem = renderer?.domElement?.parentElement.querySelector('.contourLine');
    contourLineElem.innerText = '';
    contourLineElem.style.display = 'none';

    crossSectionCanvas.storage.positionMeshAddedAsSceneChildAfterTerrain = null;
  }
  else {
    await addTerrain(crossSectionCanvas);

    $(".moveTerrainImage").fadeIn(750);

    setTimeout( () => {
      $(".moveTerrainImage").fadeOut(750);
    }, 5000)
  }

  if(!crossSectionCanvas.storage.isShowingPlan)
    viewer.zoomAll(scene, controls, renderer);
  else    
    viewer.zoomTop(scene, controls, renderer, 0.8);
}

function resetTerrainPosition(crossSectionCanvas) {
  if(crossSectionCanvas.storage.terrainObj != null){
    const { scene } = crossSectionCanvas.storage.viewer3d;

    let terrain = scene.children.filter(c => c.name === 'terrain')[0];
    let selectMesh = scene.children.filter(c => c.name === 'SelectMesh')[0];

    terrain.children.forEach(child => {
      let [x,y,z] = child?.originalPosition;
      child.position.set(x,y,z)
    })

    selectMesh.position.set(0,0,0);
  }
}

function updateTerrainOpacity (crossSectionCanvas, opacityVal) {
  if(crossSectionCanvas.storage.terrainObj != null){
    const { scene } = crossSectionCanvas.storage.viewer3d;

    let terrain = scene.children.filter(c => c.name === 'terrain')[0];
    terrain.children.forEach(child => {
      if (! child.material) {
        return;
      }
      if (opacityVal == null || opacityVal >= 1 || opacityVal < 0) {
        child.material.transparent = false;
        child.material.needsUpdate = true;
        return;
      }
      child.material.transparent = true;
      child.material.opacity = opacityVal;
      child.material.depthWrite = false;
      child.material.needsUpdate = true;
    })
  }
}

async function toggleAxisHelper(crossSectionCanvas, bool=false){
  const terrainObj = crossSectionCanvas.storage?.terrainObj;
  // removes it whether it's being added or not
  if (crossSectionCanvas.storage.terrainAxisHelper) {
    crossSectionCanvas.storage.terrainAxisHelper.removeFromParent();
    crossSectionCanvas.storage.terrainAxisHelper = null;
  }
  if (! terrainObj) {
    return;
  }
  if (bool) {
      const {scene, controls, renderer} = crossSectionCanvas.storage.viewer3d;

      crossSectionCanvas.storage.terrainAxisHelper = new THREE.AxesHelper(1);
      terrainObj.add(crossSectionCanvas.storage.terrainAxisHelper);

      if(!crossSectionCanvas.storage.isShowingPlan)
        viewer.zoomAll(scene, controls, renderer);
      else        
        viewer.zoomTop(scene, controls, renderer, 0.8);
  }
}

async function toggleSelectionMesh(crossSectionCanvas, bool=true){
  let { scene } = crossSectionCanvas.storage?.viewer3d;

  if(!crossSectionCanvas.storage.terrainObj || crossSectionCanvas.storage.terrainSettings.flatTerrain)
    return;

  if(!bool){
    crossSectionCanvas.storage.selectObj.visible = false;
  } else {
    crossSectionCanvas.storage.selectObj.visible = true;
  }
}

async function addTerrain(crossSectionCanvas) {
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Please wait ...';
  label.style.display = 'inline-block';
  label.style.color = '#8b0000';
  label.style.backgroundColor = '#fff5f5';

  const settings = JSON.parse(JSON.stringify(crossSectionCanvas.storage.terrainSettings));
  settings.radius = parseFloat(settings.radius);
  settings.lat = parseFloat(settings.lat);
  settings.lng = parseFloat(settings.lng);
  // settings.zoom = parseInt(settings.zoom);
  settings.opacity = parseFloat(settings.opacity);

  let results = null

  if(!settings.flatTerrain) {
    try {
      const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${settings.lat},${settings.lng}`)
      results = await response.json()
    } catch (err) {
      console.error(err)
    }
  }
  
  let z = 5, scalingFactor = 1;

  if(results !== null)
    z = results.results[0].elevation;

  if(crossSectionCanvas.storage.isShowingPlan && (settings.terrain == 'Solid Contours' || settings.terrain == 'Wireframe'))
    settings.terrain = 'Satellite';

  const terrain = await getTerrain(crossSectionCanvas.storage.viewer3d, settings);
  terrain.scale.set(1,1,1);
  let selectMesh = null;

  if (crossSectionCanvas.storage.viewer3d && terrain) {
    const { renderer, scene, camera, controls } = crossSectionCanvas.storage.viewer3d;

    // controls.enabled = false;
    if (crossSectionCanvas.storage.terrainObj) {
      scene.remove(crossSectionCanvas.storage.terrainObj);
      scene.remove(scene.children.filter(c => c.name === 'SelectMesh')[0]);
    }

    terrain.DefaultUp = new THREE.Vector3(0, 0, 1);

    terrain.rotateX(Math.PI * 1.5);
    terrain.position.set(0, 0, 0);
    terrain.name = 'terrain';

    if (terrain?.children?.length > 0) {

      const projection = tgeo.getProjection([settings.lat, settings.lng], settings.radius)
      const [x, y] = projection.proj([settings.lat, settings.lng])

      scalingFactor = crossSectionCanvas.storage.scaleIsFeet ? 0.3048*projection.unitsPerMeter : projection.unitsPerMeter
      let bGroup = new THREE.Group();

      crossSectionCanvas.storage.modelElevation = z*projection.unitsPerMeter;

      const children = scene.children ?? [];

      const newZ = z*projection.unitsPerMeter
      crossSectionCanvas.storage.positionMeshAddedAsSceneChildAfterTerrain = (child) => {
        child.position.set(x, newZ, -y);
        child.scale.set(scalingFactor, scalingFactor, scalingFactor);
      }
  
      children.forEach(async child => {
        if(child.name === 'Grid'){
          child.scale.set(scalingFactor, scalingFactor, scalingFactor);
          const sceneBBox = new THREE.Box3().setFromObject(bGroup);

          const [minX, minY, minZ] = sceneBBox.min.toArray();
          const sceneCenter = sceneBBox.min.add(sceneBBox.max).divideScalar(2);

          child.position.set(...(sceneCenter.toArray()));
          child.position.setComponent(1, minY);
          
          crossSectionCanvas.storage.gridElevation = child.position.y;
        } else {
          crossSectionCanvas.storage.positionMeshAddedAsSceneChildAfterTerrain(child);
          bGroup.add(child.clone());
        }
      });

      //Create the selection mesh
      let meshBbox = new THREE.Box3().setFromObject(terrain);
      const dimensions = new THREE.Vector3().subVectors(meshBbox.max, meshBbox.min);
      const meshGeo = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
      const matrix = new THREE.Matrix4().setPosition(new THREE.Vector3().addVectors(meshBbox.min, meshBbox.max).multiplyScalar(0.5));
      meshGeo.applyMatrix4(matrix);
      // meshGeo.matrixWorldNeedsUpdate = true;

      const meshGeoEdges = new THREE.EdgesGeometry(meshGeo);
      
      selectMesh = new THREE.LineSegments(
        meshGeoEdges,
        new THREE.LineBasicMaterial({ color: 0x808080 })
      );

      selectMesh.name = 'SelectMesh';
      selectMesh.position.set(terrain.position.x, terrain.position.y, terrain.position.z);
      
      scene.add(selectMesh);
    }

    terrain.children.forEach(child => {
      child.originalPosition = child.position.clone();
    })

    crossSectionCanvas.storage.terrainObj = terrain;
    crossSectionCanvas.storage.selectObj = selectMesh;

    if(settings.flatTerrain || crossSectionCanvas.storage.isShowingPlan)
      toggleFlatTerrain(crossSectionCanvas, true);
    
    scene.add(terrain);

    window['lineScalingFactor'] = scalingFactor*1000;
    window['updateLineThickness'](scene, crossSectionCanvas.storage.LineThickness*window['lineScalingFactor']);

    scene.scale.set(1000,1000,1000);

    renderer.render(scene, camera);

    if(!crossSectionCanvas.storage.isShowingPlan)
      viewer.zoomAll(scene, crossSectionCanvas.storage.viewer3d.controls, crossSectionCanvas.storage.viewer3d.renderer);
    else
      viewer.zoomTop(scene, crossSectionCanvas.storage.viewer3d.controls, crossSectionCanvas.storage.viewer3d.renderer, 0.8);

    selectMesh.visible = false;

    const drag = new DragControls([terrain], camera, renderer.domElement);
    const planarDrag = new DragControls([terrain], camera, renderer.domElement);

    drag.deactivate();
    planarDrag.deactivate();

    drag.addEventListener("dragstart", function (event) {
      controls.enabled = false;
      terrain.children.forEach((d) => {
        d.userData.startX = d.position.x;
        d.userData.startY = d.position.y;
        d.userData.startZ = d.position.z;
      });
    });

    drag.addEventListener("drag", function (event) {
      const z = event.object.position.z;
      const delta = z - event.object.userData.startZ;

      //idk why but this works
      if(crossSectionCanvas.storage.selectObj)
        crossSectionCanvas.storage.selectObj.position.y = event.object.position.z;

      terrain.children.forEach((d) => {
        d.position.x = d.userData.startX;
        d.position.y = d.userData.startY;
        d.position.z = d.userData.startZ + delta;
      });
    });

    drag.addEventListener("dragend", function (event) {
      controls.enabled = true;
    });

    planarDrag.addEventListener("dragstart", function (event) {
      controls.enabled = false;
      terrain.children.forEach((d) => {
        d.userData.startX = d.position.x;
        d.userData.startY = d.position.y;
        d.userData.startZ = d.position.z;
      });
    });

    planarDrag.addEventListener("drag", function (event) {
      const x = event.object.position.x;
      const y = event.object.position.y;
      // selectMesh.position.x = x;
      // selectMesh.position.y = y;

      const deltaX = x - event.object.userData.startX;
      const deltaY = y - event.object.userData.startY;

      //idk why but this works
      if(crossSectionCanvas.storage.selectObj) {
        crossSectionCanvas.storage.selectObj.position.x = event.object.position.x;
        crossSectionCanvas.storage.selectObj.position.z = -1*event.object.position.y;
      }

      terrain.children.forEach((d) => {
        d.position.z = d.userData.startZ;
        d.position.x = d.userData.startX + deltaX;
        d.position.y = d.userData.startY + deltaY;
      });
    });

    planarDrag.addEventListener("dragend", function (event) {
      controls.enabled = true;
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Shift") {
          drag.activate();
        }
        else if(e.key === "Alt"){
          planarDrag.activate();
        }
      },
      false
    );

    document.addEventListener(
      "keyup",
      function (e) {
        if (e.key === "Shift") {
          drag.deactivate();
          controls.enabled = true;
        }
        else if (e.key === "Alt") {
          planarDrag.deactivate();
          controls.enabled = true;
        }
      },
      false
    );

    document.addEventListener(
      "mouseout",
      function (e) {
        drag.deactivate();
        planarDrag.deactivate();
      },
      false
    )

    renderer.domElement.addEventListener("click", function (e) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const { renderer, camera, scene } = crossSectionCanvas.storage.viewer3d;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.near = 0;
      raycaster.far = 99999;
      const objects = scene.children;
      const recursive = true;
      const intersects = raycaster.intersectObjects(objects, recursive);
      
      if(intersects.length > 0)
        selectTerrain();
      else {
        const terrainPropertyGrid = crossSectionCanvas.storage?.rootElem?.querySelector(".propertyGridSelected");
        terrainPropertyGrid.innerHTML = '<div class="guidingText"><p>Click on any object to view properties</p></div>';
        const terrainTooltip = crossSectionCanvas.storage?.rootElem?.querySelector('.terrainTooltip');
        terrainTooltip?.classList?.add('hidden');

        if(crossSectionCanvas.storage.selectObj)
          crossSectionCanvas.storage.selectObj.visible = false;
      }
    });

    const selectTerrain = () => {
      crossSectionCanvas.openTerrainPropertyGrid();
      const terrainTooltip = crossSectionCanvas.storage?.rootElem?.querySelector('.terrainTooltip');
      terrainTooltip?.classList?.remove('hidden');

      if(crossSectionCanvas.storage.selectObj && window['showSelectionMesh'] && crossSectionCanvas.storage.terrainSettings.selectionMesh)
        crossSectionCanvas.storage.selectObj.visible = true;
    }
    
    toggleAxisHelper(crossSectionCanvas, crossSectionCanvas.storage.terrainAxisHelper);
    selectTerrain();
  }

  label.style.color = 'red';
  label.style.backgroundColor = 'white';
  label.style.display = 'none';
  spinner.style.display = 'none';
}

const menuItems = [
  {
    type: "int",
    id: "site_lat",
    field: "lat",
  },
  {
    type: "int",
    id: "site_lng",
    field: "lng",
  },
  {
    type: "int",
    id: "site_rad",
    field: "radius",
  },
  {
    type: "int",
    id: "site_zoom",
    field: "zoom",
  },
  {
    type: "str",
    field: "terrain",
    id: "site_terrain",
  },
];

function showContextMenuAt(crossSectionCanvas, top, left) {
  let el = d3.select("#right_click_menu");
  const settings = crossSectionCanvas.storage.terrainSettings;

  menuItems.forEach((d) => {
    const el = d3.select("#" + d.id).node();

    if (el && d.field) {
      el.value = settings[d.field];
    }
  });

  el.style("display", "block");
  el.style("left", left + "px");
  el.style("top", top + "px");

  el.select("#menu_submit_btn").on("click", function () {
    menuItems.forEach((d) => {
      const el = d3.select("#" + d.id).node();

      if (el && d.field) {
        const value = d.type === "int" ? +el.value : el.value;
        settings[d.field] = value;
      }
    });

    addTerrain(crossSectionCanvas);
    el.style("display", "none");
  });

  el.select("#menu_delete_btn").on("click", function () {
    const { scene } = crossSectionCanvas.storage.viewer3d;
    if (crossSectionCanvas.storage.terrainObj) {
      scene.remove(crossSectionCanvas.storage.terrainObj);
      crossSectionCanvas.storage.terrainObj = null;
      el.style("display", "none");
    }
  });

  el.select("#menu_close_btn").on("click", function () {
    el.style("display", "none");
  });

  el.select("#axis_helper_on").on("change", function () {
    const { scene } = crossSectionCanvas.storage.viewer3d;

    if (this.checked) {
      scene.add(axisHelper);
    } else {
      scene.remove(axisHelper);
    }
  });
}

function showContextMenu(event) {
  const top = event.detail.position.y;
  const left = event.detail.position.x;
  showContextMenuAt(top, left);
}

function hideContextMenu() {
  let el = d3.select("#right_click_menu");
  el.style("display", "none");
}

loadThree();

window['addTerrain'] = addTerrain;
window['toggleTerrain'] = toggleTerrain;
window['toggleAxisHelper'] = toggleAxisHelper;
window['showContextMenu'] = showContextMenu;
window['resetTerrainPosition'] = resetTerrainPosition;
window['toggleSelectionMesh'] = toggleSelectionMesh;
window['updateTerrainOpacity'] = updateTerrainOpacity;
window['calculateNumberOfTiles'] = calculateNumberOfTiles;
window['openPerfModal'] = openPerfModal;
window['toggleFlatTerrain'] = toggleFlatTerrain;