/* -------------------------------------------------------------------------- */
/*      html and functions that refer to the standalone version interface     */
/* -------------------------------------------------------------------------- */

var rootElemHtml = `
<div class="stage1">

<input type="button" class="bopen1" value="open diagram (default)"  onclick="openDiagramDefault(event)">
<input type="button" class="bopen2" value="open diagram (file)" onclick="openDiagramFile(event)">

<br>
</div>

<label class="fin">...</label>
<br>

<div class="stage0">
<div>
  <label>Horizontal scale (FEET)</label>
  <select name="horScaleFt"  class="horScaleFt">
    <option disabled>FEET</option>
  </select>

  <label>Horizontal scale (M)</label>
  <select name="horScaleM"  class="horScaleM disabledarea">
    <option disabled>M</option>
  </select>
</div>
<div>
  <label>Vertical scale (FEET)</label>
  <select name="vertScaleFt"  class="vertScaleFt">
    <option disabled>FEET</option>
  </select>

  <label>Vertical scale (M)</label>
  <select name="vertScaleM"  class="vertScaleM disabledarea">
    <option disabled>M</option>
  </select>
</div>
<form>
<input checked="checked" type="radio" class="radioFeet"  name="radio1" value="ft">
<label for="radioFeet">Feet</label>

<input type="radio" class="radioMetric"  name="radio1" value="m">
<label for="radioMetric">Metric</label>
</div>
</form>
<br>

<div class="wrapper disabledarea stage2">

<br>
<label>Gridline Thickness</label>
<input type="number" class="gw" name="gw" min="1" step="1" value="3" >
<br>
<label>Layer Hatch Scale</label>
<input type="number" class="bis" name="bis" min="5" step="5" max="100" value="20"
  >
<br>
<label>Line Thickness</label>
<input type="number" class="pathsWidth" name="pathsWidth" min="1" step="1" value="10"
  >
<br>
<label>Borehole Display Width</label>
<input type="number" class="bw" name="bw" min="1" step="1" value="5" >
<label>percent</label>
<br>
<label>Point Size</label>
<input type="number" class="cornerSize" name="cornerSize" min="1" step="1" value="2" >
<br>
<label>percent</label>
<br>
<label>Text Size</label>
<input type="number" class="textSize" name="textSize" min="2" step="1" value="10" >
<br>
<label>Legend box size</label>
<input type="number" class="lw" name="lw" min="1" step="1" value="20" >
<input type="number" class="lh" name="lh" min="1" step="1" value="10" >
<br>

<div class="firstdiv"></div>

<h3 class="charttitle">Hello World</h3>
<p class="crossectionsreview">Hello World</p>

<h3 class="tsizes">Window (800x1200 frozen, let's pretend this fits A4)</h3>

<!-- DEPLOY STARTS HERE -->
<div class="CrossSectionDeploy"></div>
<!-- DEPLOY ENDS HERE -->

</div>`

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

function onChangeHorScale(crossSectionObj, element) {
  /* Change horizontal scale to value selected by user */
  if (element.className == "disabledarea") {
    return false;
  }
  crossSectionObj.changeHorScale(element.value);
}

