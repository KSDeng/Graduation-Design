var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', (req, res) => {
	console.log('Express connection.');
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');
	// testing message
	// socket.emit('server-message', 'message from server');

	socket.on('disconnet', function(){
		console.log('a user disconnected');
	});
	socket.on('client-message', function(message){
		console.log('client message: ',message);
		socket.emit('server-message', 'client-message received by server');
	});

});

http.listen(3000, () => {
	console.log('Server listening on port 3000');
});