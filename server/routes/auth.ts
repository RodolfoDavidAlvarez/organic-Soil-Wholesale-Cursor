import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  accountType: z.enum(['retail', 'wholesale', 'commercial']).default('retail'),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const updatePasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const data = signUpSchema.parse(req.body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // We'll handle email verification separately
    });

    if (authError) {
      console.error('Signup error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Update customer profile with additional data
    const { error: profileError } = await supabase
      .from('customer_profiles')
      .update({
        full_name: data.fullName,
        phone: data.phone,
        company_name: data.companyName,
        account_type: data.accountType,
        is_approved: data.accountType === 'retail', // Auto-approve retail accounts
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await supabase
      .from('email_verification_tokens')
      .insert({
        email: data.email,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

    // Send verification email
    try {
      await sendVerificationEmail(data.email, verificationToken);
      console.log('Verification email sent to:', data.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - user can request resend later
    }

    res.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      requiresApproval: data.accountType !== 'retail',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in endpoint
router.post('/signin', async (req, res) => {
  try {
    const data = signInSchema.parse(req.body);

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get customer profile
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if account is approved for wholesale/commercial
    if ((profile.account_type === 'wholesale' || profile.account_type === 'commercial') && !profile.is_approved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    // Log activity
    await supabase
      .from('customer_activity_log')
      .insert({
        customer_id: authData.user.id,
        action: 'signin',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

    res.json({
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: profile,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Sign out endpoint
router.post('/signout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Signout error:', error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Signout error:', err);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === data.email);

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await supabase
      .from('password_reset_tokens')
      .insert({
        email: data.email,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

    // Send reset email
    try {
      await sendPasswordResetEmail(data.email, resetToken);
      console.log('Password reset email sent to:', data.email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Return success anyway to not reveal if email exists
    }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Update password with reset token
router.post('/update-password', async (req, res) => {
  try {
    const data = updatePasswordSchema.parse(req.body);

    // Verify reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', data.token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Get user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === tokenData.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: data.newPassword }
    );

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Verify email token
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Get user and update email confirmed
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === tokenData.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user email confirmation
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ verified: true })
      .eq('id', tokenData.id);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Get current user session
router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get customer profile
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        profile: profile,
      },
    });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

export default router;