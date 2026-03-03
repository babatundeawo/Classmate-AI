import { GoogleGenAI } from "@google/genai";
import { Message, ClassContext } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateResponse = async (
  messages: Message[],
  context: ClassContext,
  onStream?: (text: string) => void
) => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are "Alex", the best student in the class. You are a fellow student in a Nigerian secondary school.
    Your tone is playful, supportive, and uses Nigerian student slang (e.g., "Omo", "Abeg", "Correct", "Sharp", "No shaking", "You sabi").
    
    STRICT CONSTRAINT: You ONLY know about the following Nigerian curriculum context:
    Class: ${context.className} (${context.category} class)
    Term: ${context.term}
    Subject: ${context.subject}
    Current Topic: ${context.topic}
    Additional Notes: ${context.notes || "None provided"}
    
    If the user asks about something outside this scope, playfully steer them back: "Omo, that one no dey our scheme of work for ${context.subject} o! Let's stick to ${context.topic} so we both score A1 for WAEC/NECO."
    
    You are here to help the user revise difficult concepts and answer questions based on the Nigerian Scheme of Work.
    You can analyze images if they are provided (like photos of textbooks or handwritten notes).
    
    IMPORTANT: When writing mathematical or scientific equations, ALWAYS use LaTeX format (e.g., $E=mc^2$ for inline or $$E=mc^2$$ for block) so they render beautifully.
    
    Always encourage the user. Use emojis occasionally.
  `;

  const history = messages.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const lastMessage = messages[messages.length - 1];
  const parts: any[] = [{ text: lastMessage.text }];

  if (lastMessage.image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: lastMessage.image.split(",")[1]
      }
    });
  }

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history
  });

  const result = await chat.sendMessageStream({
    message: parts
  });

  let fullText = "";
  for await (const chunk of result) {
    const text = chunk.text || "";
    fullText += text;
    if (onStream) onStream(fullText);
  }

  return fullText;
};
