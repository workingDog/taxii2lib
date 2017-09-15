
import {TaxiiConnect, Server, Collections, Collection, Status} from './taxii2lib.js';

console.log("---> in testApp.js <---");

const testBundle = {
    "type": "bundle",
    "id": "bundle-1",
    "spec_version": "2.0",
    "objects": []
};

const testCollectionInfo = {
    "id": "9cfa669c-ee94-4ece-afd2-f8edac37d8fd",
    "title": "Emerging Threats - Block Rules - Compromised IPs",
    "description": "A collection of blocking rule indicators from Emerging Threats. Pulled live from: https://rules.emergingthreats.net/blockrules/emerging-botcc.excluded",
    "can_read": true,
    "can_write": false,
    "media_types": ["application/vnd.oasis.stix+json"]
};

// ----------------------------------------------------------------------------------------

// the url should be without the last slash, if present the url will be used without it internally.
const conn = new TaxiiConnect("https://test.freetaxii.com:8000", "user-me", "user-password");
// ----------------------------------------------------------------------------------------

// make sure the path starts and ends with a "/"
const server = new Server("/taxii/", conn);


server.discovery().then(discovery => {
    console.log("----> Server discovery \n" + JSON.stringify(discovery));

    console.log("----> Server discovery.title \n" + discovery.title);

    // get the api roots url
    discovery.api_roots.map(apiroot =>  {
         console.log("----> Server discovery.api_roots apiroot \n" + JSON.stringify(apiroot));
         // create a collection (endpoint) given an api root url
         const theCollection = new Collection(testCollectionInfo, apiroot, conn);
         console.log("----> Server theCollection apiroot = " +  apiroot);
         // fetch this particular collection info
         theCollection.get().then(info => {
            console.log("----> Server theCollection.get() \n" + JSON.stringify(info));
         });
    });

    server.api_roots().then(apiroots => {
        console.log("----> Server apiroots \n" + JSON.stringify(apiroots));
        apiroots.map(apiroot => {
            console.log("----> Server apiroots apiroot \n" + JSON.stringify(apiroot));
        });
    });

});

server.api_roots().then(apiroots => {
    console.log("----> Server apiroots \n" + JSON.stringify(apiroots));
    apiroots.map(apiroot => {
        console.log("----> Server apiroots apiroot \n" + JSON.stringify(apiroot));
    });
});

// ----------------------------------------------------------------------------------------

const theCollection = new Collection(testCollectionInfo, "https://test.freetaxii.com:8000/api1/", conn);

theCollection.get().then(info => {
    console.log("----> theCollection.get() \n" + JSON.stringify(info));
});

theCollection.getObjects().then(bundle => {
    console.log("----> theCollection.getObjects() \n" + JSON.stringify(bundle));
});

theCollection.getObject("indicator--09303e92-608b-4b19-b453-109b170f17d3").then(stix => {
    console.log("----> theCollection.getObject(id) \n" + JSON.stringify(stix));
});

//theCollection.addObject(testBundle).then(status => {
//    console.log("---->  theCollection.addObject() \n" + JSON.stringify(status));
//});

//theCollection.getManifest().then(objList => {
//    console.log("----> theCollection.getManifest() \n" + JSON.stringify(objList));
//    objList.map(entry => {
//        console.log("----> theCollection manifest entry \n" + JSON.stringify(entry));
//    });
//    console.log("----> theCollection manifest objList[0] \n" + JSON.stringify(objList[0]));
//});
//
//theCollection.getManifest("indicator--ef0b28e1-308c-4a30-8770-9b4851b260a5").then(entry => {
//    console.log("----> theCollection.getManifestEntry() \n" + JSON.stringify(entry));
//});

// ----------------------------------------------------------------------------------------

const theCollections = new Collections("https://test.freetaxii.com:8000/api1/", conn);

theCollections.get().then(collections => {
    console.log("----> collections \n" + JSON.stringify(collections));
    collections.map(collection => {
        console.log("----> collections collection \n" + JSON.stringify(collection));
    });
    console.log("----> collections[0] \n" + JSON.stringify(collections[0]));
});

theCollections.get(0).then(collection => {
    console.log("----> theCollections.get(0) \n" + JSON.stringify(collection));
});

// ----------------------------------------------------------------------------------------
//
//const theStatus = new Status("https://example.com/api1", "2d086da7-4bdc-4f91-900e-d77486753710", conn);
//
//theStatus.get().then(status => {
//    console.log("----> theStatus.get() \n" + JSON.stringify(status));
//});

// ----------------------------------------------------------------------------------------

