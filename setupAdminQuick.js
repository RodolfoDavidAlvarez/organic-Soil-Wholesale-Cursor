// Quick script to set up admin tables and user
// Run this in browser console at http://localhost:3000

async function setupAdmin() {
  try {
    const response = await fetch('/api/admin/setup-initial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setupKey: 'initial-setup-2024'
      })
    });

    const result = await response.json();
    console.log('Admin setup result:', result);
    
    if (result.success) {
      console.log('=====================================');
      console.log('Admin user created successfully!');
      console.log('Email: ralvarez@soilseedandwater.com');
      console.log('Password: Admin2024!Soil');
      console.log('=====================================');
      console.log('You can now login at: /admin');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
setupAdmin();