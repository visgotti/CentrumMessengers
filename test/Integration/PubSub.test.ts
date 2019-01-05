import * as assert from 'assert';
import * as mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

import { Centrum } from '../../src/core/Centrum';

describe('Publish to subscription communication', function() {
    let config: any;
    let pubServers = [];
    let subServers = [];
    let pub1Calls = 0;
    let pub2Calls = 0;

    before('Initialize four servers, two publishers, two subscribers', (done) => {
        config = fs.readFileSync(path.resolve('test', 'centrum.config.json'));
        config = JSON.parse(config);

        pub1Calls = 0;
        pub2Calls = 0;

        pubServers.length = 0;
        subServers.length = 0;

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
        }, 10)
    });

    //TODO: figure out why I need to wait so long between each test for them to pass.
    beforeEach((done) => {
        setTimeout(() => {
            done();
        }, 10)
    });

    afterEach((done) => {
        setTimeout(() => {
            done();
        }, 10);
    });

    it('Sends publication to 1 subscriber', function(done) {
        let sub1Correct = false;
        let sub2Correct = true;

        pubServers[0].createPublish("foo", function(bar, baz) {
            return bar * baz
        });

        subServers[0].createSubscription("foo", 'foo', function(data) {
            assert.strictEqual(data, 10);
            if(data === 10) {
                sub1Correct = true;
            }
        });

        subServers[1].createSubscription("_foo", '_foo', function(data) {
            sub2Correct = false;
        });

        pubServers[0].publish.foo(2, 5);

        setTimeout(() => {
            assert.strictEqual(sub1Correct, true);
            assert.strictEqual(sub2Correct, true);
            done();
        }, 10);
    });

    it('Sends publication from both publishers to both subscribers', function(done) {
        pubServers[0].createPublish("foo1", function(bar, baz) {
            return bar * baz
        });

        pubServers[1].createPublish("foo1", function(bar, baz, foo) {
            return bar * baz * foo
        });

        let sub1Expected = [10, 12, 20, 30, 40];
        let sub2Expected = [10, 12, 20, 30, 40];

        subServers[0].createSubscription("foo1", "foo1", function(data) {
            sub1Expected = sub1Expected.filter(val =>  val !== data);
        });

        subServers[1].createSubscription("foo1", "foo1", function(data) {
            sub2Expected = sub2Expected.filter(val => val !== data);
        });

        pubServers[0].publish.foo1(2, 5);
        pubServers[0].publish.foo1(2, 6);
        pubServers[1].publish.foo1(2, 5, 2);
        pubServers[1].publish.foo1(2, 5, 3);
        pubServers[1].publish.foo1(2, 5, 4);

        setTimeout(() => {
            // all sub1Expected and sub2Expected should have had the values filtered out
            assert.strictEqual(sub1Expected.length, 0);
            assert.strictEqual(sub2Expected.length, 0);
            if(sub1Expected.length > 0) {
                console.log(sub1Expected)
            }
            if(sub2Expected.length > 0) {
                console.log(sub2Expected)
            }
            done();
        }, 10);
    });

    it('Executes the after handler correctly', function(done) {
        let afterHandlerValue = 0;
        pubServers[0].createPublish("afterTest", function(bar, baz) {
            return bar * baz
        }, function(data) {
            afterHandlerValue = data + 5;
        });

        subServers[0].createSubscription("afterTest", "afterTest", function(data) {
            assert.strictEqual(data, 10);
        });

        pubServers[0].publish.afterTest(2, 5);

        setTimeout(() => {
            // all sub1Expected and sub2Expected should have had the values filtered out
            assert.strictEqual(afterHandlerValue, 15);
            done();
        }, 10);
    });

    it('Centrum.removePublish removes ability to call the publish', function(done) {
        pubServers[0].createPublish("foo2", function(bar, baz) {
            return bar * baz
        });
        pubServers[1].createPublish("foo2", function(bar, baz, foo) {
            return bar * baz * foo;
        });

        let expectedPub1Calls = 4;
        let expectedPub2Calls = 2;
        let removedPub2 = false;

        subServers[0].createSubscription("foo2", "foo2", function(data) {
            if(data === 10) {
                // was pub1
                pub1Calls++;
            } else if (data === 20) {
                pub2Calls++;
            } else {
                throw "Pubs should only send over 10 or 20"
            }
            checkPubCalls();
        });

        subServers[1].createSubscription("foo2", "foo2", function(data) {
            if(data === 10) {
                pub1Calls++;
            } else if (data === 20) {
                pub2Calls++;
            } else {
                throw "Pubs should only send over 10 or 20"
            }
            checkPubCalls();
        });

        pubServers[0].publish.foo2(2, 5);
        pubServers[1].publish.foo2(2, 5, 2);

        const checkPubCalls = () => {
            if(pub2Calls === 2 && removedPub2 === false) {
            // removing pub2 and sending another publish with pub1
                pubServers[1].removePublish("foo2");
                pubServers[0].publish.foo2(2, 5);
                assert.throws(() => { pubServers[1].publish.foo2(2, 5, 2) });
                removedPub2 = true;
            }
        };

        setTimeout(() => {
            assert.strictEqual(pub1Calls, expectedPub1Calls);
            assert.strictEqual(pub2Calls, expectedPub2Calls);
            done();
        }, 100);
    });

    it('Centrum.removeAllSubscriptionsWithName stops all instances with name foo3 from receiving published data', function(done) {
        let sub1Received = 0;
        let sub2Received = 0;

        pubServers[0].createPublish("foo3");

        subServers[0].createSubscription("foo3", "foo3", (data) => {
            sub1Received += data;
            if(sub1Received === 5) {
                subServers[0].removeAllSubscriptionsWithName("foo3");
            }
        });

        subServers[1].createSubscription("foo3", "foo3", (data) => {
            sub2Received += data;
        });

        for(let i = 0; i < 10; i++) {
            setTimeout(() => {
                pubServers[0].publish.foo3(1);
            }, 0);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 5);
            assert.strictEqual(sub2Received, 10);
            done();
        }, 10);
    });

    it('centrum.subscriber.addHandler and centrum.addOrCreateSubscription both register multiple handlers for a subscriber', function(done) {
        let sub1Received = 0;

        pubServers[0].createPublish("foo4");

        subServers[0].createSubscription("foo4", "foo4-1", (data) => {
            sub1Received += data;
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-2", (data) => {
            sub1Received += data;
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-3", (data) => {
            sub1Received -= data;
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-4", (data) => {
            sub1Received -= data;
        });

        for(let i = 0; i < 10; i++) {
            pubServers[0].publish.foo4(1);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 0);
            done();
        }, 10);
    });

    it('centrum.removeSubscriptionById removes only 1', function(done) {
        let sub1Received = 0;

        pubServers[0].createPublish("foo5");

        subServers[0].createSubscription("foo5", "foo5-1", (data) => {
            sub1Received += data;
        });

        // save id of subscription handler that subtracts from the received data.
        const id = "foo5-2";
        subServers[0].createOrAddSubscription("foo5", id, (data) => {
            sub1Received -= data;
        });

        for(let i = 0; i < 10; i++) {
            pubServers[0].publish.foo5(1);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 0);
            const handlersLeft = subServers[0].removeSubscriptionById(id, "foo5");
            assert.strictEqual(handlersLeft, 1);
            for(let i = 0; i < 10; i++) {
                // now when we publish the subtract handler shouldnt be happening anymore
                pubServers[0].publish.foo5(1);
            }

            setTimeout(() => {
                assert.strictEqual(sub1Received, 10);
                done();
            }, 10);

        }, 10);
    });

    it('centrum.removeAllSubscriptionsWithId removes all subscriptions with the id', function(done) {
        let sub1Received = 0;

        const id = "id-1";

        pubServers[0].createPublish("foo6");
        pubServers[0].createPublish("foo7");

        subServers[0].createSubscription("foo6", id, (data) => {
            sub1Received += data;
        });

        subServers[0].createOrAddSubscription("foo7", id, (data) => {
            sub1Received -= data;
        });

        subServers[0].createOrAddSubscription("foo7", "different_id", (data) => {
            sub1Received += data;
        });

        for(let i = 0; i < 10; i++) {
            pubServers[0].publish.foo6(1);
            pubServers[0].publish.foo7(1);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 10);
            const handlersRemoved = subServers[0].removeAllSubscriptionsWithId(id);
            assert.strictEqual(handlersRemoved, 2);
            for(let i = 0; i < 10; i++) {
                // now when we publish the subtract handler shouldnt be happening anymore
                pubServers[0].publish.foo7(1);
            }

            setTimeout(() => {
                assert.strictEqual(sub1Received, 20);
                done();
            }, 10);

        }, 10);
    });

});