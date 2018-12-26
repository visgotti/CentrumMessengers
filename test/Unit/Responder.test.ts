import { DealerSocket } from '../Mocks/zmq';

import { Responder } from '../../src/core/Messengers/Responder';

import * as assert from 'assert';
import * as mocha from 'mocha'

describe('Responder', function() {
    let mockResponder;
    let dealerSocket;
    beforeEach('Initialize Responder', (done) => {
        dealerSocket = new DealerSocket();
        mockResponder = new Responder(dealerSocket);
        done();
    });

    it('responder.addOnRequestHandler adds hook', function (done) {
        mockResponder.addOnRequestHandler("foo", function(bar) { return bar });
        assert.deepStrictEqual(mockResponder.removeOnRequestHandler("foo"), true);
        done();
    });
});