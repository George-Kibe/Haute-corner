// const { ObjectId } = require('mongodb');
const getDB = require('./db');

const getOrder = async (ref) => {
  const order = await getDB().orders.findOne({ ref });
  return order;
};

const createOrder = async (order) => {
  const result = await getDB().orders.insertOne(order);
  return { ...order, _id: result.insertedId };
};

module.exports = {
  getOrder,
  createOrder,
};
