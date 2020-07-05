const ExifImage = require('exif').ExifImage;
const fs = require('fs-extra');

const files = fs.readJsonSync('../files.geojson');

const promises = files.features.map((curr) => {
    return new Promise((resolve, reject) => {
        const path = `.${curr.properties.path}`;
        try {
            new ExifImage({ image : path }, function (error, exifData) {
                let author;
                let date;
                if (error) {
                    //console.log('Error 1: ' + error.message + path);
                    author = 'Yasushi Fukunaga';
                    date = '2018/07/23 13:59:00';
                } else {
                    date = exifData.exif.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1/$2/$3 ");

                    //console.log(date); // Do something with your data!
                    //if (exifData.image.Make != 'Apple') console.log(exifData.image.Make);
                    if (exifData.image.Model != 'iPhone X' && exifData.image.Model != 'iPhone SE' && exifData.image.Model != 'SCL23' && exifData.image.Model != 'Nexus 5X' && exifData.image.Model != 'iPhone 5s') {
                        //console.log(exifData.image.Model + ' ' + path);
                        author = 'panoramino user: ESU';
                    } else {
                        author = 'Kohei Otsuka';
                    }
                }
                curr.properties.date = date;
                curr.properties.author = author;
                resolve();
            });
        } catch (error) {
            console.log('Error 2: ' + error.message);
            reject();
        }
    });
});

Promise.all(promises).then(() => {
    fs.writeJsonSync('../files_date.geojson', files, {
        spaces: '  '
    });
});