const fs = require('fs-extra');

const pois = fs.readJsonSync('../pois.geojson');
const files = fs.readJsonSync('../files.geojson');
const refs = fs.readJsonSync('../refs.geojson');

let refsMax = refs.features.reduce((prev, curr) => {
    return curr.properties.fid > prev ? curr.properties.fid : prev;
}, 0);
const filesBuffer = {};
let filesMax = files.features.reduce((prev, curr) => {
    if (!filesBuffer[curr.properties.poiid]) {
        filesBuffer[curr.properties.poiid] = [];
    }
    filesBuffer[curr.properties.poiid].push(curr);
    return curr.properties.fid > prev ? curr.properties.fid : prev;
}, 0);
const poisBuffer = {};
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
fs.writeJsonSync('../files_update.geojson', files);