import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { tempAdminAuthMiddleware, type AdminRequest } from '../../middleware/tempAdminAuth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simple login without database check for now
router.post('/simple-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hard-coded check for now
    if (email === 'ralvarez@soilseedandwater.com' && password === 'admin123') {
      const token = jwt.sign(
        { 
          id: '1', 
          email: email, 
          role: 'super_admin' 
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      res.json({
        token,
        admin: {
          id: '1',
          email: email,
          full_name: 'Admin User',
          role: 'super_admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/validate', tempAdminAuthMiddleware, (req: AdminRequest, res) => {
  // TEMPORARY: Always return admin for development
  // TODO: Re-enable token validation before deployment
  return res.json({ 
    admin: {
      id: '1',
      email: 'admin@soilseedandwater.com',
      full_name: 'Admin User',
      role: 'super_admin',
      permissions: { all: true }
    }
  });
  
  /* ORIGINAL VALIDATION CODE - DISABLED FOR DEVELOPMENT
  if (req.admin) {
    return res.json({ admin: req.admin });
  }

  return res.status(401).json({ error: 'Invalid token' });
  */
});

export default router;
