const functions = require('firebase-functions');

const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const productRoutes = require('./routers/productRoutes');
const orderRoutes = require('./routers/orderRoutes');

const app = express();

app.get('/', (req, res) => {
  res.send('<h2>Welcome to Nodejs Server</h2>');
});
// configure cors
app.use(cors());

app.use(bodyParser.json());
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

exports.app = functions.https.onRequest(app);
