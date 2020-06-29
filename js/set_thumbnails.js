const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');
const sharp = require('sharp');

const files = fs.readJsonSync('../files.geojson');
files.features.map((curr) => {
    const path = curr.properties.path;
    const mid_thumb = path.replace('./images', './mid_thumbs');
    const small_thumb = path.replace('./images', './small_thumbs');
    try {
        fs.statSync(mid_thumb);
    } catch(err) {
        sharp(`.${path}`)
            .resize(800, 800, {
                kernel: sharp.kernel.nearest,
                fit: sharp.fit.indide
            })
            .toFile(`.${mid_thumb}`)
            .then(() => {
                // output.png is a 200 pixels wide and 300 pixels high image
                // containing a nearest-neighbour scaled version
                // contained within the north-east corner of a semi-transparent white canvas
            });
    }
    try {
        fs.statSync(small_thumb);
    } catch(err) {
        sharp(`.${path}`)
            .resize(200, 200, {
                kernel: sharp.kernel.nearest,
                fit: sharp.fit.indide
            })
            .toFile(`.${small_thumb}`)
            .then(() => {
                // output.png is a 200 pixels wide and 300 pixels high image
                // containing a nearest-neighbour scaled version
                // contained within the north-east corner of a semi-transparent white canvas
            });
    }
});

/*
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
});*/