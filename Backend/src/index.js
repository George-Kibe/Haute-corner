const express = require("express");
const productRoutes = require('./routers/productRoutes');

//continue from 49:00

const app = express();
const PORT = 5000;

app.use("/products", productRoutes)

app.get("/", (req, res) => {
    res.send("<h2>Welcome to Nodejs Server</h2>")
})
app.listen(PORT, () => {
    console.log(`API is listening on port: ${PORT}`)
})