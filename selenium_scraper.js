#!/usr/bin/env node

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until,
    fs = require('fs'),
    argv = require('argv');

var targets_master = {
    "jizo"    : {"type":"jizo",   "category":"Wayside_Jizos_in_Nara",   "default":"地蔵"},
    "shrine"  : {"type":"shrine", "category":"Wayside_Shrines_in_Nara", "default":"小祠"},
    "buddha"  : {"type":"buddha", "category":"Wayside_Buddhas_in_Nara", "default":"石仏等"}
};
var targets = [];

argv.option([{
    name: 'newonly',
    short: 'n',
    type : 'boolean',
    description : '新しい要素だけを追加します',
    example: "'selenium_scraper.js --newonly' or 'selenium_scraper.js -n'"
},{
    name: 'feedback',
    short: 'f',
    type : 'string',
    description : 'uMapからのフィードバックを適用します。フィードバック対象のgeojsonファイルを指定します。',
    example: "'selenium_scraper.js --feedback feedback.geojson' or 'selenium_scraper.js -f feedback.geojson'"
},{
    name: 'jizo',
    short: 'j',
    type : 'boolean',
    description : '地蔵を編集します。',
    example: "'selenium_scraper.js --jizo' or 'selenium_scraper.js -j'"
},{
    name: 'shrine',
    short: 's',
    type : 'boolean',
    description : '小祠を編集します。',
    example: "'selenium_scraper.js --shrine' or 'selenium_scraper.js -s'"
},{
    name: 'buddha',
    short: 'b',
    type : 'boolean',
    description : '石仏を編集します。',
    example: "'selenium_scraper.js --buddha' or 'selenium_scraper.js -b'"
}]);

var driver = null;
driver = new webdriver.Builder()
        .forBrowser('chrome')
        .usingServer('http://localhost:4444/wd/hub')
        .build();

var args = argv.run();
var newonly = args.options && args.options.newonly ? true : false;
var fb_file = args.options && args.options.feedback ? args.options.feedback : false;
var target  = args.options && args.options.jizo   ? targets_master.jizo   :
              args.options && args.options.shrine ? targets_master.shrine :
              args.options && args.options.buddha ? targets_master.buddha : 
              {"type":"jizo_project"};
var jsonfile = "./" + target.type + "s.geojson"
var timeout  = 600000;
var old_json = [];
try {
    old_json = JSON.parse(fs.readFileSync(jsonfile, 'utf8')).features;
} catch(e) {}
var feedback = fb_file ? JSON.parse(fs.readFileSync(fb_file, 'utf8')).features.map(function(item){
    if (item.properties.files && typeof item.properties.files === 'string') {
        item.properties.files = JSON.parse(item.properties.files);
    }
    return item;
}) : false;
var login_info = null;
try {
    login_info = JSON.parse(fs.readFileSync("./login.json", 'utf8'));
} catch(e) {}
var skip_flag = feedback || target.type == "jizo_project";

function wikiurl_escape(url) {
    return url.replace(/ /g,"_").replace(/\(/g,"%28").replace(/\)/g,"%29");
}

function old_data_copy1(arr,type,old) {
    if (!old) old = [];
    return arr.map(function(item){
        var url    = 'https://commons.wikimedia.org/wiki/' + type + ':' + wikiurl_escape(item);
        var oldone = old.map(function(oldeach){
            var prop = oldeach.properties != null ? oldeach.properties : oldeach;
            prop.latlng = oldeach.geomety != null ? [oldeach.geomety.coordinates[1],oldeach.geomety.coordinates[0]] : null;
            return prop;
        }).filter(function(oldeach){ 
            return wikiurl_escape(oldeach.url) == url;
        });
        return {
            "url" : url,
            "old" : oldone.length > 0 ? oldone[0] : null                
        };
    })
}

function old_title_desc_copy(page,res) {
    if (page.old != null) {
        page.description = Array.isArray(page.old.description) ? page.old.description[0] : page.old.description;
        if (page.old.title != null) {
            page.title   = Array.isArray(page.old.title)       ? page.old.title[0]       : page.old.title;
        }
        if (page.old.wikipedia != null) {
            page.wikipedia = page.old.wikipedia;
        }
        if (page.old.monumento != null) {
            page.monumento = page.old.monumento;
        }
        if (page.old.refs != null) {
            page.refs = page.old.refs;
        }
        page.latlng = (page.old.latlng != null) ? page.old.latlng : res.latlng;
    } else {
        page.description = res.description;
        page.latlng      = res.latlng;
    }
    delete page.old;
}

