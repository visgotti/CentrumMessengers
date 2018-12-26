export declare class RequestFactory {
    readonly name: string;
    private sequence;
    private beforeRequestHook;
    private requester;
    private to;
    constructor(name: any, to: any, beforeRequestHook: any, requester: any);
    make(): (...args: any[]) => Promise<{}>;
}
