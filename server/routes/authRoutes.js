import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendOtpEmail } from '../lib/mailer.js';

const router = Router();

// Zod Validation Schemas
const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const handleRegister = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check DB level uniqueness constraint
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Secure password hashing using bcrypt
    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name ? name.trim() : normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password_hash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT token & set HTTP-only cookie
    const token = generateToken({ userId: user.id, email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during registration' });
  }
};

/**
 * POST /api/auth/register and /api/auth/signup
 * Register a new user with hashed password and unique email constraint check
 */
router.post('/register', handleRegister);
router.post('/signup', handleRegister);

/**
 * POST /api/auth/login
 * Authenticate user, compare bcrypt hash, issue JWT cookie
 */
router.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.json({ user: userPayload, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during login' });
  }
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Fetch authenticated user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(444).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
});

// Profile Update Schema
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

const handleUpdateProfile = async (req, res) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { name, email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const userId = req.user.userId;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(444).json({ error: 'User not found' });
    }

    // Check email uniqueness if email is changed
    if (normalizedEmail !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: 'An account with this email address already exists' });
      }
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate updated JWT token
    const token = generateToken({ userId: updatedUser.id, email: updatedUser.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: updatedUser, token, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message || 'Internal server error updating profile' });
  }
};

/**
 * PUT /api/auth/profile & PUT /api/auth/me
 * Update user full name and email address
 */
router.put('/profile', requireAuth, handleUpdateProfile);
router.put('/me', requireAuth, handleUpdateProfile);

// In-memory store for OTPs (Email -> { otp, expiresAt })
const otpStore = new Map();

// Zod schemas for OTP and Password Reset validation
const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  reason: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP code and sends it via SMTP email (Hostinger / Gmail)
 */
router.post('/send-otp', async (req, res) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { email, reason } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // If password-reset, check if user exists first for immediate feedback
    if (reason === 'password-reset') {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!existingUser) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpStore.set(normalizedEmail, { otp, expiresAt });

    const isSmtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (isSmtpConfigured) {
      try {
        await sendOtpEmail({
          to: normalizedEmail,
          otp,
          subject: reason === 'password-reset' ? 'Password Reset Verification Code' : 'Your Verification Code',
        });
        return res.json({ message: 'OTP sent successfully to your email' });
      } catch (mailError) {
        console.error('Failed to send OTP email via SMTP:', mailError);
        return res.status(500).json({
          error: `Failed to send email via SMTP: ${mailError.message}. Check SMTP configuration in .env.`,
        });
      }
    } else {
      console.log(`\n========================================`);
      console.log(`[OTP NOTICE] SMTP credentials not fully configured in .env.`);
      console.log(`Generated OTP for ${normalizedEmail}: ${otp}`);
      console.log(`========================================\n`);
      return res.json({
        message: 'OTP generated. (Configure SMTP_USER & SMTP_PASS in .env to receive real emails via Hostinger/Gmail)',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Internal server error sending OTP' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies 6-digit OTP code against store
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { email, otp } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const storedData = otpStore.get(normalizedEmail);

    if (!storedData) {
      return res.status(400).json({ error: 'No OTP requested for this email address or OTP has expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (storedData.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // OTP verified successfully, clear from store
    otpStore.delete(normalizedEmail);

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Internal server error verifying OTP' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies OTP code, hashes new password with bcrypt, and updates DB
 */
router.post('/reset-password', async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { email, otp, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const storedData = otpStore.get(normalizedEmail);

    if (!storedData) {
      return res.status(400).json({ error: 'No verification code requested or code has expired. Please request a new OTP.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
    }

    if (storedData.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Hash new password using bcrypt
    const password_hash = await hashPassword(password);

    // Update password in DB
    const updatedUser = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password_hash },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Invalidate OTP after use
    otpStore.delete(normalizedEmail);

    // Generate JWT token & set cookie
    const token = generateToken({ userId: updatedUser.id, email: updatedUser.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Password has been successfully reset.',
      user: updatedUser,
      token,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error resetting password' });
  }
});

export default router;
