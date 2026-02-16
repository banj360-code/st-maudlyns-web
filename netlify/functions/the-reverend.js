const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    // Log entry for debugging
    console.log("Confession received. Summoning Reverend Bassette...");

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        
        // --- FIX 1: UPDATE MODEL VERSION ---
        // 'gemini-1.5-flash' is retired/404. We use 'gemini-2.5-flash'.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            // --- FIX 2: UNBLOCK THE REVEREND'S WIT ---
            // These settings prevent the AI from censoring "The Nuclear Option"
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
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
        
        // ... previous code ...
        const responseText = result.response.text();
        
        console.log("Reverend's Verdict Generated. Fetching Voice...");

        // FIX: Updated to a valid British Voice ID (George) because the old one 404'd
        const voiceId = "JBFqnCBsd6RMkjVDRZzb"; 
        
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
        // ... rest of code ...

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
        console.error("FATAL ERROR:", error);
        // Returns the error to the front end so you don't just get silence
        return { 
            statusCode: 500, 
            body: JSON.stringify({ absolution: "The Reverend is indisposed (System Error): " + error.message }) 
        };
    }
};
// FORCE UPDATE : reverend 2.5 activation
