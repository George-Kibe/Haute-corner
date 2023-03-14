const { ObjectId } = require('mongodb');
const getDB = require('./db');

// to review later
const createProduct = async () => {
  const product = await getDB().products.createProduct();
  console.log(product);
  return product;
};

const getAllProducts = async () => {
  const products = await getDB().products.find().toArray();
  // console.log(products)
  return products;
};

const getProduct = async (id) => {
  const product = await getDB().products.findOne({ _id: new ObjectId(id) });
  // console.log(product)
  return product;
};

const deleteProduct = async (id) => {
  const product = await getDB().products.findOneAndDelete({ _id: new ObjectId(id) });
  // console.log(product)
  return product;
};

// update product takes id and object
const updateProduct = async (id) => {
  const product = await getDB().products.findOneAndUpdate({ _id: new ObjectId(id) });
  console.log(product);
  return product;
};

module.exports = {
  getAllProducts,
  getProduct,
  deleteProduct,
  createProduct,
  updateProduct,
};
