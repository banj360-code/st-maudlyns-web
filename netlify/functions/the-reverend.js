const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });

        // 1. THE ANGLICAN INSTRUCTION (The Brain)
        const prompt = `You are Reverend Bertrand, a stern 19th-century Anglican Vicar. 
        Your tone is dry, world-weary, and judgmental. Respond to this confession: "${body.confession}"`;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        // 2. THE VOICE OF THE VICAR (ElevenLabs)
        const voiceId = "pNInz6obpg8nEmeWvMoO"; // This is a deep, authoritative voice ID
        const xiApiKey = process.env.ELEVEN_LABS_API_KEY;

        const voiceResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: responseText,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            },
            {
                headers: { "xi-api-key": xiApiKey, "Content-Type": "application/json" },
                responseType: "arraybuffer"
            }
        );

        const audioBase64 = Buffer.from(voiceResponse.data).toString("base64");

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                absolution: responseText,
                audio: audioBase64 
            })
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