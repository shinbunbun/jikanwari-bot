const AWS = require('aws-sdk');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');
const qs = require('qs');

module.exports.notify = async function (event, context) {
  const hour = (new Date().getHours()).toString();
  console.log(hour);
  let ttdata;
  const date = new Date(),
    dayOfWeek = date.getDay(),
    dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
  console.log(dayOfWeekStr);
  const param = {
    TableName: 'TimeTable',
    IndexName: 'flag-index',
    KeyConditionExpression: '#k = :val',
    ExpressionAttributeValues: {
      ':val': hour
    },
    ExpressionAttributeNames: {
      '#k': 'flag'
    }
  };
  await dynamoDocument.query(param, function (err, data) {
    if (err) {
      console.error('Error occured', err);
    } else {
      ttdata = data.Items;
    }
  }).promise();
  console.log(ttdata);
  console.log(ttdata.length);
  for (let i = 0; i < ttdata.length; i++) {
    let message;
    console.log(`i:${i}`);
    const notifyToken = ttdata[i].notifyToken;
    if (!notifyToken || notifyToken == 0) {
      continue;
    }
    let send_ttdata = ttdata[i];
    console.log(send_ttdata);
    try {
      if (!send_ttdata.mon) {
        continue;
      }
    } catch (e) {
      console.log(e);
      continue;
    }
    let send_tt;
    if (date.getHours() >= 12) {
      if (send_ttdata.property) {
        let property = send_ttdata.property;
        property = property.split(',');

        switch (dayOfWeekStr) {
          case '日':
            send_tt = send_ttdata.mon;
            property = property[0];
            break;
          case '土':
            continue;
          case '月':
            send_tt = send_ttdata.tue;
            property = property[1];
            break;
          case '火':
            send_tt = send_ttdata.wed;
            property = property[2];
            break;
          case '水':
            send_tt = send_ttdata.thu;
            property = property[3];
            break;
          case '木':
            send_tt = send_ttdata.fri;
            property = property[4];
            break;
          case '金':
            send_tt = send_ttdata.sat;
            property = property[5];
            break;
        }
        if (property && property !== '') {
          message = `\n ${send_tt}\n\n【持ち物】\n${property}\n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
          //console.log(message);
        } else {
          message = `\n ${send_tt} \n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
        }
      } else {
        switch (dayOfWeekStr) {
          case '日':
            send_tt = send_ttdata.mon;
            break;
          case '土':
            continue;
          case '月':
            send_tt = send_ttdata.tue;
            break;
          case '火':
            send_tt = send_ttdata.wed;
            break;
          case '水':
            send_tt = send_ttdata.thu;
            break;
          case '木':
            send_tt = send_ttdata.fri;
            break;
          case '金':
            send_tt = send_ttdata.sat;
            break;
        }
        message = `\n ${send_tt} \n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
      }
    } else {
      if (send_ttdata.property) {
        let property = send_ttdata.property;
        property = property.split(',');
        switch (dayOfWeekStr) {
          case '日':
            continue;
          case '土':
            send_tt = send_ttdata.sat;
            property = property[5];
            break;
          case '月':
            send_tt = send_ttdata.mon;
            property = property[0];
            break;
          case '火':
            send_tt = send_ttdata.tue;
            property = property[1];
            break;
          case '水':
            send_tt = send_ttdata.wed;
            property = property[2];
            break;
          case '木':
            send_tt = send_ttdata.thu;
            property = property[3];
            break;
          case '金':
            send_tt = send_ttdata.fri;
            property = property[4];
            break;
        }
        console.log(property);
        if (property && property !== '') {
          message = `\n ${send_tt}\n\n【持ち物】\n${property}\n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
        } else {
          message = `\n ${send_tt} \n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
        }
      } else {
        switch (dayOfWeekStr) {
          case '日':
            continue;
          case '土':
            send_tt = send_ttdata.sat;
            break;
          case '月':
            send_tt = send_ttdata.mon;
            break;
          case '火':
            send_tt = send_ttdata.tue;
            break;
          case '水':
            send_tt = send_ttdata.wed;
            break;
          case '木':
            send_tt = send_ttdata.thu;
            break;
          case '金':
            send_tt = send_ttdata.fri;
            break;
        }
        message = `\n ${send_tt} \n\n この時間割は時間割botから配信されています。\njikanwari-bot.shinbunbun.info`;
      }


    }
    console.log(send_tt);
    if (send_tt.match(/ありません/)) {
      continue;
    }

    await axios.post('https://notify-api.line.me/api/notify', qs.stringify({
        'message': message
      }), {
        'headers': {
          'Authorization': `Bearer ${notifyToken}`
        }
      })
      .catch((err) => {
        console.log('Error');
        console.dir(err.response.data);
        return 'err';
      });
  }
};