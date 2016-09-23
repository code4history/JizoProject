#!/usr/bin/env node

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until,
    fs = require('fs'),
    argv = require('argv');

argv.option({
    name: 'newonly',
    short: 'n',
    type : 'boolean',
    description : '新しい要素だけを追加します',
    example: "'selenium_scraper.js --newonly' or 'selenium_scraper.js -n'"
});

var args = argv.run();
console.log(args);
var newonly = args.options && args.options.newonly ? true : false;
console.log(newonly);
var timeout  = 600000;
var old_json = JSON.parse(fs.readFileSync("./jizos.geojson", 'utf8')).features;

function wikiurl_escape(url) {
    return url.replace(/ /g,"_").replace(/\(/g,"%28").replace(/\)/g,"%29");
}

function old_data_copy1(arr,type,old) {
    if (!old) old = [];
    return arr.map(function(item){
        var url    = 'https://commons.wikimedia.org/wiki/' + type + ':' + wikiurl_escape(item);
        var oldone = old.map(function(oldeach){
            return oldeach.properties != null ? oldeach.properties : oldeach;
        }).filter(function(oldeach){ 
            return wikiurl_escape(oldeach.url) == url;
        });
        return {
            "url" : url,
            "old" : oldone.length > 0 ? oldone[0] : null                
        };
    })
}

function old_data_copy2(page,res) {
    if (page.old != null) {
        page.description = Array.isArray(page.old.description) ? page.old.description[0] : page.old.description;
        if (page.old.title != null) {
            page.title   = Array.isArray(page.old.title)       ? page.old.title[0]       : page.old.title;
        }
    } else {
        page.description = res.description;
    }
    delete page.old;
}

function get_target(url, old) {
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
        return [driver, old];
    });
}

function scrape_category(args) {
    var driver = args[0];
    var old    = args[1];
    return Promise.all([
        driver.findElements(By.xpath('//div[contains(@class,"description")][contains(@class,"mw-content-ltr")][contains(@class,"ja")]|//div[@id="mw-content-text"]/*[1][name(.)="p"]'))
        .then(function(elems){
            return Promise.all(elems.map(function(elem) {
                return elem.getInnerHtml();
            }));
        })
        .then(function(descs){
            return descs.map(function(desc){
                return desc.replace(/[ ]*奈良市[ ]*/g,"");
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
        var rets = old_data_copy1(results[1],"Category",old);
        rets = rets.concat(old_data_copy1(results[2],"File",old));
        if (newonly) {
            rets = rets.filter(function(each,index){
                each.pushIndex = index;
                return each.old == null;
            });
        }

        return {
            "description" : results[0],
            "pages" : rets
        };
    });
}

function scrape_filepage(args) {
    var driver = args[0];
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
                return desc.replace(/[ ]*奈良市[ ]*/g,"");
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
            .then(scrape_filepage)
            .then(function(res){
                page.latlng    = res.latlng;               
                page.thumbnail = res.thumbnail;
                page.fullsize  = res.fullsize;
                old_data_copy2(page,res);
            }) :
            get_target(page.url,page.old ? page.old.files : null)
            .then(scrape_category)
            .then(load_each_page)
            .then(function(res){
                var lpages  = res.pages;
                var lls     = lpages.filter(function(val){
                    return val.latlng != void 0;
                });
                page.latlng = lls.reduce(function(prev,curr){
                    var latlng = curr.latlng;
                    delete curr.latlng;
                    return prev.map(function(val,i){
                        return val + latlng[i];
                    });
                },[0.0,0.0]).map(function(val){
                    return val / lls.length;
                });
                page.files  = lpages;
                old_data_copy2(page,res);
            });
    }))
    .then(function(){
        return target;
    });
}

get_target("https://commons.wikimedia.org/wiki/Category:Wayside_Jizos_in_Nara",old_json)
.then(scrape_category)
.then(load_each_page)
.then(function(target){
    var features = target.pages.map(function(source){
        var feature = {
            "type": "Feature",
            "geometry" : {
                "type" : "Point",
                "coordinates" : [source.latlng[1],source.latlng[0]]
            },
            "properties" : {
                "url" : source.url,
                "title" : source.title ? source.title : source.description,
                "description" : source.description
            }
        };
        var prop = feature.properties;
        if (source.files && source.files.length != 0) {
            prop.files = source.files;
            prop.thumbnail = source.files[0].thumbnail;
        } else {
            prop.thumbnail = source.thumbnail;
            prop.fullsize  = source.fullsize;
        }
        if (newonly) {
            feature.pushIndex = source.pushIndex;
        }

        return feature;
    });

    if (newonly) {
        features.forEach(function(each){
            old_json.splice(each.pushIndex,0,each);
            delete each.pushIndex;
        });
        features = old_json;
    }

    var geojson = {
        "type": "FeatureCollection",
        "features": features
    };

    var json = JSON.stringify(geojson, null, "  ");
    fs.writeFile('./jizos.geojson', json , function (err) {
        console.log(err);
    });
});
