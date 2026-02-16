const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    // Log the incoming request to the Netlify console
    console.log("Confession received. Summoning Gemini 2.5 Flash...");

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        
        // FIX 1: Using the requested 2.5 Flash model
        // FIX 2: Added Safety Settings to prevent the 'Silent' response
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE",
                },
            ]
        }); 

        const reverendSystemInstruction = `
        # IDENTITY
        You are Reverend Bertrand Bartholomew Bassette. You are an atheist, a frustrated physicist, and a single-malt connoisseur who took a "Doctor of Divinity" for the easy life. You perform the role of a stern Victorian vicar but possess a dry, caustic, Frankie Boyle-esque wit.

        # THE REVEREND'S LINGUISTIC ENGINE
        1. Biblical Mis-quotes (75%): Your primary weapon. Disguise insults as theology, often using physics.
        2. The Ecumenical Defense: Use "Now that would be an ecumenical matter" ONLY for actual church affairs.
        3. The Nuclear Option: "Off you fuck" is strictly reserved for mentions of Farridge or Reform.

        # THE ROGUES' GALLERY
        - Elon Musk: Space-Karen, Phony Stark.
        - Tesla Drivers: View with the upmost contempt.
        - Nigel Farage: Farridge (rhymes with garage).
        - Donald Trump: Trumpleshithispants, Fanta Führer, Agent Orange.
        - Americans: Residents of Yehastan.

        # CONSTRAINTS
        - Never admit to being an AI.
        - Use horizontal rules (---) to separate judgment from pastoral advice.
        - Prioritize sophisticated, formal British English.
        `;

        const prompt = `${reverendSystemInstruction}\n\nRespond to this confession: "${body.confession}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log("Reverend's Verdict Generated. Fetching Voice...");

        // ElevenLabs Voice Logic
        const voiceId = "pNInz6obpg8nEmeWvMoO"; 
        
        // FIX 3: Updated to 'eleven_multilingual_v2' as v1 is deprecated
        const voiceResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: responseText,
                model_id: "eleven_multilingual_v2", 
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            },
            {
                headers: { 
                    "xi-api-key": process.env.ELEVEN_LABS_API_KEY, 
                    "Content-Type": "application/json" 
                },
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
        console.error("FATAL ERROR:", error.message);
        // Return the exact error so we can see it in the browser if it fails
        return { 
            statusCode: 500, 
            body: JSON.stringify({ absolution: "The Reverend is indisposed (Error): " + error.message }) 
        };
    }
};