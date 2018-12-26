export declare class Requester {
    private dealerSocket;
    private onResponseHandlers;
    private sequence;
    constructor(dealerSocket: any);
    /**
     * @param data - user data thats meant to be sent and processed
     * @param name - name of the request
     * @param to - id of the server being sent to
     * @param onResponse - function called asynchronously when received response
     */
    sendRequest(data: any, name: any, to: any, onResponse: any): void;
    private registerResponseHandler;
}
