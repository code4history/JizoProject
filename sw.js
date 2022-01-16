importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.2/workbox-sw.js');

const accessToken =
    "pk.eyJ1IjoicmVraXNoaWtva3VkbyIsImEiOiJjazRoMmF3dncwODU2M2ttdzI2aDVqYXVwIn0.8Hb9sekgjfck6Setxk5uVg";
const style = "mapbox://styles/moritoru/ck4s6w8bd0sb51cpp9vn7ztty";

workbox.core.skipWaiting();

workbox.core.clientsClaim();

workbox.navigationPreload.enable();

// ------------------  runtime caching starts ---------------------
// frequently updated resources
workbox.routing.registerRoute(
  new RegExp('jizo_project.geojson'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'geojson_data',
  }),
  'GET'
);

// splash icon images
workbox.routing.registerRoute(
  new RegExp('(?:icons|assets|images|mid_thumbs|small_thumbs)/.*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'icons',
    maxEntries: 50
  })
);

// manifest
workbox.routing.registerRoute(
  new RegExp('manifest.json'),
  new workbox.strategies.StaleWhileRevalidate()
);

// ------------------  precaching the assets ---------------------
workbox.precaching.precacheAndRoute([
  // html
  {'revision':'2022011602', 'url':'index.html'},
  // js
  {'revision':'20220113', 'url':'https://unpkg.com/leaflet@1.6.0/dist/leaflet-src.js'},
  {'revision':'20220113', 'url':'https://api.tiles.mapbox.com/mapbox-gl-js/v1.5.0/mapbox-gl.js'},
  {'revision':'20220116', 'url':'src/leaflet-mapbox-gl.js'},
  {'revision':'20220113', 'url':'https://unpkg.com/quyuanjs@0.0.7/dist/quyuan.min.js'},
  {'revision':'2022011602', 'url':'src/popup_template.js'},
  {'revision':'2022011602', 'url':'src/icon_template.js'},
  {'revision':'20220116', 'url':'src/twitter_Intent_url.js'},
  {'revision':'20220116', 'url':'src/oms.min.js'},
  {'revision':'20220116', 'url':'src/L.Control.Locate.js'},
  {'revision':'2022011602', 'url':'src/main.js'},
  {'revision':'20220116', 'url':'src/twitter-text-3.1.0.min.js'},
  // css
  {'revision':'20220113', 'url':'https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.3/gh-fork-ribbon.min.css'},
  {'revision':'20220113', 'url':'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'},
  {'revision':'20220113', 'url':'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css'},
  {'revision':'20220113', 'url':'https://api.tiles.mapbox.com/mapbox-gl-js/v1.5.0/mapbox-gl.css'},
  {'revision':'20220116', 'url':'src/L.Control.Locate.min.css'},
  {'revision':'2022011602', 'url':'src/style.css'},
  // other
  {'revision':'20220113', 'url':'manifest.json'},
  // image
  {'revision':'2022011602', 'url':'assets/hotoke.png'},
  {'revision':'2022011602', 'url':'assets/hotoke_sepia.png'},
  {'revision':'2022011602', 'url':'assets/hotoke_surprise.png'},
  {'revision':'2022011602', 'url':'assets/jinja.png'},
  {'revision':'2022011602', 'url':'assets/jinja_sepia.png'},
  {'revision':'2022011602', 'url':'assets/jinja_surprise.png'},
  {'revision':'2022011602', 'url':'assets/jizo.png'},
  {'revision':'2022011602', 'url':'assets/jizo_sepia.png'},
  {'revision':'2022011602', 'url':'assets/jizo_surprise.png'},
  {'revision':'2022011602', 'url':'assets/new.png'}
]);