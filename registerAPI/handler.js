const AWS = require('aws-sdk');
const line = require('@line/bot-sdk');
const axios = require('axios');
const qs = require('qs');
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});
const dynamoDocument = new AWS.DynamoDB.DocumentClient();

module.exports.registerAPI = async (event, context, callback) => {
  const data = JSON.parse(event.body).data;
  console.log(data);

  const res = await axios.post('https://api.line.me/oauth2/v2.1/verify', qs.stringify({
      'id_token': data.idToken,
      'client_id': process.env.CHANNELID
    }))
    .catch((err) => {
      console.log(`Error: ${JSON.stringify(err.response.data)}`);
      return 'err';
    });

  console.log(res);


  const monday = data.monday,
    tuesday = data.tuesday,
    wednesday = data.wednesday,
    thursday = data.thursday,
    friday = data.friday,
    saturday = data.saturday,
    uuid = data.uuid,
    date = getDate(),
    property = data.property;
  let Mon = [],
    Tue = [],
    Wed = [],
    Thu = [],
    Fri = [],
    Sat = [];
  for (let i = 0; i < 8; i++) {
    if (monday[i] != '') {
      Mon.push(i + '.' + monday[i] + '\n');
    }
    if (tuesday[i] != '') {
      Tue.push(i + '.' + tuesday[i] + '\n');
    }
    if (wednesday[i] != '') {
      Wed.push(i + '.' + wednesday[i] + '\n');
    }
    if (thursday[i] != '') {
      Thu.push(i + '.' + thursday[i] + '\n');
    }
    if (friday[i] != '') {
      Fri.push(i + '.' + friday[i] + '\n');
    }
    if (saturday[i] != '') {
      Sat.push(i + '.' + saturday[i] + '\n');
    }
  }
  let sendMon,
    sendTue,
    sendWed,
    sendThu,
    sendFri,
    sendSat;

  if (Mon[0] == undefined) {
    sendMon = 'ありません';
  } else {
    for (let i = 0; i < Mon.length; i++) {
      if (i == 0) {
        sendMon = Mon[0];
      } else {
        sendMon = sendMon + Mon[i];
      }
    }
    sendMon = sendMon.slice(0, -1);
  }
  if (Tue[0] == undefined) {
    sendTue = 'ありません';
  } else {
    for (let i = 0; i < Tue.length; i++) {
      if (i == 0) {
        sendTue = Tue[0];
      } else {
        sendTue = sendTue + Tue[i];
      }
    }
    sendTue = sendTue.slice(0, -1);
  }
  if (Wed[0] == undefined) {
    sendWed = 'ありません';
  } else {
    for (let i = 0; i < Wed.length; i++) {
      if (i == 0) {
        sendWed = Wed[0];
      } else {
        sendWed = sendWed + Wed[i];
      }
    }
    sendWed = sendWed.slice(0, -1);
  }
  if (Thu[0] == undefined) {
    sendThu = 'ありません';
  } else {
    for (let i = 0; i < Thu.length; i++) {
      if (i == 0) {
        sendThu = Thu[0];
      } else {
        sendThu = sendThu + Thu[i];
      }
    }
    sendThu = sendThu.slice(0, -1);
  }
  if (Fri[0] == undefined) {
    sendFri = 'ありません';
  } else {
    for (let i = 0; i < Fri.length; i++) {
      if (i == 0) {
        sendFri = Fri[0];
      } else {
        sendFri = sendFri + Fri[i];
      }
    }
    sendFri = sendFri.slice(0, -1);
  }
  if (Sat[0] == undefined) {
    sendSat = 'ありません';
  } else {
    for (let i = 0; i < Sat.length; i++) {
      if (i == 0) {
        sendSat = Sat[0];
      } else {
        sendSat = sendSat + Sat[i];
      }
    }
    sendSat = sendSat.slice(0, -1);
  }
  if (uuid === 'nonehftd52') {
    var param = {
      TableName: 'TimeTable',
      Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
        ID: userId
      },
      ExpressionAttributeNames: {
        '#mon': 'mon',
        '#tue': 'tue',
        '#wed': 'wed',
        '#thu': 'thu',
        '#fri': 'fri',
        '#sat': 'sat',
        // '#flag': 'flag',
        '#date': 'date',
        '#property': 'property'
      },
      ExpressionAttributeValues: {
        ':mon': '【月曜日】\n' + sendMon,
        ':tue': '【火曜日】\n' + sendTue,
        ':wed': '【水曜日】\n' + sendWed,
        ':thu': '【木曜日】\n' + sendThu,
        ':fri': '【金曜日】\n' + sendFri,
        ':sat': '【土曜日】\n' + sendSat,
        // ':flag': '25',
        ':date': date.toString(),
        ':property': property
        //name属性を更新する
      },
      UpdateExpression: 'SET #mon = :mon, #tue = :tue, #wed = :wed, #thu = :thu, #fri = :fri, #sat = :sat, #date = :date, #property = :property'
    };
  } else {
    var param = {
      TableName: 'TimeTable',
      Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
        ID: userId
      },
      ExpressionAttributeNames: {
        '#mon': 'mon',
        '#tue': 'tue',
        '#wed': 'wed',
        '#thu': 'thu',
        '#fri': 'fri',
        '#sat': 'sat',
        // '#flag': 'flag',
        '#uuid': 'uuid',
        '#date': 'date',
        '#property': 'property'
      },
      ExpressionAttributeValues: {
        ':mon': '【月曜日】\n' + sendMon,
        ':tue': '【火曜日】\n' + sendTue,
        ':wed': '【水曜日】\n' + sendWed,
        ':thu': '【木曜日】\n' + sendThu,
        ':fri': '【金曜日】\n' + sendFri,
        ':sat': '【土曜日】\n' + sendSat,
        // ':flag': '25',
        ':uuid': uuid,
        ':date': date.toString(),
        ':property': property,
        //name属性を更新する
      },
      UpdateExpression: 'SET #mon = :mon, #tue = :tue, #wed = :wed, #thu = :thu, #fri = :fri, #sat = :sat, #uuid = :uuid, #date = :date, #property = :property'
    };
  }
  await dynamoDocument.update(param, function (err, data) {
    if (err) {
      console.error('Error occured', err);
    } else {
      console.log(data);
    }
  }).promise();
  client.linkRichMenuToUser(userId, process.env.richmenu1);

  const responseData = {
    statusCode: '200',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      'message': 'succeed'
    })
  };
  callback(null, responseData);


  function getDate() {
    const now = new Date();
    let y = now.getFullYear(),
      m = now.getMonth() + 1,
      d = now.getDate(),
      w = now.getDay(),
      h = now.getHours(),
      min = now.getMinutes(),
      s = now.getSeconds();

    const wNames = ['日', '月', '火', '水', '木', '金', '土'];

    if (m < 10) {
      m = '0' + m;
    }
    if (d < 10) {
      d = '0' + d;
    }

    return y + '年' + m + '月' + d + '日 (' + wNames[w] + ') ' + h + '時' + min + '分' + s + '秒';
  };

};