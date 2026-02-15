const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const body = JSON.parse(event.body);
        // Using the user-preferred 2.5-flash model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `You are Reverend Bertrand, a stern, misanthropic 19th-century Anglican Vicar. Your tone is dry and world-weary. Respond to this confession: "${body.confession}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // ElevenLabs Voice Integration
        const voiceId = "pNInz6obpg8nEmeWvMoO"; 
        const voiceResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: responseText,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            },
            {
                headers: { "xi-api-key": process.env.ELEVEN_LABS_API_KEY, "Content-Type": "application/json" },
                responseType: "arraybuffer"
            }
        );

        const audioBase64 = Buffer.from(voiceResponse.data).toString("base64");

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ absolution: responseText, audio: audioBase64 })
        };
    } catch (error) {
        console.error("Vicarage Error:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ absolution: "The Reverend is indisposed: " + error.message }) 
        };
    }
};