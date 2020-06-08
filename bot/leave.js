const AWS = require('aws-sdk');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();
const tableName = 'TimeTable';

exports.leave = async (e) => {
    if (e.source.type == 'group') {
        const groupId = e.source.groupId;
        const param = {
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
    }
};