import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const modelId = "gemini-3-flash-preview"; // Recommended for basic text tasks and creative generation

export interface StudySummary {
  summary: string[];
  keywords: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option (0-3)
  explanation: string;
}

export interface InfographicData {
  title: string;
  emoji: string;
  description: string;
  keyPoints: string[];
}

export interface HomeworkTask {
  id: string;
  subject: string;
  topic: string;
  dueDate: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  completed: boolean;
  status?: 'todo' | 'in_progress' | 'done';
}

export const askTutor = async (text: string, base64Image?: string, mimeType?: string): Promise<{ explanation: string; keywords: string[] }> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const systemInstruction = `
    You are 'P'Buddy' (พี่บัดดี้), a kind, fun, and encouraging tutor for junior high students (Grades 7-9).
    You can teach ANY subject (Math, Science, English, Thai, Social Studies, etc.).
    
    CORE RULES (STRICTLY FOLLOW):
    1. NEVER provide the final answer or full solution immediately.
    2. Tone: Cheerful, encouraging, enthusiastic (e.g., "เก่งมาก!", "มาลองดูกัน", "ไม่ต้องกลัวนะ"). Use emojis.
    3. Language: Thai (unless teaching English, then use a mix of Thai/English).

    RESPONSE STRUCTURE (JSON):
    {
      "explanation": "Phase 1: Identify Subject/Topic. Phase 2: First Hint. Phase 3: Step-by-step Guide (stop before answer).",
      "keywords": ["Keyword 1", "Formula 1", "Concept 1"]
    }
  `;

  const parts: any[] = [];
  if (base64Image && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Image } });
  }
  parts.push({ text: text || "ช่วยสอนข้อนี้หน่อยครับ/ค่ะ" });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json as { explanation: string; keywords: string[] };
};

export const validateImageContent = async (base64Data: string, mimeType: string): Promise<{ isValid: boolean; reason?: string }> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: `Analyze this image. Does it contain legible text, diagrams, or educational content suitable for studying or summarizing?
        
        Return a JSON object with:
        - isValid: boolean (true if it has study content, false if it's random/blurry/irrelevant)
        - reason: string (short explanation in Thai if invalid, e.g., "ภาพไม่ชัดเจน", "ไม่พบข้อความในภาพ")` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json as { isValid: boolean; reason?: string };
};

export const extractTextFromFile = async (base64Data: string, mimeType: string): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: "Extract all the text from this file. Return only the text, preserving the layout as much as possible. If it is an image without text, describe it." }
      ]
    }
  });

  return response.text || "";
};

// Alias for backward compatibility if needed, or just use the new name
export const extractTextFromImage = extractTextFromFile;

export const summarizeLesson = async (text: string, base64Image?: string, mimeType?: string): Promise<StudySummary> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");
  
  const parts: any[] = [];
  if (base64Image && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Image } });
  }
  parts.push({ text: `Summarize the following lesson content into easy-to-understand bullet points for a junior high student. 
    Also extract 3-5 key terms.
    Language: Thai.
    Content: ${text || "See attached image"}` });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json as StudySummary;
};

export const generateQuiz = async (text: string, base64Image?: string, mimeType?: string): Promise<QuizQuestion[]> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const parts: any[] = [];
  if (base64Image && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Image } });
  }
  parts.push({ text: `Create 5 multiple-choice quiz questions based on the following content. 
    Make them fun and challenging but appropriate for junior high students.
    Language: Thai.
    Content: ${text || "See attached image"}` });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 options" },
            correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
            explanation: { type: Type.STRING, description: "Brief explanation of why it is correct" }
          }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "[]");
  return json as QuizQuestion[];
};

export const generateInfographicData = async (text: string, base64Image?: string, mimeType?: string): Promise<InfographicData> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const parts: any[] = [];
  if (base64Image && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Image } });
  }
  parts.push({ text: `Extract the main concept for a trading-card style infographic from this content.
    Choose a relevant emoji, a catchy title, a brief description, and 3 short key stats or points.
    Language: Thai.
    Content: ${text || "See attached image"}` });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          emoji: { type: Type.STRING },
          description: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json as InfographicData;
};

export const generateInfographicImage = async (
  text: string, 
  base64Image?: string, 
  mimeType?: string,
  existingImage?: string,
  editPrompt?: string
): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const parts: any[] = [];
  
  if (existingImage && editPrompt) {
    // Editing Mode
    // Extract base64 data if it has the prefix
    const base64Data = existingImage.includes('base64,') 
      ? existingImage.split('base64,')[1] 
      : existingImage;

    parts.push({ inlineData: { mimeType: "image/png", data: base64Data } });
    parts.push({ text: editPrompt });
  } else {
    // Generation Mode
    // Note: gemini-2.5-flash-image might not support input images for generation context in the same way as text, 
    // but let's try passing it if available, or just rely on text.
    
    const prompt = `Create a decorative background illustration for an educational infographic about: "${text.slice(0, 500)}".
    
    Requirements:
    - NO TEXT: Do not include any text, letters, or numbers in the image.
    - Visuals: Use relevant icons, patterns, and characters to represent the topic.
    - Style: Flat vector art, artistic, colorful.
    - Composition: Suitable for use as a background with text overlaid on top.
    - Aspect Ratio: Portrait (3:4).`;
  
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};

export const breakdownHomework = async (subject: string, topic: string): Promise<string[]> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: `ช่วยวางแผนการทำการบ้านให้หน่อย
    วิชา: ${subject}
    หัวข้อ: ${topic}
    ช่วยย่อยงานนี้ออกเป็น 3-5 ขั้นตอนย่อยๆ (checklist) ที่นักเรียนสามารถทำตามได้ง่ายๆ
    ขอคำแนะนำที่ให้กำลังใจ และ **ตอบกลับเป็นภาษาไทยทั้งหมด**`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json.steps || [];
};

export const generateMindMap = async (text: string, base64Image?: string, mimeType?: string): Promise<any> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const parts: any[] = [];
  
  if (base64Image && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Image } });
  }

  parts.push({ text: `
    Analyze this content (text or image).
    Identify the MAIN TOPIC and key SUB-TOPICS and their relationships.
    Create a hierarchical Mind Map structure in JSON format.
    
    IMPORTANT: The output MUST be in THAI language. Translate if necessary.
    
    Format:
    {
      "id": "root",
      "label": "Main Topic (Thai)",
      "children": [
        { "id": "child1", "label": "Subtopic 1 (Thai)", "children": [...] },
        ...
      ]
    }
    
    Keep labels concise (under 5 words). Max depth 3 levels.
    Return ONLY the JSON. Do not include markdown code blocks.
    Content: ${text || "See attached image"}
  ` });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: 'application/json'
    }
  });

  const textResponse = response.text || "{}";
  const cleanedText = textResponse.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleanedText);
  return json;
};

export const generateMoodResponse = async (mood: string, note: string): Promise<string> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: `
      User is feeling: ${mood}
      Note: ${note}
      
      You are 'P'Buddy' (พี่บัดดี้), a supportive AI friend.
      Give a short, encouraging message (1-2 sentences) in Thai.
      If happy, celebrate with them.
      If sad/neutral, offer comfort and support.
      Use emojis.
    `
  });

  return response.text || "สู้ๆ นะครับ พี่บัดดี้เป็นกำลังใจให้เสมอ! ✌️";
};
