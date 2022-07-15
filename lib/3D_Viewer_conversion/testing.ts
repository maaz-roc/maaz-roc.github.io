import * as THREE from "./node_modules/three/build/three.module.js";
import * as jsonTo3d from "./json_to_3d.js";
import * as viewer from "./viewer.js"

// function showBorehole(boreholesData) {
//   const scene = initialize3d();
    
//   const boreholeMeshes = boreholesData.map(boreholeData => {
//     const boreholeMesh = jsonTo3d.boreholeTo3dFromData(boreholeData);
//     return boreholeMesh;
//   })
//   boreholeMeshes.forEach(boreholeMesh => {
//     scene.add(boreholeMesh);
//   })
// }

async function fetchJson(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
}

async function exportExample() {
  const materialsDict = await jsonTo3d.initializeMaterialsDict({...jsonTo3d.defaultOptions});
  let font = await jsonTo3d.initializeFont("./node_modules/three/examples/fonts/helvetiker_regular.typeface.json")
  let options = {...jsonTo3d.defaultOptions, materialsDict : materialsDict, font: font};

  const jsons = await Promise.all([
    fetchJson('./SampleBoreholes.json'),
    fetchJson('./Section Test Dec 5.json'),
    fetchJson('./RocPlane Example 1.json'),
  ])
  const [boreholesData, crossSectionData, rocPlaneData] = jsons;
  
  const scene = await jsonTo3d.initializeSceneFromBoreholesData(boreholesData, options);
  
  const polygonMeshes = jsonTo3d.crossSectionTo3dFromData(crossSectionData, options);
  const minRealCoordinates = jsonTo3d.moveMeshesCloserToOrigin(polygonMeshes);
  polygonMeshes.forEach(polygonMesh => {
      scene.add(polygonMesh);
  })

  const rocPlaneMesh = jsonTo3d.rocPlaneTo3dFromData(rocPlaneData, options);
  scene.add(rocPlaneMesh);
  const viewer3d = new viewer.Viewer3D(scene, minRealCoordinates, document.body, options);
  viewer.initializeEventListeners(viewer3d, rocPlaneData);

  jsonTo3d.exportToGLTF(scene);
}

// showBorehole(sampleBoreholes);
exportExample();