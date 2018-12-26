import { Publisher } from '../../src/core/Messengers/Publisher';

import { PubSocket } from '../Mocks/zmq';

import * as assert from 'assert';
import * as mocha from 'mocha'

describe('Publisher', function() {
    let publisher;
    beforeEach('Initialize Publisher', (done) => {
        publisher = new Publisher(new PubSocket());

        // sub out make functions with more bare bone logical ones.
        publisher.makeForHook = function(beforeHook) {
            return (...args) => {
                return new Promise((resolve, reject) => {
                    resolve(beforeHook(...args));
                });
            }
        };

        publisher.makeForData = function() {
            return (data: any) => {
                return new Promise((resolve, reject) => {
                    resolve(data);
                })
            }
        };

        done();
    });

    it('publisher.makeForHook creates a function', function (done) {
        const func = publisher.makeForHook(function(baz) { return baz });
        assert.deepStrictEqual(typeof func, "function");
        done();
    });

    it('publisher.makeForHook causes it to run the beforeHook function when sending', function (done) {
        const func = publisher.makeForHook(function(x, y) { return x + y });
        func(5, 6).then(result => {
            assert.deepStrictEqual(result, 11);
            done();
        });
    });

    it('publisher.makeForData causes it to just return data when sending', function (done) {
        const func = publisher.makeForData();
        func({foo: "bar"}).then(result => {
            assert.deepStrictEqual(result.foo, "bar");
            done();
        });
    });
});