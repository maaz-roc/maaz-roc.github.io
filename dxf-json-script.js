var Drawing = require('Drawing');

function CreateDXF_fromRSjson(thedata){
    console.log(Drawing);
    //Fetch the data
    let thepolygons = thedata.POLYGONS;

    d = new Drawing();
    if (thedata.Unit == "ft"){
        d.setUnits('Feet');
    }
    if (thedata.Unit == "m"){
        d.setUnits('Meters');
    }

    //Create layers
    d.addLayer('Titles', Drawing.ACI.WHITE, 'CONTINUOUS');
    d.addLayer('Notes', Drawing.ACI.CYAN, 'CONTINUOUS');
    d.addLayer('Sketch Lines', Drawing.ACI.RED, 'CONTINUOUS');
    d.addLayer('Sketch Polygons', Drawing.ACI.YELLOW, 'CONTINUOUS');
    d.addLayer('Subsurface Layers', Drawing.ACI.WHITE, 'CONTINUOUS');
    d.addLayer('Test Holes', Drawing.ACI.YELLOW, 'CONTINUOUS');
    d.addLayer('Groundwater', Drawing.ACI.CYAN, 'CONTINUOUS');
    d.addLayer('Hatch Symbols', Drawing.ACI.MAGENTA, 'CONTINUOUS');

    // Print polygons
    let pointsArray = [];
    for (let i = 0; i<thepolygons.length; i++){
        d.setActiveLayer('Subsurface Layers');
        pointsArray = [];
        console.log(thepolygons[i]['points2D']);
        let thePolyPoints = thepolygons[i]['points2D'];
        if(thepolygons[i].fsrc){
            for (let i = 0; i<thePolyPoints.length; i++){
            
            console.log(thePolyPoints[i]['coordinate']);
            pointsArray.push(thePolyPoints[i]['coordinate']);
            

            }
            d.drawPolyline(pointsArray, "DOTTED", closed = true);
            console.log(pointsArray);

        }

    }
    console.log(thepolygons);
    console.log(pointsArray);
    // Draw the other polygons drawn by user
    // In sketch polygon
    let pointsArray2 = [];
    for (let i = 0; i<thepolygons.length; i++){
        d.setActiveLayer('Sketch Polygons');
        pointsArray = [];
        console.log(thepolygons[i]['points2D']);
        let thePolyPoints = thepolygons[i]['points2D'];
        if(thepolygons[i].fsrc == undefined){
            for (let i = 0; i<thePolyPoints.length; i++){
            
            console.log(thePolyPoints[i]['coordinate']);
            pointsArray.push(thePolyPoints[i]['coordinate']);
            

        
        


            }
            d.drawPolyline(pointsArray, "DOTTED", closed = true);
            console.log(pointsArray);

        }
        

        


        
        


    }
    

    // Draw boreholes
    // Get the width
    let boreholesWidth = thedata.boreholeWidth;
    console.log(boreholesWidth);
    let boreHoles = thedata.data;
    console.log(boreHoles);
    

    d.setActiveLayer('Groundwater');
    // Draw water lines
    for (let i = 0; i<boreHoles.length; i++){
        if (boreHoles[i]['general']['water']){
            let top_coordinates = boreHoles[i]['general']['th_profile_coordinates'];
            let BH_TOP = top_coordinates.split(',').map(Number);
            console.log(BH_TOP);
            let theDepth = BH_TOP[1] - (boreHoles[i]['general']['water']);
            d.drawLine(BH_TOP[0] - boreholesWidth/2, theDepth, BH_TOP[0] + boreholesWidth/2, theDepth);
            
        }
        
    }

    //Draw boreholes, we have BH_Top
    d.setActiveLayer('Test Holes');
    for (let i = 0; i<boreHoles.length; i++){
        let soilLayers = boreHoles[i].soillayer;
        let top_coordinates = boreHoles[i]['general']['th_profile_coordinates'];
        let BH_TOP = top_coordinates.split(',').map(Number);
        console.log(BH_TOP);
        for (let i=0; i<soilLayers.length; i++){
            let from = BH_TOP[1] - (soilLayers[i].from);
            let to = BH_TOP[1] - (soilLayers[i].to);
            d.drawRect(BH_TOP[0] - boreholesWidth/2, from, BH_TOP[0] + boreholesWidth/2, to);

        }
        
    }

    
    for (let i = 0; i<boreHoles.length; i++){
        d.setActiveLayer('Titles');
        console.log(boreHoles[i]['general']['th_profile_coordinates']);
        let top_coordinates = boreHoles[i]['general']['th_profile_coordinates'];
        let BH_TOP = top_coordinates.split(',').map(Number);
        let title = boreHoles[i]['name'];
        let soilLayers = boreHoles[i].soillayer;
        console.log(title);
        
        d.drawText(BH_TOP[0], BH_TOP[1] + boreholesWidth, boreholesWidth/4, 0, title, "center");
        for (let i=0; i<soilLayers.length; i++){
            let from = BH_TOP[1] - (soilLayers[i].from);
            let to = BH_TOP[1] - (soilLayers[i].to);
            let theLayerTitle = soilLayers[i].layerTitle;
            let theLayerSymbol = soilLayers[i].layerSymbol;
            d.setActiveLayer('Titles');
            d.drawText(BH_TOP[0] + boreholesWidth/1.2, (from+to)/2, boreholesWidth/4, 0, theLayerTitle, "left");
            d.setActiveLayer('Hatch Symbols');
            d.drawText(BH_TOP[0] + boreholesWidth/1.2, (from+to)/2 - 1, boreholesWidth/4, 0, theLayerSymbol, "left");



        }
    }

    // Draw the  polylines
    d.setActiveLayer('Sketch Lines');
    
    let thelines = thedata.lines;
    for (let i = 0; i<thelines.length; i++){
        let polylines = [];
        
        d.setActiveLayer('Sketch Lines');
        let x1 = thelines[i]['point1']['xx'];
        let y1 = thelines[i]['point1']['yz'];
        let x2 = thelines[i]['point2']['xx'];
        let y2 = thelines[i]['point2']['yz'];

        polylines.push([x1, y1]);
        polylines.push([x2, y2]);
        d.drawPolyline(polylines, closed = false);
        console.log(polylines);

        
        


    }

    //Water lines
    let links = thedata['LINKS'];
    d.setActiveLayer('Groundwater');
    for (let i = 0; i<links.length; i++){
        let polylines = [];
        
        
        let x1 = links[i]['point1']['xx'];
        let y1 = links[i]['point1']['yz'];
        let x2 = links[i]['point2']['xx'];
        let y2 = links[i]['point2']['yz'];

        polylines.push([x1, y1]);
        polylines.push([x2, y2]);
        d.drawPolyline(polylines, closed = false);
        console.log(polylines);

        
        


    }

    //Draw the textboxess

    //For the text
    d.setActiveLayer('Notes');
    console.log((thedata.texts));
    let text = thedata.texts;
    for (var x in thedata.texts) {
        console.log(text[x]);
        let thetext = text[x];
        d.drawText(thetext['x'], thetext['y'], boreholesWidth/4, 0, thetext.text, "left");

    }

    var element = document.createElement('a');
    var b = new Blob([d.toDxfString()], {type: 'application/dxf'});
    element.download = `${thedata.title}.dxf`;
    element.href = URL.createObjectURL(b);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);  
}








