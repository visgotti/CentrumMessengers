"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Subscriber {
    constructor(subSocket) {
        this.idsAssigned = 0;
        this.idsAssigned = 0;
        this.idToHandlerLookup = new Map();
        this.subSocket = subSocket;
        this.subscriptionHandlers = new Map();
        this.registerOnPublicationHandlers();
    }
    /**
     * Used when adding a handler for incoming requests.
     * @param name - name or names we want to link to the handler.
     * @param handler - function used to process data
     * @returns number - returns id of handler used for removing specific one.
     */
    addHandler(name, handler) {
        if (!(this.subscriptionHandlers.has(name))) {
            this.subscriptionHandlers.set(name, []);
            this.subSocket.subscribe(name);
        }
        const handlers = this.subscriptionHandlers.get(name);
        handler.id = this.idsAssigned++;
        this.idToHandlerLookup.set(handler.id, { name, handler });
        handlers.push(handler);
        return handler.id;
    }
    /**
     * Removes all handlers with name
     * @param name
     */
    removeAllHandlersWithName(name) {
        const handlers = this.subscriptionHandlers.get(name);
        for (let i = 0; i < handlers.length; i++) {
            this.idToHandlerLookup.delete(handlers[i].id);
        }
        this.subscriptionHandlers.delete(name);
    }
    /**
     * removes handler of a subscription at certain index
     * @param id
     * @returns { success: boolean, name: string, handlersLeft: number } data about removed handler.
     */
    removeHandlerById(id) {
        const name = this.idToHandlerLookup.get(id).name;
        const handlers = this.subscriptionHandlers.get(name);
        for (let i = 0; i < handlers.length; i++) {
            if (handlers[i].id === id) {
                this.idToHandlerLookup.delete(id);
                handlers.splice(i, 1);
                if (handlers.length === 0) {
                    this.subscriptionHandlers.delete(name);
                }
                return {
                    success: true,
                    name,
                    handlersLeft: handlers.length
                };
            }
        }
        return { success: false };
    }
    registerOnPublicationHandlers() {
        this.subSocket.on('message', (...args) => {
            const name = args[0].toString();
            const data = JSON.parse(args[1]);
            const handlers = this.subscriptionHandlers.get(name);
            if (!(handlers))
                return;
            for (let i = 0; i < handlers.length; i++) {
                handlers[i](data);
            }
        });
    }
}
exports.Subscriber = Subscriber;
