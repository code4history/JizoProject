const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');
const sharp = require('sharp');

const files = fs.readJsonSync('../files.geojson');
const promises = files.features.map((curr) => {
    const path = curr.properties.path;
    const mid_thumb = path.replace('./images', './mid_thumbs');
    const small_thumb = path.replace('./images', './small_thumbs');
    let finish = 0;
    return new Promise((resolve) => {
        try {
            fs.statSync(`.${mid_thumb}`);
            finish++;
            if (finish > 1) {
                resolve();
            }
        } catch(err) {
            fs.ensureFileSync(`.${mid_thumb}`);
            sharp(`.${path}`)
                .resize(800, 800, {
                    kernel: sharp.kernel.nearest,
                    fit: sharp.fit.inside
                })
                .toFile(`.${mid_thumb}`)
                .then(() => {
                    curr.properties.mid_thumbnail = mid_thumb;
                    finish++;
                    if (finish > 1) {
                        resolve();
                    }
                });
        }
        try {
            fs.statSync(`.${small_thumb}`);
            finish++;
            if (finish > 1) {
                resolve();
            }
        } catch(err) {
            fs.ensureFileSync(`.${small_thumb}`);
            sharp(`.${path}`)
                .resize(200, 200, {
                    kernel: sharp.kernel.nearest,
                    fit: sharp.fit.inside
                })
                .toFile(`.${small_thumb}`)
                .then(() => {
                    curr.properties.small_thumbnail = small_thumb;
                    finish++;
                    if (finish > 1) {
                        resolve();
                    }
                });
        }
    });
});

Promise.all(promises).then(() =>{
    fs.writeJsonSync('../files_thumbs.geojson', files);
});