function get_target(url, old) {
    if (skip_flag) return Promise.all([]);
    driver.get(url + "?lang=ja");
    return driver.wait(function(){
        return driver.findElements(By.xpath('//h1[@id="firstHeading"][@class="firstHeading"]'))
        .then(function(elems){
            if (elems.length == 0) return false;
            return true;
        });
    }, timeout)
    .then(function(){
        return old;
    });
}

function scrape_category(old) {
    if (skip_flag) return Promise.all([]);
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

function scrape_filepage() {
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
        var ret = {};
        if (arr[0]) ret["latlng"]    = arr[0];
        if (arr[1]) ret["thumbnail"] = arr[1];
        if (arr[2]) ret["fullsize"]  = arr[2];
        if (arr[3]) ret["description"] = arr[3];
        return ret;
    });
}

function sort_key(target) {
    var order = [
        "type",
        "features",
        "geometry",
        "coordinates",
        "properties",
        "url",
        "title",
        "description",
        "thumbnail",
        "fullsize",
        "wikipedia",
        "monumento",
        "refs",
        "files"
    ];
    var ret = {};
    order.forEach(function(key){
        if (target[key] !== void(0) && target[key] !== null) {
            ret[key] = (key == "geometry" || key == "properties") ? sort_key(target[key]) :
                (key == "files" || key == "features") ? target[key].map(function(item){ 
                    return sort_key(item); 
                }) :
                ((key == "title" || key == "description") && Array.isArray(target[key])) ? 
                    target[key][0] :
                target[key];
        }
    });

    return ret;
}

function load_each_page(target) {
    if (skip_flag) return Promise.all([]);
    return Promise.all(target.pages.map(function(page){
        return page.url.includes('wiki/File:') ?
            get_target(page.url)
            .then(scrape_filepage)
            .then(function(res){              
                page.thumbnail = res.thumbnail;
                page.fullsize  = res.fullsize;
                old_title_desc_copy(page,res);
            }) :
            get_target(page.url,page.old ? page.old.files : null)
            .then(scrape_category)
            .then(load_each_page)
            .then(function(res){
                var lpages  = res.pages;
                var lls     = lpages.filter(function(val){
                    return val.latlng != void 0;
                });
                res.latlng = lls.reduce(function(prev,curr){
                    var latlng = curr.latlng;
                    delete curr.latlng;
                    return prev.map(function(val,i){
                        return val + latlng[i];
                    });
                },[0.0,0.0]).map(function(val){
                    return val / lls.length;
                });
                page.files  = lpages;
                old_title_desc_copy(page,res);
            });
    }))
    .then(function(){
        return target;
    });
}

get_target("https://commons.wikimedia.org/wiki/Category:" + target.category,old_json)
.then(scrape_category)
.then(load_each_page)
.then(function(arg){
    driver.close();
    var features = feedback ? old_json : 
        skip_flag ? ["jizo","buddha","shrine"].reduce(function(prev,curr) {
            var json = [];
            try {
                json = JSON.parse(fs.readFileSync("./" + curr + "s.geojson", 'utf8')).features;
            } catch(e) {}
            return prev.concat(json);
        },[]) :
        arg.pages.map(function(source){
            var feature = {
                "type": "Feature",
                "geometry" : {
                    "type" : "Point",
                    "coordinates" : [source.latlng[1],source.latlng[0]]
                },
                "properties" : {
                    "type"  : target.default,
                    "url"   : source.url,
                    "title" : source.title ? source.title : source.description,
                    "description" : source.description,
                    "wikipedia" : source.wikipedia,
                    "monumento" : source.monumento,
                    "refs" : source.refs
                }
            };
            var prop = feature.properties;
            if (source.files && source.files.length != 0) {
                prop.files = source.files;
                for (var i = 0; i < source.files.length; i++) {
                    if (!source.files[i].thumbnail.match(/inside/i)) {
                        prop.thumbnail = source.files[i].thumbnail;
                        break;
                    }
                }
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
        features = old_json;//.map(function(item){ item.properties.type = target.default; return item; });
    } else if (feedback) {
        var buffer = [];
        features.forEach(function(each, index) {
            var target = feedback.filter(function(tgt){
                return tgt.properties.url == each.properties.url;
            }).reduce(function(prev,curr){
                return prev == each ? curr : prev;
            },each);
            buffer.push({
                "type" : target.type,
                "geometry" : target.geometry,
                "properties" : target.properties
            });
        });
        features = buffer;
    }

    var geojson = sort_key({
        "type": "FeatureCollection",
        "features": features.filter(function(val){ return !isNaN(val.geometry.coordinates[0]); })
    });

    var json = JSON.stringify(geojson, null, "  ");

    fs.writeFile(jsonfile, json , function (err) {
        if (err) console.log(err);
    });
});
