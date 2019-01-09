import { REQUEST_MESSAGE, RESPONSE_MESSAGE, Hook } from '../Messenger';


export class Responder {
    private dealerSocket: any;
    private onRequestHooks: Map<string, Hook>;

    constructor(dealerSocket) {
        this.dealerSocket = dealerSocket;
        this.onRequestHooks = new Map();
        this.registerOnRequestHooks();
    }

    /**
     * Used when adding a handler for incoming requests.
     * @param name - name of the request
     * @param hook - function used to process and return data
     */
    public addOnRequestHook(name, hook: Hook) {
        this.onRequestHooks.set(name, hook);
    }

    public removeOnRequestHook(name) {
        if(this.onRequestHooks.has(name)) {
            this.onRequestHooks.delete(name);
            return true;
        }
        return false;
    }

    /**
     * @param response - response message to encode and send
     * @param toServerId - id of the server waiting for response
     */
    private sendResponse(response: RESPONSE_MESSAGE, toServerId) {
        const encoded = JSON.stringify(response);
        this.dealerSocket.send([ toServerId, '', encoded]);
    }

    private registerOnRequestHooks() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const request = JSON.parse(args[1]) as REQUEST_MESSAGE;
                const response = { sequence: request.sequence, data: {} } as RESPONSE_MESSAGE;
                const onRequestHook = this.onRequestHooks.get(request.name);
                if(onRequestHook) {
                    response.data = onRequestHook(request.data);
                }
                this.sendResponse(response, request.from);
            }
        });
    }
}