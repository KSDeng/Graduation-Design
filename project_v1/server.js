let express = require('express');
let bodyParser = require('body-parser');

let app = express();

app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



app.post('/update', (req, res) => {
	console.log('POST to "/update" request');
	// console.log(req);
	console.log(req.body.data);	// fetching request data
	// TODO: averaging


	// sending response data
	res.json({ok: true});
});

app.get('/home', (req, res) => {
	console.log('GET to "/home" request.');
	res.sendFile(__dirname + '/static/host.html');
});

// Handle 'GET' requests
/*
app.get('/update', (request, response) => {
	const data = request.body.data;
	console.log('Update: ', data);

});
*/

app.listen(3000, () => {
	console.log("Server started at localhost:3000");
});
