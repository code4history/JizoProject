import { geojson } from "flatgeobuf";
import { readFileSync, writeFileSync }  from 'fs';

const gj = JSON.parse(readFileSync("./jizo_project.geojson"));

const flatgeobuf = geojson.serialize(gj);
console.log(`Serialized input GeoJson into FlatGeobuf (${flatgeobuf.length} bytes)`);

writeFileSync('./jizo_project.fgb', flatgeobuf);
const buffer = readFileSync('./jizo_project.fgb');
const actual = geojson.deserialize(new Uint8Array(buffer));

console.log('FlatGeobuf deserialized back into GeoJSON:')
writeFileSync('./jizo_project_rt.geojson', JSON.stringify(actual, undefined, 1));