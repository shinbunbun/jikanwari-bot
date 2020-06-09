const AWS = require('aws-sdk');
const line = require('@line/bot-sdk');
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});
const othersFunc = require('./others');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const tableName = 'TimeTable';

exports.message = async (e) => {
    let message;
    if (e.message.type != 'text') {
        message = undefined;
        return message;
    }
    if (e.source.type == 'user') {
        return await sendToUser(e);
    } else if (e.source.type == 'group') {
        return await sendToGroup(e);
    }
};

const sendToUser = async (e) => {
    console.log(othersFunc.getDate());
    let message;
    const userMessage = e.message.text;
    const userId = e.source.userId;
    othersFunc.outputUserProfile(e, 'user');

    const timetableLogsParam = {
        TableName: 'timetable-logs',
        Item: {
            ID: othersFunc.getUuid(),
            userId: userId,
            type: 'message',
            message: userMessage,
            date: othersFunc.getDate()
        }
    };
    dynamoDocument.put(timetableLogsParam, (err, data) => {
        if (err) {
            console.log(err);
        }
    });

    let param = {
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
                reject('$sendToGroup query err : {err}');
            } else {
                resolve(data);
            }
        });
    });
    const ttdata = promise.Items[0];

    switch (userMessage) {
        case '/userid':
            message = {
                'type': 'text',
                'text': userId
            };
            return message;
        case 'その他の時間割':
            message = require('./messages/その他の時間割.json');
            return message;

        case 'その他':
            message = require('./messages/その他.json');
            return message;

        case '時間割共有':
            if (ttdata == undefined) {
                if (e.source.type === 'user') {
                    message = {
                        'type': 'text',
                        'text': 'メニューの「時間割登録」から時間割を登録して下さい。'
                    };
                    return message;
                }
            }
            message = [{
                'type': 'text',
                'text': ttdata.uuid
            }, {
                'type': 'text',
                'text': '共有idを発行しました．これを友達に渡すと，その友達もあなたと同じ時間割を使うことが出来ます．\nちなみにこちらがこのbotの友達追加用URLですので，併せてご使用ください．'
            }, {
                'type': 'text',
                'text': 'https://line.me/R/ti/p/%40ywg0561x'
            }];
            return message;
        case '友達に勧める':
            message = require('./messages/友達に勧める.json');
            return message;
        case '時間割':
            message = require('./messages/時間割.json');
            return message;
        case '時間割登録':
            message = require('./messages/時間割登録.json');
            return message;
        case 'ヘルプ:時間割お知らせ機能':
            message = require('./messages/ヘルプ:時間割お知らせ機能.json');
            return message;
        case '時間割お知らせ機能登録':
            if (ttdata == undefined) {
                message = {
                    'type': 'text',
                    'text': '時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）'
                };
                return message;
            }
            message = require('./messages/時間割お知らせ機能登録.json');
            return message;
        case '時間割お知らせ機能解除':
            if (ttdata == undefined) {
                message = {
                    'type': 'text',
                    'text': '時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）'
                };
                return message;
            }
            param = {
                TableName: tableName,
                Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: userId
                },
                ExpressionAttributeNames: {
                    '#f': 'notifyToken'
                },
                ExpressionAttributeValues: {
                    ':notifyToken': '0', //name属性を更新する
                },
                UpdateExpression: 'SET #f = :notifyToken'
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
                'type': 'text',
                'text': '解除しました'
            };
            return message;

        case 'お知らせ':
            message = require('./messages/お知らせ.json');
            client.linkRichMenuToUser(userId, process.env.richmenu1);
            return message;
        case '時間割お知らせ機能':
            message = require('./messages/時間割お知らせ機能.json');
            return message;
        case '曜日指定':
            message = require('./messages/曜日指定.json');
            return message;
        default:
            message = undefined;
            message = await common(e, ttdata);
            return message;
    }
    //console.log(`SendMessage:user,${userMessage},${JSON.stringify(message)}`);
};

