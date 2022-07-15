var THREE = window['THREE'];
import * as viewer from "./lib/3D_Viewer_conversion/viewer.js";
import { DragControls } from "./lib/3D_Viewer_conversion/lib/three-controls/DragControls.js";

const loadThree = async () => {
  window['THREE'] = await import(
    "./lib/3D_Viewer_conversion/node_modules/three/build/three.module.js"
  );
  THREE = window['THREE']
};

function resetMapPosition (crossSectionCanvas) {
  let map = crossSectionCanvas.storage.mapObj;
  map.position.set(map.originalPosition.x, map.originalPosition.y, map.originalPosition.z);
}

async function updateMapOpacity (crossSectionCanvas, opacity) {
  const { scene } = crossSectionCanvas.storage.viewer3d;

  scene.children.forEach(c => {
    if(c.name === 'map') {
        let material = c.material;

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
  })
}

async function getGoogleMap (scene, lat, lng, terraintype, zoom, crossSectionCanvas) {
    const googleApiBaseURL = 'https://maps.googleapis.com/maps/api/staticmap?';
    const googleApiKey = 'AIzaSyAhmHm1_bdQ--9M2WZtNNooPshjHjWpEIU';
  
    const grid = scene.children.filter(c => c.name === 'Grid')[0];
  
    if(!grid)
      return;
  
    let maxX = null, minX = null, maxY = null, minY = null;
  
    grid.children[0].traverse(c => {
      if(c.type === 'Mesh' || c.type === 'Group') {
        if(c.text) {
  
          let val = parseFloat(c.text.replace(/,/g, ''));
    
          if(c.axis === 'X'){
            if(maxX === null) {
              maxX = val;
              minX = val;
            } else {
              if(val > maxX)
                maxX = val;
              else if(val < minX)
                minX = val;
            }
          } else {
            if(maxY === null) {
              maxY = val;
              minY = val;
            } else {
              if(val > maxY)
                maxY = val;
              else if(val < minY)
                minY = val;
            }
          }
  
        }
      }
    })
  
    if(maxX === null || minX === null  || maxY === null  || minY === null )
      return;

    //calculations based on the following https://medium.com/techtrument/how-many-miles-are-in-a-pixel-a0baf4611fff
  
    let siteEW = (Math.abs(maxX) - Math.abs(minX)) * 0.3048;
    let siteSN = (Math.abs(maxY) - Math.abs(minY)) * 0.3048;
  
    let site_EW_px =  Math.round(650*siteEW/Math.max(siteEW, siteSN));
    let site_NS_px = Math.round(650*siteSN/Math.max(siteEW, siteSN));

    //Max pixels returned by google api
    if(site_EW_px > 640)
      site_EW_px = 640;

    if(site_NS_px > 640)
      site_NS_px = 640;

    let image_pxm = site_EW_px/siteEW;
    let image_zoom_level_raw = Math.log2(156543.03392 * Math.cos(lat * Math.PI / 180) * image_pxm);
    let imageZoom = Math.floor(image_zoom_level_raw);

    //Max zoom
    if(imageZoom > 21)
      imageZoom = 21;

    //Don't need for now
    // let image_correct_EW_px = site_EW_px*imageZoom/image_zoom_level_raw;
    // let image_correct_NS_px = site_NS_px*imageZoom/image_zoom_level_raw;

    let image_ft_per_px = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, imageZoom) * 3.28084;
  
    const center = `center=${lat}, ${lng}`;
    const siteZoom = `&zoom=${imageZoom}`;
    const scale = `&scale=2`;
    const size = `&size=${site_EW_px}x${site_NS_px}`;
    const maptype = `&maptype=${terraintype}`;
    const format = '&format=png';
    const visRefresh = `&visual_refresh=true`;
    const apiKey = `&key=${googleApiKey}`;
  
    const fetchUri = encodeURI(googleApiBaseURL + center + siteZoom + scale + size + maptype + format + visRefresh + apiKey);
  
    async function toDataURL(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    }
  
    await toDataURL(fetchUri, function(dataUrl) {
      const loader = new THREE.TextureLoader(); 
      const material = new THREE.MeshBasicMaterial({
        map: loader.load(dataUrl),
        side: THREE.DoubleSide
      });
  
      //Scale and position image
      var geometry = new THREE.PlaneGeometry(image_ft_per_px*site_EW_px, image_ft_per_px*site_NS_px);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI*3/2;
      mesh.position.set(grid.position.x,grid.position.y-5,grid.position.z);
      mesh.name = 'map';
      mesh.originalPosition = mesh.position.clone();
  
      scene.add(mesh);
      crossSectionCanvas.storage.mapObj = mesh;

      const { renderer, camera, controls } = crossSectionCanvas.storage.viewer3d;
      const planarDrag = new DragControls([mesh], camera, renderer.domElement);
      planarDrag.deactivate();

      planarDrag.addEventListener("dragstart", function (event) {
        controls.enabled = false;
        mesh.children.forEach((d) => {
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

        mesh.children.forEach((d) => {
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
          if(e.key === "Alt"){
            planarDrag.activate();
          }
        },
        false
      );

      document.addEventListener(
        "keyup",
        function (e) {
          if (e.key === "Alt") {
            planarDrag.deactivate();
            controls.enabled = true;
          }
        },
        false
      );

      document.addEventListener(
        "mouseout",
        function (e) {
          planarDrag.deactivate();
        },
        false
      )
    })
}

async function addMap(crossSectionCanvas){
  let spinner = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFile');
  spinner.style.display = 'inline-block';

  let label = crossSectionCanvas.storage.rootElem?.querySelector('.exportingFileText');
  label.innerText = 'Please wait ...';
  label.style.display = 'inline-block';
  label.style.color = '#8b0000';
  label.style.backgroundColor = '#fff5f5';

  const terrainTooltip = crossSectionCanvas.storage?.rootElem?.querySelector('.terrainTooltip');
  terrainTooltip?.classList?.remove('hidden');

  const {scene, controls, renderer} = crossSectionCanvas.storage.viewer3d;
  const settings = JSON.parse(JSON.stringify(crossSectionCanvas.storage.mapSettings));

  settings.lat = parseFloat(settings.lat);
  settings.lng = parseFloat(settings.lng);
  settings.zoom = parseInt(settings.zoom)

  if(crossSectionCanvas.storage.mapObj) {
    scene.children.forEach(child => {
      if(child.name === 'map') {
        scene.remove(child);        
      } 
    })
  }

  let terrainType = 'satellite';

  switch(settings.terrain) {
    case "Satellite":
        terrainType = 'satellite';
        break;
    case "Street Map":
      terrainType = 'roadmap'
      break;
    case 'Street Map (with contours)':
      terrainType = 'terrain'
      break;
  }

  await getGoogleMap(scene, settings.lat, settings.lng, terrainType, settings.zoom, crossSectionCanvas).then(() => {
    crossSectionCanvas.openMapPropertyGrid();
  
    spinner.style.display = 'none';
    label.style.display = 'none';
  })

  // const meshGeometry = new THREE.PlaneGeometry(1000,1000);

  // const layerMesh = new THREE.Mesh(meshGeometry);
  // let texture = new THREE.TextureLoader().load('../../Hatch_Files/PNG/Texture/BH_TOP.png');
  // texture.repeat.set(100,100);
  // layerMesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  // layerMesh.position.set(0,0,0)
  // scene.add(layerMesh)

}

async function toggleMap(crossSectionCanvas) {
    const {scene, controls, renderer} = crossSectionCanvas.storage.viewer3d;

    if (crossSectionCanvas.storage.mapObj != null) {
        crossSectionCanvas.storage.isShowingMap = false;
        crossSectionCanvas.storage.mapObj = null;

        for( let i = scene.children.length - 1; i >= 0; i--) {           
          if(scene.children[i].name === 'map') {
            scene.remove(scene.children[i]);        
          }  
        }
    
        window['lineScalingFactor'] = 1;
        window['updateLineThickness'](scene, 2);

        const mapPropertyGrid = crossSectionCanvas.storage?.rootElem?.querySelector(".propertyGridSelected");
        mapPropertyGrid.innerHTML = '<div class="guidingText"><p>Click on any object to view properties</p></div>';
        const terrainTooltip = crossSectionCanvas.storage?.rootElem?.querySelector('.terrainTooltip');
        terrainTooltip?.classList?.add('hidden');
    }
    else {
        crossSectionCanvas.storage.isShowingMap = true;
        await addMap(crossSectionCanvas);
    }
    viewer.zoomAll(scene, controls, renderer, 1.05, true);
}

loadThree();

window['toggleMap'] = toggleMap;
window['addMap'] = addMap;
window['updateMapOpacity'] = updateMapOpacity;
window['resetMapPosition'] = resetMapPosition;