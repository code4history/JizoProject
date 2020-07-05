const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');
const sharp = require('sharp');

function replacer(path) {
    path = path.replace(/HigashiKujo/g, 'ToKujo');
    path = path.replace(/NishiKujo/g, 'SaiKujo');
    path = path.replace(/MinamiKido/g, 'MinamiJodo');
    path = path.replace(/NishiKido/g, 'NishiShinya');
    path = path.replace(/%[0-9a-fA-F]{2}/g, (repl) => { return decodeURIComponent(repl); });
    return path;
}

const files = fs.readJsonSync('../files.geojson');
files.features.map((curr) => {
    const path = curr.properties.path;
    const mid_thumb = curr.properties.mid_thumbnail;
    const small_thumb = curr.properties.small_thumbnail;
    const pathReplace = replacer(path);
    if (path != pathReplace) {
        const midReplace = replacer(mid_thumb);
        const smallReplace = replacer(small_thumb);
        curr.properties.path = pathReplace;
        curr.properties.mid_thumbnail = midReplace;
        curr.properties.small_thumbnail = smallReplace;
        fs.moveSync(`.${path}`, `.${pathReplace}`);
        fs.moveSync(`.${mid_thumb}`, `.${midReplace}`);
        fs.moveSync(`.${small_thumb}`, `.${smallReplace}`);
    }
});

fs.writeJsonSync('../files_replace.geojson', files);