const sendToGroup = async (e) => {
    let message;
    const userMessage = e.message.text;
    const userId = e.source.userId;
    const groupId = e.source.groupId;
    othersFunc.outputUserProfile(e, 'group');
    //console.log(`userId: ${userId} ,groupId: ${groupId} , message: ${userMessage}`);

    const timetableLogsParam = {
        TableName: 'timetable-logs',
        Item: {
            ID: othersFunc.getUuid(),
            userId: userId,
            groupId: groupId,
            type: 'message',
            message: userMessage,
            date: othersFunc.getDate()
        }
    };
    dynamoDocument.put(timetableLogsParam, (err, data) => {
        if (err) {
            console.log(err);
        }
    });

    const queryParam = {
        TableName: tableName,
        KeyConditionExpression: '#k = :val',
        ExpressionAttributeValues: {
            ':val': groupId
        },
        ExpressionAttributeNames: {
            '#k': 'ID'
        }
    };
    const promise = await new Promise((resolve, reject) => {
        dynamoDocument.query(queryParam, (err, data) => {
            if (err) {
                reject('$sendToGroup query err : {err}');
            } else {
                resolve(data);
            }
        });
    });
    const ttdata = promise.Items[0];
    switch (userMessage) {
        case '/groupid':
            message = {
                'type': 'text',
                'text': groupId
            };
            break;
        case '時間割削除':
            if (ttdata == undefined) {
                message = {
                    'type': 'text',
                    'text': '時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）'
                };
                return message;
            }
            const deleteParam = {
                TableName: tableName,
                Key: { //削除したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: groupId
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
                'text': '時間割を削除しました。共有IDを送信すると再度登録が出来ます。'
            };
            break;
        case 'ヘルプ':
            message = [{
                'type': 'text',
                'text': '現在グループで使える機能は「時間割削除」「今日の時間割」「明日の時間割」「全曜日」です。\n（共有IDを送信することで時間割の登録をすることが出来ます）'
            }, {
                'type': 'text',
                'text': '詳しくは以下のヘルプページをご参照下さい。\nline://app/1598720034-WBk6v0rZ'
            }];
            break;
        default:
            message = undefined;
            message = await common(e, ttdata);
            break;
    }
    return message;
};

const common = async (e, ttdata) => {
    let message;
    console.log(0);
    let userMessage = e.message.text;
    const userId = e.source.userId;

    const date = new Date(),
        dayOfWeek = date.getDay(),
        dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];

    let send_tt;
    let id;
    if (e.source.type == 'user') {
        id = userId;
    } else if (e.source.type == 'group') {
        id = e.source.groupId;
    }

    switch (userMessage) {
        case '今日の時間割':
            if (ttdata == undefined) {
                if (e.source.type === 'user') {
                    message = {
                        'type': 'text',
                        'text': 'メニューの「時間割登録」から時間割を登録して下さい。'
                    };
                    return message;
                }
                message = [{
                    'type': 'text',
                    'text': '時間割が見つかりませんでした。\nまだこのグループに時間割を登録していない場合は共有IDを送信して時間割を登録して下さい。\n共有IDの発行方法は以下の通りです。'
                }, {
                    'type': 'text',
                    'text': '時間割botとの個人チャットを開く→メニューの「第二メニュー」を押す→「時間割共有」ボタンを押す'
                }];
                return message;
            }
            if (ttdata.property) {
                let property = ttdata.property;
                property = property.split(',');
                switch (dayOfWeekStr) {
                    case '日':
                        send_tt = '今日の時間割はありません';
                        property = undefined;
                        break;
                    case '土':
                        send_tt = ttdata.sat;
                        property = property[5];
                        break;
                    case '月':
                        send_tt = ttdata.mon;
                        property = property[0];
                        break;
                    case '火':
                        send_tt = ttdata.tue;
                        property = property[1];
                        break;
                    case '水':
                        send_tt = ttdata.wed;
                        property = property[2];
                        break;
                    case '木':
                        send_tt = ttdata.thu;
                        property = property[3];
                        break;
                    case '金':
                        send_tt = ttdata.fri;
                        property = property[4];
                        break;
                }
                console.log(property);
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
            switch (dayOfWeekStr) {
                case '日':
                    send_tt = '今日の時間割はありません';
                    break;
                case '土':
                    send_tt = ttdata.sat;
                    break;
                case '月':
                    send_tt = ttdata.mon;
                    break;
                case '火':
                    send_tt = ttdata.tue;
                    break;
                case '水':
                    send_tt = ttdata.wed;
                    break;
                case '木':
                    send_tt = ttdata.thu;
                    break;
                case '金':
                    send_tt = ttdata.fri;
                    break;
            }

            message = {
                'type': 'text',
                'text': send_tt
            };
            return message;
        case '明日の時間割':
            if (ttdata == undefined) {
                if (e.source.type === 'user') {
                    message = {
                        'type': 'text',
                        'text': 'メニューの「時間割登録」から時間割を登録して下さい。'
                    };
                    return message;
                }
                message = [{
                    'type': 'text',
                    'text': '時間割が見つかりませんでした。\nまだこのグループに時間割を登録していない場合は共有IDを送信して時間割を登録して下さい。\n共有IDの発行方法は以下の通りです。'
                }, {
                    'type': 'text',
                    'text': '時間割botとの個人チャットを開く→メニューの「第二メニュー」を押す→「時間割共有」ボタンを押す'
                }];
                return message;
            }

            if (ttdata.property) {
                let property = ttdata.property;
                property = property.split(',');

                switch (dayOfWeekStr) {
                    case '日':
                    case '土':
                        send_tt = ttdata.mon;
                        property = property[0];
                        break;
                    case '月':
                        send_tt = ttdata.tue;
                        property = property[1];
                        break;
                    case '火':
                        send_tt = ttdata.wed;
                        property = property[2];
                        break;
                    case '水':
                        send_tt = ttdata.thu;
                        property = property[3];
                        break;
                    case '木':
                        send_tt = ttdata.fri;
                        property = property[4];
                        break;
                    case '金':
                        send_tt = ttdata.sat;
                        property = property[5];
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

            switch (dayOfWeekStr) {
                case '日':
                case '土':
                    send_tt = ttdata.mon;
                    break;
                case '月':
                    send_tt = ttdata.tue;
                    break;
                case '火':
                    send_tt = ttdata.wed;
                    break;
                case '水':
                    send_tt = ttdata.thu;
                    break;
                case '木':
                    send_tt = ttdata.fri;
                    break;
                case '金':
                    send_tt = ttdata.sat;
                    break;
            }
            message = {
                'type': 'text',
                'text': send_tt
            };
            return message;

        case '全曜日':
            message = {
                'type': 'text',
                'text': ttdata.mon + '\n\n' + ttdata.tue + '\n\n' + ttdata.wed + '\n\n' + ttdata.thu + '\n\n' + ttdata.fri + '\n\n' + ttdata.sat
            };
            return message;
        default:
            if (userMessage.match(/hftd52/)) {
                let ttdata;
                const queryParam = {
                    TableName: tableName,
                    IndexName: 'uuid-index',
                    KeyConditionExpression: '#k = :val',
                    ExpressionAttributeValues: {
                        ':val': userMessage
                    },
                    ExpressionAttributeNames: {
                        '#k': 'uuid'
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
                console.log('ttdata1' + ttdata);
                if (ttdata == undefined) {
                    message = {
                        'type': 'text',
                        'text': 'そのIDは存在しません'
                    };
                    return message;
                }
                const uuid = othersFunc.getUniqueStr(5000) + 'hftd52';
                const mon = ttdata.mon,
                    tue = ttdata.tue,
                    wed = ttdata.wed,
                    thu = ttdata.thu,
                    fri = ttdata.fri,
                    sat = ttdata.sat,
                    property = ttdata.property;
                let updateParam;
                if (property) {
                    updateParam = {
                        TableName: 'TimeTable',
                        Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                            ID: id
                        },
                        ExpressionAttributeNames: {
                            '#mon': 'mon',
                            '#tue': 'tue',
                            '#wed': 'wed',
                            '#thu': 'thu',
                            '#fri': 'fri',
                            '#sat': 'sat',
                            '#uuid': 'uuid',
                            '#date': 'date',
                            '#property': 'property'
                        },
                        ExpressionAttributeValues: {
                            ':mon': mon,
                            ':tue': tue,
                            ':wed': wed,
                            ':thu': thu,
                            ':fri': fri,
                            ':sat': sat,
                            ':uuid': uuid,
                            ':date': othersFunc.getDate(),
                            ':property': property,
                            //name属性を更新する
                        },
                        UpdateExpression: 'SET #mon = :mon, #tue = :tue, #wed = :wed, #thu = :thu, #fri = :fri, #sat = :sat, #uuid = :uuid, #date = :date, #property = :property'
                    };
                } else {
                    updateParam = {
                        TableName: 'TimeTable',
                        Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                            ID: id
                        },
                        ExpressionAttributeNames: {
                            '#mon': 'mon',
                            '#tue': 'tue',
                            '#wed': 'wed',
                            '#thu': 'thu',
                            '#fri': 'fri',
                            '#sat': 'sat',
                            '#uuid': 'uuid',
                            '#date': 'date'
                        },
                        ExpressionAttributeValues: {
                            ':mon': mon,
                            ':tue': tue,
                            ':wed': wed,
                            ':thu': thu,
                            ':fri': fri,
                            ':sat': sat,
                            ':uuid': uuid,
                            ':date': othersFunc.getDate()
                            //name属性を更新する
                        },
                        UpdateExpression: 'SET #mon = :mon, #tue = :tue, #wed = :wed, #thu = :thu, #fri = :fri, #sat = :sat, #uuid = :uuid, #date = :date'
                    };
                }
                await new Promise((resolve, reject) => {
                    dynamoDocument.update(updateParam, (err, data) => {
                        if (err) {
                            console.log(err);
                            throw new Error(err);
                        } else {
                            resolve(data);
                        }
                    });
                });
                if (e.source.type == 'user') {
                    message = [{
                        'type': 'text',
                        'text': '登録が完了しました！\nメニューの「時間割」ボタンから登録した時間割を確認できます！'
                    }];
                    client.linkRichMenuToUser(userId, process.env.richmenu1);
                } else if (e.source.type == 'group') {
                    message = require('./messages/グループ時間割登録完了.json');
                    message[1].text = uuid;
                }
            }
            return message;
    }
};