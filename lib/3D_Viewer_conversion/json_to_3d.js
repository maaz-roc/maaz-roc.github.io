import * as THREE from "./node_modules/three/build/three.module.js";
// I copied it from the three project and modified it because it couldn't import "three"
import * as GLTFExporter from './lib/three-exporters/GLTFExporter.js';
import * as OBJExporter from './lib/three-exporters/OBJExporter.js';
import * as STLExporter from './lib/three-exporters/STLExporter.js';
import * as ColladaExporter from './lib/three-exporters/ColladaExporter.js';
import * as SVGLoader from './lib/three-loaders/SVGLoader.js';
import * as FontLoader from './lib/three-loaders/FontLoader.js';
import * as TextGeometry from './lib/three-geometries/TextGeometry.js';
import { Line2 } from './lib/lines/Line2.js';
import { LineMaterial } from './lib/lines/LineMaterial.js';
import { LineGeometry } from './lib/lines/LineGeometry.js';
import { LineSegments2 } from './lib/lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lib/lines/LineSegmentsGeometry.js';
import * as Flatten from './node_modules/@flatten-js/core/dist/main.esm.js';
import { radToDeg, degToRad, floatsEqual, floatsLess, eps } from "./helperFunctions.js";
import * as MeshLine from "./lib/three.meshline/src/THREE.MeshLine.js";
import { Text } from './node_modules/troika-three-text/dist/troika-three-text.esm.js';
var renderOrder;
(function (renderOrder) {
    renderOrder[renderOrder["polygons"] = 10] = "polygons";
    renderOrder[renderOrder["lineEdges"] = 11] = "lineEdges";
    renderOrder[renderOrder["waterSymbols"] = 12] = "waterSymbols";
    renderOrder[renderOrder["interrogationPoint"] = 13] = "interrogationPoint";
})(renderOrder || (renderOrder = {}));
const colors = [
    "Black",
    "Blue",
    "Brown",
    "Cyan",
    "Green",
    "Lime",
    "Magenta",
    "Maroon",
    "Red",
    "Yellow"
];
const oldColorToHexDict = {
    Black: '000000',
    Red: 'ff0000',
    Lime: '00ff00',
    Green: '008000',
    Blue: '0000ff',
    Cyan: '00ffff',
    Yellow: 'ffff00',
    Magenta: 'ff00ff',
    Brown: '8b4513',
    Maroon: '800000',
};
const defaultTextureFilenames = [
    "Hatch_Files/PNG/Soil/000000/CH.png",
    "Hatch_Files/PNG/Soil/000000/CL-ML.png",
    "Hatch_Files/PNG/Soil/000000/CL.png",
    "Hatch_Files/PNG/Soil/000000/FL.png",
    "Hatch_Files/PNG/Soil/000000/GC-GM.png",
    "Hatch_Files/PNG/Soil/000000/GC.png",
    "Hatch_Files/PNG/Soil/000000/GM.png",
    "Hatch_Files/PNG/Soil/000000/GP-GC.png",
    "Hatch_Files/PNG/Soil/000000/GP-GM.png",
    "Hatch_Files/PNG/Soil/000000/GP.png",
    "Hatch_Files/PNG/Soil/000000/GW-GC.png",
    "Hatch_Files/PNG/Soil/000000/GW-GM.png",
    "Hatch_Files/PNG/Soil/000000/GW.png",
    "Hatch_Files/PNG/Soil/000000/MH.png",
    "Hatch_Files/PNG/Soil/000000/ML.png",
    "Hatch_Files/PNG/Soil/000000/OH.png",
    "Hatch_Files/PNG/Soil/000000/OL.png",
    "Hatch_Files/PNG/Soil/000000/PEAT.png",
    "Hatch_Files/PNG/Soil/000000/SC.png",
    "Hatch_Files/PNG/Soil/000000/SC-SM.png",
    "Hatch_Files/PNG/Soil/000000/SM.png",
    "Hatch_Files/PNG/Soil/000000/SP.png",
    "Hatch_Files/PNG/Soil/000000/SP-SC.png",
    "Hatch_Files/PNG/Soil/000000/SP-SM.png",
    "Hatch_Files/PNG/Soil/000000/SW.png",
    "Hatch_Files/PNG/Soil/000000/SW-SC.png",
    "Hatch_Files/PNG/Soil/000000/SW-SM.png",
    "Hatch_Files/PNG/Soil/000000/TILL.png",
    "Hatch_Files/PNG/Soil/000000/TS.png",
    "Hatch_Files/PNG/Misc/000000/Asphalt.png",
    "Hatch_Files/PNG/Misc/000000/Bentonite.png",
    "Hatch_Files/PNG/Misc/000000/Concrete.png",
    "Hatch_Files/PNG/Misc/000000/Earth.png",
    "Hatch_Files/PNG/Rock/000000/Anhydrite.png",
    "Hatch_Files/PNG/Rock/000000/Basaltic_Flows.png",
    "Hatch_Files/PNG/Rock/000000/Breccia.png",
    "Hatch_Files/PNG/Rock/000000/Chalk.png",
    "Hatch_Files/PNG/Rock/000000/Coal.png",
    "Hatch_Files/PNG/Rock/000000/Conglomerate.png",
    "Hatch_Files/PNG/Rock/000000/Diamicton.png",
    "Hatch_Files/PNG/Rock/000000/Dolomite.png",
    "Hatch_Files/PNG/Rock/000000/Gneiss.png",
    "Hatch_Files/PNG/Rock/000000/Granite.png",
    "Hatch_Files/PNG/Rock/000000/Gypsum.png",
    "Hatch_Files/PNG/Rock/000000/Igneous_Rock.png",
    "Hatch_Files/PNG/Rock/000000/Limestone.png",
    "Hatch_Files/PNG/Rock/000000/Loess.png",
    "Hatch_Files/PNG/Rock/000000/Marble.png",
    "Hatch_Files/PNG/Rock/000000/Mudstone.png",
    "Hatch_Files/PNG/Rock/000000/Oil_Shale.png",
    "Hatch_Files/PNG/Rock/000000/Porphyritic_Rock.png",
    "Hatch_Files/PNG/Rock/000000/Quartz.png",
    "Hatch_Files/PNG/Rock/000000/Quartzite.png",
    "Hatch_Files/PNG/Rock/000000/Rock_Salt.png",
    "Hatch_Files/PNG/Rock/000000/Salt.png",
    "Hatch_Files/PNG/Rock/000000/Sandstone.png",
    "Hatch_Files/PNG/Rock/000000/Schist.png",
    "Hatch_Files/PNG/Rock/000000/Serpentine.png",
    "Hatch_Files/PNG/Rock/000000/Shale.png",
    "Hatch_Files/PNG/Rock/000000/Siltstone.png",
    "Hatch_Files/PNG/Rock/000000/Slate.png",
    "Hatch_Files/PNG/Rock/000000/Soapstone.png",
    "Hatch_Files/PNG/Rock/000000/Tuff.png",
    "Hatch_Files/PNG/Rock/000000/Zeolitic_Rock.png",
    "Hatch_Files/PNG/BSAS/000000/Clay.png",
    "Hatch_Files/PNG/BSAS/000000/Clay_Gravel.png",
    "Hatch_Files/PNG/BSAS/000000/Clay_Sand.png",
    "Hatch_Files/PNG/BSAS/000000/CobblesBoulders.png",
    "Hatch_Files/PNG/BSAS/000000/Gravel.png",
    "Hatch_Files/PNG/BSAS/000000/Sand.png",
    "Hatch_Files/PNG/BSAS/000000/Silt.png",
    "Hatch_Files/PNG/Texture/Base.png",
    "Hatch_Files/PNG/Texture/Water.png",
    "Hatch_Files/PNG/Texture/Wedge.png",
    "Hatch_Files/PNG/Texture/BH_TOP.png",
    "Hatch_Files/compass.svg",
].map(filePath => {
    const defaultColor = '000000';
    if (!(filePath.includes(defaultColor))) {
        return [filePath];
    }
    return colors.map(color => {
        const hex = oldColorToHexDict[color];
        if (hex) {
            return filePath.replace(defaultColor, hex);
        }
        return '';
    });
}).flat();
const defaultBoreholeOptions = {
    boreholeRadius: 1
};
export const defaultOptions = {
    boreholeOptions: defaultBoreholeOptions,
    textureFilenames: defaultTextureFilenames,
    hatchFilesArr: [],
    materialsDict: {},
    hatchColorsDict: {},
    hatchRepeat: 2,
    font: null,
    textSize: 1,
    textOffset: 2,
    // PS: https://threejs.org/docs/#api/en/materials/LineBasicMaterial
    // Due to limitations of the OpenGL Core Profile with the WebGL renderer
    // on most platforms linewidth will always be 1 regardless of the set value.
    // this will throw a "invalid width" error on three.js
    // we use another line implementation to be able to set linewidth
    lineThickness: 0.5,
    lineStyleScale: 1,
    lineColor: 0x000000,
    lineVisible: true,
    arrowLength: 10,
    arrowConeHeight: 3,
    arrowConeRadius: 0.5,
    onCrossSectionProgress: percent => null,
    interrogationPointFontSize: 1.4,
};
function getUnitConversionFactor(fromUnit, toUnit) {
    if (fromUnit == toUnit) {
        return 1;
    }
    return toUnit == 'ft' ? 3.28084 : 1 / 3.28084;
}
/*
Rules
- Display unit is disregarded, and coordinate unit is used directly
For example, if the coordinate of an object is (1, 1, 1), it'll be displayed at (1, 1, 1) instead of being converted to the display unit
And if the coordinate unit is for example ft, and we'll assume 1 3D length equals 1 ft
- However, the data received might be written in a specific display unit
In that case, we need to know the display unit to be able to find the correct coordinates in the coordinate unit
- If depth unit != coordinate unit, we have to adapt the borehole depth points
*/
function getDepthToCoordinateUnitFactor(crossSectionData) {
    if (!crossSectionData.ProjectDepth_Unit || !crossSectionData.Coordinates_Unit) {
        return 1;
    }
    return getUnitConversionFactor(crossSectionData.ProjectDepth_Unit, crossSectionData.Coordinates_Unit);
}
function getDisplayToCoordinateUnitFactor(crossSectionData) {
    if (!crossSectionData.Unit || !crossSectionData.Coordinates_Unit) {
        return 1;
    }
    return getUnitConversionFactor(crossSectionData.Unit, crossSectionData.Coordinates_Unit);
}
async function initializeTextures(textureFilenames = defaultTextureFilenames, options = defaultOptions) {
    const textureLoader = new THREE.TextureLoader();
    const texturesPromises = textureFilenames.map(filename => {
        const promise = new Promise((resolve, reject) => {
            const onLoad = (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                if ('hatchRepeat' in options) {
                    texture.repeat.set(options.hatchRepeat, options.hatchRepeat);
                }
                // texture.image.src = filename + '';
                texture.needsUpdate = true;
                resolve(texture);
            };
            const onError = (something) => reject();
            textureLoader.load(filename, onLoad, null, onError);
        });
        return promise;
    });
    return Promise.all(texturesPromises);
}
const defaultReflectivity = 1.0;
const defaultShininess = 30;
function initializeMaterials(textures) {
    const materials = textures.map(texture => new THREE.MeshPhongMaterial({
        map: texture,
        shininess: defaultShininess,
        specular: 0xffffff,
        // transparent: true
    }));
    materials.forEach(material => {
        material.side = THREE.DoubleSide;
    });
    return materials;
}
function getDashSize(lineThickness, lineStyleScale) {
    lineStyleScale = Math.max(lineStyleScale, 0);
    // the equivalent scale won't look the same in 2D and 3D
    // because in 3D the section is longer than in 2D
    // but overall, lineStyleScale of 50 with line thickness of 2 in 2D will mean a dash every ~12 feet in any horizontal/vertical scale
    // line thickness of 1 will mean lineStyleScale of 25 is a 12 feet dash
    // apparently the real value is about 1/4 of that
    // if we want to replicate the length, we arrive at
    const dashSize = 1 / 4 * parseFloat(lineThickness) * 12 * (parseFloat(lineStyleScale) / 25);
    return dashSize;
}
function getLineMaterial(lineProperties, options = defaultOptions) {
    // we ignore the lineProperties.lineThickness since webgl doesn't support it and use the default instead
    const lineThickness = parseFloat((lineProperties.lineThickness ?? options.lineThickness));
    const dashSize = getDashSize(lineThickness, options.lineStyleScale);
    const color = lineProperties.color ?? options.lineColor;
    let material;
    if (lineProperties.lineStyle == "Dash") {
        material = new THREE.LineDashedMaterial({
            color: color,
            linewidth: options.lineThickness,
            dashSize: dashSize,
            gapSize: dashSize,
        });
    }
    else if (lineProperties.lineStyle == "Dot") {
        material = new THREE.LineDashedMaterial({
            color: color,
            linewidth: options.lineThickness,
            dashSize: options.lineThickness,
            gapSize: options.lineThickness,
        });
    }
    else {
        material = new THREE.LineBasicMaterial({ color: color, linewidth: options.lineThickness });
    }
    return material;
}
function getMeshLineDashSize(lineThickness, lineStyleScale) {
    lineStyleScale = Math.max(lineStyleScale, 0);
    // the equivalent scale won't look the same in 2D and 3D
    // because in 3D the section is longer than in 2D
    // but overall, lineStyleScale of 50 with line thickness of 2 in 2D will mean a dash every ~12 feet in any horizontal/vertical scale
    // line thickness of 1 will mean lineStyleScale of 25 is a 12 feet dash
    // apparently the real value is about 1/4 of that
    // if we want to replicate the length, we arrive at
    const dashSize = 0.005 * parseFloat(lineThickness) * parseFloat(lineStyleScale);
    return dashSize;
}
function getMeshLineMaterial(lineProperties, options = defaultOptions) {
    const lineThickness = parseFloat((lineProperties.lineThickness ?? options.lineThickness));
    const dashSize = getMeshLineDashSize(lineThickness, options.lineStyleScale);
    const color = lineProperties.color ?? options.lineColor;
    let material;
    if (lineProperties.lineStyle == "Dash") {
        material = new MeshLine.MeshLineMaterial({
            color: color,
            linewidth: lineThickness,
            dashArray: dashSize
        });
    }
    else if (lineProperties.lineStyle == "Dot") {
        material = new MeshLine.MeshLineMaterial({
            color: color,
            linewidth: lineThickness,
            dashArray: dashSize
        });
    }
    else {
        material = new MeshLine.MeshLineMaterial({ color: color, linewidth: lineThickness });
    }
    return material;
}
export const line2ThicknessFactor = 0.1;
// the equivalent scale won't look the same in 2D and 3D
// because in 3D the section is longer than in 2D
// but overall, lineStyleScale of 5 with line thickness of 10 in 2D will mean a dash every ~6 feet in any horizontal/vertical scale
// then we try to replicate the same in 2d, using a polygon orthogonal with the axis so the length is the same
const line2DashSizeFactor = 0.125;
export function getLine2DashSize(lineThickness, lineStyleScale) {
    lineStyleScale = Math.max(lineStyleScale, 0);
    const dashSize = line2DashSizeFactor * parseFloat(lineThickness) * parseFloat(lineStyleScale);
    return dashSize;
}
function getLine2Material(lineProperties, options = defaultOptions) {
    const lineThickness = parseFloat((lineProperties.lineThickness ?? options.lineThickness));
    const dashSize = getLine2DashSize(lineThickness, options.lineStyleScale);
    const color = lineProperties.color ?? options.lineColor;
    let material;
    if (lineProperties.lineStyle == "Dash") {
        material = new LineMaterial({
            color: color,
            worldUnits: 100,
            linewidth: line2ThicknessFactor * lineThickness,
            dashSize: dashSize,
            gapSize: dashSize,
        });
        material.defines.USE_DASH = ""; // displays dash
    }
    else if (lineProperties.lineStyle == "Dot") {
        material = new LineMaterial({
            color: color,
            worldUnits: 100,
            linewidth: line2ThicknessFactor * lineThickness,
            dashSize: line2ThicknessFactor * lineThickness,
            gapSize: line2ThicknessFactor * lineThickness,
        });
        material.defines.USE_DASH = ""; // displays dash
    }
    else {
        material = new LineMaterial({
            color: color,
            worldUnits: 100,
            linewidth: line2ThicknessFactor * lineThickness
        });
    }
    // enables use of world unit instead of px
    // without world units, the line becomes leaner as you zoom in and no longer has dotted appearance
    material.defines.WORLD_UNITS = "100";
    return material;
}
function create3dEdgesLineSegments(geometry, angle = 60, lineProperties, options = defaultOptions) {
    const edges = new THREE.EdgesGeometry(geometry, angle);
    const material = getLineMaterial(lineProperties, options);
    const line = new THREE.LineSegments(edges, material);
    line.computeLineDistances();
    return line;
}
// returns a line object corresponding to the geometry edges
function create3dEdgesMeshLine(geometry, angle = 60, lineProperties, options = defaultOptions) {
    const edges = new THREE.EdgesGeometry(geometry, angle);
    const material = getMeshLineMaterial(lineProperties, options);
    material.depthTest = false;
    material.transparent = true;
    // material.renderOrder = 10;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    const line = new MeshLine.MeshLine();
    line.setPoints(geometry.getAttribute("position").array, p => 1);
    const mesh = new THREE.Mesh(line, material);
    console.log(line, material, mesh);
    return mesh;
}
// returns a line object corresponding to the geometry edges
function create3dEdgesLine2(geometry, angle = 60, lineProperties, options = defaultOptions) {
    const edges = new THREE.EdgesGeometry(geometry, angle);
    const lineGeometry = new LineSegmentsGeometry();
    lineGeometry.setPositions(edges.getAttribute("position").array);
    const material = getLine2Material(lineProperties, options);
    // material.depthTest = false;
    // material.depthWrite = false;
    material.transparent = true;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -20;
    material.renderOrder = renderOrder.lineEdges;
    material.needsUpdate = true;
    if (lineProperties.opacity != null && floatsLess(lineProperties.opacity, 1)) {
        material.opacity = lineProperties.opacity;
    }
    const line = new LineSegments2(lineGeometry, material);
    line.computeLineDistances();
    return line;
}
function create3dEdges(geometry, angle = 60, lineProperties, options = defaultOptions) {
    const mesh = create3dEdgesLine2(geometry, angle, lineProperties, options);
    mesh.name = 'edgeLines';
    return mesh;
}
function layerTo3d(layer, options = defaultOptions, bool = true) {
    const layerHeight = (layer.from - layer.to);
    const layerGeometry = new THREE.CylinderGeometry(options.boreholeOptions.boreholeRadius, options.boreholeOptions.boreholeRadius, layerHeight);
    const layerMesh = new THREE.Mesh(layerGeometry);
    if (bool) {
        const hatchColorsDict = options.hatchColorsDict ?? {};
        const hatchColor = layer.hatchSymbol in hatchColorsDict ? hatchColorsDict[layer.hatchSymbol] : '000000';
        const materialsDictKey = getMaterialDictKey(hatchColor, layer.hatchSymbol ?? '');
        if (layer.hatchSymbol && materialsDictKey in options.materialsDict) {
            // we clone the material and texture and change repetition so it doesn't stretch
            const material = options.materialsDict[materialsDictKey].clone();
            const texture = material.map.clone();
            const textureWidth = texture.image.width;
            const textureHeight = texture.image.height;
            const meshWidth = 2 * Math.PI * options.boreholeOptions.boreholeRadius;
            const meshHeight = Math.abs(layerHeight);
            const repeatX = options.hatchRepeat * 100 * meshWidth / textureWidth;
            const repeatY = options.hatchRepeat * 100 * meshHeight / textureHeight;
            texture?.repeat?.set(repeatX, repeatY);
            // without it, the cloned texture won't show
            texture.needsUpdate = true;
            material.map = texture;
            // some textures have transparency and I want their background to be white instead of black
            const whiteMaterial = createColorMaterial(0xffffff);
            const materialArr = [whiteMaterial, material];
            layerGeometry.clearGroups();
            layerGeometry.addGroup(0, Infinity, 0);
            layerGeometry.addGroup(0, Infinity, 1);
            // layerMesh.material = materialArr;
            layerMesh.material = material;
        }
        if (layerMesh.material) {
            if (layer.opacity != null && floatsLess(layer.opacity, 1)) {
                layerMesh.material.transparent = true;
                layerMesh.material.depthWrite = false;
                layerMesh.material.opacity = layer.opacity;
            }
        }
    }
    else {
        let texture = new THREE.TextureLoader().load('../../Hatch_Files/PNG/Texture/BH_TOP.png');
        texture.repeat.set(1, 1);
        layerMesh.material = new THREE.MeshBasicMaterial({ map: texture });
    }
    layerMesh.geometry.computeVertexNormals();
    const layerGroup = new THREE.Group();
    layerGroup.add(layerMesh);
    if (options.lineVisible) {
        const line = create3dEdges(layerGeometry, 60, { lineStyle: "Solid", opacity: layer.opacity }, options);
        layerGroup.add(line);
    }
    return layerGroup;
}
export async function initializeFont(fontPath) {
    const fontPromise = new Promise((resolve, reject) => {
        const fontLoader = new FontLoader.FontLoader();
        fontLoader.load(fontPath, (font) => {
            resolve(font);
        });
    });
    return fontPromise;
}
export function textTo3d(text, options = defaultOptions, color = 0x000000, size = 100, useTroikaLib = false, outline = false) {
    return textGenerator(options, color, useTroikaLib, outline)(text, size);
}
// when you need to generate multiple texts, better performance than textTo3d because use same material
export function textGenerator(options = defaultOptions, color = 0x000000, useTroikaLib = false, outline = false) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: color });
    // default height is 100
    // a textSize of 1 corresponds to a scale of 0.01 and a real size of 1
    const scale = options.textSize / 100;
    function generateText(text, size = 100) {
        let textMesh = null;
        if (useTroikaLib) {
            textMesh = new Text();
            textMesh.text = text;
            textMesh.fontSize = size;
            textMesh.color = color;
            if (outline) {
                textMesh.outlineColor = "white";
                textMesh.outlineWidth = "20%";
            }
            textMesh?.geometry?.center();
        }
        else {
            const textGeometry = new TextGeometry.TextGeometry(text, {
                font: options.font,
                height: 0,
                size: size
            });
            textGeometry.text = text;
            textGeometry.center();
            textMesh = new THREE.Mesh(textGeometry, textMaterial);
        }
        textMesh.name = "text";
        textMesh.scale.set(scale, scale, scale);
        return textMesh;
    }
    return generateText;
}
function generate3dPlane(width, height, color = 0xffffff) {
    if (width < 0 || height < 0) {
        return null;
    }
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    return plane;
}
export const defaultTextWithBackgroundOptions = {
    fontSize: 48,
    fontFamily: "sans-serif",
    color: "#000000",
    backgroundColor: "#ffffff",
    borderHeightPercent: 0.2,
    centralize: true,
    opacity: 1,
    width: -1,
    height: -1
};
function getWordWrappedLines(context, text, fitWidth, font) {
    if (fitWidth <= 0) {
        return [text];
    }
    const existingLines = text.split('\n');
    const lines = [];
    existingLines.forEach(line => {
        var words = line.split(' ');
        var currentLine = 0;
        var index = 1;
        while (words.length > 0 && index <= words.length) {
            var str = words.slice(0, index).join(' ');
            context.font = font;
            var w = context.measureText(str).width;
            if (w > fitWidth) {
                if (index == 1) {
                    index = 2;
                }
                lines.push(words.slice(0, index - 1).join(' '));
                currentLine++;
                words = words.splice(index - 1);
                index = 1;
            }
            else {
                index++;
            }
        }
        if (index > 0) {
            lines.push(words.join(' '));
        }
    });
    return lines;
}
export function textTo3dWithBackground(text, options, textOptions = defaultTextWithBackgroundOptions) {
    textOptions = { ...defaultTextWithBackgroundOptions, ...textOptions };
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.position = "absolute";
    canvas.style.left = "-9999px";
    canvas.style.top = "-9999px";
    canvas.style.zIndex = "9999";
    const font = `${parseFloat(textOptions.fontSize + '')}px ${textOptions.fontFamily}`;
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const lineHeight = ctx.measureText('M').width;
    const border = lineHeight * (1 + textOptions.borderHeightPercent);
    const lines = getWordWrappedLines(ctx, text, textOptions.width, font);
    const numberOfLines = lines.length;
    const lineMetrics = lines.map(line => {
        ctx.font = font;
        const textMetrics = ctx.measureText(line);
        return textMetrics;
    });
    const lineWidths = lineMetrics.map(x => x?.width ?? 0);
    const maxWidth = Math.max(...lineWidths);
    ctx.canvas.width = maxWidth + border;
    ctx.canvas.height = lineHeight * numberOfLines + border;
    // i have to set it again because apparently everything changes after setting width and height
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textOptions.backgroundColor;
    ctx.strokeStyle = textOptions.backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const centerX = ctx.canvas.width / 2;
    lines.forEach((line, index) => {
        ctx.fillStyle = textOptions.color;
        ctx.strokeStyle = textOptions.color;
        const textX = textOptions.centralize ? centerX : border / 2 + lineWidths[index] / 2;
        const textY = border + lineHeight * index;
        ctx.fillText(line, textX, textY);
    });
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });
    if (floatsLess(textOptions.opacity, 1)) {
        material.transparent = true;
        material.depthWrite = false;
        material.opacity = textOptions.opacity;
    }
    if (ctx.canvas.width < 0 || ctx.canvas.height < 0) {
        return null;
    }
    const planeHeight = 3;
    const planeWidth = planeHeight * ctx.canvas.width / ctx.canvas.height;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const backgroundMesh = new THREE.Mesh(geometry, material);
    if (!backgroundMesh) {
        return null;
    }
    // canvas.remove();
    backgroundMesh.name = 'sectionNameBackground dontFixTextureWhenScaling';
    const group = new THREE.Group();
    group.add(backgroundMesh);
    // group.add(textMesh);
    group.name = 'sectionName';
    return group;
}
function boreholeTo3d(borehole, options = defaultOptions, size = 100, bool = true) {
    const boreholeGroup = new THREE.Group();
    if (!borehole?.layers?.length) {
        return null;
    }
    const layersMeshes = borehole.layers.map(layer => {
        const layerMesh = layerTo3d(layer, options, bool);
        // I want the center of the cylinder to be in the position
        // corresponding to the center of the layer
        layerMesh.position.y = (-layer.from - layer.to) / 2;
        return layerMesh;
    });
    layersMeshes.forEach(layer => {
        boreholeGroup.add(layer);
    });
    const [x, y, z] = borehole.coordinates;
    if ('name' in borehole && 'font' in options) {
        const fontSize = borehole.titleFontSize * 4 ?? size ?? 100;
        const textMesh = textTo3d(borehole.name, options, 0x000000, fontSize, !bool, !bool);
        if (bool)
            textMesh.position.y = fontSize / 100 + options.textSize / 2;
        else {
            textMesh.position.z = fontSize / 100 + options.textSize / 2 - options.boreholeOptions.boreholeRadius - 2;
        }
        boreholeGroup.add(textMesh);
    }
    if (borehole.waterDepth && borehole.waterDepth != -9999) {
        const waterSymbol = generateWaterSymbolMesh(options);
        waterSymbol.position.y = -borehole.waterDepth;
        waterSymbol.traverse(obj => {
            if (obj?.material) {
                obj.material.depthTest = false;
                obj.material.transparent = true;
                obj.material.renderOrder = renderOrder.waterSymbols;
            }
        });
        waterSymbol.name = (waterSymbol.name ?? '') + 'toBeRotated';
        boreholeGroup.add(waterSymbol);
    }
    // usually objects are moved by the center
    // but the borehole group is moved by the top of hte boreohle
    // const centerY = y - borehole.depth / 2;
    boreholeGroup.position.set(x, y, z);
    boreholeGroup.name = `borehole ${borehole.name ?? 'undefined'}`;
    return boreholeGroup;
}
function coordinatesToArr(str) {
    let [x, z, y] = str.split(',').map(x => parseFloat(x));
    let coordinates = [x, y, -z];
    return coordinates;
}
export function boreholeTo3dFromData(boreholeData, options = defaultOptions, size = 100) {
    let lastLayerTo = 0;
    const layers = boreholeData.th_layers.map(layerData => {
        const from = layerData.layer_from ?? lastLayerTo ?? 0;
        const dict = {
            from: from,
            to: layerData.layer_to ?? from,
            hatchSymbol: layerData.layer_symbol ?? ''
        };
        lastLayerTo = dict.to;
        return dict;
    });
    let coordinates = coordinatesToArr(boreholeData.th_viewer_coordinates ?? boreholeData.th_coordinates);
    const borehole = {
        layers: layers,
        coordinates: coordinates,
        depth: boreholeData.th_depth,
        name: boreholeData.th_title ?? ''
    };
    const boreholeMesh = boreholeTo3d(borehole, options, size);
    return boreholeMesh;
}
// the point position is calculated taking two boreholes as reference, both in the crossSection and in 3d
// we have to consider that the crossSection is actually seeing a diagonal plane between two boreholes, and then the coordinates aren't really correct
function crossSectionCoordinateTo3D(boreholeCoordinates1, boreholeCoordinates2, boreholeCoordinates2d1, boreholeCoordinates2d2, crossSectionCoordinate) {
    const [x, y] = crossSectionCoordinate;
    const [b1x, b1y, b1z] = boreholeCoordinates1;
    const [b2x, b2y, b2z] = boreholeCoordinates2;
    // find the position of the point in relation to the two boreholes
    const [b1x2d, b1y2d] = boreholeCoordinates2d1;
    const [b2x2d, b2y2d] = boreholeCoordinates2d2;
    const dx2d = b2x2d - b1x2d;
    if (dx2d == 0) {
        return [0, 0, 0];
    }
    const ratio = (x - b1x2d) / dx2d;
    // find the equivalent
    const dx = b2x - b1x;
    const dz = b2z - b1z;
    const newX = b1x + dx * ratio;
    const newZ = b1z + dz * ratio;
    // y at 15, borehole at 10, therefore y at 5 in relation to borehole
    const relativeY2d = y - b1y2d;
    // actual y borehole coordinate, add the difference
    const newY = b1y + relativeY2d;
    return [newX, newY, newZ];
}
function uniqArrOfArrs(arr) {
    let set = new Set(arr.map(JSON.stringify));
    let arr2 = Array.from(set).map((x) => JSON.parse(x));
    return arr2;
}
function polygonToShape(polygonPoints) {
    const uniqPoints = uniqArrOfArrs(polygonPoints);
    if (uniqPoints.length < 2) {
        return null;
    }
    const points = [...uniqPoints, uniqPoints[0]];
    const vectors = points.map(p => {
        const [x, y] = p;
        return new THREE.Vector2(x, y);
    });
    const shape = new THREE.Shape(vectors);
    return shape;
}
// make the texture fill the polygon properly
export function calculateBestTextureScale(texture, hatchRepeat = 1) {
    const textureWidth = texture.image?.width ?? 1;
    const textureHeight = texture.image?.height ?? 1;
    // apparently for shapegeometry, the textures are tiled every 1 meter
    // so for example, 2x2 tiling means 2x2 textures inside a 1 by 1 meter square
    // therefore, I need to divide 1 meter by the texture size to tile correctly
    const scaling = 100 / textureHeight;
    // prevent stretching
    const ratio = textureHeight / textureWidth;
    const repeatX = scaling * ratio * hatchRepeat;
    const repeatY = scaling * hatchRepeat;
    return { repeatX: repeatX, repeatY: repeatY };
}
function materialToPolygonMaterial(polygonMaterial, options = defaultOptions) {
    const material = polygonMaterial.clone();
    const texture = material.map.clone();
    // prevent stretching
    const { repeatX, repeatY } = calculateBestTextureScale(texture, options.hatchRepeat);
    texture?.repeat?.set(repeatX, repeatY);
    // without it, the cloned texture won't show
    texture.needsUpdate = true;
    material.map = texture;
    return material;
}
function polygonTo3d(polygon, hatchColorsDict = {}, options = defaultOptions) {
    const uniqPoints = uniqArrOfArrs(polygon.points);
    if (uniqPoints.length < 2) {
        return null;
    }
    const shape = polygonToShape(polygon.points);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.center();
    let polygonMaterial = createColorMaterial('#' + polygon.patternColor ?? 0xdddddd);
    const hatchColor = polygon.hatchSymbol in hatchColorsDict ? hatchColorsDict[polygon.hatchSymbol] : '000000';
    const materialsDictKey = getMaterialDictKey(hatchColor, polygon.hatchSymbol ?? '');
    if (polygon.hatchSymbol && materialsDictKey in options.materialsDict) {
        const material = options.materialsDict[materialsDictKey].clone();
        const newMaterial = materialToPolygonMaterial(material, options);
        geometry.clearGroups();
        geometry.addGroup(0, Infinity, 0);
        geometry.addGroup(0, Infinity, 1);
        // polygonMaterial = materialArr;
        polygonMaterial = newMaterial;
    }
    if (floatsLess(polygon.opacity, 1)) {
        polygonMaterial.transparent = true;
        polygonMaterial.depthTest = false;
        polygonMaterial.opacity = polygon.opacity;
    }
    const mesh = new THREE.Mesh(geometry, polygonMaterial);
    mesh.name = 'polygon';
    const group = new THREE.Group();
    group.add(mesh);
    if (options.lineVisible) {
        const line = create3dEdges(geometry, 60, { lineStyle: polygon.lineStyle, opacity: polygon.opacity }, options);
        group.add(line);
    }
    group.userData = { dictTest: 'something' };
    return group;
}
// function polygonTo3dFromData(polygonData, options = defaultOptions) {
//     const points = polygonData.points.map(point => {
//         return [point.x, point.correct_yz];
//     })
//     // the boreholes are not in a straight line
//     // identify between which of the two boreholes the polygon is
//     // attach the points that connect to a borehole
//     // 
//     const hatchSymbol = filenameToSymbol(polygonData.fsrc);
//     const polygon = {
//         points: points,
//         hatchSymbol : hatchSymbol
//     }
//     const mesh = polygonTo3d(polygon, options);
//     return mesh;
// }
function getPolygonCenter(points) {
    const pointsX = points.map(point => point[0]);
    const leftmostX = Math.min(...pointsX);
    const rightmostX = Math.max(...pointsX);
    const pointsY = points.map(point => point[1]);
    const bottommostY = Math.min(...pointsY);
    const topmostY = Math.max(...pointsY);
    const polygonCenterX = (leftmostX + rightmostX) / 2;
    const polygonCenterY = (bottommostY + topmostY) / 2;
    const polygonCenter = [polygonCenterX, polygonCenterY];
    return polygonCenter;
}
function getMeshCenter(mesh) {
    mesh.geometry.computeBoundingBox();
    const vector = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(vector);
    return vector;
}
function floatsLessEqual(f1, f2, precision = eps) {
    return floatsEqual(f1, f2, precision) || floatsLess(f1, f2, precision);
}
function positionOfBoreholesInRelationToPolygon(points, boreholesData) {
    // identify between which of the two boreholes the polygon is
    // cases: between two, left of first, right of last, intercepting one
    const pointsX = points.map(point => point[0]);
    const leftmostX = Math.min(...pointsX);
    const rightmostX = Math.max(...pointsX);
    const interceptingPolygon = [];
    const toTheLeftOfPolygon = [];
    const toTheRightOfPolygon = [];
    boreholesData.forEach(boreholeData => {
        const boreholeX = boreholeData.general.x;
        if (floatsLessEqual(boreholeX, leftmostX)) {
            toTheLeftOfPolygon.push(boreholeData);
        }
        else if (floatsLessEqual(rightmostX, boreholeX)) {
            toTheRightOfPolygon.push(boreholeData);
        }
        else {
            interceptingPolygon.push(boreholeData);
        }
    });
    return [toTheLeftOfPolygon, toTheRightOfPolygon, interceptingPolygon];
}
function compareBoreholePosition(borehole1, borehole2) {
    const coordinates1 = coordinatesToArr(borehole1.general.th_viewer_coordinates);
    const coordinates2 = coordinatesToArr(borehole2.general.th_viewer_coordinates);
    const [x1, z1, y1] = coordinates1;
    const [x2, z2, y2] = coordinates2;
    if (x1 < x2) {
        return -1;
    }
    if (x1 > x2) {
        return 1;
    }
    if (z1 < z2) {
        return -1;
    }
    if (z1 > z2) {
        return 1;
    }
    return 0;
}
function rotateMeshHorizontally(mesh, rotationVector) {
    const initialVector = new THREE.Vector3(1, 0, 0);
    // rotation in relation to initial rotation of polygon
    let yAxisEulerRotation = initialVector.angleTo(rotationVector);
    // let yAxisEulerRotation = initialNormalVector.angleTo(normalVector);
    // the rotation is from the X axis going to the south
    // the angle calculated is always positive, so I have to make it negative myself
    if (rotationVector.z > 0) {
        yAxisEulerRotation = -yAxisEulerRotation;
    }
    const euler = new THREE.Euler(0, yAxisEulerRotation, 0);
    // mesh.geometry.center();
    mesh.setRotationFromEuler(euler);
}
function positionPolygonMesh(mesh, points, boreholesData) {
    if (mesh == null) {
        return mesh;
    }
    // not enough boreholes to establish a plane
    if (boreholesData.length < 2) {
        return mesh;
    }
    // const boreholesData = boreholesData.sort(compareBoreholePosition)
    // console.log('sorted', boreholesData)
    let polygonPosition = [0, 0, 0];
    let directionVector = new THREE.Vector3();
    const pointsX = points.map(point => point[0]);
    const leftmostX = Math.min(...pointsX);
    const rightmostX = Math.max(...pointsX);
    const [toTheLeftOfPolygon, toTheRightOfPolygon, interceptingPolygon] = positionOfBoreholesInRelationToPolygon(points, boreholesData);
    if (interceptingPolygon.length > 1) {
        console.log("Error: there shouldn't be any boreholes intercepting the split polygons", interceptingPolygon);
    }
    let boreholeToTheLeft = null;
    if (toTheLeftOfPolygon.length > 0) {
        boreholeToTheLeft = toTheLeftOfPolygon.reduce((prev, current) => {
            const xDistancePrev = Math.abs(prev.general.x - leftmostX);
            const xDistanceCurrent = Math.abs(current.general.x - leftmostX);
            if (floatsLess(xDistancePrev, xDistanceCurrent)) {
                return prev;
            }
            return current;
        });
    }
    let boreholeToTheRight = null;
    if (toTheRightOfPolygon.length > 0) {
        boreholeToTheRight = toTheRightOfPolygon.reduce((prev, current) => {
            const xDistancePrev = Math.abs(prev.general.x - rightmostX);
            const xDistanceCurrent = Math.abs(current.general.x - rightmostX);
            if (floatsLess(xDistancePrev, xDistanceCurrent)) {
                return prev;
            }
            return current;
        });
    }
    // boreholes that define polygon plane
    let borehole1 = boreholeToTheLeft;
    let borehole2 = boreholeToTheRight;
    if (!boreholeToTheLeft) {
        borehole1 = boreholeToTheRight;
        const index = boreholesData.findIndex(borehole => borehole == borehole1);
        borehole2 = boreholesData[index + 1];
    }
    else if (!boreholeToTheRight) {
        borehole2 = boreholeToTheLeft;
        const index = boreholesData.findIndex(borehole => borehole == borehole2);
        borehole1 = boreholesData[index - 1];
    }
    // if (compareBoreholePosition(borehole1, borehole2) > 0) {
    //     let temp = borehole2;
    //     borehole2 = borehole1;
    //     borehole1 = temp;
    // }
    const polygonCenter = getPolygonCenter(points);
    const coordinates1 = coordinatesToArr(borehole1.general.th_viewer_coordinates);
    const coordinates2 = coordinatesToArr(borehole2.general.th_viewer_coordinates);
    const coordinates2d1 = [borehole1.general.x, borehole1.general.z];
    const coordinates2d2 = [borehole2.general.x, borehole2.general.z];
    polygonPosition = crossSectionCoordinateTo3D(coordinates1, coordinates2, coordinates2d1, coordinates2d2, polygonCenter);
    const v1 = new THREE.Vector3(...coordinates1);
    const v2 = new THREE.Vector3(...coordinates2);
    directionVector = new THREE.Vector3().subVectors(v2, v1);
    directionVector.y = 0;
    let rotationVector = directionVector.clone();
    rotationVector = rotationVector.normalize();
    rotateMeshHorizontally(mesh, rotationVector);
    mesh.position.set(...polygonPosition);
    return mesh;
}
function flattenJsPolygonToPoints(polygon) {
    const points = polygon.vertices.map(vertice => {
        return [vertice.x, vertice.y];
    });
    return points;
}
function cutPolygonsAtBoreholes(points, boreholesData) {
    // identify between which of the two boreholes the polygon is
    // cases: between two, left of first, right of last, intercepting one
    const [toTheLeftOfPolygon, toTheRightOfPolygon, interceptingPolygon] = positionOfBoreholesInRelationToPolygon(points, boreholesData);
    let polygonsPoints = [points];
    // the boreholes are not necessarily in a straight line
    // if borehole intercepts, we split the polygon into many
    if (interceptingPolygon.length > 0) {
        interceptingPolygon.forEach(boreholeData => {
            const p1x = boreholeData.general.x;
            const p1y = -9000;
            const p2x = boreholeData.general.x;
            const p2y = +9000;
            const p1 = [p1x, p1y];
            const p2 = [p2x, p2y];
            const pt1 = new Flatten.Point(...p1);
            const pt2 = new Flatten.Point(...p2);
            const line = new Flatten.Line(pt1, new Flatten.Vector(1, 0));
            let newPolygons = [];
            for (let i = 0; i < polygonsPoints.length; i += 1) {
                const currentPoints = polygonsPoints[i];
                // if line segment
                if (currentPoints.length == 2) {
                    const pts = currentPoints.map(p => new Flatten.Point(...p));
                    const segment = new Flatten.Segment(...pts);
                    const intersection = segment.intersect(line);
                    let currentSegments = [];
                    if (intersection && intersection.length > 0) {
                        currentSegments = segment.split(intersection[0]).map(s => {
                            return flattenJsPolygonToPoints(s);
                        });
                    }
                    newPolygons.push(...currentSegments);
                    continue;
                }
                // if polygon
                const poly = new Flatten.Polygon(currentPoints);
                // https://observablehq.com/@alexbol99/cut-polygon-with-line
                const intersectingPoints = line.intersect(poly);
                const intersectingPoints_sorted = line.sortPoints(intersectingPoints);
                const multiline = new Flatten.Multiline([line]).split(intersectingPoints_sorted);
                const polys = poly.cut(multiline);
                const currentPolygons = polys.map(poly => {
                    return flattenJsPolygonToPoints(poly);
                });
                newPolygons.push(...currentPolygons);
            }
            polygonsPoints = newPolygons;
        });
    }
    return polygonsPoints;
}
function generateWaterSymbolMesh(options = defaultOptions) {
    const iconLinesKeypoints = [
        [-0.8, -0.8, 0.8, -0.8],
        [0, 0, -0.8, -0.8],
        [0, 0, 0.8, -0.8],
        [-0.8, 0, 0.8, 0],
        [-0.5, 0.4, 0.5, 0.4],
        [-0.2, 0.8, 0.2, 0.8]
    ];
    const color = 0x0000ff;
    const symbolSize = options?.boreholeOptions?.boreholeRadius * 1.25 ?? 1.25;
    // recalculates center and centralizes it so it can be positioned properly
    const material = new THREE.LineBasicMaterial({ color: color });
    const meshes = iconLinesKeypoints.map(segmentPoints => {
        const [x1, y1, x2, y2] = segmentPoints.map(x => x * symbolSize);
        const p1 = new THREE.Vector3(x1, -y1);
        const p2 = new THREE.Vector3(x2, -y2);
        const points = [p1, p2];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const mesh = new THREE.Line(geometry, material);
        return mesh;
    });
    const group = new THREE.Group();
    meshes.forEach(mesh => {
        group.add(mesh);
    });
    group.name = 'waterSymbol';
    return group;
}
// water symbols are all the same, clones the mesh instead of generating from scratch every time
function waterSymbolMeshGenerator(options = defaultOptions) {
    const mesh = generateWaterSymbolMesh(options);
    return () => {
        return mesh.clone();
    };
}
function textTo3dWithBackgroundDoubleSided(text, options = defaultOptions, textOptions = defaultTextWithBackgroundOptions, horizontalOffset = 0.1) {
    const mesh1 = textTo3dWithBackground(text, options, textOptions);
    const mesh2 = textTo3dWithBackground(text, options, textOptions);
    if (!mesh1) {
        return null;
    }
    rotateMeshHorizontally(mesh2, new THREE.Vector3(-1, 0, 0));
    mesh1.position.set(0, 0, horizontalOffset);
    mesh2.position.set(0, 0, -horizontalOffset);
    const group = new THREE.Group();
    group.add(mesh1);
    group.add(mesh2);
    return group;
}
function cloneObject(obj) {
    /* Receives a javascript object, returns a clone of it. Object must contain only javascript primitives and basic objects, such as strings, numbers, arrays and objects. */
    return JSON.parse(JSON.stringify(obj));
}
// function copied from CrossSectionCanvas.js
function getInterrogationPositions({ segments, interrogationType, AX, AY, precision, horAxisTickDistance }) {
    const quantityDict = {
        "Single": 1,
        "Double": 2,
        "Pattern": 4
    };
    const interrogationPositions = segments.map(segment => {
        segment[0].correct_x = segment[0].xx ?? segment[0].x;
        segment[1].correct_x = segment[1].xx ?? segment[1].x;
        const middleX = AX * (segment[0].correct_x + segment[1].correct_x) / 2;
        const middleY = -AY * (segment[0].correct_yz + segment[1].correct_yz) / 2;
        const middle = [middleX, middleY];
        if (interrogationType == "Segment") {
            return [middle];
        }
        const sorted = segment.sort((a, b) => {
            if (floatsEqual(a.correct_x, b.correct_x, precision)) {
                if (a.y == b.y) {
                    return 0;
                }
                if (a.y < b.y) {
                    return -1;
                }
                return 1;
            }
            if (floatsLess(a.correct_x, b.correct_x, precision)) {
                return -1;
            }
            return 1;
        });
        const [leftPoint, rightPoint] = sorted;
        const dx = rightPoint.correct_x - leftPoint.correct_x;
        if (floatsEqual(dx, 0, precision)) {
            return [middle];
        }
        const dy = rightPoint.correct_yz - leftPoint.correct_yz;
        const ratio = dy / dx;
        const quantity = quantityDict[interrogationType] ?? 0;
        const distanceInterval = horAxisTickDistance;
        const subInterval = distanceInterval / quantity;
        const divided = leftPoint.correct_x / subInterval;
        const first = floatsEqual(divided, Math.round(divided), precision) ? Math.round(divided) * subInterval : Math.ceil(divided) * subInterval;
        const xPositions = [];
        let current = first;
        if (!subInterval || Number.isNaN(subInterval)) {
            return [middle];
        }
        while (floatsLess(current, rightPoint.correct_x, precision) || floatsEqual(current, rightPoint.correct_x, precision)) {
            xPositions.push(current);
            current = current + subInterval;
        }
        if (xPositions.length <= 0) {
            return [middle];
        }
        const positions = xPositions.map(x => {
            const y = leftPoint.correct_yz + ratio * (x - leftPoint.correct_x);
            return [AX * x, -AY * y];
        });
        return positions;
    });
    return interrogationPositions;
}
// function copied from CrossSectionCanvas.js
function getPolygonInterrogationPositionDicts({ polygons, polygonProperties, AX, AY, precision, horAxisTickDistance }) {
    if (!polygons) {
        return [];
    }
    return polygons.map(d => {
        const timestamp = d?.timestamp;
        const properties = polygonProperties[timestamp];
        if (!properties || !properties.interrogation || properties.interrogation == "(none)") {
            return [];
        }
        const points = JSON.parse(JSON.stringify(d.points));
        const segments = [];
        for (let i = 1; i < points.length; i += 1) {
            segments.push([points[i - 1], points[i]]);
        }
        segments.push([points[points.length - 1], points[0]]);
        const notBoreholeSegments = segments.filter(segment => {
            return !(segment[0]?.bhname && segment[1]?.bhname && segment[0]?.bhname == segment[1]?.bhname);
        });
        const interrogationPositions = getInterrogationPositions({
            segments: notBoreholeSegments,
            interrogationType: properties.interrogation,
            AX: AX,
            AY: AY,
            precision: precision,
            horAxisTickDistance: horAxisTickDistance,
        }) ?? [];
        const interrogationPositionsDicts = interrogationPositions.map(positions => {
            const dict = {
                positions: positions,
                timestamp: timestamp
            };
            return dict;
        }) ?? [];
        return interrogationPositionsDicts;
    }).flat();
}
// function copied from CrossSectionCanvas.js
// interrogationPointKey is there because this function can also find the position for water symbols
function getWaterlineInterrogationPositionsDicts({ interrogationPointKey = "interrogation", lines, AX, AY, precision, horAxisTickDistance, lineProperties, linkProperties }) {
    const interrogationPositionsDicts = lines.map(d => {
        const timestamp = d?.timestamp;
        let properties = lineProperties[d?.timestamp];
        if (d?.water) {
            properties = linkProperties[d?.timestamp];
        }
        if (!properties || !properties[interrogationPointKey] || properties[interrogationPointKey] == "(none)") {
            return [];
        }
        const segments = [cloneObject([d.point1, d.point2])];
        const interrogationPositions = getInterrogationPositions({
            segments: segments,
            interrogationType: properties[interrogationPointKey],
            AX: AX,
            AY: AY,
            precision: precision,
            horAxisTickDistance: horAxisTickDistance,
        }) ?? [];
        const interrogationPositionsDicts = interrogationPositions.map(positions => {
            const dict = {
                positions: positions,
                timestamp: timestamp
            };
            return dict;
        }) ?? [];
        return interrogationPositionsDicts;
    }).flat();
    return interrogationPositionsDicts;
}
function interrogationPositionsDictsTo3D(interrogationPositionsDicts, boreholesData, options = defaultOptions) {
    const allMeshes = [];
    interrogationPositionsDicts.forEach(dict => {
        const { positions, timestamp } = dict;
        positions.forEach(position => {
            const [x, y] = position;
            const mesh = textTo3d('?', options, '#000000');
            mesh.name = 'interrogationPoint';
            if (!mesh) {
                return;
            }
            if (mesh.material) {
                mesh.material.depthTest = false;
                mesh.material.transparent = true;
                mesh.material.renderOrder = renderOrder.interrogationPoint;
            }
            positionPolygonMesh(mesh, [[x, -y]], boreholesData);
            allMeshes.push(mesh);
        });
    });
    return allMeshes;
}
// aux function to crossSectionTo3dFromData
// matching the polygons to the borehole points will be done later
function convertToCoordinateUnit(crossSectionData) {
    if (!crossSectionData) {
        return crossSectionData;
    }
    const depthToCoordinateUnitFactor = getDepthToCoordinateUnitFactor(crossSectionData);
    const displayToCoordinateUnitFactor = getDisplayToCoordinateUnitFactor(crossSectionData);
    const correctPoint = point => {
        if (!point) {
            return;
        }
        ['xx', 'correct_yz'].forEach(key => {
            if (!point[key]) {
                return;
            }
            point[key] = parseFloat(point[key]) * displayToCoordinateUnitFactor;
        });
    };
    crossSectionData.POLYGONS?.forEach(polygon => {
        polygon?.points?.forEach(point => {
            correctPoint(point);
        });
    });
    crossSectionData.data?.forEach(borehole => {
        borehole.soillayer?.forEach(sl => {
            if (!sl) {
                return;
            }
            sl.from = sl.from * depthToCoordinateUnitFactor;
            sl.to = sl.to * depthToCoordinateUnitFactor;
        });
        borehole.ally?.forEach(ally => {
            correctPoint(ally);
        });
    });
    const links = crossSectionData.LINKS ?? [];
    const lines = crossSectionData.lines ?? [];
    const allLines = [...links, ...lines];
    allLines.forEach(line => {
        if (!line) {
            return;
        }
        correctPoint(line.point1);
        correctPoint(line.point2);
    });
}
// this function assumes the boreholes have already been drawn
// since the data doesn't contain the 3d coordinates of the borehole
export function crossSectionTo3dFromData(crossSectionData, options = defaultOptions, bool = true, size = 100) {
    crossSectionData = cloneObject(crossSectionData);
    convertToCoordinateUnit(crossSectionData);
    // const points = [];
    // const referenceBorehole1;
    // const referenceBorehole2;
    // const correctedPoints = points.map(point => {
    //     if (point.bhname) {
    //     }
    // })
    // const pointsThatMatchBorehole = points.filter(point => point.bhname);
    options.onCrossSectionProgress(0);
    const boreholesData = [...crossSectionData.data].sort((borehole1, borehole2) => {
        return borehole1.general.x - borehole2.general.x;
    });
    const boreholeProperties = crossSectionData.boreholeProperties ?? {};
    const boreholes = boreholesData.map(boreholeData => {
        if (!boreholeData?.soillayer || boreholeData.soillayer.length <= 0) {
            return null;
        }
        const timestamp = boreholeData.soillayer[0].timestamp;
        const properties = boreholeProperties[timestamp];
        const layers = boreholeData.soillayer.map(layerData => {
            const layer = {
                from: layerData.from,
                to: layerData.to,
                hatchSymbol: layerData.layerSymbol
            };
            if (properties?.transparency != null) {
                layer.opacity = properties.transparency;
            }
            return layer;
        });
        const coordinates = coordinatesToArr(boreholeData.general.th_viewer_coordinates);
        const depth = layers[layers.length - 1].to - layers[0].from;
        const borehole = {
            coordinates: coordinates,
            layers: layers,
            depth: depth,
            name: boreholeData.name ?? ''
        };
        if (properties?.transparency != null) {
            borehole.opacity = properties?.transparency;
        }
        if (properties?.fontSize) {
            borehole.titleFontSize = parseFloat(properties?.fontSize);
        }
        if (boreholeData?.general?.water && bool) {
            borehole.waterDepth = parseFloat(boreholeData.general.water);
        }
        return borehole;
    }).filter(x => x);
    const hatchColorsDict = crossSectionData.hatchColors ?? {};
    const newOptions = { ...options, hatchColorsDict };
    let textSize = 100;
    let minX = boreholes[0].coordinates[0], maxX = boreholes[0].coordinates[0], maxZ = boreholes[0].coordinates[2], minZ = boreholes[0].coordinates[2];
    boreholes.forEach(b => {
        if (b.coordinates[0] > maxX)
            maxX = b.coordinates[0];
        else if (b.coordinates[0] < minX)
            minX = b.coordinates[0];
        if (b.coordinates[2] > maxZ)
            maxZ = b.coordinates[2];
        if (b.coordinates[2] < minZ)
            minZ = b.coordinates[2];
    });
    textSize = (maxX - minX) * (maxZ - minZ) * 0.001 + 141.5; //From testing
    const boreholeMeshes = bool ? boreholes.map(borehole => boreholeTo3d(borehole, newOptions)) : boreholes.map(borehole => boreholeTo3d(borehole, newOptions, textSize, bool));
    options.onCrossSectionProgress(25);
    const sectionNameMeshes = [];
    for (let i = 0; i < boreholes.length - 1; i++) {
        const coords1 = boreholes[i].coordinates;
        const coords2 = boreholes[i + 1].coordinates;
        const v1 = new THREE.Vector3(...coords1);
        const v2 = new THREE.Vector3(...coords2);
        const yOffset = options.textOffset + options.textSize / 2;
        const horizontalOffset = 0.1;
        const textPosition = new THREE.Vector3().addVectors(v1, v2).divideScalar(2).add(new THREE.Vector3(0, yOffset, 0));
        let rotationVector1 = new THREE.Vector3().subVectors(v2, v1).normalize();
        let rotationVector2 = rotationVector1.clone().negate();
        const sectionName = crossSectionData.title ?? 'Section';
        const newOptions = { ...options, textSize: options.textSize * 1.2 };
        const textOptions = {
            ...defaultTextWithBackgroundOptions,
            color: "#ffffff",
            backgroundColor: "#e35305",
        };
        const group = textTo3dWithBackgroundDoubleSided(sectionName, newOptions, textOptions, horizontalOffset);
        if (!group) {
            continue;
        }
        group.position.set(...(textPosition.toArray()));
        rotateMeshHorizontally(group, rotationVector1);
        sectionNameMeshes.push(group);
    }
    options.onCrossSectionProgress(50);
    const boreholesDictEntries = crossSectionData.data.map(boreholeData => {
        const name = boreholeData.name;
        return [name, boreholeData];
    });
    const boreholesDict = Object.fromEntries(boreholesDictEntries);
    const polygonsData = crossSectionData.POLYGONS;
    const polygonMeshes = polygonsData.map(polygonData => {
        const points = polygonData.points.map(point => {
            let x = point.x;
            let y = point.correct_yz;
            // attach the points that connect to a borehole
            if (point.bhname && boreholesDict[point.bhname]) {
                const boreholeData = boreholesDict[point.bhname];
                x = boreholeData.general.x;
            }
            return [x, y];
        });
        const polygonsPoints = cutPolygonsAtBoreholes(points, boreholesData);
        const hatchSymbol = filenameToSymbol(polygonData.fsrc);
        const polygonPropertiesDict = crossSectionData.polygonProperties ?? {};
        const properties = polygonPropertiesDict[polygonData.timestamp] ?? {};
        const polygons = polygonsPoints.map(polygonPoints => {
            const polygon = {
                points: polygonPoints,
                hatchSymbol: hatchSymbol,
                lineStyle: properties.lineStyle,
                fillStyle: properties.fillStyle,
                patternColor: properties.patternColor,
                opacity: parseFloat(properties.transparency ?? 1),
                interrogation: properties.interrogation
            };
            return polygon;
        });
        const meshes = polygons.map(polygon => {
            const mesh = polygonTo3d(polygon, hatchColorsDict, options);
            if (!mesh) {
                return null;
            }
            mesh.name = `polygonGroup${polygonData.timestamp}`;
            positionPolygonMesh(mesh, polygon.points, boreholesData);
            return mesh;
        });
        return meshes;
    })
        .flat()
        // some meshes might not be able to be generated
        .filter(x => x);
    options.onCrossSectionProgress(75);
    const waterlineData = bool ? crossSectionData?.LINKS ?? [] : [];
    const lineData = crossSectionData?.lines ?? [];
    const waterlineProperties = bool ? crossSectionData.linkProperties ?? {} : {};
    const lineProperties = crossSectionData.lineProperties ?? {};
    const linesData = [...lineData, ...waterlineData];
    const linesProperties = { ...lineProperties, ...waterlineProperties };
    const waterLinkMeshes = bool ? linesData.map(linkData => {
        if (!linkData) {
            return null;
        }
        const pointsData = [linkData.point1, linkData.point2];
        const points = pointsData.map(pointData => {
            if (!pointData) {
                return null;
            }
            const x = pointData.x;
            const y = pointData.correct_yz ?? pointData.yz;
            if (x == null || y == null) {
                return null;
            }
            return [x, y];
        }).filter(x => x);
        if (points.length < 2) {
            return null;
        }
        const timestamp = linkData.timestamp;
        const properties = linesProperties[timestamp] ?? {};
        const defaultColor = linkData.water ? 0x0000aa : 0x000000;
        const color = properties.lineColor ?? defaultColor;
        const segments = cutPolygonsAtBoreholes(points, boreholesData);
        const meshes = [];
        segments.forEach(segment => {
            for (let i = 1; i < segment.length; i++) {
                const pointsArr = [segment[i - 1], segment[i]];
                const points = pointsArr.map(point => new THREE.Vector3(...point));
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                // recalculates center and centralizes it so it can be positioned properly
                geometry.center();
                const lineGeometry = new LineGeometry();
                lineGeometry.setPositions(geometry.getAttribute("position").array);
                const material = getLine2Material({
                    lineStyle: properties.lineStyle,
                    lineThickness: properties.strokeWidth ?? options.lineThickness,
                    color: properties.lineColor
                }, options);
                material.depthTest = false;
                material.transparent = true;
                material.opacity = properties.transparency;
                material.polygonOffset = true;
                material.polygonOffsetFactor = -1;
                const line = new Line2(lineGeometry, material);
                line.computeLineDistances();
                const group = new THREE.Group();
                group.add(line);
                positionPolygonMesh(group, pointsArr, boreholesData);
                meshes.push(group);
            }
        });
        return meshes;
    }).flat().filter(x => x) ?? [] : [];
    const approximateTextMeterToPixelFactor = 18;
    const textDataArr = Object.values(crossSectionData.texts) ?? [];
    const textMeshes = textDataArr.map(textData => {
        if (!textData) {
            return null;
        }
        const text = textData.text;
        const textOptions = {
            ...defaultTextWithBackgroundOptions,
            fontSize: textData.fontSize,
            fontFamily: textData.fontFamily,
            color: textData.textColor,
            backgroundColor: textData.showBackground ? textData.backgroundColor : '#ffffff',
            borderHeightPercent: 0.2,
            centralize: false,
            opacity: textData.transparency,
            width: parseFloat(textData.boxWidth) * approximateTextMeterToPixelFactor,
            height: parseFloat(textData.boxHeight) * approximateTextMeterToPixelFactor
        };
        const mesh = textTo3dWithBackgroundDoubleSided(text, newOptions, textOptions);
        const point = [textData.x, textData.y];
        positionPolygonMesh(mesh, [point], boreholesData);
        return mesh;
    }).filter(x => x) ?? [];
    const horAxisTickDistance = 10;
    const waterSymbolPositionsDicts = bool ? getWaterlineInterrogationPositionsDicts({
        interrogationPointKey: "waterSymbols",
        lines: [...crossSectionData.LINKS, ...crossSectionData.lines],
        lineProperties: crossSectionData.lineProperties,
        linkProperties: crossSectionData.linkProperties,
        AX: 1,
        AY: 1,
        precision: crossSectionData.precision ?? 0.00001,
        horAxisTickDistance: horAxisTickDistance,
    }) : null;
    const waterSymbolGenerator = bool ? waterSymbolMeshGenerator(options) : null;
    const waterSymbolMeshes = [];
    if (bool) {
        waterSymbolPositionsDicts.forEach(dict => {
            const { positions, timestamp } = dict;
            positions.forEach(position => {
                const [x, y] = position;
                const mesh = waterSymbolGenerator();
                positionPolygonMesh(mesh, [[x, -y]], boreholesData);
                waterSymbolMeshes.push(mesh);
            });
        });
    }
    const waterlineInterrogationPositionsDicts = bool ? getWaterlineInterrogationPositionsDicts({
        interrogationPointKey: "interrogation",
        lines: [...crossSectionData.LINKS, ...crossSectionData.lines],
        lineProperties: crossSectionData.lineProperties,
        linkProperties: crossSectionData.linkProperties,
        AX: 1,
        AY: 1,
        precision: crossSectionData.precision ?? 0.00001,
        horAxisTickDistance: horAxisTickDistance,
    }) : null;
    const polygonInterrogationPositionDicts = getPolygonInterrogationPositionDicts({
        polygons: crossSectionData.POLYGONS,
        polygonProperties: crossSectionData.polygonProperties,
        AX: 1,
        AY: 1,
        precision: crossSectionData.precision ?? 0.00001,
        horAxisTickDistance: horAxisTickDistance,
    });
    const optionsForInterrogationPoints = { ...newOptions, textSize: newOptions?.interrogationPointFontSize ?? newOptions.textSize ?? 0.7 };
    const waterlineInterrogationPointMeshes = bool ? interrogationPositionsDictsTo3D(waterlineInterrogationPositionsDicts, boreholesData, optionsForInterrogationPoints) : [];
    const polygonInterrogationPointMeshes = interrogationPositionsDictsTo3D(polygonInterrogationPositionDicts, boreholesData, optionsForInterrogationPoints);
    options.onCrossSectionProgress(100);
    const allMeshes = [...boreholeMeshes, ...polygonMeshes, ...sectionNameMeshes, ...waterLinkMeshes, ...textMeshes, ...waterSymbolMeshes, ...waterlineInterrogationPointMeshes, ...polygonInterrogationPointMeshes];
    return allMeshes;
}
const supportBoltRadius = 0.5;
const forceRadius = 0.25;
function supportBoltToMaterial(supportBolt) {
    let material = new THREE.MeshBasicMaterial({
        color: 0x00000
    });
    if (supportBolt.color) {
        material = createColorMaterial(supportBolt.color);
    }
    if (supportBolt.opacity) {
        material.opacity = supportBolt.opacity;
        material.transparent = true;
        material.depthWrite = false;
    }
    return material;
}
function create3dCylinder(cylinderLength, radius, material, options = defaultOptions) {
    const geometry = new THREE.CylinderGeometry(radius, radius, cylinderLength);
    const mesh = new THREE.Mesh(geometry);
    const line = create3dEdges(geometry, 60, { lineStyle: "Solid", opacity: material.opacity }, options);
    if ('lineVisible' in options && !options.lineVisible) {
        line.visible = false;
    }
    mesh.material = material;
    const group = new THREE.Group();
    group.add(mesh);
    group.add(line);
    return group;
}
// function getSupportBoltCylinderLength(supportBolt : SupportBolt) : number {
//     const v1 = new THREE.Vector2(...supportBolt.location);
//     // const v2 = new THREE.Vector2(...supportBolt.vector);
//     const v2 = angleToUnitVector2(supportBolt.angle);
//     // const cylinderLength = v1.distanceTo(v2);
//     const cylinderLength = v2.length() as number;
//     return cylinderLength;
// }
function supportBoltTo3d(supportBolt, modelThickness, lengthExtruding, options = defaultOptions) {
    // const cylinderLength = getSupportBoltCylinderLength(supportBolt);
    const length = supportBolt.length ?? 10;
    const cylinderLength = length + lengthExtruding;
    const material = supportBoltToMaterial(supportBolt);
    const group = create3dCylinder(cylinderLength, supportBoltRadius, material);
    const steelPlateWidth = 6;
    const steelPlateMaterial = supportBoltToMaterial(supportBolt);
    const steelPlateGeometry = new THREE.PlaneGeometry(steelPlateWidth, steelPlateWidth);
    const steelPlateMesh = new THREE.Mesh(steelPlateGeometry, steelPlateMaterial);
    const steelPlateGroup = new THREE.Group();
    steelPlateGroup.add(steelPlateMesh);
    if (options.lineVisible) {
        const line = create3dEdges(steelPlateGeometry, 60, { lineStyle: "Solid" }, options);
        steelPlateGroup.add(line);
    }
    steelPlateMesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    // want to position center such as lengthExtruding is below 0
    // think the support bolt as a vector and the lengthExtruding is the butt of the vector
    // to find out the center, we calculate the desired bottom = lengthExtruding
    // and then the desired center will be bottom + height/2
    const bottom = -lengthExtruding;
    const desiredCenter = bottom + cylinderLength / 2;
    group.children.forEach(mesh => {
        mesh.position.set(0, desiredCenter, 0);
    });
    group.add(steelPlateMesh);
    if (supportBolt.value) {
        const textMesh = textTo3d(supportBolt.value, options, supportBolt.color ?? 0x000000);
        const offset = options.textOffset + options.textSize / 2;
        const positionArray = [0, bottom - offset, 0];
        textMesh.position.set(...positionArray);
        group.add(textMesh);
    }
    if ('isActive' in supportBolt && supportBolt.isActive == false) {
        group.visible = false;
    }
    positionSupportBolt(group, modelThickness, supportBolt);
    if (supportBolt.name) {
        group.name = supportBolt.name;
    }
    group.renderOrder = 10; // rendered last to avoid z-fighting with the wedge
    return group;
}
// angle measured in degrees from the horizontal, starting on the left
function angleToUnitVector2(angle) {
    const rad = degToRad(angle);
    const ratio = Math.tan(rad);
    const y = ratio;
    const x = -1;
    const v = new THREE.Vector2(x, y).normalize();
    return v;
}
function angleToUnitVector3(angle) {
    const rad = degToRad(angle);
    const ratio = Math.tan(rad);
    const y = ratio;
    const x = 1;
    const v = new THREE.Vector3(x, y, 0).normalize();
    return v;
}
// positions the center
// you have to put the place you want to position at 0,0 before calling the function
// for example the tip of the cone
function positionSupportBolt(group, modelThickness, supportBolt) {
    const [x, y] = supportBolt.location;
    const location = [x, y, modelThickness / 2];
    // const [a, b] = supportBolt.vector;
    // const vector = [a, b, 0];
    // const initialVector = new THREE.Vector3(1, 0, 0);
    const initialVector = new THREE.Vector3(0, 1, 0);
    // const v1 = new THREE.Vector3(...vector);
    const v1 = angleToUnitVector3(supportBolt.angle);
    const v2 = new THREE.Vector3(...location);
    // // rotation in relation to initial rotation
    const rotationVector = v2.sub(initialVector);
    const actualRotationVector = v2.sub(v1);
    // const zAxisEulerRotation = initialVector.angleTo(rotationVector);
    // const zAxisEulerRotation =  - initialVector.angleTo(actualRotationVector);
    const zAxisEulerRotation = -initialVector.angleTo(v1);
    const euler = new THREE.Euler(0, 0, zAxisEulerRotation);
    group.position.set(...location);
    group.setRotationFromEuler(euler);
}
function createColorMaterial(color) {
    const material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: defaultShininess,
        specular: 0xffffff,
    });
    material.side = THREE.DoubleSide;
    return material;
}
// intersects support bolt with base polygon to get length
// if there's no intersection, returns null
function getSupportBoltLength(location, angle, basePolygonPoints) {
    const p1 = new Flatten.Point(...location);
    const vec = angleToUnitVector2(angle);
    const [x, y] = vec.toArray();
    const normal = [-y, -x];
    const line = new Flatten.Line(p1, new Flatten.Vector(...normal));
    const uniqPoints = uniqArrOfArrs(basePolygonPoints);
    const points = [...uniqPoints, uniqPoints[0]];
    const poly = new Flatten.Polygon(points);
    const intersectingPoints = line.intersect(poly);
    if (!intersectingPoints || intersectingPoints.length == 0) {
        return null;
    }
    const intersectingPoints_sorted = line.sortPoints(intersectingPoints);
    const p2 = intersectingPoints_sorted[intersectingPoints_sorted.length - 1];
    let [distance, segment] = p1.distanceTo(p2);
    // subtracts so it doesn't exit the base
    const rad = degToRad(angle);
    const desiredOffset = 5;
    const offset = Math.abs(Math.cos(rad)) * desiredOffset;
    distance = Math.max(1, distance - offset);
    return distance;
}
// returns a supportBolt with default length
function supportBoltDataToSupportBolt(supportBoltData) {
    // const [a, b, c] = supportBoltData.vector;
    // const vector = [a, c];
    const angle = parseFloat(supportBoltData.Angle);
    const supportBolt = {
        // vector: vector,
        angle: angle,
        isActive: supportBoltData.isActive ?? true,
        name: getObjectName('SupportBolt', supportBoltData.id)
    };
    if (supportBoltData.location) {
        const [x, z, y] = supportBoltData.location;
        const location = [x, y];
        supportBolt.location = location;
    }
    if (supportBoltData.transparency) {
        supportBolt.opacity = parseInt(supportBoltData.transparency) / 100;
    }
    if (supportBoltData.color) {
        supportBolt.color = supportBoltData.color;
    }
    if (supportBoltData.value) {
        supportBolt.value = supportBoltData.value;
    }
    return supportBolt;
}
function forceTo3dCylinder(force, modelThickness, options = defaultOptions) {
    const cylinderLength = force.length ?? options.arrowLength;
    const material = supportBoltToMaterial(force);
    const group = create3dCylinder(cylinderLength, forceRadius, material);
    return group;
}
function forceToArrow(force, modelThickness, options = defaultOptions) {
    const cylinderLength = force.length ?? options.arrowLength;
    const material = supportBoltToMaterial(force);
    const group = forceTo3dCylinder(force, modelThickness, options);
    const coneGeometry = new THREE.ConeGeometry(options.arrowConeRadius, options.arrowConeHeight);
    const coneMesh = new THREE.Mesh(coneGeometry);
    coneMesh.material = material;
    // vector points towards the center of the group
    coneMesh.position.set(0, -options.arrowConeHeight / 2, 0);
    const desiredCenter = -options.arrowConeHeight - cylinderLength / 2;
    group.children.forEach(mesh => {
        mesh.position.set(0, desiredCenter, 0);
    });
    group.add(coneMesh);
    if ('isActive' in force && force.isActive == false) {
        group.visible = false;
    }
    group.renderOrder = 10; // rendered last to avoid z-fighting with the wedge
    return group;
}
function forceTo3d(force, modelThickness, options = defaultOptions) {
    // const cylinderLength = getSupportBoltCylinderLength(force);
    const cylinderLength = force.length ?? options.arrowLength;
    const material = supportBoltToMaterial(force);
    const group = forceToArrow(force, modelThickness, options);
    if (force.value) {
        const textMesh = textTo3d(force.value, options, force.color ?? 0x000000);
        const offset = options.textOffset + options.textSize / 2;
        const positionArray = [0, -options.arrowConeHeight - cylinderLength - offset, 0];
        textMesh.position.set(...positionArray);
        group.add(textMesh);
    }
    if (force.name) {
        group.name = force.name;
    }
    positionSupportBolt(group, modelThickness, force);
    return group;
}
function forceTo3dFromData(forceData, modelThickness, options = defaultOptions) {
    const force = supportBoltDataToSupportBolt(forceData);
    force.name = getObjectName('Forces', forceData.id);
    const mesh = forceTo3d(force, modelThickness, options);
    return mesh;
}
function getObjectName(objType, objId = null) {
    let name = objType + '';
    if (objId != null) {
        name = `${name} id${objId}`;
    }
    return name;
}
function seismicTo3dFromData(forceData, modelThickness, options = defaultOptions) {
    const force = supportBoltDataToSupportBolt(forceData);
    force.name = getObjectName('Seismic', forceData.id);
    const mesh = forceTo3d(force, modelThickness, options);
    return mesh;
}
function compareEdgesByLeftPointX(e1, e2) {
    // left point
    const p1 = e1[0];
    const p2 = e2[0];
    return comparePointsByX(p1, p2);
}
function comparePointsByX(p1, p2) {
    const x1 = p1[0];
    const x2 = p2[0];
    return x1 - x2;
}
function getEdgeLength(edge) {
    const [p1, p2] = edge;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
function surchargeTo3d(force, modelThickness, wedgeFace, options = defaultOptions) {
    const numberOfBolts = 4;
    const face = wedgeFace.sort(comparePointsByX);
    const [p1, p2] = face;
    const [p1x, p1y] = p1;
    const [p2x, p2y] = p2;
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const vector = new THREE.Vector2(dx, dy);
    const faceLength = vector.length();
    let faceInclinationRad = vector.angle();
    // angle via this method goes from 0 to 360
    if (faceInclinationRad > Math.PI / 2) {
        faceInclinationRad = -(faceInclinationRad - Math.PI / 2);
    }
    // angle is calculated at vector tail but we want angle at vector tip
    // faceInclinationRad = - faceInclinationRad;
    const locations = [...Array(numberOfBolts).keys()].map(i => {
        const fraction = i / (numberOfBolts - 1);
        const dx = fraction * faceLength * Math.cos(faceInclinationRad);
        const dy = fraction * faceLength * Math.sin(faceInclinationRad);
        const x = p1x + dx;
        const y = p1y + dy;
        const location = [x, y];
        return location;
    });
    const meshes = locations.map(location => {
        const forceClone = JSON.parse(JSON.stringify(force));
        forceClone.location = location;
        const mesh = forceToArrow(forceClone, modelThickness, options);
        positionSupportBolt(mesh, modelThickness, forceClone);
        return mesh;
    });
    const cylinderLength = force.length ?? options.arrowLength;
    const coneLength = options.arrowConeHeight;
    const arrowLength = cylinderLength + coneLength;
    const unitingCylinder = JSON.parse(JSON.stringify(force));
    unitingCylinder.angle = radToDeg(faceInclinationRad);
    const faceCenter = new THREE.Vector2(...p1).add(new THREE.Vector2(...p2)).divideScalar(2);
    const arrowRad = degToRad(force.angle);
    const arrowDx = arrowLength * Math.cos(arrowRad);
    const arrowDy = arrowLength * Math.sin(arrowRad);
    const unitingCylinderLocation = faceCenter.sub(new THREE.Vector2(arrowDx, arrowDy)).toArray();
    unitingCylinder.location = unitingCylinderLocation;
    unitingCylinder.length = faceLength + forceRadius * 2;
    const unitingCylinderMesh = forceTo3dCylinder(unitingCylinder, modelThickness, options);
    positionSupportBolt(unitingCylinderMesh, modelThickness, unitingCylinder);
    const group = new THREE.Group();
    meshes.forEach(mesh => {
        group.add(mesh);
    });
    group.add(unitingCylinderMesh);
    if (force.value) {
        const textMesh = textTo3d(force.value, options, force.color ?? 0x000000);
        const offset = options.textOffset + options.textSize / 2;
        const [x, y] = unitingCylinderLocation;
        const positionArray = [x, y + offset, modelThickness / 2];
        textMesh.position.set(...positionArray);
        group.add(textMesh);
    }
    if ('isActive' in force && force.isActive == false) {
        group.visible = false;
    }
    unitingCylinderMesh.renderOrder = 10;
    group.renderOrder = 10; // rendered last to avoid z-fighting with the wedge
    if (force.name) {
        group.name = force.name;
    }
    return group;
}
// polygon faces whose normal points up
// assumes points are counterclockwise
function getUpperPolygonFaces(polygonPoints) {
    const uniqPoints = uniqArrOfArrs(polygonPoints);
    if (uniqPoints.length < 2) {
        return [];
    }
    const points = [...uniqPoints, uniqPoints[0]];
    const edges = [];
    for (let i = 0; i < points.length - 1; i++) {
        edges.push([points[i], points[i + 1]]);
    }
    const normals = edges.map(edge => {
        const [p1, p2] = edge;
        const [x1, y1] = p1;
        const [x2, y2] = p2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        return [-dy, dx];
    });
    const upperFaces = edges.filter((edge, i) => {
        const normal = normals[i];
        // points up
        return normal[1] > 0;
    });
    return upperFaces;
}
// identify which face is the slope and which face is upper
// assumes points are counterclockwise, polygon is convex and has 3 or 4 edges
// also assumes a wedge is non rectangular and therefore has at least 2 upper faces
function identifyWedgeFaces(polygonPoints) {
    const upperFaces = getUpperPolygonFaces(polygonPoints);
    const sortedByX = upperFaces.sort(compareEdgesByLeftPointX);
    const faces = {
        slope: sortedByX[0],
        upper: sortedByX[sortedByX.length - 1]
    };
    return faces;
}
function surchargeTo3dFromData(forceData, wedgePolygonPoints, typeOfSurcharge, modelThickness, options = defaultOptions) {
    const force = supportBoltDataToSupportBolt(forceData);
    force.name = getObjectName(typeOfSurcharge, forceData.id);
    const faces = identifyWedgeFaces(wedgePolygonPoints);
    let face = typeOfSurcharge == "Upper_Surcharge" ? faces.upper : faces.slope;
    const mesh = surchargeTo3d(force, modelThickness, face, options);
    return mesh;
}
function unflatten(arr, size) {
    let arrClone = [...arr];
    let newArray = [];
    while (arrClone.length > 0) {
        newArray.push(arrClone.splice(0, size));
    }
    return newArray;
}
function sumArr(arr) {
    const sum = arr.reduce((prev, current) => {
        return prev + current;
    }, 0);
    return sum;
}
function meanOfArr(arr) {
    if (!arr || arr.length == 0) {
        return 0;
    }
    const s = sumArr(arr);
    const mean = s / arr.length;
    return mean;
}
// consider the plane of the z axis to be the front
// the back is the part farthest away from it in the x axis
// there should be two triangles so it make a rectangle
function getWedgeBackFacesIndexes(wedgeGeometry) {
    const arr = wedgeGeometry.attributes.position.array;
    const points = unflatten(arr, 3);
    const faces = unflatten(points, 3);
    const meanXCoords = faces.map(face => {
        const xCoords = face.map(p => p[0] ?? 0);
        const mean = meanOfArr(xCoords);
        return mean;
    });
    const maxMeanX = Math.max(...meanXCoords);
    const backFaces = [];
    const backFacesIndexes = [];
    for (let i = 0; i < faces.length; i += 1) {
        if (floatsEqual(meanXCoords[i], maxMeanX)) {
            backFaces.push(faces[i]);
            backFacesIndexes.push(i);
        }
    }
    return backFacesIndexes;
}
function wedgeTo3d(wedge, options = defaultOptions) {
    const shape = polygonToShape(wedge.points);
    const geometry = new THREE.ExtrudeGeometry(shape, wedge.extrudeOptions);
    geometry.clearGroups();
    if (wedge.isHollow) {
        const backFaceIndexes = getWedgeBackFacesIndexes(geometry);
        backFaceIndexes.forEach(index => {
            const step = 3;
            const realIndex = index * step;
            geometry.addGroup(realIndex, step, 1);
        });
        // define the groups for the actual texture
        // ps: the backFaceIndexes are already sorted
        let prev = 0;
        for (let i = 0; i < backFaceIndexes.length; i += 1) {
            const index = backFaceIndexes[i];
            const realIndex = index * 3;
            const difference = realIndex - prev;
            if (difference != 0) {
                geometry.addGroup(prev, difference, 0);
            }
            prev = realIndex + 3;
        }
        geometry.addGroup(prev, Infinity, 0);
    }
    else {
        geometry.addGroup(0, Infinity, 0);
    }
    // const geometry = extrudeShape(wedge.points, wedge.extrudeOptions.depth, options);
    const mesh = new THREE.Mesh(geometry);
    let materialsDictKey = getMaterialDictKey('Black', wedge.hatchSymbol ?? '');
    // Texture folder case
    if (!(materialsDictKey in options.materialsDict)) {
        materialsDictKey = getMaterialDictKey('Texture', wedge.hatchSymbol ?? '');
    }
    // for the back face if isHollow is true
    const transparentMaterial = new THREE.MeshBasicMaterial();
    transparentMaterial.opacity = 0;
    transparentMaterial.transparent = true;
    transparentMaterial.depthWrite = false;
    if (wedge.hatchSymbol && materialsDictKey in options.materialsDict) {
        const material = options.materialsDict[materialsDictKey].clone();
        // passes new options just for the wedge so the texture repeats correctly
        const newOptions = wedge.hatchRepeat ? { ...options, hatchRepeat: wedge.hatchRepeat } : options;
        const newMaterial = materialToPolygonMaterial(material, newOptions);
        const materials = [newMaterial, transparentMaterial];
        mesh.material = materials;
    }
    else if (wedge.color) {
        const material = createColorMaterial(wedge.color);
        const materials = [material, transparentMaterial];
        mesh.material = materials;
    }
    const group = new THREE.Group();
    group.add(mesh);
    const line = create3dEdges(geometry, 60, { lineStyle: "Solid" }, options);
    group.add(line);
    if (!(options.lineVisible && wedge.hasEdge)) {
        line.visible = false;
    }
    if (wedge.polygonOffset) {
        [line, mesh].forEach(mesh => {
            let materialArr = mesh.material;
            if (!Array.isArray(materialArr)) {
                materialArr = [materialArr];
            }
            materialArr.forEach(material => {
                material.polygonOffset = true;
                material.polygonOffsetFactor = wedge.polygonOffset;
            });
        });
    }
    if (wedge.opacity && wedge.opacity < 1) {
        [line, mesh].forEach(mesh => {
            let materialArr = mesh.material;
            if (!Array.isArray(materialArr)) {
                materialArr = [materialArr];
            }
            materialArr.forEach(material => {
                material.transparent = true;
                // can't hide objects behind it
                material.depthWrite = false;
                // material.depthTest = false;
                material.opacity = wedge.opacity;
            });
        });
    }
    if (wedge.renderOrder) {
        [line, mesh].forEach(mesh => {
            mesh.renderOrder = wedge.renderOrder;
        });
    }
    if ('isActive' in wedge && wedge.isActive == false) {
        group.visible = false;
    }
    if (wedge.name) {
        group.name = wedge.name;
    }
    return group;
}
function getWedgePoints(wedgeData) {
    const vertices = wedgeData.VerticesArr ?? wedgeData.pointsArr;
    if (!vertices) {
        return [];
    }
    const points = vertices.map(vertice => {
        const [x, z, y] = vertice;
        return [x, y];
    });
    return points;
}
function textureScaleToHatchRepeat(textureScale) {
    if (!textureScale) {
        return null;
    }
    textureScale = parseFloat(textureScale);
    if (textureScale == 0) {
        return null;
    }
    return 1 / textureScale;
}
function groupPointByIndex(points) {
    const indexes = Array.from(Array(points.length).keys());
    const groupedByIndex = indexes.map(index => {
        return points.map(point => point[index]);
    });
    return groupedByIndex;
}
// maximum x, y, z. they aren't necessarily from the same point
function getPointMaxes(points) {
    const groupedByIndex = groupPointByIndex(points);
    const maxes = groupedByIndex.map(coordinates => {
        return Math.max(...coordinates);
    });
    return maxes;
}
function getPointMins(points) {
    const groupedByIndex = groupPointByIndex(points);
    const mins = groupedByIndex.map(coordinates => {
        return Math.min(...coordinates);
    });
    return mins;
}
function wedgeDataToWedge(wedgeData, wedgeType, settingsData, defaultTextureFile = '', options = defaultOptions) {
    const depth = parseFloat(settingsData.Model_thickness);
    const extrudeOptions = {
        depth: depth,
        bevelEnabled: false
    };
    const wedgePoints = getWedgePoints(wedgeData);
    const wedgeHatchSymbol = wedgeData.texture_file ? filenameToSymbol(wedgeData.texture_file) : defaultTextureFile;
    const wedge = {
        points: wedgePoints,
        extrudeOptions: extrudeOptions,
        hatchSymbol: wedgeHatchSymbol,
        hasEdge: true,
        hatchRepeat: textureScaleToHatchRepeat(wedgeData.texture_scale) ?? options.hatchRepeat,
        isActive: wedgeData.isActive ?? true,
        // polygonOffset: -2,
        // renderOrder: 2,
        isHollow: wedgeData.IsHollow ?? false,
        color: wedgeData.color,
        name: wedgeType ?? ''
    };
    if (wedgeData.transparency) {
        wedge.opacity = parseInt(wedgeData.transparency) / 100;
    }
    return wedge;
}
export function wedgeSettingsToOptions(settingsData, options = defaultOptions) {
    const depth = parseFloat(settingsData.Model_thickness);
    const newOptions = {
        ...options,
        lineThickness: parseFloat(settingsData.LineThickness) ?? 0.25,
        lineColor: settingsData.LineColor ?? "#EFEFEF",
        lineVisible: settingsData.LineVisible ?? true,
        arrowLength: settingsData.Arrow_Length ? parseFloat(settingsData.Arrow_Length) : depth / 5
    };
    return newOptions;
}
// function wedgeTo3dFromData(wedgeData, wedgeType, settingsData, defaultTextureFile = '', options=defaultOptions) {
//     const wedge = wedgeDataToWedge(wedgeData, settingsData, defaultTextureFile, options);
//     const newOptions = wedgeSettingsToOptions(settingsData, options);
//     const mesh = wedgeTo3d(wedge, newOptions);
//     return mesh;
// }
function getSupportBoltParametersFromData(rocPlaneData, options = defaultOptions) {
}
function rocPlaneDataToWedges(rocPlaneData, options = defaultOptions) {
    const settingsData = rocPlaneData.Settings;
    const depth = parseFloat(settingsData.Model_thickness);
    const { Wedge, Base, Ponding_Water, Contact_Water } = rocPlaneData;
    // const defaultTextureFiles = ['Wedge', 'Base', 'Water', 'Water'];
    const wedgeTypes = ['Wedge', 'Base', 'Ponding_Water', 'Contact_Water'];
    const wedges = [Wedge, Base, Ponding_Water, Contact_Water].map((wedgeData, index) => {
        const wedgeType = wedgeTypes[index];
        const wedge = wedgeDataToWedge(wedgeData, wedgeType, settingsData, '', options);
        return wedge;
    });
    const [wedge, base, water, contactWater] = wedges;
    // make wedge visible when base is hollow
    base.polygonOffset = 1;
    wedge.polygonOffset = -1;
    // water points need to be found
    const wedgePoints = getWedgePoints(Wedge);
    const basePoints = getWedgePoints(Base);
    const points = [...wedgePoints, ...basePoints];
    const [minX, minY] = getPointMins(points);
    const [maxX, maxY] = getPointMaxes(points);
    const waterHeight = rocPlaneData.Ponding_Water.depth_z;
    const waterBox = [
        [minX, minY],
        [minX, waterHeight],
        [maxX, waterHeight],
        [maxX, minY],
    ];
    const polyWater = new Flatten.Polygon(waterBox);
    const polyBase = new Flatten.Polygon(basePoints);
    const polyWedge = new Flatten.Polygon(wedgePoints);
    const clipped1 = Flatten.BooleanOperations.subtract(polyWater, polyBase);
    const clipped2 = Flatten.BooleanOperations.subtract(clipped1, polyWedge);
    const waterPoints = flattenJsPolygonToPoints(clipped2);
    water.points = waterPoints;
    const wedgesDict = {
        base: base,
        wedge: wedge,
        water: water,
        contactWater: contactWater
    };
    return wedgesDict;
}
function getModelDepth(rocPlaneData) {
    const settingsData = rocPlaneData.Settings;
    const depth = parseFloat(settingsData.Model_thickness);
    return depth;
}
function getRocplaneModelHeight(rocPlaneData, options = defaultOptions) {
    const wedgesDict = rocPlaneDataToWedges(rocPlaneData, options);
    const { base, wedge, water, contactWater } = wedgesDict;
    const basePoints = base.points;
    const wedgePoints = wedge.points;
    const points = [...wedgePoints, ...basePoints];
    const [minX, minY] = getPointMins(points);
    const [maxX, maxY] = getPointMaxes(points);
    const modelHeight = maxY - minY;
    return modelHeight;
}
function getSupportBoltExtrudingLength(rocPlaneData, options = defaultOptions) {
    const modelHeight = getRocplaneModelHeight(rocPlaneData, options);
    const supportBoltExtrudingLength = modelHeight * 0.1;
    return supportBoltExtrudingLength;
}
// helper function so we don't duplicate code in the viewer when adding a new support bolt
export function supportBoltTo3dFromRocplaneData(supportBolt, rocPlaneData, options = defaultOptions) {
    const wedgesDict = rocPlaneDataToWedges(rocPlaneData, options);
    const { base, wedge, water, contactWater } = wedgesDict;
    const depth = getModelDepth(rocPlaneData);
    const supportBoltExtrudingLength = getSupportBoltExtrudingLength(rocPlaneData, options);
    const supportBoltLength = getSupportBoltLength(supportBolt.location, supportBolt.angle, base.points);
    if (supportBoltLength) {
        supportBolt.length = supportBoltLength;
    }
    const mesh = supportBoltTo3d(supportBolt, depth, supportBoltExtrudingLength, options);
    return mesh;
}
function supportBoltTo3dFromData(supportBoltData, rocPlaneData, options = defaultOptions) {
    const supportBolt = supportBoltDataToSupportBolt(supportBoltData);
    const mesh = supportBoltTo3dFromRocplaneData(supportBolt, rocPlaneData, options);
    return mesh;
}
export function rocPlaneTo3dFromData(rocPlaneData, options = defaultOptions) {
    const settingsData = rocPlaneData.Settings;
    const depth = getModelDepth(rocPlaneData);
    // const {Wedge, Base, Ponding_Water, Contact_Water} = rocPlaneData;
    const wedgesDict = rocPlaneDataToWedges(rocPlaneData, options);
    const wedges = Object.values(wedgesDict);
    // generate meshes
    const newOptions = wedgeSettingsToOptions(settingsData, options);
    const meshes = wedges.map((wedge, index) => {
        const mesh = wedgeTo3d(wedge, newOptions);
        return mesh;
    });
    // generate support bolts
    const supportBoltMeshes = rocPlaneData.Support.Bolt.map(supportBoltData => {
        const mesh = supportBoltTo3dFromData(supportBoltData, rocPlaneData, newOptions);
        return mesh;
    });
    const forceMeshes = rocPlaneData.Forces.map(forceData => {
        const mesh = forceTo3dFromData(forceData, depth, newOptions);
        return mesh;
    });
    const seismicMesh = seismicTo3dFromData(rocPlaneData.Seismic, depth, newOptions);
    const slopeSurchargeMesh = surchargeTo3dFromData(rocPlaneData.Support?.Slope_Surcharge, wedgesDict.wedge.points, 'Slope_Surcharge', depth, newOptions);
    const upperSurchargeMesh = surchargeTo3dFromData(rocPlaneData.Support?.Upper_Surcharge, wedgesDict.wedge.points, 'Upper_Surcharge', depth, newOptions);
    const group = new THREE.Group();
    const allMeshes = [
        ...meshes,
        ...supportBoltMeshes,
        ...forceMeshes,
        seismicMesh,
        slopeSurchargeMesh,
        upperSurchargeMesh
    ];
    allMeshes.forEach(mesh => {
        group.add(mesh);
    });
    return group;
}
export async function initializeSceneFromRocPlaneData(rocPlaneData, options = defaultOptions) {
    const scene = initialize3d();
    const mesh = rocPlaneTo3dFromData(rocPlaneData, options);
    scene.add(mesh);
    return scene;
}
export function getMeshesminRealCoordinates(meshArr) {
    const coordinates = meshArr.map(mesh => {
        return mesh.position;
    });
    const minX = Math.min(...coordinates.map(coord => coord.x));
    const minY = Math.min(...coordinates.map(coord => coord.y));
    const minZ = Math.min(...coordinates.map(coord => coord.z));
    return [minX, minY, minZ];
}
// returns base coordinate
export function moveMeshesCloserToOrigin(meshArr) {
    const coordinates = getMeshesminRealCoordinates(meshArr);
    const [minX, minY, minZ] = coordinates;
    meshArr.forEach(mesh => {
        const [x, y, z] = mesh.position.toArray();
        mesh.position.set(x - minX, y, z - minZ);
    });
    return coordinates;
}
export function initialize3d() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    return scene;
}
function zip(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return [];
    }
    const zipped = arr1.map((item, i) => [item, arr2[i]]);
    return zipped;
}
function conformFilename(filename) {
    if (!filename) {
        return '';
    }
    const newFilename = filename.replace(/\\/gi, '/');
    return newFilename;
}
function filenameToSymbol(filename) {
    if (!filename) {
        return '';
    }
    filename = conformFilename(filename);
    const split = filename.split('/');
    const end = split[split.length - 1];
    const split2 = end.split('.');
    const symbol = split2[0];
    return symbol;
}
function filenameToColor(filename) {
    if (!filename) {
        return '';
    }
    filename = conformFilename(filename);
    const split = filename.split('/');
    const color = split[split.length - 2];
    return color;
}
function getMaterialDictKey(hatchColor, hatchSymbol) {
    return hatchColor.toLowerCase() + '_' + hatchSymbol;
}
function filenameToMaterialDictKey(filename) {
    const hatchColor = filenameToColor(filename);
    const hatchSymbol = filenameToSymbol(filename);
    return getMaterialDictKey(hatchColor, hatchSymbol);
}
function createMaterialsDict(textureFilenames, materials) {
    const symbolNames = textureFilenames.map(filename => filenameToMaterialDictKey(filename));
    const entries = zip(symbolNames, materials);
    entries.forEach(entry => {
        const [symbolName, material] = entry;
        if (!material) {
            return;
        }
        material.name = symbolName;
    });
    const materialsDict = Object.fromEntries(entries);
    return materialsDict;
}
export function getHatchFilenames(options = defaultOptions) {
    const hatchDataURIs = (options.hatchFilesArr ?? []).map(x => x.imageBase64);
    const hatchSrcs = (options.hatchFilesArr ?? []).map(x => x.src);
    const textureFilenames = hatchDataURIs.length > 0 ? hatchDataURIs : options.textureFilenames;
    const srcsToUse = hatchSrcs ?? options.textureFilenames;
    return { textureFilenames: textureFilenames, srcsToUse: srcsToUse };
}
export async function initializeMaterialsDict(options = defaultOptions) {
    const { textureFilenames, srcsToUse } = getHatchFilenames(options);
    const textures = await initializeTextures(textureFilenames, options);
    const materials = initializeMaterials(textures);
    const materialsDict = createMaterialsDict(srcsToUse, materials);
    return materialsDict;
}
export async function insertNewInMaterialsDict(materialsDict, options = defaultOptions) {
    const { textureFilenames, srcsToUse } = getHatchFilenames(options);
    const newFilenames = [];
    const newSrcsToUse = [];
    textureFilenames.forEach((filename, index) => {
        if (materialsDict[filename]) {
            return;
        }
        newFilenames.push(filename);
        newSrcsToUse.push(srcsToUse[index]);
    });
    const textures = await initializeTextures(newFilenames, options);
    const materials = initializeMaterials(textures);
    const newEntries = createMaterialsDict(newSrcsToUse, materials);
    materialsDict = { ...materialsDict, ...newEntries };
    return materialsDict;
}
export async function initializeSceneFromBoreholesData(boreholesData, options = defaultOptions, size = 100) {
    const scene = initialize3d();
    const boreholeMeshes = boreholesData.map(boreholeData => {
        const boreholeMesh = boreholeTo3dFromData(boreholeData, options, size);
        return boreholeMesh;
    });
    boreholeMeshes.forEach(boreholeMesh => {
        scene.add(boreholeMesh);
    });
    return scene;
}
export async function initializeSceneFromCrossSectionData(crossSectionData, options = defaultOptions) {
    const scene = initialize3d();
    const meshes = crossSectionTo3dFromData(crossSectionData, options, true, 150);
    meshes.forEach(mesh => {
        scene.add(mesh);
    });
    return scene;
}
function download(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link); // Firefox workaround, see #6594
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
function downloadString(text, filename) {
    download(new Blob([text], { type: 'text/plain' }), filename);
}
function downloadArrayBuffer(buffer, filename) {
    download(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}
function downloadGLTF(gltf, filename = 'scene') {
    if (gltf instanceof ArrayBuffer) {
        downloadArrayBuffer(gltf, `${filename}.glb`);
    }
    else {
        const output = JSON.stringify(gltf, null, 2);
        // console.log( output );
        downloadString(output, `${filename}.gltf`);
    }
}
export async function meshToGltf(threeObj) {
    // Instantiate a exporter
    const exporter = new GLTFExporter.GLTFExporter();
    const options = {
        embedImages: true
    };
    // Parse the input and generate the glTF output
    const promise = new Promise((resolve, reject) => {
        exporter.parse(threeObj, function (gltf) {
            resolve(gltf);
        }, function (something) {
            console.log("Error during GLTF export", something);
        }, options);
    });
    return promise;
}
export async function meshToSTL(threeObj) {
    const exporter = new STLExporter.STLExporter();
    const options = {};
    const result = exporter.parse(threeObj, options);
    return result;
}
export async function exportToGLTF(threeObj, filename = "scene") {
    const gltf = await meshToGltf(threeObj);
    downloadGLTF(gltf, filename);
}
export async function exportToSTL(threeObj, filename = "scene") {
    const stl = await meshToSTL(threeObj);
    downloadString(stl, `${filename}.stl`);
}
export function meshToOBJ(threeObj) {
    // Instantiate a exporter
    const exporter = new OBJExporter.OBJExporter();
    return exporter.parse(threeObj);
}
export async function exportToOBJ(threeObj, filename = "scene") {
    const obj = meshToOBJ(threeObj);
    downloadString(obj, `${filename}.obj`);
}
export function meshToCollada(threeObj) {
    const exporter = new ColladaExporter.ColladaExporter();
    return exporter.parse(threeObj);
}
export async function exportToCollada(threeObj, filename = "scene") {
    const colladaString = meshToCollada(threeObj);
    console.log(colladaString);
}
function isVectorCorrect(vector) {
    return vector.x != null && vector.y != null && !Number.isNaN(vector.x) && !Number.isNaN(vector.y);
}
function isShapeCorrect(shape) {
    if (shape.curves.length <= 1) {
        return false;
    }
    for (let curve of shape.curves) {
        if (curve.type == "LineCurve" && (!isVectorCorrect(curve.v1) || !isVectorCorrect(curve.v2))) {
            return false;
        }
    }
    return true;
}
export function loadSvg(svgUrl) {
    // instantiate a loader
    const loader = new SVGLoader.SVGLoader();
    const loadingPromise = new Promise((resolve, reject) => {
        // load a SVG resource
        loader.load(
        // resource URL
        svgUrl, 
        // called when the resource is loaded
        function (data) {
            const paths = data.paths;
            const group = new THREE.Group();
            for (let i = 0; i < paths.length - 28; i++) {
                const path = paths[i];
                const material = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    reflectivity: defaultReflectivity,
                    // color: path.color,
                    // side: THREE.DoubleSide,
                    // depthWrite: false
                });
                const shapes = SVGLoader.SVGLoader.createShapes(path);
                for (let j = 0; j < shapes.length; j++) {
                    const shape = shapes[j];
                    if (!isShapeCorrect(shape)) {
                        continue;
                    }
                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);
                }
            }
            resolve(group);
        }, null, 
        // called when loading has errors
        function (error) {
            console.log('An error happened');
        });
    });
    return loadingPromise;
}
export function isBoreholeData(jsonData) {
    return Array.isArray(jsonData) && jsonData.length > 0 && 'th_id' in jsonData[0];
}
export function isCrossSectionData(jsonData) {
    const boreholes = jsonData.data;
    return boreholes && Array.isArray(boreholes) && boreholes.length > 0 && 'th_viewer_coordinates' in (boreholes[0]?.general ?? {});
}
export function isRocPlaneData(jsonData) {
    return 'Wedge' in jsonData;
}
// materials dict and font need to be passed already in the options
export async function jsonToMesh(jsonData, options = defaultOptions, bool = true) {
    let meshes = [];
    if (isBoreholeData(jsonData)) {
        meshes = jsonData.map(boreholeData => {
            const boreholeMesh = boreholeTo3dFromData(boreholeData, options);
            return boreholeMesh;
        });
    }
    else if (isCrossSectionData(jsonData)) {
        meshes = crossSectionTo3dFromData(jsonData, options, bool);
    }
    else if (isRocPlaneData(jsonData)) {
        const rocPlaneMesh = rocPlaneTo3dFromData(jsonData, options);
        meshes = [rocPlaneMesh];
    }
    const group = new THREE.Group();
    meshes.forEach(mesh => {
        group.add(mesh);
    });
    const minRealCoordinates = moveMeshesCloserToOrigin(meshes);
    return {
        mesh: group,
        minRealCoordinates: minRealCoordinates
    };
}
