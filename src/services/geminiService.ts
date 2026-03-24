import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SearchResult {
  title: string;
  uri: string;
  snippet?: string;
}

export async function performSearch(query: string): Promise<{ text: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Proporciona una BREVE DESCRIPCIÓN (máximo 3 líneas) de quién es la creadora o personalidad conocida llamada: ${query}. 
    Enfócate en su carrera, plataformas principales y por qué es conocida. 
    Si no conoces a la persona, indica que es una creadora emergente o independiente.`,
  });

  const text = response.text || "No hay información disponible sobre esta creadora.";
  return { text };
}
