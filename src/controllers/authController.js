const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase().trim(), password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };
