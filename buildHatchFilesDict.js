// generates a file containing all the hatches already converted to dataurls
// uses node
const fs = require('fs');
const path = require("path");
const sizeOf = require('image-size')

const hatchFolder = './Hatch_Files/PNG'

function toDataUrl(url, callback) {
    fs.readFile(url, function(err, data) {
        if (err) {
            console.log(err);
        }
        const dimensions = sizeOf(url);
        const base64 = data.toString('base64');
        callback(base64, dimensions.width, dimensions.height);
      })
}

async function getImageDicts({srcs, IMGPREFIX, callback}) {
    let arr = [];
    const maximumRequests = 250;
    const pockets = Math.ceil(srcs.length / maximumRequests);
    for (let i = 0; i < pockets; i += 1) {
        const pocket = srcs.slice(i * maximumRequests, (i + 1) * maximumRequests);
        let pocketCompleted = new Promise((resolve, reject) => {
            pocket.forEach(src => {
                toDataUrl(IMGPREFIX + src, (myBase64, w, h) => {
                    myBase64 = `data:image/png;base64,` + myBase64;
                    const correctSource = src.replaceAll('\\', '/').replace("/Black/", "/000000/");
                    arr.push({
                        src: correctSource,
                        w: w,
                        h: h,
                        imageBase64: myBase64
                    })
                    if (arr.length == (i + 1) * maximumRequests || arr.length == srcs.length) {
                        resolve(true);
                    }
                    if (arr.length == srcs.length) {
                        callback(arr);
                    }
                })
            })
        })
        await pocketCompleted;
    }
}

function getAllFiles (dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
  
    arrayOfFiles = arrayOfFiles || []
  
    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
      } else {
        arrayOfFiles.push(path.join(dirPath, "/", file))
      }
    })
  
    return arrayOfFiles
  }

async function main() {
    const files = getAllFiles(hatchFolder)
    const srcs = files.filter(x => x?.includes('\\Black\\'));
    console.log(srcs);
    const availableColors = ["Black", "Red", "Lime", "Blue", "Yellow", "Cyan", "Magenta", "Brown", "Green", "Maroon"];
    // const defaultHatchColor = "Black";
    const IMGPREFIX = "";
    const callback = (result) => {
        console.log(result)
        const text = `const hatchFilesArr = ${JSON.stringify(result)}; const hatchFilesDict = Object.fromEntries(hatchFilesArr.map(dict => [dict.src, dict]));`
        fs.writeFile("./hatchFilesDict.js", text, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    }
    getImageDicts({
        srcs: srcs,
        IMGPREFIX: IMGPREFIX,
        callback : callback
    })

}

function checkAllColorsExist(srcs, availableColors) {
    const blackSrcs = srcs.filter(x => x.includes("Black"));
    const srcsDict = Object.fromEntries(srcs.map(x => [x, true]));
    const missing = [];
    blackSrcs.forEach(src => {
        availableColors.forEach(color => {
            const coloredSrc = src.replace("Black", color);
            if (! srcsDict[coloredSrc]) {
                missing.push(coloredSrc);
            }
        })
    })
    if (missing.length > 0) {
        console.log("Colors missing!");
        console.log(missing);
    }
}

main();