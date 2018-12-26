import * as assert from 'assert';
import * as mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

import { Centrum } from '../../src/core/Centrum';

describe('Request to response server communication', function() {
    let config: any;
    let pubServers = [];
    let subServers = [];

    before('Initialize three servers, two publishers, one subscriber.', (done) => {
        config = fs.readFileSync(path.resolve('test', 'centrum.config.json'));
        config = JSON.parse(config);

        for(let i = 0; i < config.servers.length; i++) {
            const serverData = config.servers[i];

            if(!("publish" in serverData.centrumOptions) && !("subscribe" in serverData.centrumOptions)) continue;

            let server = new Centrum(serverData.centrumOptions);

            if(serverData.centrumOptions["publish"]) {
                pubServers.push(server);
            } else if (serverData.centrumOptions["subscribe"]) {
                subServers.push(server);
            }
        }

        setTimeout(() => {
            assert.strictEqual(pubServers.length, 2);
            assert.strictEqual(subServers.length, 2);
            done();
        }, 500)
    });
    it('Sends publication to 1 subscriber', function(done) {
        let sub1Correct = false;
        let sub2Correct = true;

        pubServers[0].createPublish("foo", function(bar, baz) {
            return bar * baz
        });
        subServers[0].createSubscription("foo", function(data) {
            assert.strictEqual(data, 10);
            if(data === 10) {
                sub1Correct = true;
            }
        });

        subServers[1].createSubscription("foo2", function(data) {
            sub2Correct = false;
        });

        setTimeout(() => {
            assert.strictEqual(sub1Correct && sub2Correct, true);
            done();
        }, 200);

        pubServers[0].publish.foo(2, 5);
    });

    it('Sends publication from both publishers to both subscribers', function(done) {
        pubServers[0].createPublish("foo3", function(bar, baz) {
            return bar * baz
        });

        pubServers[1].createPublish("foo3", function(bar, baz, foo) {
            return bar * baz * foo
        });

        let sub1Expected = [10, 12, 20, 30, 40];
        let sub2Expected = [10, 12, 20, 30, 40];

        subServers[0].createSubscription("foo3", function(data) {
            sub1Expected = sub1Expected.filter(val =>  val !== data);
        });

        subServers[1].createSubscription("foo3", function(data) {
            sub2Expected = sub2Expected.filter(val => val !== data);
        });

        pubServers[0].publish.foo3(2, 5);
        pubServers[0].publish.foo3(2, 6);
        pubServers[1].publish.foo3(2, 5, 2);
        pubServers[1].publish.foo3(2, 5, 3);
        pubServers[1].publish.foo3(2, 5, 4);

        setTimeout(() => {
            // all sub1Expected and sub2Expected should have had the values filtered out
            assert.strictEqual(sub1Expected.length, 0);
            assert.strictEqual(sub2Expected.length, 0);
            done();
        }, 200);

    });

});