import * as assert from 'assert';
import * as mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

import { Broker } from '../../src/core/Broker';
import { Messenger } from '../../src/core/Messenger';

describe('Request to response server communication', function() {
    let config: any;
    let broker;
    let requestServer;
    let responseServer;

    before('Initialize two servers, one as a requester, one as a responder.', (done) => {
        config = fs.readFileSync(path.resolve('test', 'messenger.config.json'));
        config = JSON.parse(config);
        let brokerURI = config.broker.URI;
        broker = new Broker(brokerURI, "TEST_BROKER");

        for(let i = 0; i < config.servers.length; i++) {
            const serverData = config.servers[i];
            if (!("request" in serverData.messengerOptions) && !("response" in serverData.messengerOptions)) continue;
            let server = new Messenger(serverData.messengerOptions);

            if (serverData.messengerOptions["request"]) {
                requestServer = server;
            } else if (serverData.messengerOptions["response"]) {
                responseServer = server;
            }
        }
        setTimeout(() => {
            done();
        }, 500)
    });

    describe('Sending a request', function() {
        it('Sends data returned from the hook in createRequest and retrives data returned from hook in createResponse.', function(done) {
            requestServer.createRequest("foo", responseServer.serverId, function(x, y) {
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

        it('Sends data without a hook and retrives data returned from hook in createResponse.', function(done) {
            let mockRequestData = { bar: "baz" };
            requestServer.createRequest("foo2", responseServer.serverId,);

            responseServer.createResponse("foo2", function(data) {
                assert.deepStrictEqual(data, mockRequestData);
                data.bar = "baz2";
                return data;
            });

            requestServer.requests.foo2({ bar: "baz" }).then(response => {
                assert.strictEqual(response.bar, "baz2");
                done();
            });
        });
    });
});