const express = require("express");
const productRoutes = require('./routers/productRoutes');
const orderRoutes = require('./routers/orderRoutes');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
    res.send("<h2>Welcome to Nodejs Server</h2>");
})
app.listen(PORT, () => {
    console.log(`API is listening on port: ${PORT}`);
})