"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestFactory {
    constructor(name, to, beforeRequestHook, requester) {
        this.name = name;
        this.to = to;
        this.requester = requester;
        this.sequence = 0;
        this.beforeRequestHook = beforeRequestHook;
    }
    make() {
        return ((...args) => {
            const sendData = this.beforeRequestHook(...args);
            return new Promise((resolve, reject) => {
                this.requester.sendRequest(sendData, this.name, this.to, (err, receivedData) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(receivedData);
                });
            });
        });
    }
}
exports.RequestFactory = RequestFactory;
