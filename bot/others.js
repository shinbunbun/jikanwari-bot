const line = require('@line/bot-sdk');
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});
const axios = require('axios');

const getDate2 = () => {
    var now = new Date();
    // 「年」「月」「日」「曜日」を Date オブジェクトから取り出してそれぞれに代入
    var y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate(),
        w = now.getDay(),
        h = now.getHours(),
        min = now.getMinutes(),
        s = now.getSeconds(),
        mil = now.getMilliseconds();

    // 曜日の表記を文字列の配列で指定
    var wNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 「月」と「日」で1桁だったときに頭に 0 をつける
    if (m < 10) {
        m = '0' + m;
    }
    if (d < 10) {
        d = '0' + d;
    }
    if (h < 10) {
        h = '0' + h;
    }
    if (min < 10) {
        min = '0' + min;
    }
    if (s < 10) {
        s = '0' + s;
    }

    // フォーマットを整形してコンソールに出力
    return y + '-' + m + '-' + d + 'T' + h + ':' + min + ':' + s + ':' + mil;
};

exports.getDate = () => {
    var now = new Date();
    // 「年」「月」「日」「曜日」を Date オブジェクトから取り出してそれぞれに代入
    var y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate(),
        w = now.getDay(),
        h = now.getHours(),
        min = now.getMinutes(),
        s = now.getSeconds();

    // 曜日の表記を文字列の配列で指定
    var wNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 「月」と「日」で1桁だったときに頭に 0 をつける
    if (m < 10) {
        m = '0' + m;
    }
    if (d < 10) {
        d = '0' + d;
    }

    // フォーマットを整形してコンソールに出力
    return y + '年' + m + '月' + d + '日 (' + wNames[w] + ') ' + h + '時' + min + '分' + s + '秒';
};

exports.getUniqueStr = (myStrong) => {
    var strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
};

exports.getUuid = () => {
    const node_uuid = require('node-uuid');
    return node_uuid.v4();
};

exports.trainRegister = (userMessage, userId) => {
    const AWS = require('aws-sdk');
    const dynamoDocument = new AWS.DynamoDB.DocumentClient();
    const tableName = 'TimeTable';
    let train,
        trainFlag;
    if (userMessage == '路線削除') {
        train = '0';
        trainFlag = '0';
    } else {
        train = userMessage.replace(/路線登録:/g, '');
        trainFlag = '6';
    }
    let param = {
        TableName: tableName,
        Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
            ID: userId
        },
        ExpressionAttributeNames: {
            '#t': 'train',
            '#f': 'trainFlag'
        },
        ExpressionAttributeValues: {
            ':train': train, //name属性を更新する
            ':trainFlag': trainFlag
        },
        UpdateExpression: 'SET #t = :train, #f = :trainFlag'
    };
    dynamoDocument.update(param, function (err, data) {
        if (err) {
            console.error('Error occured', err);
        }
    });
};

exports.trainInfo = async (e) => {
    const requestOptions = {
        url: 'https://tetsudo.rti-giken.jp/free/delay.json',
        method: 'GET'
    };
    const body = JSON.parse(await doRequest(requestOptions));
    console.log(body);
    const name = [];
    for (var i = 0; i < body.length; i++) {
        name.push(body[i].name);
        //console.log(i);
    }
    console.log(name);
    return name;
};

exports.getWeather = async (e) => {
    console.log(e);
    const main = async () => {
        try {
            const res = await axios.request({
                method: 'GET',
                baseURL: `http://api.openweathermap.org/data/2.5/forecast?zip=${e},jp&APPID=9a15bd04421029dd19b7f1a1a092f02b`
            });
            return res.data;
        } catch (error) {
            return error.response.data;
        }
    };
    const res = await main();
    console.log(res);
    if (res.cod !== '200') {
        return 'err';
    }
    return res;
    /*const requestOptions = {
        url: `http://api.openweathermap.org/data/2.5/forecast?zip=${e},jp&APPID=9a15bd04421029dd19b7f1a1a092f02b`,
        method: "GET"
    };
    const body = JSON.parse(await doRequest(requestOptions));
    console.log(body);
    return body;*/
};

exports.confirmPostalCode = async (e) => {
    console.log(146);
    const requestOptions = {
        url: `http://zipcloud.ibsnet.co.jp/api/search?zipcode=${e}`,
        method: 'GET'
    };
    const body = JSON.parse(await doRequest(requestOptions));
    const result = body.results;
    console.log(result);
    return result;
};

exports.outputUserProfile = async (e, type) => {
    const userId = e.source.userId;
    const groupId = e.source.groupId;
    const postback = e.postback;
    const date = getDate2();
    if (type === 'group') {
        client.getGroupMemberProfile(groupId, userId)
            .then((profile) => {
                const displayName = profile.displayName;
                if (e.type === 'postback') {
                    console.log(`date: ${date} , groupId: ${groupId} , userId: ${userId} , displayName: ${displayName} , data: ${e.postback.data}`);
                } else {
                    console.log(`date: ${date} , groupId: ${groupId} , userId: ${userId} , displayName: ${displayName} , message: ${e.message.text}`);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        client.getProfile(userId)
            .then((profile) => {
                const displayName = profile.displayName;
                if (e.type === 'postback') {
                    console.log(`date: ${date} , userId: ${userId} , displayName: ${displayName} , data: ${e.postback.data}`);
                } else {
                    console.log(`date: ${date} , userId: ${userId} , displayName: ${displayName} , message: ${e.message.text}`);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
};

const doRequest = (options) => {
    const request = require('request');
    return new Promise(function (resolve, reject) {
        request(options, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};