import {MnistData} from './data.js';

const data = new MnistData();
data.load(55000, 10000);

const LR = 0.1;						// learning rate
const model = tf.sequential();		// model as global variable

// var model_weights = new Map();
// Socket settings
var socket = io();
socket.on('server-message', function(message){
    console.log('server message: ', message);
});

// Update model weights
// layer_index: which layer to update
socket.on('update-center-model', function(layer_index, weights_array){
	const length = weights_array.length;
	console.log("weights_array length: ", length);

	var kernel_sum = null, bias_sum = null;
	for(var i = 0; i < length; ++i){
		if(kernel_sum == null){
			kernel_sum = tf.tensor(weights_array[i].kernel);
		}else{
			kernel_sum = tf.add(kernel_sum, tf.tensor(weights_array[i].kernel));
		}

		if(bias_sum == null){
			bias_sum = tf.tensor(weights_array[i].bias);
		}else{
			bias_sum = tf.add(bias_sum, tf.tensor(weights_array[i].bias));
		}
	}
	var kernel_avg = tf.div(kernel_sum, length);
	var bias_avg = tf.div(bias_sum, length);
	model.layers[layer_index].setWeights([kernel_avg, bias_avg]);
	console.log(`Layer ${layer_index} updated.`);

});

function getModel() {

    // load model
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1;

    // In the first layer of our convolutional neural network we have 
    // to specify the input shape. Then we specify some parameters for 
    // the convolution operation that takes place in this layer.
    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));

    // The MaxPooling layer acts as a sort of downsampling using max values
    // in a region instead of averaging.  
    model.add(tf.layers.maxPooling2d({poolSize: [2,2], strides: [2,2]}));

    // Repeat another conv2d + maxPooling stack. 
    // Note that we have more filters in the convolution.
    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
  
    // Now we flatten the output from the 2D filters into a 1D vector to prepare
    // it for input into our last layer. This is common practice when feeding
    // higher dimensional data to a final classification output layer.
    model.add(tf.layers.flatten());

    // Our last layer is a dense layer which has 10 output units, one for each
    // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
    const NUM_OUTPUT_CLASSES = 10;
    model.add(tf.layers.dense({
        units: NUM_OUTPUT_CLASSES,
        kernelInitializer: 'varianceScaling',
        activation: 'softmax'
    }));

  
    // Choose an optimizer, loss function and accuracy metric,
    // then compile and return the model
    const optimizer = tf.train.sgd(LR);     // use SGD optimizer

    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    // set model length to server
    // socket.emit('set-model-size', model.layers.length);
    // return model;
    socket.emit('set-model-layer-length', model.layers.length);
}
const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

function doPrediction(model, data, testDataSize = 500) {
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const testData = data.nextTestBatch(testDataSize);
    const testxs = testData.xs.reshape([testDataSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
    const labels = testData.labels.argMax([-1]);
    const preds = model.predict(testxs).argMax([-1]);

    testxs.dispose();
    return [preds, labels];
}


async function showAccuracy(model, data) {
    const [preds, labels] = doPrediction(model, data);
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
    const container = {name: 'Accuracy', tab: 'Evaluation'};
    tfvis.show.perClassAccuracy(container, classAccuracy, classNames);

    labels.dispose();
}

// Get model after DOMContent loaded
document.addEventListener('DOMContentLoaded', getModel);

document.getElementById('StartTraining').addEventListener("click", function(){
	console.log('Start training');
	// socket.emit('start-train-client');
	socket.emit('start-train-center');
});

document.getElementById('EvaluateModel').addEventListener("click", function(){
	console.log('Evaluate model');
	showAccuracy(model, data);
});

