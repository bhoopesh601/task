import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/authMiddleware.js';

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

export default router;
