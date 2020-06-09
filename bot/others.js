const line = require('@line/bot-sdk');
const client = new line.Client({
    channelAccessToken: process.env.ACCESSTOKEN
});

const getDate2 = () => {
    const now = new Date();
    // 「年」「月」「日」「曜日」を Date オブジェクトから取り出してそれぞれに代入
    let y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate(),
        w = now.getDay(),
        h = now.getHours(),
        min = now.getMinutes(),
        s = now.getSeconds(),
        mil = now.getMilliseconds();

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
    const now = new Date();
    // 「年」「月」「日」「曜日」を Date オブジェクトから取り出してそれぞれに代入
    let y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate(),
        w = now.getDay(),
        h = now.getHours(),
        min = now.getMinutes(),
        s = now.getSeconds();

    // 曜日の表記を文字列の配列で指定
    const wNames = ['日', '月', '火', '水', '木', '金', '土'];

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
    let strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
};

exports.getUuid = () => {
    const node_uuid = require('node-uuid');
    return node_uuid.v4();
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