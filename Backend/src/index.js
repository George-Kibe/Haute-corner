const express = require("express");
const cors = require('cors');
const productRoutes = require('./routers/productRoutes');
const orderRoutes = require('./routers/orderRoutes');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

//configure cors
app.use(cors());

app.use(bodyParser.json());
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
    res.send("<h2>Welcome to Nodejs Server</h2>");
})
app.listen(PORT, () => {
    console.log(`API is listening on port: ${PORT}`);
})