Low level and lightweight messaging library that wraps around ZMQ sockets to create an API that is used in Centrum.

Simple request/response servers:

   Originally the broker would have been a normal parameter to the Messenger constructor, but now
   the idea is to put it inside your options if you're using a messenger that needs it. So since both
   request and response messengers use it, 'brokerURI' must be in the options and will throw an error
   if you don't provide one. Same thing for the server Ids now. They will be passed in from the options.

      var requestMessengerOptions = {
        id: "requestMessengerServer"
        brokerURI: brokerURI,
        request:
         { timeout: 1000 }  // defaults to 5000 (milliseconds)
      };

      var responseMessengerOptions = {
        id: "responseMessengerServer"
        brokerURI: brokerURI,
        response: true, // still no additional configurations needed so just use a boolean.
      };


   create the instances of each server. These should normally live on different processes at the least.
   each use a zmq dealer socket so they both need the brokerURI for routing purposes. You still need
   to manually start up a broker instance with the URI passed into response/request for them to work.

      var broker = new Broker(brokerURI, "brokerId");

      var requestServer = new Messenger(requestMessengerOptions);

      var responseServer = new Messenger(responseMessengerOptions);


   now when you want to create your request
   this will allow you to now call foo with the same parameters as the function
   and whatever it returns gets sent as a data param to the response server.

      // request name, response server id, hook/data

      requestServer.createRequest("foo", "responseMessengerServer", function(x) { return bar * 5 })

   now called like

      requestServer.requests.foo(10);

   it's asynchronous so to get the response either

      const response = await requestServer.requests.foo(10);

   or

      requestServer.requests.foo(10).then(response => {}).catch(err => {});

   if you don't want to use hook/function before sending the request and just want to simply
   send data you can omit the hook parameter completely.

       requestServer.createRequest("foo", "responseMessengerServer");

   now called like

      const response = await requestServer.requests.foo({ bar: "baz" });

   Now.. this won't work until you set up the responseServer. Eventually I plan on doing some sort of run-time check
   to make sure all requests have a response listening for it as well as making sure corresponding hook's follow same
   parameters.

   Creating the response
   "data" in the function is what gets returned from the function we passed in requestServer.create

      responseServer.createResponse("foo", function(data) { return data * 5 });




   This function passed in works as the hook to process incoming request data. Whatever this hook
   returns will be sent back to the request server as the asynchronous result.

   So now when you call....

      await response = requestServer.requests.foo(10);

      console.log(response) //250



    Publishers and subscribers work in a similar way.

    To create a publisher with a hook (return value gets sent to subscriber)

        example 1: (callback message)
        messenger.createPublish('firstExamplePubSub', (data) => { return data + 5 }) // takes data parameter to process then return the data to be sent

    or
        example 2: (parameter message)
        messenger.createPublish('secondExamplePubSub') //when called just takes data parameter

        then used like

        example 1: (callback message)
        messenger.publish.firstExamplePubSub(5) // sends 10 because it runs the function we created it with (data + 5)

        example 2: (parameter message)
        messenger.publish.secondExamplePubSub(5) // sends 5 because it just sends what ever gets passed into parameter.

    to remove a publisher its
        messenger.removePublish(name)

   now you need to create your subscribers. Lets call what subscribers receiving a "Publication" You can pretty much think of it as an
   emitted event in node.

   Very similar to the EventListener in node, a subscriber with a string name and it can have multiple handlers. If you
   are a bit of newbie to javascript and not understand what i mean by "multiple handlers" think of it as just an array of
   functions that get ran everytime it receives the "Publication" and each one of those functions receive the same parameter that
   was sent in the Publication.

   So right now the API for a subscriber is a bit choppy, and I will hopefully make it a bit more elegant eventually but they do
   the job and do it right.

   to create a subscriber theres two methods

        messenger.createSubscription(subscriptionName, handlerId, handler)
   or
        messenger.createOrAddSubscription(subscriptionName, handlerId, handler)

   the names arent great. If it was a perfect world and long function names were awesome I'd probably name them

   messenger.createSubscription would become
        messenger.createSubscriptionAndHandlerOnlyIfThereIsNoSubscriptionAlreadyRegisteredWithThisName

   and messenger.createOrAddSubscription would become

        messenger.createSubscriptionIfItDoesNotExistOrIfItDoesExistAddAHandlerToIt

   so yeah there you have it, psuedo code function names are the next paradigm shift in javascript just wait

   Maybe calling them MultiSub and SingleSub would be better but we'll see.

   The reason for these two functions technically isn't really a reason and you can accomplish the same exact thing if the only
   function was createOrAddSubscription.. you can just check to see if the subscription id already exist with a simple lookup
   in messenger.subscriber[lookupname] BUT.. there came a point when I was coding and realized sometimes you may not know that you only
   need one and only one handler per subscription. By using createSubscription it forces you to make sure you aren't creating duplicate handlers. Now
   this only really becomes important if you're dynamically adding/creationg pubs and subs, it makes sure your ongoing process will never try to add a second
   handler when registering subscriptions.

   this happened to me when I would initialize subscriptions with handlers in a for loop but some of them I would only want to register once if it was
   something along the lines of a "master server" action.

   It's kind of hard to explain the use case, and I'm not even quite sure if it's a good idea myself.
   But it seemed to work well in the main Centrum library and allowed me to easier specifify 1:m and 1:1 connections that I winded up labeling as pulls/push
   which may be wrong too.. but it works and it works well.

   OKAY SO BACK TO CREATE SUBSCRIPTIONS, heres an example of how messenger.createSubscription would look
        messenger.createSubscription("firstExamplePubSub", "unique", (data) => { // if you were to call these again it would throw an error.
            console.log(data) // 10 (go look back up at createPublish example 1)
        })

        or

       messenger.createOrAddSubscription("secondExamplePubSub", "not_unique_1", (data) => {
                console.log(data) // 5 (go look back up at createPublish example 2)
       })

   say its in a for loop
        for(let 1 = 0; i <= 5; i++) {
            messenger.createOrAddSubscription("secondExamplePubSub", `unique_handler_${i}`, (data) => {
                console.log('output:' + (data + i))
            })
        }

   so now if we call
        messenger.publish.secondExamplePubSub(1)

   subscription will wind up printing out
        output: 2
        output: 3
        output: 4
        output: 5
        output: 6

   then to remove any of these subscriptions you have the following functions
        removeSubscriptionById(id, name)
        removeAllSubscriptionsWithId(id)
        removeAllSubscriptionsWithName(name)
        removeAllSubscriptions()


   So that's the end of the API for now that I feel like writing about. Still need to go over my jsdoc syntax before
   making an html page for it. But I want to get this lib up on npm so I can start deploying test builds of my projects
   using my libs easier.
