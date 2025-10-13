/**
 * Setup script for Grok AI environment configuration
 * Run this script to set up your environment variables for Grok integration
 */

import fs from "fs";
import path from "path";

const API_KEY = "your_xai_api_key_here";

function setupEnvironment() {
  const envPath = path.join(process.cwd(), ".env");
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log("Creating .env file...");
    fs.writeFileSync(envPath, "");
  }
  
  // Read existing .env content
  let envContent = fs.readFileSync(envPath, "utf8");
  
  // Check if XAI_API_KEY already exists
  if (envContent.includes("XAI_API_KEY")) {
    console.log("XAI_API_KEY already exists in .env file");
    console.log("Please update it manually with your actual API key");
    return;
  }
  
  // Add the API key to .env
  const newEnvContent = envContent + `\n# Grok AI Configuration\nXAI_API_KEY=${API_KEY}\n`;
  
  fs.writeFileSync(envPath, newEnvContent);
  console.log("✅ XAI_API_KEY added to .env file");
  console.log("⚠️  Please replace 'your_xai_api_key_here' with your actual xAI API key");
}

function validateEnvironment() {
  const envPath = path.join(process.cwd(), ".env");
  
  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found");
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, "utf8");
  
  if (!envContent.includes("XAI_API_KEY")) {
    console.log("❌ XAI_API_KEY not found in .env file");
    return false;
  }
  
  if (envContent.includes("your_xai_api_key_here")) {
    console.log("⚠️  Please update XAI_API_KEY with your actual API key");
    return false;
  }
  
  console.log("✅ Grok environment configuration is valid");
  return true;
}

// Main execution
console.log("🚀 Setting up Grok AI environment...\n");

try {
  setupEnvironment();
  
  console.log("\n🔍 Validating configuration...");
  const isValid = validateEnvironment();
  
  if (isValid) {
    console.log("\n🎉 Grok AI environment setup complete!");
    console.log("You can now start using Grok AI features in your application.");
  } else {
    console.log("\n⚠️  Setup incomplete. Please update your API key in .env file");
  }
  
} catch (error) {
  console.error("❌ Error setting up Grok environment:", error.message);
  process.exit(1);
}
