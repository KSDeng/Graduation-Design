'use strict';

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    // res.send('<h1>Hello world</h1');
    res.sendFile(__dirname + '/index.html');
});

// 这里io是服务器，socket是一个数据通道
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);   // 服务器发送信息给socket中的每个用户
    });
});

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});




