# jikanwari-bot

友達追加数3425人（2022/01/14現在）の学生向け時間割管理サービス（LINEBot）、時間割botのリポジトリです。

Webアプリケーション版のリポジトリ: https://github.com/shinbunbun/jikanwari-liff

公式サイト: https://jikanwari-bot.shinbunbun.info/

## 概要

/botがLINEBotのソースコード、/notifyが時間割お知らせ機能のソースコード、/registerAPIが時間割登録APIのソースコードです。

あと、serverlessフレームワークなんかも使ってます。

ローカルからデプロイするとdev環境、masterブランチにpushするとprd環境にデプロイされます。

## 現行バージョン

v2.0.15

## 更新履歴

2020/8/4  
v2.0.15  
「友達に勧める」の「その他」が使えないバグを修正

2020/6/24  
v2.0.14  
時間割編集をした際に6限以降が消えてしまうバグを修正

2020/6/14  
v2.0.13  
日曜日の朝に時間割お知らせ機能でエラーが発生するバグを修正

2020/6/13  
v2.0.12  
時間割メッセージを修正

2020/6/9  
v2.0.11  
時間割お知らせ機能の登録ができないバグを修正

2020/6/9  
v2.0.10  
曜日指定をpostbackイベントからmessageイベントに変更

2020/6/9  
v2.0.9  
全曜日をpostbackイベントからmessageイベントに変更

2020/6/9  
v2.0.8  
グループで時間割登録ができないバグを修正

2020/6/9  
v2.0.7  
グループ参加時のメッセージを修正

2020/6/8  
v2.0.6  
共有ID登録時に時間割お知らせ機能の登録情報などが消えてしまうバグを修正
