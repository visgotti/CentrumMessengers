"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Requester_1 = require("./Messengers/Requester");
const Responder_1 = require("./Messengers/Responder");
const Publisher_1 = require("./Messengers/Publisher");
const Subscriber_1 = require("./Messengers/Subscriber");
class Centrum {
    constructor(options) {
        this.serverId = options.id;
        this.dealerSocket = null;
        this.pubSocket = null;
        this.publish = null;
        this.publisher = null;
        this.requests = null;
        this.requester = null;
        this.responses = null;
        this.responder = null;
        this.subscriptions = null;
        this.subscriber = null;
        this.options = options;
        this.initializeMessengers(options);
    }
    /**
     * sets and initializes available public functions based on centrum options passed in.
     * @param options
     */
    initializeMessengers(options) {
        if (options.brokerURI) {
            this.dealerSocket = zmq.socket('dealer');
            this.dealerSocket.identity = this.serverId;
            this.dealerSocket.connect(options.brokerURI);
        }
        if (options.request) {
            if (!this.dealerSocket)
                throw `Please provide a broker URI in your centrumOptions for request server: ${this.serverId}`;
            this.requests = {};
            this.requester = new Requester_1.Requester(this.dealerSocket, options.request);
            this.createRequest = this._createRequest;
            this.removeRequest = this._removeRequest;
        }
        if (options.response) {
            if (!this.dealerSocket)
                throw `Please provide a broker URI in your centrumOptions for response server: ${this.serverId}`;
            this.responses = new Set();
            this.responder = new Responder_1.Responder(this.dealerSocket);
            this.createResponse = this._createResponse;
            this.removeResponse = this._removeResponse;
        }
        if (options.publish) {
            this.publish = {};
            this.pubSocket = zmq.socket('pub');
            this.pubSocket.bindSync(options.publish.pubSocketURI);
            this.publisher = new Publisher_1.Publisher(this.pubSocket);
            this.getOrCreatePublish = this._getOrCreatePublish;
            this.createPublish = this._createPublish;
            this.removePublish = this._removePublish;
            this.removeAllPublish = this._removeAlPublish;
        }
        if (options.subscribe) {
            this.subSocket = zmq.socket('sub');
            for (let i = 0; i < options.subscribe.pubSocketURIs.length; i++) {
                this.subSocket.connect(options.subscribe.pubSocketURIs[i]);
            }
            this.subscriptions = new Set();
            this.subscriber = new Subscriber_1.Subscriber(this.subSocket);
            this.createSubscription = this._createSubscription;
            this.createOrAddSubscription = this._createOrAddSubscription;
            this.removeSubscription = this._removeSubscription;
            this.removeAllSubscriptions = this._removeAllSubscriptions;
        }
    }
    close() {
        if (this.pubSocket) {
            this._removeAlPublish();
            this.pubSocket.close();
            this.pubSocket = null;
        }
        if (this.subSocket) {
            this._removeAllSubscriptions();
            this.subSocket.close();
            this.subSocket = null;
        }
        if (this.dealerSocket) {
            this.dealerSocket.close();
            this.dealerSocket = null;
        }
    }
    /**
     * If options.request was passed into constructor, you can use this function to create
     * and send requests. After running this you can make your request by Centrum.requests.name() in which
     * the name() function is the beforeRequestHook passed in.
     * @param name - unique name of request which will be used
     * @param to - id of server you are sending request to.
     * @param beforeHook - Hook that's used if you want to process data before sending it,
     * @returns Function - request function that sends out the request.
     * if left out, by default you can pass in an object when calling request and send that.
     * whatever it returns gets sent.
     */
    createRequest(name, to, beforeHook) { throw new Error('Server is not configured to use requests.'); }
    removeRequest(name) { throw new Error('Server is not configured to use requests.'); }
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name, beforeHook) { throw new Error('Server is not configured use responses.'); }
    removeResponse(name) { throw new Error('Server is not configured to use responses.'); }
    /**
     *
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    createPublish(name, beforeHook, afterHandler) { throw new Error('Server is not configured to publish.'); }
    /**
     * does same thing as createPublish but if the publish name already exists it will return the handler.
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    getOrCreatePublish(name, beforeHook, afterHandler) { throw new Error('Server is not configured to publish.'); }
    removePublish(name) { throw new Error('Server is not configured to publish.'); }
    removeAllPublish() { throw new Error('Server is not configured to publish.'); }
    createSubscription(name, handler) { throw new Error('Server is not configured to use subscriptions.'); }
    // used if you're not sure if the subscription exists but you want to add another handler to it.
    createOrAddSubscription(name, handler) { throw new Error('Server is not configured to use subscriptions.'); }
    removeSubscription(name, index) { throw new Error('Server is not configured to use subscriptions.'); }
    removeAllSubscriptions() { throw new Error('Server is not configured to use subscriptions.'); }
    _createSubscription(name, handler) {
        if (!(this.subscriptions.has(name))) {
            this.subscriptions.add(name);
            this.subscriber.addHandler(name, handler);
        }
    }
    _createOrAddSubscription(name, handler)  {
        if (!(this.subscriptions.has(name))) {
            this.subscriptions.add(name);
        }
        this.subscriber.addHandler(name, handler);
    }
    _removeSubscription(name, index) {
        if (this.subscriptions.has(name)) {
            if (index) {
                const handlersLeft = this.subscriber.removeHandler(name, index);
                if (handlersLeft === 0) {
                    this.subscriptions.delete(name);
                }
            }
            else {
                this.subscriber.removeAllHandlers(name);
                this.subscriptions.delete(name);
            }
        }
        else {
            throw new Error(`Subscription does not exist for name: ${name}`);
        }
    }
    _removeAllSubscriptions() {
        for (let subName of this.subscriptions.values()) {
            this._removeSubscription(subName);
        }
    }
    _createPublish(name, beforeHook, afterHandler) {
        if (this.publish[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }
        const publish = this.publisher.make(name, beforeHook, afterHandler);
        this.publish[name] = publish;
        return publish;
    }
    _getOrCreatePublish(name, beforeHook, afterHandler) {
        if (this.publish[name]) {
            return this.publish[name];
        }
        const publish = this.publisher.make(name, beforeHook, afterHandler);
        this.publish[name] = publish;
        return publish;
    }
    _removePublish(name) {
        if (this.publish[name]) {
            delete this.publish[name];
        }
        else {
            throw new Error(`Publisher does not exist for name: ${name}`);
        }
    }
    _removeAlPublish() {
        Object.keys(this.publish).forEach(pubName => {
            this._removePublish(pubName);
        });
    }
    _createRequest(name, to, beforeHook) {
        if (this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        const request = !beforeHook ? this.requester.makeForData(name, to) : this.requester.makeForHook(name, to, beforeHook);
        this.requests[name] = request;
        return request;
    }
    _removeRequest(name) {
        if (this.requests[name]) {
            delete this.requests[name];
        }
        else {
            throw new Error(`Request does not exist for name: ${name}`);
        }
    }
    _createResponse(name, beforeHook) {
        if (this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responses.add(name);
        this.responder.addOnRequestHook(name, beforeHook);
    }
    _removeResponse(name) {
        if (this.responses.has(name)) {
            this.responses.delete(name);
            this.responder.removeOnRequestHook(name);
        }
        else {
            throw new Error(`Response does not exist for name: ${name}`);
        }
    }
}
exports.Centrum = Centrum;
