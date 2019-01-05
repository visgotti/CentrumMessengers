import { Hook, Handler } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public make(name, beforeHook?: Hook, afterHandler?: Handler<Function>) {
        if(beforeHook) {
            return this.makeForBeforeHook(name, beforeHook, afterHandler);
        } else {
            return this.makeForData(name, afterHandler);
        }
    }

    private makeForData(name, afterHandler?: Handler<Function>) {
        if(afterHandler) {
            return ((data) => {
                if(data === null) return;

                const encoded = JSON.stringify(data);
                this.pubSocket.send([name, encoded]);
                afterHandler(data)
            });
        } else {
            return ((data) => {
                if(data === null) return;

                const encoded = JSON.stringify(data);
                this.pubSocket.send([name, encoded]);
            });
        }
    }

    private makeForBeforeHook(name, beforeHook: Hook, afterHandler?: Handler<Function>) {
        if(afterHandler) {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if(sendData === null) return;

                const encoded = JSON.stringify(sendData);
                this.pubSocket.send([name, encoded]);
                afterHandler(sendData);
            });
        } else {
            return ((...args) => {
                const sendData = beforeHook(...args);
                if(sendData === null) return;

                const encoded = JSON.stringify(sendData);
                this.pubSocket.send([name, encoded]);
            });
        }
    }
}