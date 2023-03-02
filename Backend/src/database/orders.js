const { ObjectId } = require('mongodb');
const db = require('./db');

const getOrder = async(ref) => {
    const order = await db.orders.findOne({ref});
    return order;
}

const createOrder = async(order) => {
    const result = await db.orders.insertOne(order);
    return { ...order, _id:result.insertedId};
}

module.exports = {
    getOrder,
    createOrder
}