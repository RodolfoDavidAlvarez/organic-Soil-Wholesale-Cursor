// Test script to verify webhook functionality
// Run this after setting TRIVIA_WEBHOOK_URL in server/.env

const testWebhook = async () => {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    interests: ["Vegetables", "Cannabis", "Landscaping"],
    score: 4,
    answers: [0, 2, 3, 1, 2]
  };

  try {
    console.log("📤 Sending test trivia lead to API...");
    
    const response = await fetch('http://localhost:5001/api/trivia-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Success!", result);
      console.log("\n📧 Check your webhook endpoint for:");
      console.log("- JSON payload with lead data");
      console.log("- HTML email template");
      console.log("- Lead quality scoring");
    } else {
      console.error("❌ Error:", result);
    }
  } catch (error) {
    console.error("❌ Failed to send request:", error.message);
    console.log("\n💡 Make sure the server is running: npm run dev");
  }
};

console.log("🧪 Trivia Webhook Test");
console.log("=====================");
console.log("\n⚠️  Prerequisites:");
console.log("1. Add TRIVIA_WEBHOOK_URL to server/.env");
console.log("2. Start the server: npm run dev");
console.log("3. Use a service like webhook.site for testing\n");

// Add a small delay to ensure server is ready
setTimeout(testWebhook, 2000);