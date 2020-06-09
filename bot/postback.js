const AWS = require('aws-sdk');
const othersFunc = require('./others');
const line = require('@line/bot-sdk');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});
const tableName = 'TimeTable';

exports.postback = async (e) => {
    let message;
    othersFunc.outputUserProfile(e, e.source.type);
    const data = e.postback.data;
    const userId = e.source.userId;

    const timetableLogsParam = {
        TableName: 'timetable-logs',
        Item: {
            ID: othersFunc.getUuid(),
            userId: userId,
            type: 'message',
            data: data,
            date: othersFunc.getDate()
        }
    };
    dynamoDocument.put(timetableLogsParam, (err, data) => {
        if (err) {
            console.log(err);
        }
    });

    let ttdata;
    let send_tt;
    const queryParam = {
        TableName: tableName,
        KeyConditionExpression: '#k = :val',
        ExpressionAttributeValues: {
            ':val': userId
        },
        ExpressionAttributeNames: {
            '#k': 'ID'
        }
    };
    let promise = await new Promise((resolve, reject) => {
        dynamoDocument.query(queryParam, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
    ttdata = promise.Items[0];
    let isPremium;
    if (ttdata) {
        isPremium = ttdata.premium;
    }
    if (ttdata == undefined && data !== '時間割登録' && data !== 'メニューに戻る' && data !== '元に戻す' && data !== '第二メニュー' && data !== 'その他') {
        message = {
            'type': 'text',
            'text': '時間割を登録してください'
        };
        return message;
    }
    if (data.match(/day/)) {

        if (ttdata.property) {
            let property = ttdata.property;
            property = property.split(',');
            switch (data) {
                case 'saturday':
                    send_tt = ttdata.sat;
                    property = property[5];
                    break;
                case 'monday':
                    send_tt = ttdata.mon;
                    property = property[0];
                    break;
                case 'tuesday':
                    send_tt = ttdata.tue;
                    property = property[1];
                    break;
                case 'wednesday':
                    send_tt = ttdata.wed;
                    property = property[2];
                    break;
                case 'thursday':
                    send_tt = ttdata.thu;
                    property = property[3];
                    break;
                case 'friday':
                    send_tt = ttdata.fri;
                    property = property[4];
                    break;
            }
            if (property && property !== '') {
                message = [{
                    'type': 'text',
                    'text': send_tt
                }, {
                    'type': 'text',
                    'text': `【持ち物】\n${property}`
                }];
                //console.log(message);
                return message;
            }
        }

        switch (data) {
            case 'saturday':
                send_tt = ttdata.sat;
                break;
            case 'monday':
                send_tt = ttdata.mon;
                break;
            case 'tuesday':
                send_tt = ttdata.tue;
                break;
            case 'wednesday':
                send_tt = ttdata.wed;
                break;
            case 'thursday':
                send_tt = ttdata.thu;
                break;
            case 'friday':
                send_tt = ttdata.fri;
                break;
        }
        message = {
            'type': 'text',
            'text': send_tt
        };
        return message;
    }
    switch (data) {
        case 'メニューに戻る':
            client.linkRichMenuToUser(userId, process.env.richmenu1);
            return;

        case '元に戻す':
            client.linkRichMenuToUser(userId, process.env.richmenu1);
            return;

        case '第二メニュー':
            client.linkRichMenuToUser(userId, process.env.richmenu2);
            return;
        case '時間割登録':
            message = {
                'type': 'text',
                'text': '共有IDを送信してください'
            };
            return message;
        case 'tt_delete':
            const deleteParam = {
                TableName: tableName,
                Key: { //削除したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: userId
                }
            };
            await new Promise((resolve, reject) => {
                dynamoDocument.delete(deleteParam, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
            message = {
                'type': 'text',
                'text': '時間割を削除しました'
            };
            client.linkRichMenuToUser(userId, 'richmenu-138eedbbf1e26aa4042c21f0c72d1bdf');
            return message;
        case 'cancel':
            message = {
                'type': 'text',
                'text': 'キャンセルしました'
            };
            return message;
        case '時間割共有':
            send_tt = ttdata.uuid;
            message = require('./messages/時間割共有.json');
            message[0].text = send_tt;
            return message;
        case 'ユーザー情報削除':
            message = require('./messages/ユーザー情報削除.json');
            return message;
        case 'その他':
            message = [{
                'type': 'image',
                'originalContentUrl': process.env.qrUri,
                'previewImageUrl': process.env.qrUri
            }, {
                'type': 'text',
                'text': 'https://line.me/R/ti/p/%40ywg0561x'
            }];
            return message;
        case 'jikanwariNotifyTime':
            const time = Number((e.postback.params.time).split(':')[0]);
            console.log(time);
            let id;
            if (e.source.type == 'user') {
                id = userId;
            } else if (e.source.type == 'group') {
                id = e.source.groupId;
            }
            const updateParam = {
                TableName: tableName,
                Key: {
                    ID: id
                },
                ExpressionAttributeNames: {
                    '#f': 'flag'
                },
                ExpressionAttributeValues: {
                    ':flag': time.toString(),
                },
                UpdateExpression: 'SET #f = :flag'
            };
            await new Promise((resolve, reject) => {
                dynamoDocument.update(updateParam, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
            message = require('./messages/jikanwariNotifyTime.json');
            message.contents.body.contents[0].text = `配信時間（${time}時）の登録が完了しました。`;
            message.contents.footer.contents[0].action.uri = `${process.env.notifyUri}?userId=${userId}`;
            return message;
        default:
            break;
    }
    return message;
};