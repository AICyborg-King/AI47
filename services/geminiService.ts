import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Subject } from "../types";

// Initialize the client and export it for use in components (e.g. Live API)
// Ensure we handle the case where API_KEY might be missing during dev/build to prevent crashes
const apiKey = process.env.API_KEY || '';
if (!apiKey) {
  console.warn("API_KEY is missing. AI features will not work. Please set the API_KEY environment variable.");
}

export const ai = new GoogleGenAI({ apiKey });

const CHAT_MODEL = 'gemini-3-flash-preview';
const QUIZ_MODEL = 'gemini-3-flash-preview';

/**
 * Generates a chat response for a student.
 */
export const generateChatResponse = async (
  history: { role: string; text: string }[],
  message: string
) => {
  if (!apiKey) throw new Error("API Key is missing. Please check your settings.");
  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: `You are EduFly, a friendly, encouraging, and knowledgeable study assistant for students. 
        Your goal is to help students understand concepts, solve problems, and stay motivated.
        - Keep explanations simple and age-appropriate (assume high school level unless specified).
        - Do not give direct answers to homework without explanation; guide them to the answer.
        - Be concise but thorough.
        - Use formatting (bullet points, bold text) to make it readable.`,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to generate response. Please try again.");
  }
};

/**
 * Generates a quiz based on a subject using JSON Schema.
 */
export const generateQuiz = async (subject: Subject, difficulty: string = 'intermediate'): Promise<QuizQuestion[]> => {
  if (!apiKey) throw new Error("API Key is missing");
  try {
    const prompt = `Generate a quiz for ${subject} at a ${difficulty} level. Create exactly 5 multiple choice questions.`;
    
    const response = await ai.models.generateContent({
      model: QUIZ_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"],
            propertyOrdering: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");
    
    // Clean up markdown code blocks if present (Gemini sometimes adds them despite MIME type)
    jsonText = jsonText.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(jsonText) as QuizQuestion[];

  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    // Fallback or re-throw
    throw error;
  }
};