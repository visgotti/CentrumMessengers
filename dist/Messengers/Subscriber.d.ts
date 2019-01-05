import { SubscriptionHandler } from '../Centrum';
export declare class Subscriber {
    private subSocket;
    private subscriptionHandlers;
    private idToHandlerLookup;
    private idsAssigned;
    constructor(subSocket: any);
    /**
     * Used when adding a handler for incoming requests.
     * @param name - name or names we want to link to the handler.
     * @param handler - function used to process data
     * @returns number - returns id of handler used for removing specific one.
     */
    addHandler(name: any, handler: SubscriptionHandler): number;
    /**
     * Removes all handlers with name
     * @param name
     */
    removeAllHandlersWithName(name: any): void;
    /**
     * removes handler of a subscription at certain index
     * @param id
     * @returns { success: boolean, name: string, handlersLeft: number } data about removed handler.
     */
    removeHandlerById(id: any): {
        success: boolean;
        name?: string;
        handlersLeft?: number;
    };
    private registerOnPublicationHandlers;
}
