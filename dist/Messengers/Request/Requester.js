"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Requester {
    constructor(dealerSocket) {
        this.sequence = 0;
        this.dealerSocket = dealerSocket;
        this.onResponseHandlers = new Map();
        this.registerResponseHandler();
    }
    /**
     * @param data - user data thats meant to be sent and processed
     * @param name - name of the request
     * @param to - id of the server being sent to
     * @param onResponse - function called asynchronously when received response
     */
    sendRequest(data, name, to, onResponse) {
        const request = {
            name,
            from: this.dealerSocket.identity,
            sequence: this.sequence,
            data,
        };
        const encoded = JSON.stringify(request);
        this.dealerSocket.send([to, '', encoded]);
        this.onResponseHandlers.set(this.sequence, onResponse);
        this.sequence += 1;
    }
    registerResponseHandler() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const response = JSON.parse(args[1]);
                const callback = this.onResponseHandlers.get(response.sequence);
                if (callback) {
                    this.onResponseHandlers.delete(response.sequence);
                    return callback(null, response.data);
                }
            }
        });
    }
}
exports.Requester = Requester;
