const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.send("Get all Products!")
})

router.get("/:productId", (req, res) => {
    const {productId} = req.params;
    res.send(`Get Product with id ${productId}`)
})

module.exports = router;