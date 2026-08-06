import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Apply auth middleware to all todo endpoints
router.use(requireAuth);

// Zod Validation Schemas
const todoCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional().default('Medium'),
  status: z.enum(['Pending', 'Completed', 'In Progress']).optional().default('Pending'),
  dueDate: z.string().optional(),
});

const todoUpdateSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  status: z.enum(['Pending', 'Completed', 'In Progress']).optional(),
  dueDate: z.string().optional(),
});

/**
 * GET /api/todos
 * Fetch all todos belonging exclusively to the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { user_id: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(todos);
  } catch (error) {
    console.error('Fetch todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/**
 * POST /api/todos
 * Create a new todo linked to req.user.userId
 */
router.post('/', async (req, res) => {
  try {
    const parseResult = todoCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const { title, description, priority, status, dueDate } = parseResult.data;

    const todo = await prisma.todo.create({
      data: {
        user_id: req.user.userId,
        title: title.trim(),
        description: description ? description.trim() : '',
        priority,
        status,
        dueDate: dueDate || null,
      },
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/**
 * PUT /api/todos/:id
 * Update existing todo (verifies ownership first)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTodo = await prisma.todo.findFirst({
      where: { id, user_id: req.user.userId },
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    const parseResult = todoUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues?.[0]?.message || parseResult.error.message || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: parseResult.data,
    });

    res.json(updatedTodo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

/**
 * DELETE /api/todos/:id
 * Delete todo (verifies ownership first)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTodo = await prisma.todo.findFirst({
      where: { id, user_id: req.user.userId },
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    await prisma.todo.delete({
      where: { id },
    });

    res.json({ message: 'Todo deleted successfully', id });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
