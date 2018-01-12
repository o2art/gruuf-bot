'use strict';

// Imports dependencies and set up http server
const 
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  register_subscribe_hook = require('./register_subscribe_hook'),
  callSendAPI = require('./callSendApi');

// Sets server port and logs message on success
app.listen(process.env.PORT || 8080, () => console.log('webhook is listening'));

// register subscribe confirmation handler
register_subscribe_hook(app);

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(JSON.stringify(webhook_event));

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else {
        handleNonMessage(sender_psid);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text": "You sent the message: " + received_message.text
    }
  }  
  
  // Sends the response message
  callSendAPI(sender_psid, response);    
}

function handleNonMessage(sender_psid) {
  // Create the payload for a basic text message
  let response = {
    "text": 'Sorry but I only support text messages.'
  };
  
  // Sends the response message
  callSendAPI(sender_psid, response);    
}
