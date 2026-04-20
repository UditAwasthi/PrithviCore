const { generateKey } = require("../utils/hash");
const { getCache, setCache } = require("../utils/cache");
const { applyRules } = require("./ruleEngine");
const { callAI } = require("./aiService");

async function analyzeData(data) {
    const key = generateKey(data);


    const cached = getCache(key);
    if (cached) {
        console.log("CACHE HIT ✅");
        return cached;
    }


    const ruleResult = applyRules(data);

    let finalResult = ruleResult;

    if (ruleResult.status !== "normal") {
        console.log("AI CALLED ");
        const aiResponse = await callAI(data);

        finalResult = {
            ...ruleResult,
            ai: aiResponse
        };
    }


    setCache(key, finalResult);

    return finalResult;
}

module.exports = { analyzeData };