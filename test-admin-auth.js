import "dotenv/config";

const API_BASE = process.env.ADMIN_API_BASE || "http://localhost:3000/api/admin/auth";
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

async function testLogin() {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  console.log("Login response status:", response.status);

  if (!response.ok || !data.token) {
    throw new Error("Admin login failed");
  }

  const sessionResponse = await fetch(`${API_BASE}/session`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  console.log("Session response status:", sessionResponse.status);

  if (!sessionResponse.ok) {
    throw new Error("Admin session validation failed");
  }
}

testLogin().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
