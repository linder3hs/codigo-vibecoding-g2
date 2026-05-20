import jwt from 'jsonwebtoken';
import UserModel from './model.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const UserController = {
  register: async (req, res) => {
    try {
      const { name, lastname, email, password } = req.body;
      
      if (!name || !lastname || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await UserModel.register({ name, lastname, email, password });
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await UserModel.login(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default UserController;