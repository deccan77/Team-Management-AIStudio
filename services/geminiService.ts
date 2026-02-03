
import { GoogleGenAI, Type } from "@google/genai";
import { Order, TeamMember, OrderStatus, OrderPriority } from "../types";

// Always use named parameter for apiKey and directly access process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOrderFromText = async (text: string): Promise<Partial<Order>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform this request into a structured work order JSON: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, description: 'One of: Low, Medium, High' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "priority", "tags"]
        }
      }
    });

    // Directly access .text property from GenerateContentResponse
    const result = JSON.parse(response.text || '{}');
    return {
      title: result.title,
      description: result.description,
      priority: result.priority as OrderPriority,
      tags: result.tags,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error("Gemini Order Generation Error:", error);
    throw error;
  }
};

export const getSmartAssignee = async (order: Partial<Order>, team: TeamMember[]): Promise<string> => {
  try {
    const teamSummary = team.map(m => `ID: ${m.id}, Name: ${m.name}, Role: ${m.role}, Skills: ${m.skills.join(', ')}, Availability: ${m.availability}%`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following team members:\n${teamSummary}\n\nWho is the best person to assign this order to: "${order.title} - ${order.description}"? Reply ONLY with the ID of the team member.`,
    });

    // Directly access .text property from GenerateContentResponse
    const suggestedId = response.text.trim();
    // Validate if the ID exists
    const validId = team.find(m => m.id === suggestedId)?.id;
    return validId || team[0].id;
  } catch (error) {
    console.error("Gemini Assignment Suggestion Error:", error);
    return team[0].id;
  }
};

export const getProjectSummary = async (orders: Order[]): Promise<string> => {
  try {
    const orderData = JSON.stringify(orders.map(o => ({ title: o.title, status: o.status })));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a concise, professional summary of the current work status for these orders: ${orderData}. Mention any potential risks or general progress trends.`,
    });
    // Directly access .text property from GenerateContentResponse
    return response.text;
  } catch (error) {
    return "Unable to generate summary at this time.";
  }
};
