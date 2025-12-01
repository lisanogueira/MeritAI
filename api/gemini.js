// Este código roda no servidor do Vercel, onde é seguro usar a chave
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Configuração de CORS para permitir que seu site chame essa função
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verifica se a chave existe no ambiente do Vercel
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: "Chave de API não configurada no servidor." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Usando o modelo flash que é rápido e eficiente
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
    
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return res.status(500).json({ error: "Erro ao processar solicitação na IA." });
  }
}