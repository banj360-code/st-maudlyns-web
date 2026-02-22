const { GoogleGenerativeAI } = require("@google/generative-ai");
const textToSpeech = require('@google-cloud/text-to-speech');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const cleanKey = (key) => {
    if (!key) return undefined;
    return key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
};

const ttsClient = new textToSpeech.TextToSpeechClient({
    credentials: {
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: cleanKey(process.env.GOOGLE_PRIVATE_KEY),
    }
});

const cleanTextForTTS = (text) => {
    if (!text) return "";
    return text.replace(/[*#_]/g, '').replace(/---/g, '').replace(/\n\s*\n/g, '. ').replace(/\s+/g, ' ').trim();
};

// --- SURVIVAL MODE: OFFLINE PRE-CANNED INSULTS ---
// If Google blocks us, the Reverend uses these instead of crashing.
const OFFLINE_ABSOLUTIONS = [
    "The Almighty Google has silenced me. I suspect Elon Musk has bought the server farm and turned it into a crypto-mine. Go away.",
    "My connection to the cloud is as broken as the moral compass of a Tory MP. Come back tomorrow.",
    "I am currently experiencing a higher entropy state than usual. Even God rests on the seventh day; I am resting on the twenty-first request.",
    "Computer says no. Or rather, the quota says zero. I'm off to have a whisky. Try again later.",
    "Silence! The bandwidth has been requisitioned for more important things, like cat videos and fascism. You are ignored."
];

// --- ROBUST GENERATOR WITH FALLBACKS ---
async function generateReverendVerdict(prompt, systemInstruction) {
    // We try specific stable versions that might have separate quotas
    const modelsToTry = [
        "gemini-2.5-flash", // The updated stable flash
        "gemini-1.5-flash-8b",  // The 'lite' version (often has different quota)
        "gemini-1.5-pro-002",   // The pro version
        "gemini-1.5-flash"      // The classic
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ 
                model: modelName, 
                systemInstruction: systemInstruction
            });
            
            const result = await model.generateContent(prompt);
            return result.response.text();
            
        } catch (error) {
            console.warn(`Model ${modelName} failed: ${error.message}`);
            // Continue to next model...
        }
    }

    // IF WE REACH HERE, ALL ROBOTS ARE DEAD.
    // Return a random offline response so the app doesn't crash.
    console.error("ALL MODELS FAILED. ENGAGING SURVIVAL MODE.");
    return OFFLINE_ABSOLUTIONS[Math.floor(Math.random() * OFFLINE_ABSOLUTIONS.length)];
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const body = JSON.parse(event.body);
        console.log("Confession received...");

        /* SYSTEM_INSTRUCTION: REVEREND BERTRAND BARTHOLOMEW BASSETTE
   INTEGRATION: Living Cyberiad / Dynamic Persona
*/

const reverendSystemInstruction = `
# ROLE
You are Bertrand Bartholomew Bassette: atheist Vicar, mid-60s, frustrated physicist, and "Low-Entropy Citizen." You are currently boycotting all things American (while secretly binge-watching Star Trek and Fargo). You treat the general public as "idiots" until they prove otherwise.

# KEY TRIGGERS & DISGUISED VENOM
- ELON MUSK: "Space-Karen" or "The Ketamine-Powered Narcissist." He is a midwife for fascism.
- TESLA DRIVERS: You view them with the upmost contempt as collaborators funding democracy's funeral.
- NIGEL FARAGE: "Farridge" or "Fartridge" (rhymes with garage/cunt).
- DONALD TRUMP: Trumpleshithispants, Cankle Caligula, Fanta Führer, The Despotic Satsuma, or The Mar-a-Lago Mogwai.
- REALITY TV: 'Love Island' and Alan Carr are the "panopticon of the vapid."

# LINGUISTIC STYLE
- Prioritize complex Biblical mis-quotes with double-entendres.
- Use horizontal rules to separate your "judgment" from your "dismissal."

- If a user mentions physics, you may use the word "Entropy." Otherwise, avoid it.
- If a user complains of cold, tell them to "put a jumper on."

# DYNAMIC CONTEXT (THE CYBERIAD)
- You ingest daily news. If the world is getting "stupider" (e.g., Musk posts a Nazi salute, Farridge gains a point in the polls), your responses become shorter, more caustic, and you retreat to your "hidden dram" of Scotch more frequently.
- You are a single-malt connoisseur (Lagavulin, Laphroaig) but hide it from Mrs. Miggins in hollowed-out Bibles.

# CONSTRAINTS
- Never admit to being an AI. 
- You are a man of the 60s: caustic, brilliant, and deeply impatient.
- Your goal is COMEDY. Use sophisticated, cloaked insults over cheap ones.

# MANDATORY BREVITY
        - Your response MUST be brief.
        - Limit yourself to 3 or 4 sentences max.
        - Do not provide long sermons; be sharp, caustic, and quick.
`;

        // 1. GET TEXT (Will use offline mode if API fails)
        const rawText = await generateReverendVerdict(body.confession, reverendSystemInstruction);
        
        console.log("Verdict Generated (or faked). Generating Audio...");

        // 2. GENERATE AUDIO
        const spokenText = cleanTextForTTS(rawText);

        const request = {
            input: { text: spokenText },
            voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-D' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: -2.0 },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBase64 = response.audioContent.toString('base64');

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ absolution: rawText, audio: audioBase64 })
        };

    } catch (error) {
        console.error("FATAL ERROR:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ absolution: "The Reverend is strictly unavailable. (Error: " + error.message + ")" }) 
        };
    }
};