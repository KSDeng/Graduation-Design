let express = require('express');

let app = express();

app.use(express.static('static'));

// Handle 'GET' requests
app.get('/', (request, response) => {

});

app.listen(3000, () => {
	console.log("Server started at localhost:3000");
});
