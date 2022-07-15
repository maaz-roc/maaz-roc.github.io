import * as jsonTo3d from "./json_to_3d.js";
import * as viewer from "./viewer.js";

$.fn.threeViewer = async function (jsonData, options, bool = true) {
  let rootElem = this[0];

  const defaultOnViewerProgress = (percent) => null;
  const onViewerProgress = options['onViewerProgress'] ?? defaultOnViewerProgress;
  onViewerProgress(0);

  const { mesh, minRealCoordinates } = await jsonTo3d.jsonToMesh(jsonData, options, bool);
  const scene = jsonTo3d.initialize3d();
  scene.add(mesh);
  onViewerProgress(20);

  const result = await new viewer.Viewer3D(scene, minRealCoordinates, rootElem, options);
  const { renderer, camera } = result;
  const result2 = viewer.initializeEventListeners(
    result,
    jsonData
  );
  Object.keys(result2).forEach(key => {
    result[key] = result2[key];
  })

  return result;
};
