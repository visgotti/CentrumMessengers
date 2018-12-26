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

   Creating the broker is vital since it uses zmq's router socket to make sure requests and responses get
   to the correct destination.. all you need to do is call the constructor with a URI and ID.

   eventually a lot of this will be done in the centrum loader automatically from your centrum.config when I get around to it.

      var brokerURI = "tcp://127.0.0.1:4200";

      var broker = new Broker(brokerURI, "broker_id");


   this is all CentrumOptions look like for now.. eventually as I build the library I will find new uses for the options instead
   of just telling Centrum which messengers it's using. This is also why I'm keeping it like this for now if you look into
   Centrum.ts you can see how the initializeMessenger function works and by doing this way I will be able easily add new option processing
   in the future.

      var requestOptions = { request: true };

      var responseOptions = { response: true };



    create the instances of each server. These should normally live on different processes at the least.
    each use a zmq dealer socket so they both need the brokerURI for routing purposes.


      var requestServer = new Centrum("request server", brokerURI, requestOptions);

      var responseServer = new Centrum("response server", brokerURI, responseOptions);



    now when you want to create your request
    this will allow you to now call foo with the same parameters as the function
    and whatever it returns gets sent as a data param to the response server.


      requestServer.create("foo", "response server", function(x) { return bar * 5 })

   now called like

      requestServer.requests.foo(10);

   it's asynchronous so to get the response either

      await response = requestServer.requests.foo(10);

   or

      requestServer.requests.foo(10).then(response => {}).catch(err => {});



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







