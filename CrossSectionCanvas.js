// @ts-check

const d3 = window['d3'];
const $ = window['$'];
const tinycolor = window['tinycolor'];

window['lineScalingFactor'] = 1;

function CrossSectionCanvas(rootElem, jsonBorehole, soilSymbols, jsonOptions = defaultOptions, options = defaultStorage, doneFunction = (something) => true) {
    this.storage = {}
    this.doneFunction = doneFunction;
    this.initializeStorage(options, rootElem);
    const soilSymbolSrcs = hatchFilesArr.map(x => x?.src).filter(x => x).filter(x => x.includes('000000'));
    this.initializeHatch(soilSymbolSrcs ?? soilSymbols);
    this.insertHatchPatterns(hatchFilesArr, {redraw : false});
    this.setApplicationFont(options.applicationFont ?? defaultStorage.applicationFont);
    this.initializePage();
    this.processDataWithRedraw(jsonBorehole);
    this.doneFunction(this);

    //Stop the orbit controls from listening to key events when not focused on the canvas
    window.addEventListener('click', (e) => {       
        if(e.target?.tagName === 'CANVAS') {
            if(this.storage.viewer3d.controls)
                this.storage.viewer3d.controls.enablePan = true;
        } else {
            if(this.storage.viewer3d.controls)
                this.storage.viewer3d.controls.enablePan = false;
        }
    })
}

// only simple data that can be retrieved from a JSON, no function calls
// the rest of the data will be added by "initializeStorage"

const defaultOptions = {
    horScaleOption: 64,
    vertScaleOption: 64,

    // page settings UI
    GridlineThickness: 1, // grid
    HatchScale: 20, // borehole image scale
    LineThickness: 1, // line thickness
    boreholeWidth: 5,
    PointSize: 5,
    pointLineColor : "#FF0000",
    pointFillColor : "#FFFFFF",
    pointHasFill : false,
    TEXTSIZE: 14,
    legendBoxW: 20,
    legendBoxH: 10,
    showLegend: true,
    legendPinnedTo: "(none)",
    otherTestHolesOption: "(none)",
    otherCrossSectionsOption: "(none)",
    showLabels : true,
    showFieldTestPlots : true,
    lineStyleScale : "2",
    axisHorText : "", // will be set
    axisHorFontFamily : "Arial",
    axisHorFontSize : '14',
    axisVertText : "", // will be set
    axisVertFontFamily : "Arial",
    axisVertFontSize : '14',
    interrogationPointFontSize: '14px',

    gridHorText : "X (ft)",
    gridVertText : "Y (ft)",
    gridFontSize : '14',
    
    toggleOutline: true,

    gridZText: 'Elevation (ft)',
    
    legendBoxNumberOfColumns : 2,
    legendBoxText : "Soil Legend",
    legendBoxFontFamily : "Arial",
    legendBoxFontSize : '11',
    legendScaleBar : 'Bottom-Left',
    legendBackgroundColor : '#f5f5f5',
    legendHasBorder : true,
    legendBorderColor : '#000000',

    applicationFont: "IBM Plex Sans",

    Unit : "ft",
    Coordinates_Unit : "ft",
    ProjectDepth_Unit : "ft",
}

const defaultStorage = {

    // legend position in pixels
    LEGDX: 0, LEGDY: 0,
    // legend position in real units
    LEGDXREAL: 0, LEGDYREAL: 0, // real units

    // scale
    AX: 1.0,
    AY: 1.0,

    totalImageLength: 0,
    currentImageLength: 0,
    boreHoleLastTimestamp: 0,

    KFT: 1152.0 / 1.00,
    KM: 3779.5276 / 1.00,


    WATERFRONTMODE: null,
    CONNECTMODE: null,        // draw links
    CONNECTPOINTS: null,
    drawPolygonMode: false,
    drawLineMode: false,

    LINKS: [],
    POLYGONS: [],
    CURRENTLINK: null,
    EPOINTS: [
        //  {timestamp: uniq(), x: 38, yz: 40}
    ],

    linksBeingDrawn: [], // used just to show the polygon while drawing
    waterLinksBeingDrawn: [], // used to store the waterlinks before finished
    linesBeingDrawn : [], // for drawing regular lines

    ZOOMSCALE: 1.0,
    // coordinate at center of canvas, in units
    REGCX: 300,
    REGCY: 300,

    YOFFPIX: 50, // size of the top bar
    XOFFPIX: 60, // size of the left bar

    ...defaultOptions,

    waterSymbolDefaultOptions : {
        color : "#00FFFF",
        transparency: 0.5,
        lineThickness: 1,
        lineStyle: "Dash",
        zOrder : "Default",
    },



    XMOUSE: 0,
    YMOUSE: 0,
    CLXMOUSE: 0,
    CLYMOUSE: 0,

    PIXW: 1,
    PIXH: 1,


    legendIsDragging: false,
    fillUsedForLegend: [],

    // Example of element:
    // timestamp : {test_xx : 0, test_yz : 0}
    fieldTestPositions: {},
    fieldTestIsDragging: false,

    // Example of element:
    // "SPT Blows (N)" : 10
    fieldTestWidths: {},

    data0: undefined,
    title: undefined,

    CURRENTTEXT: null,
    CURRENTTEXTSELECTION: null,



    IMGPREFIX: "",

    defaultPolygonFill: 'Green',

    defaultHatchColor: "000000",


    availableColors: ["Black", "Red", "Lime", "Blue", "Yellow", "Cyan", "Magenta", "Brown", "Green", "Maroon"],
    selectingColorOfSymbol: "",
    hatchLoaded: false,

    // those are the default options for what is contained in the soil-options.json
    // don't add anything here, it's here just for compatibility and for loading the page when the options json takes too long to be retrieved
    defaultOptions: {
        "textSize": 8,
        "pathsWidth": 1,
        "gridWidth": 2,
        "feet": [
            ["1/16′′ = 1′-0′′", 192],
            ["3/32′′ = 1′-0′′", 128],
            ["1/8′′ = 1′-0′′", 96],
            ["3/16′′ = 1′-0′′", 64],
            ["1/4′′ = 1′-0′′", 48],
            ["3/8′′ = 1′-0′′", 32],
            ["1/2′′ = 1′-0′′", 24],
            ["3/4′′ = 1′-0′′", 16],
            ["1′′ = 1′-0′′", 12],
            ["1 1/2′′ = 1′-0′′", 8],
            ["3′′ = 1′-0′′", 4]
            // ["two", 2],
            // ["one", 1]
        ],
        "m": [
            ["1:100", 100],
            ["1:200", 200],
            ["1:250", 250],
            ["1:500", 500],
            ["1:1000", 1000],
            ["1:2000", 2000],
            ["1:10000", 10000]
        ],
        "PIXW": 1100,
        "PIXH": 600,
        "cornerSize": 1,
        "waterIconSize": 50,
        "boreholeImgScale": 5,
        "layerWidth": 1000
    },

    defaultBoreholeDisplayWidth: 0.25,

    // a value of 50 means the water icon will be 50% of the borehole size
    WaterSymbolSize: 50,

    textBackgroundPadding: 8,

    boreholeDefaultProperties: {
        displayWidth: 11,
        fieldTestPlotOption: "", // to be filled later based on data
        showDepthLabels: true,
        showSoilDescriptions: true,
        opaqueLabels : false,
        transparency : 1,
        fontFamily : "Arial",
        fontSize : 11,
        textColor : "black",
        titleAngle : '0',
    },

    polygonDefaultProperties : {
        fillStyle : "Solid",
        patternStyle : "USCS", // Soil, Rock, Misc
        patternColor : "Black",
        hatch : "",
        transparency : 1,
        zOrder : "Default",
        lineStyle: "Solid",
        interrogation : "(none)",
        isLocked: true,
        isSmooth: false,
    },

    lineDefaultProperties : {
        isSmoothLine : false,
        lineColor : '#000000',
        lineStyle: "Solid",
        strokeWidth : "1",
        transparency : 1,
        interrogation : "(none)",
        zOrder : "Default",
        isLocked: true,
    },

    waterlineDefaultProperties : {
        isSmoothLine : false,
        lineColor : '#0000ff',
        lineStyle: "Dash",
        strokeWidth : "1",
        transparency : 1,
        interrogation : "(none)",
        waterSymbols : "Segment",
        zOrder : "Default",
        isLocked: true,
    },

    // background color, line color, area fill color, data points color, show data points (true/false), and transparency
    fieldTestDefaultProperties: {
        showPoints: true,
        pointColor: "darkgreen",
        showPointsValues: true,
        pointValueColor : "orange",
        backgroundColor: "white",
        lineFillColor: "lightgreen",
        lineColor: "black",
        showXAxisNumber : true,
        showXAxisTitle : true,
        showYAxisNumber : true,
        showYAxisTitle : true,
        plotOpacity: 0.7,
        fontFamily : "Arial",
        fontSize : 11,
        zOrder : "Default",
        anchor : "(none)"
    },

    textDefaultProperties: {
        text : "",
        fontSize: '12',
        fontFamily: 'Arial',
        textColor : "#000000",
        showBackground : false,
        showBorder : true,
        backgroundColor : "#ffffff",
        boxWidth: 10,
        boxHeight: 10,
        x: 0,
        y: 0,
        transparency: 1,
        zOrder : "Default"
    },

    imperialScaleBarsDict: {
        '1/16′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_1_16_1.png',
        '3/32′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_3_32_1.png',
        '1/8′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_1_8_1.png',
        '3/16′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_3_16_1.png',
        '1/4′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_1_4_1.png',
        '3/8′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_3_8_1.png',
        '1/2′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_1_2_1.png',
        '3/4′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_3_4_1.png',
        '1′′ = 1′-0′′': 'Hatch_Files/ScaleBars/Imperial/Imperial_1_1.png',
        // '1 1/2′′ = 1′-0′′' : 'Hatch_Files/ScaleBars/Imperial/Imperial_1_1_2.png' ,
        // '3′′ = 1′-0′′' : 'Hatch_Files/ScaleBars/Imperial/Imperial_3_1.png' ,
        // 'one' : 'Hatch_Files/ScaleBars/Imperial/Imperial_1_1.png',
        // 'two' : 'Hatch_Files/ScaleBars/Imperial/Imperial_1_1.png',
    },

    metricScaleBarsDict: {
        '1:100': 'Hatch_Files/ScaleBars/Metric/metric_1_100.png',
        '1:200': 'Hatch_Files/ScaleBars/Metric/metric_1_200.png',
        '1:250': 'Hatch_Files/ScaleBars/Metric/metric_1_250.png',
        '1:500': 'Hatch_Files/ScaleBars/Metric/metric_1_500.png',
        '1:1000': 'Hatch_Files/ScaleBars/Metric/metric_1_1000.png',
        '1:2000': 'Hatch_Files/ScaleBars/Metric/metric_1_2000.png',
        '1:10000': 'Hatch_Files/ScaleBars/Metric/metric_1_10000.png',
    },

    // name in the json file : name in the defaultStorage
    jsonOptionToPageOptionDict: {
        'gridWidth': 'GridlineThickness',
        'boreholeImgScale': 'HatchScale',
        'pathsWidth': 'LineThickness',
        'textSize': 'TEXTSIZE',
        'layerWidth': 'boreholeWidth',
        'cornerSize': 'PointSize',
    },

    minimumFieldTestWidth: 1,

    precision: 0.00001,
    zoomStep: 0.05,
    minimumZoom: 0.01,
    maximumZoom: 10,

    MAXIMUMPIXELS: 8196,
    maximumPreviewPixels: 512,

    viewer3d : {},
    isShowing3d: false,
    isShowingPlan: false,
    isShowingTerrain: false,
    isShowingMap: false,
    isInPanMode: false,
    isPerspectiveCamera: true,

    soilDescriptions : {
        "CH" : "High Plasticity Clay with Sand",
        "CL" : "Low Plasticity Clay with Sand",
        "CL-ML" : "Silty Clay to Clayey Silt",
        "FL" : "Fill Material",
        "GC" : "Clayey Gravel with Sand",
        "GC-GM" : "Clayey-Silty Gravel with Sand",
        "GM" : "Silty Gravel with Sand",
        "GP" : "Poorly Graded Gravel with Sand",
        "GP-GM" : "Poorly Graded Silty Gravel with Sand and Clay",
        "GP-GC" : "Poorly Graded Clayey Gravel with Sand and Silt",
        "GW" : "Well Graded Gravel with Sand",
        "GW-GM" : "Well Graded Silty Gravel with Sand and Clay",
        "GW-GC" : "Well Graded Clayey Gravel with Sand and Silt",
        "MH" : "High Plasticity Silt With Sand",
        "ML" : "Low Plasticity Silt With Sand",
        "OH" : "Organic Clay With High Plasticity",
        "OL" : "Organic Clay With Low Plasticity",
        "Pt" : "Peat",
        "SC" : "Clayey Sand With Gravel",
        "SC-SM" : "Clayey - Silty Sand With Gravel",
        "SM" : "Silty Sand With Gravel",
        "SP" : "Poorly Graded Sand With Gravel",
        "SP-SC" : "Poorly Graded Clayey Sand With Gravel & Silt",
        "SP-SM" : "Poorly Graded Silty Sand With Gravel & Clay",
        "SW" : "Well Graded Sand With Gravel",
        "SW-SC" : "Well Graded Clayey Sand With Gravel & Silt",
        "SW-SM" : "Well Graded Silty Sand With Gravel & Clay",
        "TILL" : "Till",
        "TS" : "Topsoil",
        "Water" : "Water-bearing Soil",
        "CobblesBoulders" : "Cobbles and Boulders",
        "Gravel_Sand" : "Mix of Sand and Gravel",
        "Gravel_Silt" : "Mix of Silt and Gravel",
        "Peat" : "Peat / Topsoil",
        "Sand" : "Sand",
        "Silt" : "Silt",
        "Clay" : "Clay",
        "Clay_Gravel" : "Mix of Clay and Gravel",
        "Clay_Sand" : "Mix of Clay and Sand",
        "Clay_Silt" : "Mix of Clay and Silt",
        "Gravel" : "Gravel",
    }
}

CrossSectionCanvas.prototype.setApplicationFont = function (applicationFont) {
    if (! applicationFont) {
        return;
    }
    this.storage.applicationFont = applicationFont;
    document.body.style?.setProperty('--headerFooterApplicationFont', applicationFont);
}

CrossSectionCanvas.prototype.cornerExtraOffset = function () {
    return -this.storage.LineThickness - this.storage.PointSize / 2;
}
CrossSectionCanvas.prototype.cornerWH = function () {
    return 2 * this.storage.LineThickness + this.storage.PointSize;
}

// center in unitCS: this.storage.regcx
// how many CU to the left?    1100*0.5*        not dep on scale var300

CrossSectionCanvas.prototype.c5x00 = function () {
    /* leftmost pixel, invisible beneath the axis */
    return this.x2svg(this.storage.REGCX) - 0.5 * this.storage.PIXW / this.storage.ZOOMSCALE;
}
CrossSectionCanvas.prototype.c5y00 = function () {
    return this.y2svg(this.storage.REGCY) - 0.5 * this.storage.PIXH / this.storage.ZOOMSCALE;
}
CrossSectionCanvas.prototype.xE = function () {
    /* rightmost pixel */
    return this.x2svg(this.storage.REGCX) + 0.5 * this.storage.PIXW / this.storage.ZOOMSCALE;
}
CrossSectionCanvas.prototype.yE = function () {
    return this.y2svg(this.storage.REGCY) + 0.5 * this.storage.PIXH / this.storage.ZOOMSCALE;
}
CrossSectionCanvas.prototype.x2svg = function (coord) {
    return coord * this.storage.AX
}
CrossSectionCanvas.prototype.y2svg = function (coord) {
    return coord * this.storage.AY
}

CrossSectionCanvas.prototype.pointBelongsToDifferent = function (point, timestamp) {
    const polygonsPointBelongsTo = this.getPolygonsPointBelongsTo(point.timestamp);
    const linesPointBelongsTo = this.getLinesPointBelongsTo(point.timestamp);
    const differentPoly = polygonsPointBelongsTo.some(timestamp2 => timestamp2 != timestamp);
    const differentLine = linesPointBelongsTo.some(timestamp2 => timestamp2 != timestamp);
    return differentPoly || differentLine || ! point.iamextrapoint;
}

CrossSectionCanvas.prototype.initializeStorage = function (dict = defaultStorage, rootElem = document.body) {
    this.storage = this.cloneObject(defaultStorage);


    this.uniq = this.uniqGen(0),
    this.storage.rootElem = rootElem;
    this.storage.d3_root = d3.select(this.storage.rootElem);
    this.storage.svg1 = this.storage.d3_root.select("svg.svgWindow");
    this.storage.svg2 = this.storage.d3_root.select("svg.svgFullscreen");

    // contains which symbol is associated to which color
    this.storage.hatchColors = new Map();
    this.storage.soilSymbols = new Map();

    // this.storage.pageOptions = this.cloneObject(this.storage.defaultOptions);
    this.changeUnit('ft', {updateSizes : false, redraw : false});

    this.storage.dragLegendProc = this.dragLegend();

    this.storage.ShowGridlines = true;
    this.storage.ShowGridlines_3D = true;
    this.storage.toggledOffClass = "toggledOff";

    this.storage.scaleHor = d3.scaleLinear().domain([100, 12000]).range([0, this.storage.PIXW]);
    this.storage.horAxisGenerator = d3.axisBottom(this.storage.scaleHor)
    this.storage.axisHor = this.storage.horAxisGenerator.ticks(8).tickFormat(v => v / 1.00);
    this.storage.axisHorG = this.storage.svg1.selectAll("g.axTop").classed("grid", 1).style('font-size', '14px')
        .call(this.storage.axisHor);
    this.storage.scaleVert = d3.scaleLinear().domain([0, 600]).range([0, this.storage.PIXH]);
    this.storage.vertAxisGenerator = d3.axisLeft(this.storage.scaleVert)
    this.storage.axisVert = this.storage.vertAxisGenerator.ticks(4).tickFormat(v => v / 1.00);
    // grid
    this.storage.axisVertG = this.storage.svg1.selectAll("g.axLeft").classed("grid", 1).style('font-size', '14px')
        .call(this.storage.axisVert);
    // this.storage.title of axis
    this.storage.tVert = this.storage.svg1.selectAll("g.axLeft.aboveAll").insert('text', ":first-child")
        .attr("x", 50).attr("y", this.storage.PIXH / 2)
        .classed("titleLeft", 1)
        .text("LEFTLEFT").attr("fill", "black").style("text-anchor", "middle")
    this.storage.dragHandler = d3.drag()
        .on('drag', event => this.dragged(event))

    // example of element:
    // timestamp : {showDepthLabels : true}
    this.storage.boreholeProperties = {};
    this.storage.selectingBorehole;

    // example of element:
    // timestamp : {showPoints : true}
    this.storage.fieldTestProperties = {};
    this.storage.selectingFieldTest;

    this.storage.polygonProperties = {};

    this.storage.linkProperties = {};
    this.storage.lineProperties = {};

    // Example of entry:
    // TILL : "desired name for the TILL hatch texture"
    this.storage.legendNames = {};
    this.storage.fieldTestIsResizing = false;

    // document origin, used for determining mouse position
    this.storage.origin = this.storage.svg1.append("circle").classed("origin", true).style("visibility", "hidden");

    this.storage.dragHandlerExtra = d3.drag()
        .filter(event => {
            return ! crossSectionObj.isInDrawMode();
        })
        .on('drag', this.draggedExtraPointGenerator())
        .on('end', d => {
            this.mergeClosePoints(d.timestamp);
        })
    const crossSectionObj = this;
    this.storage.dragHandlerText = d3.drag()
        .filter(event => {
            return ! crossSectionObj.isInDrawMode();
        })
        .on('drag', this.draggedTextGenerator())
        .on('start', this.dragStartedTextGenerator())
        .on('end', this.dragEndTextGenerator())
    
    this.storage.dragHandlerTextBox = d3.drag()
        .filter(event => {
            return ! crossSectionObj.isInDrawMode();
        })
        .on("drag", this.dragElemFactory({elemClass : 'textBox', propertyDictKey : 'texts'}))
        .on("start", this.dragStartElemFactory({propertyDictKey : 'texts'}))
        .on("end", this.dragEndElemFactory({callback : (timestamp) => {
            this.openTextPropertyGrid(timestamp);
        }}))
    
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    this.storage.dragHandlerPolygon = d3.drag()
    .filter(d => {
        const timestamp = d.timestamp;
        const properties = crossSectionObj.storage.polygonProperties[timestamp];
        return ! crossSectionObj.isInDrawMode() && ! properties?.isLocked;
    })
    .on("drag", this.dragElemFactory({elemClass : 'polygon', propertyDictKey : 'polygonProperties'}))
    .on("start", this.dragStartElemFactory({propertyDictKey : 'polygonProperties'}))
    .on("end", this.dragEndElemFactory({callback : (timestamp) => {
        const polygonProperties = this.storage.polygonProperties[timestamp];
        const properties = this.storage.POLYGONS.find(x => x.timestamp == timestamp);
        if (! polygonProperties || ! properties) {
            return;
        }
        
        const belongsToDifferent = properties.points.some(point => {
            return this.pointBelongsToDifferent(point, timestamp);
        })
        const newCoordinates = properties.points.map(point => {
            const x = point.x + this.storage.draggedTranslation[0];
            const yz = point.yz + this.storage.draggedTranslation[1];
            return {x : x, yz : yz};
        })
        // rebuilds polygon so it dettaches from other polygons, boreholes, links
        if (belongsToDifferent) {
            const newPoints = properties.points.map((point, index) => {
                const x = newCoordinates[index].x;
                const yz = newCoordinates[index].yz;
                const newPoint = {
                    timestamp: this.storage.uniq(),
                    x: x,
                    yz: yz,
                    originalX: x,
                    xx: x,
                    correct_yz: yz,
                    iamextrapoint: true,
                    // list of this.storage.polygons the point belongs to
                    belongsToPoly: []
                };
                return newPoint;
            })
            properties.points = newPoints;
            this.storage.EPOINTS.push(...newPoints);
        }
        // simply update values
        else {
            properties.points.forEach((point, index) => {
                const x = newCoordinates[index].x;
                const yz = newCoordinates[index].yz;
                point.x = x;
                point.yz = yz;
                point.originalX = x;
                point.xx = x;
                point.correct_yz = yz;
            })
        }
        this.drawExtraPoints(this.storage.svg1);
        this.drawPolygons(this.storage.svg1);
        // this.removeOrphanPoints();

        const elem = crossSectionObj.timestampToHtmlElem('.polygon', timestamp);
        const d = d3.select(elem).data()[0];
        crossSectionObj.openPolygonPropertyGrid(d);
    }}))

    const lineOnDragEndCallback = (timestamp) => {
        const lineProperties = this.storage.lineProperties[timestamp] ?? this.storage.linkProperties[timestamp];
        let properties = this.storage.LINKS.find(x => x.timestamp == timestamp);
        if (! properties || properties.length == 0) {
            properties = this.storage.lines.find(x => x.timestamp == timestamp);
        }
        if (! lineProperties || ! properties) {
            return;
        }
        const originalPoints = [properties.point1, properties.point2];
        
        const belongsToDifferent = originalPoints.some(point => {
            return this.pointBelongsToDifferent(point, timestamp);
        })
        const newCoordinates = originalPoints.map(point => {
            const x = point.x + this.storage.draggedTranslation[0];
            const yz = point.yz + this.storage.draggedTranslation[1];
            return {x : x, yz : yz};
        })
        // rebuilds line so it dettaches from other polygons, boreholes, links
        if (belongsToDifferent) {
            const newPoints = originalPoints.map((point, index) => {
                const x = newCoordinates[index].x;
                const yz = newCoordinates[index].yz;
                const newPoint = {
                    timestamp: this.storage.uniq(),
                    x: x,
                    yz: yz,
                    originalX: x,
                    xx: x,
                    correct_yz: yz,
                    iamextrapoint: true,
                    // list of this.storage.polygons the point belongs to
                    belongsToPoly: []
                };
                return newPoint;
            })
            properties.point1 = newPoints[0];
            properties.point2 = newPoints[1];
            this.storage.EPOINTS.push(...newPoints);
        }
        // simply update values
        else {
            originalPoints.forEach((point, index) => {
                const x = newCoordinates[index].x;
                const yz = newCoordinates[index].yz;
                point.x = x;
                point.yz = yz;
                point.originalX = x;
                point.xx = x;
                point.correct_yz = yz;
            })
        }
        this.lineDetach(properties);

        this.drawExtraPoints(this.storage.svg1);
        this.drawLinks(this.storage.svg1);
        this.removeOrphanPoints();



        const elem = crossSectionObj.timestampToHtmlElem('.g-link', timestamp);
        const d = d3.select(elem).data()[0];
        crossSectionObj.openLinePropertyGrid(d, d.water ?? false);
    };

    this.storage.dragHandlerLine = d3.drag()
    .filter(d => {
        const timestamp = d.timestamp;
        const properties = crossSectionObj.storage.lineProperties[timestamp];
        return ! crossSectionObj.isInDrawMode() && ! properties?.isLocked;
    })
    .on("drag", this.dragElemFactory({elemClass : 'g-link', propertyDictKey : 'lineProperties'}))
    .on("start", this.dragStartElemFactory({propertyDictKey : 'lineProperties'}))
    .on("end", this.dragEndElemFactory({callback : lineOnDragEndCallback}))

    this.storage.dragHandlerWaterLine = d3.drag()
    .filter(d => {
        const timestamp = d.timestamp;
        const properties = crossSectionObj.storage.linkProperties[timestamp];
        return ! crossSectionObj.isInDrawMode() && ! properties?.isLocked;
    })
    .on("drag", this.dragElemFactory({elemClass : 'g-link', propertyDictKey : 'linkProperties'}))
    .on("start", this.dragStartElemFactory({propertyDictKey : 'linkProperties'}))
    .on("end", this.dragEndElemFactory({callback : lineOnDragEndCallback}))

    this.storage.dragStartX = 0;
    this.storage.dragStartY = 0;

    this.storage.pt = this.storage.svg1.node().createSVGPoint();

    this.storage.ZOOMER = d3.zoom();

    this.storage = this.mergeOptions(this.storage, dict);
}

// those are the event listeners of the canvas only, not of the settings
CrossSectionCanvas.prototype.initializeEventListeners = function () {
    const arr = [
        ["click", "tsf", event => this.textSelectColor('purple')],
        ["click", "toggleGridButton", event => {
            if (! this.storage.isShowing3d) {
                this.onClickFlipGrid();
            }
            else {
                const buttonElem = this.storage.rootElem.querySelector(".toggleGridButton");
                this.storage.ShowGridlines_3D = buttonElem.classList.contains(this.storage.toggledOffClass);
                window['toggleGrids'](this.storage.viewer3d, this.storage.ShowGridlines_3D);
                if (this.storage.ShowGridlines_3D) {
                    this.enableButton(buttonElem);
                }
                else {
                    this.disableButton(buttonElem);
                }
            }
        }],
        ["click", "toggleWaterfrontModeButton", event => this.waterfrontMode(event.currentTarget)],
        ["click", "drawPolygon", event => this.toggleDrawPolygonMode()],
        ["click", "drawText", event => this.toggleDrawTextMode()],
        ["click", "drawLine", event => this.toggleDrawLineMode()],
        ["click", "deletePoly", event => this.deletePoly()],
        ["click", "polyShowInfo", event => this.polyShowInfo()],
        ["click", "polyFinishEdit", event => this.polyFinishEdit()],
        ["click", "legendRectFinishEdit", event => this.legendRectFinishEdit()],
        ["click", "fieldTestFinishEdit", event => this.fieldTestFinishEdit()],
        ["click", "fieldTestUpdatePropertiesFromInputs", event => this.fieldTestUpdatePropertiesFromInputs()],
        ["click", "boreholeFinishEdit", event => this.boreholeFinishEdit()],
        ["click", "boreholeUpdateProperties", event => this.boreholeUpdateProperties()],
        ["click", "textVisibility", event => this.textVisibility(true)],
        ["click", "textVisibility", event => this.textVisibility(false)],
        ["click", "textFinishEdit", event => this.textFinishEdit()],
        ["change", "clr0", event => this.textSelectColor(event.target.value)],
        ["click", "linkRemove", event => this.linkRemove()],
        ["click", "waterlineRemove", event => this.waterlineRemove()],
        ["click", "linkFinishEdit", event => this.linkFinishEdit()],
        ["click", "zoom", event => this.zoomWithTransition(1)],
        ["click", "incrementZoom", event => {
            if (! this.storage.isShowing3d) {
                this.incrementZoom()
            }
            else {
                window['zoomIn'](this.storage.viewer3d, this.storage.isPerspectiveCamera);
            }
        }],
        ["click", "decrementZoom", event => {
            if (! this.storage.isShowing3d) {
                this.decrementZoom();
            }
            else {
                window['zoomOut'](this.storage.viewer3d, this.storage.isPerspectiveCamera);
            }
        }],
        ["click", "zoomExtent", event => {
            if (! this.storage.isShowing3d) {
                this.zoomExtent(true)
            } else {
                window['zoomAll'](this.storage.viewer3d, this.storage.isShowingPlan);
            }
        }],
        ["click", "focusCenter", event => this.focusCenter(true)],
        // @ts-expect-error
        ["click", "ToggleSettings", event => this.ToggleSettings()],
        // @ts-expect-error
        ["click", "FieldTestsSettings", event => this.FieldTestsSettings()],
        ["click", "onclickLoadJson", event => this.onclickLoadJson()],
        ["click", "exportDrawingsToJsonFile", event => this.exportDrawingsToJsonFile()],
        ["click", "saveAlltoPng", event => this.saveAlltoPng()],
        ["click", "saveAllToSvg", event => this.saveAllToSvg()],
        // @ts-expect-error
        ["input", "textChange", event => this.textChange(event.target.value)],
        ["change", "gridon", event => this.changeGridOn()],
        ["click", "open2d", async event => {
            await window['open2d'](this, event.currentTarget);
        }],
        ["click", "plan-button", async event => {
            window['openPlan'](this, event.currentTarget);
        }],
        ["click", "open3d", async event => {
            window['open3d'](this, event.currentTarget);
        }],
        ,["click", "Export_DXF_Hatch", event => this.downloadToDXFHatch(this.storage.boreholeWidth)],
        ["click", "Export_DXF", event => this.downloadToDXF(this.storage.boreholeWidth)],
        ["click", "Export_GLTF", event => window['exportToGLTF'](this)],
        ["click", "Export_STL", event => window['exportToSTL'](this)],
        ["click", "Export_OBJ", event => window['exportToOBJ'](this)],
        ["click", "Export_Collada", event => window['exportToCollada'](this)],
        ["click", "Export_RS", event => this.downloadRSSectionMakerJson(this.storage.boreholeWidth)],
        ["click", "LocationIcon", event => window['resetTerrainPosition'](this)],
        ["click", "printButton", event => this.onClickOpenPrintModal()],
        ["click", "closePropertyGrid", event => this.onClickFlipPropertyGrid()],
        ["click", "panCanvas", event => {
            if (this.storage.isInPanMode) {
                return;
            }
            
            const controls = this.storage.viewer3d?.controls;

            window['setPanLeftClick'](controls, this.storage.viewer3d?.camera, true);
            const panButton = this.storage.rootElem.querySelector('.panCanvas');
            const rotateButton = this.storage.rootElem.querySelector('.rotateCanvas');
            this.enableButton(panButton);
            this.disableButton(rotateButton);
            this.storage.isInPanMode = true;
        }],
        ["click", "rotateCanvas", event => {
            if (! this.storage.isInPanMode) {
                return;
            }

            const controls = this.storage.viewer3d?.controls;

            window['setPanLeftClick'](controls, this.storage.viewer3d?.camera, false);
            const panButton = this.storage.rootElem.querySelector('.panCanvas');
            const rotateButton = this.storage.rootElem.querySelector('.rotateCanvas');
            this.disableButton(panButton);
            this.enableButton(rotateButton);
            this.storage.isInPanMode = false;
        }],
        ["click", "toggleCamera", event => {
            this.storage.isPerspectiveCamera = ! this.storage.isPerspectiveCamera;
            window['switchCameraToPerspective'](this.storage.viewer3d, this.storage.isPerspectiveCamera);
            const button = this.storage.rootElem.querySelector('.toggleCamera');            
            this.flipButton(button);
        }],
    ];
    arr.forEach(x => {
        if (!x) {
            return;
        }
        let [listen, id, fn] = x
        let elem = this.storage.rootElem.querySelector('.' + id);
        if (!elem) {
            return;
        }
        elem.addEventListener(listen, fn);
    })
}

var documentKeyDownEventListenerFn = null;

CrossSectionCanvas.prototype.attachKeyDown = function () {
    this.detachKeyDown();
    documentKeyDownEventListenerFn = (event) => this.onkeydown(event);
    document.body.addEventListener("keydown", documentKeyDownEventListenerFn, {capture: true});
}

CrossSectionCanvas.prototype.detachKeyDown = function () {
    if (! documentKeyDownEventListenerFn) {
        return;
    }
    // @ts-ignore
    document.body.removeEventListener("keydown", documentKeyDownEventListenerFn);
    documentKeyDownEventListenerFn = null;
}

CrossSectionCanvas.prototype.initializePage = function () {

    this.storage.svg1.style("background-color", "white")
    this.storage.svg2.style("display", "none")

    // not updated on start!!!!
    this.storage.svg1.selectAll("g.axTop.aboveAll").insert('text', ":first-child")
        .attr("x", this.storage.PIXW / 2).attr("y", -25)
        .classed("titleTop", true)
        .text("TOPTOP").attr("fill", "black").style("text-anchor", "middle")

    this.storage.d3_root.select(".mouselast").style("stroke-width", this.storage.LineThickness + "px").style("stroke", "red")
    this.storage.d3_root.select(".mousefirst").style("stroke-width", this.storage.LineThickness + "px").style("stroke", "red")
    this.storage.svg1.node().addEventListener("mousemove", event => this.onMouseMove(event));
    this.storage.svg1.node().addEventListener("mouseover", event => this.showCoordinateTooltip(event));
    this.storage.svg1.node().addEventListener("mouseout", event => this.hideCoordinateTooltip(event));
    // using {capture : true} because, without it, when drawing a polygon, you can't add a point on top of a borehole label
    // the event doesn't register, it probably is handled somewhere else and the the propagation is stopped
    this.storage.svg1.node().addEventListener("click", event => this.svgOnClick(event), {capture : true});
    this.storage.dragHandler(this.storage.svg1)

    this.storage.svg2.append("text").classed('selectpointtooltip', 1)
        .attr("x", 2000)
        .attr("y", 101)
        .text('hello world')
        .attr('font-size', '10px').attr('visibility', "hidden")

    this.storage.svg1.append("text").classed('selectpointtooltip', 1)
        .attr("x", 2000)
        .attr("y", 101)
        .text('hello world')
        .attr('font-size', '10px').attr('visibility', "hidden")

    this.attachKeyDown();
    const modal = this.storage.rootElem.closest('.modal');
    if (modal) {
        $(modal).on('shown.bs.modal', () => this.attachKeyDown());
        $(modal).on('hidden.bs.modal', () => this.detachKeyDown());
    }
    
    // Dealing with that manually worked way better than using D3.
    this.storage.rootElem.querySelector(".svgWindow").addEventListener("wheel", (event) => this.onWheel(event))

    this.storage.svg1.call(this.storage.ZOOMER);

    this.storage.rootElem.querySelector(".fieldTestOpacity").addEventListener("change", (event) => {
        var target = event.target
        if (target.value < 0.1) {
            target.value = 0.1;
        }
        if (target.value > 1) {
            target.value = 1;
        }
    })

    this.initializeEventListeners();
    this.initializeResizeObserver();
    this.initializeZoomExtentOnModalOpen();
    this.initializeSelectHatchTooltipEventListeners();
    this.disableRightClick();
    // this.initializeOptions();

}

CrossSectionCanvas.prototype.getDefaultImgSrc = function (d) {
    // returns the black version of the hatch src if it exists or undefined so it loads blue
    if (!d) {
        console.log("No data to get default img src from", d)
        return undefined
    }
    if (!d.layerSymbol) {
        return undefined;
    }
    var exImgArray = this.storage.d3_root.select("svg.svgWindow").select("defs").selectAll("pattern").data().filter(e => e).map(e => e.name)
    var imgSrc = this.getColoredSrc(`/Hatch_Files/PNG/Soil/000000/${d.layerSymbol}.png`)
    if (!exImgArray.find(e => e.includes(`000000/${d.layerSymbol}.png`))) {
        if (this.storage.hatchLoaded) {
            console.log("Not found image", imgSrc)
        }
        return undefined
    }
    return imgSrc
}

CrossSectionCanvas.prototype.getDefaultImgUrl = function (d) {

    var imgSrc = this.getDefaultImgSrc(d)
    if (!imgSrc) return "red";

    //this.storage.d3_root.select(`.Hatch_Files/PNG/${d.layerSymbol}.png`)
    // http://www.ilogonline.com/CSVDownload/GetDiagramBoreholes?name=Section%20A&projectId=bbcbf655-7b58-4630-aec2-18508647e3fc&tenantId=09fe846d-d502-8b56-d79f-39f858dfe842
    return `url(#${imgSrc})`
}

// ------------------- copypaste, not tested
CrossSectionCanvas.prototype.findValues = function (obj, key) {
    return this.findValuesHelper(obj, key, []);
}

CrossSectionCanvas.prototype.findValuesHelper = function (obj, key, list) {
    if (!obj) return list;
    if (obj instanceof Array) {
        for (var i in obj) {
            list = list.concat(this.findValuesHelper(obj[i], key, []));
        }
        return list;
    }
    if (obj[key]) list.push(obj[key]);

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                list = list.concat(this.findValuesHelper(obj[children[i]], key, []));
            }
        }
    }
    return list;
}
//--------------------

CrossSectionCanvas.prototype.uniqGen = function (base) {
    var counter = 1 + base;
    return () => {
        return counter += 1;
    }
}

CrossSectionCanvas.prototype.updateScales = function () {
    this.changeHorScale(this.storage.horScaleOption);
    this.changeVertScale(this.storage.vertScaleOption);
}

CrossSectionCanvas.prototype.getOptionFromPageUIName = function (selectHtmlElem) {
    /* Returns the string equivalent to the selected option in a <select> element */
    if (!selectHtmlElem) {
        return "";
    }
    var value = selectHtmlElem.value;
    var optionElem = selectHtmlElem.querySelector(`*[value="${value}"]`);
    var optionStr = optionElem.innerHTML;
    return optionStr;
}

// CrossSectionCanvas.prototype.getCurrentScale = function () {
//     /* Returns an array [horScale, vertScale] containing the selected options for horizontal scale and vertical scale */
//     let htmlElems;
//     if (this.storage.scaleIsFeet) {
//         htmlElems = [this.storage.rootElem.querySelector(".horScaleFt"),
//         this.storage.rootElem.querySelector(".vertScaleFt")];
//     }
//     else {
//         htmlElems = [this.storage.rootElem.querySelector(".horScaleM"),
//         this.storage.rootElem.querySelector(".vertScaleM")];
//     }
//     var scales = htmlElems.map(elem => this.getOptionFromPageUIName(elem));
//     return scales;
// }

CrossSectionCanvas.prototype.getCurrentScale = function () {
    /* Returns an array [horScale, vertScale], such as [64, 64] */
    return [this.storage.horScaleOption, this.storage.vertScaleOption];
}

CrossSectionCanvas.prototype.scaleNameToValue = function (scaleName) {
    if (! scaleName) {
        return null;
    }
    let scaleIsFeet = this.storage.scaleIsFeet;
    let scaleArrs = scaleIsFeet ? this.storage.defaultOptions.feet : this.storage.defaultOptions.m;
    let scaleArr = scaleArrs.find(arr => {
        console.log(arr, arr[0], scaleName)
        return arr[0] == scaleName
    });
    if (! scaleArr) {
        return null;
    }
    return scaleArr[1];
}

CrossSectionCanvas.prototype.getCurrentScaleName = function () {
    /* Returns an array [horScale, vertScale], such as ["3/16′′ = 1′-0′′", "3/16′′ = 1′-0′′"] */
    let scales = this.getCurrentScale();
    let unit = this.storage.scaleIsFeet;
    let arrs = unit ? this.storage.defaultOptions.feet : this.storage.defaultOptions.m;
    let scaleNames = scales.map(scale => {
        let arr = arrs.find(arr => arr[0] == scale || arr[1] == scale);
        if (arr == null || arr.length <= 0) {
            arr = arrs[0];
        }
        return arr[0];
    })
    return scaleNames;
}

CrossSectionCanvas.prototype.changeHorScale = function (val) {
    /* Changes horizontal scale to value passed */
    if (!val) {
        return;
    }
    var newScale = +val;
    this.applyPageOption('horScaleOption', newScale)
    this.storage.AX = this.storage.scaleToReal / (+val)

    console.log("Scale Hor", newScale, "Measure", this.storage.Unit)
    this.storage.d3_root.select('.bopen1').classed("disabledarea", 0)
    this.storage.d3_root.select('.bopen2').classed("disabledarea", 0)

    if (this.storage.data0) this.redraw();
}


CrossSectionCanvas.prototype.changeVertScale = function (val) {
    /* Changes vertical scale to value passed */
    if (!val) {
        return;
    }
    var newScale = +val;
    this.applyPageOption('vertScaleOption', newScale);
    this.storage.AY = this.storage.scaleToReal / (+val)

    console.log("Scale Vert", newScale, "Measure", this.storage.Unit)
    this.storage.d3_root.select('.bopen1').classed("disabledarea", 0)
    this.storage.d3_root.select('.bopen2').classed("disabledarea", 0)

    if (this.storage.data0) this.redraw();
}

async function openFile(callback, options={}) {
    /* Shows the UI to pick a file from the user's computer and executes callback for that file */
    const [fileHandle] = await window['showOpenFilePicker'](options);
    callback(fileHandle);
}

CrossSectionCanvas.prototype.preProcessBoreholeJson = function (originalJson) {
    if (! originalJson) {
        return originalJson;
    }
    const jsonData = this.cloneObject(originalJson);
    jsonData.forEach(borehole => {
        const coordinates = borehole?.th_viewer_coordinates?.split(',').map(x => parseFloat(x));
        if (coordinates && coordinates.length == 2) {
            const [x, z] = coordinates;
            const y = parseFloat(borehole?.th_depth) ?? 0;
            borehole.th_viewer_coordinates = `${x}, ${z}, ${y}`;
            console.log("Elevation not found in borehole th_viewer_coordinates, adding\n", borehole.th_viewer_coordinates)
        }
        if (! coordinates) {
            const x = 0;
            const y = 0;
            const z = 0;
            borehole.th_viewer_coordinates = `${x}, ${z}, ${y}`;
            console.log("th_viewer_coordinates of borehole not found, generating default\n", borehole.th_viewer_coordinates)
        }
    })
    return jsonData;
}

const oldColorToHexDict = {
    Black : '000000',
    Red : 'ff0000',
    Lime : '00ff00',
    Green : '008000',
    Blue : '0000ff',
    Cyan : '00ffff',
    Yellow : 'ffff00',
    Magenta : 'ff00ff',
    Brown : '8b4513',
    Maroon : '800000',
}

CrossSectionCanvas.prototype.preProcessJson = function (originalJson) {
    if (! originalJson) {
        return originalJson;
    }

    const jsonData = this.cloneObject(originalJson);
    if (! jsonData.Terrain_Data) {
        jsonData.Terrain_Data = {
            site_center : "40, -120",
            site_radious: "0.1",
            zoomlevel: "15",
            type: "1",
            contours_color: "#C2C2C2",
            axis_helper: false
        }
        console.log("Terrain_Data not found, adding default");
    }
    if (! jsonData.id) {
        jsonData.id = 'DefaultID';
    }
    const boreholes = jsonData.data;
    if (boreholes) {
        boreholes.forEach(borehole => {
            const coordinates = borehole?.general?.th_viewer_coordinates?.split(',').map(x => parseFloat(x));
            if (coordinates && coordinates.length == 2) {
                const [x, z] = coordinates;
                const y = parseFloat(borehole?.general?.z);
                borehole.general.th_viewer_coordinates = `${x}, ${z}, ${y}`;
                console.log("Elevation not found in borehole th_viewer_coordinates, adding\n", borehole.general.th_viewer_coordinates)
            }
            if (! coordinates) {
                const x = parseFloat(borehole?.general.x)
                const y = parseFloat(borehole?.general?.z);
                const z = 0;
                borehole.general.th_viewer_coordinates = `${x}, ${z}, ${y}`;
                console.log("th_viewer_coordinates of borehole not found, generating them in two axis only\n", borehole.general.th_viewer_coordinates)
            }
            if (typeof borehole?.general?.test_data == 'string') {
                borehole.general.test_data = [{
                    title : borehole?.general?.test_title ?? '',
                    data : borehole?.general?.test_data ?? ''
                }]
            }
        })
    }
    const polygons = this.eitherKey(jsonData, 'POLYGONS', 'polygons');

    if (polygons) {
        polygons.forEach(polygon => {
            let timestamp = polygon.timestamp;
            if (! jsonData.polygonProperties) {
                jsonData.polygonProperties = {};
            }
            if (! jsonData.polygonProperties[timestamp]) {
                jsonData.polygonProperties[timestamp] = {};
            }
            let properties = this.cloneObject(this.storage.polygonDefaultProperties);
            properties = {...properties, ...(jsonData.polygonProperties[timestamp])};

            if (polygon.fsrc) {
                let fsrc = polygon.fsrc;
                const oldColor = this.pathToColor(fsrc);
                const hex = oldColorToHexDict[oldColor];
                if (hex) {
                    fsrc = fsrc.replace(oldColor, hex)
                    polygon.fsrc = fsrc;
                    properties.patternColor = hex;
                }
                polygon.fsrc = polygon.fsrc.replace('/Soil/', '/USCS/');
                properties.hatch = this.pathToName(fsrc);
                properties.patternColor = fsrc;
                properties.fillStyle = 'Pattern';
            }
            else {
                properties.fillStyle = 'Solid';
            }
    
            if (! polygon?.fsrc) {
                // update the color of polygons with no hatch to the new default color
                polygon.f = this.storage.defaultPolygonFill;
            }
            if (polygon.f) {
                const oldColor = this.pathToColor(polygon.f);
                const hex = oldColorToHexDict[oldColor];
                if (oldColor && hex) {
                    polygon.f = polygon.f.replace(oldColor, hex)
                }
                polygon.f = polygon.f.replace('/Soil/', '/USCS/');
            }

            jsonData.polygonProperties[timestamp] = properties;
        })
    }

    while (typeof jsonData.fieldTestProperties == "string") {
        jsonData.fieldTestProperties = JSON.parse(jsonData.fieldTestProperties);
    }

    const propertiesToCopy = [
        {
            dataArr : this.eitherKey(jsonData, 'links', 'LINKS'),
            getTimestamp : (item) => item.timestamp,
            propertiesKey : 'linkProperties',
            defaultProperties: this.storage.waterlineDefaultProperties
        },
        {
            dataArr : this.eitherKey(jsonData, 'lines', 'LINES'),
            getTimestamp : (item) => item.timestamp,
            propertiesKey : 'lineProperties',
            defaultProperties: this.storage.lineDefaultProperties
        },
        {
            dataArr : this.eitherKey(jsonData, 'data', 'DATA'),
            getTimestamp : (item) => {
                const soillayer = item.soillayer;
                if (! soillayer || soillayer.length <= 0 || ! soillayer[0]) {
                    return null;
                }
                return soillayer[0].timestamp;
            },
            propertiesKey : 'boreholeProperties',
            defaultProperties: this.storage.boreholeDefaultProperties
        },
        {
            // fieldtest timestamp is same as borehole and the data is inside the borehole
            dataArr : this.eitherKey(jsonData, 'data', 'DATA'),
            getTimestamp : (item) => {
                const soillayer = item.soillayer;
                if (! soillayer || soillayer.length <= 0 || ! soillayer[0]) {
                    return null;
                }
                return soillayer[0].timestamp;
            },
            propertiesKey : 'fieldTestProperties',
            defaultProperties: this.storage.fieldTestDefaultProperties
        },
    ]
    propertiesToCopy.forEach(dict => {
        if (! dict.dataArr) {
            return;
        }
        dict.dataArr.forEach(data => {
            let timestamp = dict.getTimestamp(data);
            if (timestamp == null) {
                return;
            }
            if (! jsonData[dict.propertiesKey]) {
                jsonData[dict.propertiesKey] = {};
            }
            if (! jsonData[dict.propertiesKey][timestamp]) {
                jsonData[dict.propertiesKey][timestamp] = {};
            }
            let properties = this.cloneObject(dict.defaultProperties);
            properties = {...properties, ...(jsonData[dict.propertiesKey][timestamp])};
            jsonData[dict.propertiesKey][timestamp] = properties;
        })

    })

    jsonData.legendBoxW = parseFloat(jsonData.legendBoxW ?? jsonData.W ?? defaultStorage.legendBoxW);
    jsonData.legendBoxH = parseFloat(jsonData.legendBoxH ?? jsonData.xH ?? defaultStorage.legendBoxH);

    if ('SectionName' in jsonData) {
        delete jsonData['SectionName'];
    }

    if ('hatchColors' in jsonData) {
        Object.entries(jsonData.hatchColors).forEach(entry => {
            const [key, value] = entry;
            const hexColor = oldColorToHexDict[value];
            if (! hexColor) {
                return;
            }
            jsonData.hatchColors[key] = hexColor;
        })
    }

    const links = jsonData.LINKS ?? [];
    const lines = jsonData.lines ?? [];
    const allLines = [...links, ...lines];
    const lineProperties = jsonData.lineProperties ?? {};
    const linkProperties = jsonData.linkProperties ?? {};
    allLines.forEach(line => {
        if (! line) {
            return;
        }
        const properties = lineProperties[line.timestamp] ?? linkProperties[line.timestamp];
        if (! properties) {
            return;
        }
        if (properties.strokeWidth == "0.5" || properties.strokeWidth == 0.5) {
            properties.strokeWidth = "1";
        }
    })

    if (jsonData.LineThickness) {
        if (jsonData.LineThickness == "0.5" || jsonData.LineThickness == 0.5) {
            jsonData.LineThickness = "1";
        }
    }

    if (jsonData.HatchScale) {
        if (parseInt(jsonData.HatchScale) < 10) {
            jsonData.HatchScale = 10;
        }
    }

    if (jsonData.PointSize) {
        if(parseInt(jsonData.PointSize) < 5) {
            jsonData.pointSize = 5;
        }
    }

    return jsonData;
}

CrossSectionCanvas.prototype.loadJsonGenerator = function () {
    let CrossSectionObj = this;

    return async function (fileHandle) {
        /* Given a fileHandle, loads page from a JSON */
        let file = await fileHandle.getFile();
        let jsonString = await file.text();
        let jsonData = JSON.parse(jsonString);
        
        CrossSectionObj.processDataWithRedraw(jsonData);
    }
}

CrossSectionCanvas.prototype.onclickLoadJson = function () {
    openFile(this.loadJsonGenerator(), {
        types : [
            {   
                accept : {
                    "application/json" :  [".json"],
                }
            }
        ]
    });
}



CrossSectionCanvas.prototype.changeBoreholeImgScale = function (newHatchScale) {
    this.applyPageOption('HatchScale', newHatchScale);
    this.refreshBoreholeImgScale();
    this.storage?.rootElem?.style?.setProperty('--hatchRepeat', newHatchScale);
}

CrossSectionCanvas.prototype.refreshBoreholeImgScale = function () {
    this.scalePatterns();
}

CrossSectionCanvas.prototype.changeGridPathWidth = function (GridlineThickness) {
    this.applyPageOption('GridlineThickness', +GridlineThickness);
    this.refreshGridPathWidth();
}

CrossSectionCanvas.prototype.refreshGridPathWidth = function () {
    this.storage.d3_root.selectAll("g.grid line").style('stroke-width', this.storage.GridlineThickness + 'px')
    this.drawAllFieldTests();
}



CrossSectionCanvas.prototype.changePathsWidth = function (LineThickness) {
    this.applyPageOption('LineThickness', LineThickness);
    this.refreshPathsWidth();
}

CrossSectionCanvas.prototype.refreshPathsWidth = function () {
    this.storage.d3_root.selectAll(".sw").style("stroke-width", this.storage.LineThickness + "px")

    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    // .xx for bhpoint, .x for freepoint
    this.storage.d3_root.selectAll(".point")
        .attr("x", pt => (pt.xx || pt.x) * this.storage.AX * coordinateUnitFactor + this.cornerExtraOffset())
        .attr("y", pt => -pt.correct_yz * this.storage.AY * coordinateUnitFactor + this.cornerExtraOffset())
        .attr("width", this.cornerWH())
        .attr("height", this.cornerWH())
        .style('stroke-width', this.storage.LineThickness + 'px')

    /*
        this.storage.d3_root.selectAll("g.grid line").attr('stroke-width', this.storage.LineThickness + 'px')
          .attr('stroke-dasharray', this.storage.LineThickness)
    */
    this.drawAllFieldTests();
    this.drawPolygons(this.storage.svg1);
}

CrossSectionCanvas.prototype.changeCornerSize = function (PointSize) {
    this.applyPageOption('PointSize', PointSize);
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    // .xx for bhpoint, .x for freepoint
    this.storage.d3_root.selectAll(".point")
        .attr("x", pt => (pt.xx || pt.x) * this.storage.AX * coordinateUnitFactor + this.cornerExtraOffset())
        .attr("y", pt => -pt.correct_yz * this.storage.AY * coordinateUnitFactor + this.cornerExtraOffset())
        .attr("width", this.cornerWH())
        .attr("height", this.cornerWH())
        .style('stroke-width', this.storage.LineThickness + 'px')
}

CrossSectionCanvas.prototype.getBoreholeScale = function () {
    var bhScale = this.storage.boreholeWidth;
    return bhScale;
}

CrossSectionCanvas.prototype.getBoreholeWidth = function (borehole) {
    return this.getBoreholeWidth2(borehole.general.disp_w);
}

CrossSectionCanvas.prototype.getBoreholeWidth2 = function (display_width) {
    /* Receives borehole.general.disp_w value under the JSON value */
    let bhScale = this.getBoreholeScale();
    return display_width * bhScale / 100 * this.storage.AX * this.getCoordinateUnitFactor();

}



CrossSectionCanvas.prototype.createWaterIcon = function (waterIconSize, options={}) {
    var iconLinesKeypoints = [
        [-0.8, -0.8, 0.8, -0.8],
        [0, 0, -0.8, -0.8],
        [0, 0, 0.8, -0.8],
        [-0.8, 0, 0.8, 0],
        [-0.5, 0.4, 0.5, 0.4],
        [-0.2, 0.8, 0.2, 0.8]
    ]

    // var waterX = xPlunge(borehole.general.x, borehole.general.water, borehole.general.plunge)
    // var waterY = yPlunge(borehole.general.z, borehole.general.water, borehole.general.plunge)

    // ideally i would create the element outside of the canvas
    // but changing the element without first appending causes it to not show at all, even after appending
    var svgElem = this.storage.d3_root.select(".svgWindow").append("g").classed("cdr", true)
    .attr("elemType", "waterSymbol");
    var allIconLines = svgElem.selectAll("line").data(iconLinesKeypoints);

    allIconLines.enter()
        .append("line")
        .classed("sw", 1)
        .attr("x1", d => d[0] * waterIconSize)
        .attr("y1", d => d[1] * waterIconSize)
        .attr("x2", d => d[2] * waterIconSize)
        .attr("y2", d => d[3] * waterIconSize)
        .style("stroke-width", options.strokeWidth ?? this.storage.LineThickness + "px")
        .style("stroke", options.stroke ?? "blue")
        .style("stroke-opacity", options.strokeOpacity ?? 1)

    svgElem.append("rect")
        .attr("x", -1 * waterIconSize)
        .attr("y", -1 * waterIconSize)
        .attr("width", 2 * waterIconSize)
        .attr("height", 2 * waterIconSize)
        // for export to png to not render it
        .style("stroke", "transparent")
        .style("fill", "transparent")

    var htmlElem = svgElem.node();
    return htmlElem;
}

CrossSectionCanvas.prototype.getWaterIconSize = function () {
    const boreholeScale = this.getBoreholeScale();
    let waterPointSize = 0;
    if (boreholeScale >= 100) {
        var boreholeWidth = this.getBoreholeWidth2(this.storage.defaultBoreholeDisplayWidth)
        waterPointSize = this.storage.WaterSymbolSize * (0.75 * boreholeWidth) / 100;
    }
    else {
        // ilog version, where boreholeScale is a number in meters
        // and borehole display width is something like 100 instead of being 0.25
        var boreholeWidth = this.getBoreholeWidth2(100);
        waterPointSize = this.storage.WaterSymbolSize * (0.75 * boreholeWidth) / 100;
    }
    return waterPointSize ?? 1;
}

CrossSectionCanvas.prototype.changeWaterIconSize = function () {

    console.log("Change water icons size... TODO attach data")

    // this.storage.d3_root.select('.waterIconSize').attr("step", 5);
    this.storage.svg1.select("g.water-symbols").selectAll("g.cdr").remove()
    this.storage.svg1.selectAll(".cdr").remove()
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    const depthUnitFactor = this.getDepthUnitFactor();

    this.storage.data0.forEach(borehole => {

        // let offset = this.getOffset(borehole);

        // draw water
        if (borehole.general.water >= 0) {

            // option removed
            // var waterIconSize = +this.storage.d3_root.select('.waterIconSize').property("value");
            // var waterIconSize = 50;
            // percentages of borehole
            // var bhScale = +this.storage.d3_root.select('.bw').property("value");
            var waterIconSize = this.storage.WaterSymbolSize * (0.75 * this.getBoreholeWidth(borehole)) / 100;
            // console.log(waterIconSize)

            var waterIcon = this.createWaterIcon(waterIconSize);

            this.storage.rootElem.querySelector("g.water-symbols").appendChild(waterIcon);


            // value should be based on borehole points instead of this xx
            let translationX = xPlunge(coordinateUnitFactor * borehole.general.x, depthUnitFactor * borehole.general.water, borehole.general.plunge) * this.storage.AX;

            let translationY = - yPlunge(coordinateUnitFactor * borehole.general.z, depthUnitFactor * borehole.general.water, borehole.general.plunge) * this.storage.AY;

            d3.select(waterIcon)
                .attr("transform", `translate(${translationX} ${translationY})`)

            d3.select(waterIcon).select("rect").data([borehole.waterPoint])
                .on("click", (pt) => {
                    if (this.storage.WATERFRONTMODE) {
                        this.handleMouseClickPoint(pt, this.storage.svg1)
                    } else {
                        borehole.general.showWater = !borehole.general.showWater;
                        this.changeWaterIconSize();
                    }
                })
        }
    })

    // water this.storage.links have waterpoints in the middle of them that have to be updated
    this.drawLinks(this.storage.svg1);
}

CrossSectionCanvas.prototype.refreshTexts = function () {
    this.storage.d3_root.selectAll(".fsz").attr('font-size', this.storage.TEXTSIZE + 'px')
    //alert("CTSZ!!!")
    this.refreshLegend();
}

CrossSectionCanvas.prototype.changeTextSize = function (TEXTSIZE) {
    this.storage.TEXTSIZE = TEXTSIZE;
    this.refreshTexts();
    this.storage?.rootElem?.style?.setProperty('--fontSize', `${TEXTSIZE}px`);
}



// function this.changeGridOn() {
//     var this.storage.ShowGridlines = this.storage.d3_root.select('.gridon').property("checked");
//     //this.storage.d3_root.selectAll(".grid").style("visibility", (this.storage.ShowGridlines)? "visible": "hidden")
//     this.coordUpd()
// }



CrossSectionCanvas.prototype.enableButton = function (elem) {
    elem.classList.remove(this.storage.toggledOffClass);
}

CrossSectionCanvas.prototype.disableButton = function (elem) {
    elem.classList.add(this.storage.toggledOffClass);
}

CrossSectionCanvas.prototype.flipButton = function (elem) {
    if (!elem) {
        return;
    }

    if (elem.classList.contains(this.storage.toggledOffClass)) {
        this.enableButton(elem);
    }
    else {
        this.disableButton(elem);
    }
}

CrossSectionCanvas.prototype.onClickFlipGrid = function () {
    var buttonElem = this.storage.rootElem.querySelector(".toggleGridButton");
    this.flipButton(buttonElem);
    this.changeGridOn();
}

CrossSectionCanvas.prototype.changeGridOn = function () {
    this.storage.ShowGridlines = !this.storage.rootElem.querySelector(".toggleGridButton").classList.contains(this.storage.toggledOffClass);
    this.coordUpd();
}

CrossSectionCanvas.prototype.getUnitConversionFactor = function (fromUnit, toUnit) {
    if (fromUnit == toUnit) {
        return 1;
    }
    return toUnit == 'ft' ? 3.28084 : 1 / 3.28084;
}

// auxiliary function to getCoordinateUnitFactor
// the storage might not always have a coordinate unit
CrossSectionCanvas.prototype.getCoordinateUnit = function () {
    return this.storage.Coordinates_Unit ?? this.storage.Unit;
}

CrossSectionCanvas.prototype.getProjectDepthUnit = function () {
    return this.storage.ProjectDepth_Unit ?? this.storage.Unit;
}

CrossSectionCanvas.prototype.getCoordinateUnitFactor = function () {
    return this.getUnitConversionFactor(this.getCoordinateUnit(), this.storage.Unit);
}

CrossSectionCanvas.prototype.getDepthUnitFactor = function () {
    return this.getUnitConversionFactor(this.getProjectDepthUnit(), this.storage.Unit);
}

const defaultChangeUnitOptions = {
    updateSizes : true,
    redraw : true
}
CrossSectionCanvas.prototype.changeUnit = function (newUnit, options = defaultChangeUnitOptions) {
    options = {...defaultChangeUnitOptions, ...options};
    if (! newUnit || ! ['m', 'ft'].includes(newUnit)) {
        return;
    }
    const oldUnit = this.storage.Unit;
    let factor = this.getUnitConversionFactor(oldUnit, newUnit);
    if (newUnit == oldUnit) {
        factor = 1;
    }
    if (! options.updateSizes) {
        factor = 1;   
    }
    const unitM = newUnit == 'm';

    const keysToUpdate = [];
    keysToUpdate.forEach(key => {
        let newValue = parseFloat(this.storage[key]) * factor;
        if (unitM) {
            newValue = Math.round(newValue);
        }
        newValue = coerceType(newValue, this.storage[key]);
        this.storage[key] = newValue;
    });
    
    this.storage.Unit = newUnit;
    this.storage.scaleToReal = (newUnit == 'ft') ? this.storage.KFT : this.storage.KM;
    this.storage.scaleIsFeet = (newUnit == 'ft') ? true : false;

    if (options.redraw) {
        // already redraws everything from what I understood
        this.updateAllyAndPointData();
        this.updateScales();
        const replace = (text) => {
            return text.replace(`(${oldUnit})`, `(${newUnit})`);
        }
        this.storage.axisVertText = replace(this.storage.axisVertText);
        this.storage.axisHorText = replace(this.storage.axisHorText);
        this.initializeFromDict('titleLeft');
        this.initializeFromDict('titleTop');
        this.initializePropertyGrid();
        this.zoomExtent();
    }
}

CrossSectionCanvas.prototype.getDefaultTitleTop = function () {
    return "Distance (" + this.storage.Unit + ")";
}

CrossSectionCanvas.prototype.getDefaultTitleLeft = function () {
    return "Elevation (" + this.storage.Unit + ")";
}

CrossSectionCanvas.prototype.runIfFunction = function (value) {
    if (! (typeof value == "function")) {
        return value;
    }
    return value();
}

/*
The idea is to have a generic function that can both update an object on the screen 
and modify the corresponding data on the storage

all of the arguments can be functions with no arguments () => {}
they'll be called once the function runs

attribute has to be an attribute compatible with d3 js
- selector: element or selector
- attribute: attribute to be updated
- value: new value of attribute
- dict: dict where the value is found in the cross section storage
- key: key that accesses the value

*/
CrossSectionCanvas.prototype.genericSetter = function (selector, attribute, value, dict, key) {
    if (! selector || ! dict || ! key || ! attribute) {
        return;
    }
    selector = this.runIfFunction(selector);
    attribute = this.runIfFunction(attribute);
    value = this.runIfFunction(value);
    dict = this.runIfFunction(dict);
    key = this.runIfFunction(key);

    let elem = this.storage.svg1.select(selector);
    if (attribute == 'text' && value != null) {
        elem.text(value);
    }
    else if (['font-size', 'font-family', 'font-weight'].includes(attribute)){
        elem.style(attribute, value);
    }
    else {
        elem.attr(attribute, value);
    }

    // updates value on the storage
    dict[key] = value;
}

// same thing as genericSetter, but will use the text already stored in the dict if possible
// all of the arguments can be strings or functions with no arguments () => {}
CrossSectionCanvas.prototype.genericInitializer = function (selector, attribute, defaultValue, dict, key) {
    if (! selector || ! dict || ! key || defaultValue == null) {
        return;
    }
    selector = this.runIfFunction(selector);
    attribute = this.runIfFunction(attribute);
    defaultValue = this.runIfFunction(defaultValue);
    dict = this.runIfFunction(dict);
    key = this.runIfFunction(key);

    const value = (dict[key] ? dict[key] : defaultValue) ?? '';
    this.genericSetter(selector, attribute, value, dict, key);
}

// returns parameters to be used on the genericInitializer function
CrossSectionCanvas.prototype.getInitializerDict = function () {
    const dict = {
        titleTop : {
            selector : '.axTop .titleTop',
            dict : () => this.storage,
            attributes : {
                'text' : {
                    key : 'axisHorText',
                    defaultValue : () => this.getDefaultTitleTop(),
                },
                'font-size' : {
                    key : 'axisHorFontSize',
                    defaultValue: '14',
                },
                'font-family' : {
                    key : 'axisHorFontFamily',
                    defaultValue: "Arial",
                },
            },
        },
        titleLeft : {
            selector : '.axLeft .titleLeft',
            dict : () => this.storage,
            attributes : {
                'text' : {
                    key : 'axisVertText',
                    defaultValue : () => this.getDefaultTitleLeft(),
                },
                'font-size' : {
                    key : 'axisVertFontSize',
                    defaultValue: '14',
                },
                'font-family' : {
                    key : 'axisVertFontFamily',
                    defaultValue: "Arial",
                },
            },
        }
    };
    return dict;
}

// initializes using the default values provided by the initializer dict
CrossSectionCanvas.prototype.initializeFromDict = function (key) {
    const initializerDict = this.getInitializerDict();
    if ( ! initializerDict[key] ) {
        return;
    }
    const {selector, dict, attributes} = initializerDict[key];
    console.log(initializerDict, initializerDict[key])
    Object.entries(attributes).forEach(entry => {
        const [attribute, values] = entry;
        console.log(attribute, values)
        if (attribute && values.key && values.defaultValue) {
            this.genericInitializer(selector, attribute, values.defaultValue, dict, values.key);
        }
    })
}

// sets text, font-size, font-family...
// check key and its attributes on initialize dict
CrossSectionCanvas.prototype.setFromDict = function (key, attribute, value) {
    const initializerDict = this.getInitializerDict();
    if ( ! initializerDict[key] ) {
        return;
    }
    let {selector, dict, attributes} = initializerDict[key];
    const dictKey = attributes[attribute].key;
    this.genericSetter(selector, attribute, value, dict, dictKey);
}

CrossSectionCanvas.prototype.getScaleVertPixels = function () {
    /* Calculates from which pixel to which pixel the vertical axis is. */
    return [this.yE(), this.c5y00()];
}

CrossSectionCanvas.prototype.getScaleHorPixels = function () {
    /* Calculates from which pixel to which pixel the vertical axis is. */
    return [this.xE(), this.c5x00() + this.storage.XOFFPIX / this.storage.ZOOMSCALE];
}

// PS: those values are in the d3 coordinate system, starting at top left, going down and to the right
// Also, this doesn't take into account the size of the top and left bar (this.storage.XOFFPIX and )
CrossSectionCanvas.prototype.pixelsToRealY = function (pixels) {
    /* Given a height in pixels, calculates how many real world units (in meters or feet) it represents */
    return pixels / this.storage.AY;
}

CrossSectionCanvas.prototype.pixelsToRealX = function (pixels) {
    /* Given a width in pixels, calculates how many real world units (in meters or feet) it represents */
    return pixels / this.storage.AX;
}

CrossSectionCanvas.prototype.getScaleVertDomain = function () {
    /* Calculates the domain of the vertical axis in real world units (meter or feet). For example, returns that the vertical axis must span from -20m of elevation to 40m of elevation. */
    let pixels = this.getScaleVertPixels();
    return [this.pixelsToRealX(pixels[0]), this.pixelsToRealY(pixels[1])];
    // return [this.yE()/this.storage.AY, this.c5y00()/this.storage.AY + this.storage.YOFFPIX/this.storage.AY/this.storage.ZOOMSCALE];
}

CrossSectionCanvas.prototype.coordUpd = function () {

    // ${55*scl/this.storage.ZOOMSCALE}       ${this.xE() - this.c5x00()}
    // console.log("VB width (pix showed of scaled map), 1100 units anyway", this.xE() - this.c5x00())
    this.storage.svg1.attr("viewBox", `${this.c5x00()} ${this.c5y00()} ${this.storage.PIXW / this.storage.ZOOMSCALE} ${this.storage.PIXH / this.storage.ZOOMSCALE}`)
    this.storage.svg1.attr("width", this.storage.PIXW).attr("height", this.storage.PIXH)
    // var this.storage.ShowGridlines = this.storage.d3_root.select('.gridon').property("checked");

    // the axis is an element just like any other in the canvas
    // meaning that if the user zooms it looks bigger or smaller
    // if the user pans, they stop seeing it
    // so we need to take both of those things into account
    const sizeOfBottomAxis = this.storage.YOFFPIX / this.storage.ZOOMSCALE;
    const canvasHeight = this.storage.PIXH / this.storage.ZOOMSCALE;
    // this usually would be where we would put the bottom axis if the user was looking at the origin
    const distanceBetweenTopAndBottomAxis = canvasHeight - sizeOfBottomAxis;
    const canvasContentOffsetY = this.c5y00();
    const bottomAxisPosition = distanceBetweenTopAndBottomAxis + canvasContentOffsetY;
    this.storage.svg1.selectAll("g.axTop").attr("transform",
        `translate(${this.c5x00() + 0}, ${bottomAxisPosition})`
        + ` scale(${1.0 / this.storage.ZOOMSCALE})`
    )

    // range receives the values without taking zoom into account
    this.storage.scaleHor.domain([this.c5x00() / this.storage.AX + this.storage.XOFFPIX / this.storage.AX / this.storage.ZOOMSCALE, this.xE() / this.storage.AX]).range([this.storage.XOFFPIX, this.storage.PIXW])
    
    // axis is already properly positioned, just need to position the title inside it
    this.storage.axisHorG.select(".titleTop")
    .attr("x", this.storage.PIXW / 2 * 1.0)
    .attr("y", this.storage.YOFFPIX - 10)
    
    const tickSize = -this.storage.PIXH * this.storage.ShowGridlines + 3;
    this.storage.axisHorG.call(d3.axisBottom(this.storage.scaleHor).ticks(8).tickFormat(v => v / 1.00).tickSize(tickSize))

    //===================================================== Update grid LEFT  +100 
    this.storage.svg1.selectAll("g.axLeft").attr("transform",
        `translate(${this.c5x00() + this.storage.XOFFPIX / this.storage.ZOOMSCALE}, ${this.c5y00() + 0})`
        + ` scale(${1.0 / this.storage.ZOOMSCALE})`
    )

    // from what i understood, the domain is the numbers being shown in the scale
    // while the range is the vertical position of the scale inside the screen
    // the range begins from top to bottom
    // the vertical scale is simply something drawn on screen, it won't change the scale of d3 itself, that's what is causing the issue
    // range receives the values without taking zoom into account
    this.storage.scaleVert.domain(this.getScaleVertDomain()).range([this.storage.PIXH - this.storage.YOFFPIX, 0])
    this.storage.tVert.attr("x", 0).attr("y", 0).style("text-anchor", "middle")
        .attr("transform", `rotate(270) translate(${- this.storage.PIXH / 2} ${-this.storage.XOFFPIX / 2})`)
    let horTickSize = -this.storage.PIXW * this.storage.ShowGridlines + 3;
    horTickSize = horTickSize ?? 0;
    this.storage.axisVertG.call(d3.axisLeft(this.storage.scaleVert).ticks(8).tickFormat(v => -v / 1.00).tickSize(horTickSize))


    this.storage.svg1.selectAll("g.grid line")
        .attr('stroke-dasharray', '4px').style('stroke-width', this.storage.GridlineThickness + 'px')


    // this.storage.svg1.select(".drawtooltip").attr("transform",
    //     `translate(${this.xE() - 10 / this.storage.ZOOMSCALE}, ${this.yE() - 10 / this.storage.ZOOMSCALE})`
    //     + ` scale(${1.0 / this.storage.ZOOMSCALE})`
    // )

    // this.updDrawTooltip();


    // update background coordinates
    this.storage.svg1.select(".underX")
        .attr("x", this.c5x00())
        .attr("y", this.c5y00())
        .attr("width", this.storage.XOFFPIX / this.storage.ZOOMSCALE)                 // TODO maybe 800x600?
        .attr("height", this.yE() - this.c5y00())
    this.storage.svg1.select(".underY")
        .attr("x", this.c5x00())
        //.attr("x", this.c5x00() + this.storage.XOFFPIX/this.storage.ZOOMSCALE)
        .attr("y", bottomAxisPosition)
        .attr("width", this.xE() - this.c5x00())                 // TODO maybe 800x600?
        .attr("height", this.storage.YOFFPIX / this.storage.ZOOMSCALE)
    this.storage.svg1.select(".external-border")
        .attr("x", this.c5x00())
        .attr("y", this.c5y00())
        .attr("width", this.storage.PIXW / this.storage.ZOOMSCALE)
        .attr("height", this.storage.PIXH / this.storage.ZOOMSCALE)
        // .style('stroke-width', 2 + 'px')
        .style('stroke', "black")
    // changes stroke width through html, d3 won't allow stroke width below 1px
    this.storage.rootElem.querySelector(".external-border").style.strokeWidth = 2 / this.storage.ZOOMSCALE + "px"
    //updTextBackground.bind(bottomTooltip.each)()


    // control
    var a1 = this.storage.svg1.selectAll("text.layerinfo").size()
    var a2 = this.storage.svg1.selectAll("rect.borehole").size()
    var a3 = this.storage.svg1.selectAll(".bhtitle").size()
    var a4 = this.storage.svg1.selectAll(".freepoint").size()
    var a5 = this.storage.svg1.selectAll(".bhpoint").size()


    // 11 11 3(6) 1 28
    //console.log(a1, a2, a3, a4, a5)

    // commenting this stops the legend from following you around the screen
    // this.storage.dragLegendProc();

    if (this.storage.legendPinnedTo != '(none)') {
        this.updateLegendPosition();
    }
}




CrossSectionCanvas.prototype.pixelPositionInRelationToOrigin = function (x, y) {
    /* Returns position in pixels in relation to the coordinates 0,0 in the canvas */
    let originElem = this.storage.origin.nodes()[0];
    let originBound = originElem.getBoundingClientRect();
    let originX = originBound.x;
    let originY = originBound.y;
    let posX = (x - originX) / this.storage.ZOOMSCALE;
    let posY = - (y - originY) / this.storage.ZOOMSCALE;
    return [posX, posY];
}

CrossSectionCanvas.prototype.showCoordinateTooltip = function (event) {
    // var tooltipElem = this.storage.rootElem.querySelector(".coordinate-tooltip-container");
    // tooltipElem.classList.remove("hidden");
    const tooltipFollowCursor = this.storage.rootElem?.querySelector(tooltipFollowCursorSelector);
    tooltipFollowCursor.style.visibility = "visible";
}

CrossSectionCanvas.prototype.hideCoordinateTooltip = function (event) {
    // var tooltipElem = this.storage.rootElem.querySelector(".coordinate-tooltip-container");
    // tooltipElem.classList.add("hidden");
    const tooltipFollowCursor = this.storage.rootElem?.querySelector(tooltipFollowCursorSelector);
    tooltipFollowCursor.style.visibility = "hidden";
}

CrossSectionCanvas.prototype.hideLinksFollowingMouse = function (event) {
    /* Hides the this.storage.links that follow the mouse while you are drawing a polygon */
    this.storage.d3_root.select(".mouselast").classed("inviz", 1);
    this.storage.d3_root.select(".mousefirst").classed("inviz", 1);
}

const tooltipFollowCursorSelector = ".coord-tooltip-follow-cursor";

function getPosition(areaElem, pos) {
    /* Get position (of mouse) inside an area in pixels
    Arguments: html element corresponding to area , array [x, y] containing a position */
    let rect = areaElem.getBoundingClientRect();
    let x = (pos[0] - rect.left);
    let y = (pos[1] - rect.top);
    return [x, y];
}

CrossSectionCanvas.prototype.onMouseMove = function (e) {
    //console.log(e)
    // { target: svg.wide, buttons: 0, clientX: 265, clientY: 259, layerX: 257, layerY: 85 }
    let rect = this.storage.rootElem.querySelector(".windowContainer").getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.top + window.scrollY;
    if (e) this.storage.XMOUSE = e.clientX;    // to window (scrolled)
    if (e) this.storage.YMOUSE = e.clientY;
    if (e) this.storage.CLXMOUSE = e.pageX - left;    // to doc-top
    if (e) this.storage.CLYMOUSE = e.pageY - top;

    // shows coordinate on tooltip

    let mousePosition = this.pixelPositionInRelationToOrigin(this.storage.XMOUSE, this.storage.YMOUSE);
    let mouseX = mousePosition[0];
    let mouseY = mousePosition[1];   
    // @ts-expect-error
    let xText = parseFloat(mouseX / this.storage.AX).toFixed(2);
    // @ts-expect-error
    let yText = parseFloat(mouseY / this.storage.AY).toFixed(2);
    const coordinateText = xText + ", " + yText;
    // let coordinateTooltip = this.storage.rootElem.querySelector(".coordinate-tooltip");
    // coordinateTooltip.textContent = coordinateText;

    const positionOnRoot = getPosition(this.storage.rootElem, [e.clientX, e.clientY]);
    const tooltipFollowCursor = this.storage.rootElem?.querySelector(tooltipFollowCursorSelector);
    const tooltipFollowCursorText = tooltipFollowCursor.querySelector('div');
    if (tooltipFollowCursor) {
        let [left, top] = positionOnRoot;
        left = left + 15;
        top = top + 20;
        tooltipFollowCursor.style.left = left + 'px';
        tooltipFollowCursor.style.top = top + 'px';
    }
    tooltipFollowCursorText.textContent = coordinateText;

    //console.log('yyy', this.storage.YMOUSE, CLYMOUSrE)

    if (e && this.storage.CONNECTMODE) {
        // draw line from last point to mouse 
        var exact = this.cursorPoint(e)
        //this.storage.d3_root.select(".currentpos").text(`${exact.x} ${exact.y}`)

        this.storage.d3_root.select(".mouselast").classed("inviz", 0)
            .attr("d", `M${this.dpoint(this.storage.CONNECTMODE)} L ${exact.x} ${exact.y}`)
        if ( !this.storage.WATERFRONTMODE && ! this.storage.drawLineMode) {
            this.storage.d3_root.select(".mousefirst").classed("inviz", 0)
            .attr("d", `M${this.dpoint(this.storage.CONNECTPOINTS[0])} L ${exact.x} ${exact.y}`)
        }
    } else {
        this.hideLinksFollowingMouse();
    }
}

const tooltipHiddenClass = 'invisible';
CrossSectionCanvas.prototype.showDrawWaterlineTooltip = function () {
    this.storage.rootElem.querySelector(".drawWaterlineTooltip").classList.remove(tooltipHiddenClass);
}

CrossSectionCanvas.prototype.hideDrawWaterlineTooltip = function () {
    this.storage.rootElem.querySelector(".drawWaterlineTooltip").classList.add(tooltipHiddenClass);
}




CrossSectionCanvas.prototype.svgOnClick = function (event) {
    //handle click only in the middle of 'DRAWING MODE'
    if (! (this.storage.WATERFRONTMODE || this.storage.drawPolygonMode || this.storage.drawLineMode || this.storage.drawTextMode)) { 
        return;
    }
    if (event?.srcElement?.classList?.contains('point')) {
        // handled by mouseClick()
        return;
    }
    // create new extrapoint
    const exact = this.cursorPoint({ clientX: this.storage.XMOUSE, clientY: this.storage.YMOUSE })
    console.log("CLICK", exact);
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    if (this.storage.drawTextMode) {
        let newText = this.cloneObject(this.storage.textDefaultProperties);
        const boreholeFontSizes = Object.values(this.storage.boreholeProperties).map(x => x.fontSize);
        const legendFontSize = this.storage.legendBoxFontSize
        const fontSizes = [legendFontSize, ...boreholeFontSizes].filter(x => x != null && ! Number.isNaN(x)).map(x => parseFloat(x));
        const maximumFontSize = Math.max(...fontSizes);
        newText = {
            ...newText,
            fontSize: maximumFontSize ?? defaultStorage.textDefaultProperties.fontSize,
            x: exact.x / this.storage.AX / coordinateUnitFactor,
            y: - exact.y / this.storage.AY / coordinateUnitFactor,
        }
        this.storage.currentText = newText;
        const timestamp = this.finishDrawingText();
        this.drawTexts(this.storage.svg1);
        const textElem = this.storage.d3_root.selectAll('.textBox').filter(d => d.timestamp == timestamp)?.node();
        if (textElem) {
            textElem.querySelector('textarea')?.focus();
        }
        this.openTextPropertyGrid(timestamp);
        return;
    }
    // the yz in this case is correct because it's a new point
    // old points are the ones that might have broken coordinates

    // x and yz are correct data, therefore I need to get the project unit
    // xx and correct_yz is the display
    const newPoint = {
        timestamp: this.storage.uniq(),
        x: exact.x / this.storage.AX / coordinateUnitFactor,
        originalX: exact.x / this.storage.AX / coordinateUnitFactor,
        xx: exact.x / this.storage.AX,
        yz: - exact.y / this.storage.AY / coordinateUnitFactor,
        correct_yz: - exact.y / this.storage.AY,
        iamextrapoint: true,
        // list of this.storage.polygons the point belongs to
        belongsToPoly: []
    };     // no this.storage.ZOOMSCALE here
    
    if (this.storage.WATERFRONTMODE || this.storage.drawLineMode) {
        newPoint.textHidden = true;
    }

    this.storage.EPOINTS.push(newPoint);
    
    this.mouseClick(newPoint, this.storage.svg1);
    event.preventDefault();
}






// panning behavior
CrossSectionCanvas.prototype.dragged = function (evt) {

    //console.log('DRAG')

    var current = d3.select(this);
    /*
        current
            .attr('x', d3.event.x)
            .attr('y', d3.event.y);
    */

    this.storage.REGCX -= d3.event.dx / this.storage.AX / this.storage.ZOOMSCALE;
    this.storage.REGCY -= d3.event.dy / this.storage.AY / this.storage.ZOOMSCALE;

    this.coordUpd()
}

CrossSectionCanvas.prototype.getCenterOfElement = function(elem) {
    let bounds = elem.getBBox(elem);
    let pixelsCenterX = bounds.x + bounds.width / 2;
    let pixelsCenterY = bounds.y + bounds.height / 2;

    const transform = window.getComputedStyle(elem)?.transform
    if (transform) {
        const matrix = new WebKitCSSMatrix(transform);
        pixelsCenterX += matrix.m41;
        pixelsCenterY += matrix.m42;
    }
    return [pixelsCenterX, pixelsCenterY];
}

CrossSectionCanvas.prototype.getCenterOfElementToCentralizeOnView = function (elem) {
    let center = this.getCenterOfElement(elem);
    // center we want to go to so the elem is centralized on the view
    let desiredCenter = [center[0] - this.storage.XOFFPIX, center[1]];
    let realCenterX = this.pixelsToRealX(desiredCenter[0]);
    let realCenterY = this.pixelsToRealY(desiredCenter[1]);
    return [realCenterX, realCenterY];
}

CrossSectionCanvas.prototype.getRootCenter = function () {
    let rootGroup = this.storage.rootElem.querySelector('.root-group');
    const center = this.getCenterOfElement(rootGroup);
    return center;
}

CrossSectionCanvas.prototype.focusCenterOfElement = function (elem) {
    const [realCenterX, realCenterY] = this.getCenterOfElementToCentralizeOnView(elem);
    this.changeSvgWindowCenter(realCenterX, realCenterY);
}

CrossSectionCanvas.prototype.focusCenterOfElementGenerator = async function* (elem) {
    if (! elem) {
        return;
    }

    const [realCenterX, realCenterY] = this.getCenterOfElementToCentralizeOnView(elem);
    const currentX = this.storage.REGCX;
    const currentY = this.storage.REGCY;
    const dx = realCenterX - currentX;
    const dy = realCenterY - currentY;
    const distance = Math.sqrt((dx * dx) + (dy * dy));

    // 100ms for every 5
    const transitionTime = Math.min(500, 100 * distance * this.storage.ZOOMSCALE / 5);
    const fps = 30;
    const numberOfSteps = Math.ceil(fps * transitionTime / 1000);
    const timePerStep = transitionTime / numberOfSteps;

    const signX = Math.sign(realCenterX - currentX);
    const intervalX = Math.abs(realCenterX - currentX);
    const stepX = intervalX / numberOfSteps;

    const signY = Math.sign(realCenterY - currentY);
    const intervalY = Math.abs(realCenterY - currentY);
    const stepY = intervalY / numberOfSteps;

    for(let i = 0; i < numberOfSteps; i += 1) {
        this.changeSvgWindowCenter(currentX + i * signX * stepX, currentY + i * signY * stepY);
        await sleep(timePerStep);
        yield true;
    }
    this.changeSvgWindowCenter(realCenterX, realCenterY);
    yield false;
}
CrossSectionCanvas.prototype.focusCenterOfElementWithTransition = async function (elem) {
    const iterator = this.focusCenterOfElementGenerator(elem);
    while (! ((await iterator.next()).done)) {
        // nothing
    }
}

CrossSectionCanvas.prototype.focusCenter = function (transition=false) {
    let rootGroup = this.storage.rootElem.querySelector('.root-group');
    console.log("Focusing center");
    if (transition) {
        this.focusCenterOfElementWithTransition(rootGroup);
    }
    else {
        this.focusCenterOfElement(rootGroup);
    }
}

CrossSectionCanvas.prototype.changeSvgWindowCenter = function (x, y) {
    this.storage.REGCX = x;
    this.storage.REGCY = y;
    this.coordUpd();
}



//---------------------

CrossSectionCanvas.prototype.getTextBackgroundPosition = function (elem) {
    if (! elem) {
        return null;
    }
    const gel = d3.select(elem.parentNode);
    const rbkg = gel.select("rect.rbkg");
    rbkg.style("display", "none");
    const SVGRect = d3.select(elem.parentNode).node()?.getBBox();
    rbkg.style("display", undefined);
    if (! SVGRect) {
        return null;
    }
    return {
        x : SVGRect.x - this.storage.textBackgroundPadding,
        y : SVGRect.y - this.storage.textBackgroundPadding,
        width : SVGRect.width + 12,
        height : SVGRect.height + 16
    }
}

// legend box
CrossSectionCanvas.prototype.updTextBackground = function (elem) {
    const dict = this.getTextBackgroundPosition(elem);
    if (! dict) {
        return;
    }
    const {x, y, width, height} = dict;
    var gel = d3.select(elem.parentNode)
    gel.select("rect.rbkg")
        .attr("x", x)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", (d) => {
            if (gel.attr("class") == "legendBox") return this.storage.legendBackgroundColor;
            return "yellow"
        })
}

// any text
CrossSectionCanvas.prototype.addTextBackground = function (elem) {
    var parent = d3.select(elem.parentNode)
    //console.log(elem, d)
    var SVGRect = d3.select(elem).node().getBBox();
    // var SVGRect = d3.select(this).node().getBBox();
    //console.log('utb', SVGRect)
    parent.selectAll('.textBackground').remove();
    let background = parent.insert('rect', ":first-child").classed('textBackground', true);
    const paddingX = SVGRect.height * 0.15;
    const paddingY = SVGRect.height * 0.075;
    background
        .attr("x", SVGRect.x - paddingX)
        .attr("y", SVGRect.y - paddingY)
        .attr("width", SVGRect.width + paddingX * 2)
        .attr("height", SVGRect.height + paddingY * 2)
        .attr("fill", (d) => {
            return "white";
        })
}

CrossSectionCanvas.prototype.updDrawTooltip = function () {
    /* Set draw tooltip size and background. Deprecated since I moved tooltip out of svg. */

    return;

    var gel = this.storage.d3_root.select(".drawtooltip")
    // used to get the size of the text without the rect in it
    gel.select("rect.rbkg").style("display", "none")
    var SVGRect = gel.node().getBBox();
    gel.select("rect.rbkg")
        .style("display", undefined)
        .attr("x", SVGRect.x - 8)
        .attr("y", SVGRect.y - 8)
        .attr("width", SVGRect.width + 8)
        .attr("height", SVGRect.height + 8)
        .attr("fill", function (d) {
            if (gel.attr("id") == "legend") return "whitesmoke"
            return ".fffbe0"
        })
        .attr("stroke", "grey")
        .attr("stroke-width", "1px")
}




//---------------

CrossSectionCanvas.prototype.moveFieldTest = function (timestamp, xx, yz) {
    /* Moves a field test plot to the real world coordinates passed. The timestamp corresponds to the field test timestamp. */
    let fieldTest = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp);
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    let newX = xx * this.storage.AX * coordinateUnitFactor;
    let newY = - yz * this.storage.AY * coordinateUnitFactor;

    this.storage.fieldTestPositions[timestamp].test_xx = xx;
    this.storage.fieldTestPositions[timestamp].test_yz = yz;
    fieldTest.attr("transform", `translate(${newX} ${newY})`)
}

CrossSectionCanvas.prototype.dragFieldTest = function (timestamp) {
    /* Drags the field test to the current mouse position. Argument: fieldtest timestamp */
    // let fieldTest = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp);

    if (d3.event && d3.event.sourceEvent && this.storage.fieldTestIsDragging && this.storage.fieldTestPositions[timestamp]) { // && d3.event.sourceEvent.target.tagName != "svg"){
        // let newX = d3.event.x;
        // let newX = this.storage.fieldTestPositions[timestamp].test_xx * this.storage.AX + d3.event.dx;
        const coordinateUnitFactor = this.getCoordinateUnitFactor();
        let newXX = this.storage.fieldTestPositions[timestamp].test_xx + d3.event.dx / this.storage.AX / coordinateUnitFactor;
        // doesnt change, but we need it to translate
        // let newY = - this.storage.fieldTestPositions[timestamp].test_yz * this.storage.AY;
        let newYZ = this.storage.fieldTestPositions[timestamp].test_yz;
        this.moveFieldTest(timestamp, newXX, newYZ);
        this.storage.fieldTestWasMoved = true;
        // this.storage.fieldTestPositions[timestamp].test_xx = newXX;
        // this.storage.fieldTestPositions[timestamp].test_yz = newYZ;
        // fieldTest.attr("transform", `translate(${newX} ${newY})`)
    }
}

CrossSectionCanvas.prototype.dragLegend = function () {
    /* Drags legend to the current mouse position */


    //var dx=0, dy=0;
    // d3.event.sourceEvent.target   - wrong if mouse go fast-outside of object

    return () => {
        if (this.storage.legendPinnedTo != '(none)') {
            return;
        }
        //  && (d3.event.dx) && (d3.event.dy)
        const coordinateUnitFactor = this.getCoordinateUnitFactor();
        if (d3.event && d3.event.sourceEvent && this.storage.legendIsDragging) { // && d3.event.sourceEvent.target.tagName != "svg"){
            this.storage.LEGDXREAL += d3.event.dx / this.storage.AX / coordinateUnitFactor;
            this.storage.LEGDYREAL += d3.event.dy / this.storage.AY / coordinateUnitFactor;
            this.storage.LEGDX = this.storage.LEGDXREAL * this.storage.AX * coordinateUnitFactor;
            this.storage.LEGDY = this.storage.LEGDYREAL * this.storage.AY * coordinateUnitFactor;

            this.storage.d3_root.select(".legend").attr("transform", `translate(${this.storage.LEGDX} ${this.storage.LEGDY})`)
        }
    }
}


CrossSectionCanvas.prototype.pathToName = function (filepath) {
    /* Converts a filepath to the name of the file, without the extension. For example, "Hatch_Files/PNG/Soil/Black/TILL.PNG/" returns "TILL"*/
    if (!filepath) {
        return 'Unknown ' + filepath;
    }
    // console.log(filepath);
    let m = filepath?.split("\/");
    let name = m[m.length - 1].split(".")[0]
    return name;
}

CrossSectionCanvas.prototype.pathToColor = function (filepath) {
    /* Given a hatch filepath, returns the corresponding color. For example, "Hatch_Files/PNG/Soil/Black/TILL.PNG/" will return "Black"*/
    if (!filepath) {
        return null;
    }
    let m = filepath?.split("\/");
    let color = m[m.length - 2];
    return color;
}




CrossSectionCanvas.prototype.boreholeChangeProperty = function (elem) {
    /* Receives an html input element and updates the corresponding property for the borehole whose tooltip is open. */
    if (!this.storage.boreholeProperties[this.storage.selectingBorehole]) return;

    let propertyName = elem.name;
    let value = elem.value;
    if (elem.type == "checkbox") {
        // elem.checked = ! elem.checked;
        value = elem.checked;
    }
    this.storage.boreholeProperties[this.storage.selectingBorehole][propertyName] = value;
}

CrossSectionCanvas.prototype.getBoreholeTooltipFields = function () {
    /* Returns an array containing the html input elements corresponding to the borehole options. The options are present in a tooltip menu that appears once you right mouse click on top of the borehole) */
    return Array.from(this.storage.rootElem.querySelectorAll(".boreholetooltip input"));
}

CrossSectionCanvas.prototype.boreholeMouseClick = function (timestamp) {
    /* Opens the borehole tooltip menu. Arguments: timestamp of the borehole. */
    if (this.isInDrawMode()) {
        return;
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();    // hide menu
    this.openBoreholePropertyGrid(timestamp);
}

CrossSectionCanvas.prototype.timestampToHtmlElem = function (selector, timestamp) {
    if (timestamp == null ) {
        return;
    }
    const allElems = Array.from(this.storage.rootElem.querySelectorAll(selector))
    const elem = allElems.find(x => {
        let data = d3.select(x)?.data();
        if (! data || data.length == 0) {
            return false;
        }
        if (! Array.isArray(data)) {
            data = [data];
        }
        return parseInt(data[0].timestamp ?? -1) == parseInt(timestamp ?? -2);
    })
    return elem;
}

// example: copy borehole properties to all boreholes in this.storage.boreholeProperties
CrossSectionCanvas.prototype.copyToAllObjects = function (properties, storageDict, exclude=[]) {
    const newProperties = this.cloneObject(properties);
    exclude.forEach(key => {
        delete newProperties[key];
    })
    Object.keys(storageDict).forEach(key => {
        storageDict[key] = {...(storageDict[key]), ...this.cloneObject(newProperties)};
    })

}

CrossSectionCanvas.prototype.generatePropertyGridButton = function () {
    const div = document.createElement('div');
    div.innerHTML = `<a href="#" class="propertyGridButton"></a>`;
    return div.querySelector('a');
}

CrossSectionCanvas.prototype.generateCopyToAllObjectsButton = function (objType, fnProperties, storageDict, exclude = [], callback=null) {
    const button = this.generatePropertyGridButton();
    button.innerText = `Copy to All ${objType}`
    button.onclick = async () => {
        this.openConfirmModal({
            text: `These properties will be applied to all ${objType}! Do you wish to proceed?`,
            title: "Confirm",
            callback: () => {
                const copyToAllObjects = this.copyToAllObjects(fnProperties(), storageDict, exclude);
                callback();
            }
        })
    }
    return button;
}

CrossSectionCanvas.prototype.removePropertyGridSelected = function () {
    const panelElem = this.storage?.rootElem?.querySelector("#propertyGridSelected");
    if (panelElem) {
        panelElem.innerHTML = `<div class="guidingText"><p>Click on any object to view properties</p></div>`;
    }
}

CrossSectionCanvas.prototype.genericOpenPropertyGridSelected = function (panelElem, panelData, panelOptions) {
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);
}

CrossSectionCanvas.prototype.openBoreholePropertyGrid = function (timestamp) {
    this.storage.selectingBorehole = timestamp;
    const boreholeProperties = this.storage.boreholeProperties[timestamp];
    const panelData = this.cloneObject(boreholeProperties);
    if (! panelData) {
        return;
    }
    ['showFieldTestPlots', 'displayWidth'].forEach(key =>{
        if (key in panelData) {
            delete panelData[key];
        }
    })

    const elem = this.selectElemFromTimestamp('.g-borehole', timestamp);

    const boreholeData = this.boreholeIdToProperties(timestamp);
    const fieldTestTitles = boreholeData?.general?.test_data?.map(x => x?.title) ?? [];
    const fieldTestOptions = ["(none)", ...fieldTestTitles];
    const unit = this.storage.scaleIsFeet ? 'ft' : 'm'
    const optionsMetadata = {
        displayWidth: {name: `Display Width (${unit})`},
        fieldTestPlotOption: { name: "Field Test Plot", type : "options", options : fieldTestOptions},
        fontFamily : {name: "Font Family", type : "options", options : fontFamilyOptions},
        fontSize : {name: "Font Size (px)", type : "options", options : fontSizeOptions},
        opaqueLabels : {name : "Opaque Labels", type : "boolean"},
        showDepthLabels: {name: "Show Depth", type : "boolean"},
        showSoilDescriptions: {name: "Show Descriptions", type : "boolean"},
        titleAngle: {name : "Title Angle", type : "options", options : ["0", "90", "180", "270"]},
        textColor : {name : "Text Color", type : "color"},
        transparency : {name: "Opacity", type : "options", options:transparencyOptions},
    }

    const group = boreholeData?.name ?? 'Selected';
    Object.values(optionsMetadata).forEach(value => {
        value.group = group;
    })
        
    const optionsTooltips = {
        displayWidth : "Width of the borehole",
        fieldTestPlotOption : "Which field test plot to show",
        fontFamily : "Font family of the borehole text",
        fontSize : "Font size of the borehole text",
        opaqueLabels : "Whether the borehole labels have a background or not",
        showDepthLabels : "Whether to show the depth numbers or not",
        showSoilDescriptions : "Whether to show the layer descriptions or not",
        titleAngle : "The angle of the title",
        textColor : "Color of the labels",
        transparency : "Opacity of the borehole",
    }
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })

    if (! fieldTestOptions || fieldTestOptions.length <= 0) {
        delete panelData['fieldTestPlotOption']
    }

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            // get the properties dict in case the original changed
            const boreholeProperties = this.storage.boreholeProperties[timestamp];
            boreholeProperties[name] = val;
            this.drawAllBoreholes();

            if (name == "fieldTestPlotOption") {
                this.zoomExtent(true);
            }
            this.openBoreholePropertyGrid(timestamp);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.genericOpenPropertyGridSelected(panelElem, panelData, panelOptions);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');

    const exclude = [];
    const originalPropertySelected = boreholeProperties.fieldTestPlotOption;
    const copyButton = this.generateCopyToAllObjectsButton(
        'Boreholes',
        () => this.storage.boreholeProperties[timestamp],
        this.storage.boreholeProperties,
        exclude,
        () => {
            Object.keys(this.storage.boreholeProperties).forEach(timestamp => {
                const properties = this.storage.boreholeProperties[timestamp];
                if (! properties) {
                    return;
                }
                if (originalPropertySelected == '(none)') {
                    properties.fieldTestPlotOption = originalPropertySelected;
                }
                else {
                    const borehole = this.storage.data0.find(bh => bh.timestamp == timestamp);
                    if (borehole) {
                        const testDataArr = borehole?.general?.testData ?? [];
                        const test = testDataArr.find(data => data?.title == originalPropertySelected);
                        if (test) {
                            properties.fieldTestPlotOption = test.title;
                        }
                    }
                }
            })
            const fontSize = this.storage.boreholeProperties[timestamp]?.fontSize;
            if (fontSize) {
                this.onPropertyChange(undefined, 'interrogationPointFontSize', this.storage.boreholeProperties[timestamp].fontSize);
            }
            this.drawAllBoreholes();
        }
    );
    buttonDiv.appendChild(copyButton);

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.areThereElementsSelected = function () {
    const selectedElems = Array.from(this.storage?.rootElem?.querySelectorAll('.' + selectedClass));
    const isDisplayingProperties = ! this.storage?.rootElem?.querySelector('.propertyGridSelected .guidingText');
    return isDisplayingProperties || (!!selectedElems && selectedElems.length > 0);
}

// auxiliary function used on cancelSelection
CrossSectionCanvas.prototype.removeLastCreatedTextIfEmpty = function () {
    const timestamp = this.storage.lastCreatedTextToRemoveIfEmpty;
    const texts = this.storage?.texts;
    if (timestamp == null || ! texts) {
        return;
    }
    const propertiesOfSelectedText = texts[this.storage.selectingText];
    if (propertiesOfSelectedText?.text !== '') {
        // try to delete only on first selection cancel
        this.storage.lastCreatedTextToRemoveIfEmpty = null;
        return;
    }
    delete this.storage.texts[timestamp];
    this.storage.lastCreatedTextToRemoveIfEmpty = null;
    this.drawTexts(this.storage.svg1);
}

// timestampThatWillBeReselected is passed in some cases so we can take certain actions
// such as deleting empty texts
// inonly in cases where it's not reselecting the same element
CrossSectionCanvas.prototype.cancelSelection = function (elemsThatWillBeSelected=null) {
    if (this.storage.lastCreatedTextToRemoveIfEmpty != null) {
        const elem = elemsThatWillBeSelected && elemsThatWillBeSelected.length > 0 ? elemsThatWillBeSelected[0] : null;
        let isTextBox = false;
        let timestamp = null;
        if (elem) {
            isTextBox = elem.matches('.textBox');
            const data = d3.select(elem).data();
            if (data && data.length > 0) {
                timestamp = data[0]?.timestamp;
            }
        }
        const noneSelected = ! elem;
        const differentSelected = ! isTextBox || (timestamp && timestamp != this.storage.lastCreatedTextToRemoveIfEmpty);
        if (noneSelected || differentSelected) {
            this.removeLastCreatedTextIfEmpty();
        }
    }
    this.removePropertyGridSelected();
    this.showNoElemsAsSelected();
    this.removeElemAboveEverything();
    const tooltip = this.storage.rootElem.querySelector('.selectHatchTooltip');
    this.toggleInviz(tooltip, false);
    this.storage.rootElem?.querySelector('.elemSelectedTooltip')?.classList?.add(tooltipHiddenClass);
}

CrossSectionCanvas.prototype.openBoreholeTooltip = function (timestamp) {

    if (this.isInDrawMode()) {
        return;
    }
    this.storage.boreHoleLastTimestamp = timestamp;
    this.storage.d3_root.select(".boreholetooltip")
        .style("visibility", "visible")
        .style("left", this.storage.CLXMOUSE + 'px').style("top", this.storage.CLYMOUSE + 'px');
    this.storage.selectingBorehole = timestamp;

    let values = this.storage.boreholeProperties[timestamp];
    if (values) {
        // Loads values on tooltip
        this.getBoreholeTooltipFields().forEach(elem => {
            if (elem.name in values) {
                if (elem.type == "checkbox") {
                    elem.checked = values[elem.name];
                }
                else {

                    elem.value = values[elem.name];
                }
            }
        })
    }
}

CrossSectionCanvas.prototype.boreholeFinishEdit = function () {
    /* Closes the borehole tooltip menu */
    this.storage.d3_root.select(".boreholetooltip").style("visibility", "hidden");
}

CrossSectionCanvas.prototype.boreholeUpdateProperties = function () {
    /* Updates the borehole properties and appearance based on the options on the borehole tooltip menu. This is done for the current borehole whose tooltip is open. */
    this.getBoreholeTooltipFields().forEach(elem => {
        this.boreholeChangeProperty(elem);
    })
    // this.redraw();
    this.drawAllBoreholes();
}

CrossSectionCanvas.prototype.boreholeNameToProperties = function (boreholeName) {
    let bh = this.storage.data0.find(bh => bh?.name == boreholeName);
    return bh;
}

CrossSectionCanvas.prototype.boreholeIdToProperties = function (boreholeId) {
    let bh = this.storage.data0.find(bh => {
        if (!bh || !bh.soillayer || !bh.soillayer[0] || !bh.soillayer[0].timestamp) {
            return false;
        }
        return bh.soillayer[0].timestamp == boreholeId;
    });
    return bh;
}

CrossSectionCanvas.prototype.boreholeNameToId = function (boreholeName) {
    let bh = this.boreholeNameToProperties(boreholeName);
    if (!bh) {
        return null;
    }
    return bh.soillayer[0].timestamp;
}

CrossSectionCanvas.prototype.fieldTestChangeProperty = function (fieldTestId, propertyName, value) {
    if (!fieldTestId || !(propertyName in this.storage.fieldTestProperties[fieldTestId])) {
        return;
    }
    this.storage.fieldTestProperties[fieldTestId][propertyName] = value;
}

CrossSectionCanvas.prototype.fieldTestChangePositionProperty = function (fieldTestId, propertyName, value) {
    if (!fieldTestId || !(propertyName in this.storage.fieldTestPositions[fieldTestId])) {
        return;
    }
    this.storage.fieldTestPositions[fieldTestId][propertyName] = value;
    if (['test_title', 'test_position', 'test_xx', 'test_yz'].includes(propertyName)) {
        let borehole = this.boreholeIdToProperties(fieldTestId);
        if (borehole.general) {
            borehole.general[propertyName] = value;
        }
    }
}

CrossSectionCanvas.prototype.fieldTestChangePropertyFromInputElem = function (elem) {
    /* Receives an html input element and updates the corresponding property for the field test plot whose tooltip is open. */
    if (!this.storage.fieldTestProperties[this.storage.selectingFieldTest]) return;
    // makes sure value between 0 and 1
    if (elem.name == "plotOpacity") {
        elem.value = Math.min(1, elem.value);
        elem.value = Math.max(0, elem.value);
    }
    let propertyName = elem.name;
    let value = elem.value;
    if (elem.type == "checkbox") {
        // elem.checked = ! elem.checked;
        value = elem.checked;
    }
    this.fieldTestChangeProperty(this.storage.selectingFieldTest, propertyName, value)
    // this.drawAllFieldTests();
}

CrossSectionCanvas.prototype.getFieldTestTooltipFields = function () {
    /* Returns an array containing the html input elements corresponding to the field test options. The options are present in a tooltip menu that appears once you right mouse click on top of the fieldtest */
    return Array.from(this.storage.rootElem.querySelectorAll(".fieldtesttooltip input"));
}

CrossSectionCanvas.prototype.fieldTestMouseClick = function (d) {
    /* Opens the fieldtest tooltip menu. Arguments: data of the fieldtest, containing a timestamp */
    if (this.isInDrawMode()) {
        return;
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();    // hide menu

    this.openFieldTestPropertyGrid(d);
}

CrossSectionCanvas.prototype.openFieldTestPropertyGrid = function (d) {
    if (! d || ! d.timestamp) {
        return;
    }
    const timestamp = d.timestamp;
    this.storage.selectingFieldTest = d.timestamp;
    if (typeof (this.storage.fieldTestProperties) == "string") {
        this.storage.fieldTestProperties = JSON.parse(this.storage.fieldTestProperties);
    }
    const fieldTestProperties = this.storage.fieldTestProperties[d.timestamp];
    
    const panelData = fieldTestProperties;
    if (! panelData) {
        return;
    }

    const elem = this.selectElemFromTimestamp('.fieldtest-plot', timestamp);

    const optionsMetadata = {
        anchor : {name : "Anchor", type : "options", options : ["(none)", "Left", "Right"]},
        backgroundColor: {name : "Background color", type : "color"},
        fontFamily : {name : "Font Family", type : "options", options : fontFamilyOptions},
        fontSize : {name : "Font Size (px)", type : "options", options : fontSizeOptions},
        pointValueColor : {name : "Labels color", type : "color"},
        lineFillColor: {name : "Line fill color", type : "color"},
        lineColor: {name : "Line Color", type : "color"},
        pointColor: {name : "Point Color", type : "color"},
        showPoints: {name : "Show Points", type : "boolean"},
        showPointsValues: {name : "Show Labels", type : "boolean"},
        showXAxisNumber : {name : "Show X Axis Numbers", type : "boolean"},
        showXAxisTitle : {name : "Show X Axis Title", type : "boolean"},
        showYAxisNumber : {name : "Show Y Axis Numbers", type : "boolean"},
        showYAxisTitle : {name : "Show Y Axis Title", type : "boolean"},
        plotOpacity : {name: "Opacity", type : "options", options:transparencyOptions},
        zOrder : {name : "Z Order", type : "options", options : zOrderOptions},
    }

    const boreholeData = this.boreholeIdToProperties(timestamp);
    const group = boreholeData?.name ?? 'Selected';
    Object.values(optionsMetadata).forEach(value => {
        value.group = `Field Test Plot (${group})`;
    })
        
    const optionsTooltips = {
        anchor : "Where to anchor the field test in relation to the borehole",
        backgroundColor : "Background color of the plot",
        fontFamily : "Font family of the texts of the plot",
        fontSize : "Font size of the texts of the plot",
        pointValueColor : "Color of the point values",
        lineFillColor : "Color of the plotted area",
        lineColor : "Color of the plot lines",
        pointColor : "Color of the plot points",
        showPoints : "Whether to show the plot points or not",
        showPointsValues : "Whether to show the point values or not",
        showXAxisNumber : "Whether to show the horizontal axis numbers or not",
        showXAxisTitle : "Whether to show the horizontal axis title or not",
        showYAxisNumber : "Whether to show the vertical axis numbers or not",
        showYAxisTitle : "Whether to show the vertical axis title or not",
        plotOpacity : "Opacity of the plot",
        zOrder : "Whether the plot is shown below or above other elements",
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            fieldTestProperties[name] = val;
            this.drawAllFieldTests();
            this.openFieldTestPropertyGrid(d);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);

    
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');

    const copyButton = this.generateCopyToAllObjectsButton(
        'Field Test Plots',
        () => this.storage.fieldTestProperties[timestamp],
        this.storage.fieldTestProperties,
        [],
        () => this.drawAllFieldTests()
    );
    buttonDiv.appendChild(copyButton);

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.openFieldTestTooltip = function (d) {
    this.storage.d3_root.select(".fieldtesttooltip").style("visibility", "visible")
        .style("left", this.storage.CLXMOUSE + 'px').style("top", this.storage.CLYMOUSE + 'px');
    this.storage.selectingFieldTest = d.timestamp;
    if (typeof (this.storage.fieldTestProperties) == "string") {
        this.storage.fieldTestProperties = JSON.parse(this.storage.fieldTestProperties);
    }
    let values = this.storage.fieldTestProperties[d.timestamp];
    if (values) {
        // Loads values on tooltip
        this.getFieldTestTooltipFields().forEach(elem => {
            if (elem.name && elem.name in values) {
                if (elem.type == "checkbox") {
                    elem.checked = values[elem.name];
                }
                else {

                    elem.value = values[elem.name];
                }
            }
        })
    }
}

CrossSectionCanvas.prototype.fieldTestFinishEdit = function () {
    /* Closes the fieldtest tooltip menu */
    this.storage.d3_root.select(".fieldtesttooltip").style("visibility", "hidden");
}

CrossSectionCanvas.prototype.fieldTestUpdatePropertiesFromInputs = function () {
    /* Updates the field test properties and appearance based on the options on the field test tooltip menu. This is done for the current field test whose tooltip is open. */
    this.getFieldTestTooltipFields().forEach(elem => {
        this.fieldTestChangePropertyFromInputElem(elem);
    })
    this.drawAllFieldTests();
}

CrossSectionCanvas.prototype.fieldTestUpdateProperties = function (fieldTestId, options) {
    Object.entries(options).forEach(option => {
        let [prop, value] = option;
        this.fieldTestChangeProperty(fieldTestId, prop, value);
    })
    this.drawAllFieldTests();
}

CrossSectionCanvas.prototype.fieldTestUpdatePositionProperties = function (fieldTestId, options) {
    Object.entries(options).forEach(option => {
        let [prop, value] = option;
        this.fieldTestChangePositionProperty(fieldTestId, prop, value);
    })
    this.drawAllFieldTests();
}

CrossSectionCanvas.prototype.legendRectMouseClick = function (d) {
    /* Opens the legend hatch tooltip. Argument is the data of the legend rectangle, containing the hatch src */
    d3.event.stopPropagation();
    d3.event.preventDefault();    // hide menu
    return;
}

CrossSectionCanvas.prototype.openLegendHatchTooltip = function (d) {
    if (this.isInDrawMode()) {
        return;
    }
    this.storage.d3_root.select(".legendrecttooltip").style("visibility", "visible")
        .style("left", this.storage.CLXMOUSE + 'px').style("top", this.storage.CLYMOUSE + 'px');
    this.storage.selectingColorOfSymbol = this.pathToName(d.src);
}

CrossSectionCanvas.prototype.legendRectFinishEdit = function () {
    /* Closes the legend hatch tooltip menu */
    this.storage.d3_root.select(".legendrecttooltip").style("visibility", "hidden")
}

function callWhenUserDoneTypingFactory (callback, waitingTime=2000) {
    let timeoutId;
    const fn = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callback, waitingTime);
    }
    return fn;
}

CrossSectionCanvas.prototype.openTerrainPropertyGrid = function () {
    const terrainProperties = this.storage.terrainSettings;
    
    const panelData = terrainProperties;
    if (! panelData) {
        return;
    }

    const optionsMetadata = {
        axisHelper : { name : "Axis Helper", type : "boolean"},
        lat: { name : "Latitude"},
        lng: { name : "Longitude"},
        opacity: { name : "Opacity", type : "options", options : transparencyOptions},
        radius: { name : "Radius (km)"},
        resolution : {name : "Resolution", type : "options", options : ["Poor", "Basic", "Standard", "High"]},
        selectionMesh : { name : "Selection Box", type : "boolean"},
        flatTerrain: { name : "Flatten Terrain", type : "boolean"},
        terrain: { name : "Terrain Source", type : "options", options : ["Satellite", "Wireframe", "Solid Contours", "Street Map", "Street Map (with contours)"]},
        terrainColor: { name: 'Terrain Color', type: 'color' }
    }

    Object.values(optionsMetadata).forEach(value => {
        value.group = `Terrain`;
    })
        
    const optionsTooltips = {
        axisHelper :"Whether to show the axis helper or not",
        selectionMesh: "Whether the selection box appear when clicking the terrain",
        lat: "Latitude of the center of the terrain",
        lng: "Longitude of the center of the terrain",
        radius: "Effective radius around the site center, used for loading the terrain data. Please note that the actual size of the terrain is a function of multiple factors such as radius, resolution, and coordinates of the site center.",
        resolution : "Resolution of the 3D model",
        terrain: "Type of the terrain model",
        terrainColor: "The color of the Solid Contours and Wireframe terrain types",
        flatTerrain: 'Flatten the terrain to 2D'
        // zoom: "Zoom of the terrain model"
    }

    
    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);
    
    const updateTerrain = () => {
        let tileNumber = window['calculateNumberOfTiles'](this);

        if(tileNumber > 59){
            window['openPerfModal'](this, 'Poor');
        } else if (tileNumber > 29) {
            window['openPerfModal'](this, 'Basic');
        } else {
            window['addTerrain'](this);
        }
        // window['addTerrain'](this);
    }

    const updateOpacity = (val) => {
        window['updateTerrainOpacity'](this, val);
    }

    const updateProperty = (grid, name, val) => {
        let realVal = val;
        this.storage.terrainSettings[name] = realVal;

        if (name == "axisHelper") {
            window['toggleAxisHelper'](this, realVal);
        }

        if (name == "selectionMesh") {
            window['toggleSelectionMesh'](this, realVal);
        }

        if(name === 'terrain'){
            if(this.storage.terrainSettings['terrain'] === 'Solid Contours' || this.storage.terrainSettings['terrain'] === 'Wireframe') {
                panelData.terrainColor = window['storedTerrainColor'];
            } else {
                delete panelData.terrainColor;
            }
        }

        if(name === 'terrainColor') {
            window['storedTerrainColor'] = val;
            this.storage.terrainSettings[name] = window['storedTerrainColor'];
        }

        if (['lat', 'lng', 'radius', 'selectionMesh'].includes(name)) {
            // behavior added later on focusout
        } else if (name === 'opacity') {
            updateOpacity(realVal);
        } else if (name === 'flatTerrain') {
            window['toggleFlatTerrain'](this, realVal);
        }else if (name === 'terrain') {
            switch (realVal) {
                case 'Street Map':
                    window['handleIconClick3D']('StreetMap');
                    break;
                case 'Satellite':
                    window['handleIconClick3D']('Satellite');
                    break;
                case 'Street Map (with contours)':
                    window['handleIconClick3D']('Terrain');
                    break;
                case 'Wireframe': 
                    window['handleIconClick3D']('Wireframe');
                    break;
                case 'Solid Contours':
                    window['handleIconClick3D']('SolidContours');
                    break;
                default: break;
            }
        }
        else {
            updateTerrain();
        }
    }

    const panelOptions =    {
                                meta: optionsMetadata,
                                customTypes: customPropertyGridTypes,
                                callback: updateProperty,
                                sort: comparePropertiesGenerator(optionsMetadata),
                                helpHtml: '',
                                isCollapsible: false // we implement the behavior ourselves
                            };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);

    const updateTextProperty = (elem) => {
        const name = elem.id.replace(/pg[0-9]+/, '');
        const val = elem.value;
        this.storage.terrainSettings[name] = val;
        updateTerrain();
    }

    Array.from(panelElem.querySelectorAll(`input[type='text']`)).forEach(elem => {
        elem.addEventListener('focusout', (event) => {
            updateTextProperty(elem);
        })
        elem.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' || event.keyCode == 13) {
                updateTextProperty(elem);
            }
        })
    })

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');

    const resetTerrainPositionButton = this.generatePropertyGridButton()
    resetTerrainPositionButton.innerHTML = 'Reset Terrain Position'
    resetTerrainPositionButton.onclick = () => window['resetTerrainPosition'](this)

    buttonDiv.appendChild(resetTerrainPositionButton)

    const deleteTerrainButton = this.generatePropertyGridButton()
    deleteTerrainButton.innerHTML = 'Delete Terrain'
    deleteTerrainButton.onclick = () => window['handleIconClick3D']('None')

    buttonDiv.appendChild(deleteTerrainButton)

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.openMapPropertyGrid = function () {
    const mapProperties = {
        terrain: this.storage.mapSettings.terrain,
        lat: this.storage.mapSettings.lat,
        lng: this.storage.mapSettings.lng,
        opacity: this.storage.mapSettings.opacity,
    }
    
    const panelData = mapProperties;
    if (! panelData) {
        return;
    }

    const optionsMetadata = {
        lat: { name : "Latitude"},
        lng: { name : "Longitude"},
        opacity: { name : "Opacity", type : "options", options : transparencyOptions},
        terrain: { name : "Map Source", type : "options", options : ["Satellite", "Street Map", "Street Map (with contours)"]},
        //zoom: {name: 'Zoom Level', type: 'options', options: ['15', '16', '17', '18', '19', '20', '21']}
    }

    Object.values(optionsMetadata).forEach(value => {
        value.group = `Map Settings`;
    })
        
    const optionsTooltips = {
        lat: "Latitude of the center of the map",
        lng: "Longitude of the center of the map",
        terrain: "Type of the map model",
        opacity: 'The opacity of the map model',
        //zoom: 'The zoom level of the map model'
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);
    
    const updateMap = () => {
        window['addMap'](this);
    }

    const updateOpacity = (val) => {
        window['updateMapOpacity'](this, val);
    }

    const updateProperty = (grid, name, val) => {
        let realVal = val;
        this.storage.mapSettings[name] = realVal;

        if (['lat', 'lng'].includes(name)) {
            // behavior added later on focusout
        }
        else if (name === 'opacity') {
            updateOpacity(realVal);
        } else if (name === 'terrain') {
            switch (realVal) {
                case 'Street Map':
                    window['handleIconClickPlan']('StreetMap');
                    break;
                case 'Satellite':
                    window['handleIconClickPlan']('Satellite');
                    break;
                case 'Street Map (with contours)':
                    window['handleIconClickPlan']('Terrain');
                    break;
                default: break;
            }
        }
        else {
            updateMap();
        }
    }

    const panelOptions= {
                            meta: optionsMetadata,
                            customTypes: customPropertyGridTypes,
                            callback: updateProperty,
                            sort: comparePropertiesGenerator(optionsMetadata),
                            helpHtml: '',
                            isCollapsible: false // we implement the behavior ourselves
                        };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);

    const updateTextProperty = (elem) => {
        const name = elem.id.replace(/pg[0-9]+/, '');
        const val = elem.value;
        this.storage.mapSettings[name] = val;
        updateMap();
    }

    Array.from(panelElem.querySelectorAll(`input[type='text']`)).forEach(elem => {
        elem.addEventListener('focusout', (event) => {
            updateTextProperty(elem);
        })
        elem.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' || event.keyCode == 13) {
                updateTextProperty(elem);
            }
        })
    })

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');

    const deleteMapButton = this.generatePropertyGridButton()
    deleteMapButton.innerHTML = 'Delete Map'
    deleteMapButton.onclick = () => window['handleIconClickPlan']('None')

    buttonDiv.appendChild(deleteMapButton)

    const resetMapPosition = this.generatePropertyGridButton()
    resetMapPosition.innerHTML = 'Reset Map Position'
    resetMapPosition.onclick = () => window['resetMapPosition'](this)

    buttonDiv.appendChild(resetMapPosition)

    panelElem.appendChild(buttonDiv);
}


CrossSectionCanvas.prototype.genericTranslation = function (key, dictionary, defaultValue = null) {
    /* Translates a key using the provided dictionary.
       If key is not found, returns the key itself or the provided defaultValue. */
    if (!key || !dictionary[key]) {
        if (!defaultValue) {
            return key;
        }
        return defaultValue;
    }
    var prop = dictionary[key];
    return prop;
}

CrossSectionCanvas.prototype.getLegendName = function (soilSymbol) {
    if (!soilSymbol) {
        return;
    }
    var key = soilSymbol.toUpperCase();
    var value = this.genericTranslation(key, this.storage.legendNames);
    if (!value || value === key) {
        return soilSymbol;
    }
    return value;
}

CrossSectionCanvas.prototype.setLegendName = function (soilSymbol, legendName) {
    var key = soilSymbol.toUpperCase();
    this.storage.legendNames[key] = legendName;
}



CrossSectionCanvas.prototype.capitalizeFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

CrossSectionCanvas.prototype.testGetScaleBarImageSrc = function () {
    /* Tests the scale for the available scale inputs */
    this.storage.defaultOptions.feet.forEach(x => {
        console.log(x[0], this.getScaleBarImageSrc("imperial", x[0]))
    });
    this.storage.defaultOptions.m.forEach(x => {
        console.log(x[0], this.getScaleBarImageSrc("metric", x[0]))
    });
}

CrossSectionCanvas.prototype.getScaleBarImageSrc = async function (unit, scale) {
    /* Returns a link to the scalebar image
    unit: "metric" or "imperial"
    scale: string in the format '3/32" = 1'-0"'' if imperial, 1:200 if metric*/
    var isMetric = unit.toLowerCase() == "metric";
    let value = "";
    if (isMetric) {
        value = this.genericTranslation(scale, this.storage.metricScaleBarsDict, "");
    }
    else {
        value = this.genericTranslation(scale, this.storage.imperialScaleBarsDict, "");
    }
    if (scale === value) {
        return "";
    }

    var imageSrc = await this.getDataUrlFromImageUrl(value);
    return imageSrc;
}

CrossSectionCanvas.prototype.getCurrentScaleBarImageSrc = async function () {
    /* Returns a link to the scalebar images for horizontal and vertical scales, taking into account the current unit and scale of the canvas */
    var unit = this.storage.scaleIsFeet ? "imperial" : "metric";
    var [horScale, vertScale] = this.getCurrentScaleName();
    var horImageSrc = await this.getScaleBarImageSrc(unit, horScale);
    var vertImageSrc = horScale != vertScale ? await this.getScaleBarImageSrc(unit, vertScale) : "";
    return [horImageSrc, vertImageSrc];
}

CrossSectionCanvas.prototype.getBlobFromImageUrl = async function (url) {
    var response = await fetch(url);
    var blob = await response.blob();
    return blob;
}

CrossSectionCanvas.prototype.getObjectUrlFromImageUrl = async function (url) {
    var blob = await this.getBlobFromImageUrl(url);
    var dataUrl = await URL.createObjectURL(blob);
    return dataUrl;
}

CrossSectionCanvas.prototype.getDataUrlFromImageUrl = async function (url) {
    var img = new Image;
    var imgPromise = new Promise((resolve, reject) => {
        img.onload = () => {
            var dataURL = this.getBase64Image(img);
            resolve(dataURL);
        };
    });
    img.src = url;
    return imgPromise;
}

CrossSectionCanvas.prototype.getBase64Image = function (img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    return dataURL;
}

CrossSectionCanvas.prototype.correctOptions = function (options, otherOptions) {
    /* Corrects options with the other options that it doesnt contain */
    Object.keys(otherOptions).forEach(key => {
        if (!(key in options)) {
            options[key] = otherOptions[key];
        }
    })
    return options;
}

CrossSectionCanvas.prototype.mergeOptions = function (options, otherOptions) {
    Object.keys(otherOptions).forEach(key => {
        options[key] = otherOptions[key];
    })
    return options;
}

CrossSectionCanvas.prototype.refreshScaleBars = async function () {
    /* Refresh scale bar image and position them according to the new legend size */
    // loads scalebars image src
    const scaleBarImageSrc = await this.getCurrentScaleBarImageSrc();
    if (! scaleBarImageSrc) {
        return;
    }

    var scaleBars = this.storage.rootElem.querySelectorAll(".legend .scaleBar");

    const legendBox = this.storage.rootElem.querySelector(".legend > .legendBox");
    const legendBBox = legendBox.getBBox();
    const firstElemY = legendBox?.querySelector('.legendRect')?.getBBox()?.y ?? legendBBox.y;
    var offsetFromLegendStart = legendBBox.height - Math.abs(firstElemY - legendBBox.y) + 20;
    var offsetFromPreviousImageStart = 40;

    // if both scales are the same, remove duplicates and show only one bar
    // var correctedScaleBarImageSrc = scaleBarImageSrc[0] == scaleBarImageSrc[1] ? [scaleBarImageSrc[0], ""] : scaleBarImageSrc; 
    var correctedScaleBarImageSrc = scaleBarImageSrc;

    var textElems = Array.from(this.storage.rootElem.querySelectorAll(".legend .scaleBar .scaleBarText"));
    textElems.forEach(elem => elem.classList.remove("inviz"));
    // if 1 or less scales, no text
    if (correctedScaleBarImageSrc.length < 2 || !correctedScaleBarImageSrc[0] || !correctedScaleBarImageSrc[1]) {
        textElems.forEach(elem => elem.classList.add("inviz"));
    }

    const getDesiredWidth = (imageWidth) => {
        var desiredWidth = this.storage.scaleIsFeet ?
            (this.floatsEqual(imageWidth, 4813) ? 192 : 144)
            : 302.36;
        return desiredWidth;
    }

    const imagePromises = correctedScaleBarImageSrc.map((imageSrc, index) => {
        return new Promise((resolve, reject) => {
            if (! imageSrc) {
                resolve(null);
            }
            var image = scaleBars[index].querySelector(".scaleBarImage");
    
            // set default width before loading
            image.setAttribute("width", getDesiredWidth(0) + "px");
    
            const onload = (e) => {
                resolve(image);
                image.removeEventListener("load", onload) // references this function
            };
            image.addEventListener("load", onload)
            image.addEventListener("error", onload)
    
            image.setAttribute("href", imageSrc);
        })
    });

    let images = await Promise.all(imagePromises);
    images = images.filter(x => x);

    // set scale bar image size and text position
    images.forEach((image, index) => {            
        const scaleBar = scaleBars[index];
        var scaleBarTextElem = scaleBars[index].querySelector(".scaleBarText");
        var scaleBarText = d3.select(scaleBarTextElem);

        // set width
        var rect = image.getBBox();
        var width = rect.width;
        // as instructed on How_to_Insert.txt
        var desiredWidth = getDesiredWidth(width);
        image.setAttribute("width", desiredWidth + "px");

        var textTranslateX = desiredWidth + 10;
        var textTranslateY = rect.height - 3;
        scaleBarText.attr("transform", `translate(${textTranslateX} ${textTranslateY})`);
    })

    let combinedImageHeight = 0;
    images.forEach(image => {
        const rect = image?.getBBox();
        combinedImageHeight += rect?.height ?? 0;
    });

    // translate scalebar to correct position
    scaleBars.forEach((scaleBar, index) => {
        const elemToGetRectFrom = (images.length > 1 ? scaleBar : scaleBar?.querySelector('.scaleBarImage')) ?? scaleBar;
        const rect = elemToGetRectFrom.getBBox();
        const width = rect?.width ?? 0;
        const textBackgroundPosition = this.getTextBackgroundPosition(legendBox.querySelector("text"));
        let textBackgroundPositionX = 0;
        let textBackgroundPositionY = 0;
        let textBackgroundPositionWidth = 0
        let textbackgroundPositionHeight = 0;
        if (textBackgroundPosition) {
            textBackgroundPositionX = textBackgroundPosition.x ?? 0;
            textBackgroundPositionY = textBackgroundPosition.y ?? 0;
            textBackgroundPositionWidth = textBackgroundPosition.width ?? 0;
            textbackgroundPositionHeight = textBackgroundPosition.height ?? 0;
        }
        let left = textBackgroundPositionX ?? 0;
        let right = (textBackgroundPositionX + textBackgroundPositionWidth - width) ?? 0;
        let top = (textBackgroundPositionY - combinedImageHeight - 20) ?? 0;
        let bottom = offsetFromLegendStart;
        
        let legendScaleBar = this.storage.legendScaleBar;

        let leftPos, topPos;
        if (legendScaleBar.includes('Left')) {
            leftPos = left;
        }
        else {
            leftPos = right;
        }
        if (legendScaleBar.includes('Top')) {
            topPos = top;
        }
        else {
            topPos = bottom;
        }

        let verticalTranslation = topPos + offsetFromPreviousImageStart * index;
        var horizontalTranslation = leftPos;
        d3.select(scaleBar).attr("transform", `translate(${horizontalTranslation} ${verticalTranslation})`)
    })
    this.updateLegendPosition();
}

CrossSectionCanvas.prototype.soilSymbolToCurrentSrc = function (soilSymbol) {
    var src = this.storage.soilSymbols.get(soilSymbol);
    return src;
}

CrossSectionCanvas.prototype.changeLegendSize = function (newWidth, newHeight) {
    this.applyPageOption('legendBoxW', newWidth);
    this.applyPageOption('legendBoxH', newHeight);
    this.refreshLegend();
}

CrossSectionCanvas.prototype.getIdealLegendTransform = function () {
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    const defaultValue = `translate(${this.storage.LEGDXREAL * this.storage.AX * coordinateUnitFactor} ${this.storage.LEGDYREAL * this.storage.AY * coordinateUnitFactor}) scale(1)`;
    if (!this.storage.legendPinnedTo || this.storage.legendPinnedTo == '(none)') {
        return defaultValue;
    }
    const elem = this.storage.rootElem.querySelector('.legend');
    const bbox = elem?.getBBox();
    if (! bbox) {
        return null;
    }
    const style = window.getComputedStyle(elem);
    const matrix = new DOMMatrixReadOnly(style.transform);
    let oldScale = matrix?.a;
    if (oldScale == null || oldScale <= 0 || Number.isNaN(oldScale)) {
        oldScale = 1;
    }
    let scale = 1 / this.storage.ZOOMSCALE;
    if (scale == null || scale <= 0 || Number.isNaN(scale)) {
        scale = 1;
    }

    // calculates the size without scaling and then multiplies by the new scaling
    const legendWidth = scale * bbox.width;
    const legendHeight = scale * bbox.height;
    const offsetToBorder = 1 / this.storage.ZOOMSCALE;
    const offsetX = this.storage.AX * offsetToBorder * coordinateUnitFactor;
    const offsetY = this.storage.AY * offsetToBorder * coordinateUnitFactor;
    const sizeOfLeftAxis = this.getLeftPanelSize() * this.storage.AX;
    const sizeOfBottomAxis = this.storage.YOFFPIX / this.storage.ZOOMSCALE;
    // legend box is positioned by this point
    // the background is moved to the left and upwards in relation to the actual legend box position
    const legendBackgroundPosition = this.getTextBackgroundPosition(elem.querySelector('.legendBox text'));
    const backgroundX = legendBackgroundPosition.x / this.storage.ZOOMSCALE;
    const backgroundY = legendBackgroundPosition.y / this.storage.ZOOMSCALE;
    const backgroundWidth = legendBackgroundPosition.width / this.storage.ZOOMSCALE;
    const backgroundHeight = legendBackgroundPosition.height / this.storage.ZOOMSCALE;
    const compensateX = backgroundX;
    const compensateY = backgroundY;
    const compensateScaleX = this.storage.legendScaleBar.includes('Top') ? Math.max(0, legendWidth - backgroundWidth) : 0;
    const compensateScaleY = this.storage.legendScaleBar.includes('Top') ? Math.max(0, legendHeight - backgroundHeight) : 0;
    const left = this.c5x00() + offsetX + sizeOfLeftAxis - compensateX;
    const top = this.c5y00() + offsetY - compensateY + compensateScaleY;
    const right = this.xE() - offsetX - legendWidth - compensateX;
    const bottom = this.yE() - offsetY - sizeOfBottomAxis - legendHeight - compensateY + compensateScaleY;

    switch (this.storage.legendPinnedTo) {
        case 'Top-Left':
            return `translate(${left}, ${top}) scale(${scale})`;
        case 'Top-Right':
            return `translate(${right}, ${top}) scale(${scale})`;
        case 'Bottom-Left':
            return `translate(${left}, ${bottom}) scale(${scale})`;
        case 'Bottom-Right':
            return `translate(${right}, ${bottom}) scale(${scale})`;
        default:
            return defaultValue;
    }
}

CrossSectionCanvas.prototype.updateLegendPosition = function () {
    const translate = this.getIdealLegendTransform();
    if (! translate) {
        return;
    }
    const elem = this.storage.rootElem.querySelector('.legend');
    d3.select(elem).attr('transform', translate);
}

const legendPinnedDefaultOptions = {
    legendBoxW : 30,
    legendBoxH : 30,
    legendBoxFontSize : 10,
}

CrossSectionCanvas.prototype.getFillUsedForLegend = function () {
    // collect all fill from boreholes and this.storage.polygons
    var bhfill = this.storage.d3_root.selectAll("path.borehole").data().map(d => (d && d.fsrc) || this.getDefaultImgSrc(d));
    var polyfill = this.storage.d3_root.selectAll("path.polygon").data().map(d => d.fsrc);
    let bothFills = bhfill.concat(polyfill)
        // remove undefined
        .filter(e => e)
        .map(src => this.pathToName(src));
    let uniqfill = [...new Set(bothFills)].filter(e => e).map(soilSymbol => this.soilSymbolToCurrentSrc(soilSymbol)).map(src => this.getColoredSrc(src));


    var oldLegendTextData = this.storage.d3_root.select(".legend .legendBox").selectAll("text.legend-text-item").data();
    var oldLegendTextDataDict = Object.fromEntries(oldLegendTextData.map(data => [data.src, data]));

    const fillUsedForLegend = uniqfill.map(src => {
        let coloredSrc = this.getColoredSrc(src);
        return this.legendSrc2text(coloredSrc);
    });

    fillUsedForLegend.forEach(options => {
        var src = options.src;
        var oldOptions = oldLegendTextDataDict[src];
        if (oldOptions) {
            this.correctOptions(options, oldOptions)
        }
    });  
    return fillUsedForLegend;
}

CrossSectionCanvas.prototype.getLegendDisplayText = function (soilSymbol) {
    if (! soilSymbol) {
        return '';
    }
    var translated = this.getLegendName(soilSymbol) + '';
    const description = this.storage?.soilDescriptions[soilSymbol];
    return description ?? translated ?? soilSymbol;
}

CrossSectionCanvas.prototype.refreshLegend = function () {

    const isPinned = this.storage.legendPinnedTo != '(none)';
    let WL = isPinned ? legendPinnedDefaultOptions.legendBoxW : this.storage.legendBoxW;
    let HL = isPinned ? legendPinnedDefaultOptions.legendBoxH : this.storage.legendBoxH;
    const numberOfColumns = parseInt(this.storage.legendBoxNumberOfColumns) ?? 1;
    const fontSize = isPinned ? legendPinnedDefaultOptions.legendBoxFontSize : this.storage.legendBoxFontSize ?? this.storage.TEXTSIZE;
    //var WL = 80;
    //var HL = 40;

    this.storage.fillUsedForLegend = this.getFillUsedForLegend();
    // console.log(oldFillUsedForLegend);

    // this.storage.d3_root.select(".legend").selectAll("*").remove();
    this.storage.d3_root.select(".legend .legendBox").remove();

    const legend = this.storage.d3_root.select(".legend");
    legend.on("click", d => this.legendBoxMouseClick());

    var li = legend.append("g")
        .classed("legendBox", true)


    const title = li.append('text');
    title.text(this.storage.legendBoxText)
    .attr('font-size', (this.storage.legendBoxFontSize ?? this.storage.TEXTSIZE) + 'px')
    .style('font-family', this.storage.legendBoxFontFamily ?? 'Arial')
    .style('font-weight', 'bold')
    .style('text-anchor', 'middle')

    const titleHeight = title?.node()?.getBBox()?.height ?? 0;
    const titleTranslateY = -titleHeight -10;

    const rects = li.selectAll("oooo").data(this.storage.fillUsedForLegend).enter().append("rect")

    rects.classed("sw legendRect", 1)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", WL)
        .attr("height", HL)
        .attr("fill", d => {
            return this.correctHatchFill(`url(#${d.src})`)
        })
        .style("stroke", "black")
        .on("click", event => {
            this.legendBoxMouseClick();
            this.legendRectMouseClick(event)
        })
    const texts = li.selectAll("oooo").data(this.storage.fillUsedForLegend).enter().append("text")
    const textOnClick = this.textMouseClickGenerator();
    texts.text(d => {
            if (d.textExtra) return d.textExtra + '';
            var soilPath = d.src + '';
            var soilSymbol = this.pathToName(soilPath) + '';
            const displayText = this.getLegendDisplayText(soilSymbol);
            return displayText;
        })                               // GW
        .classed("fsz", 1)
        .classed("legend-text-item", 1)
        .attr('font-size', fontSize + 'px')
        .style('font-family', this.storage.legendBoxFontFamily ?? 'Arial')
        .classed("opa", d => d.textHidden)          // on load extra
        .attr('fill', d => d.textColor)             // on load extra
        .on("click", function (d) {
            // this.legendBoxMouseClick();
            textOnClick(d, d3.select(this));
        })

    const wordWidths = texts.nodes().map(node => {
        return node?.getBBox()?.width ?? 0;
    })
    const maximumWordWidth = Math.max(...wordWidths)

    const perColumn = Math.ceil(this.storage.fillUsedForLegend.length / numberOfColumns);
    const gapHatchText = 10;
    const itemHeight = Math.max(titleHeight, HL);
    const verticalGap = 10;
    const columnWidth = WL + gapHatchText * 2 + maximumWordWidth;
    const getXOffset = i => columnWidth * Math.floor(i / perColumn);
    const getVerticalI = i => i % (perColumn);

    rects.attr("transform", (d, i) => {
        const xOffset = getXOffset(i);
        const verticalI = getVerticalI(i);
        return `translate(${xOffset} ${verticalI * (itemHeight + verticalGap)})`
    })

    texts.attr("transform", (d, i) => {
            const xOffset = getXOffset(i);
            const verticalI = getVerticalI(i); 
            return `translate(${xOffset + WL + gapHatchText} ${verticalI * (itemHeight + verticalGap) + HL / 2})`
        })

    // only adds scalebar nodes in the first time;
    var oldScaleBars = this.storage.d3_root.selectAll(".legend .scaleBar");
    if (oldScaleBars.nodes() == 0) {
        oldScaleBars.remove();
        var scaleBars = [
            this.storage.d3_root.select(".legend").append("g").classed("scaleBar", true),
            this.storage.d3_root.select(".legend").append("g").classed("scaleBar", true)
        ];
        scaleBars.forEach(scaleBar => {
            scaleBar.append("image").classed("scaleBarImage", true);
            scaleBar.append("text").classed("scaleBarText", true).attr('font-size', this.storage.TEXTSIZE + 'px').classed("invisible", 1);
        })
        scaleBars[0].select(".scaleBarText").node().textContent = "HORIZONTAL";
        scaleBars[1].select(".scaleBarText").node().textContent = "VERTICAL";
    }
    this.refreshScaleBars();

    li.insert('rect', ":first-child").classed("rbkg", 1)
    .style("stroke", this.storage.legendHasBorder ? (this.storage.legendBorderColor ?? defaultOptions.legendBorderColor) : null)
    .style("stroke-width", this.storage.legendHasBorder ? '1px' : '0px');
    
    const elems = li.select("text").nodes()
    if (elems && elems.length > 0 && elems[0]) {
        title.style('display', 'none');
        const dict = this.getTextBackgroundPosition(elems[0]);
        title.style('display', 'unset');
        title.attr('transform', `translate(${dict.width / 2} ${titleTranslateY})`)
        this.updTextBackground(elems[0]);
    }

    // li.attr("transform", `translate(${this.c5x00()} ${this.c5y00()})`)
    const crossSectionObj = this;
    this.storage.d3_root.select(".legend")
        //.attr("transform", `translate(${this.x2svg(this.storage.REGCX)} ${this.y2svg(this.storage.REGCY)})`)
        .call(d3.drag()
            .filter(event => {
                return ! crossSectionObj.isInDrawMode();
            })
            .on("drag", this.storage.dragLegendProc)
            .on("start", () => { this.storage.legendIsDragging = true })
            .on("end", () => { this.storage.legendIsDragging = false })
        )
    
    this.updateLegendPosition();
    console.log("legend refreshed ok")

    this.toggleInvisible(this.storage.rootElem.querySelector('g.legend .legendBox'), this.storage?.showLegend ?? true);
    this.toggleInvisible(this.storage.rootElem.querySelector('g.legend .scaleBar'), (this.storage?.showLegend && this.storage?.legendScaleBar != '(none)') ?? true);

}

// ----------------------------------
CrossSectionCanvas.prototype.waterfrontMode = function (buttonElem) {
    if (this.storage.WATERFRONTMODE) {
        return;
    }
    this.endDrawModes();
    this.cancelSelection();
    this.storage.WATERFRONTMODE = true;
    this.storage.CONNECTPOINTS = [];
    const tooltip = this.storage?.rootElem?.querySelector(".drawWaterlineTooltip");
    tooltip?.classList?.remove(tooltipHiddenClass);
    this.disableButton(buttonElem);
    return;
}

CrossSectionCanvas.prototype.endDrawModes = function () {
    const needToEnd = [
        this.storage.WATERFRONTMODE,
        this.storage.CONNECTPOINTS,
        this.storage.CONNECTMODE,
        this.storage.drawPolygonMode,
        this.storage.drawLineMode,
        this.storage.drawTextMode,
    ].some(x => x);
    if (! needToEnd) {
        return;
    }
    this.endDrawPolygonMode();
    this.endDrawLineMode();
    this.endWaterFrontMode();
    this.endDrawTextMode();
    this.storage.WATERFRONTMODE = null;
    this.storage.CONNECTPOINTS = null;
    this.storage.CONNECTMODE = null;
    this.storage.drawPolygonMode = false;
    this.storage.drawLineMode = false;
    this.storage.drawTextMode = false;
    this.clearLinksBeingDrawn();
    this.hideLinksFollowingMouse();
    this.drawExtraPoints(this.storage.svg1)
    this.drawLinks(this.storage.svg1);
    this.drawPolygons(this.storage.svg1);
    this.removeOrphanPoints();
    this.getAllPoints();
}

// aux function that is called on endDrawModes
CrossSectionCanvas.prototype.endWaterFrontMode = function () {
    if (! this.storage.WATERFRONTMODE) {
        return;
    }
    const tooltip = this.storage?.rootElem?.querySelector(".drawWaterlineTooltip");
    tooltip?.classList?.add(tooltipHiddenClass);
    const button = this.storage.rootElem.querySelector('.toggleWaterfrontModeButton');
    this.enableButton(button);
}

CrossSectionCanvas.prototype.startDrawLineMode = function () {
    if (this.storage.drawLineMode) {
        return;
    }
    this.endDrawModes();
    this.cancelSelection();
    this.storage.drawLineMode = true;
    this.storage.CONNECTPOINTS = [];
    const tooltip = this.storage?.rootElem?.querySelector(".drawLineTooltip");
    tooltip?.classList?.remove(tooltipHiddenClass);
    const buttonElem = this.storage.rootElem.querySelector('.drawLine');
    this.disableButton(buttonElem);
    return;
}

// aux function that is called on endDrawModes
CrossSectionCanvas.prototype.endDrawLineMode = function () {
    if (! this.storage.drawLineMode) {
        return;
    }
    const tooltip = this.storage?.rootElem?.querySelector(".drawLineTooltip");
    tooltip?.classList?.add(tooltipHiddenClass);
    const button = this.storage.rootElem.querySelector('.drawLine');
    this.enableButton(button);
}

CrossSectionCanvas.prototype.toggleDrawLineMode = function () {
    if (this.storage.drawLineMode) {
        this.endDrawModes();
    }
    else {
        this.startDrawLineMode();
    }
}

CrossSectionCanvas.prototype.startDrawTextMode = function () {
    if (this.storage.drawTextMode) {
        return;
    }
    this.endDrawModes();
    this.cancelSelection();
    this.storage.drawTextMode = true;
    this.storage.currentText = null;
    const tooltip = this.storage?.rootElem?.querySelector(".drawTextTooltip");
    tooltip?.classList?.remove(tooltipHiddenClass);
    const buttonElem = this.storage.rootElem.querySelector('.drawText');
    this.disableButton(buttonElem);
    return;
}

CrossSectionCanvas.prototype.finishDrawingText = function () {
    const d = this.storage.currentText;
    if (! d) {
        return;
    }
    // only finishes the text if the text exists
    // if (! d?.text || d?.text == this.storage.textDefaultProperties.text) {
    //     return;
    // }
    const timestamp = this.storage.uniq();
    this.storage.currentText.timestamp = timestamp;
    this.storage.lastCreatedTextToRemoveIfEmpty = timestamp;

    this.storage.texts[timestamp] = d;
    this.endDrawModes();
    this.storage.svg1?.selectAll('.textBox')?.filter(d => d.timestamp == timestamp)?.node()?.querySelector('textarea')?.focus();
    return timestamp;
}

// aux function that is called on endDrawModes
CrossSectionCanvas.prototype.endDrawTextMode = function () {
    if (! this.storage.drawTextMode) {
        return;
    }
    this.storage.currentText = null;
    const tooltip = this.storage?.rootElem?.querySelector(".drawTextTooltip");
    tooltip?.classList?.add(tooltipHiddenClass);
    const button = this.storage.rootElem.querySelector('.drawText');
    this.enableButton(button);
}

CrossSectionCanvas.prototype.toggleDrawTextMode = function () {
    if (this.storage.drawTextMode) {
        this.endDrawModes();
    }
    else {
        this.startDrawTextMode();
    }
}

CrossSectionCanvas.prototype.textMouseClick = function (timestamp) {
    if (this.isInDrawMode()) {
        return;
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();    // hide menu
    this.openTextPropertyGrid(timestamp);
}

function roundToDecimalPlaces(value, decimalPlaces) {
    return parseFloat(parseFloat(value ?? 0).toFixed(decimalPlaces));
}

// only cosmetic
// actual rounding of the value saved to storage needs to be implemented too
// using the function roundToDecimalPlaces
CrossSectionCanvas.prototype.initializeRoundPropertyOnUnfocus = function (panelElem, property, decimalPlaces) {
    const row = getPropertyGridRow(panelElem, property);
    const input = row.querySelector('input');
    if (! input) {
        return;
    }
    input.addEventListener('blur', (event) => {
        input.value = roundToDecimalPlaces(input.value, decimalPlaces);
    })
}

CrossSectionCanvas.prototype.initializeTextFinishEditOnUnfocus = function (panelElem, property) {
    const row = getPropertyGridRow(panelElem, property);
    const input = row.querySelector('input');
    if (! input) {
        return;
    }
    input.addEventListener('blur', (event) => {
        this.textFinishEdit();
    })
}

CrossSectionCanvas.prototype.openTextPropertyGrid = function (timestamp) {
    this.storage.selectingText = timestamp;
    const properties = this.storage.texts[timestamp];
    const panelData = this.cloneObject(properties);
    if (! panelData) {
        return;
    }
    ['text', 'timestamp'].forEach(key => {
        if (key in panelData) {
            delete panelData[key]
        }
    })
    const decimalPlaces = 2;
    const step = 0.01;
    const keysToRound = ['x', 'y', 'boxWidth', 'boxHeight']
    keysToRound.forEach(key => {
        if (! (key in panelData)) {
            return;
        }
        panelData[key] = roundToDecimalPlaces(panelData[key], decimalPlaces);
    })
    const elem = this.selectElemFromTimestamp('.textBox', timestamp);

    const unit = this.storage.scaleIsFeet ? 'ft' : 'm'
    const optionsMetadata = {
        backgroundColor : {name : "Background color", type : "color"},
        fontFamily : {name: "Font Family", type : "options", options : fontFamilyOptions},
        fontSize : {name: "Font Size (px)", type : "options", options : fontSizeOptions},
        showBackground : {name : "Show background", type : "boolean"},
        showBorder : {name : "Show border", type : "boolean"},
        textColor : {name : "Text Color", type : "color"},
        text : {name : "Text"},
        boxWidth: {name : `Box Width (${unit})`, options : {step : step}},
        boxHeight: {name : `Box Height (${unit})`, options : {step : step}},
        x: {name : `X (${unit})`, options : {step : step}},
        y: {name : `Y (${unit})`, options : {step : step}},
        transparency : {name: "Opacity", type : "options", options:transparencyOptions},
        zOrder : {name : "Z Order", type : "options", options : zOrderOptions},
    }

    const group = 'Text';
    Object.values(optionsMetadata).forEach(value => {
        value.group = group;
    })
        
    const optionsTooltips = {
        backgroundColor : "Color of the background",
        fontFamily : "Font family of the text",
        fontSize : "Font size of the text",
        showBackground : "Whether to show text background or not",
        showBorder : "Whether to show the border of the text box or not",
        textColor : "Color of the text",
        text : "Text written in the text box",
        boxWidth : "Width of the text box",
        boxHeight : "Height of the text box",
        x : "Horizontal position of the text box",
        y : "Vertical position of the text box",
        transparency : "Opacity of the text box",
        zOrder : "Whether the text box is shown below or above other elements",
    }
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            const properties = this.storage.texts[timestamp];
            if (name == 'x' || name == 'y') {
                val = roundToDecimalPlaces(val, decimalPlaces);
            }
            properties[name] = val;
            this.drawTexts(this.storage.svg1);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);
    ['x', 'y'].forEach(property => {
        this.initializeRoundPropertyOnUnfocus(panelElem, property, decimalPlaces);
    })
    combineGridRows(panelElem, ['showBackground', 'backgroundColor']);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');

    const copyButton = this.generateCopyToAllObjectsButton(
        'Texts',
        () => this.storage.texts[timestamp],
        this.storage.texts,
        ['text', 'x', 'y', 'boxWidth', 'boxHeight'],
        () => this.drawTexts(this.storage.svg1)
    );

    const deleteButton = this.generatePropertyGridButton();
    deleteButton.innerText = "  Delete  "
    deleteButton.onclick = () => {
        delete this.storage.texts[timestamp];
        this.drawTexts(this.storage.svg1);
        this.cancelSelection();
    }

    buttonDiv.appendChild(copyButton);
    buttonDiv.appendChild(deleteButton);

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.applyNewBoreholeWidth = function (newWidthScale) {
    if (!newWidthScale) {
        return;
    }
    this.applyPageOption('boreholeWidth', newWidthScale)

    // var borehole = this.storage.data0[0]
    // borehole.ally.forEach(pt => pt.xx -= 2);
    this.storage.data0.forEach(borehole => {
        borehole.ally.forEach(pt => {
            pt.recalcXX(borehole.general.disp_w / 2 * newWidthScale / 100)
        })
    }
    )
    console.log("PT??", this.storage.pt.correct_yz)
    var allPointsText = this.storage.svg1.selectAll('text.layery')    //.data(borehole.ally, e => e.timestamp)
        .attr("x", pt => { return pt.xx * this.storage.AX - 9 })
        .attr("y", pt => -pt.correct_yz * this.storage.AY)

    this.storage.svg1.selectAll('path.borehole')
        .attr("d", soillayer => {
            return this.dpolygon([
                { xx: soillayer.p1LT.xx, yz: soillayer.p1LT.yz, correct_yz: soillayer.p1LT.correct_yz, left: soillayer.p1LT.left ?? false },
                { xx: soillayer.p3LB.xx, yz: soillayer.p3LB.yz, correct_yz: soillayer.p3LB.correct_yz, left: soillayer.p3LB.left ?? false },
                { xx: soillayer.p4RB.xx, yz: soillayer.p4RB.yz, correct_yz: soillayer.p4RB.correct_yz, left: soillayer.p4RB.left ?? false },
                { xx: soillayer.p2RT.xx, yz: soillayer.p2RT.yz, correct_yz: soillayer.p2RT.correct_yz, left: soillayer.p2RT.left ?? false }
            ])
        })

    var allPointsRect = this.storage.svg1.selectAll('rect.bhpoint')
        .attr("x", pt => pt.xx * this.storage.AX + this.cornerExtraOffset())
        .attr("y", pt => -pt.correct_yz * this.storage.AY + this.cornerExtraOffset())

    this.storage.svg1.selectAll("text.layerinfo")
        .attr("x", sl => (sl.p2RT.xx + sl.p4RB.xx) / 2 * this.storage.AX + 9)
        .attr("y", sl => -(sl.p2RT.correct_yz + sl.p4RB.correct_yz) / 2 * this.storage.AY) // + this.storage.TEXTSIZE / 2)


    this.drawAllBoreholes();
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.fieldtest-plot'))) 
    this.drawPolygons(this.storage.svg1);
    this.changeWaterIconSize();    // added
}

CrossSectionCanvas.prototype.getOffset = function (borehole) {
    /* Receives an object containing borehole data, returns an offset corresponding to how much we have to add to yz values in order to correct them and get a real elevation. This is used to correct the old coordinate system the code used. */
    let elevationBorehole = borehole.general.z;
    let offset = - elevationBorehole * 2
    return offset;
}

// ----------------------------------

CrossSectionCanvas.prototype.drawAllFieldTests = function () {
    /* Draws field tests for all boreholes */
    this.storage.data0.forEach(bh => {
        this.drawFieldTest(bh);
    })
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.fieldtest-plot')))
}

function cloneObject (obj) {
    /* Receives a javascript object, returns a clone of it. Object must contain only javascript primitives and basic objects, such as strings, numbers, arrays and objects. */
    return JSON.parse(JSON.stringify(obj));
}

CrossSectionCanvas.prototype.cloneObject = function (obj) {
    /* Receives a javascript object, returns a clone of it. Object must contain only javascript primitives and basic objects, such as strings, numbers, arrays and objects. */
    return cloneObject(obj);
}

CrossSectionCanvas.prototype.maxNumberOfCharacters = function (arr) {
    /* Returns the maximum number of characteres for all the strings in an array */
    if (!arr) {
        return 0;
    }
    var numberOfCharacters = arr.map(x => x.length);
    var max = Math.max(...numberOfCharacters);
    return max;
}

CrossSectionCanvas.prototype.wrapSvgText = function (textElem, newWidth) {
    /* Wraps svg text element to a specific width */
    if (!textElem || !newWidth) {
        return;
    }
    var text = textElem.innerHTML.replace(/<tspan>/g, "").replace(/<\/tspan>/g, " ")
    if (!text) {
        return;
    }
    var bbox = textElem.getBBox()
    let oldWidth = bbox.width;
    if (!oldWidth) {
        oldWidth = 1;
    }
    var textX = textElem.getAttribute("x") ?? 0;

    let numberOfCharacters = text.length;
    if (!numberOfCharacters) {
        numberOfCharacters = 1;
    }
    var pxPerCharacter = Math.ceil(oldWidth / numberOfCharacters);
    var charactersPerLine = Math.floor(newWidth / pxPerCharacter);

    var words = text.split(' ');

    // var getTspanOpen = (i) => `<tspan x="0" dy="${i}em">`;
    var tspanOpen = `<tspan x="${textX}" text-anchor="middle" dy="1em">`;
    let newText = tspanOpen;
    let charactersInCurrentLine = 0;
    words.forEach((word, index) => {
        var wordFits = charactersInCurrentLine === 0 || (charactersInCurrentLine + word.length <= charactersPerLine);
        if (wordFits) {
            newText = newText + word + ' '
            charactersInCurrentLine += word.length;
        }
        else {
            newText = newText + `</tspan>` + tspanOpen + word
            charactersInCurrentLine = word.length;
        }
    })
    newText = newText + `</tspan>`

    textElem.innerHTML = newText;
}

CrossSectionCanvas.prototype.drawFieldTest = function (borehole) {
    /* Receives borehole data and plots a fieldtest if the fieldtest data exists. */
    if (!borehole?.general.test_data) return;

    let timestamp = borehole.soillayer[0].timestamp;

    let boreholeSvg = this.storage.d3_root.selectAll(".g-borehole").filter(d => d.timestamp == timestamp);
    // no equivalent borehole found
    if (!boreholeSvg) {
        return;
    }

    // remove old, otherwise it doesn't let me change the translation values
    this.storage.d3_root.select('.fieldtests').selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp).remove();
    this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp).remove();

    // check if should be drawn
    const boreholeProperties = this.storage.boreholeProperties[timestamp];
    if (! this.storage?.showFieldTestPlots) {
        return;
    }
    const fieldTestPlotOption = boreholeProperties?.fieldTestPlotOption;
    if (! fieldTestPlotOption) {
        return;
    }
    const allTestsData = borehole?.general?.test_data;
    let testData = allTestsData?.find(data => data.title == fieldTestPlotOption);
    if (! testData) {
        return;
    }

    let properties = this.cloneObject(this.storage.fieldTestDefaultProperties);
    if (this.storage.fieldTestProperties[timestamp]) {
        properties = this.storage.fieldTestProperties[timestamp];
    }
    // sometimes something breaks the code
    if (!properties || typeof properties == "string") {
        properties = {}
    }
    properties = this.correctOptions(properties, this.storage.fieldTestDefaultProperties)
    this.storage.fieldTestProperties[timestamp] = properties;
    var FIELDTESTOFFSET = 1;
    var defaultWidth = 2;
    var pointSize = this.storage.LineThickness;

   
    let test_data = testData.data;
    let test_title = testData.title;
    let test_position = "right";
    if (!test_title) {
        test_title = "Unknown";
    }
    if (!test_position) {
        test_position = "right";
    }

    var currentFieldtestPosition = this.storage.fieldTestPositions[timestamp]?.test_xx || borehole.general.test_xx;
    if (currentFieldtestPosition != null) {
        var toRightOfBorehole = currentFieldtestPosition > borehole.general.x;
        test_position = toRightOfBorehole ? "right" : "left";
    }

    if (properties.anchor == 'Right') {
        test_position = "right";
    }
    if (properties.anchor == "Left") {
        test_position = "left";
    }

    if (properties.anchor != '(none)') {
        if (test_position == "left") {
            const rect = boreholeSvg.select('.boreholePoints')?.node()?.getBBox();
            const labelsLeftPx = rect?.x ?? 0;
            const labelsLeft = labelsLeftPx / this.storage.AX;
            const labelsLeftInRelationToBorehole = Math.abs(borehole.general.x - labelsLeft);
            FIELDTESTOFFSET = labelsLeftInRelationToBorehole + 1;
        }
        else {
            const rect = boreholeSvg.select('.boreholeLabels')?.node()?.getBBox();
            const labelsRightPx = rect?.x + rect?.width ?? 0;
            const labelsRight = labelsRightPx / this.storage.AX;
            const labelsRightInRelationToBorehole = Math.abs(borehole.general.x - labelsRight);
            FIELDTESTOFFSET = labelsRightInRelationToBorehole + 1;
        }
    }
        
        
    let values = test_data.split("|").map(v => v.split(",")).map(v => [parseFloat(v[1]), parseFloat(v[0])]).sort((a, b) => {
        return a[1] - b[1];
    });

    const coordinateUnitFactor = this.getCoordinateUnitFactor();

    let minDepth = values[0][1];
    let maxDepth = values[values.length - 1][1];
    let maxValue = Math.max(...(values.map(v => v[0])));

    // those v[1]'s are the depth, we are going to move the polygon to the right place later


    let plot_width = defaultWidth;
    if (this.storage.fieldTestWidths[test_title]) {
        plot_width = this.storage.fieldTestWidths[test_title];
    }
    this.storage.fieldTestWidths[test_title] = plot_width;

    const plotWidthCoordinateUnit = plot_width * coordinateUnitFactor;

    // scale used to map the points into the desired width

    let widthDomain = [0, maxValue];
    // if (test_position == "left") {
    // widthDomain = [maxValue, 0]
    // }
    let scaleWidth = d3.scaleLinear()
        .domain(widthDomain)
        .range([0, plotWidthCoordinateUnit])

    let valuesCorrected = values.map(v => [scaleWidth(v[0]), v[1]]);

    let points = valuesCorrected.map(v => [v[0] * this.storage.AX, v[1] * this.storage.AY]);
    let firstPoint = [0, points[0][1]]
    let lastPoint = [0, points[points.length - 1][1]]
    points.splice(0, 0, firstPoint);
    points.push(lastPoint);

    let plot_height = maxDepth;
    const plotHeightCoordinateUnit = plot_height * coordinateUnitFactor;

    let plot_width_pixels = plotWidthCoordinateUnit * this.storage.AX;
    let plot_height_pixels = plotHeightCoordinateUnit * this.storage.AY;

    let pointsCoordinateUnit = points.map(arr => [arr[0], arr[1] * coordinateUnitFactor]);

    // mirrors plot
    if (test_position == "left") {
        points = points.map(p => [-p[0] + plot_width_pixels, p[1]])
        pointsCoordinateUnit = pointsCoordinateUnit.map(p => [-p[0] + plot_width_pixels, p[1]])
    }


    // console.log(valuesCorrected);
    // console.log(points);

    // draw plot =================================
    // observation, everything is drawn at 0 and then moved at the end of the function

    let plot_data = {
        timestamp: timestamp,
    };

    // we include a timestamp so it can be uniquely identified
    // selectAll will select all field tests, even from other boreholes
    // the selection is filtered so we only choose the field test for this borehole
    // the new data is bound to this element
    // we use [data] because data must receive an array, and in this case it's a single element
    // if there were no elements (number of elements selected mismatch number of elements in the array passed to data())
    // enter() will create them
    let plot = this.storage.d3_root.select('.fieldtests').selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp).data([plot_data]).enter()
        .append("g")
        .attr("width", plot_width_pixels)
        .attr("height", plot_height_pixels)
        .classed("fieldtest-plot", true)
        .attr("elemType", "fieldtest")

    // background
    plot
        .append("rect")
        .attr("width", plot_width_pixels)
        .attr("height", plot_height_pixels)
        .attr("fill", properties.backgroundColor)
        // .attr("fill-opacity", properties.plotOpacity)
        .attr("stroke", "black")
        .attr("stroke-width", this.storage.LineThickness);

    // draw axis =================================

    let horDomain = [0, maxValue];
    if (test_position == "left") {
        horDomain = [maxValue, 0]
    }
    // scales
    let scaleHor = d3.scaleLinear()
        .domain(horDomain)
        .range([0, plot_width_pixels])
    let scaleVert = d3.scaleLinear()
        // .domain([minDepth, maxDepth])
        .domain([0, maxDepth])
        .range([0, plot_height_pixels])

    let maxNumberOfDigitsHor = maxValue.toString().length;
    maxNumberOfDigitsHor = maxNumberOfDigitsHor ? maxNumberOfDigitsHor : 1;

    // example: plotWidthCoordinateUnit 30, tick text containing at most 3 characters each
    // i want at least 6 units of space for each tick
    // this is a heuristic that works for the available scales and tick font size
    let ticksHor = Math.floor(plotWidthCoordinateUnit / (maxNumberOfDigitsHor * 2));
    // 2.00 is a heuristic number that works for available scales and tick font size
    let ticksVert = Math.floor(plotHeightCoordinateUnit / 2.00);
    ticksHor = ticksHor == 0 ? 1 : ticksHor;
    ticksVert = ticksVert == 0 ? 1 : ticksVert;

    let vertAxisFunction = test_position == "left" ? d3.axisRight : d3.axisLeft;

    // grid lines
    let gridGeneratorHor = d3.axisBottom(scaleHor)
        .tickSize(plot_height_pixels)
        .ticks(ticksHor)
        .tickSizeOuter(0)
    let gridGeneratorVert = d3.axisRight(scaleVert)
        .tickSize(plot_width_pixels)
        .ticks(ticksVert)
        .tickSizeOuter(0)
    let grid = plot
        .append("g")
        .classed("fieldTestGrid", 1)

    let gridHor = grid.append("g");
    let gridVert = grid.append("g");

    gridHor.call(gridGeneratorHor)
    gridVert.call(gridGeneratorVert)

    gridHor.attr("y", -plot_height_pixels);
    // let gridStrokeWidth = this.storage.GridlineThickness / 2 + 'px';
    let gridStrokeWidth = (this.storage.GridlineThickness / 4) + 'px'
    grid.selectAll("line").style('stroke-width', gridStrokeWidth).attr('stroke-dasharray', gridStrokeWidth)
    // cleans some drawings
    grid.selectAll("text").attr("visibility", "hidden");
    grid.selectAll("path").attr("visibility", "hidden");

    var tickSize = 3;

    // axis
    let horAxisGenerator = d3.axisBottom(scaleHor)
        .ticks(ticksHor)
        .tickFormat(v => v / 1.00)
        .tickSize(tickSize)
        .tickSizeOuter(0)
    let vertAxisGenerator = vertAxisFunction(scaleVert)
        .ticks(ticksVert)
        // .tickFormat(v => v/1.00)
        .tickSize(tickSize)
        .tickSizeOuter(0)

    let axis = plot
        .append("g")
        .classed("fieldTest-axis", true)
    // make axis follow the plot
    // .attr("transform", `translate (0, ${minDepth * this.storage.AY})`)

    let horAxis = axis
        .append("g")
        .call(horAxisGenerator)
        .attr("font-size", this.storage.TEXTSIZE + "px")
        .classed("fieldtest-hor-axis", true)
        .classed("fsz", true)

    let vertAxis = axis
        .append("g")
        .call(vertAxisGenerator)
        .attr("font-size", this.storage.TEXTSIZE + "px")
        .classed("fieldtest-vert-axis", true)
        .classed("fsz", true)
    // console.log("VERTAXIS", vertAxis)
    if (test_position == "left") {
        vertAxis.attr("transform", `translate (${plot_width_pixels}, 0)`)
    }

    // removes axis lines for clearer appearance, border will act as them.
    axis.selectAll("path").style('visibility', "hidden");

    if (properties.showXAxisNumber != null && ! properties.showXAxisNumber) {
        horAxis.selectAll('text').remove();
    }
    if (properties.showYAxisNumber != null && ! properties.showYAxisNumber) {
        vertAxis.selectAll('text').remove();
    }

    // this.storage.rootElem.querySelectorAll(".fieldtests .fieldTest-axis g.tick:last-child line").forEach(elem => {
    //     elem.style.visibility = "hidden";
    // })
    // axis.selectAll("g.tick:first-child").style('visibility', "hidden");
    // axis.selectAll("path").style('stroke-width', 0 + 'px')

    // draw lines =================================

    plot.selectAll(".fieldtest-line").filter(d => d.timestamp == timestamp).remove();

    // draw fill
    let fieldTestFill = plot
        .append("path")
        .attr("d", d => d3.line()(pointsCoordinateUnit))
        .attr("stroke", "none")
        .attr("fill", properties.lineFillColor)
        // .attr("fill-opacity", properties.plotOpacity)
        .classed("fieldtest-fill", 1)

    let fieldTestLines = plot
        .append("path")
        .attr("d", d => d3.line()(pointsCoordinateUnit.slice(1, points.length - 1)))
        .attr("stroke", properties.lineColor)
        .attr("fill", "none")
        // .attr("fill-opacity", properties.plotOpacity)
        .classed("fieldtest-line", 1)

    // draw points =================================
    if (properties.showPoints || properties.showPointsValues) {
        var zipped = this.zip(points.slice(1, points.length - 1), values);
        var n = zipped.length;
        var textOffset = this.storage.TEXTSIZE / 2;
        var getInclination = (a, b) => {
            var infinite = 999999;
            var dx = b[0] - a[0];
            var dy = b[1] - a[1];
            if (dx == 0) {
                return null;
            }
            var inclination = dy / dx;
            return inclination;
        }
        var pointData = zipped.map((x, index) => {
            let a = zipped[this.mod(index - 1, n)][0]
            let b = x[0]
            let c = zipped[this.mod(index + 1, n)][0]

            if (index == 0) {
                c = [b[0], b[1] - 1]
            }
            if (index == n - 1) {
                a = [b[0], b[1] + 1]
            }
            // vector c b going bottom to top
            // therefore if A to the right of vector, there's more space to the left to put our text in
            let textAnchor = this.isRight(c, b, a) ? "start" : "end";

            var inclination_cb = getInclination(c, b)
            var inclination_ba = getInclination(b, a)
            // if cb is more inclined than ba then we have more space above the point
            let textBaseline;
            if (inclination_cb == null) {
                textBaseline = "hanging";
            }
            else if (inclination_ba == null) {
                textBaseline = "auto";
            }
            else {
                textBaseline = Math.abs(inclination_cb) > Math.abs(inclination_ba) ? "auto" : "hanging";
            }

            var offsetToAdd = textAnchor == "start" ? textOffset : - textOffset;
            const x0CoordinateUnit = [x[0][0], x[0][1] * coordinateUnitFactor];
            var textPosition = [x0CoordinateUnit[0] + offsetToAdd, x0CoordinateUnit[1]]
            var dict = {
                point: x0CoordinateUnit,
                value: x[1],
                textAnchor: textAnchor,
                textBaseline: textBaseline,
                textPosition: textPosition
            };
            return dict;
        })
        var svgPoints = plot
            .append("g")
            .classed("fieldtest-points", true)
            .selectAll(".fieldtest-point")
            .data(pointData)
            .enter()
        if (properties.showPoints) {
            svgPoints
                .append("circle")
                .attr("cx", d => d.point[0])
                .attr("cy", d => d.point[1])
                .attr("r", pointSize)
                .style("stroke", properties.pointColor)
                .style("stroke-width", this.storage.LineThickness)
                .style("fill", properties.pointColor)
                .classed("fieldtest-point", true)
        }
        if (properties.showPointsValues) {
            svgPoints.append("text")
                .classed("fsz", true)
                .text(d => d.value[0])
                .attr("font-size", this.storage.TEXTSIZE + "px")
                .attr("x", d => d.textPosition[0])
                .attr("y", d => d.textPosition[1])
                .style("text-anchor", d => d.textAnchor)
                .style("dominant-baseline", d => d.textBaseline)
                .style("fill", d => properties.pointValueColor ?? "Black")
        }
    }

    // this.storage.axisHorG.select(".titleTop").attr("x", this.storage.PIXW / 2 * 1.0).attr("y", -this.storage.YOFFPIX / 2)
    // this.storage.axisHorG.call(d3.axisTop(this.storage.scaleHor).ticks(8).tickFormat(v => v / 1.00).tickSize(-this.storage.PIXH * this.storage.ShowGridlines + 3))


    // plot this.storage.title
    // let plotTitle = plot
    //     .append('text')
    //     .attr("x", plot_width_pixels / 2)
    //     .attr("y", -2 * this.storage.AY)
    //     .classed("plotTitle", true)
    //     .text(test_title)
    //     .attr("fill", "black")
    //     .style("text-anchor", "middle")

    // axis titles =================================

    if (properties.showXAxisTitle == null || properties.showXAxisTitle) {
        let horAxisHeight = this.getD3ElemPixelsHeight(horAxis);

        // let titleHor = plot
        //     .append("foreignObject")
        //     .attr("width", plot_width_pixels)
        //     .attr("height", "60px")
        //     // .attr("x", plot_width_pixels / 2)
        //     .attr("y", - 1.5 * horAxisHeight)
        //     .classed("titleTop", true)
        //     .classed("fsz", true)
        //     .append("xhtml:div")
        //     .text(test_title)
        //     .style("font-size", this.storage.TEXTSIZE + "px")
        //     .style("top", )
        let titleHor = plot
            .append('text')
            .attr("x", plot_width_pixels / 2)
            // .attr("y", - 1.5 * horAxisHeight)
            .classed("titleTop", true)
            .classed("fsz", true)
            .text(test_title)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .attr("font-size", this.storage.TEXTSIZE + "px")

        this.wrapSvgText(titleHor.node(), plot_width_pixels);
        var titleHeight = this.getD3ElemPixelsHeight(titleHor);
        titleHor.attr("y", - 1.2 * horAxisHeight - titleHeight);
    }

    if (properties.showYAxisTitle == null || properties.showYAxisTitle) {
        let vertAxisWidth = this.getD3ElemPixelsWidth(vertAxis)
        let titleVertXTranslation = - vertAxisWidth;
        if (test_position == "left") {
            // 2 is an arbitrary number for good positioning
            titleVertXTranslation = plot_width_pixels + vertAxisWidth * 1.5
        }
        let titleVert = plot
            .append('text')
            .attr("transform", `translate(${titleVertXTranslation} ${plot_height_pixels / 2}) rotate(270) `)
            .classed("titleLeft", true)
            .classed("fsz", true)
            .text("Depth (" + this.storage.Unit + ")")
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .attr("font-size", this.storage.TEXTSIZE + "px")
            .attr("dominant-baseline", test_position == "left" ? "hanging" : "auto")
    }

    // borders =================================
    plot
        .append("rect")
        .attr("width", plot_width_pixels)
        .attr("height", plot_height_pixels)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", this.storage.LineThickness);

    // change opacity of everything
    // this.storage.d3_root.selectAll(this.storage.rootElem.querySelectorAll("g.fieldtests *:not(circle):not(g)"))
    // plot.selectAll("g circle")
    //     .style("fill-opacity", 1)
    //     .style("stroke-opacity", 1)

    // resizing handle =================================
    let addResizingHandle = () => {
        let resizingHandle = plot
            .append("path")
            .attr("d", d3.line()([[0, 0], [0, plot_height_pixels]]))
            .style("stroke-width", this.storage.LineThickness)
            .style("stroke", "black")
            // .style("fill-opacity", 0)
            // .style("stroke-opacity", 0)
            .classed("fieldtest-resize-handle", true)

        return resizingHandle;
    }
    let handleTransformRight = `translate (${plot_width_pixels}, 0)`;
    let handleTransformLeft = `translate (${0}, 0)`;
    let resizingHandleRight = addResizingHandle()
        .attr("transform", handleTransformRight)
        .classed("fieldtest-resize-handle-right", true)
    let resizingHandleLeft = addResizingHandle()
        .attr("transform", handleTransformLeft)
        .classed("fieldtest-resize-handle-left", true)

    var clickAreaWidth = 0.5;
    let addResizingClickArea = () => {
        let resizingClickArea = plot
            .append("rect")
            // invisible
            .classed("fieldtest-resize-click-area", true)
            .attr("width", clickAreaWidth * this.storage.AX)
            .attr("height", plot_height_pixels)
            .attr("cursor", "ew-resize")
        return resizingClickArea;
    }
    let resizingClickAreaRight = addResizingClickArea()
        .attr("transform", handleTransformRight)
        // centralize on the handle bar
        .attr("x", - (clickAreaWidth / 2) * this.storage.AX)
        .classed("fieldtest-resize-click-area-right", true)
    let resizingClickAreaLeft = addResizingClickArea()
        .attr("transform", handleTransformLeft)
        // centralize on the handle bar
        .attr("x", - (clickAreaWidth / 2) * this.storage.AX)
        .classed("fieldtest-resize-click-area-left", true)


    // text indicating borehole name =================================

    plot.append("text")
        .text(borehole.name)
        .attr('font-size', this.storage.TEXTSIZE + 'px')
        .attr('font-weight', "bold")
        .attr("transform", `translate(${plot_width_pixels - 3} ${plot_height_pixels - 3}) rotate(270)`)



    // move to correct position =================================

    let xx = 0;
    let yz = borehole.general.z;
    if (test_position == "left") {
        xx = parseInt(borehole.general.x) - plot_width - FIELDTESTOFFSET;
    }
    else {
        let borehole_width = this.getBoreholeWidth(borehole) / this.storage.AX;
        xx = parseInt(borehole.general.x) + borehole_width + FIELDTESTOFFSET;
    }

    if (properties.anchor == '(none)' && this.storage.fieldTestPositions[timestamp]) {
        xx = this.storage.fieldTestPositions[timestamp].test_xx;
        yz = this.storage.fieldTestPositions[timestamp].test_yz;
    }

    let x = xx * this.storage.AX;
    if (borehole.general.test_x) {
        x = borehole.general.test_x;
    }
    let y = -yz * this.storage.AY;

    x = x * coordinateUnitFactor;
    y = y * coordinateUnitFactor
    
    plot
        .attr("transform", `translate (${x} ${y})`)

    // tooltip
    plot.on("click", event => this.fieldTestMouseClick(event))

    // dragging =================================

    // data for dragging and resizing
    this.storage.fieldTestPositions[timestamp] = {
        test_xx: xx,
        test_yz: yz,
        test_title: test_title,
        test_width: plot_width,
        test_height: plot_height,
        test_position: test_position
    }
    
    const crossSectionObj = this;
    if (properties.anchor == '(none)') {
        plot
        .call(d3.drag()
        .filter(event => {
            return ! crossSectionObj.isInDrawMode();
        })
        .on("drag", () => {
            this.dragFieldTest(timestamp)
        })
        .on("start", () => {
            this.storage.fieldTestIsDragging = true
            this.storage.fieldTestWasMoved = false;
        })
        .on("end", () => {
            this.storage.fieldTestIsDragging = false;
            if (this.storage.fieldTestWasMoved) {
                this.drawAllFieldTests();
                this.storage.fieldTestWasMoved = false;
            }
        })
        )
    }
        
    // add ability to resize

    // resizingHandle
    let addResizingBehaviorToClickArea = (resizingClickArea, isLeftBar) => {
        resizingClickArea
            .call(d3.drag()
                .filter(event => {
                    return ! crossSectionObj.isInDrawMode();
                })
                .on("drag", () => { this.resizeFieldTest(timestamp, isLeftBar) })
                .on("start", () => {
                    this.storage.fieldTestIsResizing = true;
                    this.storage.oldFieldTestWidth = plot_width;
                })
                .on("end", () => {
                    this.storage.fieldTestIsResizing = false;
                    this.drawAllFieldTests();
                }))
    }
    addResizingBehaviorToClickArea(resizingClickAreaRight, false);
    addResizingBehaviorToClickArea(resizingClickAreaLeft, true);


    // change opacity of everything
    plot.selectAll("*")
        .style("fill-opacity", properties.plotOpacity)
        .style("stroke-opacity", properties.plotOpacity)
    plot.selectAll('text')
        .style('font-family', properties.fontFamily ?? 'Arial')
        .style('font-size', properties.fontSize ?? this.storage.TEXTSIZE + 'px')
    plot.selectAll(".fieldtest-resize-click-area")
        .style("fill-opacity", 0)
        .style("stroke-opacity", 0)

    this.initializeDoubleClick([plot.node()]);
}

CrossSectionCanvas.prototype.getElemPixelsWidth = function (htmlElem) {
    /* Returns the width in pixels of an html element */
    let width = htmlElem.getBoundingClientRect().width / this.storage.ZOOMSCALE;
    return width;
}

CrossSectionCanvas.prototype.getD3ElemPixelsWidth = function (d3Elem) {
    /* Returns the width in pixels of a D3 element */
    if (!d3Elem || !d3Elem.nodes() || !d3Elem.nodes()[0]) {
        return 0;
    }
    let htmlElem = d3Elem.nodes()[0];
    return this.getElemPixelsWidth(htmlElem);
}

CrossSectionCanvas.prototype.getElemPixelsHeight = function (htmlElem) {
    /* Returns the height in pixels of an html element */
    let height = htmlElem.getBoundingClientRect().height / this.storage.ZOOMSCALE;
    return height;
}

CrossSectionCanvas.prototype.getD3ElemPixelsHeight = function (d3Elem) {
    /* Returns the height in pixels of a D3 element */
    if (!d3Elem || !d3Elem.nodes() || !d3Elem.nodes()[0]) {
        return 0;
    }
    let htmlElem = d3Elem.nodes()[0];
    return this.getElemPixelsHeight(htmlElem);
}


CrossSectionCanvas.prototype.resizeFieldTest = function (timestamp, isLeftBar = false) {
    /* Receives the timestamp of a fieldtest and drags the handle bar of the fieldtest to the current mouse position. This handle bar will determine the new fieldtest width once the user let go of the click */
    if (!this.storage.fieldTestPositions[timestamp]) {
        return;
    }
    // console.log("resizing", timestamp)
    // let fieldTestBeingResized = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp);
    let resizingHandle = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp).select(".fieldtest-resize-handle-right");
    if (isLeftBar) {
        resizingHandle = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.timestamp == timestamp).select(".fieldtest-resize-handle-left");
    }
    let options = this.storage.fieldTestPositions[timestamp];
    let test_title = options.test_title;
    let test_position = options.test_position;
    // All with the same this.storage.title will be resized
    let fieldTests = this.storage.d3_root.selectAll(".fieldtest-plot").filter(d => d.test_title == test_title);
    if (d3.event && d3.event.sourceEvent && this.storage.fieldTestIsResizing && fieldTests) {

        const coordinateUnitFactor = this.getCoordinateUnitFactor();
        let oldWidth = this.storage.fieldTestWidths[test_title];
        let dx = (d3.event.dx / this.storage.AX) ?? 0
        const dxCoordinateUnitFactor = dx / coordinateUnitFactor
        let newWidth = oldWidth + dxCoordinateUnitFactor;
        if (isLeftBar) {
            newWidth = oldWidth - dxCoordinateUnitFactor;
        }
        if (newWidth < this.storage.minimumFieldTestWidth) {
            newWidth = 1;
        }
        let newWidthPixels = newWidth * this.storage.AX;

        this.storage.fieldTestWidths[test_title] = newWidth;
        if (isLeftBar) {
            options.test_xx = options.test_xx + dx;
            options.test_yz = options.test_yz;
        }

        // let newHandleXX = this.storage.fieldTestPositions[timestamp].test_xx + newWidth;
        // let newHandleX = newHandleXX * this.storage.AX;
        // same as before
        // let newHandleY = 0;
        let handleTranslation = `translate(${newWidth * this.storage.AX * coordinateUnitFactor} ${0})`
        // I undid the left handle
        if (isLeftBar) {
            // test_xx was updated above
            handleTranslation = `translate(${(this.storage.oldFieldTestWidth * coordinateUnitFactor - newWidth) * this.storage.AX * coordinateUnitFactor} ${0})`
        }
        resizingHandle.attr("transform", handleTranslation);
    }

}

CrossSectionCanvas.prototype.drawBorehole = function (borehole, svg) {


    //yArr.sort((a, b) => a - b);                                  // yArr


    //alert(JSON.stringify( borehole))
    const coordinateUnitFactor = this.getCoordinateUnitFactor();

    let offset = this.getOffset(borehole);
    // let yzCorrection = yz => - (yz + offset);

    let timestamp = borehole.soillayer[0].timestamp;

    let properties = this.cloneObject(this.storage.boreholeDefaultProperties);
    if (this.storage.boreholeProperties[timestamp]) {
        properties = {...properties, ...this.storage.boreholeProperties[timestamp]};
    }
    const test_data = borehole?.general?.test_data;
    if (test_data && test_data.length > 0 && ! properties.fieldTestPlotOption) {
        properties.fieldTestPlotOption = test_data[0].title;
    }
    this.storage.boreholeProperties[timestamp] = properties;

    let boreholeData = {
        timestamp: timestamp
    }

    // remove previous
    this.storage.d3_root.select("g.boreholes").selectAll(".g-borehole").filter(d => d.timestamp == timestamp).remove();
    this.storage.d3_root.selectAll(".g-borehole").filter(d => d.timestamp == timestamp).remove();

    let boreholeSvg = this.storage.d3_root.select("g.boreholes").selectAll(".g-boreholes").filter(d => d.timestamp == timestamp).data([boreholeData]).enter()
        .append("g")
        .classed("g-borehole", true)
        .attr("elemType", "borehole")
    boreholeSvg.data(boreholeData);
    boreholeSvg.on("click", d => this.boreholeMouseClick(timestamp));

    let boreholeRects = boreholeSvg.append("g").classed("boreholeRects", true);
    let labels = boreholeSvg.append("g").classed("boreholeLabels", true);
    let depthLabels = boreholeSvg.append("g").classed("boreholePoints", true);

    // Draw all borehole-rectangles
    const soillayer = borehole.soillayer.filter(x => x.to > x.from);
    var allRects = boreholeRects.selectAll('path.borehole').data(soillayer, b => b.timestamp)
    var newRects = allRects.enter()


    newRects.append('path')
        .classed('borehole', 1)
        .classed("sw", 1)

        .merge(allRects)

        .attr("d", soillayer => {
            return this.dpolygon([
                { xx: soillayer.p1LT.xx, yz: soillayer.p1LT.yz, correct_yz: soillayer.p1LT.correct_yz, left: soillayer.p1LT.left ?? false },
                { xx: soillayer.p3LB.xx, yz: soillayer.p3LB.yz, correct_yz: soillayer.p3LB.correct_yz, left: soillayer.p3LB.left ?? false },
                { xx: soillayer.p4RB.xx, yz: soillayer.p4RB.yz, correct_yz: soillayer.p4RB.correct_yz, left: soillayer.p4RB.left ?? false },
                { xx: soillayer.p2RT.xx, yz: soillayer.p2RT.yz, correct_yz: soillayer.p2RT.correct_yz, left: soillayer.p2RT.left ?? false }
            ])
        })

        .style('stroke-width', this.storage.LineThickness + 'px')
        .style('stroke', 'black')
        //.attr('fill', "url(#patternGWGC)")
        .attr('fill', d => {
            // console.log("soillayer", d)
            // in the first time there's no d.f property since fill is not already set
            let value = this.getColoredFill(this.srcToFill(this.storage.soilSymbols.get(d.layerSymbol))) || this.getDefaultImgUrl(d)
            if (d.f) {
                value = this.getColoredFill(d.f) || this.getDefaultImgUrl(d);
            }
            value = this.correctHatchFill(value);
            return value;
        })
    // .attr('fill', d => this.getColoredSrc(d.f)|| this.getDefaultImgUrl(d))
    //.attr('fill', "url(#grad1)")
    // .on("click", polyMouseClick)


    // console.log("draw bh stage 1")


    const textMouseClick = this.textMouseClickGenerator();

    if (properties.showSoilDescriptions) {
        // var allLayerInfo = svg.select("g.boreholelabels").selectAll("g").data(borehole.soillayer, b => b.timestamp)


        var allLayerInfo = labels.selectAll("g").data(soillayer, b => b.timestamp)
        var newLayerInfo = allLayerInfo.enter().append("g")
            .classed('textContainer', true)
            .attr('transform', sl => {
                const translateX = (sl.p2RT.xx + sl.p4RB.xx) / 2 * this.storage.AX + 9;
                const translateY = -(sl.p2RT.correct_yz + sl.p4RB.correct_yz) / 2 * this.storage.AY;
                return sl.transform ?? `translate(${translateX} ${translateY})`;
            })        // on load extra if exists
            .call(this.storage.dragHandlerText)
            .append('g')
            // Text: Layer this.storage.title and symbol in the middle of a borehole
            .append("text")
            .classed("layerinfo", 1)
            .classed("fsz", 1)

        // svg.select("g.boreholelabels").selectAll("text.layerinfo").data(borehole.soillayer, b => b.timestamp)
        labels.selectAll("text.layerinfo").data(soillayer, b => b.timestamp)
            .text(d => {
                return d.textExtra || d.layerTitle;
                // var soilSymbol = d.layerSymbol;
                // var translated = this.getLegendName(soilSymbol);
                // return translated;
            })       // on load extra         //  + ' ' + d.layerSymbol
            .style('font-family', properties.fontFamily ?? 'Arial')
            .style('font-size', properties.fontSize ?? this.storage.TEXTSIZE + 'px')
            .classed("opa", pt => pt.textHidden)          // on load extra
            .attr('fill', pt => properties.textColor ?? pt.textColor ?? "black")            // on load extra if exists

            //.each(updTextBackground)

            //.call(this.storage.dragHandlerText)
            .on("click", function (d) {
                textMouseClick(d, d3.select(this));
            })

        console.log("draw bh stage 2")

    }

    // this is the this.storage.title/name of the borehole
    // var bhtitles = svg.select("g.boreholelabels").selectAll('text.bhtitle').data([borehole], borehole => borehole.general.x)
    var bhtitlesContainers = boreholeSvg.selectAll('.bhtitlecontainer').data([borehole], borehole => borehole.general.x)
    bhtitlesContainers.enter().append('g')
    .classed('bhtitleContainer', true)
    .classed('textContainer', true)
    .attr('transform', d => d.transform ?? `translate(${borehole.general.x * this.storage.AX * coordinateUnitFactor} ${-borehole.general.z * this.storage.AY * coordinateUnitFactor - 18})`)
    .call(this.storage.dragHandlerText)
    .on("click", this.textMouseClickGenerator())
    .append('g')
    .attr('transform', `rotate(${properties.titleAngle ?? 0})`)
    .append("text")
        .merge(bhtitlesContainers)
        .classed("bhtitle", 1)
        .classed("fsz", 1)
        .text(d => d.textExtra || borehole.name)    // on load extra
        .style('font-family', properties.fontFamily ?? 'Arial')
        .style('font-size', properties.fontSize ?? this.storage.TEXTSIZE + 'px')
        .classed("opa", d => d.textHidden)          // on load extra
        .attr('fill', pt => properties.textColor ?? pt.textColor ?? "black")             // on load extra if exists
        .attr('font-weight', 'bold')
        .style('text-anchor', d => {
            if (properties.titleAngle == "0" || properties.titleAngle == "180") {
                return 'middle';
            }
            if (properties.titleAngle == "90") {
                return 'end';
            }
            return 'start';
        })

    //
    // Draw clickable points and labels
    var handleMouseClickPointBIND = this.handleMouseClickPoint.bind(this)

    if (properties.showDepthLabels) {
        const labelGroups = depthLabels.selectAll("g").data(borehole.ally, b => b.timestamp)
        labelGroups.enter()
        .append('g')
        .classed('textContainer', 1)
        .attr('transform', pt => {
            const translateX = pt.xx * this.storage.AX - 9;
            const translateY = -pt.correct_yz * this.storage.AY;
            return pt.transform ?? `translate(${translateX} ${translateY})`;
        })
        .call(this.storage.dragHandlerText)
        .append('g')
        .append('text')
        .classed("layery", 1)
        .classed("fsz", 1)

        depthLabels.selectAll('text.layery').data(borehole.ally, e => e.timestamp)
            .style("text-anchor", "end")
            .classed("inviz", d => !d.left)              // (d.xx > d.x)
            .text(pt => pt.textExtra || pt.y)             // on load extra
            .style('font-family', properties.fontFamily ?? 'Arial')
            .style('font-size', properties.fontSize ?? this.storage.TEXTSIZE + 'px')
            .classed("opa", pt => pt.textHidden)          // on load extra
            .attr('fill', pt => properties.textColor ?? pt.textColor ?? "black")             // on load extra if exists
            .on("click", this.textMouseClickGenerator())
    }

    depthLabels.selectAll('text.layery.inviz').remove();
    /*
    points.append("circle")
      .classed('point', 1)
      .classed('bhpoint', 1)
      .classed("waitforconnect", pt => pt == this.storage.CONNECTMODE)
      .attr("cx", pt => pt.x * 1.00)
      .attr("cy", pt => pt.yz * 1.00)
      .attr("r", 19)
      .style('stroke-width', this.storage.LineThickness + 'px')
    */

    console.log("draw bh stage 3")
    svg.select("g.points").selectAll("rect.bhpoint").filter(d => {
        // console.log(d.bhname == borehole.name);
        return d.bhname == borehole.name;
    }).remove();
    svg.selectAll("rect.bhpoint").filter(d => {
        return d.bhname == borehole.name;
    }).remove();
    var allPointsRect = svg.select("g.points").selectAll('rect.bhpoint').data(borehole.ally, e => e.timestamp)

    var newPointsRect = allPointsRect.enter()

    newPointsRect.append("rect")
        .classed('point', 1)
        .classed('bhpoint', 1)
        .classed('sw', 1)

        .merge(allPointsRect)

        .classed("waitforconnect", pt => pt == this.storage.CONNECTMODE)
        .attr("x", pt => pt.xx * this.storage.AX + this.cornerExtraOffset())
        .attr("y", pt => -pt.correct_yz * this.storage.AY + this.cornerExtraOffset())
        .attr("width", this.cornerWH())
        .attr("height", this.cornerWH())
        .style('stroke-width', this.storage.LineThickness + 'px')

        .each(d => { d.bhname = borehole.name; })
        // .on("mouseover", handleMouseOverPoint)
        // .on("mouseout", handleMouseOutPoint)
        .on("click", (pt) => handleMouseClickPointBIND(pt, svg))

    if (properties.opaqueLabels) {
        boreholeSvg.node().querySelectorAll('text').forEach(text => {
            this.addTextBackground(text);
        })
    }

    boreholeSvg.selectAll("*")
    .style("fill-opacity", properties.transparency ?? "1")
    .style("stroke-opacity", properties.transparency ?? "1")

    this.initializeDoubleClick([boreholeSvg.node()]);

    if (this.storage.showFieldTestPlots && borehole.general.test_data) {
        this.drawFieldTest(borehole);
    }
}


// ================================================================================================ this.storage.Links
CrossSectionCanvas.prototype.linkMouseClick = function (d) {
    // works only for stable water this.storage.links

    if (this.isInDrawMode()) {
        return;
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();
    this.storage.CURRENTLINK = d;
    this.openLinePropertyGrid(d, d.water ?? false);
}

CrossSectionCanvas.prototype.openLinePropertyGrid = function (d, isWater = true, modifyAll = false) {
    const timestamp = d?.timestamp;
    this.storage.CURRENTLINK = d;
    const getPropertiesDict = () => {
        if (! isWater) {
            return this.storage.lineProperties;
        }
        return this.storage.linkProperties;
    }
    let properties = this.storage.linkProperties[timestamp];
    let group = "Groundwater Level";
    if (! isWater) {
        properties = this.storage.lineProperties[timestamp];
        group = "Line"
    }
    const panelData = this.cloneObject(properties);
    if (! panelData) {
        return;
    }
    delete panelData['isLocked'];

    const getLinksData = () => {
        const links = modifyAll ? this.getAllConnectedWaterLines(d) : [d];
        return links;
    }
    const getLinksElems = () => {
        const linkElems = getLinksData().map(prop => {
            return this.timestampToHtmlElem('.g-link', prop.timestamp);
        })
        return linkElems;
    }

    const showAsSelected = () => {
        this.selectElemFromTimestamp('.g-link', getLinksData().map(x => x.timestamp));
    }
    showAsSelected();

    const optionsMetadata = {
        lineColor: {name : "Color", type : "color"},
        lineStyle: {name : "Line Style", type : "options", options : lineStyleOptions},
        strokeWidth : {name : "Line Thickness (px)", group : "Global Settings", type : "options", options : lineThicknessOptions},
        interrogation : {name : "Show ? on lines", type: "options", options : interrogationOptions},
        isSmoothLine : {name : "Smooth", type:"boolean"},
        transparency : {name: "Opacity", type : "options", options : transparencyOptions},
        waterSymbols : {name : "Water Symbols", type: "options", options : interrogationOptions},
        zOrder : {name : "Z Order", type : "options", options : zOrderOptions},
    }

    Object.values(optionsMetadata).forEach(value => {
        value.group = group;
    })
        
    const optionsTooltips = {
        lineColor : "Color of the line",
        lineStyle : "Style of the line",
        strokeWidth : "The thickness of the line",
        interrogation : "How to show question marks on the lines",
        isSmoothLine : "Whether the line is smooth or not",
        transparency : "Opacity of the polygon",
        waterSymbols : "How to show water symbols on the lines",
        zOrder : "Whether the polygon is shown below or above other elements",
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            const links = getLinksData();
            links.forEach(link => {
                const timestamp = link.timestamp;
                // get the properties dict in case the original changed
                const properties = getPropertiesDict()[timestamp];
                properties[name] = val;
            })

            this.drawLinks(this.storage.svg1);
            // drawLinks will undo the selection
            this.openLinePropertyGrid(d, isWater, modifyAll);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');
    buttonDiv.classList.add('deleteLinkContainer');

    const copyButton = this.generateCopyToAllObjectsButton(
        'Line Segments',
        () => getPropertiesDict()[timestamp],
        getPropertiesDict(),
        [],
        () => this.drawLinks(this.storage.svg1)
    );
    const applyAllButton = this.generatePropertyGridButton();
    const deleteButton = this.generatePropertyGridButton();
    const deleteAllButton = this.generatePropertyGridButton();

    applyAllButton.innerText = "  Apply All  ";
    deleteButton.innerText = "  Delete  ";
    deleteAllButton.innerText = "  Delete All  ";

    buttonDiv.appendChild(copyButton);
    if (! modifyAll) {
        buttonDiv.appendChild(applyAllButton);
        buttonDiv.appendChild(deleteButton);
    }
    buttonDiv.appendChild(deleteAllButton);

    applyAllButton.onclick = () => {
        const propertiesDict = getPropertiesDict();
        const arr = this.getAllConnectedWaterLines(d);
        arr.forEach(d => {
            if (! d?.timestamp) {
                return;
            }
            propertiesDict[d.timestamp] = this.cloneObject(propertiesDict[timestamp]);
        })
        this.drawLinks(this.storage.svg1);
        // drawing links will unselect
        showAsSelected();
    };
    deleteButton.onclick = () => {
        this.linkRemove(d);
        this.cancelSelection();
    };
    deleteAllButton.onclick = () => {
        this.waterlineRemove(d);
        this.removePropertyGridSelected();
    };

    const unlockButton = this.generatePropertyGridButton();
    const propertiesDict = getPropertiesDict();
    unlockButton.innerText = getLinksData().every(d => propertiesDict[d.timestamp]?.isLocked) ? 'Unlock Object' : 'Lock Object';
    unlockButton.onclick = () => {
        getLinksData().forEach(d => {
            const timestamp = d.timestamp;
            const properties = getPropertiesDict()[timestamp];
            if (! properties) {
                return;
            }
            properties.isLocked = ! properties.isLocked;
        })
        this.openLinePropertyGrid(d, isWater, modifyAll);
    }

    buttonDiv.appendChild(unlockButton);

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.lineDetach = function (linkData = this.storage.CURRENTLINK) {
    if (! linkData) {
        return;
    }
    if (linkData.prevLink) {
        const data = this.getLinkData(linkData.prevLink);
        if (data) {
            data.nextLink = null;
        }
    }
    if (linkData.nextLink) {
        const data = this.getLinkData(linkData.nextLink)
        if (data) {
            data.prevLink = null;
        }
    }
    linkData.prevLink = linkData.nextLink = null;
}

CrossSectionCanvas.prototype.linkRemove = function (linkData = this.storage.CURRENTLINK, options={redraw: true}) {
    let lines = linkData.water ? this.storage.LINKS : this.storage.lines;
    if (linkData) {
        var ix = lines.indexOf(linkData);
        if (ix > -1) {
            lines.splice(ix, 1);
            //alert('SPLC')
        }
    }

    this.lineDetach(linkData);

    this.storage.d3_root.select(".linktooltip").classed("inviz", 1)
    if (options.redraw) {
        this.drawLinks(this.storage.svg1)
        this.removeOrphanPoints();
    }
}

CrossSectionCanvas.prototype.getLinkData = function (timestamp) {
    var link = this.storage.d3_root.selectAll(".g-link").filter(d => d.timestamp == timestamp);
    var linkData = link.data()[0];
    return linkData;
}

CrossSectionCanvas.prototype.getAllConnectedWaterLines = function (link = this.storage.CURRENTLINK) {
    if (!link) {
        return [];
    }
    let arr = [];
    let prevLinkTimestamp = link.prevLink;
    let nextLinkTimestamp = link.nextLink;
    while (prevLinkTimestamp != null) {
        var linkData = this.getLinkData(prevLinkTimestamp);
        var prev = linkData.prevLink;
        arr.push(linkData);
        prevLinkTimestamp = prev;
    }
    arr.push(link);
    while (nextLinkTimestamp != null) {
        var linkData = this.getLinkData(nextLinkTimestamp);
        var next = linkData.nextLink;
        arr.push(linkData);
        nextLinkTimestamp = next;
    }
    return arr;
}

CrossSectionCanvas.prototype.waterlineRemove = function (link = this.storage.CURRENTLINK) {
    /* Given a waterlink, removes all the waterlinks who were originally connected as the same waterline */
    if (!link) {
        return;
    }
    const connectedLinks = this.getAllConnectedWaterLines(link);
    connectedLinks.forEach(link => {
        this.linkRemove(link);
    })
}

CrossSectionCanvas.prototype.linkFinishEdit = function () {
    this.storage.d3_root.select(".linktooltip").classed("inviz", 1)
}

CrossSectionCanvas.prototype.getLineProperties = function (d) {
    if (d?.water) {
        return this.storage.linkProperties[d?.timestamp];
    }
    return this.storage.lineProperties[d?.timestamp];
}

CrossSectionCanvas.prototype.getLineDefaultProperties = function (d) {
    if (d?.water) {
        return this.storage.waterlineDefaultProperties;
    }
    return this.storage.lineDefaultProperties;
}

CrossSectionCanvas.prototype.getStrokeDashArray = function ({strokeWidth, lineStyle}) {
    strokeWidth = parseFloat(strokeWidth ?? 1)
    if (! lineStyle || lineStyle == 'Dash') {
        const dashSize = strokeWidth * 2;
        return `calc(${dashSize}px * var(--lineStyleScale))`;
    }
    if (lineStyle == "Dot") {
        const dashSize = strokeWidth;
        return `${dashSize}px`;
    }
    return null;
}

CrossSectionCanvas.prototype.pointToCoord = function (point) {
    if (! point) {
        return null;
    }
    return [(point.xx ?? point.x) * this.storage.AX, - (point.correct_yz ?? point.yz) * this.storage.AY];
}

CrossSectionCanvas.prototype.drawLinks = function (svg) {
    /* Draws the this.storage.links from the global variable this.storage.LINKS */

    const crossSectionObj = this;
    svg.select("g.links").selectAll("g").remove();
    svg.selectAll(".g-link").remove();


    var linksData = this.storage.LINKS.concat(this.storage.lines).concat(this.storage.waterLinksBeingDrawn).concat(this.storage.linksBeingDrawn).concat(this.storage.linesBeingDrawn);
    if (! linksData || linksData.length == 0) {
        return;
    }

    const getStroke = d => {
        const timestamp = d?.timestamp;
        const properties = this.getLineProperties(d);
        const defaultProperties = this.getLineDefaultProperties(d);
        return properties?.lineColor ?? defaultProperties.lineColor ?? '#0000ff';
    }
    const getStrokeWidth = d => {
        const timestamp = d?.timestamp;
        const properties = this.getLineProperties(d);
        return ( properties?.strokeWidth ?? this.storage.LineThickness ?? 1 ) + "px";
    }
    const getStrokeDashArray = d => {
        const timestamp = d?.timestamp;
        const properties = this.getLineProperties(d);
        if (! properties) {
            return null;
        }
        return this.getStrokeDashArray(properties);
    }
    const getStrokeOpacity = d => {
        const timestamp = d?.timestamp;
        const properties = this.getLineProperties(d);
        return properties?.transparency ?? "1";
    }

    const linksDict = Object.fromEntries(linksData.map(x => [x.timestamp, x]));


    // forest to determine the first link of each chain
    const firstAncestorOfLink = {};
    const firstAncestorSet = {};
    // the efficiency comes from the links being in the order they were drawn
    // otherwise would need a more complicated algorithm
    linksData.forEach(link => {
        let current = link
        while (current != null) {
            const prevLinkData = linksDict[current.prevLink];
            // already know current ancestor of previous link
            if (current.timestamp != null && current.timestamp in firstAncestorOfLink) {
                firstAncestorOfLink[link.timestamp] = firstAncestorOfLink[current.timestamp];
                break;
            }
            // arrived at current ancestor
            if (current.prevLink == null) {
                firstAncestorOfLink[link.timestamp] = current.timestamp;
                firstAncestorSet[current.timestamp] = current;
                break;
            }
            current = prevLinkData;
        }
    })
    const firstAncestors = Object.values(firstAncestorSet) ?? [];
    const chainEntries = firstAncestors.map(firstAncestor => {
        if (! firstAncestor) {
            return [];
        }
        const chain = [];
        let current = firstAncestor;
        while (current) {
            chain.push(current)
            current = linksDict[current.nextLink];
        }
        return [firstAncestor.timestamp, chain];
    })
    const timestampToCurve = {};
    chainEntries.forEach(entry => {
        const [firstAncestorTimestamp, chain] = entry;
        if (! chain || chain.length <= 0) {
            return;
        }
        const points = [this.pointToCoord(chain[0].point1)];
        chain.forEach(link => {
            points.push(this.pointToCoord(link.point2));
        });
        const curveStr = d3.line().curve(d3.curveCardinal)(points);
        const curveParts = curveStr.split('C');
        curveParts.slice(1).forEach((curvePart, index) => {
            const timestamp = chain[index].timestamp;
            timestampToCurve[timestamp] = `M${this.dpoint(chain[index].point1)} C ${curvePart}`;
        })
    })

    svg.select("g.links").selectAll("g").data(linksData).enter()
        .append("g")
        .classed("g-link", true)
        .attr("elemType", "waterLink")
        .style("opacity", getStrokeOpacity)
        .append("path")
        // .each(d => console.log('NEW LINK!'))
        .classed("link", true)
        .classed("sw", true)
        .attr("d", d => {
            const timestamp = d?.timestamp;
            const properties = this.getLineProperties(d);
            if (properties?.isSmoothLine && timestampToCurve[d.timestamp]) {
                return timestampToCurve[d.timestamp];
            }
            else {
                return `M${this.dpoint(d.point1)} L ${this.dpoint(d.point2)}`;
            }
        })
        .style("stroke", getStroke)
        .style("stroke-width", getStrokeWidth)
        .style('stroke-dasharray', getStrokeDashArray)
        .style("fill", "none")

    var waterLinks = svg.selectAll(".g-link")
        .classed("waterLink", true);

    waterLinks.nodes().forEach(htmlElem => {
        var pathElems = htmlElem.querySelectorAll("path");
        let data = d3.select(htmlElem).data()
        if (!data || data.length <= 0) {
            return;
        }
        data = data[0];

        pathElems.forEach(pathElem => {
            // area that triggers the path context menu
            var d = d3.select(pathElem).attr("d");
            const d3Elem = d3.select(htmlElem);
            var clickArea = d3Elem.append("path")
                .attr("d", d)
                .classed("clickArea", true)
                .style("stroke-width", this.storage.LineThickness * 10)
                .style("stroke", "transparent")
                .style("fill", "none")
                .on("click", () => {
                    this.linkMouseClick(d3.select(pathElem).data()[0])
            })
            if (data.water) {
                d3Elem.call(crossSectionObj.storage.dragHandlerWaterLine);
            }
            else {
                d3Elem.call(crossSectionObj.storage.dragHandlerLine);
            }
        })
    });
    
    this.initializeDoubleClick(waterLinks.nodes());
    this.drawWaterlineInterrogationPoints(this.storage.svg1);
    this.drawWaterlineWaterSymbols(this.storage.svg1);
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.g-link')))
}

CrossSectionCanvas.prototype.dpoint = function (point) {
    let x = point.xx ?? point.x
    return `${x * this.storage.AX} ${- point.correct_yz * this.storage.AY}`
}

CrossSectionCanvas.prototype.dpolygon = function (arr) {
    //console.log(arr)
    // console.log("dpolygon what", arr);
    return "M " + arr.map(point => this.dpoint(point)).join(' L ') + " Z"
}

// ============================================================================================ Draw this.storage.polygons

function getImageData(dataURL) {
    const image = document.createElement('img');
    image.src = dataURL;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext('2d');
    const width = image.width;
    const height = image.height;
    canvas.width = width;
    canvas.height = height;

    // draw the image on the temporary canvas
    ctx.drawImage(image, 0, 0, width, height);

    // pull the entire image into an array of pixel data
    var imageData = ctx.getImageData(0, 0, width, height);
    return { imageData : imageData, canvas : canvas, ctx : ctx };
}

function replaceColorInImage(dataURL, oldRed, oldGreen, oldBlue, newRed, newGreen, newBlue) {
    const {imageData, canvas, ctx} = getImageData(dataURL);

    // examine every pixel, 
    // change any old rgb to the new-rgb
    for (var i=0;i<imageData.data.length;i+=4)
      {
          // is this pixel the old rgb?
          if(imageData.data[i]==oldRed &&
             imageData.data[i+1]==oldGreen &&
             imageData.data[i+2]==oldBlue
          ){
              // change to your new rgb
              imageData.data[i]=newRed;
              imageData.data[i+1]=newGreen;
              imageData.data[i+2]=newBlue;
          }
      }
    // put the altered data back on the canvas  
    ctx.putImageData(imageData,0,0);

    const newDataURL = canvas.toDataURL('image/png');
    return newDataURL;
}

function fixColorValue (colorValue) {
    let newValue = Math.round(colorValue);
    if (newValue > 255) {
        newValue = 255;
    }
    if (newValue < 0) {
        newValue = 0;
    }
    return newValue;
}

function colorToGrayScale(red, green, blue) {
    const gray = Math.round((red + green + blue) / 3);
    return fixColorValue(gray);
}

function getColoredHatchDataURL(dataURL, newRed, newGreen, newBlue) {
    const {imageData, canvas, ctx} = getImageData(dataURL);
    // examine every pixel, 
    // change any old rgb to the new-rgb
    const colorIntensity = colorToGrayScale(newRed, newGreen, newBlue);
    const calculateRatio = (originalColorValue, newColorValue) => {
        return fixColorValue(newColorValue + originalColorValue * (255 - newColorValue) / 255)
    }
    for (var i=0;i<imageData.data.length;i+=4) {
        let whiteIntensity = colorToGrayScale(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
        const blackIntensity = 255 - whiteIntensity
        imageData.data[i] = calculateRatio(imageData.data[i], newRed);
        imageData.data[i+1] = calculateRatio(imageData.data[i+1], newGreen);
        imageData.data[i+2] = calculateRatio(imageData.data[i+2], newBlue);
    }
    // put the altered data back on the canvas  
    ctx.putImageData(imageData,0,0);
    const newDataURL = canvas.toDataURL('image/png');

    return newDataURL;
}


function testGetcoloredHatchDataURL() {
    const dataURLBlack = hatchFilesArr[0].imageBase64
    const dataURLRed = hatchFilesArr[7].imageBase64
    const colors = [
        [255, 1, 1],
        [1, 255, 1],
        [1, 1, 255],
        [0, 220, 200]
    ]
    colors.forEach(color => {
        const img = document.createElement('img');
        img.src = getColoredHatchDataURL(dataURLBlack, color[0], color[1], color[2]);
        document.body.appendChild(img);
    })
    const img2 = document.createElement('img');
    img2.src = dataURLRed;
    document.body.appendChild(img2);
}

CrossSectionCanvas.prototype.createColoredHatch = function (src, color) {
    if (! src || ! color) {
        return;
    }
    const oldColor = this.pathToColor(src) ?? '';
    const blackSrc = src.replace(oldColor, '000000');
    const oldDict = hatchFilesDict[blackSrc];
    if (! oldDict) {
        return;
    }
    const {w, h, imageBase64} = oldDict;
    const newColorHex = tinycolor(color).toHex();
    const {r, g, b} = tinycolor(color).toRgb();
    const newSrc = src.replace(oldColor, newColorHex);
    if (newSrc in hatchFilesDict) {
        return newSrc;
    }
    const newDataURL = getColoredHatchDataURL(imageBase64, r, g, b);
    const newDict = {
        src: newSrc,
        h: h,
        w: w,
        imageBase64: newDataURL
    };
    this.insertHatchPattern(newDict);
    hatchFilesDict[newSrc] = newDict;

    return newSrc;
}

CrossSectionCanvas.prototype.getColoredHatch = function (soilSymbol, color) {

}

CrossSectionCanvas.prototype.polyMouseClick = function (d) {
    
    if (this.isInDrawMode()) {
        return;
    }
    d3.event.preventDefault();    // hide main menu

    this.openPolygonPropertyGrid(d);
}

// blue becomes Blue
function capitalizeString(str) {
    if (! str) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

CrossSectionCanvas.prototype.setPolygonHatchPattern = function (timestamp, soilSymbol) {
    const properties = this.storage.polygonProperties[timestamp];
    properties['hatch'] = soilSymbol;
    const src = this.soilSymbolToCurrentSrc(soilSymbol);
    let coloredSrc = this.getColoredSrc(src);

    const polygonData = this.storage.POLYGONS.find(poly => poly.timestamp == timestamp);
    polygonData.f = `url(#${coloredSrc})`
    polygonData.fsrc = coloredSrc;

    this.drawPolygons(this.storage.svg1);

    this.storage.svg1.selectAll("path.borehole").data([polygonData], r => r.timestamp)
        .attr('fill', d => this.getColoredFill(d.f) || this.getDefaultImgUrl(d))

    this.storage.selectingColorOfSymbol = this.pathToName(src);
}

CrossSectionCanvas.prototype.showOnlyHatchCategory = function (category) {
    const divs = Array.from(this.storage.rootElem.querySelectorAll('.selectHatchTooltip .coloroptions > div'));
    if (! divs || divs.length == 0) {
        return;
    }
    const categoryDiv = divs.find(div => div.classList.contains('category' + category));
    if (! categoryDiv) {
        return;
    }
    divs.forEach(div => {
        this.toggleInvisible(div, false);
    })
    this.toggleInvisible(categoryDiv, true);
}

CrossSectionCanvas.prototype.toggleLockPolygon = function (timestamp, bool) {
    const properties = this.storage.POLYGONS[timestamp];
    if (! properties) {
        return;
    }
    const oldValue = !! properties.locked;
    properties.locked = bool;
}

CrossSectionCanvas.prototype.openPolygonPropertyGrid = function (d) {
    const timestamp = d?.timestamp;
    this.storage.CURRENTLINK = d;
    const properties = this.storage.polygonProperties[timestamp];
    const panelData = this.cloneObject(properties);
    if (! panelData) {
        return;
    }

    delete panelData['isLocked'];

    const elem = this.selectElemFromTimestamp('.polygon', timestamp);

    const src = this.storage.d3_root.selectAll(".polygon").filter(p => p.timestamp == d.timestamp).data()[0].fsrc;
    this.storage.selectingColorOfSymbol = this.pathToName(src);
    const path = this.storage.soilSymbols.get(properties.hatch);
    const coloredPath = this.getColoredSrc(path);
    if (panelData.fillStyle == "Pattern") {
        const path = this.storage.soilSymbols.get(panelData.hatch);
        const coloredPath = this.getColoredSrc(path);
    }
    else {
        delete panelData['hatch'];
        delete panelData['patternStyle'];
    }
    if (panelData.fillStyle == "Void") {
        delete panelData['patternColor'];
    }

    if (panelData.patternStyle) {
        let patternStyle = panelData.patternStyle;
        if (patternStyle == 'Soil') {
            patternStyle = 'USCS';
        }
        this.showOnlyHatchCategory(patternStyle);
    }

    if (panelData.hatch) {
        this.showHatchAsSelectedInTooltip(panelData.hatch);
    }

    // show properly on property grid
    // panelData.patternColor = panelData.patternColor.toLowerCase();

    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    const setPatternColor = (val) => {
        // val = capitalizeString(val);
        properties['patternColor'] = val;
        if (properties.fillStyle == "Void") {
            return;
        }
        if (properties.fillStyle == "Solid") {
            this.redrawHatched();
            return;
        }
        const color = capitalizeString(new tinycolor(val).toHex());
        this.setHatchColor(properties.hatch, color);
        
        const hatchDiv = panelElem.querySelector('.hatchPreview');
        if (hatchDiv) {
            const soilSymbol = this.storage.polygonProperties[timestamp].hatch;
            const src = this.soilSymbolToCurrentSrc(soilSymbol);
            const coloredSrc = this.getColoredSrc(src);
            hatchDiv.style.backgroundImage = `url(${coloredSrc})`;
        }
    }

    const crossSectionObj = this;

    const hatchOptions = Array.from(this.storage.hatchColors?.keys()) ?? [];
    const palette = [];
    (this.storage.availableColors ?? []).forEach((color, index) => {
        const colorsPerGroup = 2;
        if (index % colorsPerGroup == 0) {
            palette.push([]);
        }
        palette[Math.floor(index / colorsPerGroup)].push(color);
    });
    const colorOptions = {
        showPalette: true,
        palette: palette,
        preferredFormat : 'name',
        hideAfterPaletteSelect:true,
        move : function(color) {
            // set color on click and close color picker
            const jq = $(this);
            jq.trigger('change', color);
            // jq.spectrum('hide');
            setPatternColor(color.toHex());
            crossSectionObj.openPolygonPropertyGrid(d);
        }
    }

    const optionsMetadata = {
        fillStyle : {name : "Fill Style", type : "options", options : ["Void", "Solid", "Pattern"]},
        patternColor : {name : "Fill Color", type : "color", options : colorOptions},
        patternStyle : {name : "Pattern Category", type : "options", options : [{text : "USCS", value : "USCS"}, {text : "BS 5930 / AS 1726", value : "BSAS"}, {text : "Rock", value : "Rock"}, {text : "Misc", value : "Misc"}]},
        hatch : {name : "Pattern Type", type : "pattern"},
        lineStyle: {name : "Line Style", type : "options", options : lineStyleOptions},
        transparency : {name: "Opacity", type : "options", options : transparencyOptions},
        patternAndColor : {name : "Pattern Type", type : "patternAndColor"},
        interrogation : {name : "Show ? on lines", type: "options", options : interrogationOptions},
        isSmooth : {name : "Smooth", type:"boolean"},
        zOrder : {name : "Z Order", type : "options", options : zOrderOptions},
    }

    const group = "Polygon";
    Object.values(optionsMetadata).forEach(value => {
        value.group = group;
    })
        
    const optionsTooltips = {
        fillStyle : "Color of the inside of the polygon",
        hatch : "Hatch pattern of the polygon",
        lineStyle : "Style of the polygon perimeter line",
        patternStyle : "Category of the hatch pattern",
        patternColor : "Color of the polygon hatch",
        patternAndColor : "Hatch pattern of the polygon and its color",
        interrogation : "How to show question marks on polygon lines",
        transparency : "Opacity of the polygon",
        zOrder : "Whether the polygon is shown below or above other elements",
        isSmooth : "Whether the polygon is smooth or not",
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            // get the properties dict in case the original changed
            const properties = this.storage.polygonProperties[timestamp];
            if (name == 'patternColor') {
                // don't need to call setPatternColor because this was already passed to the color picker options
                // setPatternColor(val);
                return;
            }
            if (name == 'hatch') {
                this.setPolygonHatchPattern(timestamp, val)
                return;
            }
            if (name == 'patternStyle') {
                this.showOnlyHatchCategory(val);
            }
            if (name == 'lineStyle' && val != 'Solid') {
                // automatically changes zOrder so the linestyle is properly displayed
                properties.zOrder = 'Front';
            }

            properties[name] = val;
            this.redrawHatched();
            this.openPolygonPropertyGrid(d);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);
    this.initializePattern(panelElem.querySelector('.hatch .pgCell:last-child'), panelData.hatch);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');
    buttonDiv.classList.add('deletePolygonContainer');

    const deleteButton = this.generatePropertyGridButton();
    deleteButton.innerText = "  Delete  "
    deleteButton.onclick = () => {
        this.deletePoly();
        this.cancelSelection();
    }

    const copyButton = this.generateCopyToAllObjectsButton(
        'Polygons',
        () => this.storage.polygonProperties[timestamp],
        this.storage.polygonProperties,
        [],
        () => {
            this.storage.POLYGONS.forEach(poly => {
                poly.fsrc = d.fsrc + '';
                poly.f = d.f + '';
            })
            this.drawPolygons(this.storage.svg1);
        }
    );

    const unlockButton = this.generatePropertyGridButton();
    unlockButton.innerText = properties.isLocked ? 'Unlock Object' : 'Lock Object';
    unlockButton.onclick = () => {
        const properties = this.storage.polygonProperties[timestamp];
        properties.isLocked = ! properties.isLocked;
        this.openPolygonPropertyGrid(d);
    }

    buttonDiv.appendChild(unlockButton);
    buttonDiv.appendChild(copyButton);
    buttonDiv.appendChild(deleteButton);

    panelElem.appendChild(buttonDiv);
}

CrossSectionCanvas.prototype.polyShowInfo = function () {
    var print = "CURRENTLINK " + JSON.stringify(this.storage.CURRENTLINK, null, 4)
    alert(print)
}

CrossSectionCanvas.prototype.polyRemove = function (timestamp, options = {redraw : true}) {
    var index = this.storage.POLYGONS.findIndex(d => d.timestamp == timestamp);
    if (index < 0) {
        return;
    }
    this.storage.POLYGONS.splice(index, 1);
    if (options.redraw) {
        this.storage.d3_root.select(".polytooltip").classed("inviz", 1);
        this.drawPolygons(this.storage.svg1);
        this.removeOrphanPoints();
    }
}

CrossSectionCanvas.prototype.deletePoly = function () {
    if (! this.storage.CURRENTLINK?.poly) {          // bh rects cannot be removed
        return;
    }
    this.polyRemove(this.storage.CURRENTLINK.timestamp);
}

CrossSectionCanvas.prototype.removeHatch = function () {
    this.storage.CURRENTLINK.f = this.storage.defaultPolygonFill;
    this.storage.CURRENTLINK.fsrc = '';
    this.storage.d3_root.select(".polytooltip").classed("inviz", 1)
    this.drawPolygons(this.storage.svg1);

    this.storage.svg1.selectAll("path.borehole").data([this.storage.CURRENTLINK], r => r.timestamp)
        .attr('fill', d => d.f)
}

CrossSectionCanvas.prototype.getColoredSrc = function (src) {

    if (!src) {
        return undefined;
    }
    let symbolName = this.pathToName(src);
    // let coloredSrc = this.storage.soilSymbols.get(symbolName);
    // this.storage.soilSymbols might not be updated
    let oldColor = this.pathToColor(src);
    let color = this.storage.hatchColors.get(symbolName);
    if (!color || !oldColor) {
        return src;
    }
    const hex = tinycolor(color).toHex();
    let coloredSrc = src.replace(oldColor, hex);
    // console.log("COLORED SRC", coloredSrc);
    // console.log(symbolName, oldColor, color, coloredSrc)
    return coloredSrc;
}

CrossSectionCanvas.prototype.polySelectColor = function (src) {
    // this function actually selects hatch, but i adapted it to choose the right colored one

    const symbol = this.pathToName(src);
    const timestamp = this.storage.CURRENTLINK?.timestamp ?? '0';
    const polygonData = this.storage.POLYGONS.find(x => x.timestamp == timestamp);
    const properties = this.storage.polygonProperties[timestamp];
    if (! polygonData || ! properties || ! symbol) {
        return;
    }

    console.log("SRC", src);
    
    const oldSrc = polygonData.fsrc
    const oldSymbol = this.pathToName(oldSrc);
    const oldColor = this.storage.hatchColors.get(oldSymbol);
    const colorNotSet = this.storage.hatchColors.get(symbol) == "000000" && this.storage.fillUsedForLegend.every(dict => {
        if (! dict?.src) {
            return true;
        }
        const symbolInLegend = this.pathToName(dict?.src);
        return symbolInLegend != symbol;
    });
    console.log(colorNotSet, symbol, oldColor);
    if (colorNotSet && symbol && oldColor) {
        this.setHatchColor(symbol, oldColor);
    }
    let coloredSrc = this.getColoredSrc(src);

    console.log("COLOREDSRC", coloredSrc);

    properties.hatch = symbol;
    polygonData.f = `url(#${coloredSrc})`
    polygonData.fsrc = coloredSrc;
    this.storage.d3_root.select(".polytooltip").classed("inviz", 1)
    this.drawPolygons(this.storage.svg1);

    this.storage.svg1.selectAll("path.borehole").data([this.storage.CURRENTLINK], r => r.timestamp)
        .attr('fill', d => this.getColoredFill(d.f) || this.getDefaultImgUrl(d))

    this.storage.selectingColorOfSymbol = this.pathToName(src);

    this.openPolygonPropertyGrid(this.storage.CURRENTLINK);
}

CrossSectionCanvas.prototype.polyFinishEdit = function () {
    this.storage.d3_root.select(".polytooltip").classed("inviz", 1);
}

CrossSectionCanvas.prototype.fillToSrc = function (fill) {
    /* Receives an object's fill image link and return the source.
       example of argument: `url(#someLink)`
       example of output: someLink */
    if (!fill) return this.storage.defaultPolygonFill;
    let src = fill.replace("url(#", "").slice(0, -1);
    // src = src.replace(/_/g, "/");
    return src;
}

CrossSectionCanvas.prototype.srcToFill = function (src) {
    /* Receives a image link and returns a fill string that can be applied to the object so it has the desired image as a fill */
    if (!src) {
        return this.storage.defaultPolygonFill;
    }
    return `url(#${src})`;
}

CrossSectionCanvas.prototype.getColoredFill = function (fill) {
    /* Receives a fill image string and returns a colored version of it. The colored version corresponds to the current color defined for this hatch */
    // example of argument: `url(#someid)`
    if (!fill?.includes("url")) return this.storage.defaultPolygonFill;
    let src = this.fillToSrc(fill);
    let coloredSrc = this.getColoredSrc(src);
    let coloredFill = this.srcToFill(coloredSrc);
    return coloredFill;
}

CrossSectionCanvas.prototype.correctImageUrl = function (imageUrl) {
    if (!imageUrl) {
        return "";
    }
    // don't allow url to begin with /
    var corrected = imageUrl.replace(/^\//, "");
    return corrected;
}

CrossSectionCanvas.prototype.correctHatchFill = function (hatchFill) {
    if (!hatchFill) {
        return "";
    }
    // var corrected = hatchFill.replace("url(#/", "url(#"); // don't allow url inside to begin with /
    // please allow the url inside to begin with /
    var corrected = hatchFill.includes("url(#/") ? hatchFill : hatchFill.replace("url(#", "url(#/");


    // remove first slash and replace other slashes with _
    // let corrected = hatchFill.replace("url(#/", "url(#").replace(/\//g, "_")
    return corrected;
}

CrossSectionCanvas.prototype.sum = function (arr) {
    if (!arr) {
        return 0;
    }
    return arr.reduce((a, b) => a + b, 0)
}

CrossSectionCanvas.prototype.mean = function (arr) {
    if (!arr || arr.length <= 0) {
        return 0;
    }
    return this.sum(arr) / arr.length;
}

CrossSectionCanvas.prototype.centerOfPolygon = function (points) {
    var x = points.map(p => p.x);
    var y = points.map(p => p.correct_yz);
    var centerX = this.mean(x);
    var centerY = this.mean(y);
    return [centerX, centerY];
}

CrossSectionCanvas.prototype.getHorAxisTicksDistance = function () {
    const ticks = Array.from(this.storage.rootElem.querySelectorAll('.axTop .tick text')).map(x => parseFloat(x.textContent));
    const distance = ticks.length >= 2 ? Math.abs(ticks[1] - ticks[0]) : 10;
    return distance;
}

function getInterrogationPositions ({segments, interrogationType, AX, AY, precision, horAxisTickDistance}) {
    const quantityDict = {
        "Single" : 1,
        "Double" : 2,
        "Pattern" : 4
    }

    const interrogationPositions = segments.map(segment => {
        segment[0].correct_x = segment[0].xx ?? segment[0].x;
        segment[1].correct_x = segment[1].xx ?? segment[1].x;
        const middleX = AX * (segment[0].correct_x + segment[1].correct_x) / 2;
        const middleY = - AY * (segment[0].correct_yz + segment[1].correct_yz) / 2;
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
        })
        const [leftPoint, rightPoint] = sorted;
        const dx = rightPoint.correct_x - leftPoint.correct_x
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
        if (! subInterval || Number.isNaN(subInterval)) {
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
            return [AX * x, - AY * y];
        })
        return positions;
    })
    return interrogationPositions;
}

function getPolygonInterrogationPositionDicts ({polygons, polygonProperties, AX, AY, precision, horAxisTickDistance}) {
    if (! polygons) {
        return [];
    }
    return polygons.map(d => {
        const timestamp = d?.timestamp;
        const properties = polygonProperties[timestamp];
        if (! properties || ! properties.interrogation || properties.interrogation == "(none)") {
            return [];
        }
    
        const points = JSON.parse(JSON.stringify(d.points));
        const segments = [];
        for (let i = 1; i < points.length; i += 1) {
            segments.push([points[i - 1], points[i]]);
        }
        segments.push([points[points.length - 1], points[0]]);
        
        const notBoreholeSegments = segments.filter(segment => {
            return ! (segment[0]?.bhname && segment[1]?.bhname && segment[0]?.bhname == segment[1]?.bhname);
        })
        const interrogationPositions = getInterrogationPositions({
            segments : notBoreholeSegments,
            interrogationType : properties.interrogation,
            AX : AX,
            AY : AY,
            precision : precision,
            horAxisTickDistance: horAxisTickDistance,
        }) ?? [];
        const interrogationPositionsDicts = interrogationPositions.map(positions => {
            const dict = {   
                positions : positions,
                timestamp : timestamp
            };
            return dict;
        }) ?? [];
        return interrogationPositionsDicts;
    }).flat()
}

// interrogationPointKey is there because this function can also find the position for water symbols
function getWaterlineInterrogationPositionsDicts ({interrogationPointKey = "interrogation", lines, AX, AY, precision, horAxisTickDistance, lineProperties, linkProperties}) {
    const interrogationPositionsDicts = lines.map(d => {
        const timestamp = d?.timestamp;
        let properties = lineProperties[d?.timestamp];
        if (d?.water) {
            properties = linkProperties[d?.timestamp];
        }
        if (! properties || ! properties[interrogationPointKey] || properties[interrogationPointKey] == "(none)") {
            return [];
        }
        const segments = [cloneObject([d.point1, d.point2])];

        const interrogationPositions = getInterrogationPositions({
            segments : segments,
            interrogationType : properties[interrogationPointKey],
            AX : AX,
            AY : AY,
            precision : precision,
            horAxisTickDistance: horAxisTickDistance,
        }) ?? [];
        const interrogationPositionsDicts = interrogationPositions.map(positions => {
            const dict = {
                positions : positions,
                timestamp : timestamp
            };
            return dict;
        }) ?? [];
        return interrogationPositionsDicts;
    }).flat();
    return interrogationPositionsDicts;
}

// [{ positions : [[x, y], ...], timestamp}, ...]
CrossSectionCanvas.prototype.drawInterrogationPoints = function (d3Elem, interrogationPositionsDicts, className) {
    interrogationPositionsDicts.forEach(dict => {
        const {positions, timestamp} = dict;
        positions.forEach(position => {
            const [x, y] = position;
            d3Elem.append('text').text('?')
            .classed(`${className} above${timestamp}`, true)
            .attr('x', x)
            .attr('y', y)
            .style('font-size', this.storage.interrogationPointFontSize ?? this.storage.TEXTSIZE);
        })
    });
}

CrossSectionCanvas.prototype.drawPolygonInterrogationPoints = function (svg) {
    svg.selectAll("g.interrogation-points > text").remove();
    svg.selectAll(".polygonInterrogationPoint").remove();

    const interrogationPositionsDicts = getPolygonInterrogationPositionDicts({
        polygons : this.storage.POLYGONS,
        polygonProperties: this.storage.polygonProperties,
        AX: this.storage.AX,
        AY: this.storage.AY,
        precision: this.storage.precision,
        horAxisTickDistance: this.getHorAxisTicksDistance(),
    });
    const group = svg.select("g.interrogation-points");
    this.drawInterrogationPoints(group, interrogationPositionsDicts, 'polygonInterrogationPoint');
}

CrossSectionCanvas.prototype.drawWaterlineInterrogationPoints = function (svg) {
    svg.selectAll("g.interrogation-points-waterline > text").remove();
    svg.selectAll(".waterlineInterrogationPoint").remove();

    const interrogationPositionsDicts = getWaterlineInterrogationPositionsDicts({
        interrogationPointKey: "interrogation",
        lines : [... this.storage.LINKS, ...this.storage.lines],
        lineProperties : this.storage.lineProperties,
        linkProperties : this.storage.linkProperties,
        AX : this.storage.AX,
        AY : this.storage.AY,
        precision : this.storage.precision,
        horAxisTickDistance : this.getHorAxisTicksDistance(),
    })
    const group = svg.select("g.interrogation-points-waterline");
    this.drawInterrogationPoints(group, interrogationPositionsDicts, 'waterlineInterrogationPoint');
}

CrossSectionCanvas.prototype.drawWaterlineWaterSymbols = function (svg) {
    svg.selectAll("g.waterline-watersymbols > *").remove();
    svg.selectAll(".waterSymbol").remove();

    const interrogationPositionsDicts = getWaterlineInterrogationPositionsDicts(
        {
            interrogationPointKey: "waterSymbols",
            lines : [... this.storage.LINKS, ...this.storage.lines],
            lineProperties : this.storage.lineProperties,
            linkProperties : this.storage.linkProperties,
            AX : this.storage.AX,
            AY : this.storage.AY,
            precision : this.storage.precision,
            horAxisTickDistance : this.getHorAxisTicksDistance(),
        })
    const group = svg.select("g.waterline-watersymbols");
    const htmlElem = group.node();

    interrogationPositionsDicts.forEach(dict => {
        const {positions, timestamp} = dict;
        positions.forEach(position => {
            const waterPointSize = this.getWaterIconSize();
            var waterPoint = this.createWaterIcon(waterPointSize, {
                // stroke : getStroke(data),
                // strokeOpacity : getStrokeOpacity(data)
            });
            htmlElem.appendChild(waterPoint);
    
    
            // var translateX = this.storage.AX * (data.point2.x + data.point1.x) / 2;
            // var translateY = - this.storage.AY * (data.point2.correct_yz + data.point1.correct_yz) / 2;
            const [x, y] = position;
            d3.select(waterPoint)
            .attr("transform", `translate(${x} ${y})`)
            .classed(`waterSymbol above${timestamp}`, true)
            .on("click", () => {
                const d = this.getLinkData(timestamp);
                this.linkMouseClick(d);
            })
        });
    })
}

CrossSectionCanvas.prototype.drawPolygons = function (svg) {
    console.log("draw this.storage.polygons...")

    svg.selectAll("g.polygons > path").remove();
    svg.selectAll(".polygon").remove();

    var oldpolygons = svg.select("g.polygons").selectAll("path.polygon").data(this.storage.POLYGONS, p => p.timestamp)

    const getTransparency = d => {
        const timestamp = d?.timestamp;
        const properties = this.storage.polygonProperties[timestamp];
        if (properties.fillStyle == "Void") {
            return "0";
        }
        return properties.transparency ?? "1";
    }
    var poly = oldpolygons.enter()
    const polys = poly.append("path").each(d => console.log('NEW POLY!'))
        .merge(oldpolygons)
        .classed("polygon", 1)
        .classed("sw", 1)
        .attr("elemType", "polygon")
        .on("click", event => this.polyMouseClick(event))
        .call(this.storage.dragHandlerPolygon)
        .attr("d", poly => {
            const timestamp = poly?.timestamp;
            const properties = this.storage.polygonProperties[timestamp];
            const notSmooth = this.dpolygon(poly.points);
            if (! properties?.isSmooth) {
                return notSmooth;
            }
            const points = poly.points.map(point => {
                return this.pointToCoord(point);
            });
            if (JSON.stringify(points[0] != JSON.stringify(points[points.length - 1]))) {
                points.push(points[0]);
            }
            const curveStr = d3.line().curve(d3.curveCardinal.tension(0.3))(points);
            return curveStr ?? notSmooth;
        })
        .style("stroke", "black") // necessary for export to png to render line
        // .style("stroke-width", "10px")
        .style("stroke-dasharray", d => {
            const timestamp = d?.timestamp;
            const properties = this.storage.polygonProperties[timestamp];
            if (! properties || properties?.lineStyle == "Solid") {
                return null;
            }
            return this.getStrokeDashArray({strokeWidth : this.storage.LineThickness, lineStyle : properties.lineStyle});
        })
        .style("stroke-width", this.storage.LineThickness + "px")
        .attr("fill", d => {
            // console.log(d.f);
            // if (!d.f) {
            //     return this.storage.defaultPolygonFill
            // }
            // return this.getColoredFill(d.f)
            const timestamp = d?.timestamp;
            const properties = this.storage.polygonProperties[timestamp];
            if (! properties) {
                return this.storage.defaultPolygonFill;
            }

            if (properties.fillStyle == "Void") {
                return '';
            }
            if (properties.fillStyle == "Solid") {
                return properties.patternColor ?? this.storage.defaultPolygonFill;
            }

            if (! properties.hatch) {
                let value = this.getColoredFill(this.getDefaultImgUrl(d))
                if (d.f) {
                    value = this.getColoredFill(d.f) || this.getDefaultImgUrl(d);
                }
                value = this.correctHatchFill(value);
                return value;
            }
            const soilSymbol = properties.hatch;            
            const src = this.soilSymbolToCurrentSrc(soilSymbol);
            const coloredSrc = this.getColoredSrc(src);

            if(coloredSrc) {
                const color = coloredSrc.split('/')[3];
                this.storage.polygonProperties[timestamp].patternColor = color;
            }

            let value = this.srcToFill(coloredSrc);
            value = this.correctHatchFill(value);
            return value;
        })
        .attr("fill-opacity", getTransparency)
        .attr("stroke-opacity", getTransparency)       
    
    this.initializeDoubleClick(polys.nodes());
    // done before reordering so they are reordered as well
    this.drawPolygonInterrogationPoints(svg);
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.polygon'))) 
    // .attr("x", d => {
    //     if (! d) {
    //         return 0;
    //     }
    //     return this.storage.AX * this.centerOfPolygon(d.points)[0]
    // })
    // .attr("y", d => {
    //     if (! d) {
    //         return 0;
    //     }
    //     return -this.storage.AY * this.centerOfPolygon(d.points)[1]
    // })

    oldpolygons.exit().remove()

    this.refreshLegend();
    console.log("draw this.storage.polygons ok")
}

CrossSectionCanvas.prototype.drawTexts = function (svg) {
    svg.selectAll('.textBox').remove()

    const textData = Object.values(this.storage.texts);
    if (this.storage.currentText) {
        textData.push(this.storage.currentText);
    }
    const getProperties = (d) => this.storage.texts[d.timestamp] ?? d ?? {};
    const getProperty = (d) => (property) => {
        const properties = getProperties(d);
        const defaultValue = this.storage.textDefaultProperties[property];
        if (! properties) {
            return d[property] ?? defaultValue;
        }
        return properties[property] ?? d[property] ?? defaultValue;
    }
    
    const coordinateUnitFactor = this.getCoordinateUnitFactor();

    const texts = svg.select("g.textBoxes").selectAll(".textBox").data(textData, d => d.timestamp).enter()
    .append('g')
    .classed('textBox', true)
    .call(this.storage.dragHandlerTextBox)
    .attr("elemType", "textBox")
    .attr('transform', d => `translate(${getProperty(d)('x') * this.storage.AX * coordinateUnitFactor} ${- getProperty(d)('y') * this.storage.AY * coordinateUnitFactor})`)
    .on("click", d => this.textMouseClick(d.timestamp))

    const foreign = texts.append('foreignObject')
    .attr('width', d => 1)
    .attr('height', d => 1)

    foreign.nodes().forEach(node => {
        const d = d3.select(node).data()[0];
        const properties = getProperty(d);
        
        const textarea = document.createElement('textarea');
        textarea.value = d.text;
        textarea.style.fontSize = `${properties('fontSize')}px`;
        textarea.style.fontFamily = properties('fontFamily');
        textarea.style.color = properties('textColor');
        textarea.style.width = `${properties('boxWidth') * this.storage.AX * coordinateUnitFactor}px`;
        textarea.style.height = `${properties('boxHeight') * this.storage.AY * coordinateUnitFactor}px`;
        textarea.style.opacity = properties('transparency');
        if (! properties('showBorder')) {
            textarea.classList.add('textAreaNoBorder');
        }
        if (properties('showBackground')) {
            textarea.style.backgroundColor = properties('backgroundColor');
        }
        else {
            textarea.style.background = "transparent";
        }

        node.appendChild(textarea);

        textarea.addEventListener('change', event => {
            getProperties(d).text = textarea.value;
        })
    })

    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.textBoxes')));
    console.log('Drew texts')
}

//==========================================================================================

CrossSectionCanvas.prototype.getPolygonsPointBelongsTo = function (timestamp) {
    const polygonsPointBelongsTo = [];
    this.storage.d3_root.selectAll(".polygon").data().forEach(poly => {
        let isInPoly = poly.points.some(p => {
            return p.timestamp == timestamp;
        });
        if (! isInPoly) {
            return;
        }
        polygonsPointBelongsTo.push(poly.timestamp);
    });
    return polygonsPointBelongsTo;
}

CrossSectionCanvas.prototype.getLinesPointBelongsTo = function (timestamp) {
    const linesPointBelongsTo = [];
    [...this.storage.LINKS, ...this.storage.lines].forEach(d => {
        const isPoint1 = timestamp == d.point1.timestamp;
        const isPoint2 = timestamp == d.point2.timestamp;
        const isInWaterLine = isPoint1 || isPoint2;
        if (! isInWaterLine) {
            return;
        }
        linesPointBelongsTo.push(d.timestamp);
    });
    return linesPointBelongsTo;
}

CrossSectionCanvas.prototype.removeOrphanPoints = function () {
    /* Removes extra points that don't belong to any polygon or water line */
    let orphanPoints = this.storage.d3_root.selectAll(".freepoint").filter(point_data => {
        // checks if there's any polygon the point still belongs to
        let isInPolygon = this.storage.d3_root.selectAll(".polygon").data().some(poly => {
            let isInPoly = poly.points.some(p => {
                return point_data.timestamp == p.timestamp;
            });
            return isInPoly;
        })


        // let isInPolygon = point_data.belongsToPoly?.some(poly => {
        //     // this.storage.polygons saved in the point might have been deleted
        //     // so we have to search the canvas to see if they are still there
        //     let polygonsPointBelongsTo = this.storage.d3_root.selectAll(".polygon").filter(poly_data => {
        //         let belongs = poly.timestamp == poly_data.timestamp;
        //         return belongs;
        //     })
        //     return ! polygonsPointBelongsTo.empty();
        // })
        // case where belongsToPoly doesn't exist
        isInPolygon = isInPolygon ?? false;

        let isInWaterline = this.storage.d3_root.selectAll(".g-link").data().some(d => {
            return point_data.timestamp == d.point1.timestamp || point_data.timestamp == d.point2.timestamp;
        });

        return (!isInPolygon) && (!isInWaterline);
    })
    console.log("Orphan points to be removed", orphanPoints)
    // removes from canvas
    orphanPoints.remove();

    const orphanTimestamps = orphanPoints.data().map(d => d.timestamp);
    // removes from this.storage.EPOINTS (json data)
    this.storage.EPOINTS = this.storage.EPOINTS.filter(point => {
        return !orphanTimestamps.includes(point.timestamp)
    })
}

CrossSectionCanvas.prototype.firstDraw = function () {
    /* Function that draws the canvas for the first time. Subsequent redraws should be done by the function this.redraw() */
    this.redraw();
    this.focusCenter();
}

CrossSectionCanvas.prototype.redraw = function () {
    console.log('REDRAW ALL')
    this.redraw00(this.storage.svg1, true)
    this.removeOrphanPoints();
    //this.redraw00(this.storage.svg2)
    this.changeGridOn();
    console.log('REDRAW ALL ok')
}

// zoom feature still not implemented, for now only focus center without zooming
// deprecated, this entire code can be replaced by focusCenter
// function zoomFit() {
//   var xs = this.getAllPoints().map(p => p.xx || p.x)
//   var ys = this.getAllPoints().map(p => p.correct_yz)

//   var xMin = Math.min(...xs)
//   var xMax = Math.max(...xs)
//   var activeX = xMax - xMin
//   console.log('xrange', xMin, xMax, activeX)

//   var yMin = Math.min(...ys)
//   var yMax = Math.max(...ys)
//   var activeY = yMax - yMin
//   console.log('yrange', yMin, yMax, activeY)

//   this.changeSvgWindowCenter((xMin + xMax)/2, (yMin + yMax)/2);
// }

CrossSectionCanvas.prototype.redraw00 = function (svg, WND) {

    /*
    function handleMouseOverPoint(d) {
      //alert('over')
      var point = d3.select(this)
      // TODO add data general.x    OK: d.layerTitle + ' ' +d.from
      svg.selectAll(".selectpointtooltip").attr('x', +point.attr("x") + (+point.attr("width")))
        .attr('y', +point.attr("y"))
        .text('__!!!')
        .attr('visibility', "visible")
    }


    function handleMouseOutPoint(d) {
      svg.selectAll(".selectpointtooltip").attr('visibility', "hidden")
    }
    */


    this.refreshTexts();
    this.refreshPathsWidth();
    this.refreshGridPathWidth();
    this.initializeFromDict('titleTop');
    this.initializeFromDict('titleLeft');
    this.updateVertAxisTicksText();
    this.updateHorAxisTicksText();
    this.zoom(1);
    this.refreshBoreholeImgScale();

    svg.selectAll('.g-link').remove()
    //svg.selectAll('rect.borehole').remove()
    svg.selectAll('rect.axis').remove()
    //svg.selectAll('.point').remove()
    //svg.selectAll('text.layerinfo').remove()
    //svg.selectAll('text.layery').remove()
    //svg.selectAll('text.bhtitle').remove()

    /*
    // general.x
    // general.z
    // soillayer[].from, soillayer[].to
    */

    // var xs = this.getAllPoints().map(p => p.xx || p.x)
    // var ys = this.getAllPoints().map(p => p.correct_yz)

    // var xMin = Math.min(...xs)
    // var xMax = Math.max(...xs)
    // var activeX = xMax - xMin
    // console.log('xrange', xMin, xMax, activeX)

    // var yMin = Math.min(...ys)
    // var yMax = Math.max(...ys)
    // var activeY = yMax - yMin
    // console.log('yrange', yMin, yMax, activeY)

    // this.storage.REGCX = (xMin + xMax)/2
    // this.storage.REGCY = (yMin + yMax)/2

    this.drawLinks(svg);

    svg.selectAll(".selectpointtooltip").attr('font-size', this.storage.TEXTSIZE + 'px');

    this.drawAllBoreholes();

    this.drawExtraPoints(svg);
    this.drawPolygons(svg);
    this.drawTexts(svg);
    this.changeWaterIconSize();

    // Fixes the coordinate system for every element in the canvas.
    //let offset = 2 * svg.select("g.boreholes").select('path.borehole').data(borehole.soillayer, b => b.timestamp)
    //svg.selectAll("*").attr('d', d => {...d, yz: d.yz + offset});

    // this.changeSvgWindowCenter((xMin + xMax)/2, (yMin + yMax)/2)

    this.refreshLegend();

    this.focusCenter();

    console.log("redraw00 ok")
}

CrossSectionCanvas.prototype.drawExtraPoints = function (svg) {


    // ================================================== experimental points in the middle of nowhere
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    var handleMouseClickPointBIND = this.handleMouseClickPoint.bind(this)
    var extraPointsR = svg.select("g.extra").selectAll('.freepoint').data(this.storage.EPOINTS, p => p.timestamp)
    extraPointsR.enter().append("rect")
        .classed('point', 1)
        .classed('freepoint', 1)
        .classed('sw', 1)

        .merge(extraPointsR)

        .classed("waitforconnect", pt => pt == this.storage.CONNECTMODE)
        .attr("x", pt => (pt.xx ?? pt.x) * this.storage.AX + this.cornerExtraOffset())
        .attr("y", pt => -pt.correct_yz * this.storage.AY + this.cornerExtraOffset())
        .attr("width", this.cornerWH())
        .attr("height", this.cornerWH())
        .style('stroke-width', this.storage.LineThickness + 'px')


        // .on("mouseover", handleMouseOverPoint)
        // .on("mouseout", handleMouseOutPoint)
        .on("click", (pt) => handleMouseClickPointBIND(pt, svg))
        .call(this.storage.dragHandlerExtra)

    // ================================================== labels of extrapoints point'y    pt
    var extraPointsT = svg.select("g.extra").selectAll('text.layery').data(this.storage.EPOINTS, p => p.timestamp)
    extraPointsT.enter().append("text")
        .classed("layery", 1)
        .style("text-anchor", "end")
        .classed("fsz", 1)

        .merge(extraPointsT)

        .attr("x", pt => pt.x * this.storage.AX - 9)
        .attr("y", pt => {
            return -pt.correct_yz * this.storage.AY
        })
        // .text(pt => pt.textExtra || pt.correct_yz.toFixed(2))     // on load extra
        .classed("opa", pt => pt.textHidden)
        .attr('fill', pt => pt.textColor)                 // on load extra if exists
        .attr('transform', pt => pt.transform)            // on load extra if exists

        .attr('font-size', this.storage.TEXTSIZE + 'px')

        .call(this.storage.dragHandlerText)
        .on("click", this.textMouseClickGenerator())

}

function coerceType(obj1, obj2) {
    /* converts obj1 to the same type as obj2 */
    switch (typeof obj2) {
        case "string":
            return String(obj1);
            break;
        case "boolean":
            return Boolean(obj1);
            break;
        case "number":
            return Number(obj1);
            break;
        default:
            return obj1;
    }
}

// takes a value and updates the crossSection corresponding variable
// prop is the name of the variable
// this function does not rerender anything
CrossSectionCanvas.prototype.applyPageOption = function (prop, value) {
    if (!(prop in this.storage)) {
        return;
    }
    if (prop in defaultStorage) {
        value = coerceType(value, defaultStorage[prop])
    }
    if (prop in defaultOptions) {
        value = coerceType(value, defaultStorage[prop])
    }
    this.storage[prop] = value;
}


// CrossSectionCanvas.prototype.getOptionFromStorage = function (prop) {
//     /* If isn't found then returns ''*/
//     if (! prop in this.storage.pageOptions) {
//         return '';
//     }
//     return this.storage.pageOptions[prop];
// }

// CrossSectionCanvas.prototype.getOptionFromPageUI = function (selector, prop) {
//     /* For compatibility between standalone site and ilog. If element isn't found then returns ''*/
//     var d3Elem = this.storage.d3_root.select(selector);
//     if (!d3Elem.node()) {
//         return '';
//     }
//     return d3Elem.property(prop);
// }


CrossSectionCanvas.prototype.getAllPageOptions = function () {
    let listOfOptions = ['GridlineThickness', 'HatchScale', 'LineThickness', 'boreholeWidth', 'PointSize', 'TEXTSIZE', 'legendBoxW', 'legendBoxH']
    let entries = listOfOptions.map(option => [option, this.storage[option]]);
    let pageOptions = Object.fromEntries(entries);
    return pageOptions;
}

CrossSectionCanvas.prototype.jsonOptionToPageOption = function (jsonOption) {
    return this.genericTranslation(jsonOption, this.storage.jsonOptionToPageOptionDict, '');
}

// redraws canvas with the page options coming from jsonOptions
// for example, redraws the scale, texts and so on
CrossSectionCanvas.prototype.applyAllPageOptions = function (options, optionsPassed={redraw : true}) {
    // <option value="v">txt</option>
    //var feetScaleOptions = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192]

    Object.entries(options).forEach(option => {
        let [prop, value] = option;
        let translatedProp = this.jsonOptionToPageOption(prop);
        console.log(translatedProp, value)
        this.applyPageOption(translatedProp, value);
    })

    // TODO check A4
    // this.storage.PIXW = options.PIXW;
    // this.storage.PIXH = options.PIXH;
    $(".left-panel").show();

    // redraw doesn't affect the coloroptions elem
    this.storage?.rootElem?.querySelector('.selectHatchTooltip .coloroptions')?.style?.setProperty('--fontSize', `${this.storage.TEXTSIZE}px`);
    this.storage?.rootElem?.querySelector('.selectHatchTooltip .coloroptions')?.style?.setProperty('--hatchRepeat', this.storage.HatchScale);
    this.storage?.rootElem?.style?.setProperty('--lineStyleScale', this.storage.lineStyleScale);
    this.storage?.rootElem?.style?.setProperty('--pointFillOpacity', this.storage.pointHasFill ? 1 : 0);
    this.storage?.rootElem?.style?.setProperty('--pointFillColor', this.storage.pointFillColor);
    this.storage?.rootElem?.style?.setProperty('--pointLineColor', this.storage.pointLineColor);
    
    console.log("Options applied")
    
    // fence-diagram-sample.json
    // http://18.217.59.124/static/fence-diagram-sample.json
    // https://www.novotechsoftware.com/downloads/Fence_Diagram_Example.json
    //this.processFileWithRedraw("fence-diagram-sample.json");
    
    this.adequateSvgSizeToRootElem();
    if (optionsPassed.redraw) {
        if (this.storage.data0) this.redraw();
    }
}

// from the JSON containing cross section data
CrossSectionCanvas.prototype.applyAllPageOptionsFromSectionJson = function(jsonBorehole, optionsPassed={redraw : true}) {
    const options = this.cloneObject(defaultOptions);
    const keys = Object.keys(defaultOptions);
    keys.forEach(key => {
        if (key in jsonBorehole) {
            options[key] = this.cloneObject(jsonBorehole[key]);
        }
    })

    Object.entries(options).forEach(option => {
        let [prop, value] = option;
        this.applyPageOption(prop, value);
    })

    $(".left-panel").show();

    this.setFromDict('titleTop', "text", options.axisHorText ? options.axisHorText : this.getDefaultTitleTop());
    this.setFromDict('titleLeft', "text", options.axisVertText ? options.axisVertText : this.getDefaultTitleLeft());

    // redraw doesn't affect the coloroptions elem
    this.storage?.rootElem?.querySelector('.selectHatchTooltip .coloroptions')?.style?.setProperty('--fontSize', `${this.storage.TEXTSIZE}px`);
    this.storage?.rootElem?.querySelector('.selectHatchTooltip .coloroptions')?.style?.setProperty('--hatchRepeat', this.storage.HatchScale);
    this.storage?.rootElem?.style?.setProperty('--lineStyleScale', this.storage.lineStyleScale);
    this.storage?.rootElem?.style?.setProperty('--pointFillOpacity', this.storage.pointHasFill ? 1 : 0);
    this.storage?.rootElem?.style?.setProperty('--pointFillColor', this.storage.pointFillColor);
    this.storage?.rootElem?.style?.setProperty('--pointLineColor', this.storage.pointLineColor);

    console.log("Options applied")

    this.adequateSvgSizeToRootElem();
    if (optionsPassed.redraw) {
        if (this.storage.data0) {
            this.redraw();
        }
    }
}

CrossSectionCanvas.prototype.widthWithoutBox = function () {
    var width = $(window).width();
    var width97 = (width * 97) / 100;
    var leftPanel = 35;
    const newWidth = width97 - leftPanel - 20;
    if (newWidth <= 0) {
        return;
    }
    this.storage.PIXW = newWidth;
}

// CrossSectionCanvas.prototype.initializeOptions = function () {
//     /* Initializes the application options to a default value in case the program runs too fast */
//     this.updatePageOptionUIs(this.storage.defaultOptions);
// }

CrossSectionCanvas.prototype.loadOptionsFile = function () {
    this.storage.rootElem.onload = () => {
        // d3.json("soil-options.json", applyOptions);
        // @ts-expect-error
        d3.json("soil-options.json", this.updatePageOptionUIs);
    }
}


// this.loadOptionsFile();


CrossSectionCanvas.prototype.processBhFileWithRedraw = function () {
    var flist = this.storage.rootElem.querySelector(".bhFile").files;

    if (!flist || !flist[0]) {
        alert("!no added files!")
        return;
    }
    var f = flist[0]; // FileList object
    var reader = new FileReader();
    console.log(f);

    reader.onload = (event) => {
        let dataURL = event.target.result;
        // let readable_data = JSON.parse(atob(dataURL.substring(29)));
        // this.processDataWithRedraw(readable_data);

        // console.log(event.target.result);
        this.processFileWithRedraw(event.target.result)
    };
    // Read in the file as a data URL.
    reader.readAsDataURL(f);
}

function rads(deg) {
    return deg * Math.PI / 180
};

function xPlunge(x, depth, a) {
    return x + depth * Math.cos(rads(a))
}
function yPlunge(z, depth, a) {
    return z - depth * Math.sin(rads(a));
}

CrossSectionCanvas.prototype.eitherKey = function (dict, key1, key2) {
    if (!dict) {
        return null;
    }
    if (dict[key1] == null) {
        return dict[key2];
    }
    return dict[key1];
}

function getDisplayNameCompat(value) {
    if (typeof window['getDisplayName'] === "function") {
        return window['getDisplayName'](value);
    }
    return null;
}

CrossSectionCanvas.prototype.updateModalHeader = function () {
    const modal = this.storage?.rootElem?.closest(".modal");
    const titleElem = modal?.querySelector('#charttitle');
    const boreholesElem = modal?.querySelector('#crossectionsreview');
    if (! modal || ! titleElem || !this) {
        return;
    }
    const title = this.getTitle() ?? "Section";
    titleElem.innerText = title;

    const boreholesData = this?.storage?.data0 ?? [];
    const boreholeNames = boreholesData.map(boreholeData => boreholeData.name).map(x => x.trim());
    boreholesElem.innerText = `Cross Section Through: ${boreholeNames?.join(', ')}`
}

CrossSectionCanvas.prototype.initializeZoomExtentOnModalOpen = function () {
    const modal = this.storage?.rootElem?.closest(".modal");
    if (! modal) {
        return;
    }
    const observer = new MutationObserver((mutationList) => {
        mutationList.forEach(mutation => {
            const modal = mutation.target;
            // @ts-expect-error
            if (mutation.attributeName == "class" && modal.classList.contains("modal") && modal.classList.contains("show") && ! mutation.oldValue.includes("show")) {
                this.zoomExtent();
            }
        })
    });
    observer.observe(modal, {
        attributeFilter : ['class'],
        attributeOldValue : true
    })
}

CrossSectionCanvas.prototype.fetchOtherCrossSections = async function (otherCrossSections) {
    if (! otherCrossSections) {
        return;
    }
    const promises = otherCrossSections.map(data => {
        return new Promise((resolve, reject) => {
            d3.json(data.url, json => {
                const processed = this.preProcessJson(json);
                resolve({...data, data : processed});
            })
        })
    })
    const results = await Promise.all(promises);
    this.storage.otherCrossSectionsData = results;
    this.initializePropertyGrid();
}

const defaultOpenConfirmModalOptions = {text : '', title : 'Confirm', callback : () => null};
CrossSectionCanvas.prototype.openConfirmModal = function (options = defaultOpenConfirmModalOptions) {
    options = {...defaultOpenConfirmModalOptions, ...options};
    const htmlString = `
    <p>${options.text}</p>
    `

    const modalElem = this.storage.rootElem?.querySelector('.confirmModal');
    
    const modalBodyElem = modalElem.querySelector('.modal-body');
    modalBodyElem.innerHTML = htmlString;

    const modalTitle = modalElem.querySelector('.modal-title');
    modalTitle.innerText = options.title ?? defaultOpenConfirmModalOptions.title;
    
    const confirmButton = modalElem.querySelector('.confirmButton');
    confirmButton.onclick = async () => {
        if (confirmButton.disabled) {
            return;
        }
        
        const buttons = Array.from(modalElem.querySelectorAll('.btn'));
        buttons.forEach(x => {
            x.disabled = true;
        })

        await options.callback();
        $(modalElem).modal('hide')

        buttons.forEach(x => {
            x.disabled = false;
        })

    };

    // replaces default behavior since it was also closing the crossSection modal
    const closeButtons = [
        modalElem.querySelector("button.close"),
        modalElem.querySelector(".closeButton")
    ]
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (button.disabled) {
                return;
            }
            $(modalElem).modal('hide');
        })
    })

    $(modalElem).modal({
        show: true,
        backdrop: false
    });
}

CrossSectionCanvas.prototype.openConfirmModalAsync = async function (options) {
    if (! options) {
        return;
    }
    const promise = new Promise((resolve, reject) => {
        const fn = options.callback;
        const newCallback = async () => {
            await fn();
            resolve(true);
        }
        options.callback = newCallback;
        this.openConfirmModal(options);
    })
    return promise;
}

function setDisplayNone(elems) {
    const oldDisplays = elems.map(x => {
        return x?.style?.display;
    });
    elems.forEach(elem => {
        elem.style.display = 'none';
    })
    const unsetDisplayNone = () => {
        elems.forEach((elem, index) => {
            if (! elem) {
                return;
            }
            elem.style.display = oldDisplays[index];
        })
    }
    return {
        oldDisplays : oldDisplays,
        unsetDisplayNone : unsetDisplayNone
    }
}

// requirements
// - works for drawings with square proportions
// - works for long thin drawings
// defined too far as when the elem increases one of the canvas dimensions by 
// more than 5 times the smallest dimension of the canvas
// 3 times would be too limiting in cases such as 600 x 50, the maximum offset would be 250
CrossSectionCanvas.prototype.areElemsTooFar = function (elems) {
    if (elems == null) {
        return null;
    }
    const extentWithElems = this.getExtentSize();

    const {unsetDisplayNone} = setDisplayNone(elems);

    const extentWithoutElems = this.getExtentSize();
    const center = this.getRootCenter() ?? [0, 0];

    unsetDisplayNone();

    if (! extentWithoutElems || extentWithoutElems.length < 2 || ! extentWithElems || extentWithElems.length < 2) {
        return null;
    }
    
    const maxRatio = 5;
    
    let smallestDimension = extentWithoutElems[0];
    if (extentWithoutElems[1] < extentWithoutElems[0]) {
        smallestDimension = extentWithoutElems[1];
    }
    const maxOffset = maxRatio * smallestDimension;
    const differenceX = extentWithElems[0] - extentWithoutElems[0];
    const differenceY = extentWithElems[1] - extentWithoutElems[1];
    return {
        areTooFar : (differenceX > maxOffset || differenceY > maxOffset),
        center: center,
        extentWithElems: extentWithElems,
        extentWithoutElems: extentWithoutElems,
    }
}

CrossSectionCanvas.prototype.getElemsThatCanBeFarAwayFromBorehole = function () {
    const elemsThatCanBeTooFarArr = this.getElemsThatCanBeTooFarArr();
    const elemsThatCanBeTooFarSelectors = elemsThatCanBeTooFarArr.map(x => x.selector);
    const dictEntries = elemsThatCanBeTooFarSelectors.map(selector => {
        const elems = this.storage?.rootElem?.querySelectorAll(selector);
        if (! elems) {
            return [selector, []];
        }
        return [selector, Array.from(elems)];
    })
    return Object.fromEntries(dictEntries);
}

// disregards other elements that can be too far
CrossSectionCanvas.prototype.areElemsTooFar2 = function (elems, selector) {
    const elemsThatCanBeTooFarArr = this.getElemsThatCanBeTooFarArr();
    const elemsThatCanBeTooFarSelectors = elemsThatCanBeTooFarArr.map(x => x.selector);
    if (! elemsThatCanBeTooFarSelectors.find(x => selector == x)) {
        return null;
    }
    const elemsThatCanBeTooFarDict = this.getElemsThatCanBeFarAwayFromBorehole();
    const otherElems = [];
    elemsThatCanBeTooFarSelectors.forEach(key => {
        if (key == selector) {
            return;
        }
        if (elemsThatCanBeTooFarDict[key] == null) {

        }
        otherElems.push(...(elemsThatCanBeTooFarDict[key]));
    });

    const {unsetDisplayNone} = setDisplayNone(otherElems);
    const tooFarDict = this.areElemsTooFar(elems);
    unsetDisplayNone();

    return tooFarDict;
}

CrossSectionCanvas.prototype.showWarningIfLegendBoxTooFar = function () {
    const legend = this.storage.rootElem.querySelector('.legend');
    const tooFarDict = this.areElemsTooFar2([legend], '.legend');
    if (! tooFarDict) {
        return;
    }
    const {areTooFar, center, extentWithElems, extentWithoutElems} = tooFarDict;

    const shouldShowWarning = (! this.storage.legendPinnedTo || this.storage.legendPinnedTo == '(none)') && areTooFar;
    console.log(shouldShowWarning, areTooFar);
    if (! shouldShowWarning) {
        return;
    }
    this.openConfirmModal({
        text: "The legend box is too far from the cross section. Should we automatically move the legend close to the cross section?",
        title: "Confirm",
        callback: () => {
            const coordinateUnitFactor = this.getCoordinateUnitFactor();
            const rect = legend.getBBox();
            const newLEGDX = (center[0] + rect.width / 2 - extentWithoutElems[0] / 2) / coordinateUnitFactor;
            const newLEGDY = (center[1] + extentWithoutElems[1] / 2) / coordinateUnitFactor;
            if (newLEGDX == null || Number.isNaN(newLEGDX) || newLEGDY == null || Number.isNaN(newLEGDY)) {
                return;
            }
            console.log(center, rect, extentWithoutElems);
            this.storage.LEGDX = newLEGDX;
            this.storage.LEGDY = newLEGDY;
            this.storage.LEGDXREAL = this.storage.LEGDX / this.storage.AX;
            this.storage.LEGDYREAL = this.storage.LEGDY / this.storage.AY;
            this.refreshLegend();
            this.zoomExtent();
        }
    });
}

CrossSectionCanvas.prototype.getElemsThatCanBeTooFarArr = function () {
    let arbitraryPosition = [0, 0];
    if (this.storage?.data0?.length > 0) {
        const bh = this.storage.data0[0];
        arbitraryPosition = [bh.general.x ?? 0, bh.general.z ?? 0];
    }
    const arr = [
        {selector : '.legend', resetPosition : (elems) => {
    
        }},
        {selector : '.layerinfo', resetPosition : (elems) => {
            this.storage.data0?.forEach(bh => {
                bh?.soillayer?.forEach(sl => {
                    if (! sl) {
                        return;
                    }
                    sl.transform = null;
                })
            })
            this.drawAllBoreholes();
        }},
        {selector : '.textBox', resetPosition : (elems) => {
    
        }},
        {selector : '.fieldtest-plot', resetPosition : (elems) => {
    
        }},
        {selector : '.g-link', resetPosition : (elems) => {
    
        }},
        {selector : '.polygon', resetPosition : (elems) => {
    
        }},
    ]
    return arr;
}

// if the user moves objects such as soil layer infos
// and then modifies the borehole positions
// the text elems can stay in place and be too far away
CrossSectionCanvas.prototype.resetPositionsIfNecessary = function () {
    const arr = this.getElemsThatCanBeTooFarArr();

    arr.forEach(dict => {
        const {selector, resetPosition} = dict;
        const elems = Array.from(this.storage.rootElem?.querySelectorAll(selector));
        if (! elems || elems.length <= 0) {
            return;
        }
        const tooFarDict = this.areElemsTooFar2(elems, selector);
        if (! tooFarDict) {
            return;
        }
        const {areTooFar, center, extentWithElems, extentWithoutElems} = tooFarDict;
        if (! areTooFar) {
            return;
        }
        console.log(`${selector} too far, moving`);
        resetPosition();
    })
}

// applies corrections
// transforms the data considering depth unit and coordinate unit
// if the allies are correct, the boreholes are drawn correctly
// and the polygon and line points that attach to boreholes are drawn correctly
// x and y are the values in the original unit and also used for purposes of indexing, don't alter them
// xx and yz are the actual values, those should be altered
CrossSectionCanvas.prototype.updateAllyAndPointData = function () {
    const bhScale = this.storage.boreholeWidth;
    const depthUnitFactor = this.getDepthUnitFactor();
    const coordinateUnitFactor = this.getCoordinateUnitFactor();
    this.storage.data0.forEach(bh => {
        //correct yz's
        let offset = this.getOffset(bh);
        let yzCorrection = x => -(x + offset);
        // the yz is false and the correct_yz needs to be derived when this yz is corrected
        if (bh.waterPoint) {
            bh.waterPoint.correct_yz = yzCorrection(bh.waterPoint.yz);
        }

        let timestamp = bh.soillayer[0].timestamp;

        if (bh.general.test_xx && bh.general.test_yz) {
            this.storage.fieldTestPositions[timestamp] = {
                test_xx: bh.general.test_xx,
                test_yz: bh.general.test_yz
            }
        }

        // indexed by y so we have a unique one per point
        // y : point
        const boreholePointsIndexedByDepth = {};
        const soillayer = bh.soillayer.filter(x => x.to > x.from);
        soillayer.forEach(sl => {
            const depths = [sl.from, sl.to];
            depths.forEach(depth => {
                if (! (depth in boreholePointsIndexedByDepth)) {
                    boreholePointsIndexedByDepth[depth] = {
                        y : depth,
                        yDepthUnit : depth * depthUnitFactor,
                        soillayers_timestamps : [sl.timestamp]
                    }
                }
                else {
                    boreholePointsIndexedByDepth[depth].soillayers_timestamps.push(sl.timestamp);
                }
            })
        })

        bh.general.plunge = bh.general.plunge || 90
        var bhradius = bh.general.disp_w / 2 * bhScale / 100;

        soillayer.forEach(sl => sl.timestamp = sl.timestamp || this.storage.uniq())

        if (!bh.ally) bh.ally = [];
        var addedPointsCounter = 0;

        // Generates timestamp if missing
        bh.ally.forEach(p => {
            if (!p.timestamp) {
                var newTimestamp = this.storage.uniq();
                p.timestamp = newTimestamp;
            }
        })
        // recreates boreholePointsIndexedByDepth based on borehole layers
        // we don't use the old positions because the borehole might have moved places
        // we use the same timestamps as the original ones so this.storage.polygons still connects properly later

        // get original timestamps
        let allyTimestamps = bh.ally.map(p => {
            var timestamp = p.timestamp

            return timestamp;
        });

        // how many allies there are supposed to be
        var pointsArray = Object.values(boreholePointsIndexedByDepth).sort((a, b) => {
            return a.y - b.y;
        });
        console.log(boreholePointsIndexedByDepth, pointsArray);
        var nAllies = pointsArray.length * 2;
        var pointsLeft = nAllies - allyTimestamps.length;

        // add remaining timestamps
        for (let i = 0; i < pointsLeft; i++) {
            let timestamp = this.storage.uniq();
            allyTimestamps.push(timestamp);
        }

        const boreholeZCoordinateUnit = bh.general.z * coordinateUnitFactor;
        const boreholeXCoordinateUnit = bh.general.x * coordinateUnitFactor;
        bh.ally = [];
        pointsArray.forEach((point, index) => {
            const {y, yDepthUnit, soillayers_timestamps} = point;
            var leftPointTimestamp = allyTimestamps[index * 2];
            var rightPointTimestamp = allyTimestamps[index * 2 + 1];

            // var leftPoint = bh.ally.find(p => p.x == bh.general.x && p.y == y && p.left)
            var leftPoint = {
                timestamp: leftPointTimestamp,
                y: y,
                yDepthUnit: yDepthUnit,
                x: bh.general.x,
                bhname: bh.name,
                left: true,
                soillayers_timestamps : soillayers_timestamps,
            }
            bh.ally.push(leftPoint);
            addedPointsCounter += 1;
            leftPoint.yz = yPlunge(boreholeZCoordinateUnit, yDepthUnit, bh.general.plunge)
            // no need for correction because this point is derived correctly already
            leftPoint.correct_yz = leftPoint.yz;
            leftPoint.recalcXX = function (bhradius) {
                this.xx = xPlunge(boreholeXCoordinateUnit, yDepthUnit, bh.general.plunge) - bhradius * coordinateUnitFactor;
                return this;
            }
            leftPoint.recalcXX(bhradius)


            var rightPoint = {
                timestamp: rightPointTimestamp,
                y: y,
                x: bh.general.x,
                bhname: bh.name,
                soillayers_timestamps : soillayers_timestamps
            };
            bh.ally.push(rightPoint);
            addedPointsCounter += 1;
            rightPoint.yz = yPlunge(boreholeZCoordinateUnit, yDepthUnit, bh.general.plunge)
            rightPoint.correct_yz = rightPoint.yz;
            rightPoint.recalcXX = function (bhradius) { this.xx = xPlunge(boreholeXCoordinateUnit, yDepthUnit, bh.general.plunge) + bhradius * coordinateUnitFactor; return this }
            rightPoint.recalcXX(bhradius)

        })

        soillayer.forEach(sl => {
            sl.p1LT = bh.ally.find(pt => pt.y == sl.from && pt.left);
            sl.p2RT = bh.ally.find(pt => pt.y == sl.from && !pt.left);
            sl.p3LB = bh.ally.find(pt => pt.y == sl.to && pt.left);
            sl.p4RB = bh.ally.find(pt => pt.y == sl.to && !pt.left);
        })

        if (!bh.waterPoint) {
            bh.waterPoint = {
                timestamp: this.storage.uniq(),
                bhname: bh.name,
                x: bh.general.x,
                y: bh.general.water,
                xx: xPlunge(boreholeXCoordinateUnit, bh.general.water, bh.general.plunge),
                yz: yPlunge(boreholeZCoordinateUnit, bh.general.water * depthUnitFactor, bh.general.plunge),
                correct_yz: yPlunge(boreholeZCoordinateUnit, bh.general.water * depthUnitFactor, bh.general.plunge),
                textHidden: true
            };
        }
    })

    var allPoints = this.getAllPoints();
    // polygons connect to the allies and extra points if possible
    const pointsNotFound = [];
    const replacedPoints = [];
    this.storage.POLYGONS.forEach(polygon => {
        const points = polygon.points.map(
            justDict => {
                const foundPoint = allPoints.find(realPoint => justDict.timestamp == realPoint.timestamp)
                return foundPoint;
            }
        );
        const notFoundPoints = points.filter(x => x === undefined);
        notFoundPoints.forEach(point => {
            pointsNotFound.push(point);
        });
        
        if (notFoundPoints.length == 0) {
            polygon.points = points;
            return;
        }

        // if any point wasn't found, rebuilds polygon
        polygon.points = polygon.points.map(justDict => {
            console.log(justDict)
            var newPoint = {
                timestamp: this.storage.uniq(),
                x: justDict.x,
                xx: justDict.xx ?? justDict.x,
                originalX: justDict.x ?? justDict.xx,
                y: justDict.y,
                yz: justDict.yz,
                correct_yz: justDict.correct_yz,
                iamextrapoint: true,
                // list of this.storage.polygons the point belongs to
                belongsToPoly: [polygon.timestamp]
            };     // no this.storage.ZOOMSCALE here
            this.storage.EPOINTS.push(newPoint)
            replacedPoints.push(newPoint)
            return newPoint;
        })
    })

    if (pointsNotFound.length > 0) {
        console.log("Broken data structure, polygon points not found");
        console.log("Missing polygon points have been replaced:", replacedPoints)
        // const message = pointsNotFound.map(point => JSON.stringify(point)).join('\n');
        //alert("Broken data structure, polygon points not found:\n", message);
    }

    // yz is the correct data in this case and correct_yz is the display
    this.storage.EPOINTS.forEach(pointDict => {
        pointDict.correct_yz = pointDict.yz * coordinateUnitFactor;
        pointDict.xx = pointDict.originalX * coordinateUnitFactor;
    })
}

CrossSectionCanvas.prototype.processDataWithRedraw = function (data) {
    /* Receives a javascript object containing data, processes it and draws the objects on canvas. */
    data = this.preProcessJson(data);
    this.applyAllPageOptionsFromSectionJson(data);
    this.changeUnit(data.Unit ?? 'ft', {updateSizes : false, redraw : false});
    this.initializeColoredHatchPatterns(data);
    
    this.cancelSelection();


    const toBeRemoved1 = ['g.polygons', 'g.boreholes', 'g.links', 'g.water-symbols', 'g.boreholelabels', 'g.points', 'g.extra', 'g.fieldtests']
    toBeRemoved1.forEach(selector => {
        const elem = this?.storage?.rootElem?.querySelector('g.root-group')?.querySelector(selector);
        if (elem) {
            elem.innerHTML = '';
        }

    })
    const toBeRemoved2 = ['polygon', '.g-borehole', '.g-link', '.cdr', '.point', '.polygonInterrogationPoint']
    toBeRemoved2.forEach(selector => {
        const elems = Array.from(this?.storage?.rootElem?.querySelectorAll(selector));
        elems.forEach(elem => {
            elem.remove();
        })
    })

    this.storage.EPOINTS = [];
    this.storage.POLYGONS = [];
    this.storage.LINKS = [];
    this.storage.lines = [];
    this.storage.texts = {};
    this.storage.LEGDX = 0;
    this.storage.LEGDY = 0;
    this.storage.LEGDXREAL = 0;
    this.storage.LEGDYREAL = 0;



    const defaultCoord = [36.3928, -112.6304]; // Colorado River
    // preprocessing makes sure this exist
    const terrainData = data.Terrain_Data;
    const [lat, lng] = terrainData.site_center?.split(",").map(d => +(d.trim())) ?? defaultCoord;
    const radius = +(terrainData.site_radious ?? 0.1);
    const zoomLevel = +(terrainData.zoomlevel ?? 15);
    const opacity = +(terrainData.opacity ?? 1);
    const terrain = ['Satellite', 'Wireframe', 'Solid Contours', 'Street Map', 'Street Map (with contours)'][terrainData.type];
    const resolution = terrainData.resolution ?? 'Standard';
    window['storedTerrainColor'] = terrainData.contours_color ?? '#999999';

    // original data
    this.storage.Terrain_Data = data.Terrain_Data;
    
    // parsed
    this.storage.terrainSettings = {
        axisHelper : terrainData.axis_helper,
        selectionMesh: true,
        lat : lat,
        lng : lng,
        opacity: opacity,
        radius : radius,
        terrain: terrain,
        // zoom: zoomLevel,
        resolution: resolution,
        ...(terrainData.type == 1 || terrainData.type == 2) && {terrainColor: window['storedTerrainColor']},
        flatTerrain: false
    }

    this.storage.mapSettings = {
        lat: lat,
        lng: lng,
        opacity: opacity,
        terrain: 'Satellite',
        //zoom: 20
    }

    // there isn't a way to correct the yz if it's wrong
    // since the only correct yz is associated with the boreholes
    // while those are just free points
    // they either are right from the start or nothing can be done
    this.eitherKey(data, 'EPOINTS', 'epoints')?.forEach(p => {
        p.correct_yz = p.yz;
        p.y = -p.correct_yz;
        p.originalX = p.x ?? p.xx;
    })
    this.eitherKey(data, 'POLYGONS', 'polygons')?.points?.forEach(p => {
        p.correct_yz = p.yz;
        p.y = -p.correct_yz;
    })

    // if (data.horScaleFt) {
    //     this.storage.d3_root.select(`.horScaleFt option[value='${data.horScaleFt}']`).property('selected', true);
    //     this.changeHorScale(+data.horScaleFt)
    // }
    // if (data.vertScaleFt) {
    //     this.storage.d3_root.select(`.vertScaleFt option[value='${data.vertScaleFt}']`).property('selected', true);
    //     this.changeVertScale(+data.vertScaleFt)
    // }

    // if (data.textSize) {
    //     this.storage.d3_root.select('.textSize').property("value", +data.textSize);
    //     this.changeTextSize();
    // }

    if (data.horScaleOption) {
        this.storage.horScaleOption = data.horScaleOption;
    }
    if (data.vertScaleOption) {
        this.storage.vertScaleOption = data.vertScaleOption;
    }


    this.refreshTexts();
    this.initializeHatchColors();
    if (data.hatchColors) {
        // this.storage.hatchColors = new Map(Object.entries(data.hatchColors));
        var hatchColorObj = {};
        this.storage.hatchColors.forEach((value, item) => {
            if (!!data.hatchColors[item])
                hatchColorObj[item] = data.hatchColors[item];
            else
                hatchColorObj[item] = value;
        })

        this.storage.hatchColors = new Map(Object.entries(hatchColorObj));
    }
    this.storage.fieldTestProperties = data.fieldTestProperties;
    while (typeof this.storage.fieldTestProperties == "string") {
        this.storage.fieldTestProperties = JSON.parse(this.storage.fieldTestProperties);
    }
    if (data.boreholeProperties) {
        this.storage.boreholeProperties = data.boreholeProperties;
    }
    if (data.polygonProperties) {
        this.storage.polygonProperties = data.polygonProperties;
    }
    if (data.linkProperties) {
        this.storage.linkProperties = data.linkProperties;
    }
    if (data.lineProperties) {
        this.storage.lineProperties = data.lineProperties;
    }

    this.storage.data0 = data.data
    this.storage.title = data.title
    this.storage.sectionId = data.id ?? '';
    this.storage.otherTestHoles = data.otherTestHoles ?? '';
    this.storage.otherTestHolesData = [];
    if (this.storage.otherTestHoles) {
        d3.json(this.storage.otherTestHoles, (json) => {
            this.storage.otherTestHolesData = this.preProcessBoreholeJson(json);
            this.initializePropertyGrid();
        })
    }
    this.storage.otherCrossSections = data.otherCrossSections ?? [];
    this.storage.otherCrossSectionsData = [];
    if (this.storage.otherCrossSections) {
        this.fetchOtherCrossSections(this.storage.otherCrossSections);
    }

    if (this.eitherKey(data, 'EPOINTS', 'epoints')) {
        this.storage.EPOINTS = this.eitherKey(data, 'EPOINTS', 'epoints');
        console.log("EPOINTS were grabbed")
    }
    if (this.eitherKey(data, 'POLYGONS', 'polygons')) {
        this.storage.POLYGONS = this.eitherKey(data, 'POLYGONS', 'polygons');
        this.storage.POLYGONS.forEach(poly => {
            poly.fsrc = this.correctImageUrl(poly.fsrc);
            poly.f = this.correctHatchFill(poly.f)
        })
        console.log("POLYGONS were grabbed")
    }
    if (data.texts) {
        this.storage.texts = data.texts;
    }
    // console.log(data.POLYGONS)

    this.storage.data0.forEach(bh => {
        if (!bh.ally) {
            bh.ally = []
        };
    });

    // fix data structure for lines and waterlines
    const fixLines = (lines) => {
        var allPoints = this.getAllPoints().concat(this.storage.data0.map(bh => bh.waterPoint).filter(e => e));
        lines.forEach(link => {
            const point1 = allPoints.find(realPoint => link.point1.timestamp == realPoint.timestamp)
                // || alert("broken data structure: not found point (1) " + JSON.stringify(link.point1))
            const point2 = allPoints.find(realPoint => link.point2.timestamp == realPoint.timestamp)
                // || alert("broken data structure: not found point (2) " + JSON.stringify(link.point2))
            
        
            if (point1 !== undefined && point2 !== undefined) {
                link.point1 = point1;
                link.point2 = point2;
                return;
            }
            // rebuild links since the data structure is broken
            console.log("Link data structure is broken, rebuilding links")

            // neighbour links share the same point
            const findNeighbourWithPoint = (point) => {
                const prevLink = this.getLinkData(link.prevLink)
                const nextLink = this.getLinkData(link.nextLink)
                const listOfCandidates = [prevLink?.point1, prevLink?.point2, nextLink?.point1, nextLink?.point2];
                const matchingCandidateIndex = listOfCandidates.findIndex(candidate => candidate && candidate.timestamp == link.point1.timestamp);
                if (matchingCandidateIndex == -1) {
                    return null
                }
                return listOfCandidates[matchingCandidateIndex];
            }

            const linkPointToPoint = point => {
                const newPoint = {
                    timestamp: this.storage.uniq(),
                    x: point.x,
                    xx: point.xx ?? point.x,
                    originalX: point.x ?? point.xx,
                    y: point.y,
                    yz: point.yz,
                    correct_yz: point.correct_yz,
                    iamextrapoint: true,
                    // list of this.storage.polygons the point belongs to
                    belongsToPoly: []
                };     // no this.storage.ZOOMSCALE here
                return newPoint;
            }

            if (point1 === undefined) {
                const newPoint = linkPointToPoint(link.point1);
                this.storage.EPOINTS.push(newPoint);
                link.point1 = newPoint;
                const neighbourWithPoint = findNeighbourWithPoint(link.point1);
                if (neighbourWithPoint) {
                    if (neighbourWithPoint.point1.timestamp == link.point1.timestamp) {
                        neighbourWithPoint.point1 = newPoint;
                    }
                    else {
                        neighbourWithPoint.point2 = newPoint;
                    }
                }
            }
            if (point2 === undefined) {
                const newPoint = linkPointToPoint(link.point2);
                this.storage.EPOINTS.push(newPoint);
                link.point2 = newPoint;
                const neighbourWithPoint = findNeighbourWithPoint(link.point2);
                if (neighbourWithPoint) {
                    if (neighbourWithPoint.point1.timestamp == link.point2.timestamp) {
                        neighbourWithPoint.point1 = newPoint;
                    }
                    else {
                        neighbourWithPoint.point2 = newPoint;
                    }
                }
            }
        })
    }

    if (this.eitherKey(data, 'LINKS', 'links')) {
        this.storage.LINKS = this.eitherKey(data, 'LINKS', 'links');
        console.log("LINKS were grabbed")
        fixLines(this.storage.LINKS);
    }
    if (this.eitherKey(data, 'LINES', 'lines')) {
        this.storage.lines = this.eitherKey(data, 'LINES', 'lines');
        console.log("lines were grabbed")
        fixLines(this.storage.lines);
    }

    if (data.fieldTestWidths) {
        this.storage.fieldTestWidths = data.fieldTestWidths;
    }

    if (data.legendNames) {
        this.storage.legendNames = data.legendNames;
    }

    this.storage.figure_templates = data.figure_templates ?? '';

    //var allTimestamps = this.findValues(this.storage.data0, 'timestamp')
    var allTimestamps = this.findValues(data, 'timestamp')

    var tsMax = Math.max(...allTimestamps, 0)
    this.storage.uniq = this.uniqGen(1 + tsMax)

    /*
    var ppp1 = (x, z, depth, a, bhw) => [
      xPlunge(x, depth, a) - bhw/2, // * Math.sin(rads(a)),
      yPlunge(z, depth, a) // + bhw/2 * Math.cos(rads(a))
    ];
    var ppp2 = (x, z, depth, a, bhw) => [
      xPlunge(x, depth, a) + bhw/2, // * Math.sin(rads(a)),
      yPlunge(z, depth, a) // - bhw/2 * Math.cos(rads(a))
    ];
    */

    // if (data.boreholeWidth) this.storage.d3_root.select('.bw').property("value", +data.boreholeWidth);
    // var bhScale = +this.storage.d3_root.select('.bw').property("value");
    let bhScale = this.storage.boreholeWidth;

    this.updateAllyAndPointData();

    if (data.fillUsedForLegend) {
        console.log("grab legend info")
        data.fillUsedForLegend.forEach(x => {
            x.src = this.correctImageUrl(x.src);
        })
        // data.fillUsedForLegend.forEach(e => legendSrc2text.set(e.src, e))
    }

    if (this.eitherKey(data, 'LEGDX', 'legdx') && this.eitherKey(data, 'LEGDY', 'legdy')) {
        this.storage.LEGDX = this.eitherKey(data, 'LEGDX', 'legdx');
        this.storage.LEGDY = this.eitherKey(data, 'LEGDY', 'legdy');

        this.storage.LEGDXREAL = this.storage.LEGDX / this.storage.AX;
        this.storage.LEGDYREAL = this.storage.LEGDY / this.storage.AY;
    }
    // separated condition for backwards compatibility
    if (this.eitherKey(data, 'LEGDXREAL', 'legdxreal') && this.eitherKey(data, 'LEGDYREAL', 'legdyreal')) {
        this.storage.LEGDXREAL = this.eitherKey(data, 'LEGDXREAL', 'legdxreal');
        this.storage.LEGDYREAL = this.eitherKey(data, 'LEGDYREAL', 'legdyreal');

        this.storage.LEGDX = this.storage.LEGDXREAL * this.storage.AX;
        this.storage.LEGDY = this.storage.LEGDYREAL * this.storage.AY;
    }

    this.firstDraw();

    if (this.eitherKey(data, 'REGCX', 'regcx') && this.eitherKey(data, 'REGCY', 'regcy')) {
        this.changeSvgWindowCenter(this.eitherKey(data, 'REGCX', 'regcx'), this.eitherKey(data, 'REGCY', 'regcy'))
    }

    this.storage.legendBoxW = parseFloat(data.W ?? data.legendBoxW ?? this.storage.legendBoxW);
    this.storage.legendBoxH = parseFloat(data.xH ?? data.legendBoxH ?? this.storage.legendheight);

    window['dispose'](this.storage.viewer3d);
    this.storage.rootElem?.querySelector('.open2d').click();
    this.refreshLegend();
    this.updateScales();
    //if (data.legendTransform) this.storage.d3_root.select(".legend").attr("transform", data.legendTransform)
    this.updateModalHeader();
    this.zoomExtent();

    if(data.ShowGridlines != null && data.ShowGridlines !== '') {
        this.storage.ShowGridlines = data.ShowGridlines;
        this.coordUpd();
        const gridButton = this.storage.rootElem.querySelector(".toggleGridButton");
        if (! this.storage.ShowGridlines) {
            gridButton?.classList.add(this.storage.toggledOffClass);
        }
        else {
            gridButton?.classList.remove(this.storage.toggledOffClass);
        }
    }
    console.log('data', data.ShowGridlines, this.storage.ShowGridlines)

    this.initializePropertyGrid();

    const distanceInterval = this.getHorAxisTicksDistance();
    if (! data.boreholeWidth) {
        this.storage.boreholeWidth = Math.max(distanceInterval / 5, 1);
        this.redrawHatched();
    }

    this.resetPositionsIfNecessary();
    this.showWarningIfLegendBoxTooFar();
}

CrossSectionCanvas.prototype.processFileWithRedraw = function (fileHandler) {
    /* Receives a json file name, processes its data and draws the corresponding canvas */
    d3.json(fileHandler, this.processDataWithRedraw);
};

CrossSectionCanvas.prototype.finishDrawingLines = function (isWater = true) {
    /* Pushes the lines being drawn in the moment to the global lines variable, meaning they are "permanent" now.
    */
    let lines = this.storage.waterLinksBeingDrawn;
    let propertiesDict = this.storage.linkProperties;
    let defaultProperties = this.storage.waterlineDefaultProperties;
    if (! isWater) {
        lines = this.storage.linesBeingDrawn;
        propertiesDict = this.storage.lineProperties;
        defaultProperties = this.storage.lineDefaultProperties;
    }

    if (!lines || lines.length <= 0) {
        return null;
    }

    // link references the next to allow removal of entire waterline

    let prevLink = null;
    lines.forEach(link => {
        link.prevLink = prevLink?.timestamp;
        if (prevLink) {
            prevLink.nextLink = link?.timestamp;
        }
        prevLink = link;
    });

    if (isWater) {
        this.storage.LINKS = this.storage.LINKS.concat(lines);
    }
    else {
        this.storage.lines = this.storage.lines.concat(lines);
    }
    lines.forEach(link => {
        if (! link?.timestamp){
            return;
        }
        propertiesDict[link.timestamp] = this.cloneObject(defaultProperties)
    })
    const lastLink = lines[lines.length - 1];
    const d = lines.find(link => link.timestamp == lastLink.timestamp);
    
    this.endDrawModes();
    this.openLinePropertyGrid(d, isWater, true);

    return d;
}

CrossSectionCanvas.prototype.clearLinksBeingDrawn = function () {
    /* Clears the variableS containing the this.storage.links that the user has been drawing. This function does not redraw the canvas */
    this.storage.waterLinksBeingDrawn = [];
    this.storage.linksBeingDrawn = [];
    this.storage.linesBeingDrawn = [];
}

function uniq(arr) {
    if (! arr) {
        return null;
    }
    return [...new Set(arr)];
}

function countOcurrences(arr) {
    return arr.reduce(function (acc, curr) {
        if (! acc[curr]) {
            acc[curr] = 1;
        }
        else {
            acc[curr] = acc[curr] + 1;
        }
        return acc;
      }, {});
}

CrossSectionCanvas.prototype.onDoubleClick = function (elem) {
    if (! elem) {
        return;
    }
    this.zoomExtentOfElement(elem, true);
}

CrossSectionCanvas.prototype.initializeDoubleClick = function (elemArr) {
    elemArr.forEach(node => {
        node.addEventListener('dblclick', (event) => {
            this.onDoubleClick(node)
        })
    })
}

// set polygon hatch based on polygons it's connected to
CrossSectionCanvas.prototype.decidePolygonHatch = function (polygon) {
    if (! polygon) {
        return null;
    }
    polygon = this.storage.POLYGONS.find(x => x.timestamp == polygon.timestamp) ?? polygon;
    const allSoilLayers = polygon.points?.map(point => {
        const boreholeName = point?.bhname;
        const properties = this.boreholeNameToProperties(boreholeName);
        const allies = properties?.ally ?? [];
        const ally = allies.find(x => x.timestamp == point.timestamp);
        const soillayers = ally?.soillayers_timestamps.map(timestamp => {
            return properties?.soillayer?.find(soillayer => soillayer.timestamp == timestamp);
        });
        return soillayers;
    }).flat().filter(x => x) ?? [];
    const soillayersTimestamps = allSoilLayers.map(x => x.timestamp);
    const count = countOcurrences(soillayersTimestamps) ?? {};

    const sharesSideWithSoillayer = uniq(allSoilLayers).filter(data => {
        return count[data.timestamp] >= 2;
    });
    const layerSymbols = sharesSideWithSoillayer.map(soillayer => {
        const layerSymbol = soillayer.layerSymbol;
        return layerSymbol
    });
    const layerSymbolCandidates = uniq(layerSymbols);
    if (layerSymbolCandidates.length == 1) {
        const layerSymbol = layerSymbolCandidates[0];
        this.setPolygonHatchPattern(polygon.timestamp, layerSymbol);
        const properties = this.storage.polygonProperties[polygon.timestamp];
        if (properties) {
            properties.fillStyle = "Pattern";
        }
        return layerSymbol;
    }
    // 0 hatch candidates or 2 or more hatch candidates
    return null;
}

CrossSectionCanvas.prototype.startDrawPolygonMode = function () {
    if (this.storage.drawPolygonMode) {
        return;
    }
    this.endDrawModes();
    this.cancelSelection();
    
    const button = this.storage?.rootElem?.querySelector('.drawPolygon');
    const tooltip = this.storage?.rootElem?.querySelector(".drawPolygonTooltip");
    this.disableButton(button);
    this.storage.drawPolygonMode = true;
    tooltip?.classList?.remove(tooltipHiddenClass);
}

// aux function that is called on endDrawModes
CrossSectionCanvas.prototype.endDrawPolygonMode = function () {
    if (! this.storage.drawPolygonMode) {
        return;
    }
    this.storage.rootElem.querySelector(".drawtooltip").classList.add(tooltipHiddenClass);
    const button = this.storage?.rootElem?.querySelector('.drawPolygon');
    const tooltip = this.storage?.rootElem?.querySelector(".drawPolygonTooltip");
    this.enableButton(button);
    tooltip?.classList?.add(tooltipHiddenClass);
}


CrossSectionCanvas.prototype.toggleDrawPolygonMode = function () {
    if (this.storage.drawPolygonMode) {
        this.endDrawModes();
    }
    else {
        this.startDrawPolygonMode();
    }
}

CrossSectionCanvas.prototype.finishDrawingPolygon = function () {
    if (this.storage.CONNECTPOINTS.length <= 2) {
        return;
    }
    const newPoly = {
        poly: true, timestamp: this.storage.uniq(), points: this.storage.CONNECTPOINTS
    };
    this.storage.POLYGONS.push(newPoly)

    const connectPointsTimestamps = {};
    this.storage.CONNECTPOINTS.forEach(p => {
        connectPointsTimestamps[p.timestamp] = p.timestamp;
    })
    // adds to list of this.storage.polygons the point belongs to
    this.storage.d3_root.selectAll("freepoint").filter(d =>
        d.timestamp in connectPointsTimestamps)
        .attr("belongsToPoly", b => {
            b.push(newPoly);
            return b;
        })

    const properties = this.cloneObject(this.storage.polygonDefaultProperties);
    this.storage.polygonProperties[newPoly.timestamp] = properties;
    this.decidePolygonHatch(newPoly);
    const d = newPoly;

    this.endDrawModes();
    this.openPolygonPropertyGrid(d);
}

CrossSectionCanvas.prototype.onkeydown = function (event) {
    if (event.defaultPrevented) {
        return false; // Do nothing if the event was already processed
    }

    switch (event.key) {
        //case "E": case "e":
        //  break;
        case "Escape":
            if (this.storage.drawPolygonMode || this.storage.WATERFRONTMODE || this.storage.drawLineMode || this.storage.drawTextMode) {
                this.endDrawModes();
            }
            else if (this.areThereElementsSelected()) {
                this.cancelSelection();
                document.activeElement?.blur();
            }
            else {

                // Do something for "esc" key press.
                this.storage.svg1.call(this.storage.ZOOMER.transform, d3.zoomIdentity.scale(1));
            }
            break;
        case "Enter":
            let d = null;
            if (this.storage.CONNECTMODE) {
                // add new polygon
                if (this.storage.drawPolygonMode) {
                    // avoid drawing single lines
                    this.finishDrawingPolygon();
                }

                if (this.storage.WATERFRONTMODE) {
                    this.finishDrawingLines(true);
                }

                if (this.storage.drawLineMode) {
                    this.finishDrawingLines(false);
                }
            }

            break;
        default:
            return false; // Quit when this doesn't handle the key event.
    }

    if(document.activeElement?.tagName != 'TEXTAREA') {
        event.preventDefault();
    }
}

CrossSectionCanvas.prototype.exportToJson = function () {
    //var tttt = {23: 'reew', "re": ["34", 56]}

    var ob = {
        "version": "2.0",
        "title": this.storage.title
    }
    ob.id = this.storage.sectionId;
    ob.otherTestHoles = this.storage.otherTestHoles;
    ob.otherCrossSections = this.storage.otherCrossSections;
    ob.data = this.storage.data0.map(bh => {
        let timestamp = bh.soillayer[0].timestamp;
        if (this.storage.fieldTestPositions[timestamp]) {
            let positions = this.storage.fieldTestPositions[timestamp];
            bh.general.test_xx = positions.test_xx;
            bh.general.test_yz = positions.test_yz;
        }
        return bh;
    })

    ob.fieldTestWidths = this.storage.fieldTestWidths;
    ob.fieldTestProperties = JSON.stringify(this.storage.fieldTestProperties);
    ob.boreholeProperties = this.storage.boreholeProperties;

    ob.polygonProperties = this.storage.polygonProperties;

    ob.linkProperties = this.storage.linkProperties;
    ob.lineProperties = this.storage.lineProperties;
    ob.legendNames = this.storage.legendNames;
    ob.LINKS = this.storage.LINKS
    ob.lines = this.storage.lines
    ob.POLYGONS = this.storage.POLYGONS
    // ob.POLYGONS = this.storage.d3_root.selectAll(".polygon").data();
    ob.EPOINTS = this.storage.EPOINTS
    ob.texts = this.storage.texts

    // ilog
    //Reinit configuration
    // ob.SectionName = this.storage.title;
    ob.hatchColors = Object.fromEntries(Array.from(this.storage.hatchColors).filter(x => x[1] != "000000"));

    const fillUsedForLegend = this.getFillUsedForLegend();
    const legendHatches = fillUsedForLegend.map(dict => {
        if (! dict?.src) {
            return;
        }
        const {src} = dict;
        const category = getHatchCategory(src) ?? "";
        const coloredSrc = this.getColoredSrc(src);
        const color = this.pathToColor(coloredSrc) ?? "000000";
        const hatchSymbol = this.pathToName(src) ?? "";
        const displayText = this.getLegendDisplayText(hatchSymbol);
        const hatchDict = {
            src : src,
            category : category,
            hatchSymbol : hatchSymbol,
            color : color,
            displayText : displayText
        }

        return hatchDict
    })
    ob.legendHatches = legendHatches;
    
    ob.Terrain_Data =  { //this.storage.Terrain_Data
        "site_center": `${this.storage.terrainSettings.lat}, ${this.storage.terrainSettings.lng}`,
        "site_radious": this.storage.terrainSettings.radius.toString(),
        "zoomlevel": this.storage.Terrain_Data.zoomlevel,
        "type": ['Satellite', 'Wireframe', 'Solid Contours', 'Street Map', 'Street Map (with contours)'].indexOf(this.storage.terrainSettings.terrain).toString(),
        "contours_color": this.storage.terrainSettings.terrainColor,
        "axis_helper": this.storage.terrainSettings.axisHelper,
        'resolution': this.storage.terrainSettings.resolution
    };
    ob.figure_templates = this.storage.figure_templates;

    ob.boreholeWidth = this.storage.boreholeWidth
    ob.REGCX = this.storage.REGCX
    ob.REGCY = this.storage.REGCY

    //ob.legendTransform = this.storage.d3_root.select(".legend").attr("transform")
    ob.LEGDX = this.storage.LEGDX
    ob.LEGDY = this.storage.LEGDY
    ob.LEGDXREAL = this.storage.LEGDXREAL
    ob.LEGDYREAL = this.storage.LEGDYREAL
    ob.legendPinnedTo = this.storage.legendPinnedTo;
    ob.legendScaleBar = this.storage.legendScaleBar;
    ob.legendBackgroundColor = this.storage.legendBackgroundColor;
    ob.legendHasBorder = this.storage.legendHasBorder;
    ob.legendBorderColor = this.storage.legendBorderColor;
    ob.legendBoxFontSize = this.storage.legendBoxFontSize;
    ob.legendBoxFontFamily = this.storage.legendBoxFontFamily;

    ob.Unit = this.storage.Unit;
    ob.ProjectDepth_Unit = this.getProjectDepthUnit();
    ob.Coordinates_Unit = this.getCoordinateUnit();
    ob.horScaleOption = this.storage.horScaleOption;
    ob.vertScaleOption = this.storage.vertScaleOption;
    ob.GridlineThickness = this.storage.GridlineThickness
    ob.LineThickness = this.storage.LineThickness
    ob.PointSize = this.storage.PointSize;
    ob.pointLineColor = this.storage.pointLineColor,
    ob.pointHasFill = this.storage.pointHasFill,
    ob.pointFillColor = this.storage.pointFillColor,
    ob.WaterSymbolSize = this.storage.WaterSymbolSize;
    ob.HatchScale = this.storage.HatchScale;
    ob.legendBoxW = this.storage.legendBoxW;
    ob.legendBoxH = this.storage.legendBoxH;
    ob.legendBoxFontSize = this.storage.legendBoxFontSize;
    ob.legendBoxFontFamily = this.storage.legendBoxFontFamily;
    ob.legendBoxText = this.storage.legendBoxText;
    ob.legendBoxNumberOfColumns = this.storage.legendBoxNumberOfColumns;
    ob.ShowGridlines = this.storage.ShowGridlines ?? true;
    ob.axisHorText = this.storage.axisHorText;
    ob.axisHorFontFamily = this.storage.axisHorFontFamily;
    ob.axisHorFontSize = this.storage.axisHorFontSize;
    ob.axisVertText = this.storage.axisVertText;
    ob.axisVertFontFamily = this.storage.axisVertFontFamily;
    ob.axisVertFontSize = this.storage.axisVertFontSize;
    ob.interrogationPointFontSize = this.storage.interrogationPointFontSize;

    // do not include some util fields
    const replacer = (key, value) => {
        if (['p1LT', 'p2RT', 'p3LB', 'p4RB'].includes(key)) return undefined;
        else return value;
    }

    let dataStr = JSON.stringify(ob, replacer, 4);
    return dataStr
}

function download(blob, filename) {
    const link = document.createElement( 'a' );
    link.style.display = 'none';
    document.body.appendChild( link ); // Firefox workaround, see #6594
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function downloadString(text, filename) {
    download( new Blob( [ text ], { type: 'text/plain' } ), filename );
}

CrossSectionCanvas.prototype.exportRSSectionMaker = async function (boreholeWidth = 2) {
    const json = JSON.parse(this.exportToJson());

    const removeKeys = (dict, keysArr) => {
        keysArr.forEach(key => {
            if (key in dict) {
                delete dict[key];
            }
        })
    }

    removeKeys(json, ["id", "otherTestHoles", "otherCrossSections", "figure_templates", "fieldTestWidths", "fieldTestProperties", "boreholeProperties", "EPOINTS",
    "LEGDX", "LEGDY", "fillUsedForLegend"]);

    json.data.forEach(boreholeData => {
        const th_profile_coordinates = `${boreholeData.general.x}, ${boreholeData.general.z}`;
        boreholeData.general.th_profile_coordinates = th_profile_coordinates;

        removeKeys(boreholeData, ["id", "ally", "waterPoint"]);
        removeKeys(boreholeData.general, ["x", "z", "disp_w", "test_yz", "test_xx"])
        boreholeData?.soillayer.forEach(layer => {
            removeKeys(layer, ["timestamp"]);
        })

        const order = ["water", "th_profile_coordinates", "th_viewer_coordinates"];
        const orderDict = {};
        order.forEach((key, index) => {
            orderDict[key] = index;
        })

        const sortedEntries = Object.entries(boreholeData.general).sort((a, b) => {
            const orderA = orderDict[a[0]] ?? 9999;
            const orderB = orderDict[b[0]] ?? 9999;
            return orderA - orderB;
        })

        boreholeData.general = Object.fromEntries(sortedEntries);
    })

    const { scene } = await window['generateMeshesWithoutMoving'](this) ?? {};
    let polygonPoints3D = window['get3DPolygonPoints'](scene);

    json.POLYGONS.forEach(polygonData => {
        removeKeys(polygonData, ["f", "poly"]);
        polygonData.points.forEach(point => {
            const borehole = this.boreholeNameToProperties(point.bhname);
            const boreholeX = borehole?.general?.x;
            let x = parseFloat(point.xx ?? point.x) + 0;
            if (boreholeX != null) {
                const offset = boreholeWidth / 2;
                const sign = ! point.left ? 1 : -1;
                x = boreholeX + sign * offset;
            }
            const y = parseFloat(point.correct_yz ?? point.yz) + 0;
            const coordinate = [x, y];
            
            removeKeys(point, ["y", "x", "bhname", "left", "yz", "correct_yz", "xx", "belongsToPoly", "timestamp", "soillayers_timestamps"])

            point.coordinate = coordinate;
        })
        polygonData.points2D = polygonData.points;
        delete polygonData['points'];
        if (polygonPoints3D[polygonData.timestamp]) {
            polygonData.points3D = polygonPoints3D[polygonData.timestamp];
        }
    })

    return JSON.stringify(json, null, 4);
}

CrossSectionCanvas.prototype.downloadToDXFHatch = async function (boreholeWidth = 2) {
    const modalElem = this.storage.rootElem.querySelector('.dxfHatchModal');
    const printModalButton = modalElem.querySelector('.onClickDXFHatch');

    printModalButton.onclick = async () => {
        if (printModalButton.disabled) {
            return;
        }
        let hatchMessage = document.getElementById('dxfHatchMessage');
        
        if(hatchMessage) 
            hatchMessage.innerHTML = 'Generating the DXF file, please wait ...';


        setTimeout(async () => {
            const str = await this.exportRSSectionMaker(boreholeWidth);
            const hatchScale = this.storage.rootElem.querySelector('#hatchScale').value;    
            const dxfData = await window['dxfHatch'](JSON.parse(str), parseInt(hatchScale, 10));
    
            
            const buttons = Array.from(modalElem.querySelectorAll('.btn'));
            buttons.forEach(x => {
                x.disabled = true;
            })
    
            const closeModal = () => $(modalElem).modal('hide');
            closeModal();
    
            buttons.forEach(x => {
                x.disabled = false;
            })
    
            if(hatchMessage) 
                hatchMessage.innerHTML = '';
        }, 500);
    };

    // replaces default behavior since it was also closing the crossSection modal
    const closeButtons = [
        modalElem.querySelector("button.close"),
        modalElem.querySelector(".closeButton")
    ]
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (button.disabled) {
                return;
            }
            $(modalElem).modal('hide');
        })
    })

    $(modalElem).modal({
        show: true,
        backdrop: false
    });
}

CrossSectionCanvas.prototype.downloadToDXF = async function (boreholeWidth = 2) {
    let spinner = this.storage.rootElem?.querySelector('.exportingFile');
    spinner.style.display = 'inline-block';

    let label = this.storage.rootElem?.querySelector('.exportingFileText');
    label.innerText = 'Exporting to DXF ...';
    label.style.display = 'inline-block';

    const str = await this.exportRSSectionMaker(boreholeWidth);
    window['CreateDXF_fromRSjson'](JSON.parse(str));

    label.style.display = 'none';
    spinner.style.display = 'none';
}

CrossSectionCanvas.prototype.downloadRSSectionMakerJson = async function (boreholeWidth = 2) {
    let spinner = this.storage.rootElem?.querySelector('.exportingFile');
    spinner.style.display = 'inline-block';

    let label = this.storage.rootElem?.querySelector('.exportingFileText');
    label.innerText = 'Exporting to JSON ...';
    label.style.display = 'inline-block';

    const str = await this.exportRSSectionMaker(boreholeWidth);
    const filename = this.getTitle();
    downloadString(str, `RS - ${filename}.json`);

    label.style.display = 'none';
    spinner.style.display = 'none';
}

CrossSectionCanvas.prototype.getTitle = function () {
    return this?.storage.title ?? 'Section';
}

CrossSectionCanvas.prototype.exportDrawingsToJsonFile = function () {
    let spinner = this.storage.rootElem?.querySelector('.exportingFile');
    spinner.style.display = 'inline-block';

    let label = this.storage.rootElem?.querySelector('.exportingFileText');
    label.innerText = 'Exporting to JSON ...';
    label.style.display = 'inline-block';

    let dataStr = this.exportToJson();

    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    // let exportFileDefaultName = 'laststate.json';
    let exportFileDefaultName = `${this.getTitle() || "laststate"}.json`

    // let linkElement = document.createElement('a');
    let linkElement = this.storage.rootElem.querySelector('.aexpjson')
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);

    linkElement.click();
    label.style.display = 'none';
    spinner.style.display = 'none';
}

CrossSectionCanvas.prototype.exportDrawingsToServer = function () {
    let dataStr = this.exportToJson()

    // TODO ADD WORKING URL (POST JSON)
}

CrossSectionCanvas.prototype.loadDrawingsFromJsonFile = function () {
    console.log("load drawings...")
    alert("TODO? May be implemented")
}

// =====================================


CrossSectionCanvas.prototype.handleMouseClickPoint = function (d, svg) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    this.mouseClick(d, svg);
}

CrossSectionCanvas.prototype.isInDrawMode = function () {
    return this.storage.drawPolygonMode || this.storage.WATERFRONTMODE || this.storage.drawLineMode || this.storage.drawTextMode;
}

// mouse click on already existing point
CrossSectionCanvas.prototype.mouseClick = function (d, svg) {
    console.log("MOUSE", d)
    if (this.storage.drawPolygonMode || this.storage.WATERFRONTMODE || this.storage.drawLineMode) {
        // first mouse click
        if (! this.storage.CONNECTPOINTS || this.storage.CONNECTPOINTS.length == 0) {
            this.storage.CONNECTMODE = d;
            this.storage.CONNECTPOINTS = [d];
            this.drawExtraPoints(svg);
            return;
        }
    }

    if (this.storage.drawPolygonMode) {
        
        if (this.storage.CONNECTMODE === d) {
            // clicked at same point as last time, finish polygon
            this.finishDrawingPolygon();

        }
        else
        {
            // clicked in a different point, write new link to storage
            this.storage.linksBeingDrawn.push({
                link: true, timestamp: this.storage.uniq(), point1: this.storage.CONNECTMODE, point2: d, water: false
            })
            //alert('new link!!!')
            this.storage.CONNECTMODE = d;
            this.storage.CONNECTPOINTS.push(d)

            this.drawExtraPoints(svg)
            this.drawLinks(svg);
        } 
    }
    // drawing waterlink
    else if (this.storage.WATERFRONTMODE) {
        if (this.storage.CONNECTMODE === d) {
            // clicked at same point as last time, finish
            this.finishDrawingLines(true);
        }
        else {
            this.storage.waterLinksBeingDrawn.push({
                link: true, timestamp: this.storage.uniq(), point1: this.storage.CONNECTMODE, point2: d, water: true
            })
            this.storage.CONNECTMODE = d;
            this.storage.CONNECTPOINTS.push(d)
            
            this.drawExtraPoints(svg)
            this.drawLinks(svg);
        }
    }
    else if (this.storage.drawLineMode) {
        if (this.storage.CONNECTMODE === d) {
            // clicked at same point as last time, finish
            this.finishDrawingLines(false);
        }
        else {
            this.storage.linesBeingDrawn.push({
                link: true, timestamp: this.storage.uniq(), point1: this.storage.CONNECTMODE, point2: d, water : false
            })
            this.storage.CONNECTMODE = d;
            this.storage.CONNECTPOINTS.push(d)
            
            this.drawExtraPoints(svg)
            this.drawLinks(svg);
        }
    }
    else {
        this.openPointPropertyGrid(d?.timestamp);
    }
    this.getAllPoints();
}

CrossSectionCanvas.prototype.getAllPoints = function () {
    //var pts = [].concat.apply([], this.storage.data0.map(bh => bh.ally))  // timestamp y yz x bhname
    var pts = [].concat.apply(this.storage.EPOINTS, this.storage.data0.map(bh => bh.ally))  // timestamp y yz x bhname
    if (!!this.storage.EPOINTS && this.storage.EPOINTS.length > 0) {
        this.storage.d3_root.selectAll(".point").data(pts, p => p.timestamp)
            .classed("waitforconnect", pt => pt == this.storage.CONNECTMODE)
    }
    return pts;
}


//================================= drag extra points



//.on('start', dragStartedExtraPoint)        // cache init values
// generators are used because this is going to be passed to d3 drag on, which uses the word this
CrossSectionCanvas.prototype.draggedExtraPointGenerator = function () {
    let CrossSectionObj = this;

    return function (d) {
        const coordinateUnitFactor = CrossSectionObj.getCoordinateUnitFactor();
        //console.log('DRAGGED')
        // this is the elem that invoked the function
        var current = d3.select(this);
        // d.x = EPX + (d3.event.x - this.storage.dragStartX);
        // d.yz = EPY + (d3.event.y - dragStartY);
        const dx = d3.event.dx / CrossSectionObj.storage.AX;
        const dy = d3.event.dy / CrossSectionObj.storage.AY;
        const dxCoordinateUnitFactor = dx / coordinateUnitFactor;
        const dyCoordinateUnitFactor = dy / coordinateUnitFactor;
        d.x += dxCoordinateUnitFactor;
        d.originalX += dxCoordinateUnitFactor;
        d.yz -= dyCoordinateUnitFactor;
        d.xx += dx;
        d.correct_yz -= dy;

        let translateX = d.xx * CrossSectionObj.storage.AX + CrossSectionObj.cornerExtraOffset();
        let translateY = - d.correct_yz * CrossSectionObj.storage.AY + CrossSectionObj.cornerExtraOffset();
        //current.attr("cx", d.x*CrossSectionObj.storage.AX).attr("cy", d.yz*CrossSectionObj.storage.AY)   // circle
        current.attr("x", translateX)
            .attr("y", translateY)

        // redraw paths
        CrossSectionObj.drawLinks(CrossSectionObj.storage.svg1)
        CrossSectionObj.drawPolygons(CrossSectionObj.storage.svg1)

        // find text of only one dragged point
        CrossSectionObj.storage.d3_root.selectAll(".layery").data([d], p => p.timestamp)
            .attr("x", d.x * CrossSectionObj.storage.AX - 9).attr("y", -d.correct_yz * CrossSectionObj.storage.AY)
    }
}

CrossSectionCanvas.prototype.mergeClosePoints = async function (timestamp) {
    if (timestamp == null) {
        return;
    }
    const point1 = this.storage?.EPOINTS?.find(p => p.timestamp == timestamp);
    // orthogonal distance where points touch
    const mergeDistancePixels = this.cornerWH();
    if (! point1) {
        return;
    }

    const closePoints = [];
    const isPointClose = point2 => {
        if (point2?.timestamp == timestamp) {
            return false;
        }
        // value defaults are 0 and 9999 so they don't touch by default
        const p1x = point1.xx ?? point1.x ?? 0;
        const p2x = point2.xx ?? point2.x ?? 9999;
        const p1y = point1.correct_yz ?? point1.yz ?? point1.y ?? 0;
        const p2y = point2.correct_yz ?? point2.yz ?? point2.y ?? 9999;
        const dxPixels = Math.abs((p2x - p1x) * this.storage.AX);
        const dyPixels = Math.abs((p2y - p1y) * this.storage.AY);
        const chessBoardDistance = Math.max(dxPixels, dyPixels);
        const areClose = chessBoardDistance < mergeDistancePixels;
        return areClose;
    }
    this.storage.EPOINTS.forEach(point2 => {
        const areClose = isPointClose(point2);
        if (areClose) {
            closePoints.push(point2);
        }
    })

    const allAllies = this.storage.data0.map(borehole => borehole.ally ?? []).flat();
    const closeAllies = [];
    allAllies.forEach(ally => {
        const areClose = isPointClose(ally);
        if(areClose) {
            closeAllies.push(ally);
        }
    });
    const allowBoreholeMerge = closePoints.length == 0 && closeAllies.length == 1;

    const allClosePoints = [...closePoints, ...closeAllies];
    const closePointsTimestampsDict = Object.fromEntries(allClosePoints.map(point => [point.timestamp, true]));

    // get which points will be removed from certain polygons
    // later, the points that aren't in any polygons will be removed by removeOrphanPoints
    let willGenerateOrphanPolygonPoint = false;
    // example: triangle, merge between diagonals of square
    let willFailForPolygonWithMoreThanTwoPointsThatShouldMerge = false;
    const polygonsToMerge = [];
    const polygonsWithASingleMergePoint = [];
    this.storage.POLYGONS.forEach(polygon => {
        if (! polygon?.points) {
            return;
        }
        const pointsToMerge = [];
        polygon.points.forEach((point, index) => {
            if(point.timestamp in closePointsTimestampsDict || point.timestamp == timestamp) {
                pointsToMerge.push({
                    index: index,
                    point : point,
                })
            }
        })
        if (pointsToMerge.length == 1) {
            polygonsWithASingleMergePoint.push({
                polygon: polygon,
                pointsToMerge: pointsToMerge
            })
        }
        if (pointsToMerge.length > 2) {
            willFailForPolygonWithMoreThanTwoPointsThatShouldMerge = true;
        }
        if (pointsToMerge.length != 2) {
            return;
        }
        const indexes = pointsToMerge.map(dict => dict.index);
        const minimumIndex = indexes[0];
        const maximumIndex = indexes[indexes.length - 1];
        // points 2 and 5 selected, polygon has 7 points from 0 to 6
        // 0 1 (2) 3 4 (5) 6
        // there are 2 points between 2 and 5
        // and 3 points between 5 and 2
        const difference1 = maximumIndex - minimumIndex -1;
        const difference2 = (polygon.points.length - 1 - maximumIndex) + minimumIndex;

        const differenceIsOne = difference1 == 1 || difference2 == 1;
        const pointsAreNeighbours = difference1 == 0 || difference2 == 0;
        let orphanPointsIndexes = [];
        if (difference1 == 1) {
            orphanPointsIndexes.push(minimumIndex + 1);
        }
        if (difference2 == 1) {
            if (minimumIndex == 1) {
                orphanPointsIndexes.push(0);
            }
            else {
                orphanPointsIndexes.push(polygon.points.length - 1);
            }
        }
        // won't merge because otherwise will delete polygon
        if (polygon.points.length - orphanPointsIndexes.length < 3) {
            willFailForPolygonWithMoreThanTwoPointsThatShouldMerge = true;
            return;
        }
        if (differenceIsOne) {
            willGenerateOrphanPolygonPoint = true;
        }
        if (differenceIsOne || pointsAreNeighbours) {
            polygonsToMerge.push({
                polygon: polygon,
                pointsToMerge: pointsToMerge,
                orphanPointsIndexes: orphanPointsIndexes
            })
        }
        // all other cases: no merge, doesn't make sense to merge opposing points
        // in a polygon for example
        else {
            willFailForPolygonWithMoreThanTwoPointsThatShouldMerge = true;
        }
    })

    if (willFailForPolygonWithMoreThanTwoPointsThatShouldMerge) {
        return;
    }

    const linesToMerge = [];
    const allLines = [...this.storage.LINKS, ...this.storage.lines];
    allLines.forEach(line => {
        if (! line) {
            return;
        }
        const shouldMerge = (line.point1.timestamp == timestamp && line.point2.timestamp in closePointsTimestampsDict) || (line.point2.timestamp == timestamp && line.point1.timestamp in closePointsTimestampsDict);
        if (shouldMerge) {
            linesToMerge.push(line);
        }
    });

    const pointInSingleLine = linesToMerge.some(line => {
        return line.prevLink == null && line.nextLink == null;
    });
    if (pointInSingleLine) {
        return;
    }

    if (willGenerateOrphanPolygonPoint) {
        let confirmed = false;
        await this.openConfirmModalAsync({
            title: "Merge",
            text: "Merging the points will cause points to be deleted in a polygon. Continue with the merge?",
            callback: () => {
                confirmed = true;
            }
        })
        if (! confirmed) {
            return;
        }
    }

    // the point that stays after the merge is always point1
    // this prevents weirdness when this function is triggered
    // after a point is placed on top of multiple points
    polygonsToMerge.forEach(dict => {
        const {polygon, pointsToMerge, orphanPointsIndexes} = dict;
        orphanPointsIndexes.forEach((index, i) => {
            polygon.points.splice(index - i, 1);
        })
        polygon.points = polygon.points.filter(point => {
            return ! (point.timestamp != timestamp && point.timestamp in closePointsTimestampsDict);
        })
    })
    polygonsWithASingleMergePoint.forEach(dict => {
        const {polygon, pointsToMerge} = dict;
        polygon.points[pointsToMerge[0].index] = point1;
    })

    const pointsAlreadyProcessed = {};
    linesToMerge.forEach(line => {
        const otherPoint = line.point1.timestamp == timestamp ? line.point2 : line.point1;
        // saved in case it's deleted or modified
        const otherPointTimestamp = otherPoint.timestamp;
        // line modified by previous iterations
        if ((line.point1.timestamp != timestamp && line.point2.timestamp != timestamp) || ! (otherPoint.timestamp in closePointsTimestampsDict)) {
            return;
        }
        if (otherPointTimestamp in pointsAlreadyProcessed) {
            return;
        }
        const lineTimestamps = this.getLinesPointBelongsTo(otherPointTimestamp);
        const lines = this.timestampsToLines(lineTimestamps);
        this.deletePointInLines(lines, otherPointTimestamp);
        pointsAlreadyProcessed[otherPointTimestamp] = true;
    })

    // merge so far is successful, therefore points from the same polygons
    // and links have already been merged, otherwise the function
    // would have returned

    // merge points from different polygons/links
    // any close point encountered will become point1
    // unless there's a single point to be merged and it's a borehole point
    // then point1 becomes the borehole point
    if (allowBoreholeMerge) {
        const ally = closeAllies[0];
        const polygonsThatWillAttachToBorehole = [];
        this.storage.POLYGONS.forEach(polygon => {
            const pointIndexes = [];
            let polygonWillAttach = false;
            polygon.points.forEach((point, index) => {
                if (point?.timestamp == timestamp) {
                    pointIndexes.push(index);
                }
                polygonWillAttach = true;
            });
            pointIndexes.forEach(index => {
                polygon.points[index] = ally;
            })
            if (polygonWillAttach) {
                polygonsThatWillAttachToBorehole.push(polygon);
            }
        })
        const allLinesAfterMerge = [...this.storage.LINKS, ...this.storage.lines];
        allLinesAfterMerge.forEach(line => {
            if (line.point1.timestamp == timestamp) {
                line.point1 = ally;
            }
            if (line.point2.timestamp == timestamp) {
                line.point2 = ally;
            }
        })
        polygonsThatWillAttachToBorehole.forEach(polygon => {
            this.decidePolygonHatch(polygon);
        })
    }
    else {
        this.storage.POLYGONS.forEach(polygon => {
            const pointIndexes = [];
            polygon.points.forEach((point, index) => {
                if (point?.timestamp in closePointsTimestampsDict) {
                    pointIndexes.push(index);
                }
            });
            pointIndexes.forEach(index => {
                polygon.points[index] = point1;
            })
        })
        const allLinesAfterMerge = [...this.storage.LINKS, ...this.storage.lines];
        allLinesAfterMerge.forEach(line => {
            if (line.point1.timestamp in closePointsTimestampsDict) {
                line.point1 = point1;
            }
            if (line.point2.timestamp in closePointsTimestampsDict) {
                line.point2 = point1;
            }
        })
    }
    

    this.drawExtraPoints(this.storage.svg1);
    this.drawPolygons(this.storage.svg1);
    this.drawLinks(this.storage.svg1);
    this.removeOrphanPoints();
}

//================================= dragtext


CrossSectionCanvas.prototype.dragStartedTextGenerator = function () {
    let CrossSectionObj = this;
    return function () {
        const elem = getRealDraggedText(this);
        const style = window.getComputedStyle(elem);
        const matrix = new DOMMatrixReadOnly(style.transform);
        CrossSectionObj.storage.dragStartMatrix = matrix;
        const mousePosition = CrossSectionObj.pixelPositionInRelationToOrigin(d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY);
        CrossSectionObj.storage.dragStartX = mousePosition[0];
        CrossSectionObj.storage.dragStartY = mousePosition[1];
    }
}

function getRealDraggedText (elem) {
    const closest = elem?.closest('.textContainer');
    if (closest) {
        return closest;
    }
    return elem;
}

CrossSectionCanvas.prototype.dragEndTextGenerator = function () {
    let CrossSectionObj = this;
    return function () {
        let current = d3.select(getRealDraggedText(this));
        let tr = current.attr("transform")
        console.log('dragend', current.data()[0])
        if (tr) current.data()[0].transform = tr;
    }
}

CrossSectionCanvas.prototype.draggedTextGenerator = function () {
    let CrossSectionObj = this;

    return function () {
        const elem = getRealDraggedText(this);
        let current = d3.select(elem);
        const previousTranslateX = CrossSectionObj.storage.dragStartMatrix.e ?? 0;
        const previousTranslateY = CrossSectionObj.storage.dragStartMatrix.f ?? 0;

        // we have to use the sourceEvent because d3.event.x is unreliable
        // if the data we assign to the object with d3 contains an x
        // d3.event.x will return that x instead of the real mouse position
        const mousePosition = CrossSectionObj.pixelPositionInRelationToOrigin(d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY);
        const translateX = mousePosition[0];
        const translateY = -mousePosition[1];
        current.attr("transform", `translate(${translateX} ${translateY})`)
    }
}

var elemBeingDragged = null;

CrossSectionCanvas.prototype.dragStartElemFactory = function (options = {propertyDictKey : 'texts'}) {
    const CrossSectionObj = this;
    return function () {
        const d3Box = d3.select(this);
        const box = d3Box.node();
        const timestamp = (d3Box?.data() ?? [])[0]?.timestamp;
        const properties = CrossSectionObj.storage[options.propertyDictKey][timestamp] ?? {};
        CrossSectionObj.storage.elemInitialProperties = properties;
        
        const eventX = d3.event.sourceEvent.clientX;
        const eventY = d3.event.sourceEvent.clientY;
        // for text elems, the translation is saved as x and y
        // for polygons, the translation isn't saved
        // during the drag, transform translate exists
        // at the end of the drag, the points are updated and transform translate is undone
        // therefore each drag is a new drag starting with translation 0, 0
        CrossSectionObj.storage.draggedTranslation = [0, 0];
        if (options.propertyDictKey == 'texts') {
            CrossSectionObj.storage.draggedTranslation = [properties.x, properties.y];
        }

        const textarea = box.querySelector('textarea');
        const rect = textarea?.getBoundingClientRect() ?? {};
        const gripPx = 18 * CrossSectionObj.storage.ZOOMSCALE;
        const minResizeX = Math.floor(rect.right - gripPx);
        const minResizeY = Math.floor(rect.bottom - gripPx);
        if (options.propertyDictKey == 'texts' && eventX >= minResizeX && eventY >= minResizeY) {
            CrossSectionObj.storage.textBoxIsResizing = true;
        }
        else {
            CrossSectionObj.storage.elemIsDragging = true;
        }
    }
}

CrossSectionCanvas.prototype.dragElemFactory = function (options = {elemClass : 'textBox', propertyDictKey : 'texts'}) {
    const CrossSectionObj = this;
    return function () {
        if (! d3.event || ! d3.event.sourceEvent) {
            return;
        }
        let elem = elemBeingDragged ?? this;
        if (! elem) {
            return;
        }
        // if element has been redrawed since dragged started
        if (! elem.parentNode) {
            const timestamp = (d3.select(elem)?.data() ?? [])[0]?.timestamp;
            elem = CrossSectionObj.storage.d3_root.selectAll('.' + options.elemClass)?.filter(d => d.timestamp = timestamp)?.node() ?? elem;
            elemBeingDragged = elem;
        }
        const coordinateUnitFactor = CrossSectionObj.getCoordinateUnitFactor();
        const d3Box = d3.select(elem);
        const box = d3Box.node();
        const timestamp = (d3Box?.data() ?? [])[0]?.timestamp;
        const propertiesDict = CrossSectionObj.storage[options.propertyDictKey];
        const properties = propertiesDict[timestamp] ?? propertiesDict.find(x => x.timestamp == timestamp) ?? {};
        if (CrossSectionObj.storage.elemIsDragging) {
            CrossSectionObj.storage.draggedTranslation[0] = CrossSectionObj.storage.draggedTranslation[0] + d3.event.dx / CrossSectionObj.storage.AX / coordinateUnitFactor;
            CrossSectionObj.storage.draggedTranslation[1] = CrossSectionObj.storage.draggedTranslation[1] - d3.event.dy / CrossSectionObj.storage.AY / coordinateUnitFactor;
            if (properties.x && properties.y) {
                properties.x = CrossSectionObj.storage.draggedTranslation[0];
                properties.y = CrossSectionObj.storage.draggedTranslation[1];
            }
            d3Box.attr("transform", `translate(${CrossSectionObj.storage.draggedTranslation[0] * CrossSectionObj.storage.AX * coordinateUnitFactor} ${- CrossSectionObj.storage.draggedTranslation[1] * CrossSectionObj.storage.AY * coordinateUnitFactor})`)
        }

        if (options.elemClass == 'textBox') {
            const textarea = box.querySelector('textarea');
            const minWidth = 1;
            const minHeight = 1;
            if (CrossSectionObj.storage.elemIsDragging) {
                properties.x = properties.x + d3.event.dx / CrossSectionObj.storage.AX / coordinateUnitFactor;
                properties.y = properties.y - d3.event.dy / CrossSectionObj.storage.AY / coordinateUnitFactor;
                d3Box.attr("transform", `translate(${properties.x * CrossSectionObj.storage.AX * coordinateUnitFactor} ${- properties.y * CrossSectionObj.storage.AY * coordinateUnitFactor})`)
            }
            if (CrossSectionObj.storage.textBoxIsResizing) {
                const currentWidth = (textarea.offsetWidth ?? 0) / CrossSectionObj.storage.AX / coordinateUnitFactor;
                const currentHeight = (textarea.offsetHeight ?? 0) / CrossSectionObj.storage.AY / coordinateUnitFactor;
                if (currentWidth && currentWidth >= minWidth) {
                    properties.boxWidth = currentWidth 
                }
                if (currentWidth && currentWidth >= minWidth) {
                    properties.boxHeight = currentHeight;
                }
                // actual resizing of element is taken care by the usual textarea behavior
                // the code above simply saves the data so it can be loaded later
            }
        }
    }
}

CrossSectionCanvas.prototype.dragEndElemFactory = function (options={callback : (timestamp) => null}) {
    const CrossSectionObj = this;
    return function () {
        CrossSectionObj.storage.elemIsDragging = false;
        CrossSectionObj.storage.textBoxIsResizing = false;
        elemBeingDragged = null;
        if (! d3.event || ! d3.event.sourceEvent) {
            return;
        }

        
        const d3Box = d3.select(this);
        const timestamp = (d3Box?.data() ?? [])[0]?.timestamp;

        if (timestamp) {
            options.callback(timestamp);
        }
    }
}
//================================= text edit


CrossSectionCanvas.prototype.textMouseClickGenerator = function () {
    const CrossSectionObj = this;
    return function (d, d3Elem) {
        d3.event.stopPropagation();
        d3.event.preventDefault();    // hide menu
        CrossSectionObj.storage.CURRENTTEXT = d;
        CrossSectionObj.storage.CURRENTTEXTSELECTION = d3.select(d3Elem);
        CrossSectionObj.openSvgTextPropertyGrid(d3Elem, d);
    }

}

CrossSectionCanvas.prototype.openTextTooltip = function (d3Elem, d) {
    if (this.isInDrawMode()) {
        return;
    }
    let CrossSectionObj = this;

    //console.log(d, d3.select(this))
    CrossSectionObj.storage.CURRENTTEXT = d;   // text
    CrossSectionObj.storage.CURRENTTEXTSELECTION = d3Elem;
    // const d3TextTooltip = CrossSectionObj.storage.d3_root.select(".texttooltip").style("visibility", "visible")
    //     .style("left", CrossSectionObj.storage.CLXMOUSE + 'px').style("top", CrossSectionObj.storage.CLYMOUSE + 'px');
    // d3TextTooltip.select('.textChange').attr('value', d3Elem.node().innerHTML)
}

CrossSectionCanvas.prototype.openSvgTextPropertyGrid = function (d3Elem, d) {
    if (this.isInDrawMode()) {
        return;
    }
    if (! d3Elem || ! d) {
        return;
    }
    this.storage.CURRENTTEXT = d;   // text
    this.storage.CURRENTTEXTSELECTION = d3Elem;

    this.selectElem(d3Elem.node(), false);
    let panelData = {
        text : d3Elem.node().innerHTML
    };

    const unit = this.storage.scaleIsFeet ? 'ft' : 'm'

    const optionsMetadata = {
        text : { name : "Text", group : "Text" }
    }
    
    const optionsTooltips = {
        text : "Text to be displayed"
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    });
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            if (name == 'text') {
                this.textChange(val);
            }
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.genericOpenPropertyGridSelected(panelElem, panelData, panelOptions);
    this.initializeTextFinishEditOnUnfocus(panelElem, 'text');
}

CrossSectionCanvas.prototype.updateLegendTextProperty = function (htmlElem, key, value) {
    if (!htmlElem || !key || !value) {
        return;
    }
    var isLegendText = this.storage.CURRENTTEXTSELECTION.classed("legend-text-item");
    if (!isLegendText) {
        return;
    }
    var objData = d3.select(htmlElem).data()[0]
    if (!objData) {
        return;
    }
    var src = objData.src;
    var options = this.storage.fillUsedForLegend.find(f => f.src == src);
    console.log(objData, src, options, this.storage.fillUsedForLegend);
    if (options) {
        options[key] = value;
    }
    objData[key] = value;
}

CrossSectionCanvas.prototype.textSelectColor = function (color) {

    this.storage.CURRENTTEXTSELECTION.attr('fill', color)
    this.storage.CURRENTTEXTSELECTION.data()[0].textColor = color;

    var isLegendText = this.storage.CURRENTTEXTSELECTION.classed("legend-text-item")
    if (isLegendText) {
        // this.updateLegendTextProperty(this.storage.CURRENTTEXTSELECTION.node(), "textColor", color);
        this.refreshLegend()
    };
    console.log(this.storage.fillUsedForLegend);

    this.textFinishEdit();
}

CrossSectionCanvas.prototype.textChange = function (newText) {
    //console.log(newText);
    var isLegendText = this.storage.CURRENTTEXTSELECTION.classed("legend-text-item");
    // var isBoreholeLabel = this.storage.CURRENTTEXTSELECTION.classed("layerinfo");
    var textData = this.storage.CURRENTTEXTSELECTION.data()[0];
    if (isLegendText) { // || isBoreholeLabel) {
        var soilPath = textData.src + '';
        // borehole label doesn't have src, only layerSymbol
        var soilSymbol = soilPath ? this.pathToName(soilPath) : textData.layerSymbol;
        this.setLegendName(soilSymbol, newText);
    }
    textData.textExtra = newText + '';
    this.storage.CURRENTTEXTSELECTION.text(newText + '');

    // let's optimize this and put it only on finish edit
    // isLegendText && this.refreshLegend();
}

CrossSectionCanvas.prototype.textVisibility = function (v) {
    //this.storage.CURRENTTEXTSELECTION.classed("opa", !v)

    //console.log(this.storage.CURRENTTEXTSELECTION.data())   // [{}]
    this.storage.CURRENTTEXTSELECTION.data()[0].textHidden = !v;
    console.log(this.storage.data0)
    this.storage.CURRENTTEXTSELECTION.classed("opa", !v)     // TODO check data()

    this.storage.CURRENTTEXTSELECTION.classed("legend-text-item") && this.refreshLegend();

}

CrossSectionCanvas.prototype.textFinishEdit = function () {
    if (! this.storage?.CURRENTTEXTSELECTION) {
        return;
    }
    // this.storage.d3_root.select(".texttooltip").style("visibility", "hidden");
    var isLegendText = this.storage?.CURRENTTEXTSELECTION?.classed("legend-text-item");
    // var isBoreholeLabel = this.storage.CURRENTTEXTSELECTION.classed("layerinfo");
    if (isLegendText) { //|| isBoreholeLabel) {
        // this.drawAllBoreholes();
        this.refreshLegend();
    }
    this.addTextBackground(this.storage.CURRENTTEXTSELECTION.node());
}




// Get point in global SVG space
CrossSectionCanvas.prototype.cursorPoint = function (evt) {
    this.storage.pt.x = evt.clientX; this.storage.pt.y = evt.clientY;
    return this.storage.pt.matrixTransform(this.storage.svg1.node().getScreenCTM().inverse());
    // return pt.matrixTransform(this.storage.svg1.node().getCTM().inverse());
}

//==============================  zoom

// var previousd3EventTransformK;

function floatsEqual (f1, f2, precision=0.00001) {
    return Math.abs(f1 - f2) < precision;
}

CrossSectionCanvas.prototype.floatsEqual = function (f1, f2) {
    /* Returns if floats f1 and f2 are equal */
    return floatsEqual(f1, f2, this.storage.precision);
}

function floatsLess (f1, f2, precision=0.00001) {
    /* Compares floats and returns true if f1 < f2 */
    if (this.floatsEqual(f1, f2)) {
        return false;
    }
    return f1 < f2 + precision;
}

CrossSectionCanvas.prototype.floatsLess = function (f1, f2) {
    return floatsLess(f1, f2, this.storage.precision);
}

// modulus, always returns a positive number
CrossSectionCanvas.prototype.mod = function (n, m) {
    return ((n % m) + m) % m;
}

// two arrays [a1, ..., an] [b1, ..., bn]
// become an array [{point: a1, value: b1}, ..., {point: an, value: bn}]
CrossSectionCanvas.prototype.dotProduct = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
}
CrossSectionCanvas.prototype.isConcave = function (a, b, c) {
    const v1 = [a[0] - b[0], a[1] - b[1]];
    const v2 = [c[0] - b[0], c[1] - b[1]];
    const dot = this.dotProduct(v1, v2);
    return dot > 0;
}
// returns if p is to the right of vector ab
CrossSectionCanvas.prototype.isRight = function (a, b, p) {
    var d = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]);
    return d > 0;

}
CrossSectionCanvas.prototype.zip = function (a, b) {
    var zipped = a.map((k, i) => {
        return [k, b[i]];
    })
    return zipped;
};

// function this.zoom(z) {
//     if (z) {
//         this.storage.svg1.call(ZOOMER.transform, d3.zoomIdentity.scale(z));
//         return;
//     }
//     if (!d3.event?.transform?.k) {
//         return;
//     }

//     // if (this.floatsEqual(d3.event.transform.k, previousd3EventTransformK)) {
//     //     return;
//     // }
//     console.log(d3.event.sourceEvent);
//     if (d3.event.sourceEvent) {
//         console.log(d3.event.sourceEvent.preventDefault)
//         // d3.event.sourceEvent.cancelBubble = true;
//         d3.event.sourceEvent.preventDefault();
//         d3.event.sourceEvent.stopPropagation();

//     }
//     let newZ;
//     if (this.floatsEqual(d3.event.transform.k, this.storage.ZOOMSCALE)) {
//         newZ = this.storage.ZOOMSCALE;
//     }
//     else {
//         // console.log(this.storage.ZOOMSCALE, d3.event.transform.k)
//         let sign = d3.event.sourceEvent.wheelDelta > 0 ? 1 : -1;

//         newZ = this.storage.ZOOMSCALE + sign * this.storage.zoomStep;

//     }
//     // case where you zoom to 100%
//     if (d3.event.transform.k == 1) {
//         newZ = 1;
//     }
//     // prevents some of the weird behaviors when it gets close to the minimum and maximum
//     if (this.floatsLess(this.storage.maximumZoom, newZ) || this.floatsLess(newZ, this.storage.minimumZoom)) {
//         return;
//     }
//     newZ = Math.min(this.storage.maximumZoom, newZ);
//     newZ = Math.max(this.storage.minimumZoom, newZ);

//     // var newZ = d3.event && d3.event.transform.k || 1;            // 1 for the first time TODO check
//     var ztext = (newZ * 100).toFixed(0) + '%'
//     this.storage.d3_root.select(".extrazoom").text("Zoom " + ztext)
//     this.storage.ZOOMSCALE = newZ;
//     this.coordUpd()

//     // if (d3.event?.transform.k) {
//     //     previousd3EventTransformK = d3.event.transform.k;
//     // }
// }

CrossSectionCanvas.prototype.getCanvasCenterPixels = function () {
    /* Coordinate at the center of the canvas, in pixels */
    // let scaleHorPixels = this.getScaleHorPixels();
    // let scaleVertPixels = this.getScaleVertPixels();
    // let centerX = (scaleHorPixels[0] + scaleHorPixels[1]) / 2;
    // let centerY = -(scaleVertPixels[0] + scaleVertPixels[1]) / 2;
    // return [centerX, centerY];
    return [this.storage.REGCX * this.storage.AX, - this.storage.REGCY * this.storage.AY]
}

CrossSectionCanvas.prototype.zoom = function (z, point = undefined) {
    /* Receives a number z corresponding to a scale and zooms to it
       if point is defined, zooms towards it
       point is a position [x, y] in pixels inside the canvas*/
    let oldZ = this.storage.ZOOMSCALE;
    if (z) {
        this.storage.ZOOMSCALE = z;
    }
    if (this.storage.ZOOMSCALE < this.storage.minimumZoom) {
        this.storage.ZOOMSCALE = this.storage.minimumZoom;
    }
    if (this.storage.ZOOMSCALE > this.storage.maximumZoom) {
        this.storage.ZOOMSCALE = this.storage.maximumZoom;
    }

    // Updates text on screen corresponding to the zoom percent
    var ztext = (this.storage.ZOOMSCALE * 100).toFixed(0) + '%'
    this.storage.d3_root.select(".extrazoom").text("Zoom " + ztext)

    // when point==undefined, the zoom behavior above will zoom towards the center of the screen

    // if there's a defined point you want to zoom towards, the way it works is:
    // the place below the mouse will have to stay below the mouse even after the zoom
    // to guarantee that, we pan the canvas
    if (point) {
        // calculate distance in pixels
        let [centerX, centerY] = this.getCanvasCenterPixels();
        let zoomRatio = this.storage.ZOOMSCALE / oldZ;

        // if the point was 50 pixels away from the center of the canvas at 100% zoom, at 200% zoom it'll be 100 pixels
        let xAfterZoom = centerX + (point[0] - centerX) * zoomRatio;
        let yAfterZoom = centerY + (point[1] - centerY) * zoomRatio;
        // therefore, we want to move the center 50 pixels to the side so a distance of 50 is kept
        let offsetX = xAfterZoom - point[0];
        let offsetY = yAfterZoom - point[1];

        // however, 50 pixels are going to be rendered as 100 pixels since the zoom doubled
        // therefore we have to divide it by the ratio so it renders normally
        offsetX = offsetX / zoomRatio;
        offsetY = offsetY / zoomRatio;

        // convert to real world units
        let offsetXUnit = offsetX / this.storage.AX;
        let offsetYUnit = - offsetY / this.storage.AY;

        // pan
        // let sign = this.storage.ZOOMSCALE > oldZ ? 1 : -1;
        this.storage.REGCX += offsetXUnit
        this.storage.REGCY += offsetYUnit
        // console.log(point, centerX, centerY, xAfterZoom, yAfterZoom, offsetX, offsetY);
    }

    this.coordUpd();
    this.drawPolygonInterrogationPoints(this.storage.svg1);
    this.drawWaterlineInterrogationPoints(this.storage.svg1);
    this.drawWaterlineWaterSymbols(this.storage.svg1);
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.polygon')))
    this.storage?.rootElem?.style?.setProperty('--zoomScale', this.storage.ZOOMSCALE);
    if (this.storage.legendPinnedTo != '(none)') {
        this.updateLegendPosition();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

CrossSectionCanvas.prototype.zoomWithTransitionGenerator = async function* (z, point=undefined) {
    if (z == null) {
        return;
    }
    let current = this.storage.ZOOMSCALE;
    let towards = z;
    if (towards < this.storage.minimumZoom) {
        towards = this.storage.minimumZoom;
    }
    if (towards > this.storage.maximumZoom) {
        towards = this.storage.maximumZoom;
    }
    if (towards == current) {
        return;
    }

    const change = towards > current ? towards / current : current / towards;
    // 500ms for every 50% increase or decrease
    const transitionTime = Math.min(500, 500 * (change - 1) / 0.5);
    const fps = 30;
    const numberOfSteps = Math.ceil(fps * transitionTime / 1000);
    const sign = Math.sign(towards - current);
    const interval = Math.abs(towards - current);
    const step = interval / numberOfSteps;
    const timePerStep = transitionTime / numberOfSteps;
    for(let addition = step; addition < interval; addition += step) {
        this.zoom(current + addition * sign, point);
        await sleep(timePerStep);
        yield true;
    }
    this.zoom(z, point);
    yield false;
}

CrossSectionCanvas.prototype.zoomWithTransition = async function (z, point = undefined) {
    const iterator = this.zoomWithTransitionGenerator(z, point);
    while (! ((await iterator.next()).done)) {
        // nothing
    }
}

CrossSectionCanvas.prototype.incrementZoom = function (step = this.storage.zoomStep) {
    var newZoom = this.storage.ZOOMSCALE + step;
    this.zoom(newZoom);
}

CrossSectionCanvas.prototype.decrementZoom = function (step = this.storage.zoomStep) {
    var newZoom = this.storage.ZOOMSCALE - step;
    this.zoom(newZoom);
}

CrossSectionCanvas.prototype.zoomExtentOfElement = async function (elem, transition=false) {
    if (this.storage.PIXH == 0 || this.storage.PIXW == 0) {
        return;
    }
    var [newPIXW, newPIXH] = this.getExtentSizeOfElement(elem);
    var ratioW = this.storage.PIXW / newPIXW;
    var ratioH = this.storage.PIXH / newPIXH;

    // if the canvas occupies more space than available in the window
    // we'll have to zoom out (decrease zoom) to see all the elements

    var ratio = Math.min(ratioW, ratioH);
    var newZoom = ratio;
    if (transition) {
        await this.focusCenterOfElementWithTransition(elem);
        this.zoomWithTransition(newZoom);
    }
    else {
        this.zoom(newZoom);
        this.focusCenterOfElement(elem);
    }
}

CrossSectionCanvas.prototype.zoomExtent = function (transition=false) {
    /* Zooms to a scale that allows all elements to be visible at once */
    if (this.storage.PIXH == 0 || this.storage.PIXW == 0) {
        return;
    }

    let rootGroup = this.storage.rootElem.querySelector('.root-group');
    this.zoomExtentOfElement(rootGroup, transition)
}

CrossSectionCanvas.prototype.onWheel = function (e) {
    /* Function to be called on mouse wheel event when it's inside the canvas */
    let sign = e.wheelDelta > 0 ? 1 : -1;
    let newZ = this.storage.ZOOMSCALE + sign * this.storage.zoomStep;
    let point = undefined;
    if (this.storage.YMOUSE && this.storage.XMOUSE) {
        // point = [this.storage.YMOUSE, this.storage.XMOUSE];
        point = this.pixelPositionInRelationToOrigin(this.storage.XMOUSE, this.storage.YMOUSE);
    }
    this.zoom(newZ, point)
}






//=====================================================



//--------------------------------------

CrossSectionCanvas.prototype.saveAllToSvg = function () {
    let spinner = this.storage.rootElem?.querySelector('.exportingFile');
    spinner.style.display = 'inline-block';

    let label = this.storage.rootElem?.querySelector('.exportingFileText');
    label.innerText = 'Exporting to SVG ...';
    label.style.display = 'inline-block';

    /* Downloads the entire drawing as an svg file */
    this.expandAndDo(() => this.saveToSvg());

    spinner.style.display = 'none';
    label.style.display = 'none';
}

CrossSectionCanvas.prototype.saveToSvg = function () {
    /* Saves the current view as an svg file */
    // load from DOM-SVG-element
    let clonedSvgElement = this.storage.rootElem.querySelector(".svgWindow").cloneNode(true);
    this.hideElementsToSaveImage(d3.select(clonedSvgElement));

    let outerHTML = clonedSvgElement.outerHTML, blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' });

    let URL = window.URL || window.webkitURL || window;
    // @ts-expect-error
    let blobURL = URL.createObjectURL(blob);

    let a = document.createElement("a");
    // a.download = "download.svg";
    let fileName = this.getTitle() || 'download';
    a.download = "" + fileName + ".svg";
    a.href = blobURL;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

}

CrossSectionCanvas.prototype.GetSvg = function () {
    let clonedSvgElement = this.storage.rootElem.querySelector(".svgWindow").cloneNode(true);
    this.hideElementsToSaveImage(d3.select(clonedSvgElement));
    let outerHTML = clonedSvgElement.outerHTML, blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    return outerHTML;
}

CrossSectionCanvas.prototype.updateTopMenuMaxSize = function() {
    const rootElem = this?.storage?.rootElem;
    if (! rootElem) {
        return;
    }
    const windowContainer = rootElem.querySelector('.windowContainer');
    const viewer3d = rootElem.querySelector('.view3d');
    const elem = this.storage.isShowing3d ? viewer3d : windowContainer;
    const leftMargin = 50;
    const width = parseFloat(elem?.offsetWidth ?? 0) - leftMargin;
    if (width < 0) {
        return;
    }
    const topmenu = rootElem?.querySelector('.topmenu');
    const crossectionsreviewContainer = rootElem?.querySelector('.crossectionsreviewContainer');
    [topmenu, crossectionsreviewContainer].forEach(elem=> {
        if (! elem) {
            return;
        }
        elem.style.maxWidth = `${width}px`;
    });
}

CrossSectionCanvas.prototype.changeSvgWindowSize = function (newPIXW, newPIXH) {
    /* Changes the size of the canvas */
    // the size change will be around the current center
    // for example, if the height was from -15 to 15 meters, aka 30 meters
    // and it doubles
    // the window will become 60 meters
    // 15 will be added to each side
    // the height now is from -30 to 30
    this.storage.PIXW = newPIXW;
    this.storage.PIXH = newPIXH;
    this.coordUpd();
    this.updateTopMenuMaxSize();
    // svgWindow = this.storage.d3_root.select(".svgWindow");
}

CrossSectionCanvas.prototype.getLeftPanelSize = function () {
    const width = parseFloat(this.storage.rootElem.querySelector('.underX').getAttribute('width'));
    const widthPx = width / this.storage.AX;
    return widthPx;
}

CrossSectionCanvas.prototype.getTopPanelSize = function () {
    const panelHeight = parseFloat(this.storage.rootElem?.querySelector('.underY')?.getAttribute('height') ?? 0);
    const panelHeightPx = panelHeight / this.storage.AY;
    const menuHeight = parseFloat(this.storage.rootElem?.querySelector('.topmenu')?.offsetHeight ?? 0);
    const heightPx = panelHeightPx + menuHeight;
    return heightPx;
}

CrossSectionCanvas.prototype.getBestSizeForSvgWindow = function () {
    const elem = this.storage.rootElem.closest('.modal-body') ?? this.storage.rootElem;
    const propertyGridRightBoundary = this.getPropertyGridRightBoundary();;
    const elemWidth = elem.offsetWidth - propertyGridRightBoundary;
    const elemHeight = elem.offsetHeight;

    const width = window.innerWidth;
    const leftPanel = this.getLeftPanelSize()

    const height = window.innerHeight;
    const topPanel = this.getTopPanelSize();

    const idealWidth = width;
    const idealHeight = height;

    let newWidth = Math.min(elemWidth, idealWidth) - leftPanel;
    let newHeight = Math.min(elemHeight, idealHeight) - topPanel;

    const padding = 6;
    newWidth = newWidth - padding * 2;
    newHeight = newHeight - padding * 2;
    return [newWidth, newHeight];
}

CrossSectionCanvas.prototype.adequateSvgSizeToRootElem = function () {
    const [newWidth, newHeight] = this.getBestSizeForSvgWindow();
    if (newWidth <= 0 || newHeight <= 0) {
        return;
    }
    this.changeSvgWindowSize(newWidth, newHeight);
}

CrossSectionCanvas.prototype.adequate3dViewerSizeToRootElem = function () {
    if (! this.storage.isShowing3d) {
        return;
    }
    const [newWidth, newHeight] = this.getBestSizeForSvgWindow();
    const renderer = this.storage.viewer3d.renderer;
    const camera = this.storage.viewer3d.camera;
    const scene = this.storage.viewer3d.scene;
    if (newWidth <= 0 || newHeight <= 0 || ! renderer || ! camera) {
        return;
    }
    window['update3dViewerSize'](this.storage.viewer3d, newWidth, newHeight);
    this.updateTopMenuMaxSize();
}

CrossSectionCanvas.prototype.adequateCanvasSizeAndPosition = function () {
    this.adequateSvgSizeToRootElem();
    this.adequate3dViewerSizeToRootElem();
    this.adjustCanvasPosition();
}

CrossSectionCanvas.prototype.initializeResizeObserver = function() {
    const crossSectionObj = this;
    const fn = function(event) {
        crossSectionObj.adequateCanvasSizeAndPosition();
    }
    window.addEventListener("resize", fn)
    window.addEventListener("focus", fn)
    
    const divs = [
        this.storage?.rootElem?.parentElement,
        this.storage?.rootElem?.querySelector(".propertyGridCol"),
        this.storage?.rootElem?.querySelector(".propertyGrid"),
        this.storage?.rootElem?.querySelector(".propertyGridSelected")
    ];
    divs.forEach(div => {
        if (! div) {
            return;
        }
        new ResizeObserver(fn).observe(div);
    })
    this.storage.rootElem.querySelector(".propertyGridCol").addEventListener('animationend', fn);
}

// for cases where display is none
// https://stackoverflow.com/questions/28282295/getbbox-of-svg-when-hidden
function svgBBox (svgEl) {
    if (! svgEl) {
        return null;
    }
    let tempDiv = document.createElement('div')
    tempDiv.setAttribute('style', "position:absolute; visibility:hidden; width:0; height:0")
    document.body.appendChild(tempDiv)
    let tempSvg = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
    tempDiv.appendChild(tempSvg)
    let tempEl = svgEl.cloneNode(true)
    tempSvg.appendChild(tempEl)
    let bb = tempEl.getBBox()
    document.body.removeChild(tempDiv)
    return bb
  }


CrossSectionCanvas.prototype.getExtentSizeOfElement = function (elem, borderPercent=0.05) {
    let bounds = elem.getBBox(elem);
    if (bounds.width == 0 && bounds.height == 0) {
        bounds = svgBBox(elem);
    }
    let newPIXW = (bounds.width + this.storage.XOFFPIX * 2) * (1 + borderPercent);
    let newPIXH = (bounds.height + this.storage.YOFFPIX * 2) * (1 + borderPercent);

    var newSize = [newPIXW, newPIXH];
    return newSize;
}

CrossSectionCanvas.prototype.getExtentSize = function () {
    /* Returns the size the canvas would need to have to fit the entire drawing */
    let rootGroup = this.storage.rootElem.querySelector('.root-group');
    const newSize = this.getExtentSizeOfElement(rootGroup);
    return newSize;
}

CrossSectionCanvas.prototype.expandAndDo = function (fn) {
    /* Expands the canvas to fit the entire drawing, executes the function fn and shrinks the canvas back. */
    if (this.storage.isShowing3d) {
        const windowContainer = this.storage?.rootElem?.querySelector('.windowContainer');
        this.toggleInvisible(windowContainer, true);
    }

    let oldPIXW = this.storage.PIXW;
    let oldPIXH = this.storage.PIXH;
    let [newPIXW, newPIXH] = this.getExtentSize();


    let oldREGCX = this.storage.REGCX;
    let oldREGCY = this.storage.REGCY;

    var oldZoomScale = this.storage.ZOOMSCALE;

    // bring all elements into view
    this.changeSvgWindowSize(newPIXW, newPIXH);
    this.zoom(1);
    this.focusCenter();

    /* do something */
    let result = fn();

    /* revert view */
    this.changeSvgWindowSize(oldPIXW, oldPIXH);
    this.changeSvgWindowCenter(oldREGCX, oldREGCY);
    this.zoom(oldZoomScale);

    if (this.storage.isShowing3d) {
        const windowContainer = this.storage?.rootElem?.querySelector('.windowContainer');
        this.toggleInvisible(windowContainer, false);
    }

    return result;
}


/* Assuming you only want one preview */
// var lastImageDataURL = null;

CrossSectionCanvas.prototype.saveAlltoPng = function () {  
    /* Saves the entire drawing as a png file */
    return this.expandAndDo(() => this.saveToPng(this.storage.MAXIMUMPIXELS));
}

/* Returns a promise that, when solved, contains the dataURL of a image of the full canvas */
CrossSectionCanvas.prototype.generatePng = function () {
    return this.expandAndDo(() => this.imageToPng(this.storage.MAXIMUMPIXELS));
}

/* Returns a promise that, when solved, contains the dataURL of a image of the full canvas
Maximum size is smaller
*/
CrossSectionCanvas.prototype.generatePngForPrint = function () {
    return this.expandAndDo(() => this.imageToPng(this.storage.MAXIMUMPIXELS));
}

CrossSectionCanvas.prototype.generatePreview = function () {
    /* Returns a promise that, when solved, contains the dataURL of a preview image */
    return this.expandAndDo(() => this.imageToPng(this.storage.maximumPreviewPixels));
}

CrossSectionCanvas.prototype.downloadPreview = function () {
    /* Saves a preview image */
    return this.expandAndDo(() => this.saveToPng(this.storage.maximumPreviewPixels));
}

CrossSectionCanvas.prototype.downloadCanvas = function (canvas, extraScaleToIncreaseQuality) {
    /* Download the canvas as an image */
    let dataURL = this.canvasToDataURL(canvas, extraScaleToIncreaseQuality);
    this.downloadImage(dataURL);
}

CrossSectionCanvas.prototype.downloadImage = function (dataURL) {
    /* Downloads an image corresponding to the given dataURL */
    let a = document.createElement("a");
    // a.download = "download.png";
    a.download = `${this.getTitle() || "download"}.png`

    a.href = dataURL;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

CrossSectionCanvas.prototype.canvasToDataURL = function (canvas, extraScaleToIncreaseQuality) {
    /* Returns a dataURL corresponding to what is drawn in the canvas.
    The dataURL corresponds to the image with correct DPI so it has real scale
    */

    // Calculates DPI such as that the image has real scale.

    let scale = this.storage.scaleToReal / this.storage.AY;
    let domain = this.getScaleVertDomain();
    // Example: if 1:200, 10 meters in the screen means 5 centimeters in the final image
    // which is half than the 10cm in 1:100
    let desired_centimeters = - (domain[1] - domain[0]) / (scale / 100);
    let domain_pixels = this.getScaleVertPixels();
    let pixels = - (domain_pixels[1] - domain_pixels[0]) * extraScaleToIncreaseQuality;
    let pixels_per_cm = pixels / desired_centimeters;
    let pixels_per_inch = pixels_per_cm * 2.54;
    console.log(pixels, desired_centimeters, pixels_per_cm);
    let image_DPI = pixels_per_inch;

    let dataURL = canvas.toDataURL('image/png');

    // Apparently the calculated DPI is correct, but this function I got from a library doesn't change the DPI.
    // let dataURL_new_DPI = changeDpiDataUrl(dataURL, image_DPI);
    const dataURL_new_DPI = dataURL;
    return dataURL_new_DPI;
}

CrossSectionCanvas.prototype.saveToPng = function (maximumPixels) {
    let spinner = this.storage.rootElem?.querySelector('.exportingFile');
    spinner.style.display = 'inline-block';

    let label = this.storage.rootElem?.querySelector('.exportingFileText');
    label.innerText = 'Exporting to PNG ...';
    label.style.display = 'inline-block';

    /* Saves current view of the canvas to png */
    let imgPromise = this.imageToPng(maximumPixels);
    imgPromise.then((result) => {
        spinner.style.display = 'none'; 
        label.style.display = 'none';
        return this.downloadImage(result);
    });
}

CrossSectionCanvas.prototype.hideElementsToSaveImage = function (d3Svg) {
    // user added points shouldn't show in png
    var points = d3Svg.selectAll("rect.point");
    points.style("display", "none");

}

CrossSectionCanvas.prototype.imageToPng = function (maximumPixels) {
    /* Returns a promise that, when solved, contains the dataurl of the current view of the canvas.
       This function can be used to generate previews if you pass a low maximumPixels value.*/
    // https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f

    // var maximumPixels = 8196;
    var extraScaleToIncreaseQuality = Math.min(maximumPixels / this.storage.PIXW, maximumPixels / this.storage.PIXH);

    let clonedSvgElement = this.storage.rootElem.querySelector(".svgWindow").cloneNode(true);
    // clonedSvgElement.style.visibility = "hidden";
    clonedSvgElement.style.display = "none";
    document.body.appendChild(clonedSvgElement);
    let clonedSvg1 = d3.select(clonedSvgElement);

    this.hideElementsToSaveImage(clonedSvg1);


    clonedSvg1
        //.attr("transform", "scale(extraScaleToIncreaseQuality)")
        .attr("width", this.storage.PIXW * extraScaleToIncreaseQuality)
        .attr("height", this.storage.PIXH * extraScaleToIncreaseQuality)

    // image_display is for showing the image
    // var image_display = this.storage.rootElem.querySelector(".image-display");
    // image_display.width = this.storage.PIXW;
    // image_display.height = this.storage.PIXH;
    // hidden canvas is for downloading the image
    var hidden_canvas = this.storage.rootElem.querySelector(".hidden-canvas");
    hidden_canvas.width = this.storage.PIXW * extraScaleToIncreaseQuality;
    hidden_canvas.height = this.storage.PIXH * extraScaleToIncreaseQuality;                 // bottom will be just cropped
    var ctx = hidden_canvas.getContext('2d');
    var img = new Image;

    let imgPromise = new Promise((resolve, reject) => {
        img.onload = () => {

            // draw image on hidden canvas
            ctx.drawImage(img, 0, 0)

            this.storage.svg1.selectAll(".screenshotinvizible").classed("screenshotinvizible", 0)

            clonedSvg1.remove();
            // clonedSvg1.attr("transform", "scale(1)").attr("width", this.storage.PIXW).attr("height", this.storage.PIXH)

            // display image.
            // it's important that this is done after the image is drawn on hidden canvas
            // since we are going to change the dimensions
            img.width = this.storage.PIXW;
            img.height = this.storage.PIXH;
            // console.log(img);
            // image_display.appendChild(img);

            // insert button to download image
            // let button = document.createElement("input");
            // button.type = 'button';
            // button.onclick = downloadImage;
            // button.value = "Download Image";
            // button.className = "download-image"
            // console.log(button);
            // image_display.appendChild(button);
            let dataURL = this.canvasToDataURL(hidden_canvas, extraScaleToIncreaseQuality);
            resolve(dataURL);
            // lastImageDataURL = dataURL;
        };
    });



    this.storage.svg1.selectAll(".opa").classed("screenshotinvizible", 1)
    this.storage.svg1.selectAll(".lopa").classed("screenshotinvizible", 1)
    this.storage.svg1.selectAll(".freepoint").classed("screenshotinvizible", 1)
    this.storage.svg1.selectAll(".inviz").classed("screenshotinvizible", 1)       // only mouselast

    // load from DOM-SVG-element
    let outerHTML = clonedSvgElement.outerHTML, blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    // console.log(outerHTML);
    let URL = window.URL || window.webkitURL || window;
    // @ts-expect-error
    let blobURL = URL.createObjectURL(blob);

    img.src = blobURL;

    return imgPromise;
}



//================================= images loading


//var IMGS = ['CH.png', 'CH.jpg', 'FL.png', 'FL.jpg', 'GW.png', 'SM.png', 'SM.jpg', 'SP.jpg', 'PT.png', 'WHITE.png', 'CLNSymm.png', 'SoilSymbols/Rock-BED.jpg']
// var legendSrc2text = new Map();

CrossSectionCanvas.prototype.legendSrc2text = function (src) {
    var value = src + '';
    return {
        "src": value
    };
}

CrossSectionCanvas.prototype.initializeHatch = function (soilSymbols) {
    let CrossSectionObj = this;
    soilSymbols.forEach(src => {
        let symbolName = CrossSectionObj.pathToName(src);
        CrossSectionObj.storage.soilSymbols.set(symbolName, CrossSectionObj.getColoredSrc(src));
    });
    CrossSectionObj.initializeHatchColors();
    console.log("soil-symbols", this.storage.soilSymbols)
}




CrossSectionCanvas.prototype.createPatternButton = function (divToInsert, src, myBase64) {
    const soilSymbol = this.pathToName(src);
    let textToShow = soilSymbol
    const description = this.storage.soilDescriptions[textToShow];

    var btn = d3.select(divToInsert)
        .append('button').attr('value', src)
        .attr("symbol", soilSymbol)
        .on('click', () => this.polySelectColor(src))

    btn.append("div").classed('hatchImage', true).style('background-image', `url(${myBase64})`)           //.style("width", "32px")
    const textContainer = btn.append("div").classed('textContainer', true)
    textContainer.append("div").classed('hatchText', true).text(textToShow)
    if (description) {
        textContainer.append("div").classed('hatchDescription', true).text(description);
    }
}

async function createAllPatterns(srcs, storage, callback) {
    // loads images for all colored versions, including black, and calls callback
    // used just for testing of insertHatchPatterns
    let arr = [];
    const maximumRequests = 250;
    const srcAndColorArr = [];
    srcs.forEach(src => {
        storage.availableColors.forEach(color => {
            srcAndColorArr.push([src, color]);
        })
    })
    const pockets = Math.ceil(srcAndColorArr.length / maximumRequests);
    for (let i = 0; i < pockets; i += 1) {
        const pocket = srcAndColorArr.slice(i * maximumRequests, (i + 1) * maximumRequests);
        let pocketCompleted = new Promise((resolve, reject) => {
            pocket.forEach(srcAndColor => {
                const [src, color] = srcAndColor;
                let coloredSrc = src.replace(storage.defaultHatchColor, color);
                toDataUrl(storage.IMGPREFIX + coloredSrc, (myBase64, w, h) => {
                    arr.push({
                        src: coloredSrc,
                        w: w,
                        h: h,
                        imageBase64: myBase64
                    })
                    if (arr.length == (i + 1) * maximumRequests || arr.length == srcAndColorArr.length) {
                        resolve(true);
                    }
                    if (arr.length == srcAndColorArr.length) {
                        callback(arr);
                    }
                })
            })
        })
        await pocketCompleted;
    }
}

CrossSectionCanvas.prototype.createPattern = function (src) {
    // deprecated
    return;
    toDataUrl(this.storage.IMGPREFIX + src, (myBase64, w, h) => {
        //console.log(myBase64);
        //this.storage.rootElem.querySelector(".myi").setAttribute('href', myBase64);

        // remove beginning bar and replace others with _
        let correctedSrc = src.replace(/^\//, "").replace(/\//g, "_")

        var pats = this.storage.d3_root.select("svg.svgWindow").select("defs")
            .selectAll("pattern").data([{ 'name': src, 'w': w, 'h': h }], d => d && d.name).enter()
            .append('pattern')
            .attr('id', correctedSrc)
            .classed("bhsymbol", 1)
            .attr('width', d => d && d.w)
            .attr('height', d => d && d.h)
            .attr("patternUnits", "userSpaceOnUse")
        pats.append('image').attr('href', myBase64)
            .attr('width', d => d && d.w)
            .attr('height', d => d && d.h)
        //.each((d, i, n) => console.log(n[i], d))

        if (src.includes(this.storage.defaultHatchColor)) {
            this.createPatternButton(src, myBase64);
        }
        /*
  
        <button value="FL.png" style="display:inline-block;min-width: 103px;">dedede <img src="data:text/xml;base64,iVBORw0KCC">    </button>
  
        */

    })

    //<pattern class="patternGWGC" x="0" y="0" width="64" height="74" patternUnits="userSpaceOnUse" >
    //    <image href="GW-GC.png" width="64" height="64"

}

function srcToFillId(src) {
    /* Adds a bar to the beginning of a hatch image src. The output is meant to be used as a pattern ID */
    return src.match(/^\//) ? src : '/' + src;
}

function getHatchCategory (src) {
    const match = src?.match(/PNG\/(.*?)\//);
    if (! match) {
        return null;
    }
    if (match[1] == 'Soil') {
        return 'USCS';
    }
    return match[1] ?? null;
}

CrossSectionCanvas.prototype.insertHatchPattern = function (dict) {
    const {src, h, w, imageBase64} = dict;
    let correctedSrc = srcToFillId(src);
    var pats = this.storage.d3_root.select("svg.svgWindow").select("defs")
        .selectAll("pattern").data([{ 'name': src, 'w': w, 'h': h }], d => d && d.name).enter()
        .append('pattern')
        .attr('id', correctedSrc)
        .classed("bhsymbol", 1)
        .attr('width', d => d && d.w)
        .attr('height', d => d && d.h)
        .attr("patternUnits", "userSpaceOnUse")
    pats.append('image').attr('href', imageBase64)
        .attr('width', d => d && d.w)
        .attr('height', d => d && d.h)
    this.scalePattern(pats);
}

CrossSectionCanvas.prototype.insertHatchPatterns = function (arr, options = {redraw : true}) {
    /* Callback to another function that loads the hatch patterns.
       Receives an array where every element is in the form of
       {src, w, h, imageBase64}
    */

    arr = arr.sort((a, b) => {
        const soilSymbolA = this.pathToName(a?.src ?? '');
        const soilSymbolB = this.pathToName(b?.src ?? '');
        return soilSymbolA.localeCompare(soilSymbolB);
    });

    const categories = arr.map(src => {
        return getHatchCategory(src.src);
    }).filter(x => x);
    const uniqCategories = uniq(categories);
    const colorOptionsDiv = this.storage.rootElem.querySelector(".selectHatchTooltip .coloroptions");
    uniqCategories.forEach(category => {
        const div = document.createElement('div');
        div.classList.add('category' + category);
        colorOptionsDiv?.appendChild(div);
    })

    this.storage.d3_root.select("svg.svgWindow").select("defs")
        .selectAll("pattern").remove();
    arr.forEach(dict => {
        const {src, h, w, imageBase64} = dict;
        this.insertHatchPattern(dict);

        if (src.includes(this.storage.defaultHatchColor)) {
            const category = getHatchCategory(src);
            const divToInsert = colorOptionsDiv.querySelector('.category' + category);
            this.createPatternButton(divToInsert, src, imageBase64);
        }
    })
    if (options.redraw) {
        this.refreshBoreholeImgScale();
        this.redrawHatched();
    }
    this.storage.hatchLoaded = true;
}

CrossSectionCanvas.prototype.initializeColoredHatchPatterns = function (jsonData) {
    if (! jsonData?.hatchColors) {
        return;
    }
    Object.entries(jsonData.hatchColors).forEach(entry => {
        const [soilSymbol, color] = entry;
        const src = this.soilSymbolToCurrentSrc(soilSymbol);
        if (! src || ! color) {
            return;
        }
        this.createColoredHatch(src, color);
    })
}

CrossSectionCanvas.prototype.loadPatterns = function (src) {
    toDataUrl(this.storage.IMGPREFIX + src, (myBase64, w, h) => {
        //console.log(myBase64);
        //this.storage.rootElem.querySelector(".myi").setAttribute('href', myBase64);

        // remove beginning bar and replace others with _
        let correctedSrc = srcToFillId(src)

        var pats = this.storage.d3_root.select("svg.svgWindow").select("defs")
            .selectAll("pattern").data([{ 'name': src, 'w': w, 'h': h }], d => d && d.name).enter()
            .append('pattern')
            .attr('id', correctedSrc)
            .classed("bhsymbol", 1)
            .attr('width', d => d && d.w)
            .attr('height', d => d && d.h)
            .attr("patternUnits", "userSpaceOnUse")
        pats.append('image').attr('href', myBase64)
            .attr('width', d => d && d.w)
            .attr('height', d => d && d.h)
        //.each((d, i, n) => console.log(n[i], d))

        if (src.includes(this.storage.defaultHatchColor)) {
            this.createPatternButton(src, myBase64);
        }
        /*
  
        <button value="FL.png" style="display:inline-block;min-width: 103px;">dedede <img src="data:text/xml;base64,iVBORw0KCC">    </button>
  
        */

    })
}

CrossSectionCanvas.prototype.scalePattern = function (bhSymbolD3) {
    bhSymbolD3
        .attr("width", (_, i, lst) => d3.select(lst[i]).data()[0].w * this.storage.HatchScale / 100)
        .attr("height", (_, i, lst) => d3.select(lst[i]).data()[0].h * this.storage.HatchScale / 100)
    bhSymbolD3.selectAll('image')
        .attr("width", (_, i, lst) => d3.select(lst[i]).data()[0].w * this.storage.HatchScale / 100)
        .attr("height", (_, i, lst) => d3.select(lst[i]).data()[0].h * this.storage.HatchScale / 100)
}

CrossSectionCanvas.prototype.scalePatterns = function () {
    this.scalePattern(this.storage.svg1.selectAll("pattern.bhsymbol"))
}


function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = () => {
        var reader = new FileReader();
        reader.onloadend = () => {

            var img = new Image();
            img.onload = () => {
                //alert(img.width +' '+ img.height );
                callback(reader.result, img.width, img.height);
            };
            // @ts-expect-error
            img.src = reader.result;
            //callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';

    // attempts to recover in case of net::ERR_INSUFFICIENT_RESOURCES caused
    // by firing too many calls
    const sendRequest = async () => {
        const maxAttempts = 5
        for (let i = 0; i < maxAttempts; i += 1) {
            try {
                xhr.send();
                break;
            } catch (error) {
                if (i + 1 >= maxAttempts) {
                    throw(error);
                }
            }
            await sleep(1000);
        }
    }
    sendRequest();
}

// Hatch colors =================================

CrossSectionCanvas.prototype.initializeHatchColors = function () {
    /* Initializes the global variable this.storage.hatchColors based on user configuration or in the default values. Draws the corresponding color buttons on the hatch colors tooltip. */
    this.storage.hatchColors = new Map();
    Array.from(this.storage.soilSymbols.keys()).forEach(soilSymbol => {
        // default color is black
        this.storage.hatchColors.set(soilSymbol, "000000");
    })
    this.drawColorButtons(this.storage.rootElem.querySelector(".hatchcolor"));
    this.drawColorButtons(this.storage.rootElem.querySelector(".coloroptions"));
}

CrossSectionCanvas.prototype.arrayChunks = function (arr, elemsPerChunk) {
    /* Divides an array arr into multiple arrays containing elemsPerChunk elements each */
    var result = arr.reduce((resultArray, item, index) => {
        var chunkIndex = Math.floor(index / elemsPerChunk)

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
    }, [])
    return result;
}

CrossSectionCanvas.prototype.drawAllBoreholes = function () {
    /* Draws all boreholes */
    this.storage.data0.forEach(d => {
        this.drawBorehole(d, this.storage.svg1)
    })
    this.reinsertElementsZOrder(Array.from(this.storage.rootElem.querySelectorAll('.fieldtest-plot')))
}

CrossSectionCanvas.prototype.drawColorButtons = function (elemToDrawOn) {
    /* Draws color buttons on the html element passed. The buttons are supposed to change the color of a hatch. */
    let chunks = this.arrayChunks(this.storage.availableColors, 2);
    chunks.forEach(chunk => {
        let divElem = document.createElement("div");
        elemToDrawOn.appendChild(divElem);
        chunk.forEach(color => this.drawColorButton(color, divElem));
    });
}

CrossSectionCanvas.prototype.redrawHatched = function () {
    /* Redraw all elements that contain hatches */
    this.drawPolygons(this.storage.svg1);
    this.drawAllBoreholes();
    this.refreshLegend();
    // this.redraw();
}

CrossSectionCanvas.prototype.setHatchColor = function (symbolName, color) {
    /* Arguments: a symbol name corresponding to a hatch file, a color. Updates the global variable that controls the color of each hatch and redraws all hatched elements such as they have the new color. */
    if (!symbolName) {
        return;
    }
    let oldPath = this.storage.soilSymbols.get(symbolName);
    if (!oldPath) {
        return;
    }
    let oldColor = this.pathToColor(oldPath);
    const blackPath = oldPath.replace(oldColor, '000000');
    const oldDataURL = hatchFilesDict[blackPath];
    if (! oldDataURL) {
        return;
    }
    const newPath = this.createColoredHatch(blackPath, color);
    this.storage.soilSymbols.set(symbolName, newPath);
    this.storage.hatchColors.set(symbolName, color);
    
    // this.refreshLegend();
    // this.drawPolygons(this.storage.svg1);
    this.redrawHatched();
    // this.redraw();
}

CrossSectionCanvas.prototype.setHatchColorOfCurrentSymbol = function (color) {
    /* Sets the color of the current hatch whose tooltip is open */
    this.setHatchColor(this.storage.selectingColorOfSymbol, color);
}

CrossSectionCanvas.prototype.drawColorButton = function (color, divElem) {
    /* Draws a button that is supposed to be part of a tooltip that changes the color of a hatch. Arguments: a color and an html element where the button should be put. */
    let btn = d3.select(divElem)
        // let btn = this.storage.d3_root.select(".hatchcolor")
        .append('button').attr('value', color).style("display", "inline-block").text(color)
        .on('click', symbolName => this.setHatchColorOfCurrentSymbol(color))
}

CrossSectionCanvas.prototype.disableRightClick = function () {
    this.storage.rootElem.querySelector(".svgWindow").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        event.stopPropagation();
    })
}

CrossSectionCanvas.prototype.callPrintAPI = async function (title, templateId, base64) {
    if (! title || ! templateId || ! base64) {
        return;
    }
    const obj = {
        title : title,
        templateId : templateId,
        base64 : base64
    }
    const post = JSON.stringify(obj);
    console.log(obj);

    const url = `https://ilogapp-dev.azurewebsites.net/v1/report/crosssection`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8')
    xhr.send(post);

    const promise = new Promise((resolve, reject) => {
        xhr.onload = function () {
            resolve(xhr.response);
        }
    })
    return promise;
}

CrossSectionCanvas.prototype.openPrintModal = function (title, figureTemplates) {
    const figureTemplatesArr = figureTemplates?.split(',').map(x => x ? x.trim() : '').map(x => {
        if (! x) {
            return ['', ''];
        }
        const split = x.split("|")
        if (split.length == 1) {
            return [split[0], ''];
        }
        return split;
    }) ?? [];
    const htmlString = `
    <form>
    <div class="form-group">
        <label for="title">TITLE</label>
        <input class="form-control" id="title">
    </div>
    <div class="form-group">
        <label for="figureTemplate">FIGURE TEMPLATE</label>
        <select class="form-control" id="figureTemplate">
        ${figureTemplatesArr.map(figureTemplate => {
            return `<option value="${figureTemplate[0]}">${figureTemplate[1]}</option>`
        })}
        </select>
    </div>
    </form>
    `

    const modalElem = this.storage.rootElem.querySelector('.printModal');
    
    const modalBodyElem = modalElem.querySelector('.modal-body');
    modalBodyElem.innerHTML = htmlString;
    
    const titleElem = modalBodyElem.querySelector("input#title");
    titleElem.value = title ?? '';

    const printMessage = modalElem.querySelector('.printMessage');

    const printModalButton = modalElem.querySelector('.onClickPrint');
    printModalButton.onclick = async () => {
        if (printModalButton.disabled) {
            return;
        }
        const title = titleElem?.value;
        const templateId = modalElem?.querySelector('#figureTemplate')?.value;

        printMessage.classList.remove('invisible');
        const buttons = Array.from(modalElem.querySelectorAll('.btn'));
        buttons.forEach(x => {
            x.disabled = true;
        })

        const closeModal = () => $(modalElem).modal('hide');
        
        const base64 = await this.generatePngForPrint();

        const pdfLink = await this.callPrintAPI(title, templateId, base64);
        console.log("PDF", pdfLink);
        window.open(pdfLink, '_blank');
        closeModal();

        buttons.forEach(x => {
            x.disabled = false;
        })

        printMessage.classList.add('invisible');
    };

    // replaces default behavior since it was also closing the crossSection modal
    const closeButtons = [
        modalElem.querySelector("button.close"),
        modalElem.querySelector(".closeButton")
    ]
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (button.disabled) {
                return;
            }
            $(modalElem).modal('hide');
        })
    })

    $(modalElem).modal({
        show: true,
        backdrop: false
    });
}

CrossSectionCanvas.prototype.onClickOpenPrintModal = function() {
    const title = this.getTitle() ?? 'Section';
    const figureTemplates = this.storage.figure_templates ?? ['test1', 'test2'];
    this.openPrintModal(title, figureTemplates);
}

CrossSectionCanvas.prototype.getPropertyGridRow = function (panelElem, optionName) {
    const rowElem = panelElem.querySelector(`.pgRow.${optionName}`);
    return rowElem;
}

CrossSectionCanvas.prototype.updatePropertyGrid = function (panelElem, optionName, value) {
    /* Updates a displayed value for a row of the property grid.
       The intention is to update values such as rotation angle of line based on width and height changes
       This function doesn't alter the options of an element drawn in the canvas, only what is displayed in the grid
    */
    const rowElem = this.getPropertyGridRow(panelElem, optionName);
    const cellElem = rowElem.querySelector(".pgCell:last-child");
    const inputElem = cellElem.querySelector("input");
    if (inputElem) {
        inputElem.value = value;
    }
    else {
        cellElem.textContent = value;
    }
}

CrossSectionCanvas.prototype.getUnitPrecision = function () {
    let unitPrecision = this.storage.scaleIsFeet ? 2 : 1;
    return unitPrecision;
}

function getRadioMeasureValue(crossSectionObj, pageSettingsRoot) {
    var elem = pageSettingsRoot.querySelector('input[name="radio1"]:checked') || pageSettingsRoot.querySelector(".crossSectionUnit");
    if (!elem) {
      return 'ft';
    }
    return elem.value
}
  
function handleRadioClick(crossSectionObj, pageSettingsRoot) {
    let newUnit = getRadioMeasureValue(crossSectionObj, pageSettingsRoot);
  
    // update crossSection canvas
    crossSectionObj.changeUnit(newUnit);
  
    // update standalone UI settings
    let d3_pageSettingsRoot = d3.select(pageSettingsRoot)
    d3_pageSettingsRoot.select('.horScaleM').classed("disabledarea", (newUnit == 'ft'))
    d3_pageSettingsRoot.select('.horScaleFt').classed("disabledarea", (newUnit != 'ft'))
    d3_pageSettingsRoot.select('.vertScaleM').classed("disabledarea", (newUnit == 'ft'))
    d3_pageSettingsRoot.select('.vertScaleFt').classed("disabledarea", (newUnit != 'ft'))
}
  
// put the scales and other things on the UI
function initializePageSettingsUIValues(crossSectionObj, pageSettingsRoot) {
    let d3_pageSettingsRoot = d3.select(pageSettingsRoot)
    //Horizental Scale FT
    d3_pageSettingsRoot.select(`.horScaleFt option[value='${$(pageSettingsRoot).find(".horScaleFt").val()}']`).property('selected', true);
  
    //Vertical Scale FT
    d3_pageSettingsRoot.select(`.vertScaleFt option[value='${$(pageSettingsRoot).find(".vertScaleFt").val()}']`).property('selected', true);
    //  crossSectionObj.changeHorScale(+parseInt($(".horScaleFt").val()))
    //  crossSectionObj.changeVertScale(+parseInt($(".vertScaleFt").val()))
  
    //Default Text Size
    // d3_pageSettingsRoot.select('.textSize').property("value", +parseInt($(pageSettingsRoot).find(".textSize").val()));
  
    d3_pageSettingsRoot.select(".charttitle").text(getDisplayNameCompat(crossSectionObj.storage.title))
    d3_pageSettingsRoot.select(".crossectionsreview").text("Cross Section Through: " + crossSectionObj.storage.data0.map(bh => bh.name).join(', '))
    // console.log("FIN console")
    d3_pageSettingsRoot.select('label.fin').text('FILE PROCESSING FINISHED SUCCESSFULLY')
    d3_pageSettingsRoot.select(".tsizes").text(`Window (${crossSectionObj.storage.PIXW}x${crossSectionObj.storage.PIXH} [from options.file] frozen, fits landscape A4)`)
}

const canonicalOrder = ["polygon", "polygonInterrogationPoint", "borehole", 'fieldtest', "waterLink", "waterSymbol", "bhpoint", "freepoint"];
const canonicalOrderDict = Object.fromEntries(canonicalOrder.map((x, i) => [x, i]));
CrossSectionCanvas.prototype.reinsertElementsAtOrderGroup = function(elems, orderGroup) {
    const group = this.storage.rootElem.querySelector('.' + orderGroup);
    if (! group) {
        return;
    }
    elems.forEach(elem => {
        group.appendChild(elem);
    })
    let allElems = Array.from(group.children)
    allElems = allElems.sort(function (a, b) {
        const va = canonicalOrderDict[a.getAttribute('elemType')] ?? 9999;
        const vb = canonicalOrderDict[b.getAttribute('elemType')] ?? 9999;
        const da = d3.select(a).data()[0];
        const db = d3.select(b).data()[0];
        // same group in the order
        // sort by timestamp, aka older shows up later
        if (va == vb) {
            return parseInt(da.timestamp) - parseInt(db.timestamp);
        }
        // later in the canonical order shows up later
        return va - vb;
    })
    allElems.forEach(elem => elem.remove());
    allElems.forEach(elem => {
        group.appendChild(elem);

        // apends elements above such as interrogation points
        let d = d3.select(elem).data()
        if (! d || ! Array.isArray(d) || d.length == 0) {
            d = [{timestamp : -1}];
        }
        const timestamp = d[0].timestamp ?? -1;
        const above = Array.from(this.storage.rootElem.querySelectorAll(`.above${timestamp}`));
        above.forEach(x => {
            group.append(x);
        })
    })
}

CrossSectionCanvas.prototype.reinsertElementsZOrder = function (arr) {
    const propertiesDicts = {
        'polygon' : this.storage.polygonProperties,
        'borehole' : this.storage.boreholeProperties,
        'fieldtest' : this.storage.fieldTestProperties,
        'waterLink' : this.storage.linkProperties,
        'textBox' : this.storage.texts,
    }
    let orderDict = {};
    arr.forEach(elem => {
        const d = d3.select(elem).data()[0];
        const timestamp = d?.timestamp;
        let dict = propertiesDicts[elem.getAttribute('elemType')];
        if (! dict) {
            return;
        }
        const properties = dict[timestamp];
        const zOrder = properties?.zOrder;
        if (! zOrder || zOrder == "Default") {
            return;
        }
        if (! (orderDict[zOrder])) {
            orderDict[zOrder] = [];
        }
        orderDict[zOrder].push(elem);
    })
    Object.entries(orderDict).forEach(entry => {
        const [key, arr] = entry;
        this.reinsertElementsAtOrderGroup(arr, 'order' + key);
    })
}

const elemAboveEverythingId = "elemAboveEverything";
CrossSectionCanvas.prototype.removeElemAboveEverything = function () {
    const svgUseElems = Array.from(this.storage.rootElem.querySelectorAll('.aboveEverything') ?? []);
    svgUseElems.forEach(svgUseElem => {
        if (!svgUseElem) {
            return;
        }
        const elemAboveEverything = this.storage.rootElem.querySelector(svgUseElem.getAttribute('href'));
        if (elemAboveEverything) {
            elemAboveEverything.id = '';
        }
        svgUseElem.remove();
    })
}

CrossSectionCanvas.prototype.showElemAboveEverything = function(elems) {
    if (! elems) {
        return;
    }
    this.removeElemAboveEverything();
    elems = Array.isArray(elems) ? elems : [elems];
    const rootGroup = this.storage.rootElem.querySelector('.root-group');
    elems.forEach((elem, index) => {
        const elemAboveEverything = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        const id = `${elemAboveEverythingId}${index}`;
        elemAboveEverything.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + id);
        elem.id = id;
        elemAboveEverything.classList.add('aboveEverything');
        rootGroup.appendChild(elemAboveEverything);
    })
}

const selectedClass = "selectedElem";
CrossSectionCanvas.prototype.showNoElemsAsSelected = function () {
    Array.from(this.storage?.rootElem?.querySelectorAll('.' + selectedClass)).forEach(x => {
        x.classList.remove(selectedClass);
    });
}

// show visually only
// use CrossSectionCanvas.prototype.selectElemFromTimestamp or selectElem instead
CrossSectionCanvas.prototype.showElemAsSelected = function (elem, showAbove=true) {
    if (! elem) {
        return;
    }
    this.cancelSelection(elem);
    const arr = Array.isArray(elem) ? elem : [elem];
    arr.forEach(elem => {
        if (! elem) {
            return;
        }
        elem.classList.add(selectedClass);
    })
    if (showAbove) {
        this.showElemAboveEverything(arr);
    }
    this.storage.rootElem?.querySelector('.elemSelectedTooltip')?.classList?.remove(tooltipHiddenClass);
}

CrossSectionCanvas.prototype.selectElemFromTimestamp = function (selector, timestamps) {
    // this redraws things so we need to query for the element after
    this.endDrawModes();
    timestamps = Array.isArray(timestamps) ? timestamps : [timestamps];
    const elems = timestamps.map(timestamp => {
        return this.timestampToHtmlElem(selector, timestamp);
    })
    this.showElemAsSelected(elems);
}

CrossSectionCanvas.prototype.selectElem = function (elem, showAbove = true) {
    if (! elem) {
        return;
    }
    this.endDrawModes();
    this.showElemAsSelected(elem, showAbove);
}

CrossSectionCanvas.prototype.updateHorAxisTicksText = function () {
    this.storage.svg1.selectAll('.axTop')
    .style('font-family', this.storage.axisHorFontFamily ?? defaultStorage.axisHorFontFamily)
    .style('font-size', this.storage.axisHorFontSize ?? defaultStorage.axisHorFontSize)
}

CrossSectionCanvas.prototype.updateVertAxisTicksText = function () {
    this.storage.svg1.selectAll('.axLeft')
    .style('font-family', this.storage.axisVertFontFamily ?? defaultStorage.axisVertFontFamily)
    .style('font-size', this.storage.axisVertFontSize ?? defaultStorage.axisVertFontSize)
}
  
CrossSectionCanvas.prototype.onPropertyChange = function (grid, name, value) {
    const crossSectionObj = this;

    const updateLegendProperty = () => {
        crossSectionObj.storage[name] = value;
        crossSectionObj.refreshLegend();
    }

    const dict = {
        // ["radioFeet", event => {
        //   handleRadioClick(crossSectionObj, pageSettingsRoot);
        // }],
        // ["radioMetric", event => {
        //   handleRadioClick(crossSectionObj, pageSettingsRoot);
        // }],
        "horScale" : {
            fn : () => {
                const scale = crossSectionObj.scaleNameToValue(value);
                crossSectionObj.changeHorScale(scale);
                if (crossSectionObj.storage.isShowing3d) {
                    window['setScale'](this.storage.viewer3d, crossSectionObj.storage.AX, crossSectionObj.storage.AY, crossSectionObj.storage.HatchScale, this);
                }
            }
        },
        "vertScale" : {
            fn : () => {
                const scale = crossSectionObj.scaleNameToValue(value);
                crossSectionObj.changeVertScale(scale);
                if (crossSectionObj.storage.isShowing3d) {
                    window['setScale'](this.storage.viewer3d, crossSectionObj.storage.AX, crossSectionObj.storage.AY, crossSectionObj.storage.HatchScale, this);
                }
            }
        },
    
        "GridlineThickness" : {
            fn : () => {
                crossSectionObj.changeGridPathWidth(value)
            }
        },
        "HatchScale" : {
            fn : () => {
                crossSectionObj.changeBoreholeImgScale(value)
                if (crossSectionObj.storage.isShowing3d) {
                    window['setScale'](this.storage.viewer3d, crossSectionObj.storage.AX, crossSectionObj.storage.AY, crossSectionObj.storage.HatchScale, this);
                }
            }
        },
        "LineThickness" : {
            fn : () => {
                crossSectionObj.changePathsWidth(value);
                if (crossSectionObj.storage.isShowing3d) {
                    window['updateLineThickness'](crossSectionObj.storage.viewer3d.scene, value*window['lineScalingFactor']);
                }
            }
        },
        "lineStyleScale" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                crossSectionObj.storage?.rootElem?.style?.setProperty('--lineStyleScale', this.storage.lineStyleScale);
                if (crossSectionObj.storage.isShowing3d) {
                    window['updateLineStyleScale'](crossSectionObj.storage.viewer3d.scene, value);
                }
            }
        },
        "boreholeWidth" : {
            fn : () => {
                crossSectionObj.applyNewBoreholeWidth(value)
            }
        },
        "PointSize" : {
            fn : () => {
                crossSectionObj.changeCornerSize(value)
            }
        },
        "pointFillColor" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                crossSectionObj.storage?.rootElem?.style?.setProperty('--pointFillColor', this.storage.pointFillColor);
            }
        },
        "pointLineColor" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                crossSectionObj.storage?.rootElem?.style?.setProperty('--pointLineColor', this.storage.pointLineColor);
            }
        },
        "pointHasFill" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                crossSectionObj.storage?.rootElem?.style?.setProperty('--pointFillOpacity', this.storage.pointHasFill ? 1 : 0);
            }
        },
        "TEXTSIZE" : {
            fn : () => {
                crossSectionObj.changeTextSize(value)
            }
        },
        "showLegend" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendBoxW" : {
            fn : () => {
                crossSectionObj.changeLegendSize(value, crossSectionObj.storage.legendBoxH);
            }
        },
        "legendBoxH" : {
            fn : () => {
                crossSectionObj.changeLegendSize(crossSectionObj.storage.legendBoxW, value);
            }
        },
        "legendBoxNumberOfColumns" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendBoxFontSize" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendBoxFontFamily" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendBoxText" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendPinnedTo" : {
            fn : () => {
                // no longer pinned, want to keep the object in the current place
                // so the user can drag it from there
                // instead of the object jumping to the old position
                if (value == '(none)' && crossSectionObj.storage.legendPinnedTo != '(none)' ) {
                    const elem = crossSectionObj.storage.rootElem.querySelector('.legend');
                    const style = window.getComputedStyle(elem);
                    const matrix = new DOMMatrixReadOnly(style.transform);
                    const previousX = matrix.e;
                    const previousY = matrix.f;
                    if (previousX != null && previousY != null) {
                        crossSectionObj.storage.LEGDX = previousX;
                        crossSectionObj.storage.LEGDY = previousY;
                        crossSectionObj.storage.LEGDXREAL = previousX / crossSectionObj.storage.AX;
                        crossSectionObj.storage.LEGDYREAL = previousY / crossSectionObj.storage.AY;
                    }
                }
                updateLegendProperty();
                crossSectionObj.openLegendBoxPropertyGrid();
            }
        },
        "legendScaleBar" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendBackgroundColor" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "legendHasBorder" : {
            fn : () => {
                updateLegendProperty();
                crossSectionObj.openLegendBoxPropertyGrid();
            }
        },
        "legendBorderColor" : {
            fn : () => {
                updateLegendProperty();
            }
        },
        "axisVertText" : {
            fn : () => {
                crossSectionObj.setFromDict('titleLeft', 'text', value);
            }
        },
        "axisVertFontSize" : {
            fn : () => {
                crossSectionObj.setFromDict('titleLeft', 'font-size', value);
                crossSectionObj.updateVertAxisTicksText();
            }
        },
        "axisVertFontFamily" : {
            fn : () => {
                crossSectionObj.setFromDict('titleLeft', 'font-family', value);
                crossSectionObj.updateVertAxisTicksText();
            }
        },
        "axisHorText" : {
            fn : () => {
                crossSectionObj.setFromDict('titleTop', 'text', value);
            }
        },
        "axisHorFontSize" : {
            fn : () => {
                crossSectionObj.setFromDict('titleTop', 'font-size', value);
                crossSectionObj.updateHorAxisTicksText();
            }
        },
        "axisHorFontFamily" : {
            fn : () => {
                crossSectionObj.setFromDict('titleTop', 'font-family', value);
                crossSectionObj.updateHorAxisTicksText();
            }
        },
        "gridFontSize" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                
                if(value != 'auto')
                    value = value*10;
                                    
                window['changeGridTextSize'](this, value, this.storage.isShowingPlan)
            }
        },
        "gridHorText" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                window['changeAxisLabel'](this, value, 'xAxisTitle', this.storage.isShowingPlan)
            }
        },
        "gridVertText" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                window['changeAxisLabel'](this, value, 'zAxisTitle', this.storage.isShowingPlan)
            }
        },
        "toggleOutline" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                window['toggleGridOutline'](this, value);
            }
        },
        "gridZText" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                window['changeAxisLabel'](this, value, 'yAxisTitle', this.storage.isShowingPlan)
            }
        },
        "showFieldTestPlots" : {
            fn : () => {
                this.storage.showFieldTestPlots = value;
                this.drawAllFieldTests();
                this.zoomExtent(true);
            }
        },
        "interrogationPointFontSize" : {
            fn : () => {
                crossSectionObj.storage[name] = value;
                crossSectionObj.drawPolygonInterrogationPoints(crossSectionObj.storage.svg1);
                crossSectionObj.drawWaterlineInterrogationPoints(crossSectionObj.storage.svg1);
            }
        },
        "Unit" : {
            fn : () => {
                crossSectionObj.changeUnit(value, {updateSizes : true, redraw : true});
            }
        }
    }
    const fn = dict[name]?.fn;
    if (! fn) {
        return;
    }
    fn();
}

CrossSectionCanvas.prototype.getPropertyGridRightBoundary = function () {
    const propertyGridCol = this?.storage?.rootElem?.querySelector(".propertyGridCol");
    if (! propertyGridCol) {
        return 0;
    }
    const width = parseFloat(propertyGridCol?.offsetWidth ?? 0);
    const position = parseFloat(propertyGridCol?.getBoundingClientRect()?.left ?? 0);
    const parentPosition = parseFloat(propertyGridCol?.parentElement?.getBoundingClientRect()?.left ?? 0);
    const rightBoundary = Math.max(width + (position - parentPosition), 0)
    return rightBoundary;
}

// adjusts position according to propertygrid being open or closed
CrossSectionCanvas.prototype.adjustCanvasPosition = function () {
    const canvasCol = this?.storage?.rootElem?.querySelector(".canvasCol");
    if (! canvasCol) {
        return;
    }
    const propertyGridRightBoundary = this.getPropertyGridRightBoundary();
    canvasCol.style.left = `${propertyGridRightBoundary}px`;
}

CrossSectionCanvas.prototype.propertyGridAnimationStep = function (now, fx) {
    this.adequateSvgSizeToRootElem();
    this.adequate3dViewerSizeToRootElem();
}

CrossSectionCanvas.prototype.propertyGridAnimationComplete = function (now, fx) {
    const propertyGridCol = this?.storage?.rootElem?.querySelector(".propertyGridCol");
    if (propertyGridCol?.classList.contains(closedPropertyGridClass)) {
        propertyGridCol?.classList?.remove(closedPropertyGridClass);
    }
    else {
        propertyGridCol?.classList?.add(closedPropertyGridClass);
    }
    // PS: changing the class will change the width
    // this width is taken into account when calculating the ideal width of svg
    // this is why resizing works
    this.adequateSvgSizeToRootElem();
    this.adequate3dViewerSizeToRootElem();
    this.adjustCanvasPosition();
}

const closedPropertyGridClass = 'closedPropertyGrid';
CrossSectionCanvas.prototype.openPropertyGrid = function () {
    const propertyGridCol = this?.storage?.rootElem?.querySelector(".propertyGridCol");
    if (! propertyGridCol) {
        return;
    }

    const width = propertyGridCol.offsetWidth;
    $(propertyGridCol).animate({
        left: `0`
    });
    const canvasCol= this?.storage?.rootElem?.querySelector(".canvasCol");
    $(canvasCol).animate({
        left: `${width}`
    },
    {
        step: (now, fx) => this.propertyGridAnimationStep(now, fx),
        complete: (now, fx) => this.propertyGridAnimationComplete(now, fx),
    });
}

CrossSectionCanvas.prototype.closePropertyGrid = function () {
    const propertyGridCol = this?.storage?.rootElem?.querySelector(".propertyGridCol");
    if (! propertyGridCol) {
        return;
    }

    const width = propertyGridCol.offsetWidth;
    $(propertyGridCol).animate({
        left: `-${width}`
    });
    const canvasCol= this?.storage?.rootElem?.querySelector(".canvasCol");
    $(canvasCol).animate({
        left: `0`,
    },
    {
        step: (now, fx) => this.propertyGridAnimationStep(now, fx),
        complete: (now, fx) => this.propertyGridAnimationComplete(now, fx),
    });
}

CrossSectionCanvas.prototype.onClickFlipPropertyGrid = function () {
    const propertyGridCol = this?.storage?.rootElem?.querySelector(".propertyGridCol");
    const closeButton = this?.storage?.rootElem?.querySelector(".closePropertyGrid");
    const closeButtonIcon = closeButton?.querySelector(".closePropertyGrid > i");
    if (! propertyGridCol) {
        return;
    }
    if (propertyGridCol.classList.contains(closedPropertyGridClass)) {
        this.openPropertyGrid();
        if (! closeButton) {
            return;
        }
        closeButton.classList.remove("closeButtonClosed'");
        closeButton.classList.add("closeButtonOpen");
        if (! closeButtonIcon) {
            return;
        }
        closeButtonIcon.classList.add("fa-chevron-left");
        closeButtonIcon.classList.remove("fa-chevron-right");
    }
    else {
        this.closePropertyGrid();
        if (! closeButton) {
            return;
        }
        closeButton.classList.remove("closeButtonOpen");
        closeButton.classList.add("closeButtonClosed");
        if (! closeButtonIcon) {
            return;
        }
        closeButtonIcon.classList.add("fa-chevron-right");
        closeButtonIcon.classList.remove("fa-chevron-left");
    }
}

const groupRowCollapsedClass = "groupRowCollapsed";
const rowCollapsedClass = "rowCollapsed";
const collapsedIconClass = "fas fa-caret-up";
const notCollapsedIconClass = "fas fa-caret-down";
CrossSectionCanvas.prototype.togglePropertyGridRow = function (rowElem) {
    if (! rowElem) {
        return;
    }

    const icon = rowElem.querySelector('i');

    let siblings = Array.from(rowElem.parentElement.children);
    const bottom = siblings.findIndex(sibling => sibling == rowElem);
    siblings = siblings.slice(bottom + 1);
    const top = siblings.findIndex(sibling => sibling.classList.contains('pgGroupRow'));
    if (top != -1) {
        siblings = siblings.slice(0, top);
    }

    if (rowElem.classList.contains(groupRowCollapsedClass)) {
        rowElem.classList.remove(groupRowCollapsedClass);
        icon.className = notCollapsedIconClass;
        siblings.forEach(sibling => {
            sibling.classList.remove(rowCollapsedClass);
        })
    }
    else {
        rowElem.classList.add(groupRowCollapsedClass);
        icon.className = collapsedIconClass;
        siblings.forEach(sibling => {
            sibling.classList.add(rowCollapsedClass);
        })
    }
}

CrossSectionCanvas.prototype.initializeCollapsiblePropertyGridRows = function (propertyGrid) {
    const rows = Array.from(propertyGrid.querySelectorAll('.pgGroupRow'));
    rows.forEach(row => {
        const icon = document.createElement('i');
        icon.className = notCollapsedIconClass;
        const cell = row.querySelector('td');
        const text = cell.innerHTML;
        cell.innerHTML = `<div><i class="${notCollapsedIconClass}"></i><span>${text}</span></div>`;
        row.onclick = () => this.togglePropertyGridRow(row);
    })
}

CrossSectionCanvas.prototype.markPropertyGridElementsThatShowOn3d = function (panelElem) {
    const elemClasses = ["otherTestHolesOption", "otherCrossSectionsOption"];
    elemClasses.forEach(elemClass => {
        const elem = panelElem.querySelector(`.pgRow.${elemClass}`);
        elem.classList.add('show3dOnly');
    })
}

CrossSectionCanvas.prototype.selectToMultiSelect = function (elem, noneText, allText, optionChangedCallback) {
    elem.multiple = true;
        
    const allOptionsElems = Array.from(elem.querySelectorAll('option'));
    
    const noneElem = allOptionsElems.find(elem => elem.innerText === noneText);
    const allElem = allOptionsElems.find(elem => elem.innerText === allText);
    const optionsElems = allOptionsElems.filter(elem => elem != noneElem && elem != allElem);

    if (noneElem) {
        noneElem.classList.add('multiselectorNone');
    }
    if (allElem) {
        allElem.classList.add('multiselectorAll');
    }
    optionsElems.forEach(optionElem => {
        if (! optionElem) {
            return;
        }
        optionElem.classList.add('multiselectorOption');
    })

    elem.size = allOptionsElems.length;
    const setElem = (elem, selected) => {
        if (! elem) {
            return elem;
        }
        elem.selected = selected;
    }
    allOptionsElems.forEach(elem => {
        setElem(elem, false);
    })
    setElem(noneElem, true)
    setElem(allElem, false)
    if (optionsElems.length == 0) {
        setElem(allElem, false);
        setElem(noneElem, true)
    }

    const dropdown = elem.closest('.customDropdown');
    const updateButton = () => {
        // if inside a custom dropdown
        const buttonElem = dropdown?.querySelector('.customDropdownButton');
        if (buttonElem) {
            let text = allText;
            if (noneElem?.selected) {
                text = noneText;
            }
            if (! allElem?.selected && ! noneElem?.selected) {
                const number = optionsElems.filter(elem => elem?.selected).length;
                text = `${number} selected`;
            }
            buttonElem.innerText = text;
        }
    }

    const getCurrentSelection = () => {
        return optionsElems.filter(elem => elem?.selected).map(x => x?.innerText ?? '');
    }
    
    const onmousedown = (event) => {
        event.preventDefault();
        const previouslySelected = getCurrentSelection();

        if (event.target == noneElem) {
            optionsElems.forEach(optionElem => {
                setElem(optionElem, false);
            })
            setElem(noneElem, true);
            setElem(allElem, false);
        }
        else if (event.target == allElem) {
            optionsElems.forEach(optionElem => {
                setElem(optionElem, true);
            })
            setElem(noneElem, false);
            setElem(allElem, true);
        }
        else {
            event.target.selected = ! event.target.selected;
        }

        const anySelected = optionsElems.some(elem => elem?.selected);
        const allSelected = optionsElems.every(elem => elem?.selected);
        if (anySelected) {
            setElem(noneElem, false);
        }
        else {
            setElem(noneElem, true);
        }
        if (allSelected) {
            setElem(allElem, true);
        }
        else {
            setElem(allElem, false);
        }

        updateButton();

        const newlySelected = getCurrentSelection();
        optionChangedCallback(newlySelected);

        if (event.target == noneElem || event.target == allElem) {
            this.toggleCustomDropdown(dropdown);
        }
    }
        
    allOptionsElems.forEach(optionElem => {
        optionElem.addEventListener('mousedown', onmousedown);
    });

    updateButton();
    optionChangedCallback(getCurrentSelection());
}

CrossSectionCanvas.prototype.toggleCustomDropdown = function (elem) {
    const menu = elem?.querySelector('.customDropdownMenu');
    if (! menu) {
        return;
    }
    if (menu.classList.contains(customDropdownOpenClass)) {
        menu.classList.remove(customDropdownOpenClass);
    }
    else {
        menu.classList.add(customDropdownOpenClass);
    }
}

const customDropdownOpenClass = 'open';
CrossSectionCanvas.prototype.initializeCustomDropdown = function(elem) {
    if (! elem) {
        return;
    }
    const button = elem.querySelector('.customDropdownButton');
    const menu = elem.querySelector('.customDropdownMenu');
    if (! button || ! menu) {
        return;
    }
    button.onclick = (event) => {
        if (!elem || elem.classList.contains('disabled')) {
            return;
        }
        this.toggleCustomDropdown(elem);
    }
    document.addEventListener("click", (event) => {
        // @ts-expect-error
        const closestDropdown = event.target.closest('.customDropdown');
        if (closestDropdown == elem) {
            return;
        }
        menu.classList.remove(customDropdownOpenClass);
    })
}

CrossSectionCanvas.prototype.onOtherCrossSectionOptionChange = async function (val) {
    const crossSectionObj = this;
    crossSectionObj.storage['otherCrossSectionsOption'] = val;
    
    const scene = this.storage.viewer3d?.scene;
    const sceneMinRealCoordinates = this.storage.viewer3d?.minRealCoordinates;
    const options = await window['get3dOptions'](crossSectionObj);

    if (this.storage.isShowing3d) {
        window['showOtherCrossSections'](crossSectionObj, scene, sceneMinRealCoordinates, options);
        await window['addGrid'](crossSectionObj.storage.viewer3d, crossSectionObj);
        this.storage.viewer3d.toBeRotated = window['getAllWithName'](scene, 'toBeRotated');
        window['zoomAll']();
    }
}

CrossSectionCanvas.prototype.onOtherTestholesOptionChange = async function (val) {
    const crossSectionObj = this;
    crossSectionObj.storage['otherTestHolesOption'] = val;
    
    const scene = this.storage.viewer3d?.scene;
    const sceneMinRealCoordinates = this.storage.viewer3d?.minRealCoordinates;
    const options = await window['get3dOptions'](crossSectionObj);

    if (this.storage.isShowing3d) {
        window['showOtherTestHoles'](crossSectionObj, scene, sceneMinRealCoordinates, options);
        await window['addGrid'](crossSectionObj.storage.viewer3d, crossSectionObj);
        this.storage.viewer3d.toBeRotated = window['getAllWithName'](scene, 'toBeRotated');
        window['zoomAll']();
    }
}

CrossSectionCanvas.prototype.initializePropertyGridMultiselectors = function (panelElem) {
    const arr = [
        {elemClass : "otherTestHolesOption", callback : (val) => this.onOtherTestholesOptionChange(val)},
        {elemClass : "otherCrossSectionsOption", callback : (val) => this.onOtherCrossSectionOptionChange(val)}];
    arr.forEach(dict => {
        const {elemClass, callback} = dict;
        const elem = panelElem.querySelector(`.pgRow.${elemClass} select`);
        this.selectToMultiSelect(elem, '(none)', 'Entire Project', callback);
        const dropdown = panelElem.querySelector(`.pgRow.${elemClass} .customDropdown`);
        const select = dropdown.querySelector('select');
        if (select?.disabled) {
            dropdown.classList.add('disabled');
        }
        this.initializeCustomDropdown(dropdown);
    })
}

CrossSectionCanvas.prototype.disablePropertyGridSelectsWithNoOption = function (panelElem) {
    const selects = Array.from(panelElem?.querySelectorAll('select'))
    selects.forEach(select => {
        const options = Array.from(select.querySelectorAll('option'));
        if (options.length <= 1) {
            select.disabled = true;
        }
        else {
            select.disabled = false;
        }
    })
}

CrossSectionCanvas.prototype.initializePropertyGridLabelClick = function (panelElem) {
    if (! panelElem){
        return;
    }
    Array.from(panelElem.querySelectorAll('.pgRow')).forEach(row => {
        const cells = Array.from(row.querySelectorAll('.pgCell'));
        if (! cells || cells.length < 2) {
            return;
        }
        cells[0].addEventListener('click', event => {
            const input = cells[1].querySelector('select') ?? cells[1].querySelector('input') ?? cells[1].querySelector('textarea');
            if (input) {
                input.focus();
                if (input.setSelectionRange) {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
                return;
            }
            cells[1].focus();
        });
    })

}


const dateFormatOptions = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd", "yyyy-MM-dd", "MM-dd-yyyy", "dd-MM-yyyy", "yyyy-MMM-dd", "MMM-dd-yyyy", "dd-MMM-yyyy"];
const fontFamilyOptions  = ["Arial", "Courier New", "Georgia", "Tahoma", "Times New Roman", "Verdana"]
const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(x => x.toString());
const gridFontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 96, 128, 'auto'].map(x => x.toString());
const transparencyOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(x => {
    let value = (x / 100).toFixed(1);
    if (x == 0) {
        value = "0";
    }
    if (x == 100) {
        value = "1";
    } 
    return {text: `${x}%`, value : value}
})
const lineThicknessOptions = [1, 2, 3, 5, 10].map(x => x.toString());
const pointSizeOptions = [5, 10, 20].map(x => x.toString());
const patternScaleOptions = [{text : "1", value : "10"}, {text : "2", value : "20"}, {text : "3", value : "30"}, {text : "4", value : "40"}, {text : "5", value : "50"},];
const zOrderOptions = ["Back", "Default", "Front"];
const lineStyleOptions = ["Dash", "Dot", "Solid"];
const interrogationOptions = ["(none)", "Segment", "Single", "Double", "Pattern"];


const customPropertyGridTypes = {
    textarea: {
        html: function (elemId, name, value, meta) {
            let html = `
            <span>${meta.name}</span>
            <textarea class="textProp" id="${elemId}">${value}</textarea>
            `
            return html;
        },

        valueFn: function () {
            return $('.textProp').val();
        }
    },
    uploadimage: {
        html: function() {
            // will be altered by addLogoUploadButton
            let html = `<div id="imageUpload"></div>`
            return html;

        },
        valueFn: function () {
        }
    },
    // has to be initialized with initializePropertyGridMultiselectors
    multiselection : {
        html : function(elemId, name, value, meta) {
            const options = meta.options.map(option => {
                let text = option?.text ?? option;
                let value = option?.value ?? option;
                const html = `<option>${text}</option>`;
                return html
            }).join('\n');

            let html = `
            <div class="customDropdown">
                <div class="customDropdownButton">
                Dropdown button
                </div>
                <div class="customDropdownMenu">
                    <select multiple class="customMultiselect">
                        ${options}
                    </select>
                </div>
            <div>
            `
            return html;
        },
        valueFn: false, // custom defined later
    },
    // this is just the skeleton, internal part is inserted later
    patternAndColor : {
        html : function(elemId, name, value, meta) {
            const [pattern, color] = value;
            let html = `
            <div>
            <div class="patternPicker">
                <div class="sp-replacer sp-light">
                    <div class="sp-preview">
                        <div class="sp-preview-inner hatchPreview">
                        </div>
                    </div>
                    <div class="sp-dd">▼</div>
                </div>
            </div>
            <div class="colorPicker">
                <input type='text' id="patternColor" />
            </div>
            </div>
            `
            return html;
        },
        valueFn : false, // custom defined later
    },
    pattern : {
        html : function(elemId, name, value, meta) {
            const [pattern, color] = value;
            let html = `
            <div class="patternPicker">
                <div class="sp-replacer sp-light">
                    <div class="patternName"></div>
                    <div class="sp-preview">
                        <div class="sp-preview-inner hatchPreview">
                        </div>
                    </div>
                    <div class="sp-dd">▼</div>
                </div>
            </div>
            `
            return html;
        },
        valueFn : false, // custom defined later
    }
}

CrossSectionCanvas.prototype.initializeSelectHatchTooltipEventListeners = function () {
    const tooltip = this.storage?.rootElem?.querySelector('.selectHatchTooltip');
    if (! tooltip) {
        return;
    }
    this.storage.rootElem.addEventListener('click', event => {
        const closest1 = event.target?.closest('.selectHatchTooltip');
        const closest2 = event.target?.closest('.patternPicker');
        if (! closest1 && ! closest2) {
            this.toggleInviz(tooltip, false);
        }
    })
}

CrossSectionCanvas.prototype.toggleInviz = function (elem, bool) {
    if (! bool) {
        elem?.classList.add('inviz');
    }
    else {
        elem?.classList.remove('inviz');
    }
}


CrossSectionCanvas.prototype.toggleInvisible = function (elem, bool) {
    if (! bool) {
        elem?.classList.add('invisible');
    }
    else {
        elem?.classList.remove('invisible');
    }
}

CrossSectionCanvas.prototype.initializePattern = function (elem, soilSymbol) {
    if (! elem) {
        return;
    }
    const patternPicker = elem.querySelector('.patternPicker');

    const hatchDiv = patternPicker.querySelector('.hatchPreview');
    if (hatchDiv) {
        const src = this.soilSymbolToCurrentSrc(soilSymbol);
        const coloredSrc = this.getColoredSrc(src);
        hatchDiv.style.backgroundImage = `url(${coloredSrc})`;
    }
    const textDiv = patternPicker.querySelector('.patternName')
    if (textDiv) {
        textDiv.innerText = soilSymbol;
    }
    
    const tooltip = this.storage.rootElem.querySelector('.selectHatchTooltip');
    
    patternPicker.addEventListener('click', (event) => {
        const bool = tooltip.classList.contains('inviz');
        this.toggleInviz(tooltip, bool);
        if (bool) {
            const rect = patternPicker.getBoundingClientRect();
            const rootRect = this.storage.rootElem?.getBoundingClientRect();
            const rootTop = rootRect?.top ?? 0;
            const top = rect.top - rootTop - 3;
            console.log(rect, top, rootTop);
            tooltip.style.top = top + 'px';
        }
    })
}

CrossSectionCanvas.prototype.showHatchAsSelectedInTooltip = function (soilSymbol) {
    if (! soilSymbol) {
        return;
    }
    const tooltip = this.storage.rootElem.querySelector('.selectHatchTooltip');
    if (! tooltip) {
        return;
    }
    Array.from(tooltip.querySelectorAll('.selectedHatch')).forEach(elem => {
        elem.classList.remove('selectedHatch');
    })
    const button = tooltip.querySelector(`button[symbol="${soilSymbol}"`);
    if (! button) {
        return;
    }
    button.classList.add('selectedHatch');

}

CrossSectionCanvas.prototype.initializePatternAndColor = function (elem, value, colorPickerOptions={}) {
    if (! elem) {
        return;
    }

    const [soilSymbol, color] = value;
    const colorPicker = elem.querySelector('.colorPicker input');
    $(colorPicker).spectrum({...colorPickerOptions, color : color});
    this.initializePattern(elem, soilSymbol);
}

// property grid
function comparePropertiesGenerator(optionsMetadata) {
    // Build a dictionary to help sorting properties. The order is the same as optionsMetadata
    // Example of entry: companyLogoSource : 2
    const defaultSortingEntries = Object.keys(optionsMetadata).map((x, index) => [x, index]);
    const defaultSortDict = Object.fromEntries(defaultSortingEntries);
    function compareProperties(prop1, prop2) {
        /* -1 if prop1 < prop2, 0 if equal, 1 if prop1 > prop2 */
        const infinity = 9999;
        const index1 = defaultSortDict[prop1] ?? infinity
        const index2 = defaultSortDict[prop2] ?? infinity;
        return index1 - index2;
    }
    return compareProperties;
}

CrossSectionCanvas.prototype.coercePanelDataToOptionsMetadata = function (panelData, optionsMetadata) {
    Object.keys(optionsMetadata).forEach(key => {
        // coerce type so the proper value is shown
        if (key in panelData && optionsMetadata[key]?.type == "options" && optionsMetadata[key].options && optionsMetadata[key].options.length > 0) {
            let valueExample = optionsMetadata[key].options[0];
            if (valueExample?.value) {
                valueExample = valueExample.value;
            }
            const newValue = coerceType(panelData[key], valueExample);
            if (newValue != null) {
                panelData[key] = newValue;
            }
        }
    })
}

/* Opens panel where you can edit the properties of selected object(s). Uses jqPropertyGrid.js library. */
CrossSectionCanvas.prototype.initializePropertyGrid = function (onPlanMode = false, on3DMode = false) {
    let panelData = {};
    const dataInStorage = [
        "GridlineThickness",
        "HatchScale",
        "LineThickness",
        "boreholeWidth",
        "PointSize",
        "pointLineColor",
        "pointHasFill",
        "pointFillColor",
        "showLegend",
        "otherTestHolesOption",
        "otherCrossSectionsOption",
        "showFieldTestPlots",
        
        ...( (!onPlanMode && !on3DMode) ? ["axisHorText"] : []),
        ...( (!onPlanMode && !on3DMode) ? ["axisHorFontFamily"] : []),
        ...( (!onPlanMode && !on3DMode) ? ["axisHorFontSize"] : []),
        ...( (!onPlanMode && !on3DMode) ? ["axisVertText"] : []),
        ...( (!onPlanMode && !on3DMode) ? ["axisVertFontFamily"] : []),
        ...( (!onPlanMode && !on3DMode) ? ["axisVertFontSize"] : []),
        
        ...( (onPlanMode || on3DMode) ? ["gridHorText"] : []),
        ...( (onPlanMode || on3DMode) ? ["gridFontSize"] : []),
        ...( (onPlanMode || on3DMode) ? ["gridVertText"] : []),

        ...( (onPlanMode && !on3DMode) ? ["toggleOutline"] : []),

        ...( on3DMode ? ["gridZText"] : []),

        "lineStyleScale",
        "interrogationPointFontSize",
        "Unit",
        "Coordinates_Unit",
        "ProjectDepth_Unit"
    ]
    dataInStorage.forEach(key => {
        panelData[key] = this.storage[key] ?? '';
    });
    const scales = this.getCurrentScaleName();
    const otherData = {
        horScale : scales[0],
        vertScale : scales[1]
    }
    Object.keys(otherData).forEach(key => {
        if (otherData[key] == null) {
            otherData[key] == '';
        }
    });
    panelData = {...panelData, ...otherData};

    // panel options
    const scaleArr = this.storage.scaleIsFeet ? this.storage.defaultOptions.feet : this.storage.defaultOptions.m;
    const scaleOptions = scaleArr.map(x => x[0]);

    const testholes = this?.storage?.otherTestHolesData?.filter(x => {
        // only show boreholes that don't already exist
        return ! this.boreholeNameToProperties(x?.th_title);
    }).map(x => {
        return {
            text : x?.th_title ? `${x.th_title}` : '',
            value : x
        }
    }) ?? [];
    const noneOption = { text : "(none)", value : "(none)"};
    const allOption = { text : "Entire Project", value : "Entire Project"};
    let baseTestHoleOptions = [noneOption, allOption];
    if (testholes.length == 0) {
        baseTestHoleOptions = [noneOption];
        panelData.otherTestHolesOption = "(none)";
    }
    const testHoleOptions = [
        ...baseTestHoleOptions,
        ...testholes
    ];
    
    const otherCrossSections = this?.storage?.otherCrossSectionsData?.map(x => {
        return {
            text : x?.title ? `${x.title}` : '',
            value : x
        }
    }) ?? [];

    let baseCrossSectionOptions = [noneOption, allOption];
    if (otherCrossSections.length == 0) {
        baseCrossSectionOptions = [noneOption];
        panelData.otherTestHolesOption = "(none)";
    }

    const crossSectionOptions = [
        ...baseCrossSectionOptions,
        ...otherCrossSections
    ];

    const legendBoxNumberOfColumnsOptions = [
        {text : 'One column', value : 1},
        {text : 'Two columns', value : 2},
        {text : 'Three column', value : 3},
        {text : 'Four columns', value : 4},
    ];

    const unit = this.storage.scaleIsFeet ? 'ft' : 'm'

    const optionsMetadata = {

        boreholeWidth: {name : `Borehole Width (${this.getCoordinateUnit()})`, group : "Global Settings"},
        Coordinates_Unit : {name : "Coordinates Unit", group : "Global Settings", type : "label"},
        ProjectDepth_Unit : {name : "Depth Unit", group : "Global Settings", type : "label"},
        Unit : {name: "Display Unit", group : "Global Settings", type : "options", options : ["ft", "m"]},
        showFieldTestPlots : {name : "Field Test Plots", group : "Global Settings", type : "boolean"},
        TEXTSIZE: {name : "Font Size (px)", group : "Global Settings", type : "options", options : fontSizeOptions},
        GridlineThickness: {name : "Gridline Thickness (px)", group : "Global Settings", type : "options", options : lineThicknessOptions},
        showLabels : {name : "Labels", group : "Global Settings", type : "boolean"},
        showLegend : {name : "Legend Box", group : "Global Settings", type : "boolean"},
        lineStyleScale : {name : "Line Style Scale", group : "Global Settings", type : "options", options : ["1", "2", "5", "10", "50", "100"]},
        LineThickness: {name : "Line Thickness (px)", group : "Global Settings", type : "options", options : lineThicknessOptions},
        otherCrossSectionsOption : {name : "Other Cross Section", group : "Global Settings", type : "multiselection", options : crossSectionOptions},
        otherTestHolesOption : {name : "Other Test Holes", group : "Global Settings", type : "multiselection", options : testHoleOptions},
        HatchScale: {name : "Pattern Scale", group : "Global Settings", type : "options", options : patternScaleOptions},
        interrogationPointFontSize : {name : "Question Mark Size (px)", group : "Global Settings", type : "options", options: fontSizeOptions},
        
        pointHasFill : {name : "Fill", group : "Points", type : "boolean"},
        pointFillColor : {name : "Fill Color", group : "Points", type : "color"},
        pointLineColor : {name : "Line Color", group : "Points", type : "color"},
        PointSize: {name : "Size (pt)", group : "Points", type : "options", options : pointSizeOptions},

        ...( (!onPlanMode && !on3DMode) && {axisHorFontFamily : {name : "Font Family", group : "Section Axis - Horizontal", type: "options", options : fontFamilyOptions}} ),
        ...( (!onPlanMode && !on3DMode) && {axisHorFontSize : {name : "Font Size (px)", group : "Section Axis - Horizontal", type : "options", options : fontSizeOptions}}),
        ...( (!onPlanMode && !on3DMode) && {axisHorText : {name : "Text", group : "Section Axis - Horizontal"}}),
        
        ...( (!onPlanMode && !on3DMode) && {axisVertFontFamily : {name : "Font Family", group : "Section Axis - Vertical", type: "options", options : fontFamilyOptions}}),
        ...( (!onPlanMode && !on3DMode) && {axisVertFontSize : {name : "Font Size (px)", group : "Section Axis - Vertical", type : "options", options : fontSizeOptions}}),
        ...( (!onPlanMode && !on3DMode) && {axisVertText : {name : "Text", group : "Section Axis - Vertical"}}),

        ...( (onPlanMode || on3DMode) && {gridFontSize : {name : "Font Size (px)", group : "Grid Settings", type : "options", options : gridFontSizeOptions}}),
        ...( (onPlanMode || on3DMode) && {gridHorText : {name : "X Axis Label", group : "Grid Settings"}}),
        ...( (onPlanMode || on3DMode) && {gridVertText : {name : "Y Axis Label", group : "Grid Settings"}}),

        ...( (onPlanMode && !on3DMode) && {toggleOutline : {name: 'Grid Outline', group: 'Grid Settings'}}),

        ...( on3DMode && {gridZText : {name : "Z Axis Label", group : "Grid Settings"}}),
        
        horScale : { name : "Horizontal Scale", group : "Scaling", type : "options", options : scaleOptions },
        vertScale : { name : "Vertical Scale", group : "Scaling", type : "options", options : scaleOptions },   
    }
    
    const optionsTooltips = {
        boreholeWidth: "The width of the borehole",
        showFieldTestPlots : "Whether to show the field test plots or not",
        GridlineThickness: "The thickness of the grid lines",
        showLabels : "Whether to show borehole layer labels or not",
        showLegend : "Whether to show legend or not",
        lineStyleScale : "Scale of the dashes and dots of lines",
        LineThickness: "The thickness of the canvas lines",
        otherCrossSectionsOption : "Which other cross sections of the same project to show",
        otherTestHolesOption : "Which other testholes of the same project to show",
        HatchScale: "Scale of the hatch patterns",
        PointSize: "Size of the canvas points",
        pointLineColor : "Color of the line of the point",
        pointFillColor : "Color of the fill of the point",
        pointHasFill : "Color of the fill of the point",
        TEXTSIZE: "Size of the texts",
        
        axisHorFontFamily : "Font family of the horizontal axis",
        axisHorFontSize : "Font size of the horizontal axis",
        axisHorText : "Text written on the horizontal axis",
        
        axisVertFontFamily : "Font family of the vertical axis",
        axisVertFontSize : "Font size of the vertical axis",
        axisVertText : "Text written on the vertical axis",

        gridFontSize : "Font size of the horizontal axis",
        gridHorText : "Text written on the x axis",
        gridVertText : "Text written on the y axis",

        toggleOutline: 'Whether the outline of the grid is visible',

        gridZText: 'Text written on the z axis',

        horScale : "Horizontal scale of the drawing",
        vertScale : "Vertical scale of the drawing",

        interrogationPointFontSize : "Size of the question marks on polygons and lines",
        Coordinates_Unit : "Unit of the coordinates in the project data",
        ProjectDepth_Unit : "Unit of the soil layer depths in the project data",
        Unit: "Unit used on the canvas",
    }
    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    });
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            if(!name.includes('grid') || name.includes('Font'))
                this.onPropertyChange(grid, name, val)
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGrid");
    this.removePropertyGridSelected();
    $(panelElem).jqPropertyGrid(panelData, panelOptions);
    this.initializeCollapsiblePropertyGridRows(panelElem);
    this.markPropertyGridElementsThatShowOn3d(panelElem);
    // do before initialize multiselectors
    this.disablePropertyGridSelectsWithNoOption(panelElem);
    this.initializePropertyGridLabelClick(panelElem);
    this.initializePropertyGridMultiselectors(panelElem);
    combineGridRows(panelElem, ["pointHasFill", "pointFillColor"]);

    Array.from(panelElem.querySelectorAll(`input[type='text']`)).forEach(elem => {
        if(elem.id.includes('grid')) {
            const name = elem.id.replace(/pg[0-9]+/, '');

            elem.addEventListener('focusout', (event) => {
                const val = event.target.value;                
                this.onPropertyChange(undefined, name, val);
            })
            elem.addEventListener('keyup', (event) => {
                if (event.key === 'Enter' || event.keyCode == 13) {
                    const val = event.target.value; 
                    this.onPropertyChange(undefined, name, val);
                }
            })
        }
    })
}

function getPropertyGridRow(propertyGrid, optionName) {
    const rowElem = propertyGrid.querySelector(`.pgRow.${optionName}`);
    return rowElem;
}

function combineGridRows(propertyGrid, optionNames, rowClass='', newTooltip='') {
    if (! optionNames || optionNames.length < 2) {
        return;
    }
    const rows = optionNames.map(name => getPropertyGridRow(propertyGrid, name));
    if (rows.some(x => x == null)) {
        return;
    }

    const cells = rows.map(x => x.querySelector(".pgCell:last-child"));

    if (cells.some(x => x == null)) {
        return;
    }
    const row1 = rows[0];
    const cell1 = cells[0];
    
    const container = document.createElement('div');
    container.classList.add('combinedRowContainer')
    cell1.classList.add('combinedRow');
    
    cells.forEach((cell, index) => {
        Array.from(cell.children).forEach(child => {
            container.appendChild(child);
            child.title = rows[index].title;
        });
    });
    if (newTooltip) {
        row1.title = newTooltip;
    }
    cell1.appendChild(container);

    const containerChildren = Array.from(container.children);
    if (containerChildren && containerChildren.length > 0) {
        if (container.querySelector(`input[type=checkbox]`) == containerChildren[0]) {
            const disableEnableOtherChildren = (shouldFocus) => {
                const shouldDisable = ! containerChildren[0].checked;
                containerChildren.slice(1).forEach(child => {
                    // child is input element the color picker uses
                    if (child.nextSibling?.classList?.contains('sp-replacer')) {
                        const disable = shouldDisable ? "disable" : "enable";
                        $(child).spectrum(disable);
                    }
                    else {
                        child.disabled = shouldDisable;
                    }
                })
                if (shouldFocus && ! shouldDisable) {
                    containerChildren[1].focus();
                }
            }
            containerChildren[0].addEventListener('change', (event) => {
                disableEnableOtherChildren(true);
            })
            disableEnableOtherChildren(false);
        }
    }

    // ensures getPropertyGridRow can work
    const rowClasses = rows.slice(1).map(row => {
        return Array.from(row.classList);
    }).flat();
    rowClasses.forEach(className => {
        row1.classList.add(className);
    })

    if (rowClass) {
        row1.classList.add(rowClass);
    }

    rows.slice(1).forEach(row => {
        row.remove();
    })
}

CrossSectionCanvas.prototype.openLegendBoxPropertyGrid = function () {
    this.selectElem(this.storage.rootElem.querySelector('.legend'));
    let panelData = {};
    const dataInStorage = [
        "legendBoxW",
        "legendBoxH",
        "legendBoxNumberOfColumns",
        "legendBoxFontSize",
        "legendBoxFontFamily",
        "legendBoxText",
        "legendPinnedTo",
        "legendScaleBar",
        "legendBackgroundColor",
        "legendHasBorder",
        "legendBorderColor",
    ]
    dataInStorage.forEach(key => {
        panelData[key] = this.storage[key] ?? '';
    });

    // panel options
    const scaleArr = this.storage.scaleIsFeet ? this.storage.defaultOptions.feet : this.storage.defaultOptions.m;
    const scaleOptions = scaleArr.map(x => x[0]);

    const noneOption = { text : "(none)", value : "(none)"};
    const allOption = { text : "Entire Project", value : "Entire Project"};

    const legendBoxNumberOfColumnsOptions = [
        {text : 'One column', value : 1},
        {text : 'Two columns', value : 2},
        {text : 'Three column', value : 3},
        {text : 'Four columns', value : 4},
    ];

    const unit = this.storage.scaleIsFeet ? 'ft' : 'm'

    const optionsMetadata = {
        legendBackgroundColor : { name : "Background Color", group : "Legend Box", type : "color"},
        legendHasBorder : { name : "Border", group : "Legend Box", type : "boolean"},
        legendBorderColor : { name : "Border Color", group : "Legend Box", type : "color"},
        legendBoxFontFamily : {name : "Font Family", group : "Legend Box", type : "options", options : fontFamilyOptions},
        legendBoxFontSize : {name : "Font Size (px)", group : "Legend Box", type : "options", options : fontSizeOptions},
        legendBoxH: {name : "Image Height (px)", group : "Legend Box"},
        legendBoxW: {name : "Image Width (px)", group : "Legend Box"},
        legendBoxNumberOfColumns : {name : "No. of Columns", group : "Legend Box", type : "options", options : legendBoxNumberOfColumnsOptions},
        showScaleBar : {name : "Scale Bar", group : "Legend Box", type : "boolean"},
        legendScaleBar : { name : "Scale Bar", group : "Legend Box", type : "options", options : ['(none)', 'Bottom-Left', 'Bottom-Right', 'Top-Left', 'Top-Right']},
        legendBoxText : {name : "Title", group : "Legend Box"},
        legendPinnedTo: {name : "Pinned", group : "Legend Box", type : 'options', options : ['(none)', 'Bottom-Left', 'Bottom-Right', 'Top-Left', 'Top-Right']},
    }
    
    const optionsTooltips = {
        showScaleBar : "Whether to show the scale bars or not",
        legendBoxFontFamily : "Font family used for the legend box texts",
        legendBoxFontSize : "Font size used for legend box texts",
        legendBoxH: "Height of the legend box images",
        legendBoxW: "Width of the legend box images",
        legendBoxNumberOfColumns: "How many columns the legend should have",
        legendBoxText : "Title of the legend box",
        legendPinnedTo : "In which corner of the screen the legend box should be pinned to",
        legendScaleBar : "Where to show the scale bar",
        legendBackgroundColor : "Color of the background of the legend box",
        legendHasBorder : "Border of the legend box",
        legendBorderColor : "Color of the border of the legend box",
    }

    if (panelData.legendPinnedTo != '(none)') {
        ['legendBoxH', 'legendBoxW', 'legendBoxFontSize'].forEach(key => {
            if (! optionsMetadata[key]) {
                return;
            }
            optionsMetadata[key].type = 'label';

            const displayedValue = legendPinnedDefaultOptions[key];
            if (displayedValue) {
                panelData[key] = displayedValue;
            }
        });
    };

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    });
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => this.onPropertyChange(grid, name, val),
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    this.genericOpenPropertyGridSelected(panelElem, panelData, panelOptions);
    combineGridRows(panelElem, ['legendHasBorder', 'legendBorderColor']);
}

CrossSectionCanvas.prototype.legendBoxMouseClick = function () {
    /* Opens the borehole tooltip menu. Arguments: timestamp of the borehole. */
    if (this.isInDrawMode()) {
        return;
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();    // hide menu
    this.openLegendBoxPropertyGrid();
}

CrossSectionCanvas.prototype.deletePointInLines = function(lines, timestamp) {
    const lineTimestampsAlreadyProcessed = {};
    lines.forEach(line => {
        if (! line) {
            return;
        }

        const isFirstPoint = line.point1.timestamp == timestamp;
        const linePoint = isFirstPoint ? line.point1 : line.point2;
        const prevLink = this.getLinkData(line.prevLink);
        const nextLink = this.getLinkData(line.nextLink);
        const otherLinkConnectedToPointIsNext = timestamp == nextLink?.point1.timestamp || timestamp == nextLink?.point2.timestamp;
        const otherLinkConnectedToPointIsPrev = timestamp == prevLink?.point1.timestamp || timestamp == prevLink?.point2.timestamp;

        if(lineTimestampsAlreadyProcessed[prevLink?.timestamp] || lineTimestampsAlreadyProcessed[nextLink?.timestamp]) {
            this.linkRemove(line, {redraw : false});
            return;
        }
        // doesn't have any neighbours related to the point, simply remove link
        if ((! otherLinkConnectedToPointIsNext) && (! otherLinkConnectedToPointIsPrev)) {
            this.linkRemove(line, {redraw : false});
            return;
        }
        
        let otherPoint = null;
        if (otherLinkConnectedToPointIsNext) {
            otherPoint = nextLink.point1.timestamp === timestamp ? nextLink.point2 : nextLink.point1;
        }
        if (otherLinkConnectedToPointIsPrev) {
            otherPoint = prevLink.point1.timestamp === timestamp ? prevLink.point2 : prevLink.point1;
        }
        if (otherPoint) {
            if (isFirstPoint) {
                line.point1 = otherPoint;
            }
            else {
                line.point2 = otherPoint;
            }
        }
        else {
            return;
        }
        if (otherLinkConnectedToPointIsNext) {
            line.nextLink = nextLink.nextLink;
            const nextNextLink = this.getLinkData(nextLink.nextLink);
            if (nextNextLink) {
                nextNextLink.prevLink = line.timestamp;
            }
            // this link is no longer part of the list
            // setting to null is important to avoid problems with deleting on the next iteration
            nextLink.prevLink = null
            nextLink.nextLink = null;
        }
        if (otherLinkConnectedToPointIsPrev) {
            line.prevLink = prevLink.prevLink;
            const prevPrevLink = this.getLinkData(prevLink.prevLink);
            if (prevPrevLink) {
                prevPrevLink.nextLink = line.timestamp;
            }
            // this link is no longer part of the list
            // setting to null is important to avoid problems with deleting on the next iteration
            prevLink.prevLink = null
            prevLink.nextLink = null;
        }

        lineTimestampsAlreadyProcessed[line.timestamp] = true;
    })
}

CrossSectionCanvas.prototype.timestampsToLines = function (lineTimestamps) {
    const timestampsDict = Object.fromEntries(lineTimestamps.map(timestamp => [timestamp, true]));
    const allLines = [...this.storage.LINKS, ...this.storage.lines];
    const lines = allLines.filter(x => x.timestamp in timestampsDict);
    return lines;
}

CrossSectionCanvas.prototype.deletePoint = function (timestamp) {
    const polygonTimestamps = this.getPolygonsPointBelongsTo(timestamp);
    const lineTimestamps = this.getLinesPointBelongsTo(timestamp);

    const polygons = polygonTimestamps.map(timestamp => {
        return this.storage.POLYGONS.find(d => d.timestamp == timestamp);
    })
    const lines = this.timestampsToLines(lineTimestamps);

    polygons.forEach(polygon => {
        if (! polygon) {
            return;
        }
        const pointIndex = polygon.points.findIndex(point => timestamp == point.timestamp);
        if (pointIndex < 0) {
            return;
        }
        if (polygon.points.length <= 3) {
            this.polyRemove(polygon.timestamp, {redraw : false});
            return;
        } 
        polygon.points.splice(pointIndex, 1);
    })

    this.deletePointInLines(lines, timestamp);

    const index = this.storage.EPOINTS.findIndex(d => d.timestamp == timestamp);
    this.storage.EPOINTS.splice(index, 1);

    if (lineTimestamps.length + polygonTimestamps.length > 0) {
        this.drawExtraPoints(this.storage.svg1);
    }
    if (lineTimestamps.length > 0) {
        this.drawLinks(this.storage.svg1);
    }
    if (polygonTimestamps.length > 0) {
        this.drawPolygons(this.storage.svg1);
    }
    if (lineTimestamps.length + polygonTimestamps.length > 0) {
        this.removeOrphanPoints();
    }
}

CrossSectionCanvas.prototype.openPointPropertyGrid = function (timestamp) {
    const getElem = () => {
        return this.storage.d3_root.selectAll('.point').filter(d => {
            return d.timestamp == timestamp
        }).node();
    }
    const elem = getElem();
    if (! elem) {
        return;
    }
    const getProperties = () => {
        return this.storage.EPOINTS.find(point => point.timestamp == timestamp) ?? d3.select(getElem()).data()[0];
    }
    const properties = getProperties();
    if (! properties) {
        return;
    }
    const keysToShow = ['xx', 'correct_yz'];
    const propertiesToShow = {};
    keysToShow.forEach(key => {
        propertiesToShow[key] = properties[key];
    })
    const panelData = this.cloneObject(propertiesToShow);
    if (! panelData) {
        return;
    }
    
    const decimalPlaces = 2;
    const step = 0.01;
    const keysToRound = ['xx', 'correct_yz']
    keysToRound.forEach(key => {
        if (! (key in panelData)) {
            return;
        }
        panelData[key] = roundToDecimalPlaces(panelData[key], decimalPlaces);
    })

    this.selectElemFromTimestamp('.point', timestamp);
    this.storage.selectingPoint = timestamp;

    delete panelData['isLocked'];

    const panelElem = this.storage.rootElem.querySelector("#propertyGridSelected");
    const crossSectionObj = this;
    const coordinateType = properties.iamextrapoint ? 'number' : 'label';

    const unit = this.storage.Unit;

    const optionsMetadata = {
        xx : {name : `X (${unit})`, type : coordinateType},
        correct_yz : {name : `Y (${unit})`, type : coordinateType},
    }

    const group = "Point";
    Object.values(optionsMetadata).forEach(value => {
        value.group = group;
    })
        
    const optionsTooltips = {
        xx: "Position of the point in the X axis",
        correct_yz: "Position of the point in the Y axis",
    }

    Object.keys(optionsMetadata).forEach(key => {
        if (key in optionsTooltips) {
            const tooltip = optionsTooltips[key];
            optionsMetadata[key].description = tooltip;
        }
    })
    this.coercePanelDataToOptionsMetadata(panelData, optionsMetadata);

    const panelOptions = {
        meta: optionsMetadata,
        customTypes: customPropertyGridTypes,
        callback: (grid, name, val) => {
            // get the properties dict in case the original changed
            const properties = getProperties();
            if (! properties) {
                return;
            }
            const coordinateUnitFactor = this.getCoordinateUnitFactor();
            if (name == 'xx') {
                properties.xx = parseFloat(val);
                properties.x = properties.xx / coordinateUnitFactor;
                properties.originalX = properties.x;
            }
            if (name == 'correct_yz') {
                properties.correct_yz = parseFloat(val);
                properties.yz = - properties.correct_yz / coordinateUnitFactor;
            }
            this.drawExtraPoints(this.storage.svg1);
            this.drawPolygons(this.storage.svg1);
            this.drawLinks(this.storage.svg1);
        },
        sort: comparePropertiesGenerator(optionsMetadata),
        helpHtml: '',
        isCollapsible: false // we implement the behavior ourselves
    };

    // draw panel
    this.removePropertyGridSelected();
    this.genericOpenPropertyGridSelected(panelElem, panelData, panelOptions);

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('propertyGridButtonContainer');
    buttonDiv.classList.add('deletePolygonContainer');

    if (properties.iamextrapoint) {
        const deleteButton = this.generatePropertyGridButton();
        deleteButton.innerText = "  Delete  "
        deleteButton.onclick = () => {
            this.openConfirmModal({
                title : "Delete",
                text : "Do you want to delete this point?",
                callback: () => {
                    this.deletePoint(timestamp);
                    this.cancelSelection();
                }
            })
        }

        buttonDiv.appendChild(deleteButton);
    }

    panelElem.appendChild(buttonDiv);
}

/* -------------------------------------------------------------------------- */
/*                                    HTML                                    */
/* -------------------------------------------------------------------------- */

let CrossSectionHtml = `
<div class="coord-tooltip-follow-cursor" style="visibility: hidden; width: fit-content; height: fit-content">
    <div></div>
</div>

<div class="polytooltip crossSectionTooltip inviz" style="height: 0px; width: 0px;">
<p>Modify Polygon</p>
<input type="button" value="delete" class="deletePoly" >
<input type="button" value="DBG info" class="polyShowInfo" >
<input type="button" value="ok" class="polyFinishEdit" >
<br>
<div class="coloroptions"></div>
<br>  
</div>

<div class="selectHatchTooltip inviz">
    <div class="coloroptions"></div>
</div>

<div class="legendrecttooltip crossSectionTooltip inviz">
<p>Modify hatch color</p>
<input type="button" value="ok" class="legendRectFinishEdit" >
<div class="hatchcolor"></div>
</div>

<div class="fieldtesttooltip crossSectionTooltip inviz">
<p>Field Test Options</p>
<input type="button" value="Close" class="fieldTestFinishEdit" >
<input type="button" value="Update" class="fieldTestUpdatePropertiesFromInputs" >

<div class="fieldtestoptions">
    <input type="checkbox" name="showPoints">
    <label for="showPoints">Show points</label>
    <br>
    <!-- CHANGED HERE june 21th -->
    <input type="checkbox" name="showPointsValues">
    <label for="showPointsValues">Show points values</label>
    <br> 
    <!-- END OF CHANGE june 21th -->
    <label for="backgroundColor">Background Color</label>
    <input type="text" name="backgroundColor">
    <br>
    <label for="pointColor">Points Color</label>
    <input type="text" name="pointColor">
    <br>
    <label for="lineColor">Line Color</label>
    <input type="text" name="lineColor">
    <br>
    <label for="lineFillColor">Line Fill Color</label>
    <input type="text" name="lineFillColor">
    <br>
    <label for="plotOpacity">Opacity</label>
    <input class="fieldTestOpacity" type="number" name="plotOpacity" min=0.1 max=1 step=0.1>
</div>
</div>

<div class="boreholetooltip crossSectionTooltip inviz">
<p>Borehole Options</p>
<input type="button" value="Close" class="boreholeFinishEdit" >
<input type="button" value="Update" class="boreholeUpdateProperties" >

<div class="fieldtestoptions">
    <input type="checkbox" name="showDepthLabels">
    <label for="showDepthLabels">Show depth labels</label>
    <br> 
    <input type="checkbox" name="showSoilDescriptions">
    <label for="showSoilDescriptions">Show soil descriptions</label>
    <br>
    <input type="checkbox" name="showFieldTestPlots">
    <label for="showFieldTestPlots">Show field test plots</label>
</div>
</div>


<div class="texttooltip crossSectionTooltip">
<p>Modify Text</p>
<br>
<input type="text" value="input text"  class="textChange">
<input type="button" class="tsf" value="tsf" >
<input type="button" value="vis" class="textVisibility" >
<input type="button" value="invis" class="textVisibility" >
<input type="color" class="clr0" name="head" value="black" ><label
    for="clr0">clr0</label>
<input type="button" value="ok" class="textFinishEdit" >

</div>

<div class="linktooltip crossSectionTooltip inviz">
<input type="button" value="remove" class="linkRemove" >
<input type="button" value="remove waterline" class="waterlineRemove" >
<input type="button" value="ok" class="linkFinishEdit" >
</div>

<div class="modal customModal confirmModal" tabindex="-1" role="dialog">
<div class="modal-dialog" role="document">
  <div class="modal-content">
    <div class="modal-header">
      <div class="row align-items-center" style="height: 100%;">
        <div class="col-sm align-self-center">
            <h5 class="modal-title">Confirm</h5>
        </div>
      </div>
      <button type="button" class="close" aria-label="Close" style="position:absolute;z-index: 9999;">
          <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-outline-primary btn-sm confirmButton">Yes</button>
      <button type="button" class="btn btn-outline-primary btn-sm closeButton">No</button>
    </div>
  </div>
</div>
</div>

<div class="modal printModal customModal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row align-items-center" style="height: 100%;">
        <div class="col-sm align-self-center">
            <h5 class="modal-title">Generate Report</h5>
            </div>
            </div>
        <button type="button" class="close" aria-label="Close" style="position:absolute;z-index: 9999;">
            <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <div class="printMessage invisible">Generating the report, please wait ...</div>
        <button type="button" class="btn btn-outline-primary btn-sm onClickPrint">Generate Report</button>
        <button type="button" class="btn btn-outline-primary btn-sm closeButton">Cancel</button>
      </div>
    </div>
  </div>
</div>

<div class="modal dxfHatchModal customModal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row align-items-center" style="height: 100%;">
        <div class="col-sm align-self-center">
            <h5 class="modal-title">Export to Autocad DXF</h5>
            </div>
            </div>
        <button type="button" class="close" aria-label="Close" style="position:absolute;z-index: 9999;">
            <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">

        <form>
        <div class="form-group">
            Please select the hatch scale used for generating the DXF file:
            <br/>
            <select class="form-select" aria-label="Hatch Scale" id="hatchScale" style="width: 50%">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
            </select>
        </div>
        </form>

      </div>
      <div class="modal-footer">
        <div class="dxfHatchMessage" style="color: red; margin-right: auto;" id='dxfHatchMessage'></div>
        <button type="button" class="btn btn-outline-primary btn-sm onClickDXFHatch">Create DXF File</button>
        <button type="button" class="btn btn-outline-primary btn-sm closeButton">Cancel</button>
      </div>
    </div>
  </div>
</div>

<div class="modal perfModal customModal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <div class="row align-items-center" style="height: 100%;">
        <div class="col-sm align-self-center">
            <h5 class="modal-title">Warning</h5>
            </div>
            </div>
      </div>
      <div class="modal-body">
        At the current resolution, the performance of the 3D model may be slowed when adding the terrain. We recommend adjusting the resolution.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-primary btn-sm onClickPerf">Keep Current Resolution</button>
        <button type="button" class="btn btn-outline-primary btn-sm closeButton">Adjust for Best Performance</button>
      </div>
    </div>
  </div>
</div>

<div class="propertyGridCol style-6">
    <div class="propertyGridSection">
        <div class="propertyGridText">Object Properties</div>
        <div id="propertyGridSelected" class="propertyGrid propertyGridSelected"></div>
    </div>
    <div class="propertyGridSection">
        <div class="propertyGridText">Display Settings</div>
        <div id="propertyGrid" class="propertyGrid"></div>
    </div>
</div>
<div class="canvasCol">
<div class="closePropertyGridBackground"></div>
<div class="closePropertyGrid"><i class="fas fa-chevron-left"></i></div>
<div class="topmenu" style="max-width: 300px">
<div class="topmenu-section">
    <div title="Load Model" class="menu-item onclickLoadJson">
        <span class="toolbarImg OpenIcon"></span>
    </div>
    <div class="dropdown" title="Import">
        <button class="btn btn-light dropdown-toggle" type="button" id="dropdownMenuButton2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="toolbarImg ImportIcon"></span>
            <!---Space--->    <!---Space--->
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton2" style="padding: 0">
            <a class="dropdown-item importPNG" href="#">Image (PNG)</a>
            <a class="dropdown-item importPCD" href="#">Point Cloud (PCD)</a>
            <a class="dropdown-item importGLTF" href="#">3D Model (GLTF)</a>
            <a class="dropdown-item onClickLoadSTL" href="#">Lithography (*.stl)</a>
            <a class="dropdown-item onClickLoadGLTF" href="#">3D Model (GLTF)</a>
            <a class="dropdown-item onClickLoadIFC" href="#">3D Model (IFC)</a>
        </div>
    </div>

    <div class="dropdown" title="Export">
        <button class="btn btn-light dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="toolbarImg ExportIcon"></span>
            <!---Space--->    <!---Space--->
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" style="padding: 0">
            <a class="dropdown-item Export_DXF_Hatch" href="#">Autocad DXF</a>
            <!--- <a class="dropdown-item Export_DXF" href="#">Autocad DXF (without Hatch)</a> --->
            <div class="dropdown-divider" style="margin: 0"></div>
            <a class="dropdown-item exportDrawingsToJsonFile" href="#">JSON (Full)</a>
            <a class="dropdown-item Export_RS" title="RS3D" href="#">JSON (Geometry)</a>
            <div class="dropdown-divider" style="margin: 0"></div>
            <a class="dropdown-item saveAlltoPng" href="#">PNG</a>
            <a class="dropdown-item saveAllToSvg" href="#">SVG</a>
            <div class="dropdown-divider" style="margin: 0"></div>
            <a class="dropdown-item Export_GLTF" href="#">GLTF</a>
            <a class="dropdown-item Export_STL" href="#">Lithography (*.stl)</a>
            <a class="dropdown-item Export_OBJ" href="#">OBJ</a> 
            <a class="dropdown-item Export_GeoJSON" href="#">GeoJSON</a> 
            <!-- <a class="dropdown-item Export_Collada" href="#">Collada</a> --->
        </div>
    </div>
    <div title="Print" class="menu-item printButton" >
        <span class="toolbarImg PrintIcon"></span>
    </div>

    <div class="toolbarSeparator"></div>

    <div title="Undo" class="menu-item undo" >
    <span class="toolbarImg UndoIcon"></span>
    </div>
    <div title="Redo" class="menu-item redo" >
    <span class="toolbarImg RedoIcon"></span>
    </div>

    <div class="toolbarSeparator"></div>
    
    <!-- tabIndex 0 makes it so pressing esc works after clicking the element, so you can cancel the action -->
    <div title="Draw Groundwater Line" class="menu-item toggleWaterfrontModeButton" tabIndex="0">
    <span class="toolbarImg GroundwaterIcon"></span>
    </div>
    <div title="Draw Line" class="menu-item drawLine" tabIndex="0">
    <span class="toolbarImg DrawLineIcon"></span>
    </div>
    <div title="Draw Soil / Rock Layer" class="menu-item drawPolygon" tabIndex="0">
    <span class="toolbarImg DrawPolygonIcon"></span>
    </div>
    <div title="Add Text" class="menu-item drawText" tabIndex="0">
    <span class="toolbarImg AddTextIcon"></span>
    </div>

    <!-- <div title="Settings" class="menu-item ToggleSettings" >
        <span class="toolbarImg SettingsIcon"></span>
    </div>
    <div title="Field Test Settings" class="menu-item FieldTestsSettings" >
    <span class="toolbarImg GraphIcon"></span>
    </div> -->

    <div class="toolbarSeparator hideSeparatorOnPlan"></div>

    <div title="Toggle Grid" class="menu-item toggleable toggleGridButton" >
        <span class="toolbarImg GridLinesIcon"></span>
    </div>
    <div title="Back to Center" class="menu-item focusCenter" >
    <span class="toolbarImg BackCenterIcon"></span>
    </div>
    <div title="Zoom All" class="menu-item zoomExtent" >
    <span class="toolbarImg ZoomAllIcon"></span>
    </div>
    <div title="Zoom 100%" class="menu-item zoom" >
    <span class="toolbarImg Zoom100Icon"></span>
    </div>
    <div title="Zoom In" class="menu-item incrementZoom" >
    <span class="toolbarImg ZoomInIcon"></span>
    </div>
    <div title="Zoom Out" class="menu-item decrementZoom" >
        <span class="toolbarImg ZoomOutIcon"></span>
    </div>
    <div title="Pan" class="menu-item panCanvas toggledOff" style="display: none;">
        <span class="toolbarImg PanIcon"></span>
    </div>
    <div title="Rotate" class="menu-item rotateCanvas" style="display: none;" >
        <span class="toolbarImg RotateIcon"></span>
    </div>
    <div title="Perspective Camera" class="menu-item toggleCamera" style="display: none;" >
        <span class="toolbarImg CameraIcon"></span>
    </div>

    <div class="exportingFileText" style="align-self: center; display: none; color: red; margin-left: 15px; padding-right: 15px; border-radius: 3px"></div>
    <div class="customLoader exportingFile" style="display: none; margin-left: 5px">
    </div>

    </div>
    <div class="topmenu-section" style="margin-left: auto; padding-right: 0px;">
        <div class="zoomContainer">
            <div class="extrazoom">100</div>
        </div>
        <div class="customLoader loading3D" style="visibility: hidden;">
        </div>    
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
            <label class="btn btn-light active open2d">
                <input type="radio" name="options" id="option1" autocomplete="off" checked> Profile
            </label>
            <label class="btn btn-light plan-button">
                <input type="radio" name="options" id="option2" autocomplete="off"> Plan
            </label>
            <label class="btn btn-light open3d">
                <input type="radio" name="options" id="option3" autocomplete="off"> 3D
            </label>
        </div>
    </div>
</div>



<div class="windowContainer" tabindex="-1">
<div class="coordinate-tooltip-container hidden">
    <p class="coordinate-tooltip"></p>
</div>
<!-- <div class="svgWindowContainer"> -->
<div class="crossectionsreviewContainer">
<div class="canvasTooltipContainer">
    <div class="canvasTooltip drawPolygonTooltip ${tooltipHiddenClass}">
    Click anywhere to start a polygon; press enter or double click on the last point to close the polygon.
    </div>
    <div class="canvasTooltip drawLineTooltip ${tooltipHiddenClass}">
    Click anywhere to start a poly-line; press enter or double click on the last point to finish.
    </div>
    <div class="canvasTooltip drawtooltip ${tooltipHiddenClass}">
        Press enter or double click on the last point to complete the Polygon.
        <br>
        Press Esc button to cancel.
    </div>
    <div class="canvasTooltip drawWaterlineTooltip ${tooltipHiddenClass}">
        Click anywhere to start drawing the groundwater table polyline. Press enter or double click on the last point to finish drawing.
    </div>
    <div class="canvasTooltip elemSelectedTooltip ${tooltipHiddenClass}">
        Press Esc to cancel
    </div>
</div>
<p id="crossectionsreview" class="mb-0">Cross Section Through: AH20-1, AH20-2, AH20-3</p>
<div class="placeholderItemRight"></div>
</div>
<svg class="svgWindow" xmlns="http://www.w3.org/2000/svg">
<defs>

    <!-- TODO image scale to width 100% -->
    <pattern class="patternGWGC" x="0" y="0" width="64" height="74" patternUnits="userSpaceOnUse">
    <image href="" width="64" height="64" />
    </pattern>


</defs>
<g class="axTop belowAll"></g>
<g class="axLeft belowAll"></g>


<g class="root-group">
    <g class="orderBack"></g>

    <g class="polygons"></g>
    <g class="interrogation-points"></g>

    <g class="boreholes"></g>
    <g class="links"></g>
    <g class="interrogation-points-waterline"></g>
    <g class="waterline-watersymbols"></g>
    <g class="water-symbols"></g>
    
    <g class="boreholelabels"></g>
    <g class="textBoxes"></g>
    
    <g class="points"></g>
    <g class="extra"></g>
    
    <g class="fieldtests"></g>
    <g class="orderFront"></g>
    <g class="legend">
    <rect></rect>
    </g>
</g>


<rect class="external-border" width="3000" height="4000" fill="none"></rect>
<rect class="underX" width="60" height="4000" fill="white"></rect>
<rect class="underY" width="3000" height="50" fill="white"></rect>

<!-- TODO grid over rects, but under text ??? -->
<g class="axTop aboveAll"></g>
<g class="axLeft aboveAll"></g>


<path class="mouselast sw" d="M 25 25 L 30 30"></path>
<path class="mousefirst sw" d="M 25 25 L 30 30"></path>

</svg>
<br>
<a class="aexpjson"></a>
<br>
<!-- <div class="image-display"></div> -->
<canvas class="hidden-canvas"></canvas>

<svg class="svgFullscreen">
  <defs>
    <linearGradient class="grad1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" style="stop-color:orange;stop-opacity:1" />
      <stop offset="100%" style="stop-color:white;stop-opacity:0.5" />
    </linearGradient>
  </defs>
</svg>

<br>
</div>
<div class="view3d invisible">
    <div class="container3d"></div>
</div>
</div>
`

function insertCrossSectionHtml(htmlElem) {
    htmlElem.innerHTML = CrossSectionHtml + '';
}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

/* 
Selected element must contain both:
- the settings interface (with options such as scale)
- the CrossSection canvas (can be inserted through the function insertCrossSectionHtml)
options may be anything contained in defaultStorage,
such as maximumZoom, in case you need to define these values
However, I don't advise passing any options unless necessary.
The interface settings will load automatically.
Keep in mind that basically all variables that were previously global in the code are there
and some aren't supposed to be changed

PS: take a look at initializeEventListeners to see how I added functionality to the interface buttons
The functions that aren't mine such as FieldTestsSettings are already being added
You just need to define CrossSectionCanvas.prototype.FieldTestsSettings and it should work
*/
$.fn.initializeCrossSection = function (jsonBorehole, soilSymbols, jsonOptions = defaultStorage.defaultOptions, options = defaultStorage, doneFunction = () => true) {
    var rootElem = this[0];
    // @ts-expect-error
    let instance = new CrossSectionCanvas(rootElem, jsonBorehole, soilSymbols, jsonOptions, options, doneFunction)

    return instance;
}