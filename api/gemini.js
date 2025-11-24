// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // A chave fica segura aqui no servidor da Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const { prompt } = req.body; // Recebe o texto do seu site
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ text }); // Devolve só o texto para o site
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
