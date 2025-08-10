// Test script for admin authentication
const API_BASE = 'http://localhost:3000/api/admin/auth';

async function testLogin() {
  console.log('Testing admin login...');
  
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ralvarez@soilseedandwater.com',
        password: 'Admin2024!Soil'
      }),
    });

    const data = await response.json();
    console.log('Login response:', response.status, data);

    if (response.ok && data.token) {
      console.log('Login successful! Testing session...');
      
      // Test session endpoint
      const sessionResponse = await fetch(`${API_BASE}/session`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });

      const sessionData = await sessionResponse.json();
      console.log('Session response:', sessionResponse.status, sessionData);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLogin();