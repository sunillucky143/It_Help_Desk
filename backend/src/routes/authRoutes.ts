import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Mock users for authentication
const mockUsers = [
  {
    id: 1,
    email: 'admin@urackit.com',
    password: 'admin123', // In production, this would be hashed
    role: 'Super-Admin',
    name: 'Admin User'
  },
  {
    id: 2,
    email: 'manager@urackit.com',
    password: 'manager123',
    role: 'Account Manager',
    name: 'Manager User',
    manager_id: 1
  }
];

// Login endpoint
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = mockUsers.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      manager_id: user.role === 'Account Manager' ? (user as any).manager_id : null
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Verify token endpoint
router.get('/verify', (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
