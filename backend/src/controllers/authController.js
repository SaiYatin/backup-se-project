const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
// ✅ CORRECT Implementation
const User = require('../models/User');
const { generateToken } = require('../config/jwt');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create user (password hashing done by beforeCreate hook in model)
    const user = await User.create({
      name,
      email,
      password_hash: password, // Will be hashed by model hook
      role: role || 'donor'
    });

    // Generate token
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(), // Removes password_hash
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = storage.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: role || 'donor',
      createdAt: new Date().toISOString()
    };

    storage.users.push(user);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = storage.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Profile
exports.getProfile = async (req, res, next) => {
  try {
    const userResponse = { ...req.user };
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};