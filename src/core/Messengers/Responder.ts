import { REQUEST_MESSAGE, RESPONSE_MESSAGE, Hook } from '../Centrum';


export class Responder {
    private dealerSocket: any;
    private onRequestHandlers: Map<string, Function>;

    constructor(dealerSocket) {
        this.dealerSocket = dealerSocket;
        this.onRequestHandlers = new Map();
        this.registerOnRequestHandlers();
    }

    /**
     * Used when adding a handler for incoming requests.
     * @param name - name of the request
     * @param hook - function used to process and return data
     */
    public addOnRequestHandler(name, hook: Hook) {
        this.onRequestHandlers.set(name, hook);
    }

    public removeOnRequestHandler(name) {
        if(this.onRequestHandlers.has(name)) {
            this.onRequestHandlers.delete(name);
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

    private registerOnRequestHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const request = JSON.parse(args[1]) as REQUEST_MESSAGE;
                const response = { sequence: request.sequence, data: {} } as RESPONSE_MESSAGE;
                const onRequestHandler = this.onRequestHandlers.get(request.name);
                if(onRequestHandler) {
                    response.data = onRequestHandler(request.data);
                }
                this.sendResponse(response, request.from);
            }
        });
    }
}