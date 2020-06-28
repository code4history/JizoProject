const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');

const files = fs.readJsonSync('../files.geojson');
const new_files = Object.assign({}, files);
new_files.features = [];
const fileBuffer = files.features.reduce((prev, curr) => {
    prev[curr.properties.path] = 1;
    return prev;
}, {});

const imageRoot = './images';
const folders = fs.readdirSync(`.${imageRoot}`);
const fileNew =[];

folders.map((folder) => {
    if (folder.match(/^\./)) return;
    const folderPath = `${imageRoot}/${folder}`;
    let description = {};
    try {
        description = fs.readJsonSync(`.${folderPath}/description.json`);
    } catch(e) {
    }
    const images = fs.readdirSync(`.${folderPath}`);
    images.map((image) => {
        if (image.match(/^\./)) return;
        if (image == 'description.json') return;
        const imagePath = `${folderPath}/${image}`;
        if (fileBuffer[imagePath]) return;
        fileNew.push({
            path: imagePath,
            description: description[image],
            poiid: parseInt(folder)
        });
    });
});

console.log(fileNew);

const promises = fileNew.map((curr) => {
    return new Promise((resolve, reject) => {
        const path = `.${curr.path}`;
        try {
            new ExifImage({ image : path }, function (error, exifData) {
                if (error) {
                    console.log('Error 1: ' + error.message + path);
                    reject();
                    return;
                } else {
                    const date = exifData.exif.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1/$2/$3 ");
                    const author = 'Kohei Otsuka';
                    resolve({
                        "type": "Feature",
                        "properties": {
                            "fid": null,
                            "poiid": curr.poiid,
                            "description": curr.description,
                            "path": curr.path,
                            "date": date,
                            "author": author
                        },
                        "geometry": null
                    });
                }
            });
        } catch (error) {
            console.log('Error 2: ' + error.message);
            reject();
        }
    });
});

Promise.all(promises).then((features) => {
    new_files.features = features;
    fs.writeJsonSync('../files_new.geojson', new_files, {
        spaces: '  '
    });
});