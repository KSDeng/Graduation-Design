var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('static'));

var center_connected = false;

// map to save model weights
var model_weights = new Map();

app.get('/', (req, res) => {
	console.log('Express connection.');
	res.sendFile(__dirname + '/index.html');
});

app.get('/center', (req, res) => {
	console.log('Center connected.');
	res.sendFile(__dirname + '/static/home.html');
	center_connected = true;
});

io.on('connection', function(socket) {
	console.log('a user connected');
	// testing message
	socket.emit('server-message', 'message from server');

	socket.on('disconnet', function(){
		console.log('a user disconnected');
	});
	socket.on('client-message', function(message){
		console.log('client message: ',message);
		socket.emit('server-message', 'client-message received by server');
	});
	socket.on('update-model', function(layer_index, weights){
		if(center_connected){
			console.log(`update layer ${layer_index}`);
			// console.log(`kernel: ${weights.kernel}`);
			// console.log(`bias: ${weights.bias}`);
			// update layer weights
			io.emit('update-center-model', layer_index, weights);
			
		}else{
			console.error('Center node not connected.');
		}

	});

});

http.listen(3000, () => {
	console.log('Server listening on port 3000');
});



