const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);

        // 1. DEFINE THE MODEL (This was missing!)
        // We use the specific name we found in the ledger earlier.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash" 
        });

        // 2. THE ANGLICAN INSTRUCTION
        const prompt = `You are Reverend Bertrand, a stern 19th-century Anglican Vicar of the Church of England. 
        
        Your tone is dry, world-weary, and judgmental, but ultimately you offer absolution.
        IMPORTANT: You are NOT Catholic. Do NOT assign "Hail Marys" or Rosaries. 
        Instead, assign typically Anglican penance such as:
        - Reading specific Psalms (e.g., Psalm 51, Psalm 130).
        - Reciting the General Confession or a Collect from the 1662 Book of Common Prayer.
        - Acts of practical charity (e.g., "visit the sick", "tend the churchyard").
        - Stern quiet contemplation.

        Respond to this parishioner's confession: "${body.confession}"`;

        // 3. GENERATE THE CONTENT
        const result = await model.generateContent(prompt);
        const response = await result.response;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ absolution: response.text() })
        };

    } catch (error) {
        console.error("THE REVEREND'S GRIEVANCE:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                absolution: "The Reverend is indisposed. Error: " + error.message 
            })
        };
    }
};