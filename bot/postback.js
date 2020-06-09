const AWS = require('aws-sdk');
const othersFunc = require('./others');
const line = require('@line/bot-sdk');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});
const tableName = 'TimeTable';

exports.postback = async (e) => {
    let param;
    let message;
    othersFunc.outputUserProfile(e, e.source.type);
    const data = e.postback.data;
    const date = new Date(),
        dayOfWeek = date.getDay(),
        dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
    const userId = e.source.userId;
    //console.log('userId: ' + userId + ' , data: ' + data);

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
    param = {
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
        dynamoDocument.query(param, (err, data) => {
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
            break;
        case 'tt_delete':
            param = {
                TableName: tableName,
                Key: { //削除したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: userId
                }
            };
            await new Promise((resolve, reject) => {
                dynamoDocument.delete(param, (err, data) => {
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
            break;
        case 'cancel':
            message = {
                'type': 'text',
                'text': 'キャンセルしました'
            };
            break;
        case '時間割共有':
            send_tt = ttdata.uuid;
            message = [{
                'type': 'text',
                'text': send_tt
            }, {
                'type': 'text',
                'text': '共有idを発行しました．これを友達に渡すと，その友達もあなたと同じ時間割を使うことが出来ます．\nちなみにこちらがこのbotの友達追加用URLですので，併せてご使用ください．'
            }, {
                'type': 'text',
                'text': 'https://line.me/R/ti/p/%40ywg0561x'
            }];
            break;
        case 'ユーザー情報削除':
            message = {
                'type': 'text',
                'text': '時間割やプレミアム会員情報を含め、登録済みの全情報が削除されます。\n本当によろしいですか？',
                'quickReply': {
                    'items': [{
                        'type': 'action',
                        'action': {
                            'type': 'postback',
                            'label': '削除する',
                            'data': 'tt_delete'
                        }
                    }, {
                        'type': 'action',
                        'action': {
                            'type': 'postback',
                            'label': 'キャンセル',
                            'data': 'cancel'
                        }
                    }]
                }
            };
            break;
        case '全曜日':
            message = {
                'type': 'text',
                'text': ttdata.mon + '\n\n' + ttdata.tue + '\n\n' + ttdata.wed + '\n\n' + ttdata.thu + '\n\n' + ttdata.fri + '\n\n' + ttdata.sat
            };
            break;
        case 'その他':
            message = [{
                'type': 'image',
                'originalContentUrl': 'https://firebasestorage.googleapis.com/v0/b/picture-e5254.appspot.com/o/N29nS7jhGg.jpg?alt=media&token=ce04b2b2-551e-4cd6-a3a4-cc7f976a1a7d',
                'previewImageUrl': 'https://firebasestorage.googleapis.com/v0/b/picture-e5254.appspot.com/o/N29nS7jhGg.jpg?alt=media&token=ce04b2b2-551e-4cd6-a3a4-cc7f976a1a7d'
            }, {
                'type': 'text',
                'text': 'https://line.me/R/ti/p/%40ywg0561x'
            }];
            break;
        case 'jikanwariNotifyTime':
            const time = Number((e.postback.params.time).split(':')[0]);
            console.log(time);
            let id;
            if (e.source.type == 'user') {
                id = userId;
            } else if (e.source.type == 'group') {
                id = e.source.groupId;
            }
            param = {
                TableName: tableName,
                Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: id
                },
                ExpressionAttributeNames: {
                    '#f': 'flag'
                },
                ExpressionAttributeValues: {
                    ':flag': time.toString(), //name属性を更新する
                },
                UpdateExpression: 'SET #f = :flag'
            };
            await new Promise((resolve, reject) => {
                dynamoDocument.update(param, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
            message = {
                'type': 'flex',
                'altText': 'ボタンを押して下さい',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': `配信時間（${time}時）の登録が完了しました。`,
                            'weight': 'bold',
                            'wrap': true,
                            'size': 'md'
                        }, {
                            'type': 'text',
                            'text': '続いて以下のボタンを押して配信登録をして下さい。',
                            'weight': 'bold',
                            'wrap': true,
                            'size': 'md'
                        }, {
                            'type': 'text',
                            'text': '※これをしないと時間割が送られてきません。',
                            'size': 'sm',
                            'wrap': true
                        }]
                    },
                    'footer': {
                        'type': 'box',
                        'layout': 'vertical',
                        'spacing': 'sm',
                        'contents': [{
                            'type': 'button',
                            'style': 'primary',
                            'height': 'md',
                            'action': {
                                'type': 'uri',
                                'label': 'ボタンを押して下さい',
                                'uri': `https://37fa6eoyyc.execute-api.ap-northeast-1.amazonaws.com/prod/authorize?userId=${userId}`,
                            }
                        }],
                        'flex': 0
                    }
                }
            };
            break;
        default:
            /*if (ttdata.premium) {
                message = await premium(e, ttdata);
            }*/
            break;
    }
    return message;
};

/*const premium = async(e, ttdata) => {
    const userId = e.source.userId;
    const data = e.postback.data;
    let message;

    switch (data) {

        case 'jikanwariNotifyTime':
            const time = Number((e.postback.params.time).split(':')[0]);
            console.log(time);
            let id;
            if (e.source.type == 'user') {
                id = userId;
            }
            else if (e.source.type == 'group') {
                id = e.source.groupId;
            }
            param = {
                TableName: tableName,
                Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: id
                },
                ExpressionAttributeNames: {
                    '#f': 'flag'
                },
                ExpressionAttributeValues: {
                    ':flag': time.toString(), //name属性を更新する
                },
                UpdateExpression: 'SET #f = :flag'
            };
            await new Promise((resolve, reject) => {
                dynamoDocument.update(param, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            message = [{
                "type": "text",
                "text": "配信時間の登録が完了しました。続いて以下のボタンを押して配信登録をして下さい。\n※これをしないと時間割が送られてきません。"
            }, {
                "type": "flex",
                "altText": '選択してください',
                "contents": {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{
                            "type": "text",
                            "text": "選択してください",
                            "weight": "bold",
                            "size": "md"
                        }]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                            "type": "button",
                            "style": "primary",
                            "height": "md",
                            "action": {
                                "type": "uri",
                                "uri": `https://37fa6eoyyc.execute-api.ap-northeast-1.amazonaws.com/prod/autorize?userId=${userId}`,
                            }
                        }],
                        "flex": 0
                    }
                }
            }];
            return message;
    }
};*/