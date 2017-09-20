
/* global encodeURIComponent, fetch */

/**
 * TAXII 2.0 Javascript client library.
 * 
 * reference: https://oasis-open.github.io/cti-documentation/
 * 
 * Author: R. Wathelet, September 2017.
 * Version: 0.1
 */

/* 
 * Provide for connecting to a TAXII 2.0 server using asynchronous communication.
 */
export class TaxiiConnect {

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
        this.hash = btoa(this.user + ":" + this.password);

        this.headers = new Headers({
            'Accept': 'application/vnd.oasis.taxii+json',
            'version': '2.0',
            'Authorization': 'Basic ' + this.hash
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
     * @param {type} path - the full path to connect to.
     * @param {type} config - the request configuration, see getConfig and postConfig
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     * @returns {unresolved} - the promise response result in json.
     */
    async asyncFetch(path, config, filter) {
        let fullPath = (filter === undefined) ? path : path + "?" + TaxiiConnect.asQueryString(filter);
        let results = await (await (fetch(fullPath, config).then(res => {
            return res.json();
        }).catch(err => {
            console.log('====> asyncFetch error: ', err);
        })));
        return results;
    }

    /**
     * send a get async request to the taxii2 server.
     *
     * The response is passed to the cache of the options, and
     * the options flag is set to true if a server request was performed.
     * Otherwise if the options.flag is true, the cached response (options.cache) is returned and
     * no server request is performed.
     * To force a server request used invalidate first, e.g server.invalidate()
     *
     * @param {type} path - the path to connect to.
     * @param {type} options - an option object of the form: { "cache": {}, "flag": false }
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     * @returns {unresolved}
     */
    async fetchThis(path, options, filter) {
        if (!options.flag) {
            options.cache = await (this.asyncFetch(path, this.getConfig, filter));
            options.flag = true;
            return options.cache;
        } else {
            return options.cache;
        }
    }

    // want the url to be without the last slash
    static withoutLastSlash(aUrl) {
        return (aUrl.substr(-1) === '/') ? aUrl.substr(0, aUrl.length - 1) : aUrl;
    }

    // want the url to be with the last slash
    static withLastSlash(aUrl) {
        return (aUrl.substr(-1) === '/') ? aUrl : aUrl + "/";
    }

    // convert the filter object into a query string
    static asQueryString(filter) {
        var esc = encodeURIComponent;
        var query = Object.keys(filter)
                .map(k => {
                    let value = (k === "added_after") ? k : "match[" + k + "]";
                    return esc(value) + '=' + esc(filter[k]);
                })
                .join('&');
        return query;
    }
}

/**
 * Server encapsulates a discovery and api roots endpoints.
 */
export class Server {

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
                    console.log("----> in Server could not fetch api_root url: " + url);
                }
            });
            // add the promises results to the array
            for (const aPromise of allPromises) {
                this.apiOptions.cache.push(await aPromise);
            }
            // remove the undefined and empty elements, i.e. those we could not connect to.
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
export class Collections {

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
     * @returns {Array} a list of collection info if there is no "index".
     *
     * access a specific collection given an index into the collections array.
     *
     * @param {type} index - of the desired collection info or undefined for all collections info
     * @returns {Array|Collections@call;collections@call;then}
     */
    async get(index) {
        if (typeof index === "undefined") {
            // return a list of collection info
            await this.conn.fetchThis(this.api_root_path + "collections/", this.options);
            return this.options.cache.collections;
        } else {
            if (Number.isInteger(index) && index >= 0) {
                // return a specific collection info
                if (!this.collectionsFlag) {
                    return this.get().then(cols => {
                        if (index < this.options.cache.collections.length) {
                            return this.options.cache.collections[index];
                        } else {
                            console.log("----> in Collections get(index) invalid index value: " + index);
                        }
                    });
                } else {
                    if (index < this.options.cache.collections.length) {
                        return this.options.cache.collections[index];
                    } else {
                        console.log("----> in Collections get(index) invalid index value: " + index);
                    }
                }
            } else {
                console.log("----> in Collections get(index) invalid index value: " + index);
            }
        }
    }

}

/**
 * A Collection resource endpoint.
 */
export class Collection {

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
        this.path = this.api_root_path + "collections/" + collectionInfo.id + "/";
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
     * @param {type} func - the function to return if the collection allows reading it 
     * @returns {unresolved}
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
     * @param {type} func - the function to return if the collection allows writing to it 
     * @returns {unresolved}
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
     * 
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     * example: {"added_after": "2016-02-01T00:00:01.000Z"}
     *          {"type": ["incident","ttp","actor"]}
     * @returns {Collection.ifCanRead.func|unresolved}
     */
    async getObjects(filter) {
        return this.ifCanRead(this.conn.fetchThis(this.path + "objects/", this.objsOptions, filter));
    }

    /**
     * returns a specific STIX2 object from this Collection objects bundle.
     * obj_id must be a STIX object id.
     * @param {type} obj_id - the STIX object id to retrieve
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     * example: {"version": "2016-01-01T01:01:01.000Z"}
     */
    async getObject(obj_id, filter) {
        let result = await (await (this.ifCanRead(this.conn.fetchThis(this.path + "objects/" + obj_id + "/", this.objOptions, filter).then(bundle => {
            return bundle.objects.find(obj => obj.id === obj_id);
        }))));
        return result;
    }

    /**
     * adds a STIX2 bundle to this Collection objects.
     * returns a Taxii2 Status object
     * @param {type} bundle - the STIX bundle object to add
     */
    async addObject(bundle) {
        return this.ifCanWrite(this.conn.asyncFetch(this.path + "objects/", this.conn.postConfig));
    }

    /**
     * manifests are metadata about the objects.
     * 
     * retrieves all manifest about objects from this Collection.
     * returns the list of manifest-entry
     *
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     */
    async getManifests(filter) {
         this.ifCanRead(await this.conn.fetchThis(this.path + "manifest/", this.manOptions, filter));
         return this.manOptions.cache.objects;
    }

    /**
     * manifests are metadata about the objects.
     *
     * retrieves the manifest about a specific object (obj_id) from this Collection
     * returns specific manifest-entry
     *
     * @param {type} obj_id - the STIX object id to get he manifest for
     * @param {type} filter - the filter object describing the filtering to be done to be added to the path as a query string
     */
    async getManifest(obj_id, filter) {
          return await (this.getManifests(filter).then(objects => {
              return objects.find(obj => obj.id === obj_id);
          }));
    }

}

/**
 * This Endpoint provides information about the status of a previous request.
 * In TAXII 2.0, the only request that can be monitored is one to add objects to a Collection.
 */
export class Status {

    /**
     * provides information about the status of a previous request.
     * @param {type} api_root_path - the full path to the desired api root
     * @param {type} status_id - the identifier of the status message being requested, for STIX objects, their id.
     * @param {type} conn - a TaxiiConnection class instance.
     */
    constructor(api_root_path, status_id, conn) {
        this.api_root_path = TaxiiConnect.withLastSlash(api_root_path);
        this.status_id = status_id;
        this.conn = conn;
        this.path = this.api_root_path + "status/" + status_id + "/";
    }

    /**
     * retrieves the Status information about a request to add objects to a Collection.
     */
    async get() {
        try {
            return this.conn.asyncFetch(this.path, this.conn.getConfig);
        } catch (err) {
            console.log("----> Status could not be fetched from: " + this.path);
        }
    }

}
