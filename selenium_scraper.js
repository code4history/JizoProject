var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until,
    fs = require('fs');


var pref_id  = 0;
var pref_num = 24;
var timeout  = 600000;
var results  = [];

function get_target(url) {
    var driver = new webdriver.Builder()
        .forBrowser('chrome')
        .usingServer('http://localhost:4444/wd/hub')
        .build();
    driver.get(url);
    return driver.wait(function(){
        return driver.findElements(By.xpath('//h1[@id="firstHeading"][@class="firstHeading"]'))
        .then(function(elems){
            if (elems.length == 0) return false;
            return true;
        });
    }, timeout)
    .then(function(){
        return driver;
    });
}

function get_categories_images(driver) {
    return Promise.all([
        driver.findElements(By.xpath('//div[contains(@class,"description")][contains(@class,"mw-content-ltr")][contains(@class,"ja")]|//div[@id="mw-content-text"]/*[1][name(.)="p"]'))
        .then(function(elems){
            return Promise.all(elems.map(function(elem) {
                return elem.getInnerHtml();
            }));
        })
        .then(function(descs){
            return descs.map(function(desc){
                return desc.replace(/奈良市[ ]+/g,"");
            });
        }),
        driver.findElements(By.xpath('//a[contains(@class,"CategoryTreeLabel")][contains(@class,"CategoryTreeLabelCategory")]'))
        .then(function(elems){
            return Promise.all(elems.map(function(elem) {
                return elem.getText();
            }));
        }),
        driver.findElements(By.xpath('//a[contains(@class,"galleryfilename")][contains(@class,"galleryfilename-truncate")]'))
        .then(function(elems){
            return Promise.all(elems.map(function(elem) {
                return elem.getText();
            }));
        })
    ]).then(function(results){
        driver.close();
        var rets = results[1].map(function(item){
            return {
                "url" : 'https://commons.wikimedia.org/wiki/Category:' + item.replace(" ","_")
            };
        });
        rets = rets.concat(results[2].map(function(item){
            return {
                "url" : 'https://commons.wikimedia.org/wiki/File:' + item.replace(" ","_")
            };
        }));

        return {
            "description" : results[0],
            "pages" : rets
        };
    });
}

function scrape_filepage(driver) {
    return Promise.all([
        driver.findElements(By.xpath('//a[contains(text(),"OpenStreetMap")]'))
        .then(function(elems){
            if (elems.length > 0) {
                return elems[0].getAttribute('href')
                .then(function(url){
                    url.match(/lat=([0-9\.]+)&lon=([0-9\.]+)/);
                    return [parseFloat(RegExp.$1), parseFloat(RegExp.$2)];
                });
            } else {
                return null;
            }
        }),
        driver.findElements(By.xpath('//span[@class="mw-filepage-other-resolutions"]/a'))
        .then(function(elems){
            if (elems.length > 0) {
                return elems[0].getAttribute('href');
            } else {
                return null;
            }
        }),
        driver.findElements(By.xpath('//div[@class="fullMedia"]/a'))
        .then(function(elems){
            if (elems.length > 0) {
                return elems[0].getAttribute('href');
            } else {
                return null;
            }
        }),
        driver.findElements(By.xpath('//div[contains(@class,"description")][contains(@class,"mw-content-ltr")][contains(@class,"ja")]'))
        .then(function(elems){
            return Promise.all(elems.map(function(elem) {
                return elem.getInnerHtml();
            }));
        })
        .then(function(descs){
            return descs.map(function(desc){
                return desc.replace(/奈良市[ ]+/g,"");
            });
        })
    ])
    .then(function(arr){
        driver.close();
        var ret = {};
        if (arr[0]) ret["latlng"]    = arr[0];
        if (arr[1]) ret["thumbnail"] = arr[1];
        if (arr[2]) ret["fullsize"]  = arr[2];
        if (arr[3]) ret["description"] = arr[3];
        return ret;
    });
}

function load_each_page(target) {
    var pages = target.pages;
    return Promise.all(pages.map(function(page){
        return page.url.includes('wiki/File:') ?
            get_target(page.url)
            .then(function(driver){
                scrape_filepage(driver)
                .then(function(res){
                    page.latlng    = res.latlng;               
                    page.thumbnail = res.thumbnail;
                    page.fullsize  = res.fullsize;
                    page.description = res.description;
                })
            }) : 
            get_target(page.url)
            .then(get_categories_images)
            .then(load_each_page)
            .then(function(ltarget){
                page.description = ltarget.description;
                var lpages  = ltarget.pages;
                page.latlng = lpages.filter(function(val){
                    return val.latlng != void 0;
                }).reduce(function(prev,curr){
                    var latlng = curr.latlng;
                    delete curr.latlng;
                    return prev.map(function(val,i){
                        return val + latlng[i];
                    });
                },[0.0,0.0]).map(function(val,i,arr){
                    return val / arr.length;
                });                
                page.files  = lpages;      
            });
    }))
    .then(function(){
        return target;
    });
}

get_target("https://commons.wikimedia.org/wiki/Category:Wayside_Jizos_in_Nara")
.then(get_categories_images)
.then(load_each_page)
.then(function(target){
    var geojson = target.pages.map(function(source){
        var feature = {
            "type": "Feature",
            "geometry" : {
                "type" : "Point",
                "coordinates" : [source.latlng[1],source.latlng[0]]
            },
            "properties" : {
                "url" : source.url,
                "title" : source.description,
                "description" : source.description
            }
        };
        var prop = feature.properties;
        var thumbnail;
        if (source.files && source.files.length != 0) {
            prop.files = source.files;
            console.log(JSON.stringify(source.files));
            thumbnail  = source.files[0].thumbnail;
        } else {
            thumbnail      = source.thumbnail;
            prop.thumbnail = source.thumbnail;
            prop.fullsize  = source.fullsize;
        }
        prop.popupContent = "<h2>" + source.description + "</h2>" +
            source.description + "<br>" +
            "<img src='" + thumbnail + "'>";
        return feature;
    });
    var json = JSON.stringify(geojson, null, "  ");
    fs.writeFile('jizos.geojson', json , function (err) {
        console.log(err);
    });
});
