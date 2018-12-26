"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Requester_1 = require("./Messengers/Request/Requester");
const RequestFactory_1 = require("./Messengers/Request/RequestFactory");
const Responder_1 = require("./Messengers/Respond/Responder");
class Centrum {
    constructor(serverId, brokerURI, options) {
        this.serverId = serverId;
        this.brokerURI = brokerURI;
        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.identity = serverId;
        this.dealerSocket.connect(brokerURI);
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
            this.requester = new Requester_1.Requester(this.dealerSocket);
            this.createRequest = this._createRequest;
        }
        if (options.respond) {
            this.responses = new Set();
            this.responder = new Responder_1.Responder(this.dealerSocket);
            this.createResponse = this._createResponse;
        }
    }
    /**
     * If options.request was passed into constructor, you can use this function to create
     * and send requests. After running this you can make your request by Centrum.requests.name() in which
     * the name() function is the beforeRequestHook passed in.
     * @param name - unique name of request which will be used
     * @param to - id of server you are sending request to.
     * @param beforeRequestHook - Hook that's used if you want to process data before sending it,
     * whatever it returns gets sent.
     */
    createRequest(name, to, beforeRequestHook) { throw new Error('Server is not configured to make this action'); }
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name, onRequestHandler) { throw new Error('Server is not configured to make this action'); }
    //TODO: implement and TEST!!!!!!!!!!!!!!!!!!!!!!
    createNotification() { throw new Error('Server is not configured to make this action'); }
    createSubscription() { throw new Error('Server is not configured to make this action'); }
    createPublisher() { throw new Error('Server is not configured to make this action'); }
    _createRequest(name, to, beforeRequestHook) {
        if (this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        const requestFactory = new RequestFactory_1.RequestFactory(name, to, beforeRequestHook, this.requester);
        this.requests[name] = requestFactory.make();
    }
    ;
    _createResponse(name, onRequestHandler) {
        if (this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responder.addOnRequestHandler(name, onRequestHandler);
    }
}
exports.Centrum = Centrum;
