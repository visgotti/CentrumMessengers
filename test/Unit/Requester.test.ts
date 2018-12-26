import { Requester } from '../../src/core/Messengers/Requester';

import { DealerSocket } from '../Mocks/zmq';

import * as assert from 'assert';
import * as mocha from 'mocha'

describe('Requester', function() {
    let requester;
    beforeEach('Initialize Requester', (done) => {
        requester = new Requester(new DealerSocket(), { timeout: 5000 });

        // sub out make functions with more bare bone logical ones.
        requester.makeForHook = function(beforeHook) {
            return (...args) => {
                return new Promise((resolve, reject) => {
                    resolve(beforeHook(...args));
                });
            }
        };

        requester.makeForData = function() {
            return (data: any) => {
                return new Promise((resolve, reject) => {
                    resolve(data);
                })
            }
        };

        done();
    });

    it('requester.makeForHook creates a function', function (done) {
        const func = requester.makeForHook(function(baz) { return baz });
        assert.deepStrictEqual(typeof func, "function");
        done();
    });

    it('requester.makeForHook causes it to run the beforeHook function when sending', function (done) {
        const func = requester.makeForHook(function(x, y) { return x + y });
        func(5, 6).then(result => {
            assert.deepStrictEqual(result, 11);
            done();
        });
    });

    it('requester.makeForData causes it to just return data when sending', function (done) {
        const func = requester.makeForData();
        func({foo: "bar"}).then(result => {
            assert.deepStrictEqual(result.foo, "bar");
            done();
        });
    });
});