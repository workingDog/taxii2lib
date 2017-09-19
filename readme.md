## TAXII 2.0 client library in javascript

**taxii2lib.js** is a [Javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) library that 
provides a set of classes and methods for building Javascript clients to [TAXII 2.0](https://oasis-open.github.io/cti-documentation/)  servers.

[[1]](https://oasis-open.github.io/cti-documentation/) 
Trusted Automated Exchange of Intelligence Information (TAXII) is an application layer protocol 
used to exchange cyber threat intelligence (CTI) over HTTPS. 
TAXII enables organizations to share CTI by defining an API that aligns with common sharing models.
[TAXII 2.0 Specification](https://oasis-open.github.io/cti-documentation/) defines the TAXII RESTful API and its resources along with the requirements for TAXII Client and Server implementations. 

The aim of this library is to assist creating TAXII 2.0 clients in Javascript, using 
for example frameworks such as [bootstrap](http://getbootstrap.com/) and [react](https://facebook.github.io/react/). 


**taxii2lib.js** uses [asynchronous requests](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) 
to fetch TAXII 2.0 server resources. It has five classes, namely:

- *TaxiiConnect*, providing the async communications to the server.
- *Server*, endpoint for retrieving the discovery and api roots resources.
- *Collections*, endpoint for retrieving the list of collection resources. 
- *Collection*, endpoint for retrieving a collection resource and associated objects. 
- *Status*, endpoint for retrieving a status resources. 
 
### References
 
1) [TAXII 2.0 Specification](https://oasis-open.github.io/cti-documentation/)
 

### Usage

The following TAXII 2.0 API services are supported with these corresponding async methods:

- Server Discovery --> server.discovery()
- Get API Root Information --> server.api_roots()
- Get Collections --> collections.get() and collections.get(i)
- Get a Collection --> collection.get()
- Get Objects --> collection.getObjects(filter)
- Add Objects --> collection.addObject(bundle)
- Get an Object --> collection.getObject(obj_id, filter)
- Get Object Manifests --> collection.getManifest() and collection.getManifest(obj_id)
- Get Status --> status.get()

Example:

    // create the communication instance
    const conn = new TaxiiConnect("https://test.freetaxii.com:8000", "user-me", "my-password");
    // create a server endpoint
    const server = new Server("/taxii/", conn);
    // fetch the discovery info from the server 
    server.discovery().then(discovery => {
        console.log("----> Server discovery \n" + JSON.stringify(discovery));
    });
    // fetch the api roots info from the server
    server.api_roots().then(apiroots => {
        console.log("----> Server apiroots \n" + JSON.stringify(apiroots));
        apiroots.map(apiroot => {
            console.log("----> Server apiroots apiroot \n" + JSON.stringify(apiroot));
        });
    });

See the [TAXII 2.0 Specification](https://oasis-open.github.io/cti-documentation/) for the list 
of attributes of the TAXII 2.0 server responses.

Note the optional **filter** object passed to the methods collection.getObjects(filter) and 
collection.getObject(obj_id, filter) is of the form:

    {"type": ["incident","ttp","actor"]}
    {"id": "indicator--3600ad1b-fff1-4c98-bcc9-4de3bc2e2ffb"}
    {"added_after": "2016-02-01T00:00:01.000Z", "version": "2016-01-01T01:01:01.000Z"}
    {"type": "incident", "version": "2016-01-01T01:01:01.000Z"}

### Status
not finished, not tested.