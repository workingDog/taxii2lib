
/**
 * TAXII 2.0 Javascript client library.
 * 
 * reference: https://oasis-open.github.io/cti-documentation/
 * 
 * Author: R. Wathelet, September 2017.
 * Version: 0.1
 */

"use strict";
/* 
 * Provide for connecting to a TAXII 2.0 server using asynchronous communication.
 */
class TaxiiConnect {

    /**
     * For connecting to a Taxii2 server.
     * @param {type} url - the base url of the Taxii2 server, e.g. https://example.com/
     * @param {type} user - the user name required for authentication.
     * @param {type} password - the user password required for authentication.
     * @returns {TaxiiConnect} 
     */
    constructor(url, user, password) {
        this.baseURL = TaxiiConnect.withoutLastSlash(url);
        this.user = user;
        this.password = password;

        this.headers = new Headers({
            'Accept': 'application/vnd.oasis.taxii+json',
            'version': '2.0',
            'Content-Type': 'application/vnd.oasis.taxii+json',
            'Authorization': 'Basic ' + btoa(this.user + ":" + this.password)
        });

        this.getConfig = {
            'method': 'get',
            'headers': this.headers
        };

        this.postConfig = {
            'method': 'post',
            'headers': this.headers
        };
    }

    /**
     * send an async request (get or post) to the taxii2 server.
     * @param {type} fullPath - the full path to connect to.
     * @param {type} config - the request configuration, see getConfig and postConfig
     * @returns {unresolved} - the promise response result in json.
     */
    async asyncFetch(fullPath, config) {
        let results = await (await (fetch(fullPath, config).then(res => {
            return res.json();
        }).catch(err => {
            console.log('====> asyncFetch error: ', err);
        })));
        return results;
    }

    /**
     * send a get async request to the taxii2 server.
     * @param {type} fullPath - the full path to connect to.
     * @param {type} options - an option object of the form: { "cache": {}, "flag": false }
     * @returns {unresolved}
     */
    async fetchThis(fullPath, options) {
        if (!options.flag) {
            options.cache = await (this.asyncFetch(fullPath, this.getConfig));
            options.flag = true;
            return options.cache;
        } else {
            return options.cache;
        }
    }

    // want the url to be without the last slash
    static withoutLastSlash(aUrl) {
        let theUrl = aUrl;
        if (aUrl.substr(-1) === '/') {
            theUrl = aUrl.substr(0, aUrl.length - 1);
        }
        return theUrl;
    }

    // want the url to be with the last slash
    static withLastSlash(aUrl) {
        let theUrl = aUrl;
        if (aUrl.substr(-1) !== '/') {
            theUrl = aUrl + "/";
        }
        return theUrl;
    }
}

/**
 * Server encapsulates a discovery and api roots endpoints.
 */
class Server {

    /**
     * a TAXII Server endpoint representation.
     * @param {type} path - the path to the server to retrieve the discovery endpoint, e.g. "/taxii/"
     * @param {type} conn - a TaxiiConnection class instance.
     */
    constructor(path, conn) {
        this.path = TaxiiConnect.withLastSlash(path);
        this.conn = conn;
        // cache represents the cached results and flag determines if it needs a re-fetch 
        this.disOptions = {"cache": {}, "flag": false};
        this.apiOptions = {"cache": [], "flag": false};
    }

    /**
     * determine if the obj is empty, {}
     * @param {type} obj - the object to test
     * @returns {Boolean} - true if empty else false
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    /**
     * reset the options flags so that a server request will be required 
     * to get the results, rather than from cache.
     */
    invalidate() {
        this.disOptions.flag = false;
        this.apiOptions.flag = false;
    }

    /**
     * to obtain information about a TAXII Server and get a list of API Roots. 
     * @returns {unresolved}
     */
    async discovery() {
        return this.conn.fetchThis(this.conn.baseURL + this.path, this.disOptions);
    }

    /**
     * API Roots are logical groupings of TAXII Channels, Collections, and related functionality.
     * Each API Root contains a set of Endpoints that a TAXII Client contacts in order to interact with the TAXII Server.
     * This returns the api roots information objects, not the string url.
     * @returns {Server@call;discovery@call;then} the api roots information objects
     */
    async api_roots() {
        return this.discovery().then(discovery => {
            return this._getApiRoots(discovery);
        });
    }

    /**
     * private function to retrieve the api roots
     * @param {type} discovery - discovery object
     * @returns {Array} of api root objects
     */
    async _getApiRoots(discovery) {
        if (!this.apiOptions.flag) {
            // clear the cache
            this.apiOptions.cache = [];
            // fetch all the api_roots url in parallel
            const allPromises = discovery.api_roots.map(async url => {
                try {
                    return this.conn.asyncFetch(url, this.conn.getConfig);
                } catch (err) {
                    console.log("----> Server could not fetch api_root url: " + url);
                }
            });
            // add the promises results to the array
            for (const aPromise of allPromises) {
                this.apiOptions.cache.push(await aPromise);
            }
            // remove the undefined and empty elements
            this.apiOptions.cache = this.apiOptions.cache.filter(element => {
                return (element !== undefined && !Server.isEmpty(element));
            });
            this.apiOptions.flag = true;
            return this.apiOptions.cache;
        } else {
            return this.apiOptions.cache;
        }
    }

}

