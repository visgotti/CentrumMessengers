import * as zmq from 'zeromq';

/*
    Hook is a function used that processes data and then
    whatever it returns is sent in the message as the data attribute
 */
export type Hook = (...args: any[]) => any;

export type Sequence = number;

export interface REQUEST_MESSAGE  {
    readonly name: string,
    readonly from: string,
    readonly sequence: number,
    data: any,
}

export interface RESPONSE_MESSAGE  {
    readonly sequence: number,
    data: any,
}

export interface RequestOptions {
    timeout?: number,
}

export interface PublishOptions {
    PubSocketURI: string,
}

export interface SubscribeOptions {
    PubURIs: Array<string>,
}

export interface CentrumOptions {
    request?: RequestOptions,
    respond?: boolean,
    notify?: boolean,
    publish?: PublishOptions,
    subscribe?: SubscribeOptions,
}

import { Requester } from './Messengers/Requester';
import { Responder } from './Messengers/Responder';
import { Publisher } from "./Messengers/Publisher";

export class Centrum {
    public serverId: string;
    public requests?: { [name: string]: Function };
    public responses?: Set<string>;
    public publish?: { [name: string]: Function };
    public requester?: Requester;
    public responder?: any;
    public notifier?: any;
    public subscriber?: any;
    public publisher?: any;

    private brokerURI: string;

    private dealerSocket: any;
    private pubSocket: any;
    private subSocket: any;

    constructor(serverId, brokerURI, options: CentrumOptions) {
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
    private initializeMessengers(options: CentrumOptions) {
        if(options.request) {
            this.requests = {};
            this.requester = new Requester(this.dealerSocket, options.request);
            this.createRequest = this._createRequest;
        }

        if(options.respond) {
            this.responses = new Set();
            this.responder = new Responder(this.dealerSocket);
            this.createResponse = this._createResponse;
        }

        if(options.publish) {
            this.pubSocket = zmq.socket('pub');
            this.pubSocket.bind(options.publish.PubSocketURI);
            this.publisher = new Publisher(this.pubSocket);
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
    public createRequest(name: string, to: string, beforeRequestHook?: Hook) { throw new Error('Server is not configured to make requests.') }

    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    public createResponse(name: string, onRequestHandler: Hook) { throw new Error('Server is not configured to make responses.') }

    public createPublish(name: string, beforeHook?: Hook) { throw new Error('Server is not configured to publish.') }

    public createSubscription() { throw new Error('Server is not configured to subscribe.') }

    private _createPublish(name: string, beforeHook?: Hook) {
        if(this.publisher[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }
        this.publish[name] = !beforeHook ? this.publisher.makeForData() : this.publisher.makeForHook(beforeHook);
    }

    private _createRequest(name: string, to: string, beforeRequestHook?: Hook) {
        if(this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        this.requests[name] = !beforeRequestHook ? this.requester.makeForData(name, to) : this.requester.makeForHook(name, to, beforeRequestHook);
    }

    private _createResponse(name: string, onRequestHandler: Hook) {
        if(this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responder.addOnRequestHandler(name, onRequestHandler);
    }
}