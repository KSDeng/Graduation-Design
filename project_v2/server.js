// add remove function to array
/*
Array.prototype.indexOf = function(val){
	for(var i = 0; i < this.length; ++i){
		if(this[i] == val) return i;
	}
	return -1;
};

Array.prototype.remove = function(val){
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};
*/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var n_client = 0;
const n_epoch = 10;
var n_layer = 0;
// array to save client count of certain epoch
// var sync_flag = null;
// map to save model weights
// var model_weights = new Map();

// 2-d array to save client weights
var weights_array = null;
// count of current renewed layer
var cur_renew_count = 0;

app.use(express.static('static'));

var center_connected = false;
// var clients_id = [];		// clients ID, using fixed topo



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
	// console.log('a user connected');
	// testing message
	socket.emit('server-message', 'message from server');

	socket.on('client-connected', function(message){
		console.log(`Client ${message} connected.`);
		n_client++;
		// clients_id.push(message);
		// console.log(clients_id);
	});

	socket.on('disconnect', function(){
		console.log('a user disconnected');
	});

	socket.on('set-model-layer-length', function(length){
		console.log('model layer length: ', length);
		n_layer = length;
	});

	socket.on('start-train-center', function(){
		console.log('start training message from center, number of clients: ', n_client);
		// io.emit('server-message', 'message from server');
		io.emit('start-train-client', n_epoch);
		weights_array = new Array(n_epoch);
		for(var k = 0; k < n_epoch; ++k){
			weights_array[k] = new Array();
			for(var t = 0; t < n_layer; ++t){
				weights_array[k][t] = new Array();
			}
		}
	});

	socket.on('client-message', function(message){
		console.log('client message: ',message);
		socket.emit('server-message', 'client-message received by server');
	});



	socket.on('update-model', function(layer_index, weights, cur_epoch){
		if(center_connected){
			console.log(`receive weights of layer ${layer_index}, current epoch: ${cur_epoch}`);
			// console.log(`kernel: ${weights.kernel}`);
			// console.log(`bias: ${weights.bias}`);
			weights_array[cur_epoch][layer_index].push(weights);
			// weights_array[cur_epoch].push(weights);
			if(weights_array[cur_epoch][layer_index].length == n_client){
				// update layer weights
				io.emit('update-center-model', layer_index, weights_array[cur_epoch][layer_index]);
				// cur_renew_count++;
			}
			
		}else{
			console.error('Center node not connected.');
		}

	});

});

http.listen(3000, () => {
	console.log('Server listening on port 3000');
});



