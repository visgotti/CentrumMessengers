import { Hook } from '../Centrum';

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public makeForHook(beforeHook: Hook) {
        return ((...args) => {
            const sendData = beforeHook(...args);
            const encoded = JSON.stringify(sendData);
            this.pubSocket.send([encoded]);
        });
    }

    public makeForData() {
        return ((data) => {
            const encoded = JSON.stringify(data);
            this.pubSocket.send([encoded]);
        });
    }
}