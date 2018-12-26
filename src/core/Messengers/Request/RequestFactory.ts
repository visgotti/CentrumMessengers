import { Requester } from './Requester';
import { Sequence, Hook } from '../../Centrum';

export class RequestFactory {
    readonly name: string;
    private sequence: Sequence;
    private beforeRequestHook: Hook;
    private requester: Requester;
    private to: string;

    constructor(name, to, beforeRequestHook, requester) {
        this.name = name;
        this.to = to;
        this.requester = requester;
        this.sequence = 0;
        this.beforeRequestHook = beforeRequestHook;
    }

    public make() {
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