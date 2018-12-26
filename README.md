This is a refactor/rebrand of my project AreaComz

Why Centrum?

Besides the fact it sounds cool and kind of tech startupy- Centrum means "center" in
latin and I'm trying to create something that can basically centralize and organize a bunch of
distributed systems while keeping the systems completely... distributed... so uncentralized...

If that doesn't make sense don't worry about it. Centrum just sounds cool.

One of the things that confused me when I was trying to learn more about microservices
was the fact that there's no "right" way to do it. Which there isn't. But
that makes learning a little more difficult as there's millions of different
articles and opinions about it. I'm building this with an online multiplayer game
I'm building as the main motivator. So this system probably suits games best-
BUT I'm really hoping to build something that can be used to scale almost anything.

Opposed to AreaComz I am going to attempt to make it even more low level.. Instead of
having a concept of connector and area, I want to try and push a much lower level concept similar to zeromq
where your Centrum instance is just a "server" and your "server" uses different messengers which can be configured
easily to communicate with other "servers" quickly and reliably.

The end goal is going to be having 1 config file with all your server data which includes which messenger types
each server uses. Eventually I hope to make it possible to pass in only this config file and Centrum will do the rest
and create instances of the Centrum class ("servers") which will contain messengers just as you configured. Right now if you want
to create an instance you must do it manually -
new Centrum(serverId, brokerURI, options)

The first version will have available messenger options-
request, respond, notify, publish, and subscribe
right now I only have request/respond partly working and tested.

As I build up these messengers I will also be diving deep into zmq's documentation to ensure easy scalability
when and where it's needed.



EXAMPLE --------------------------------------------------------------------------------------------------

Simple request/response servers:


    Originally the broker would have been a normal parameter to the Centrum constructor, but now
    the idea is to put it inside your options if you're using a messenger that needs it. So since both
    request and response messengers use it, 'brokerURI' must be in the options and will throw an error
    if you don't provide one. Same thing for the server Ids now. They will be passed in from the options.

      var requestCentrumOptions = {
        id: "requestCentrumServer"
        brokerURI: brokerURI,
        request:
         { timeout: 1000 }  // defaults to 5000 (milliseconds)
      };

      var responseCentrumOptions = {
        id: "responseCentrumServer"
        brokerURI: brokerURI,
        response: true, // still no additional configurations needed so just use a boolean.
      };


   create the instances of each server. These should normally live on different processes at the least.
   each use a zmq dealer socket so they both need the brokerURI for routing purposes. You still need
   to manually start up a broker instance with the URI passed into response/request for them to work.

      var broker = new Broker(brokerURI, "brokerId");

      var requestServer = new Centrum(requestCentrumOptions);

      var responseServer = new Centrum(responseCentrumOptions);



   now when you want to create your request
   this will allow you to now call foo with the same parameters as the function
   and whatever it returns gets sent as a data param to the response server.

      // request name, response server id, hook/data

      requestServer.createRequest("foo", "responseCentrumServer", function(x) { return bar * 5 })

   now called like

      requestServer.requests.foo(10);

   it's asynchronous so to get the response either

      const response = await requestServer.requests.foo(10);

   or

      requestServer.requests.foo(10).then(response => {}).catch(err => {});

   if you don't want to use hook/function before sending the request and just want to simply
   send data you can omit the hook parameter completely.

       requestServer.createRequest("foo", "responseCentrumServer");

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



   This may seem a little complicated for simple request/response but the idea
   is to be able to write extensive hooks that do a lot of business logic while
   using centrum to just make sure things are being processed where they should be.

   It's still a large work in progress and have only wrote a few test cases for the request/response pattern.
   I will update the readme as the API changes and new functionality is added.







