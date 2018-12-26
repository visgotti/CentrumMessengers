import { Hook } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public makeForHook(name, beforeHook: Hook) {
        return ((...args) => {
            const sendData = beforeHook(...args);
            const encoded = JSON.stringify(sendData);
            this.pubSocket.send([name, encoded]);
        });
    }

    public makeForData(name) {
        return ((data) => {
            const encoded = JSON.stringify(data);
            this.pubSocket.send([name, encoded]);
        });
    }
}