import axios from "axios";

export interface GrokMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokService {
  private apiKey: string;
  private baseURL: string = "https://api.x.ai/v1";
  private configured: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.XAI_API_KEY || "";
    this.configured = Boolean(this.apiKey);
  }

  async chat(messages: GrokMessage[], model: string = "grok-2-latest"): Promise<GrokResponse> {
    if (!this.configured) {
      throw new Error("Grok service is not configured. Please set XAI_API_KEY.");
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        throw new Error(`Grok API Error: ${errorMessage}`);
      }
      throw error;
    }
  }

  async askQuestion(question: string, context?: string): Promise<string> {
    const messages: GrokMessage[] = [];

    if (context) {
      messages.push({
        role: "system",
        content: `You are a helpful assistant for Organic Soil Wholesale. Context: ${context}`,
      });
    } else {
      messages.push({
        role: "system",
        content:
          "You are a helpful assistant for Organic Soil Wholesale, specializing in organic soil products, gardening advice, and wholesale inquiries.",
      });
    }

    messages.push({
      role: "user",
      content: question,
    });

    const response = await this.chat(messages);
    return response.choices[0]?.message?.content || "Sorry, I could not generate a response.";
  }

  async getProductRecommendations(soilType: string, plantType?: string): Promise<string> {
    const prompt = plantType
      ? `Recommend organic soil products for ${soilType} soil and ${plantType} plants.`
      : `Recommend organic soil products for ${soilType} soil.`;

    return this.askQuestion(prompt, "Product recommendations for soil and gardening needs");
  }

  async getGardeningAdvice(topic: string): Promise<string> {
    return this.askQuestion(topic, "Gardening and soil care advice");
  }

  async getWholesaleInfo(inquiry: string): Promise<string> {
    return this.askQuestion(inquiry, "Wholesale pricing and bulk order information");
  }

  isConfigured() {
    return this.configured;
  }
}

// Export a singleton instance
export const grokService = new GrokService();
