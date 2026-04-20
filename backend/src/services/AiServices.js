const axios = require("axios");

async function callAI(data) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Return short agriculture recommendation in JSON"
                    },
                    {
                        role: "user",
                        content: JSON.stringify(data)
                    }
                ],
                temperature: 0.3
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;

    } catch (error) {
        return JSON.stringify({ error: "AI unavailable" });
    }
}

module.exports = { callAI };