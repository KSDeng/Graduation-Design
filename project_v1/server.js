let express = require('express');
let bodyParser = require('body-parser');

let app = express();

app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/update', (req, res) => {
	console.log('/update post called...');
	// console.log(req);
	console.log(req.body.data);	// fetching request data

	// sending response data
	res.json({ok: true});
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
