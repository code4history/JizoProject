const fs = require('fs');

// Read the three source files
const images = JSON.parse(fs.readFileSync('images.geojson', 'utf8'));
const pois = JSON.parse(fs.readFileSync('pois.geojson', 'utf8'));
const books = JSON.parse(fs.readFileSync('books.geojson', 'utf8'));

// Create a map of images by poi ID
const imagesByPoi = {};
images.features.forEach(image => {
  const poiId = image.properties.poi;
  if (!imagesByPoi[poiId]) {
    imagesByPoi[poiId] = [];
  }
  imagesByPoi[poiId].push(image.properties);
});

// Create a map of books (they don't have direct relationships in the source files)
// We'll need to check the existing tatebayashi_stones.geojson to understand book relationships
const booksMap = {};
books.features.forEach(book => {
  booksMap[book.properties.fid] = book.properties;
});

// Read the existing jizo_project.geojson to understand book relationships
const existingData = JSON.parse(fs.readFileSync('jizo_project.geojson', 'utf8'));
const bookRelationships = {};
existingData.features.forEach(feature => {
  if (feature.properties.books && feature.properties.books.length > 0) {
    bookRelationships[feature.properties.fid] = feature.properties.books;
  }
});

// Create the merged GeoJSON
const merged = {
  type: "FeatureCollection",
  name: "pois",
  crs: pois.crs,
  features: []
};

// Process each POI
pois.features.forEach(poi => {
  const feature = JSON.parse(JSON.stringify(poi)); // Deep clone
  const poiId = poi.properties.fid;
  
  // Get images for this POI
  const poiImages = imagesByPoi[poiId] || [];
  
  // Find primary image
  const primaryImageId = poi.properties.primary_image;
  let primaryImage = null;
  
  if (primaryImageId && poiImages.length > 0) {
    // Find the image with matching fid
    primaryImage = poiImages.find(img => img.fid === primaryImageId) || poiImages[0];
  }
  
  // Set primary image paths (using CloudFlare URLs)
  if (primaryImage) {
    feature.properties.path = primaryImage.path;
    feature.properties.mid_thumbs = primaryImage.mid_thumbs;
    feature.properties.small_thumbs = primaryImage.small_thumbs;
  } else {
    feature.properties.path = "";
    feature.properties.mid_thumbs = "";
    feature.properties.small_thumbs = "";
  }
  
  // Add images array (with CloudFlare URLs)
  feature.properties.images = poiImages.map(img => ({
    description: img.description || "",
    path: img.path,
    shooting_date: img.shooting_date || "",
    shooter: img.shooter || "",
    mid_thumbs: img.mid_thumbs,
    small_thumbs: img.small_thumbs,
    cloudflare_id: img.cloudflare_id,
    upload_time: img.upload_time,
    original_path: img.original_path
  }));
  
  // Add books array (preserve existing relationships)
  feature.properties.books = bookRelationships[poiId] || [];
  
  merged.features.push(feature);
});

// Write the merged file
fs.writeFileSync('jizo_project.geojson', JSON.stringify(merged, null, 2));
console.log('Successfully merged GeoJSON files with CloudFlare image URLs');
console.log(`Total features: ${merged.features.length}`);
console.log(`Features with images: ${merged.features.filter(f => f.properties.images.length > 0).length}`);
console.log(`Features with books: ${merged.features.filter(f => f.properties.books.length > 0).length}`);