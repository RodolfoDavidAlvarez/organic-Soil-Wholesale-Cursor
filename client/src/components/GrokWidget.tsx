import React, { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface GrokWidgetProps {
  context?: string;
}

export function GrokWidget({ context }: GrokWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/grok/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          context: context || "Quick assistance for Organic Soil Wholesale customers",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // For simplicity, we'll just show an alert
      // In a real implementation, you might want to show this in a modal or toast
      alert(`Grok: ${data.answer}`);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Sorry, I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsOpen(true)} className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg" size="icon">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-green-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-green-600" />
          <span className="font-medium text-gray-900">Grok Assistant</span>
        </div>
        <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="mb-3 text-sm text-gray-600">Hi! I can help with soil recommendations, gardening advice, and wholesale inquiries.</div>

        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="min-h-[60px] resize-none text-sm"
            disabled={isLoading}
          />

          <Button onClick={sendMessage} disabled={!message.trim() || isLoading} className="w-full bg-green-600 hover:bg-green-700" size="sm">
            {isLoading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