function onChangeVertScale(crossSectionObj, element) {
  /* Change vertical scale to value selected by user */
  if (element.className == "disabledarea") {
    return false;
  }
  crossSectionObj.changeVertScale(element.value);
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

// initializes interaction with page settings to cause changes to the borehole canvas
// for example, changing the scale should redraw the canvas in this new scale
function initializeSettingsEventListeners(crossSectionObj, pageSettingsRoot) {
  // each element is
  // event type, element class, function to call
  const arr = [
    ["click", "radioFeet", event => {
      handleRadioClick(crossSectionObj, pageSettingsRoot);
    }],
    ["click", "radioMetric", event => {
      handleRadioClick(crossSectionObj, pageSettingsRoot);
    }],
    ["change", "horScaleFt", event => {
      onChangeHorScale(crossSectionObj, event.target)
    }],
    ["change", "horScaleM", event => {
      onChangeHorScale(crossSectionObj, event.target)
    }],
    ["change", "vertScaleFt", event => {
      onChangeVertScale(crossSectionObj, event.target)
    }],
    ["change", "vertScaleM", event => {
      onChangeVertScale(crossSectionObj, event.target)
    }],

    ["change", "gw", event => {
      crossSectionObj.changeGridPathWidth(event.target.value)
    }],
    ["change", "bis", event => {
      crossSectionObj.changeBoreholeImgScale(event.target.value)
    }],
    ["change", "pathsWidth", event => {
      crossSectionObj.changePathsWidth(event.target.value)
    }],
    ["change", "bw", event => {
      crossSectionObj.applyNewBoreholeWidth(event.target.value)
    }],
    ["change", "cornerSize", event => {
      crossSectionObj.changeCornerSize(event.target.value)
    }],
    ["change", "textSize", event => {
      crossSectionObj.changeTextSize(event.target.value)
    }],
    ["change", "lw", event => {
      crossSectionObj.changeLegendSize(event.target.value, crossSectionObj.storage.legendHeight);
    }],
    ["change", "lh", event => {
      crossSectionObj.changeLegendSize(crossSectionObj.storage.legendWidth, event.target.value);
    }],
  ];
  arr.forEach(x => {
    if (!x) {
      return;
    }
    let [listen, id, fn] = x
    let elem = pageSettingsRoot.querySelector('.' + id);
    if (!elem) {
      return;
    }
    elem.addEventListener(listen, fn);
  })
}

// Update the value displayed in the page settings for properties such as Gridline Thickness and Text Size
// prop is the html property that is going to be changed
function updatePageOptionUI(pageSettingsRoot, selector, prop, value) {
  /* For compatibility between standalone site and ilog. If element isn't found (ilog case) then doesn't update */
  let d3_pageSettingsRoot = d3.select(pageSettingsRoot);
  var d3Elem = d3_pageSettingsRoot.select(selector);
  if (!d3Elem.node()) {
    return;
  }
  d3Elem.property(prop, value);
}

// updates the page settings UI with the values passed
function updatePageOptionUIs(pageSettingsRoot, options) {

  if (!options) {
    return;
  }

  let d3_pageSettingsRoot = d3.select(pageSettingsRoot);

  console.log("Options file...", options)
  // updatePageOptionUI(pageSettingsRoot, '.waterIconSize', "value", options.waterIconSize);
  let arrays = [
    ['.textSize', "value", 'textSize'],
    ['.pathsWidth', "value", 'pathsWidth'],
    ['.cornerSize', "value", 'cornerSize'],
    ['.gw', "value", 'gridWidth'],
    ['.bis', "value", 'layerWidth'],
    ['.bw', "value", 'boreholeImgScale']
  ]
  arrays.forEach(arr => {
    let [htmlClass, htmlProperty, propertyName] = arr;
    if (!(propertyName in options)) {
      return;
    }
    updatePageOptionUI(pageSettingsRoot, htmlClass, htmlProperty, options[propertyName]);
  })


  if (options.feet) {
    d3_pageSettingsRoot.selectAll('.horScaleFt .option_ne').remove();
    d3_pageSettingsRoot.select('.horScaleFt').selectAll('.option_ne').data(options.feet).enter()
      .append('option')
      .text(d => d[0])
      .attr("value", d => d[1])
      // .property('selected', (d, i) => i == 1)
      .property('selected', (d, i) => !!d3_pageSettingsRoot.select('.horScaleFt').property("value") ? d[1] == d3_pageSettingsRoot.select('.horScaleFt').property("value") : i == 1)
      .classed('option_ne', true)

    //d3_pageSettingsRoot.select('.horScaleFt').property("value", 424);   // TODO assign default

    d3_pageSettingsRoot.selectAll('.vertScaleFt .option_ne').remove();
    d3_pageSettingsRoot.select('.vertScaleFt').selectAll('.option_ne').data(options.feet).enter()
      .append('option')
      .text(d => d[0])
      .attr("value", d => d[1])
      // .property('selected', (d, i) => i == 1)
      .property('selected', (d, i) => !!d3_pageSettingsRoot.select('.vertScaleFt').property("value") ? d[1] == d3_pageSettingsRoot.select('.vertScaleFt').property("value") : i == 1)
      .classed('option_ne', true)
  }
  //d3_pageSettingsRoot.select('.vertScaleFt').property("value", 'select');
  // crossSectionObj.storage.rootElem.querySelector(".radioFeet").click();
  // crossSectionObj.changeUnit(crossSectionObj.storage.radioMeasureValue)

  if (options.m) {
    d3_pageSettingsRoot.selectAll('.horScaleM .option_ne').remove();
    d3_pageSettingsRoot.select('.horScaleM').selectAll('option_ne').data(options.m).enter()
      .append('option')
      .text(d => d[0])
      .attr("value", d => d[1])
      // .property('selected', (d, i) => i == 1)
      .property('selected', (d, i) => !!d3_pageSettingsRoot.select('.horScaleM').property("value") ? d[1] == d3_pageSettingsRoot.select('.horScaleM').property("value") : i == 1)
      .classed('option_ne', true)

    d3_pageSettingsRoot.selectAll('.vertScaleM .option_ne').remove();
    d3_pageSettingsRoot.select('.vertScaleM').selectAll('option_ne').data(options.m).enter()
      .append('option')
      .text(d => d[0])
      .attr("value", d => d[1])
      // .property('selected', (d, i) => i == 1)
      .property('selected', (d, i) => !!d3_pageSettingsRoot.select('.vertScaleM').property("value") ? d[1] == d3_pageSettingsRoot.select('.vertScaleM').property("value") : i == 1)
      .classed('option_ne', true)
  }
}

function unlockDiagram(pageSettingsRoot) {
  d3.select(pageSettingsRoot).select(".stage1").classed("disabledarea", 1);
  d3.select(pageSettingsRoot).select(".stage2").classed("disabledarea", 0);
}

// function this.openDiagram(isFile) {
//     this.unlockDiagram();

//     if (isFile) {
//         this.processBhFileWithRedraw();
//     } else {
//         this.processFileWithRedraw("fence-diagram-sample.json");
//         // this.processFileWithRedraw();
//     }
// }

CrossSectionCanvas.prototype.onclickLoadJson = function () {
  openFile(this.loadJsonGenerator());
}

function openDiagramFile(event) {
  const pageSettingsRoot = event.target.closest(".rootElem");
  const canvasRoot = pageSettingsRoot.querySelector(".CrossSectionDeploy");
  openFile(async (fileHandle) => {
    let file = await fileHandle.getFile();
    let jsonString = await file.text();
    var jsonBorehole = JSON.parse(jsonString);
    testJqueryPlugin(pageSettingsRoot, canvasRoot, jsonBorehole);
  })
}

function openDiagramDefault(event) {
  const pageSettingsRoot = event.target.closest(".rootElem");
  const canvasRoot = pageSettingsRoot.querySelector(".CrossSectionDeploy");
  d3.json("fence-diagram-sample.json", jsonBorehole => {
    console.log(jsonBorehole);
    testJqueryPlugin(pageSettingsRoot, canvasRoot, jsonBorehole);
  })
}

Array.from(document.querySelectorAll(".rootElem")).forEach(rootElem => {
  rootElem.innerHTML = rootElemHtml + '';
})

// Still left it here because some places of the code use it.
// ZOOMER.on("zoom", zoom);
// ZOOMER.scaleExtent([this.storage.minimumZoom, this.storage.maximumZoom]);
// prevents scrolling page when maximum zoom is reached

// this.initializeStorage();
// this.initializePage();


/* -------------------------------------------------------------------------- */
/*                        Call the cross section plugin                       */
/* -------------------------------------------------------------------------- */


// for testing purposes only
var global_crossSection = [];

// standalone version and example of how to use the plugin

var hatchPromise = new Promise((resolve, reject) => {
  d3.json("soil-symbols.json", (srcs) => {
    createAllPatterns(srcs, defaultStorage, (arr) => {
      resolve(arr);
    });
  })
});

var testJqueryPlugin = (pageSettingsRoot, canvasRoot, jsonBorehole) => {
  // storage = {};
  canvasRoot.innerHTML = CrossSectionHtml + '';
  d3.json("soil-options.json", jsonOptions => {
    d3.json("soil-symbols.json", soilSymbols => {

      // alter some values defined in the storage
      // passing this just for testing. When zooming out, the minimum should be 5%
      let options = { minimumZoom: 0.05 };

      // those are usually defined in the soil-options.json
      let pageSettings = {
        "textSize": 8,
        "pathsWidth": 1,
        "gridWidth": 1,
        "PIXW": 1100,
        "PIXH": 600,
        "cornerSize": 1,
        "boreholeImgScale": 6,
        "layerWidth": 5,
        "legendWidth": 20,
        "legendHeight": 10,
        // "feet": [
        //   ["1/16′′ = 1′-0′′", 192],
        //   ["3/32′′ = 1′-0′′", 128],
        //   ["1/8′′ = 1′-0′′", 96],
        //   ["3/16′′ = 1′-0′′", 64],
        //   ["1/4′′ = 1′-0′′", 48],
        //   ["3/8′′ = 1′-0′′", 32],
        //   ["1/2′′ = 1′-0′′", 24],
        //   ["3/4′′ = 1′-0′′", 16],
        //   ["1′′ = 1′-0′′", 12],
        //   ["1 1/2′′ = 1′-0′′", 8],
        //   ["3′′ = 1′-0′′", 4],
        //   ["two", 2],
        //   ["one", 1]
        // ],
        // "m": [
        //   ["1:100", 100],
        //   ["1:200", 200],
        //   ["1:250", 250],
        //   ["1:500", 500],
        //   ["1:1000", 1000],
        //   ["1:2000", 2000],
        //   ["1:10000", 10000]
        // ],
      }

      // triggered after the canvas is done loading
      doneFunction = (crossSectionObj) => {
        // initialize page settings UI
        initializePageSettingsUIValues(crossSectionObj, pageSettingsRoot);
        updatePageOptionUIs(pageSettingsRoot, jsonOptions);
        initializeSettingsEventListeners(crossSectionObj, pageSettingsRoot); // settings UI in the standalone version, defined above
        unlockDiagram(pageSettingsRoot);

        // insert hatch patterns since they were loaded by a function outside of the plugin
        hatchPromise.then((arr) => crossSectionObj.insertHatchPatterns(arr));

        // pass new options example
        // let newOptions = {
        //   "textSize": 16,
        //   "pathsWidth": 2,
        //   "gridWidth": 1,
        //   "cornerSize": 2,
        //   "boreholeImgScale": 4,
        //   "layerWidth": 5,
        //   "legendWidth": 30,
        //   "legendHeight": 20,
        // }
        // crossSectionObj.applyAllPageOptions(newOptions);
        // // update the page settings UI to reflect the new values
        // updatePageOptionUIs(pageSettingsRoot, newOptions);

        // update fieldTest options. The field test should be weirdly colored and in a weird position
        let boreholeId = crossSectionObj.boreholeNameToId('BH-1');
        crossSectionObj.fieldTestUpdatePositionProperties(boreholeId, {
          test_title: "New title",
          test_height: 30,
          test_width: 60,
          test_xx: 5,
          test_yz: 20,
          // now the test_position updates based on the position in relation to the borehole, so I'm not sure this has any influence
          test_position: "left",
        })
        crossSectionObj.fieldTestUpdateProperties(boreholeId, {
          backgroundColor: "red",
          lineColor: "green",
          lineFillColor: "blue",
          plotOpacity: 0.4,
          pointColor: "purple",
          showPoints: true,
          showPointsValues: false,
        })

      }

      let crossSectionObj = $(canvasRoot).initializeCrossSection(jsonBorehole, soilSymbols, pageSettings, options, doneFunction);

      global_crossSection.push(crossSectionObj);
    })
  });
}
