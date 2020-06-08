'use strict';

const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});
const AWS = require('aws-sdk');
const axios = require('axios');
const crypto = require('crypto');

module.exports.bot = (event, context) => {

  //署名検証
  let signature = crypto.createHmac('sha256', process.env.CHANNELSECRET).update(event.body).digest('base64');
  let checkHeader = (event.headers || {})['X-Line-Signature'];

  const events = JSON.parse(event.body).events;
  let message;
  if (signature === checkHeader) {
    events.forEach(async function (event) {
      switch (event.type) {
        case 'message':
          const messageFunc = require('./message');
          message = await messageFunc.message(event);
          break;
        case 'postback':
          const postbackFunc = require('./postback');
          message = await postbackFunc.postback(event);
          break;
        case 'join':
          const joinFunc = require('./join');
          message = joinFunc.join(event);
          break;
        case 'leave':
          const leaveFunc = require('./leave');
          leaveFunc.leave(event);
          break;
        case 'follow':
          const followFunc = require('./follow');
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
  } else {
    console.log('署名認証エラー');
  }
};