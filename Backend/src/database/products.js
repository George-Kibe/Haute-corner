const { ObjectId } = require('mongodb');
const db = require('./db');

//to review later
const createProduct = async(id) => {
    const product = await db.products.createProduct()
    console.log(product)
    return product
}

const getAllProducts = async() => {
    const products = await db.products.find().toArray();
    //console.log(products)
    return products
}

const getProduct = async(id) => {
    const product = await db.products.findOne({_id: new ObjectId(id) });
    //console.log(product)
    return product
}

const deleteProduct = async(id) => {
    const product = await db.products.findOneAndDelete({_id: new ObjectId(id) });
    //console.log(product)
    return product
}

//update product takes id and object
const updateProduct = async(id) => {
    const product = await db.products.findOneAndUpdate({_id: new ObjectId(id) });
    console.log(product)
    return product
}

module.exports = {
    getAllProducts,
    getProduct,
    deleteProduct,
    deleteProduct
}