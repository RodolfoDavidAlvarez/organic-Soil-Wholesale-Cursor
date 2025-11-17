#!/usr/bin/env node

/**
 * Test script to verify Grok API integration
 */

import { grokService } from "./server/services/grokService.js";

async function testGrokIntegration() {
  console.log("🧪 Testing Grok API Integration...\n");

  try {
    // Test 1: Basic question
    console.log("📝 Test 1: Basic question");
    const answer1 = await grokService.askQuestion("What is organic soil?");
    console.log("✅ Response:", answer1.substring(0, 100) + "...\n");

    // Test 2: Product recommendation
    console.log("📝 Test 2: Product recommendation");
    const answer2 = await grokService.getProductRecommendations("clay soil", "tomatoes");
    console.log("✅ Response:", answer2.substring(0, 100) + "...\n");

    // Test 3: Gardening advice
    console.log("📝 Test 3: Gardening advice");
    const answer3 = await grokService.getGardeningAdvice("How often should I water my vegetable garden?");
    console.log("✅ Response:", answer3.substring(0, 100) + "...\n");

    console.log("🎉 All tests passed! Grok integration is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure your XAI_API_KEY is set in .env");
    console.log("   2. Verify the API key is valid and has sufficient credits");
    console.log("   3. Check your internet connection");
    console.log("   4. Ensure the API key format is correct (starts with xai-)");
  }
}

testGrokIntegration();




