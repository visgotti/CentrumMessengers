import { Hook } from '../Centrum';
export declare class Publisher {
    private pubSocket;
    constructor(pubSocket: any);
    makeForHook(beforeHook: Hook): (...args: any[]) => void;
    makeForData(): (data: any) => void;
}
