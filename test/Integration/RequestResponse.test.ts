import * as assert from 'assert';
import * as mocha from 'mocha'
import * as fs from 'fs';
import * as path from 'path';

import { Broker } from '../../src/core/Broker';
import { Centrum } from '../../src/core/Centrum';

describe('Request to response server communication', function() {
    let config: any;
    let broker;
    let requestServer;
    let responseServer;

    const responseServerId = 'testResponseServer';
    const requestServerId = 'testRequestServer';

    before('Initialize two servers, one with a requester, one with a responder.', (done) => {
        config = fs.readFileSync(path.resolve('test', 'centrum.config.json'));
        config = JSON.parse(config);
        let brokerURI = config.broker.ROUTER_URI;
        broker = new Broker(brokerURI, "TEST_BROKER");

        const requestOptions = { "request": true };
        const responseOptions = { "respond": true };

        requestServer = new Centrum(requestServerId, brokerURI, requestOptions);
        responseServer = new Centrum(responseServerId, brokerURI, responseOptions);

        setTimeout(() => {
            done();
        }, 500)
    });

    describe('Sending a request', function() {
        it('Sends data returned from the hook in createRequest and retrives data returned from hook in createResponse.', function(done) {
            requestServer.createRequest("foo", responseServerId, function(x, y) {
                assert.strictEqual(x, 5);
                assert.strictEqual(y, 7);
                return x + y;
            });

            responseServer.createResponse("foo", function(data) {
                assert.strictEqual(data, 12);
                return data + 10;
            });

            requestServer.requests.foo(5, 7).then(response => {
                assert.strictEqual(response, 22);
                done();
            });

        });
    });

});