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

export interface CentrumOptions {
    request?: boolean,
    respond?: boolean,
    notify?: boolean,
    publish?: boolean,
    subscribe?: boolean,
}

import { Requester } from './Messengers/Request/Requester';
import { RequestFactory } from './Messengers/Request/RequestFactory';
import { Responder } from './Messengers/Respond/Responder';

export class Centrum {
    public serverId: string;
    public requests?: { [name: string]: Function };
    public responses?: Set<string>;
    public requester?: Requester;
    public responder?: any;
    public notifier?: any;
    public subscriber?: any;
    public publisher?: any;

    private brokerURI: string;
    private dealerSocket: any;

    constructor(serverId, brokerURI, options: CentrumOptions) {
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
    public createRequest(name: string, to: string, beforeRequestHook: Hook) { throw new Error('Server is not configured to make this action') }

    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    public createResponse(name: string, onRequestHandler: Hook) { throw new Error('Server is not configured to make this action') }


    //TODO: implement and TEST!!!!!!!!!!!!!!!!!!!!!!
    public createNotification() { throw new Error('Server is not configured to make this action') }
    public createSubscription() { throw new Error('Server is not configured to make this action') }
    public createPublisher() { throw new Error('Server is not configured to make this action') }


    private _createRequest(name: string, to: string, beforeRequestHook: Hook) {
        if(this.requests[name]) {
            throw new Error(`Duplicate request name: ${name}`);
        }
        const requestFactory = new RequestFactory(name, to, beforeRequestHook, this.requester);
        this.requests[name] = requestFactory.make();
    };

    private _createResponse(name: string, onRequestHandler: Hook) {
        if(this.responses.has(name)) {
            throw new Error(`Duplicate response name: ${name}`);
        }
        this.responder.addOnRequestHandler(name, onRequestHandler);
    }
}