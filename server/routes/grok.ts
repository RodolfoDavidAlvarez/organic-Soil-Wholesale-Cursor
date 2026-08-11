import express from "express";
import { grokService, GrokMessage } from "../services/grokService";

const router = express.Router();

// Health check for Grok service
router.get("/health", async (req, res) => {
  try {
    res.json({
      status: grokService.isConfigured() ? "ok" : "disabled",
      service: "grok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Grok service health check failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// General chat endpoint
router.post("/chat", async (req, res) => {
  try {
    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: "Grok service is not configured. Please set XAI_API_KEY.",
      });
    }

    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages array is required",
      });
    }

    // Validate message format
    const validMessages: GrokMessage[] = messages.filter((msg: any) => msg.role && msg.content && ["user", "assistant", "system"].includes(msg.role));

    if (validMessages.length === 0) {
      return res.status(400).json({
        error: "At least one valid message is required",
      });
    }

    const response = await grokService.sendMessages(validMessages);
    res.json(response);
  } catch (error) {
    console.error("Grok chat error:", error);
    res.status(500).json({
      error: "Failed to process chat request",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Simple question endpoint
router.post("/ask", async (req, res) => {
  try {
    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: "Grok service is not configured. Please set XAI_API_KEY.",
      });
    }

    const { question, context } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Question string is required",
      });
    }

    const prompt = typeof context === "string" && context.trim()
      ? `Context: ${context.trim()}\n\nQuestion: ${question}`
      : question;
    const answer = await grokService.sendMessage(prompt);
    res.json({ answer });
  } catch (error) {
    console.error("Grok ask error:", error);
    res.status(500).json({
      error: "Failed to process question",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Product recommendations endpoint
router.post("/recommendations", async (req, res) => {
  try {
    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: "Grok service is not configured. Please set XAI_API_KEY.",
      });
    }

    const { soilType, plantType } = req.body;

    if (!soilType || typeof soilType !== "string") {
      return res.status(400).json({
        error: "Soil type is required",
      });
    }

    const plantContext = typeof plantType === "string" && plantType.trim()
      ? ` for ${plantType.trim()}`
      : "";
    const recommendations = await grokService.sendMessage(
      `Recommend Organic Soil Wholesale products for ${soilType.trim()} soil${plantContext}.`,
    );
    res.json({ recommendations });
  } catch (error) {
    console.error("Grok recommendations error:", error);
    res.status(500).json({
      error: "Failed to get product recommendations",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Gardening advice endpoint
router.post("/advice", async (req, res) => {
  try {
    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: "Grok service is not configured. Please set XAI_API_KEY.",
      });
    }

    const { topic } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({
        error: "Topic is required",
      });
    }

    const advice = await grokService.sendMessage(`Give practical gardening advice about ${topic.trim()}.`);
    res.json({ advice });
  } catch (error) {
    console.error("Grok advice error:", error);
    res.status(500).json({
      error: "Failed to get gardening advice",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Wholesale info endpoint
router.post("/wholesale", async (req, res) => {
  try {
    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: "Grok service is not configured. Please set XAI_API_KEY.",
      });
    }

    const { inquiry } = req.body;

    if (!inquiry || typeof inquiry !== "string") {
      return res.status(400).json({
        error: "Inquiry is required",
      });
    }

    const info = await grokService.sendMessage(`Answer this wholesale soil inquiry: ${inquiry.trim()}`);
    res.json({ info });
  } catch (error) {
    console.error("Grok wholesale error:", error);
    res.status(500).json({
      error: "Failed to get wholesale information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;


