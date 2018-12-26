import { Handler } from '../Centrum';
export class Subscriber {
    private subSocket: any;
    private onPublicationHandlers: Map<string, Function>;

    constructor(subSocket) {
        this.subSocket = subSocket;
        this.onPublicationHandlers = new Map();
        this.registerOnPublicationHandlers();
    }

    /**
     * Used when adding a handler for incoming requests.
     * @param name - name of the request
     * @param handler - function used to process data
     */
    public addHandler(name, handler: Handler) {
        this.onPublicationHandlers.set(name, handler);
        this.subSocket.subscribe(name);
    }

    public removeHandler(name) {
        this.onPublicationHandlers.delete(name);
    }

    private registerOnPublicationHandlers() {
        this.subSocket.on('message', (...args) => {
            const name = args[0].toString();
            const data = JSON.parse(args[1]);
            const handler = this.onPublicationHandlers.get(name);
            if(handler) {
                handler(data);
            }
        });
    }
}