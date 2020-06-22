const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');

const files = fs.readJsonSync('../files.geojson');

files.features.map((curr) => {
    const path = `.${curr.properties.path}`;
    try {
        new ExifImage({ image : path }, function (error, exifData) {
            if (error) {
                console.log('Error 1: ' + error.message + path);
            } else {
                //console.log(exifData.exif.DateTimeOriginal); // Do something with your data!
                //if (exifData.image.Make != 'Apple') console.log(exifData.image.Make);
                if (exifData.image.Model != 'iPhone X' && exifData.image.Model != 'iPhone SE' && exifData.image.Model != 'SCL23' && exifData.image.Model != 'Nexus 5X' && exifData.image.Model != 'iPhone 5s') {
                    console.log(exifData.image.Model + ' ' + path);
                }
            }
        });
    } catch (error) {
        console.log('Error 2: ' + error.message);
    }
});