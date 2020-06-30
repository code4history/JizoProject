const fs = require('fs-extra');

const pois = fs.readJsonSync('../pois.geojson');
const files = fs.readJsonSync('../files.geojson');
const refs = fs.readJsonSync('../refs.geojson');

const refsBuffer = {};
refs.features.map((curr) => {
    if (!refsBuffer[curr.properties.poiid]) {
        refsBuffer[curr.properties.poiid] = [];
    }
    refsBuffer[curr.properties.poiid].push(curr.properties);
});
const filesBuffer = {};
files.features.map((curr) => {
    if (!filesBuffer[curr.properties.poiid]) {
        filesBuffer[curr.properties.poiid] = [];
    }
    filesBuffer[curr.properties.poiid].push(curr.properties);
});
pois.features.map((poi) => {
    if (refsBuffer[poi.properties.fid]) {
        poi.properties.refs = refsBuffer[poi.properties.fid];
    }
    if (filesBuffer[poi.properties.fid]) {
        poi.properties.files = filesBuffer[poi.properties.fid];
        const primary = poi.properties.files.reduce((prev, curr) => {
            if (!prev) return curr;
            if (poi.properties.primary_image == curr.fid) return curr;
            return prev;
        }, null);
        poi.properties.path = primary.path;
        poi.properties.small_thumbnail = primary.small_thumbnail;
        poi.properties.mid_thumbnail = primary.mid_thumbnail;
    }
    delete poi.properties.primary_image;
});
fs.writeJsonSync('../jizo_project.geojson', pois, {
    spaces: '  '
});