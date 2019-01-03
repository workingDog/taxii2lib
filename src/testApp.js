import {TaxiiConnect, Server, Collections, Collection, Status} from './taxii2lib.js';

console.log("---> in testApp.js <---");

const testCollectionInfo = {
  "id" : "107",
  "title" : "Phish Tank",
  "can_read" : true,
  "can_write" : false
};

// the path to a taxii server
let taxiiPath = "https://limo.anomali.com/api/v1/taxii2";

// HACK. The CORS proxy to bypass the needed Access-Control-Allow-Origin response header from the server
let corsPath = "https://cors-anywhere.herokuapp.com/" + taxiiPath;

// the connection
const conn = new TaxiiConnect(corsPath, "guest", "guest");

// setup the collection endpoint we want
const theCollection = new Collection(testCollectionInfo, corsPath + "/feeds/", conn);

// get the collection information
theCollection.get().then(info => console.log("----> the collection info \n" + JSON.stringify(info)))
        .catch(err => { console.log("-----> get() error: " + err); } );

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
}).catch(err => { console.log("-----> getObjects() error: " + err); } );

// get the collection objects with a filter
theCollection.getObjects({"type": "indicator"}).then(bundle => {
    // print all stix objects returned
    for (let stix of bundle.objects) console.log("++++++> stix: " + JSON.stringify(stix));
}).catch(err => { console.log("-----> getObjects(filter) error: " + err); } );




