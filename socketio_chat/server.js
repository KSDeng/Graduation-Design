'use strict';

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    // res.send('<h1>Hello world</h1');
    res.sendFile(__dirname + '/index.html');
});

// ����io�Ƿ�������socket��һ������ͨ��
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);   // ������������Ϣ��socket�е�ÿ���û�
    });
});

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});




