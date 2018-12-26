export declare type Hook = (...args: any[]) => any;
export declare type Sequence = number;
export interface REQUEST_MESSAGE {
    readonly name: string;
    readonly from: string;
    readonly sequence: number;
    data: any;
}
export interface RESPONSE_MESSAGE {
    readonly sequence: number;
    data: any;
}
export interface RequestOptions {
    timeout?: number;
}
export interface PublishOptions {
    PubSocketURI: string;
}
export interface SubscribeOptions {
    PubURIs: Array<string>;
}
export interface CentrumOptions {
    request?: RequestOptions;
    respond?: boolean;
    notify?: boolean;
    publish?: PublishOptions;
    subscribe?: SubscribeOptions;
}
import { Requester } from './Messengers/Requester';
export declare class Centrum {
    serverId: string;
    requests?: {
        [name: string]: Function;
    };
    responses?: Set<string>;
    publish?: {
        [name: string]: Function;
    };
    requester?: Requester;
    responder?: any;
    notifier?: any;
    subscriber?: any;
    publisher?: any;
    private brokerURI;
    private dealerSocket;
    private pubSocket;
    private subSocket;
    constructor(serverId: any, brokerURI: any, options: CentrumOptions);
    /**
     * sets and initializes available public functions based on centrum options passed in.
     * @param options
     */
    private initializeMessengers;
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
    createRequest(name: string, to: string, beforeRequestHook?: Hook): void;
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name: string, onRequestHandler: Hook): void;
    createPublish(name: string, beforeHook?: Hook): void;
    createSubscription(): void;
    private _createPublish;
    private _createRequest;
    private _createResponse;
}
