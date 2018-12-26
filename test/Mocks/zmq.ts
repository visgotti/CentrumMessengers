export class DealerSocket {
    constructor() {};
    on(string, cb) { cb() }
}

export class PubSocket {
    constructor() {};
    send(any) { return any }
}