/**
 * Collections resource endpoint.
 * A TAXII Collections is an interface to a logical repository of CTI objects
 * provided by a TAXII Server and is used by TAXII Clients to send information 
 * to the TAXII Server or request information from the TAXII Server.
 * A TAXII Server can host multiple Collections per API Root, and Collections 
 * are used to exchange information in a request–response manner. 
 */
class Collections {

    /**
     * A TAXII Collections for a specific api root endpoint.
     * The collections resource is a simple wrapper around a list of collection resources.
     * @param {type} api_root_path - the full path to the desired api root
     * @param {type} conn - a TaxiiConnection class instance.
     */
    constructor(api_root_path, conn) {
        this.api_root_path = TaxiiConnect.withLastSlash(api_root_path);
        this.conn = conn;
        // cache represents the cached results and flag determines if it needs a re-fetch 
        this.options = {"cache": {}, "flag": false};
    }

    /**
     * reset the options flags so that a server request will be required 
     * to get the results, rather than from cache.
     */
    invalidate() {
        this.options.flag = false;
    }

    /**
     * provides information about the Collections hosted under this API Root.
     * @returns {Array} a list of collection info if there "index" is undefined.
     *
     * access a specific collection given an index into the collections array.
     *
     * @param {type} index - of the desired collection or undefined
     * @returns {Array|Collections@call;collections@call;then}
     */
    async get(index) {
        if (typeof index === "undefined") {
            // return a list of collection info
            await this.conn.fetchThis(this.api_root_path + "collections/", this.options);
            return this.options.cache.collections;
        } else {
            if (Number.isInteger(index)) {
                // return a specific collection info
                if (!this.collectionsFlag) {
                    return this.get().then(cols => {
                        return this.options.cache.collections[index];
                    });
                } else {
                    return this.options.cache.collections[index];
                }
            }
        }
    }

}

/**
 * A Collection resource endpoint.
 */
class Collection {

    /**
     * Collection resource endpoint.
     * @param {type} collectionInfo - the collection resource info of this endpoint.
     * @param {type} api_root_path - the full path to the desired api root
     * @param {type} conn - a TaxiiConnection class instance.
     */
    constructor(collectionInfo, api_root_path, conn) {
        this.collectionInfo = collectionInfo;
        this.api_root_path = TaxiiConnect.withLastSlash(api_root_path);
        this.conn = conn;
        // construct the path
        this.path = this.api_root_path + "collections/" + collectionInfo.id;
        // cache represents the cached results and flag determines if it needs a re-fetch 
        this.colOptions = {"cache": {}, "flag": false};
        this.objsOptions = {"cache": {}, "flag": false};
        this.objOptions = {"cache": {}, "flag": false};
        this.manOptions = {"cache": {}, "flag": false};
    }

    /**
     * reset the options flags so that a server request will be required 
     * to get the desired results, rather than from cache.
     */
    invalidate() {
        this.colOptions.flag = false;
        this.objsOptions.flag = false;
        this.objOptions.flag = false;
        this.manOptions.flag = false;
    }

    /**
     * check that the collection allows reading, if true then return the function passed in
     * else log an error
     * @param {func} - the function to return 
     */
    ifCanRead(func) {
        if (this.collectionInfo.can_read) {
            return func;
        } else {
            console.log("this collection does not allow reading: \n" + JSON.stringify(this.collectionInfo));
        }
    }

    /**
     * check that the collection allows writing, if true then return the function passed in
     * else log an error
     * @param {func} - the function to return 
     */
    ifCanWrite(func) {
        if (this.collectionInfo.can_write) {
            return func;
        } else {
            console.log("this collection does not allow writing: \n" + JSON.stringify(this.collectionInfo));
        }
    }

    /**
     * retrieves the Collection.
     */
    async get() {
        return this.ifCanRead(this.conn.fetchThis(this.path, this.colOptions));
    }

    /**
     * retrieves STIX2 bundle from this Collection.
     */
    async getObjects() {
        return this.ifCanRead(this.conn.fetchThis(this.path + "/objects", this.objsOptions));
    }

    /**
     * returns a specific STIX2 object from this Collection objects bundle.
     * obj_id must be a STIX object id.
     */
    async getObject(obj_id) {
        let result = await (await (this.ifCanRead(this.conn.fetchThis(this.path + "/objects/" + obj_id, this.objOptions).then(bundle => {
            return bundle.objects.find(obj => obj.id === obj_id);
        }))));
        return result;
    }

    /**
     * adds a STIX2 bundle to this Collection objects.
     * returns a Taxii2 status object
     */
    async addObject(bundle) {
        return this.ifCanWrite(this.conn.asyncFetch(this.path + "/objects", this.conn.postConfig));
    }

    /**
     * retrieves a manifest about objects from this Collection
     * returns objects, the list of manifest-entry if obj_id is undefined
     * or
     * retrieves the manifest about a specific object (obj_id) from this Collection
     * returns specific manifest-entry
     */
    async getManifest(obj_id) {
        if (typeof obj_id === "undefined") {
            // return the list of manifest-entry
            this.ifCanRead(await this.conn.fetchThis(this.path + "/manifest", this.manOptions));
            return this.manOptions.cache.objects;
        } else {
            // return the specified manifest-entry object
            return await (this.getManifest().then(objects => {
                return objects.find(obj => obj.id === obj_id);
            }));
        }
    }

}

    