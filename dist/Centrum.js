"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Requester_1 = require("./Messengers/Requester");
const Responder_1 = require("./Messengers/Responder");
const Publisher_1 = require("./Messengers/Publisher");
class Centrum {
    constructor(serverId, brokerURI, options) {
        this.serverId = serverId;
        this.brokerURI = brokerURI;
        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.identity = serverId;
        this.dealerSocket.connect(brokerURI);
        this.pubSocket = null;
        this.publish = null;
        this.publisher = null;
        this.requests = null;
        this.requester = null;
        this.responses = null;
        this.responder = null;
        this.initializeMessengers(options);
    }
    /**
     * sets and initializes available public functions based on centrum options passed in.
     * @param options
     */
    initializeMessengers(options) {
        if (options.request) {
            this.requests = {};
            this.requester = new Requester_1.Requester(this.dealerSocket, options.request);
            this.createRequest = this._createRequest;
        }
        if (options.respond) {
            this.responses = new Set();
            this.responder = new Responder_1.Responder(this.dealerSocket);
            this.createResponse = this._createResponse;
        }
        if (options.publish) {
            this.pubSocket = zmq.socket('pub');
            this.pubSocket.bind(options.publish.PubSocketURI);
            this.publisher = new Publisher_1.Publisher(this.pubSocket);
            this.createPublish = this._createPublish;
        }
    }
    /**
     * If options.request was passed into constructor, you can use this function to create
     * and send requests. After running this you can make your request by Centrum.requests.name() in which
     * the name() function is the beforeRequestHook passed in.
     * @param name - unique name of request which will be used
     * @param to - id of server you are sending request to.
     * @param beforeRequestHook - Hook that's used if you want to process data before sending it,
     * if left out, by default you can pass in an object when calling request and send that.
     * whatever it returns gets sent.
     */
    createRequest(name, to, beforeRequestHook) { throw new Error('Server is not configured to make requests.'); }
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name, onRequestHandler) { throw new Error('Server is not configured to make responses.'); }
    createPublish(name, beforeHook) { throw new Error('Server is not configured to publish.'); }
    createSubscription() { throw new Error('Server is not configured to subscribe.'); }
    _createPublish(name, beforeHook) {
        if (this.publisher[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }
        this.publish[name] = !beforeHook ? this.publisher.makeForData() : this.publisher.makeForHook(beforeHook);
    }
    _createRequest(name, to, beforeRequestHook) {
        if (this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        this.requests[name] = !beforeRequestHook ? this.requester.makeForData(name, to) : this.requester.makeForHook(name, to, beforeRequestHook);
    }
    _createResponse(name, onRequestHandler) {
        if (this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responder.addOnRequestHandler(name, onRequestHandler);
    }
}
exports.Centrum = Centrum;
