const express = require("express");
const router = express.Router();
const {getAllProducts, getProduct} = require("../database/products")

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

module.exports = router;