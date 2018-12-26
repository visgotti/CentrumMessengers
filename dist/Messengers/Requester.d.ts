import { Hook } from '../Centrum';
export declare class Requester {
    private dealerSocket;
    private onResponseHandlers;
    private awaitingResponseTimeouts;
    private sequence;
    private timeout;
    constructor(dealerSocket: any, options: any);
    makeForHook(name: any, to: any, beforeHook: Hook): (...args: any[]) => Promise<{}>;
    makeForData(name: any, to: any): (data: any) => Promise<{}>;
    /**
     * @param data - user data that's meant to be sent and processed
     * @param name - name of the request
     * @param to - id of the server being sent to
     * @param onResponse - function called asynchronously when received response
     */
    private sendRequest;
    private registerResponseHandler;
    private addTimeout;
    private removeTimeout;
}
