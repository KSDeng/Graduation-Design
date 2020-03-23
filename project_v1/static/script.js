import {MnistData} from './data.js';

const LR = 0.1;                  // learning rate
const TRAIN_SET_SIZE = 20000;     // training set size
const TEST_SET_SIZE = 2000;       // testing set size
const BATCH_SIZE = 512;
const epochs = 10;
const model = tf.sequential();


// Visualize some examples
async function showExamples(data) {
  // Create a container in the visor
  const surface =
    tfvis.visor().surface({ name: 'Input Data Examples', tab: 'Input Data'});  

  // Get the examples
  const examples = data.nextTestBatch(20);
  const numExamples = examples.xs.shape[0];
  
  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return examples.xs
        .slice([i, 0], [1, examples.xs.shape[1]])
        .reshape([28, 28, 1]);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}

// get training model
function getModel() {

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
    // const optimizer = tf.train.adam();

    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}
// send ajax requests to server
async function sendRequest(url, data){
    console.log('Ajax posting to: ', url);

    // https://stackoverflow.com/questions/45105992/node-js-send-data-to-backend-with-ajax
    // $.post(url, {data: data});
    $.ajax({
        type: 'POST',
        url: url,
        data: {
            data: data
        },
        success: (response) => {
            console.log('Ajax response data: ', response);
        }
    });
}

// call back between each training
async function onEpochEndCallbacks(epoch, logs) {
    // Visualize training result
    const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    const container = {
      name: 'Model Training', styles: { height: '1000px' }
    };
    tfvis.show.fitCallbacks(container, metrics);

    console.log(`Epoch ${epoch} finished, loss: ${logs.loss}`);

    // Send update to center node

    // https://js.tensorflow.org/api/latest/#tf.Tensor.dataSync
    const weights = model.layers[0].getWeights()[0];    // Kernel weights tensor
    const data = weights.dataSync();                    // get data from tensor

    // model.layers[0].getWeights()[0].print();         // print out kernel weights of first layer
    // const kernel = model.layers[0].getWeights()[0];  // kernel weights of first layer (Tensor)
    // const bias = model.layers[0].getWeights()[1];    // bias of first layer (Tensor)
    sendRequest('update', data);
}

async function train(model, data) {
    const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    const container = {
      name: 'Model Training', styles: { height: '1000px' }
    };    
  
    const [trainXs, trainYs] = tf.tidy(() => {
      const d = data.nextTrainBatch(TRAIN_SET_SIZE);
      return [
        d.xs.reshape([TRAIN_SET_SIZE, 28, 28, 1]),
        d.labels
      ];
    });
  
    const [testXs, testYs] = tf.tidy(() => {
      const d = data.nextTestBatch(TEST_SET_SIZE);
      return [
        d.xs.reshape([TEST_SET_SIZE, 28, 28, 1]),
        d.labels
      ];
    });
  
    return model.fit(trainXs, trainYs, {
      batchSize: BATCH_SIZE,
      validationData: [testXs, testYs],
      epochs: epochs,
      shuffle: true,
      callbacks: {
        onEpochEnd: onEpochEndCallbacks
      }
    });
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

async function showConfusion(model, data) {
    const [preds, labels] = doPrediction(model, data);
    const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds);
    const container = {name: 'Confusion Matrix', tab: 'Evaluation'};
    tfvis.render.confusionMatrix(container, {values: confusionMatrix}, classNames);

    labels.dispose();
}
async function run() {  
    console.log("Running...");
    const data = new MnistData();
    await data.load(TRAIN_SET_SIZE, TEST_SET_SIZE);

    await showExamples(data);

    const model = getModel();
    tfvis.show.modelSummary({name: 'Model Architecture'}, model);
  
    await train(model, data);

    await showAccuracy(model, data);
    await showConfusion(model, data);
}


document.addEventListener('DOMContentLoaded', run);


