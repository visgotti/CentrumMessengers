"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Publisher {
    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }
    makeForHook(beforeHook) {
        return ((...args) => {
            const sendData = beforeHook(...args);
            const encoded = JSON.stringify(sendData);
            this.pubSocket.send([encoded]);
        });
    }
    makeForData() {
        return ((data) => {
            const encoded = JSON.stringify(data);
            this.pubSocket.send([encoded]);
        });
    }
}
exports.Publisher = Publisher;
