import { Hook, Handler } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public make(name, encode?: Function, beforeHook?: Hook) {
        if(beforeHook) {
            return this.makeForBeforeHook(name, encode, beforeHook);
        } else {
            return this.makeForData(name, encode,);
        }
    }

    private makeForData(name, encode) {
            return ((data) => {
                if(data === null) return;
                const encoded = encode ? encode(data) : data;
                this.pubSocket.send([name, encoded]);
            });
    }

    private makeForBeforeHook(name, encode, beforeHook: Hook) {
        return ((...args) => {
            const sendData = beforeHook(...args);
            if(sendData === null) return;

            const encoded = encode ? encode(sendData) : sendData;
            this.pubSocket.send([name, encoded]);
        })
    }
}