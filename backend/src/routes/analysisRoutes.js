const express = require("express");
const router = express.Router();
const { analyzeData } = require("../services/analysisService");

router.post("/analyze", async (req, res) => {
    try {
        const result = await analyzeData(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;