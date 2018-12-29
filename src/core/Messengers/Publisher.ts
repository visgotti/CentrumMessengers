import { Hook, Handler } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public make(name, beforeHook?: Hook, afterHandler?: Handler) {
        if(beforeHook) {
            return this.makeForBeforeHook(name, beforeHook, afterHandler);
        } else {
            return this.makeForData(name, afterHandler);
        }
    }

    private makeForData(name, afterHandler?: Handler) {
        if(afterHandler) {
            return ((data) => {
                const encoded = JSON.stringify(data);
                this.pubSocket.send([name, encoded]);
                afterHandler(data)
            });
        } else {
            return ((data) => {
                const encoded = JSON.stringify(data);
                this.pubSocket.send([name, encoded]);
            });
        }
    }

    private makeForBeforeHook(name, beforeHook: Hook, afterHandler?: Handler) {
        if(afterHandler) {
            return ((...args) => {
                const sendData = beforeHook(...args);
                const encoded = JSON.stringify(sendData);
                this.pubSocket.send([name, encoded]);
                afterHandler(sendData);
            });
        } else {
            return ((...args) => {
                const sendData = beforeHook(...args);
                const encoded = JSON.stringify(sendData);
                this.pubSocket.send([name, encoded]);
            });
        }
    }
}