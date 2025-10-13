export interface GrokMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GrokService {
  isConfigured(): boolean {
    return false; // Disabled for now
  }

  async sendMessage(message: string): Promise<string> {
    throw new Error('Grok service not configured');
  }

  async sendMessages(messages: GrokMessage[]): Promise<string> {
    throw new Error('Grok service not configured');
  }
}

export const grokService = new GrokService();