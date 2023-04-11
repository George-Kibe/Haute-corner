const express = require("express");
const router = express.Router();
const {getAllProducts, getProduct, createProduct} = require("../database/products")

router.get("/", async (req, res) => {
    const products = await getAllProducts();
    res.status(200).send({status: "OK", data: products})
})

router.get("/:productId", async(req, res) => {
    try{
        const {productId} = req.params;
        const product = await getProduct(productId)
        if (!product){
            res.status(404).send({status: "FAILED", error:"Product Not Found"})
        }
        res.status(200).send({status:"OK", data:product})
    }catch(error){
        res.status(400).send({status:"Bad Request", error:error.message})
    }
})

router.post("/new", async (req, res) => {
    // console.log(req.body)
    const product = req.body
    try {
        const productDoc = await createProduct(product);
        res.status(201).send({status: "Created", data: productDoc})
    } catch (error) {
        res.status(422).send({status:"Unprocessable Entry", error:error.message})
    }
})


module.exports = router;