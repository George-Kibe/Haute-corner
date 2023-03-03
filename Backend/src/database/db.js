const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const uri = process.env.MONGO_URL

let client;

const getDB = () => {
    if (!client) {
        client = new MongoClient(uri);
    }
    const database = client.db("AppDatabase");
    const products = database.collection("products");
    const orders = database.collection("orders")

    return {
        products,
        orders,
    }

}



module.exports = getDB;