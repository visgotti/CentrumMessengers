import { REQUEST_MESSAGE, RequestOptions, Sequence, Hook } from '../Centrum';
import Timeout = NodeJS.Timeout;

export class Requester {
    private dealerSocket: any;
    private onResponseHandlers: Map<Sequence, Function>;
    private awaitingResponseTimeouts: Map<Sequence, Timeout>;
    private sequence: Sequence;
    private timeout: number;

    constructor(dealerSocket, options) {
        this.timeout = options.timeout || 5000;
        this.sequence = 0;
        this.dealerSocket = dealerSocket;
        this.onResponseHandlers = new Map();
        this.awaitingResponseTimeouts = new Map();
        this.registerResponseHandler();
    }

    public makeForHook(name, to, beforeHook: Hook) {
        return ((...args) => {
            const sendData = beforeHook(...args);
            return new Promise((resolve, reject) => {
                this.sendRequest(sendData, name, to, (err, receivedData) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(receivedData);
                });
            });
        });
    }

    public makeForData(name, to) {
        return ((data: any) => {
            return new Promise((resolve, reject) => {
                this.sendRequest(data, name, to, (err, receivedData) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(receivedData);
                });
            });
        });
    }

    /**
     * @param data - user data that's meant to be sent and processed
     * @param name - name of the request
     * @param to - id of the server being sent to
     * @param onResponse - function called asynchronously when received response
     */
    private sendRequest(data, name, to, onResponse) {
        const request: REQUEST_MESSAGE = {
            name,
            from: this.dealerSocket.identity,
            sequence: this.sequence,
            data,
        };

        const encoded = JSON.stringify(request);
        this.dealerSocket.send([ to, '', encoded]);
        this.onResponseHandlers.set(this.sequence, onResponse);

        // add a timeout to prevent hanging requests.
        this.addTimeout(this.sequence);

        this.sequence += 1;
    }

    private registerResponseHandler() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const response = JSON.parse(args[1]);
                const callback = this.onResponseHandlers.get(response.sequence);
                if(callback) {
                    this.onResponseHandlers.delete(response.sequence);

                    // cancel the timeout since we got the response
                    this.removeTimeout(response.sequence);

                    return callback(null, response.data);
                }
            }
        });
    }

    private addTimeout(sequence) {
        this.awaitingResponseTimeouts.set(sequence, setTimeout(() => {
            const callback = this.onResponseHandlers.get(sequence);
            this.onResponseHandlers.delete(sequence);
            this.awaitingResponseTimeouts.delete(sequence);
            return callback(`Request timed out after ${this.timeout}ms`, null);
        }, this.timeout));
    }

    private removeTimeout(sequence) {
        const timeout = this.awaitingResponseTimeouts.get(sequence);
        clearTimeout(timeout);
        this.awaitingResponseTimeouts.delete(sequence);
    }
}