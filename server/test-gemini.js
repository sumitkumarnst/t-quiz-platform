require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("Listing models...");
        // There isn't a direct listModels on genAI instance in some versions, 
        // but let's try to just generate with 'gemini-pro' to see if it works,
        // or attempt to use the model and catch error which might list available models.

        // Actually, we can use the API url directly if needed, but let's try a safe fallback first.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());

        const flash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resFlash = await flash.generateContent("Hello");
        console.log("gemini-1.5-flash works:", resFlash.response.text());

    } catch (error) {
        console.error("Error:", error.message);
    }
}
listModels();
