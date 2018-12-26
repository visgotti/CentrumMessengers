import { RequestFactory } from '../../../src/core/Messengers/Request/RequestFactory';
import { Requester } from '../../../src/core/Messengers/Request/Requester';

import * as assert from 'assert';
import * as mocha from 'mocha'

describe('Request Factory', function() {
    let requestFactory;
    let mockRequester;
    beforeEach('Initialize RequestFactory', (done) => {
        mockRequester = { sendRequest: function(data, name, to, callback) { return callback(null, data) } } as Requester;
        requestFactory = new RequestFactory("test_request", "test_id", function(x, y) { return x + y }, mockRequester);
        done();
    });

    it('requestFactory.make creates function', function (done) {
        const func = requestFactory.make();
        assert.deepStrictEqual(typeof func, "function");
        done();
    });

    it('correctly runs the beforeHook function when sending', function (done) {
        const func = requestFactory.make();
        func(5, 6).then(result => {
            assert.deepStrictEqual(result, 11);
            done();
        });
    });

});