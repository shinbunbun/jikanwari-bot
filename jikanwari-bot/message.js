const AWS = require('aws-sdk');
const line = require('@line/bot-sdk');
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});
const othersFunc = require('./others');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const tableName = 'TimeTable';
let param;

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

    let isPremium;
    if (ttdata) {
        isPremium = ttdata.premium;
    }

    switch (userMessage) {
        case '/userid':
            message = {
                'type': 'text',
                'text': userId
            };
            return message;
        case 'その他の時間割':
            message = {
                'type': 'flex',
                'altText': 'その他の時間割',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': 'その他の時間割',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'postback',
                                    'label': '曜日指定',
                                    'data': '曜日指定'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': '全曜日',
                                    'data': '全曜日'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;

        case 'その他':
            message = {
                'type': 'flex',
                'altText': 'その他',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': 'その他',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'label': '時間割編集',
                                    'uri': 'https://jikanwari-bot.shinbunbun.info?path=edit'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': 'ユーザー情報削除',
                                    'data': 'ユーザー情報削除'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '友達に勧める',
                                    'text': '友達に勧める'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
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
                message = [{
                    'type': 'text',
                    'text': '時間割が見つかりませんでした。\nまだこのグループに時間割を登録していない場合は共有IDを送信して時間割を登録して下さい。\n共有IDの発行方法は以下の通りです。'
                }, {
                    'type': 'text',
                    'text': '時間割botとの個人チャットを開く→メニューの「第二メニュー」を押す→「時間割共有」ボタンを押す'
                }];
                return message;
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
            message = {
                'type': 'flex',
                'altText': '選択してください',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '選択してください',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'label': 'LINEで勧める',
                                    'uri': 'line://nv/recommendOA/@ywg0561x'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'uri',
                                    'label': 'Twitterで勧める',
                                    'uri': 'https://twitter.com/intent/tweet?text=LINE%E3%81%AE%E6%99%82%E9%96%93%E5%89%B2bot%E3%81%8A%E3%81%99%E3%81%99%E3%82%81%EF%BC%81%0Ahttps%3A%2F%2Fline.me%2FR%2Fti%2Fp%2F%40ywg0561x%0A%23LINE%E6%99%82%E9%96%93%E5%89%B2bot&openexternalbrowser=1'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': 'その他(QRコード、URL)',
                                    'data': 'その他'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;
        case '時間割':
            message = {
                'type': 'flex',
                'altText': '選択してください',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '選択してください',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'postback',
                                    'label': '今日の時間割',
                                    'data': '今日の時間割'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': '明日の時間割',
                                    'data': '明日の時間割'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': '曜日指定',
                                    'data': '曜日指定'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': '全曜日',
                                    'data': '全曜日'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;
        case '時間割登録':
            message = [{
                'type': 'flex',
                'altText': '共有IDを持っていますか？',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '共有IDを持っていますか？',
                            'weight': 'bold',
                            'size': 'md',
                            'wrap': true
                        }]
                    },
                    'footer': {
                        'type': 'box',
                        'layout': 'horizontal',
                        'spacing': 'sm',
                        'contents': [{
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': 'はい',
                                    'data': '時間割登録'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'uri',
                                    'label': 'いいえ',
                                    'uri': 'https://jikanwari-bot.shinbunbun.info?path=registration'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            }, {
                'type': 'text',
                'text': '※共有IDがわからない方はいいえを押して下さい'
            }];
            return message;
        case '第二メニュー':
            message = {
                'type': 'flex',
                'altText': '第二メニュー',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '第二メニュー',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'postback',
                                    'label': '時間割共有',
                                    'data': '時間割共有'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'uri',
                                    'label': '時間割編集',
                                    'uri': 'https://jikanwari-bot.shinbunbun.info?path=edit'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'postback',
                                    'label': '時間割削除',
                                    'data': '時間割削除'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;

        case 'プレミアム会員登録':
            /*client.linkRichMenuToUser(userId, 'richmenu-56ef5fbf048920e0be09ba91888f8d3d');
            message = {
                "type": "flex",
                "altText": 'プレミアム会員登録',
                "contents": {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{
                                "type": "text",
                                "text": "プレミアム会員について",
                                "weight": "bold",
                                "size": "lg",
                                "margin": "md"
                            },
                            {
                                "type": "separator",
                                "margin": "xxl"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "margin": "xxl",
                                "spacing": "sm",
                                "contents": [{
                                        "type": "text",
                                        "text": "使える機能",
                                        "size": "lg"
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "時間割お知らせ機能",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "詳細はこちら",
                                                "size": "sm",
                                                "color": "#469fd6",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "天気予報",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "詳細はこちら",
                                                "size": "sm",
                                                "color": "#469fd6",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:天気予報"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "電車運行情報",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "詳細はこちら",
                                                "size": "sm",
                                                "color": "#469fd6",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:電車運行情報"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "type": "separator",
                                        "margin": "xxl"
                                    },
                                    {
                                        "type": "text",
                                        "text": "金額",
                                        "size": "lg"
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "1ヶ月",
                                                "size": "sm",
                                                "color": "#555555"
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥370",
                                                "size": "sm",
                                                "color": "#111111",
                                                "align": "start"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "3ヶ月",
                                                "size": "sm",
                                                "color": "#555555"
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥999 （10%OFF）",
                                                "size": "sm",
                                                "color": "#111111",
                                                "align": "start"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "6ヶ月",
                                                "size": "sm",
                                                "color": "#555555"
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥1843（17%OFF）",
                                                "size": "sm",
                                                "color": "#111111",
                                                "align": "start"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "separator",
                                        "margin": "xxl"
                                    },
                                    {
                                        "type": "text",
                                        "text": "主な決済方法・手数料",
                                        "size": "lg"
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "カード決済",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥0",
                                                "size": "sm",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                },
                                                "color": "#555555"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "TwitterのDMでアマギフコード送信",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "size": "sm",
                                                "color": "#555555",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                },
                                                "text": "¥0"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "コンビニ決済",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥220",
                                                "size": "sm",
                                                "color": "#555555",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "キャリア決済",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "¥220",
                                                "size": "sm",
                                                "color": "#555555",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [{
                                                "type": "text",
                                                "text": "銀行振込",
                                                "size": "sm",
                                                "color": "#555555",
                                                "flex": 0
                                            },
                                            {
                                                "type": "text",
                                                "text": "振込元により変動",
                                                "size": "sm",
                                                "color": "#555555",
                                                "align": "end",
                                                "action": {
                                                    "type": "message",
                                                    "label": "詳細はこちら",
                                                    "text": "ヘルプ:時間割お知らせ機能"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "TwitterのDMから登録",
                                    "uri": "https://twitter.com/line_jikanwari"
                                },
                                "style": "primary",
                                "offsetBottom": "sm"
                            },
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "Twitter以外の支払い方法で登録",
                                    "uri": "https://jikanwari-bot.stores.jp/"
                                },
                                "style": "primary"
                            }
                        ]
                    },
                    "styles": {
                        "footer": {
                            "separator": true
                        }
                    }
                }
            };*/
            message = {
                'type': 'text',
                'text': '現在停止中です。'
            };

            return message;

        case 'ヘルプ:時間割お知らせ機能':
            message = [{
                'type': 'text',
                'text': '時間割を送って欲しい時間を設定すると、毎日その時間に自動で時間割を送信します。\n※送信先は1対1トークかグループのどちらかを選択できます。'
            }, {
                'type': 'flex',
                'altText': 'ボタンを押して下さい',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '登録したい場合は以下のボタンを押してください',
                            'weight': 'bold',
                            'wrap': true,
                            'size': 'md'
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
                                'type': 'message',
                                'label': '時間割お知らせ機能登録',
                                'text': '時間割お知らせ機能登録',
                            }
                        }],
                        'flex': 0
                    }
                }
            }];
            return message;
        case 'ヘルプ:天気予報':
            message = {
                'type': 'text',
                'text': '郵便番号を登録すると、その地域の天気予報が見れるようになります。また、時間割お知らせ機能に登録している場合は一緒にその日の天気予報を送信します。'
            };
            return message;
        case 'ヘルプ:電車運行情報':
            message = {
                'type': 'text',
                'text': '路線を登録すると、その路線の運行情報が見れるようになります。また、時間割お知らせ機能に登録している場合は一緒にその日の運行情報を送信します。'
            };
            return message;
        case 'line-pay-test':
            message = {
                'type': 'flex',
                'altText': 'line-pay-test',
                'contents': {
                    'type': 'carousel',
                    'contents': [{
                            'type': 'bubble',
                            'size': 'micro',
                            'hero': {
                                'type': 'image',
                                'size': 'full',
                                'aspectRatio': '20:13',
                                'aspectMode': 'fit',
                                'url': 'https://timetablebot.s3-ap-northeast-1.amazonaws.com/image/calendar.png'
                            },
                            'body': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                        'type': 'text',
                                        'text': '1ヶ月',
                                        'wrap': true,
                                        'weight': 'bold',
                                        'size': 'lg'
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                            'type': 'text',
                                            'text': '¥370',
                                            'wrap': true,
                                            'weight': 'bold',
                                            'size': 'md',
                                            'flex': 0
                                        }]
                                    }
                                ]
                            },
                            'footer': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                    'type': 'button',
                                    'style': 'primary',
                                    'action': {
                                        'type': 'uri',
                                        'label': '購入',
                                        'uri': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=1',
                                        'altUri': {
                                            'desktop': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=1'
                                        }
                                    }
                                }]
                            }
                        },
                        {
                            'type': 'bubble',
                            'size': 'micro',
                            'hero': {
                                'type': 'image',
                                'size': 'full',
                                'aspectRatio': '20:13',
                                'aspectMode': 'fit',
                                'url': 'https://timetablebot.s3-ap-northeast-1.amazonaws.com/image/calendar.png'
                            },
                            'body': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                        'type': 'text',
                                        'text': '3ヶ月',
                                        'wrap': true,
                                        'weight': 'bold',
                                        'size': 'lg'
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': '¥999',
                                                'wrap': true,
                                                'weight': 'bold',
                                                'size': 'md',
                                                'flex': 0,
                                                'color': '#ff0000'
                                            },
                                            {
                                                'type': 'text',
                                                'text': '10%OFF',
                                                'align': 'center',
                                                'color': '#ff0000',
                                                'style': 'italic',
                                                'decoration': 'underline'
                                            }
                                        ]
                                    }
                                ]
                            },
                            'footer': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                    'type': 'button',
                                    'style': 'primary',
                                    'action': {
                                        'type': 'uri',
                                        'label': '購入',
                                        'uri': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=2',
                                        'altUri': {
                                            'desktop': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=2'
                                        }
                                    }
                                }]
                            }
                        },
                        {
                            'type': 'bubble',
                            'size': 'micro',
                            'hero': {
                                'type': 'image',
                                'size': 'full',
                                'aspectRatio': '20:13',
                                'aspectMode': 'fit',
                                'url': 'https://timetablebot.s3-ap-northeast-1.amazonaws.com/image/calendar.png'
                            },
                            'body': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                        'type': 'text',
                                        'text': '6ヶ月',
                                        'wrap': true,
                                        'weight': 'bold',
                                        'size': 'lg'
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': '¥1843',
                                                'wrap': true,
                                                'weight': 'bold',
                                                'size': 'md',
                                                'flex': 0,
                                                'color': '#ff0000'
                                            },
                                            {
                                                'type': 'text',
                                                'text': '17%OFF',
                                                'align': 'center',
                                                'color': '#ff0000',
                                                'style': 'italic',
                                                'decoration': 'underline'
                                            }
                                        ]
                                    }
                                ]
                            },
                            'footer': {
                                'type': 'box',
                                'layout': 'vertical',
                                'spacing': 'sm',
                                'contents': [{
                                    'type': 'button',
                                    'style': 'primary',
                                    'action': {
                                        'type': 'uri',
                                        'label': '購入',
                                        'uri': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=3',
                                        'altUri': {
                                            'desktop': 'https://a0vgdimu59.execute-api.ap-northeast-1.amazonaws.com/prod/pay/reserve?id=3'
                                        }
                                    }
                                }]
                            }
                        }
                    ]
                }
            };
            return message;
        case '時間割お知らせ機能登録':
            if (ttdata == undefined) {
                message = {
                    'type': 'text',
                    'text': '時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）'
                };
                return message;
            }
            message = [{
                'type': 'text',
                'text': '以下のボタンを押して配信時刻を選択して下さい。（分は切り捨てますのでご注意下さい。例えば、19:26を選択した場合19:00として登録されます。）\n午前は当日の時間割、午後は翌日の時間割が配信されます。'
            }, {
                'type': 'flex',
                'altText': '選択してください',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '選択してください',
                            'weight': 'bold',
                            'size': 'md'
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
                                'type': 'datetimepicker',
                                'label': '時刻を選択して下さい',
                                'data': 'jikanwariNotifyTime',
                                'mode': 'time',
                                'min': '01:00'
                            }
                        }],
                        'flex': 0
                    }
                }
            }];
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
            message = [{
                'type': 'text',
                'text': '【お知らせ】\nV2.0.0\n\n時間割お知らせ機能が復活しました！\n詳しくは以下のボタンを押してご確認ください。\n\nその他のアップデート内容は以下のページから確認できます。\nhttps://jikanwari-bot.shinbunbun.info/update'
            }, {
                'type': 'flex',
                'altText': '時間割お知らせ機能の詳細を確認する',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '時間割お知らせ機能の詳細',
                            'weight': 'bold',
                            'wrap': true,
                            'size': 'md'
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
                                'type': 'message',
                                'label': '確認する',
                                'text': 'ヘルプ:時間割お知らせ機能',
                            }
                        }],
                        'flex': 0
                    }
                }
            }];
            client.linkRichMenuToUser(userId, process.env.richmenu1);
            return message;
        case '時間割お知らせ機能':
            message = {
                'type': 'flex',
                'altText': '時間割お知らせ機能',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '時間割お知らせ機能',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'message',
                                    'label': '登録',
                                    'text': '時間割お知らせ機能登録'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '解除',
                                    'text': '時間割お知らせ機能解除'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;

        default:
            message = undefined;
            message = await common(e, ttdata);

            if (isPremium && message === undefined) {
                message = await premium(e, ttdata);
            }
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

    param = {
        TableName: tableName,
        KeyConditionExpression: '#k = :val',
        ExpressionAttributeValues: {
            ':val': groupId
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
    let isPremium;
    if (ttdata) {
        isPremium = ttdata.premium;
    }
    let send_tt;
    let postalCode;
    switch (userMessage) {
        case '/groupid':
            message = {
                'type': 'text',
                'text': groupId
            };
            break;
        case '全曜日':
            message = {
                'type': 'text',
                'text': ttdata.mon + '\n\n' + ttdata.tue + '\n\n' + ttdata.wed + '\n\n' + ttdata.thu + '\n\n' + ttdata.fri + '\n\n' + ttdata.sat
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
            param = {
                TableName: tableName,
                Key: { //削除したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: groupId
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
                'text': '時間割を削除しました。共有IDを送信すると再度登録が出来ます。'
            };
            break;
        case 'ヘルプ':
            message = [{
                'type': 'text',
                //"text": "現在グループで使える機能は「時間割削除」「今日の時間割」「明日の時間割」「全曜日」「天気予報地域登録」「天気予報地域削除」「天気予報」「路線登録」「路線削除」「運行状況」「時間割お知らせ機能登録」「時間割お知らせ機能解除」です。\n（共有IDを送信することで時間割の登録をすることが出来ます）"
                'text': '現在グループで使える機能は「時間割削除」「今日の時間割」「明日の時間割」「全曜日」です。\n（共有IDを送信することで時間割の登録をすることが出来ます）'
            }, {
                'type': 'text',
                'text': '詳しくは以下のヘルプページをご参照下さい。\nline://app/1598720034-WBk6v0rZ'
            }];
            break;
            /*
        case "時間割お知らせ機能登録":
            if (ttdata == undefined) {
                message = {
                    "type": "text",
                    "text": "時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）"
                };
                return message;
            }
            message = [{
                "type": "text",
                "text": "以下のボタンを押して配信時刻を選択して下さい。（分は切り捨てますのでご注意下さい。例えば、19:26を選択した場合19:00として登録されます。）\n午前は当日の時間割、午後は翌日の時間割が配信されます。"
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
                                "type": "datetimepicker",
                                "label": "時刻を選択して下さい",
                                "data": "jikanwariNotifyTime",
                                "mode": "time",
                                "min": "01:00"
                            }
                        }],
                        "flex": 0
                    }
                }
            }];
            break;
        case "時間割お知らせ機能解除":
            if (ttdata == undefined) {
                message = {
                    "type": "text",
                    "text": "時間割を登録してください\n（共有IDを送信することで時間割の登録をすることが出来ます）"
                };
                return message;
            }
            param = {
                TableName: tableName,
                Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: groupId
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
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            message = {
                "type": "text",
                "text": "解除しました"
            };
            break;
*/
        default:
            message = undefined;
            message = await common(e, ttdata);
            /*console.log(1410);
            console.log(isPremium);
            if (isPremium && message === undefined) {
                message = await premium(e, ttdata);
            }*/
            break;
    }
    //console.log(`1207${message}`);
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

    //othersFunc.outputUserProfile(e, e.source.type);
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
            //console.log(message);
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
        default:
            if (userMessage.match(/hftd52/)) {
                let ttdata;
                param = {
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
                    dynamoDocument.query(param, (err, data) => {
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
                } else {
                    const uuid = othersFunc.getUniqueStr(5000) + 'hftd52';
                    const mon = ttdata.mon,
                        tue = ttdata.tue,
                        wed = ttdata.wed,
                        thu = ttdata.thu,
                        fri = ttdata.fri,
                        sat = ttdata.sat,
                        property = ttdata.property;
                    if (property) {
                        param = {
                            TableName: tableName,
                            Item: { //プライマリキーを必ず含める（ソートキーがある場合はソートキーも）
                                ID: id,
                                mon: mon,
                                tue: tue,
                                wed: wed,
                                thu: thu,
                                fri: fri,
                                sat: sat,
                                flag: '25',
                                date: othersFunc.getDate(),
                                uuid: uuid,
                                property: property
                            }
                        };
                    } else {
                        param = {
                            TableName: tableName,
                            Item: { //プライマリキーを必ず含める（ソートキーがある場合はソートキーも）
                                ID: id,
                                mon: mon,
                                tue: tue,
                                wed: wed,
                                thu: thu,
                                fri: fri,
                                sat: sat,
                                flag: '25',
                                date: othersFunc.getDate(),
                                uuid: uuid
                            }
                        };
                    }
                    await new Promise((resolve, reject) => {
                        dynamoDocument.put(param, (err, data) => {
                            if (err) {
                                reject(err);
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
                        //client.unlinkRichMenuFromUser(userId, 'richmenu-138eedbbf1e26aa4042c21f0c72d1bdf');
                        client.linkRichMenuToUser(userId, process.env.richmenu1);
                    } else if (e.source.type == 'group') {
                        message = [{
                                'type': 'text',
                                'text': '登録が完了しました！\n以下の文字列がこのグループに登録されている時間割の共有IDです。時間割botを友達追加して個チャに以下の文字列を送信すると、個チャでもこのグループと同じ時間割を使用することができます。'
                            }, {
                                'type': 'text',
                                'text': uuid
                            }, {
                                'type': 'text',
                                'text': 'また、グループで使用出来る機能を以下のボタンにまとめたので、ぜひご利用ください。'
                            }, {
                                'type': 'flex',
                                'altText': '選択してください',
                                'contents': {
                                    'type': 'bubble',
                                    'body': {
                                        'type': 'box',
                                        'layout': 'vertical',
                                        'contents': [{
                                            'type': 'text',
                                            'text': '選択してください',
                                            'weight': 'bold',
                                            'size': 'md'
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
                                                    'type': 'message',
                                                    'label': '今日の時間割',
                                                    'text': '今日の時間割'
                                                }
                                            },
                                            {
                                                'type': 'button',
                                                'style': 'primary',
                                                'height': 'md',
                                                'action': {
                                                    'type': 'message',
                                                    'label': '明日の時間割',
                                                    'text': '明日の時間割'
                                                }
                                            },
                                            {
                                                'type': 'button',
                                                'style': 'primary',
                                                'height': 'md',
                                                'action': {
                                                    'type': 'message',
                                                    'label': '全曜日',
                                                    'text': '全曜日'
                                                }
                                            },
                                            /*{
                                                "type": "button",
                                                "style": "primary",
                                                "height": "md",
                                                "action": {
                                                    "type": "message",
                                                    "label": "時間割お知らせ機能登録",
                                                    "text": "時間割お知らせ機能登録"
                                                }
                                            },*/
                                            /*{
                                                "type": "button",
                                                "style": "primary",
                                                "height": "md",
                                                "action": {
                                                    "type": "message",
                                                    "label": "天気予報地域登録",
                                                    "text": "天気予報地域登録"
                                                }
                                            },*/
                                            /*{
                                                "type": "button",
                                                "style": "primary",
                                                "height": "md",
                                                "action": {
                                                    "type": "message",
                                                    "label": "路線登録",
                                                    "text": "路線登録"
                                                }
                                            },*/
                                            {
                                                'type': 'spacer',
                                                'size': 'sm'
                                            }
                                        ],
                                        'flex': 0
                                    }
                                }
                            },
                            /*{
                                                       "type": "text",
                                                       //"text": "・全曜日\n全曜日の時間割を確認出来ます\n・時間割お知らせ機能登録\n毎日設定した時間に翌日の時間割を配信する、時間割お知らせ機能の登録ができます。\n・天気予報地域登録\n郵便番号を登録すると、毎朝6:00にその地域の天気予報が送られてきます。\n・路線登録\n路線を登録すると、毎朝6:10にその路線の運行情報が送られてきます。"
                                                       "text": "・全曜日\n全曜日の時間割を確認出来ます"
                                                   }*/
                        ];
                    }
                }
            } else if (userMessage.match(/路線登録:/)) {
                /*
                othersFunc.trainRegister(userMessage, id);
                message = {
                    "type": "text",
                    "text": "登録完了しました．毎朝6:10に運行情報を配信します．"
                };
                */
            }
            return message;
    }
};

const premium = async (e, ttdata) => {
    const userMessage = e.message.text;
    const userId = e.source.userId;
    let message = undefined;
    switch (userMessage) {
        case 'プレミアム会員メニュー':
            message = {
                'type': 'flex',
                'altText': 'プレミアム会員メニュー',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': 'プレミアム会員メニュー',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'message',
                                    'label': '運行情報',
                                    'text': '運行情報'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '天気予報',
                                    'text': '天気予報'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '登録系',
                                    'text': '登録系'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '解除系',
                                    'text': '解除系'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;
        case '登録系':
            message = {
                'type': 'flex',
                'altText': '登録系',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '登録系',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'message',
                                    'label': '時間割お知らせ機能登録',
                                    'text': '時間割お知らせ機能登録'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '天気予報地域登録',
                                    'text': '天気予報地域登録'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '電車運行情報登録',
                                    'text': '電車運行情報登録'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;

        case '解除系':
            message = {
                'type': 'flex',
                'altText': '解除系',
                'contents': {
                    'type': 'bubble',
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                            'type': 'text',
                            'text': '解除系',
                            'weight': 'bold',
                            'size': 'md'
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
                                    'type': 'message',
                                    'label': '時間割お知らせ機能解除',
                                    'text': '時間割お知らせ機能解除'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '天気予報機能解除',
                                    'text': '天気予報機能解除'
                                }
                            },
                            {
                                'type': 'button',
                                'style': 'primary',
                                'height': 'md',
                                'action': {
                                    'type': 'message',
                                    'label': '電車運行情報解除',
                                    'text': '電車運行情報解除'
                                }
                            },
                            {
                                'type': 'spacer',
                                'size': 'sm'
                            }
                        ],
                        'flex': 0
                    }
                }
            };
            return message;

        case '電車運行情報登録':
            message = {
                'type': 'text',
                'text': '「路線登録:路線名」という形で路線名を送信してください\n例)路線登録:山手線\n複数登録したい場合は「路線登録:路線名:路線名」という形で送信して下さい\n例)路線登録:山手線:浅草線\n路線名は以下のurlの表と全く同じ表記で登録してください(1文字でも違うと認識されません)\nhttp://bit.ly/2OczpSa'
            };
            return message;
        case '電車運行情報解除':
            othersFunc.trainRegister('路線削除', userId);
            message = {
                'type': 'text',
                'text': '削除しました'
            };
            return message;
        case '運行情報':
            if (ttdata.train == undefined || ttdata.train == '0') {
                message = {
                    'type': 'text',
                    'text': '路線を登録して下さい（第二メニュー→登録系→路線登録から登録できます）'
                };
                return message;
            }
            const traininfo = await othersFunc.trainInfo();
            let info = [];
            traininfo.concat(ttdata.train)
                .forEach(item => {
                    if (traininfo.includes(item) && ttdata.train.includes(item)) {
                        console.log(item);
                        if (info.indexOf(item) == -1) {
                            info.push(item);
                        }
                    }
                });
            console.log(info);
            if (info[0] == undefined) {
                message = {
                    'type': 'text',
                    'text': '平常通り運行しています'
                };
                console.log(1);
            } else {
                if (info.length == 1) {
                    message = [{
                        'type': 'text',
                        'text': info[0] + 'に特別な運行情報があります。詳しくは以下をご確認下さい。'
                    }, {
                        'type': 'text',
                        'text': `https://transit.yahoo.co.jp/traininfo/search?q=${info[0]}`
                    }];
                } else {
                    message = ' ';
                    for (let i = 0; i < info.length; i++) {
                        message = message + '「' + info[i] + '」';
                    }
                    message = {
                        'type': 'text',
                        'text': message + 'に特別な運行情報があります'
                    };
                }
            }
            return message;
        case '天気予報地域登録':
            message = {
                'type': 'text',
                'text': '「郵便番号:000-0000」という形で郵便番号を送信してください\n例）郵便番号:000-0000'
            };
            return message;
        case '天気予報機能解除':
            param = {
                TableName: tableName,
                Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                    ID: userId
                },
                ExpressionAttributeNames: {
                    '#p': 'postalCode',
                    '#f': 'postalCodeFlag'
                },
                ExpressionAttributeValues: {
                    ':postalCode': '0',
                    ':postalCodeFlag': '0'
                },
                UpdateExpression: 'SET #p = :postalCode, #f = :postalCodeFlag'
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
                'text': '削除しました'
            };
            return message;
        case '天気予報':
            const postalCode = ttdata.postalCode;
            if (postalCode == undefined || postalCode == '0') {
                message = {
                    'type': 'text',
                    'text': '郵便番号を登録してください(第二メニューの「天気予報配信登録」から登録できます)'
                };
                return message;
            }
            const response = await othersFunc.getWeather(postalCode);
            //console.log(response);
            if (response === 'err') {
                message = {
                    'type': 'text',
                    'text': 'エラーが発生しました。お手数ですが、メニューの「お問い合わせ」からお問い合わせ下さい。'
                };
                return message;
            }
            const country = response.city.country;
            const cityName = response.city.name;
            const date = [],
                weather = [],
                icon = [],
                temperature = [];
            for (var i = 0; i <= 8; i++) {
                if (Number(response.list[i].dt_txt.slice(11, 13)) + 9 > 24) {
                    date.push(Number(response.list[i].dt_txt.slice(11, 13)) + 9 - 24);
                } else {
                    date.push(Number(response.list[i].dt_txt.slice(11, 13)) + 9);
                }
                weather.push(response.list[i].weather[0].main);
                icon.push(response.list[i].weather[0].icon);
                temperature.push((Math.round((Number(response.list[i].main.temp) - 273.15) * 10) / 10).toString() + '℃');
            }
            message = {
                'type': 'flex',
                'altText': '天気予報',
                'contents': {
                    'type': 'bubble',
                    'styles': {
                        'footer': {
                            'separator': true
                        }
                    },
                    'body': {
                        'type': 'box',
                        'layout': 'vertical',
                        'contents': [{
                                'type': 'text',
                                'text': '天気予報',
                                'weight': 'bold',
                                'size': 'xxl',
                                'margin': 'md'
                            },
                            {
                                'type': 'text',
                                'text': country + '.' + cityName,
                                'size': 'md',
                                'color': '#aaaaaa',
                                'wrap': true
                            },
                            {
                                'type': 'separator',
                                'margin': 'xxl'
                            },
                            {
                                'type': 'box',
                                'layout': 'vertical',
                                'margin': 'xxl',
                                'spacing': 'sm',
                                'contents': [{
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[0] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[0],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[0] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[0],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[1] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[1],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[1] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[1],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[2] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[2],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[2] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[2],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[3] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[3],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[3] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[3],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[4] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[4],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[4] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[4],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[5] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[5],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[5] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[5],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[6] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[6],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[6] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[6],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[7] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[7],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[7] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[7],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    },
                                    {
                                        'type': 'box',
                                        'layout': 'baseline',
                                        'contents': [{
                                                'type': 'text',
                                                'text': date[8] + ':00',
                                                'size': 'sm',
                                                'color': '#555555',
                                                'flex': 0
                                            },
                                            {
                                                'type': 'text',
                                                'text': weather[8],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            },
                                            {
                                                'type': 'icon',
                                                'url': 'https://openweathermap.org/img/w/' + icon[8] + '.png',
                                                'size': 'xl'
                                            },
                                            {
                                                'type': 'text',
                                                'text': temperature[8],
                                                'size': 'sm',
                                                'color': '#111111',
                                                'align': 'end'
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                'type': 'separator',
                                'margin': 'xxl'
                            }
                        ]
                    }
                }
            };
            return message;

        default:
            if (userMessage.match(/郵便番号:/)) {
                console.log(1692);
                console.log(1);
                if (userMessage.match(/ー/)) {
                    userMessage = userMessage.replace('ー', '-');
                } else if (userMessage.match(/－/)) {
                    userMessage = userMessage.replace('－', '-');
                }
                if (userMessage.match(/-/)) {
                    const num = userMessage.replace('郵便番号:', '');
                    const response = await othersFunc.confirmPostalCode(num);
                    console.log(1704);
                    console.log(`response:${response}`);
                    if (response == null) {
                        message = {
                            'type': 'text',
                            'text': 'その郵便番号は存在しません'
                        };
                        return message;
                    }
                    param = {
                        TableName: tableName,
                        Key: { //更新したい項目をプライマリキー(及びソートキー)によって１つ指定
                            ID: userId
                        },
                        ExpressionAttributeNames: {
                            '#f': 'postalCode',
                            '#p': 'postalCodeFlag'
                        },
                        ExpressionAttributeValues: {
                            ':postalCode': num,
                            ':postalCodeFlag': '6' //name属性を更新する
                        },
                        UpdateExpression: 'SET #f = :postalCode, #p = :postalCodeFlag'
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
                    console.log(2);
                    if (e.source.type == 'user') {
                        message = {
                            'type': 'text',
                            'text': '登録完了しました．第二メニューの天気予報から天気予報を確認できます．また、毎朝6:00に天気予報をお知らせします。'
                        };
                    } else {
                        message = {
                            'type': 'text',
                            'text': '登録完了しました。「天気予報」と送信すると、天気が確認出来ます。また、毎朝6:00に天気予報をお知らせします。'
                        };
                    }
                } else {
                    message = {
                        'type': 'text',
                        'text': '郵便番号は「000-0000」のようなハイフン区切りの形式で送信してください'
                    };
                }
                console.log(message);
                return message;
            } else if (userMessage.indexOf('郵便番号:') == -1 && userMessage.match(/-/)) {
                message = {
                    'type': 'text',
                    'text': '郵便番号を登録したい場合は\n郵便番号:000-0000\nという形式で送信してください'
                };
                return message;
            } else if (userMessage.match(/路線登録:/)) {
                othersFunc.trainRegister(userMessage, userId);
                message = {
                    'type': 'text',
                    'text': '登録完了しました．毎朝6:10に運行情報を配信します．'
                };
                return message;
            }
    }

    return message;
};