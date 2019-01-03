import { Handler } from '../Centrum';
export class Subscriber {
    private subSocket: any;
    private onPublicationHandlers: Map<string, Array<Function>>;

    constructor(subSocket) {
        this.subSocket = subSocket;
        this.onPublicationHandlers = new Map();
        this.registerOnPublicationHandlers();
    }

    /**
     * Used when adding a handler for incoming requests.
     * @param name - name or names we want to link to the handler.
     * @param handler - function used to process data
     */
    public addHandler(name, handler: Handler) {
        if(!(this.onPublicationHandlers.has(name))) {
            this.onPublicationHandlers.set(name, []);
            this.subSocket.subscribe(name);
        }
        const handlers = this.onPublicationHandlers.get(name);
        handlers.push(handler);
    }

    public removeAllHandlers(name) {
        this.onPublicationHandlers.delete(name);
    }

    /**
     * removes handler of a subscription at certain index
     * returns how many handlers are left for subscription.
     * @param name
     * @param index
     * @returns {number}
     */
    public removeHandler(name, index) : number {
        const handlers = this.onPublicationHandlers.get(name);
        if(index < handlers.length) {
            handlers.splice(index, 1);
            if(handlers.length === 0) {
                this.onPublicationHandlers.delete(name);
            }
        }
        return handlers.length;
    }

    private registerOnPublicationHandlers() {
        this.subSocket.on('message', (...args) => {
            const name = args[0].toString();
            const data = JSON.parse(args[1]);
            const handlers = this.onPublicationHandlers.get(name);
            if(!(handlers)) return;
            for(let i = 0; i < handlers.length; i++) {
                handlers[i](data);
            }
        });
    }
}