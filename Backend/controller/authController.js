const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auditLog } = require('../utils/auditLogger');
const { generateToken: generateCsrfToken } = require('../middleware/csrf');

// New function to check company name uniqueness and provide suggestions
const checkCompanyName = async (req, res) => {
  try {
    const { company_name, role } = req.body;

    if (!company_name) {
      return res.status(400).json({
        available: false,
        message: 'Company name is required'
      });
    }

    // Only check uniqueness for Admin role
    if (role === 'Admin') {
      // Check if company name already exists for an Admin
      // Use case-insensitive search to avoid duplicates with different casing
      const existingCompany = await User.findOne({
        company_name: { $regex: new RegExp(`^${company_name}$`, 'i') },
        role: 'Admin'
      });

      if (!existingCompany) {
        // Company name is available for Admin
        return res.status(200).json({
          available: true,
          message: 'Company name is available'
        });
      }

      // If company exists, generate suggestions
      const suggestions = generateCompanyNameSuggestions(company_name);

      // Check which suggestions are actually available
      const availableSuggestions = [];
      for (const suggestion of suggestions) {
        const exists = await User.findOne({
          company_name: { $regex: new RegExp(`^${suggestion}$`, 'i') },
          role: 'Admin'
        });
        if (!exists) {
          availableSuggestions.push(suggestion);
          if (availableSuggestions.length >= 3) break; // Get up to 3 suggestions
        }
      }

      return res.status(200).json({
        available: false,
        message: 'Company name already exists',
        suggestions: availableSuggestions
      });
    } else {
      // For Employee role, company name doesn't have to be unique
      return res.status(200).json({
        available: true,
        message: 'Company name is available for employees'
      });
    }
  } catch (error) {
    console.error('Company name check error:', error);
    res.status(500).json({
      available: false,
      error: 'Server Internal Error',
      message: 'Error checking company name',
      details: error.message
    });
  }
};

// Helper function to generate company name suggestions
function generateCompanyNameSuggestions(name) {
  const suggestions = [];

  // Add a random number to the end
  for (let i = 0; i < 3; i++) {
    suggestions.push(`${name}${Math.floor(Math.random() * 1000)}`);
  }

  // Add "Inc" or "Ltd" to the end
  suggestions.push(`${name} Inc`);
  suggestions.push(`${name} Ltd`);
  suggestions.push(`${name} Co`);

  // Add "The" to the beginning
  suggestions.push(`The ${name}`);

  // Add random adjectives
  const adjectives = ['Global', 'Premier', 'Elite', 'Prime', 'Superior', 'Royal', 'Universal'];
  for (const adj of adjectives) {
    suggestions.push(`${adj} ${name}`);
  }

  // Shuffle the array and return
  return suggestions.sort(() => 0.5 - Math.random());
}

const SignUp = async (req, res) => {
  try {
    const { username, password, email, company_name, address, phone_number, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    // For Admin role, check if company name is unique among other admins
    if (role === 'Admin' && company_name) {
      const existingCompany = await User.findOne({
        company_name: { $regex: new RegExp(`^${company_name}$`, 'i') },
        role: 'Admin'
      });

      if (existingCompany) {
        return res.status(409).json({
          error: 'Company name already exists for another admin. Please choose a different name.',
          suggestCheck: true
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      company_name,
      address,
      phone_number,
      role
    });
    await newUser.save();

    // Log successful signup
    await auditLog.signup(req, newUser);

    res.status(200).json({ message: 'Registration Successful!', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Internal Error', details: error.message });
  }
};

const SignIn = async (req, res) => {
  try {
    const { company_name, email, password } = req.body;
    const user = await User.findOne({ email, company_name });

    if (!user) {
      await auditLog.loginFailed(req, email, 'User not found');
      return res.status(404).json({ message: 'User Not Found' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      await auditLog.loginFailed(req, email, 'Invalid password');
      return res.status(401).json({ message: 'Invalid Password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company_name: user.company_name
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '10h' }
    );

    // Generate CSRF token for this session
    const csrfToken = generateCsrfToken(user._id.toString());

    // Log successful login
    await auditLog.loginSuccess(req, user);

    res.status(200).json({
      message: 'Login Successful',
      token,
      csrfToken // Send CSRF token to client
    });
  }
  catch (error) {
    console.error('SignIn error:', error);
    res.status(500).json({ error: 'Server Internal Error', details: error });
  }
}

const GoogleAuth = (req, res) => {
  console.log('Google Auth user data:', req.user);
  const token = jwt.sign(
    {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      company_name: req.user.company_name // Explicitly include company_name
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '10h' }
  );

  if (req.user.address === 'N/A' || req.user.phone_number === '0000000000') {
    res.redirect(`http://localhost:3000/complete-signup?token=${token}`);
  } else {
    res.redirect(`http://localhost:3000/inventory/products?token=${token}`);
  }
};

const completeSignUp = async (req, res) => {
  try {
    const userId = req.user.id;
    let { address, phone_number, company_name, password } = req.body;
    password = bcrypt.hashSync(password, 10);

    const user = await User.findByIdAndUpdate(userId, {
      address,
      phone_number,
      company_name,
      password
    }, { new: true });

    // Generate new token with updated company_name
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        company_name: user.company_name // Include updated company_name
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '10h' }
    );

    res.json({ message: 'Profile updated successfully!', user, token });
  } catch (error) {
    console.error('CompleteSignUp error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    // Verify the reset token
    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const email = payload.email;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = { SignUp, SignIn, GoogleAuth, completeSignUp, resetPassword, checkCompanyName };