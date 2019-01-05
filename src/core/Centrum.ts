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
export type Handler<T> = (data: any) => void;
export interface SubscriptionHandler { (data: any): Handler<any>; id: number; }

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
            this.getOrCreatePublish = this._getOrCreatePublish;
            this.createPublish = this._createPublish;
            this.removePublish = this._removePublish;
            this.removeAllPublish = this._removeAlPublish;
        }

        if(options.subscribe) {
            this.subSocket = zmq.socket('sub');
            for(let i = 0; i < options.subscribe.pubSocketURIs.length; i++) {
                this.subSocket.connect(options.subscribe.pubSocketURIs[i]);
            }
            this.subscriptions = new Set();
            this.subscriber = new Subscriber(this.subSocket);
            this.createSubscription = this._createSubscription;
            this.createOrAddSubscription = this._createOrAddSubscription;
            this.removeSubscriptionById = this._removeSubscriptionById;
            this.removeAllSubscriptionsWithName = this._removeAllSubscriptionsWithName;
            this.removeAllSubscriptions = this._removeAllSubscriptions;
        }
    }

    public close() {
        if(this.pubSocket) {
            this._removeAlPublish();
            this.pubSocket.close();
            this.pubSocket = null;
        }
        if(this.subSocket) {
            this._removeAllSubscriptions();
            this.subSocket.close();
            this.subSocket = null;
        }
        if(this.dealerSocket) {
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
    public createRequest(name: string, to: string, beforeHook?: Hook) : Function { throw new Error('Server is not configured to use requests.') }
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

    /**
     *
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    public createPublish(name: string, beforeHook?: Hook, afterHandler?: Handler<any>) : Function { throw new Error('Server is not configured to publish.') }

    /**
     * does same thing as createPublish but if the publish name already exists it will return the handler.
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    public getOrCreatePublish(name: string, beforeHook?: Hook, afterHandler?: Handler<any>) : Function { throw new Error('Server is not configured to publish.') }
    public removePublish(name) { throw new Error('Server is not configured to publish.')}
    public removeAllPublish() { throw new Error('Server is not configured to publish.')}

    /**
     * creates a new subscription and subscription handler to process data when receiving a publication. Throws error if handler already exists.
     * @param name - name of publication to subscribe to.
     * @param handler - method that takes in publication data as parameter when received.
     * @returns number - id of handler (used to remove subscription later if needed)
     */
    public createSubscription(name: string, handler: Handler<any>) : number { throw new Error('Server is not configured to use subscriptions.') }

    /**
     * creates a new subscription if it doesnt exist but if it does, instead of throwing an error it will add a new handler to be ran on the publication
     * @param name - name of publication to subscribe to.
     * @param handler - method that takes in publication data as parameter when received.
     * @returns number - id of handler added (used to remove subscription later if needed)
     */
    public createOrAddSubscription(name: string, handler: Handler<any>) : number { throw new Error('Server is not configured to use subscriptions.') }

    /**
     * removes specific subscription by id
     * @param id - id of subscription that gets returned on creation.
     */
    public removeSubscriptionById(id: number) : number | boolean { throw new Error('Server is not configured to use subscriptions.')}
    public removeAllSubscriptionsWithName(name: string) { throw new Error('Server is not configured to use subscriptions.')}
    public removeAllSubscriptions() { throw new Error('Server is not configured to use subscriptions.')}

    private _createSubscription(name: string, handler: Handler<any>) {
        if(!(this.subscriptions.has(name))) {
            this.subscriptions.add(name);
            return this.subscriber.addHandler(name, handler);
        } else {
            throw new Error(`Subscription already has a handler for name: ${name}. If you want to add multiple handlers use createOrAddSubscription or the addHandler method directly on your subscription object.`);
        }
    }

    private _createOrAddSubscription(name: string, handler: Handler<any>) {
        if(!(this.subscriptions.has(name))) {
            this.subscriptions.add(name);
        }
        return this.subscriber.addHandler(name, handler);
    }

    private _removeSubscriptionById(id: number) : number | boolean {
        const removed = this.subscriber.removeHandlerById(id);
        if(!(removed.success)) return false;

        if(removed.handlersLeft === 0) {
            this.subscriptions.delete(removed.name);
        }
        return removed.handlersLeft;
    }

    private _removeAllSubscriptionsWithName(name: string) : boolean {
        if (this.subscriptions.has(name)) {
            this.subscriber.removeAllHandlersWithName(name);
            this.subscriptions.delete(name);
            return true;
        } else {
            throw new Error(`Subscription does not exist for name: ${name}`);
        }
    }

    private _removeAllSubscriptions() {
        for(let subName of this.subscriptions.values()) {
            this._removeAllSubscriptionsWithName(subName);
        }
    }

    private _createPublish(name: string, beforeHook?: Hook, afterHandler?: Handler<any>) : Function {
        if(this.publish[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }
        const publish = this.publisher.make(name, beforeHook, afterHandler);
        this.publish[name] = publish;
        return publish;
    }

    private _getOrCreatePublish(name: string, beforeHook?: Hook, afterHandler?: Handler<any>) : Function {
        if(this.publish[name]) {
            return this.publish[name];
        }
        const publish = this.publisher.make(name, beforeHook, afterHandler);
        this.publish[name] = publish;
        return publish;
    }

    private _removePublish(name: string) {
        if(this.publish[name]) {
            delete this.publish[name];
        } else {
            throw new Error(`Publisher does not exist for name: ${name}`);
        }
    }

    private _removeAlPublish() {
        Object.keys(this.publish).forEach(pubName => {
            this._removePublish(pubName);
        });
    }

    private _createRequest(name: string, to: string, beforeHook?: Hook) : Function {
        if(this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        const request = !beforeHook ? this.requester.makeForData(name, to) : this.requester.makeForHook(name, to, beforeHook);
        this.requests[name] = request;
        return request;
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