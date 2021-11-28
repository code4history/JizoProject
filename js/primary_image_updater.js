const fs = require('fs-extra');
const fetch = require('node-fetch');

const pois = fs.readJsonSync('../pois.geojson');
const files = fs.readJsonSync('../images.geojson');

const filesBuffer = {};
files.features.map((curr) => {
    if (!filesBuffer[curr.properties.poiid]) {
        filesBuffer[curr.properties.poiid] = [];
    }
    filesBuffer[curr.properties.poiid].push(curr.properties);
});
const promises = pois.features.map((poi) => {
    const latlng = poi.geometry.coordinates;
    const geocodePromise = new Promise((resolve) => {
        fetch(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${latlng[1]}&lon=${latlng[0]}`)
        .then((res) => {
            res.json().then((json) => {
                poi.properties.address = json.results.lv01Nm;
                resolve();
            });
        });
    });

    const props = poi.properties;
    let buf = filesBuffer[poi.properties.fid];
    if (buf) buf = buf.filter((item) => {
        if (item.path.match(/[iI]nside/)) return false;
        if (item.description.match(/内部/) && item.poiid != 117) return false;
        return true;
    });
    if (buf && buf.length > 0) {
        if (props.primary_image) {
            const check = buf.reduce((prev, curr) => {
                if (curr.fid == props.primary_image) return true;
                return prev;
            }, false);
            if (check) {
                props.brushup = true;
            } else {
                props.brushup = false;
                let force = '';
                if (props.fid == props.primary_image) {
                    delete props.primary_image;
                    force = 'Force to set primary image to null';
                }
                console.log(`${props.fid}: Bad primary image ${force}`);
            }
            return geocodePromise;
        } else if (buf.length == 1) {
            props.brushup = true;
            props.primary_image = buf[0].fid;
            return geocodePromise;
        }
        console.log(`${props.fid}: Several selections`);
        props.brushup = false;
    } else {
        console.log(`${props.fid}: No proper images ${ props.need_action || '' }`);
        delete props.primary_image;
        props.brushup = false;
    }
    return geocodePromise;
});

Promise.all(promises).then(() => {
    fs.writeJsonSync('../pois_photo_check.geojson', pois, {
        spaces: '  '
    });
});
