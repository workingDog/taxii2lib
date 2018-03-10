import {TaxiiConnect, Server, Collections, Collection, Status} from './taxii2lib.js';

console.log("---> in testApp.js <---");

const testCollectionInfo = {
    "id": "34f8c42d-213a-480d-9046-0bd8a8f25680",
    "title": "Emerging Threats - Block Rules - Compromised IPs",
    "description": "A collection of blocking rule indicators from Emerging Threats. Pulled live from: https://rules.emergingthreats.net/blockrules/emerging-botcc.excluded",
    "can_read": true,
    "can_write": false,
    "media_types": ["application/vnd.oasis.stix+json"]
};

// the path to a taxii server
let taxiiPath = "https://test.freetaxii.com:8000";

// the CORS proxy to bypass the needed Access-Control-Allow-Origin response header from freetaxii
let corsPath = "https://cors-anywhere.herokuapp.com/" + taxiiPath;

// the connection
const conn = new TaxiiConnect(corsPath, "guest", "guest");

// setup the collection we want
const theCollection = new Collection(testCollectionInfo, corsPath+"/osint/", conn);

// get the collection information
theCollection.get().then(info => console.log("----> the collection info \n" + JSON.stringify(info)) );

// get the collection objects
theCollection.getObjects().then(bundle => {
    // the stix objects received in a bundle
    console.log("-----> the collection bundle \n" + JSON.stringify(bundle));
    // print all stix objects of the collection
    for (let stix of bundle.objects) console.log("-----> stix: " + JSON.stringify(stix));
    // print only the indicator objects
    for (let stix of bundle.objects) {
        if(stix.type == "indicator") console.log("=====> indicator stix: " + JSON.stringify(stix));
    }
});


