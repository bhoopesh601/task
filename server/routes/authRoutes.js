import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail } from '../lib/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
dotenv.config({ override: true });

const router = Router();

// In-memory store for OTPs (Key: `${normalizedEmail}:${action}` -> { otp, expiresAt, action, verified, verifiedAt })
const otpStore = new Map();

// Zod Validation Schemas
const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  action: z.enum(['signup', 'login', 'password-reset']).optional(),
  reason: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  action: z.enum(['signup', 'login', 'password-reset']).optional(),
  reason: z.string().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

const handleRegister = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { name, email, password, otp } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify Sign Up OTP verification status
    const storeKey = `${normalizedEmail}:signup`;
    const storedData = otpStore.get(storeKey);

    if (!storedData) {
      return res.status(400).json({ error: 'Please verify your email with the 6-digit OTP code before registering.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
    }

    // Must either be already marked verified via /verify-otp OR matched against the provided otp in this request
    const isDirectlyMatched = otp && storedData.otp === otp.trim() && storedData.action === 'signup';
    if (!storedData.verified && !isDirectlyMatched) {
      return res.status(400).json({ error: 'Email verification is required before account creation.' });
    }

    // Check DB level uniqueness constraint
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
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

    // Invalidate / delete signup verification state immediately after successful user creation
    otpStore.delete(storeKey);

    // Generate JWT token & set HTTP-only cookie
    const token = generateToken({ userId: user.id, email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send welcome confirmation email asynchronously
    try {
      await sendWelcomeEmail({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
      });
    } catch (mailError) {
      console.warn('⚠️ Welcome email notification failed for', user.email, ':', mailError.message);
    }

    res.status(201).json({ user, token, message: 'Account created successfully' });
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
 * Direct password login fallback
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

    // Send login notification email after successful authentication
    try {
      await sendLoginNotificationEmail({
        to: user.email,
        userName: user.name || user.email.split('@')[0],
      });
    } catch (mailError) {
      console.warn('⚠️ Login notification email failed for', user.email, ':', mailError.message);
    }

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

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP code and sends it via SMTP email
 */
router.post('/send-otp', async (req, res) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { email, action, reason } = parseResult.data;
    const actionType = action || reason || 'signup';
    const normalizedEmail = email.toLowerCase().trim();

    // Check database based on action
    if (actionType === 'signup') {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      }
    } else if (actionType === 'login') {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!existingUser) {
        return res.status(404).json({ error: 'No account found with this email. Please sign up.' });
      }
    } else if (actionType === 'password-reset') {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!existingUser) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
    }

    // Generate secure random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const storeKey = `${normalizedEmail}:${actionType}`;
    otpStore.set(storeKey, {
      otp,
      expiresAt,
      action: actionType,
      verified: false,
    });

    dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
    const isSmtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    const subjectMap = {
      signup: 'Your Sign Up Verification Code',
      login: 'Your Login Verification Code',
      'password-reset': 'Password Reset Verification Code',
    };
    const emailSubject = subjectMap[actionType] || 'Your Verification Code';

    if (isSmtpConfigured) {
      try {
        await sendOtpEmail({
          to: normalizedEmail,
          otp,
          subject: emailSubject,
        });
        return res.json({ message: 'Verification code sent to your email' });
      } catch (mailError) {
        console.warn('⚠️ SMTP mail send failed:', mailError.message);
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            message: 'OTP generated. Note: SMTP server rejected credentials. Use the recovery OTP below in development.',
            devOtp: otp,
            smtpWarning: mailError.message,
          });
        }
        return res.status(500).json({ error: 'Failed to deliver verification code via email. Please check SMTP configuration.' });
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'OTP generated. (Configure SMTP_USER & SMTP_PASS in .env to receive real emails via Hostinger/Gmail)',
          devOtp: otp,
        });
      }
      return res.status(500).json({ error: 'SMTP service is not configured.' });
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

    const { email, otp, action, reason } = parseResult.data;
    const actionType = action || reason || 'signup';
    const normalizedEmail = email.toLowerCase().trim();

    const storeKey = `${normalizedEmail}:${actionType}`;
    const storedData = otpStore.get(storeKey);

    if (!storedData) {
      return res.status(400).json({ error: 'No verification code requested for this email or code has expired. Please request a new code.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (storedData.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    if (storedData.action !== actionType) {
      return res.status(400).json({ error: 'Verification action mismatch. Please request a new code.' });
    }

    if (actionType === 'login') {
      // Invalidate OTP immediately after successful login verification
      otpStore.delete(storeKey);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'No account found with this email. Please sign up.' });
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

      // Send login notification email asynchronously
      try {
        await sendLoginNotificationEmail({
          to: user.email,
          userName: user.name || user.email.split('@')[0],
        });
      } catch (mailError) {
        console.warn('⚠️ Login notification email failed for', user.email, ':', mailError.message);
      }

      return res.json({ message: 'Login successful', user: userPayload, token });
    }

    if (actionType === 'signup') {
      // Mark as verified for /api/auth/register consumption
      otpStore.set(storeKey, {
        ...storedData,
        verified: true,
        verifiedAt: Date.now(),
      });
      return res.json({ success: true, message: 'OTP verified successfully' });
    }

    if (actionType === 'password-reset') {
      otpStore.set(storeKey, {
        ...storedData,
        verified: true,
        verifiedAt: Date.now(),
      });
      return res.json({ success: true, message: 'OTP verified successfully' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
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

    const storeKey = `${normalizedEmail}:password-reset`;
    const storedData = otpStore.get(storeKey);

    if (!storedData) {
      return res.status(400).json({ error: 'No verification code requested or code has expired. Please request a new OTP.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
    }

    if (!storedData.verified && storedData.otp !== otp.trim()) {
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
    otpStore.delete(storeKey);

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

