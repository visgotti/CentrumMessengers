import { Hook, Handler } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public make(name, encode?: Function, beforeHook?: Hook, afterHandler?: Handler<Function>) {
        if(beforeHook) {
            return this.makeForBeforeHook(name, encode, beforeHook, afterHandler);
        } else {
            return this.makeForData(name, encode, afterHandler);
        }
    }

    private makeForData(name, encode, afterHandler?: Handler<Function>) {
        if(afterHandler) {
            return ((data) => {
                if(data === null) return;
                const encoded = encode ? encode(data) : data;
                this.pubSocket.send([name, encoded]);
                afterHandler(data)
            });
        } else {
            return ((data) => {
                if(data === null) return;
                const encoded = encode ? encode(data) : data;
                this.pubSocket.send([name, encoded]);
            });
        }
    }

    private makeForBeforeHook(name, encode, beforeHook: Hook, afterHandler?: Handler<Function>) {
        if(afterHandler) {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if(sendData === null) return;

                const encoded = encode ? encode(sendData) : sendData;
                this.pubSocket.send([name, encoded]);
                afterHandler(sendData);
            });
        } else {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if(sendData === null) return;

                const encoded = encode ? encode(sendData) : sendData;
                this.pubSocket.send([name, encoded]);
            });
        }
    }
}