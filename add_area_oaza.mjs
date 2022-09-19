import fs from "node:fs"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"

const areas = JSON.parse(fs.readFileSync("./area.geojson", 'utf8'))
const pois = JSON.parse(fs.readFileSync("./pois.geojson", 'utf8'))

const poi_features = pois.features
const area_features = areas.features

poi_features.forEach((poi) => {
  const matched = []
  area_features.forEach((area) => {
    if (booleanPointInPolygon(poi, area)) {
      matched.push(area.properties)
    }
  })
  if (matched.length == 0) {
    console.log("No match")
    console.log(poi)
  } else if (matched.length > 1) {
    console.log("Multiple")
    console.log(poi)
  } else {
    poi.properties.oaza = matched[0].town
    poi.properties.area = matched[0].area
  }
})

fs.writeFileSync("./pois_update.geojson", JSON.stringify(pois, null, 2), 'utf8')