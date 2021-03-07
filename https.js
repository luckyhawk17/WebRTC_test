"use strict";

const https=require('https');
const fs=require('fs');
const sslServerKey='server-key.pem';
const sslServerCrt='server-crt.pem';
let port=443;

const options={
    key: fs.readFileSync(sslServerKey),
    cert: fs.readFileSync(sslServerCrt)
};

const server=https.createServer(options,
    function (request, response) {//ラムダ式で(request,response)=>{}でもよいが、修正を提案される
    fs.readFile('./videochat.html', 'UTF-8',//indexファイルの読み込み
        function (error, data) {           
            //ヘッダ情報の記述
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(data);                
            //response.end()の引数はなくてもよい。
            response.end();
            });
        //response.writeHead(200,{'Contest-Type':'text/plain'});
        //response.end();            
    }
);
server.listen(port);
console.log('web server running. port='+port);

