const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'Username already taken' });

    const user = new User({ name, username, email, password, role: role || 'user' });
    await user.save();
    res.status(201).json({ message: 'Account created successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials or account does not exist' });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ 
    token, 
    user: { id: user._id, name: user.name, email: user.email, role: user.role } 
  });
};

// Logout
exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

