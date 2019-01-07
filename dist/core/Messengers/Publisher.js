"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Publisher {
    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }
    make(name, encode, beforeHook, afterHandler) {
        if (beforeHook) {
            return this.makeForBeforeHook(name, encode, beforeHook, afterHandler);
        }
        else {
            return this.makeForData(name, encode, afterHandler);
        }
    }
    makeForData(name, encode, afterHandler) {
        if (afterHandler) {
            return ((data) => {
                if (data === null)
                    return;
                const encoded = encode ? encode(data) : data;
                this.pubSocket.send([name, encoded]);
                afterHandler(data);
            });
        }
        else {
            return ((data) => {
                if (data === null)
                    return;
                const encoded = encode ? encode(data) : data;
                this.pubSocket.send([name, encoded]);
            });
        }
    }
    makeForBeforeHook(name, encode, beforeHook, afterHandler) {
        if (afterHandler) {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if (sendData === null)
                    return;
                const encoded = encode ? encode(sendData) : sendData;
                this.pubSocket.send([name, encoded]);
                afterHandler(sendData);
            });
        }
        else {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if (sendData === null)
                    return;
                const encoded = encode ? encode(sendData) : sendData;
                this.pubSocket.send([name, encoded]);
            });
        }
    }
}
exports.Publisher = Publisher;
