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
    'index.html',
    // js
    'https://unpkg.com/leaflet@1.6.0/dist/leaflet-src.js',
    'assets/L.Control.Locate.js',
    'assets/geojson-popup.js',
    // css
    'https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.3/gh-fork-ribbon.min.css',
    'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css',
    'assets/L.Control.Locate.min.css',
    'assets/style.css',
    // other
    'manifest.json'
]);