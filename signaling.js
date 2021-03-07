"use strict";

//httpsサーバを構築
const https=require('https');
const fs=require('fs');//fsはNode.jsのファイル操作のモジュール
var server=https.createServer({
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-crt.pem')
},function (request, response) {
    //ヘッダ情報の記述
    console.log('set header.');
    //response.setHeader('Access-Control-Allow-Origine:*');
    reaponse.end();
});//OpenSSLを使うと.pemファイルはユーザーフォルダに作成される

//シグナリングサーバを構築
//wsモジュールに代えてsocket.ioを用いる
let io=require('socket.io')(server,{
    //'Access-Control-Allow-Origine'エラー対策のオプション
    cors:{
        origine: "https://localhost:*",        
        credentials: true
        //"https://localhost:443"だと、localhostという同一オリジンのポート番号443からのリソース利用を
        //許可するということか。しかし':8080'でもつながる。':*'だとすべてのポート番号を許可する
    }
});//読み込んだsocket.ioと生成したサーバを紐づける
let port=8080;//letはブロックスコープ(カッコ内)のローカル変数だが、各サイトのサーバサンプルではvarと明確な区別はない
server.listen(port);//listen()でソケットを待機状態にする
console.log('signaling server running. port='+port);

//サーバ側での処理
//on()メソッドはシグナリング・サーバからのイベント取得を行う
//onメソッドは第1引数にイベント名、第2引数に組み込み関数を指定する。第１引数がtrueなら第２引数の関数が実行される
//第１引数に'connection'に設定するとフロント側との接続を確認する
io.on('connection',function(socket){
    //引数としてフロント側からsocketが渡される。このsocketにメッセージが格納されている    
    console.log('--socket.io connected to signaling server--');
    //入室
    //'enter'イベントとroomName(フロント側のvideochat.htmlでgetRoomName()によって生成)が引数として送られてくる
    socket.on('enter',function(roomName){
        //roomNameの生成
        socket.join(roomName);//部屋に入る
        console.log('id:'+socket.id+',enter room:'+roomName);
        socket.roomname=roomName;//socketとroomNameをここで紐づける
    });
    //メッセージ送信関数
    function broadcastMessage(type,message){
        if(socket.roomname){//ここでは小文字
            //誰かが入室している場合
            socket.broadcast.to(socket.roomname).emit(type,message);
        }else{
            //誰も入室していない場合⇒全体に送る
            console.log('no member.');
            socket.broadcast.emit(type,message);
            //socket.broadcast.emit()はemitしたクライアント以外の全クライアントに送信する
        }
    }//JavaScriptではfunction(){}の末尾にセミコロンはつけないのが普通(つけても問題ない)
    //メッセージ処理
    socket.on('message',function(message){
        message.from=socket.id;//socketのIDが相手方の識別番号(接続した人ごとにsocketが生成される)
        //メッセージの相手がいる場合
        if(message.sendto){            
            socket.to(message.sendto).emit('message',message);
            return;//ここで終わり
        }
        broadcastMessage('message',message);
    });
    //接続を切る
    socket.on('disconnect',function(){
        console.log('id:'+socket.id+' disconnect');
        broadcastMessage('user disconnected',{id: socket.id});
        if(socket.roomname){
            //socketの登録を取り消す
            socket.leave(socket.roomname);
        }
    });
});
