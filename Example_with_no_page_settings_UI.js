/* -------------------------------------------------------------------------- */
/*      html and functions that refer to the standalone version interface     */
/* -------------------------------------------------------------------------- */

var rootElemHtml = `<div class="CrossSectionDeploy"></div>`

function openDiagramDefault() {
  const canvasRoot = document.querySelector(".CrossSectionDeploy");
  d3.json("fence-diagram-sample.json", jsonBorehole => {
    testJqueryPlugin(null, canvasRoot, jsonBorehole);
  })
}

Array.from(document.querySelectorAll(".rootElem")).forEach(rootElem => {
  rootElem.innerHTML = rootElemHtml + '';
})

/* -------------------------------------------------------------------------- */
/*                        Call the cross section plugin                       */
/* -------------------------------------------------------------------------- */


// for testing purposes only
var global_crossSection = [];

// var hatchPromise = new Promise((resolve, reject) => {
//   d3.json("soil-symbols.json", (srcs) => {
//     createAllPatterns(srcs, defaultStorage, (arr) => {
//       resolve(arr);
//     });
//   })
// });

var testJqueryPlugin = (pageSettingsRoot, canvasRoot, jsonBorehole) => {
  // storage = {};
  canvasRoot.innerHTML = CrossSectionHtml + '';
  // d3.json("soil-options.json", jsonOptions => {
    d3.json("soil-symbols.json", soilSymbols => {

      // alter some values defined in the storage
      // passing this just for testing. When zooming out, the minimum should be 5%
      let options = { minimumZoom: 0.05 };

      // those are usually defined in the soil-options.json
      let pageSettings = {
        "textSize": 8,
        "pathsWidth": 1,
        "gridWidth": 2,
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

        // insert hatch patterns since they were loaded by a function outside of the plugin
        // hatchPromise.then((arr) => crossSectionObj.insertHatchPatterns(arr));
        // crossSectionObj.insertHatchPatterns(hatchFilesArr);

        // pass new options example
        // let newOptions = {
        //   "textSize": 16,
        //   "pathsWidth": 2,
        //   "gridWidth": 4,
        //   "cornerSize": 2,
        //   "boreholeImgScale": 6,
        //   "layerWidth": 5,
        //   "legendWidth": 30,
        //   "legendHeight": 20,
        // }
        // crossSectionObj.applyAllPageOptions(newOptions);

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
  // });
}

openDiagramDefault();