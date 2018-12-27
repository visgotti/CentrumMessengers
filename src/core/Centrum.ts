import * as zmq from 'zeromq';

/*
    Hook is a function used that processes data and then
    whatever it returns is sent in the message as the data attribute
 */
export type Hook = (...args: any[]) => any;

/*
    Handler is a function that is used to process data
    received from a server but does not worry about
    sending data anywhere after that implicitly.
 */
export type Handler = (data: any) => void;

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
export interface CentrumConfig {
    'broker': {
        ['URI']: string,
    }
    ['servers']:
        Array<{
            ['name']: string,
            ['centrumOptions']: any
        }>
}

export interface RequestOptions {
    timeout?: number,
}

export interface PublishOptions {
    pubSocketURI: string,
}

export interface SubscribeOptions {
    pubSocketURIs: Array<string>,
}

export interface CentrumOptions {
    id: string,
    brokerURI?: string,
    request?: RequestOptions,
    response?: boolean,
    publish?: PublishOptions,
    subscribe?: SubscribeOptions,
}

import { Requester } from './Messengers/Requester';
import { Responder } from './Messengers/Responder';
import { Publisher } from './Messengers/Publisher';
import { Subscriber } from './Messengers/Subscriber';

export class Centrum {
    public serverId: string;
    public requests?: { [name: string]: Function };
    public responses?: Set<string>;
    public subscriptions?: Set<string>;
    public publish?: { [name: string]: Function };
    public requester?: Requester;
    public responder?: any;
    public notifier?: any;
    public subscriber?: any;
    public publisher?: any;
    private dealerSocket: any;
    private pubSocket: any;
    private subSocket: any;
    private options: CentrumOptions;

    constructor(options: CentrumOptions) {
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
    private initializeMessengers(options: CentrumOptions) {
        if(options.brokerURI) {
            this.dealerSocket = zmq.socket('dealer');
            this.dealerSocket.identity = this.serverId;
            this.dealerSocket.connect(options.brokerURI);
        }

        if(options.request) {
            if(!this.dealerSocket) throw `Please provide a broker URI in your centrumOptions for request server: ${this.serverId}`;
            this.requests = {};
            this.requester = new Requester(this.dealerSocket, options.request);
            this.createRequest = this._createRequest;
            this.removeRequest = this._removeRequest;
        }

        if(options.response) {
            if(!this.dealerSocket) throw `Please provide a broker URI in your centrumOptions for response server: ${this.serverId}`;
            this.responses = new Set();
            this.responder = new Responder(this.dealerSocket);
            this.createResponse = this._createResponse;
            this.removeResponse = this._removeResponse;
        }

        if(options.publish) {
            this.publish = {};
            this.pubSocket = zmq.socket('pub');
            this.pubSocket.bindSync(options.publish.pubSocketURI);
            this.publisher = new Publisher(this.pubSocket);
            this.createPublish = this._createPublish;
            this.removePublish = this._removePublish;
        }

        if(options.subscribe) {
            this.subSocket = zmq.socket('sub');
            for(let i = 0; i < options.subscribe.pubSocketURIs.length; i++) {
                this.subSocket.connect(options.subscribe.pubSocketURIs[i]);
            }
            this.subscriptions = new Set();
            this.subscriber = new Subscriber(this.subSocket);
            this.createSubscription = this._createSubscription;
            this.removeSubscription = this._removeSubscription;
        }
    }

    public close() {
        if(this.pubSocket) {
            this.pubSocket.close();
        }
        if(this.subSocket) {
            this.subSocket.close();
        }
        if(this.dealerSocket) {
            this.dealerSocket.close();
        }
    }

    /**
     * If options.request was passed into constructor, you can use this function to create
     * and send requests. After running this you can make your request by Centrum.requests.name() in which
     * the name() function is the beforeRequestHook passed in.
     * @param name - unique name of request which will be used
     * @param to - id of server you are sending request to.
     * @param beforeHook - Hook that's used if you want to process data before sending it,
     * if left out, by default you can pass in an object when calling request and send that.
     * whatever it returns gets sent.
     */
    public createRequest(name: string, to: string, beforeHook?: Hook) { throw new Error('Server is not configured to use requests.') }
    public removeRequest(name) { throw new Error('Server is not configured to use requests.')}

    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    public createResponse(name: string, beforeHook: Hook) { throw new Error('Server is not configured use responses.') }
    public removeResponse(name) { throw new Error('Server is not configured to use responses.')}

    public createPublish(name: string, beforeHook?: Hook) { throw new Error('Server is not configured to publish.') }
    public removePublish(name) { throw new Error('Server is not configured to publish.')}

    public createSubscription(name: string, handler: Handler) { throw new Error('Server is not configured to use subscriptions.') }
    public removeSubscription(name) { throw new Error('Server is not configured to use subscriptions.')}

    private _createSubscription(name: string, handler: Handler) {
        if(this.subscriptions.has(name)) {
            throw new Error(`Duplicate subscription name: ${name}`);
        }
        this.subscriptions.add(name);
        this.subscriber.addHandler(name, handler);
    }

    private _removeSubscription(name: string) {
        if(this.subscriptions.has(name)) {
            this.subscriber.removeHandler(name);
            this.subscriptions.delete(name);
        } else {
            throw new Error(`Subscription does not exist for name: ${name}`);
        }
    }

    private _createPublish(name: string, beforeHook?: Hook) {
        if(this.publish[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }
        this.publish[name] = !beforeHook ? this.publisher.makeForData(name) : this.publisher.makeForHook(name, beforeHook);
    }

    private _removePublish(name: string, beforeHook?: Hook) {
        if(this.publish[name]) {
            delete this.publish[name];
        } else {
            throw new Error(`Publisher does not exist for name: ${name}`);
        }
    }

    private _createRequest(name: string, to: string, beforeHook?: Hook) {
        if(this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        this.requests[name] = !beforeHook ? this.requester.makeForData(name, to) : this.requester.makeForHook(name, to, beforeHook);
    }

    private _removeRequest(name: string) {
        if(this.requests[name]) {
            delete this.requests[name]
        } else {
            throw new Error(`Request does not exist for name: ${name}`);
        }
    }

    private _createResponse(name: string, beforeHook: Hook) {
        if(this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responses.add(name);
        this.responder.addOnRequestHook(name, beforeHook);
    }

    private _removeResponse(name: string) {
        if(this.responses.has(name)) {
            this.responses.delete(name);
            this.responder.removeOnRequestHook(name);
        } else {
            throw new Error(`Response does not exist for name: ${name}`);
        }
    }
}