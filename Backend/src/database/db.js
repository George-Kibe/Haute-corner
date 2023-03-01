const {MongoClient} = require("mongodb");

const uri = 'mongodb+srv://georgekibew:0SEQcsIDnlVkW1ah@cluster1.3ny8hj0.mongodb.net/?retryWrites=true&w=majority'

const client = new MongoClient(url);

const database = client.db("AppDatabase");
const products = database.collection("products");

module.exports = {
    products
}