export declare type Hook = (...args: any[]) => any;
export declare type Handler<T> = (data: any) => void;
export interface SubscriptionHandler {
    (data: any): Handler<Function>;
    id: number;
}
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
export interface CentrumConfig {
    'broker': {
        ['URI']: string;
    };
    ['servers']: Array<{
        ['name']: string;
        ['centrumOptions']: any;
    }>;
}
export interface RequestOptions {
    timeout?: number;
}
export interface PublishOptions {
    pubSocketURI: string;
}
export interface SubscribeOptions {
    pubSocketURIs: Array<string>;
}
export interface CentrumOptions {
    id: string;
    brokerURI?: string;
    request?: RequestOptions;
    response?: boolean;
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
    subscriptions?: Set<string>;
    publish?: {
        [name: string]: Function;
    };
    requester?: Requester;
    responder?: any;
    notifier?: any;
    subscriber?: any;
    publisher?: any;
    private dealerSocket;
    private pubSocket;
    private subSocket;
    private options;
    constructor(options: CentrumOptions);
    /**
     * sets and initializes available public functions based on centrum options passed in.
     * @param options
     */
    private initializeMessengers;
    close(): void;
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
    createRequest(name: string, to: string, beforeHook?: Hook): Function;
    removeRequest(name: any): void;
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name: string, beforeHook: Hook): void;
    removeResponse(name: any): void;
    /**
     *
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    createPublish(name: string, beforeHook?: Hook, afterHandler?: Handler<Function>): Function;
    /**
     * does same thing as createPublish but if the publish name already exists it will return the handler.
     * @param name - name for publish method
     * @param beforeHook - hook that sends return value as message
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     */
    getOrCreatePublish(name: string, beforeHook?: Hook, afterHandler?: Handler<Function>): Function;
    removePublish(name: any): void;
    removeAllPublish(): void;
    /**
     * creates a new subscription and subscription handler to process data when receiving a publication. Throws error if handler already exists.
     * @param name - name of publication to subscribe to.
     * @param handler - method that takes in publication data as parameter when received.
     * @returns number - id of handler (used to remove subscription later if needed)
     */
    createSubscription(name: string, handler: Handler<Function>): number;
    /**
     * creates a new subscription if it doesnt exist but if it does, instead of throwing an error it will add a new handler to be ran on the publication
     * @param name - name of publication to subscribe to.
     * @param handler - method that takes in publication data as parameter when received.
     * @returns number - id of handler added (used to remove subscription later if needed)
     */
    createOrAddSubscription(name: string, handler: Handler<Function>): number;
    /**
     * removes specific subscription by id
     * @param id - id of subscription that gets returned on creation.
     */
    removeSubscriptionById(id: number): number | boolean;
    removeAllSubscriptionsWithName(name: string): void;
    removeAllSubscriptions(): void;
    private _createSubscription;
    private _createOrAddSubscription;
    private _removeSubscriptionById;
    private _removeAllSubscriptionsWithName;
    private _removeAllSubscriptions;
    private _createPublish;
    private _getOrCreatePublish;
    private _removePublish;
    private _removeAlPublish;
    private _createRequest;
    private _removeRequest;
    private _createResponse;
    private _removeResponse;
}
