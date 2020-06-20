const fs = require('fs-extra');
const URI = require("urijs");
const fetch = require('node-fetch');

const pois = fs.readJsonSync('../pois.geojson');
const files = fs.readJsonSync('../files.geojson');
const refs = fs.readJsonSync('../refs.geojson');

let refsMax = refs.features.reduce((prev, curr) => {
    return curr.properties.fid > prev ? curr.properties.fid : prev;
}, 0);
const filesBuffer = {};
const promises = files.features.map((curr) => {
    return new Promise((resolve) => {
        const file = curr.properties;
        const url = file.fullsize;
        if (!url) {
            resolve();
            return;
        }
        const uri = new URI(url);
        fetch(url).then(async res => {
            if (res.ok) {
                const buffer = await res.arrayBuffer();
                //fs.write(`../images/${file.poiid}/${uri.filename()}`, buffer, (err) =>{
                fs.outputFile(`../images/${file.poiid}/${uri.filename()}`, new Buffer(buffer), (err) =>{
                    if (err) {
                        console.log(`File write Error - '${url}'`);
                    } else {
                        file.path = `./images/${file.poiid}/${uri.filename()}`;
                        delete file.url;
                        delete file.thumbnail;
                        delete file.fullsize;
                    }
                    resolve();
                });
            } else {
                console.log(`404 Error - '${url}'`);
                resolve();
            }
        });
    });
});

Promise.all(promises).then(() => {
    fs.writeJsonSync('../files_path_update.geojson', files);
});

/*const poisBuffer = {};
pois.features.map((poi) => {
    poisBuffer[poi.properties.url] = poi;
    if (!filesBuffer[poi.properties.fid] && poi.properties.url) {
        filesMax++;
        const file = {
            fid: filesMax,
            poiid: poi.properties.fid,
            description: `${poi.properties.title} ${poi.properties.description}`,
            url: poi.properties.url,
            thumbnail: poi.properties.thumbnail,
            fullsize: poi.properties.fullsize
        };
        files.features.push(file);
    }
});
fs.writeJsonSync('../files_update.geojson', files);*/