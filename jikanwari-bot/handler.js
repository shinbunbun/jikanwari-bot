'use strict';

const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});
const AWS = require('aws-sdk');
const axios = require('axios');

module.exports.hello = async (event, context) => {
  const messageFunc = require('./message');
  const postbackFunc = require('./postback');
  const joinFunc = require('./join');
  const leaveFunc = require('./leave');
  const followFunc = require('./follow');

  let checkHeader = (event.headers || {})['X-Line-Signature'];

  const events = JSON.parse(event.body).events;
  let message;
  events.forEach(async function (event) {
    switch (event.type) {
      case 'message':
        message = await messageFunc.message(event);
        break;
      case 'postback':
        message = await postbackFunc.postback(event);
        break;
      case 'join':
        message = joinFunc.join(event);
        break;
      case 'leave':
        leaveFunc.leave(event);
        break;
      case 'follow':
        followFunc.follow(event, client);
        break;
    }
    console.log(`46${message}`);
    if (message != undefined) {
      console.log(`message: ${JSON.stringify(message)}`);
      client.replyMessage(event.replyToken, message)
        .then((response) => {
          let lambdaResponse = {
            statusCode: 200,
            headers: {
              'X-Line-Status': 'OK'
            },
            body: '{"result":"completed"}'
          };
          context.succeed(lambdaResponse);
        }).catch((err) => console.log(`${JSON.stringify(message)}\n\n\n${err}`));
    }
  });
};