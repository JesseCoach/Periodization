
import { GoogleGenAI, Type } from "@google/genai";
import { TrainingProgram, IntensityUnit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProgramAI = async (goal: string, experience: string): Promise<Partial<TrainingProgram>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a world-class Strength & Conditioning coach. Create a generic 1-week microcycle (designed to be repeated/progressed) for an athlete with the following goal: "${goal}" and experience level: "${experience}". 
    The program should have 3 distinct training days.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            sets: { type: Type.NUMBER },
                            reps: { type: Type.STRING },
                            intensity: { type: Type.STRING },
                            unit: { type: Type.STRING, description: "Must be RPE, % 1RM, or RIR" },
                            rest: { type: Type.STRING },
                            notes: { type: Type.STRING },
                            category: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse AI response", error);
    throw error;
  }
};
