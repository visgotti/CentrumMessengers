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
export declare type RequestOptions = {
    backServerIds?: Array<string>;
    timeout?: number;
};
export interface CentrumOptions {
    request?: boolean;
    respond?: boolean;
    notify?: boolean;
    publish?: boolean;
    subscribe?: boolean;
}
import { Requester } from './Messengers/Request/Requester';
export declare class Centrum {
    serverId: string;
    requests?: {
        [name: string]: Function;
    };
    responses?: Set<string>;
    requester?: Requester;
    responder?: any;
    notifier?: any;
    subscriber?: any;
    publisher?: any;
    private brokerURI;
    private dealerSocket;
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
     * whatever it returns gets sent.
     */
    createRequest(name: string, to: string, beforeRequestHook: Hook): void;
    /**
     * If options.response was passed into constructor, you can use this function to create
     * an onRequest handler, with a hook that processes the request data and whatever
     * the hook returns gets sent back as the response data.
     * @param name - unique name of request which will be used
     * @param onRequestHook - Hook to process data from request, whatever it returns gets sent back
     */
    createResponse(name: string, onRequestHandler: Hook): void;
    createNotification(): void;
    createSubscription(): void;
    createPublisher(): void;
    private _createRequest;
    private _createResponse;
}
