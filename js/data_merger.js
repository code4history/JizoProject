const fs = require('fs-extra');

const pois = fs.readJsonSync('../pois.geojson');
const files = fs.readJsonSync('../images.geojson');
const refs = fs.readJsonSync('../refs.geojson');

const refsBuffer = {};
const refDefaultBuffer = {};
refs.features.map((curr) => {
    let ref = curr.properties;
    if (refDefaultBuffer[ref.title]) {
        const refDefault = refDefaultBuffer[ref.title];
        ref = Object.keys(ref).reduce((prev, curr) => {
            if (curr === 'description' || curr === 'note') return prev;
            prev[curr] = prev[curr] == null ? refDefault[curr] : prev[curr];
            return prev;
        }, ref);
    } else {
        refDefaultBuffer[ref.title] = ref;
    }

    if (!refsBuffer[ref.poiid]) {
        refsBuffer[ref.poiid] = [];
    }
    refsBuffer[ref.poiid].push(ref);
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
    } else {
        poi.properties.files = [];
        poi.properties.path = null;
        poi.properties.small_thumbnail = null;
        poi.properties.mid_thumbnail = null;
    }
    delete poi.properties.primary_image;
    delete poi.properties.brushup;
});
fs.writeJsonSync('../jizo_project.geojson', pois, {
    spaces: '  '
});