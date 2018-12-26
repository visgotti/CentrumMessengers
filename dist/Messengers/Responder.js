"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Responder {
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
    addOnRequestHandler(name, hook) {
        this.onRequestHandlers.set(name, hook);
    }
    removeOnRequestHandler(name) {
        if (this.onRequestHandlers.has(name)) {
            this.onRequestHandlers.delete(name);
            return true;
        }
        return false;
    }
    /**
     * @param response - response message to encode and send
     * @param toServerId - id of the server waiting for response
     */
    sendResponse(response, toServerId) {
        const encoded = JSON.stringify(response);
        this.dealerSocket.send([toServerId, '', encoded]);
    }
    registerOnRequestHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const request = JSON.parse(args[1]);
                const response = { sequence: request.sequence, data: {} };
                const onRequestHandler = this.onRequestHandlers.get(request.name);
                if (onRequestHandler) {
                    response.data = onRequestHandler(request.data);
                }
                this.sendResponse(response, request.from);
            }
        });
    }
}
exports.Responder = Responder;
