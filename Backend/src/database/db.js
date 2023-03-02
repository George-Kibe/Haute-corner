const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const uri = process.env.MONGO_URL

const client = new MongoClient(uri);

const database = client.db("AppDatabase");
const products = database.collection("products");
const orders = database.collection("orders")

module.exports = {
    products,
    orders
}