const User = require('../models/User');
const bcrypt = require('bcrypt');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, company_name, address, phone_number, role, experience, salary } = req.body;
    console.log(role);

    // Check if user with the same email already exists
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({ error: `User with email ${email} already exists` });
    }

    // Check if user with the same username already exists
    const existingUserName = await User.findOne({ username });
    if (existingUserName) {
      return res.status(400).json({ error: `User with username ${username} already exists` });
    }

    // Check if company name exists for Admin role
    if (role === 'Admin') {
      const existingCompany = await User.findOne({ company_name, role: 'Admin' });
      if (existingCompany) {
        return res.status(400).json({ error: `Company name "${company_name}" already exists for another admin` });
      }
    }

    // For Employee role, no need to check company name uniqueness

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);



    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      company_name,
      address,
      phone_number,
      role,
      experience,
      salary,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);

    // Better error handling for MongoDB specific errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];

        // Special handling for compound index errors (company_name + role)
        if (field === 'company_name_1_role_1') {
          return res.status(400).json({
            error: `Company name "${req.body.company_name}" already exists for another admin`
          });
        }

        return res.status(400).json({
          error: `User with ${field} "${value}" already exists`
        });
      }
    }

    res.status(500).json({ error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Get the current user's company name from the auth middleware
    const { user } = req;

    if (!user || !user.company_name) {
      return res.status(400).json({ error: 'Company information not found in your profile' });
    }

    // Filter users by company name and exclude the password field for security
    const users = await User.find(
      { company_name: user.company_name },
      '-password'
    );

    console.log(`Found ${users.length} users for company ${user.company_name}`);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the current user to check role and current company_name
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If updating company_name and user is Admin, check if it's unique
    if (updates.company_name && currentUser.role === 'Admin') {
      // Only check if company_name is actually changing
      if (updates.company_name !== currentUser.company_name) {
        const existingCompany = await User.findOne({
          company_name: { $regex: new RegExp(`^${updates.company_name}$`, 'i') },
          role: 'Admin',
          _id: { $ne: id } // Exclude current user
        });

        if (existingCompany) {
          return res.status(400).json({
            error: `Company name "${updates.company_name}" is already taken by another admin`
          });
        }
      }
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current user details
exports.getCurrentUser = async (req, res) => {
  try {
    // The JWT payload is attached to req.user by the auth middleware
    // We need to fetch the full user document from the database
    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token' });
    }

    // Fetch full user from database (exclude password)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      company_name: user.company_name,
      role: user.role,
      address: user.address || '',
      phone_number: user.phone_number || '',
      profilePicture: user.profilePicture || ''
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
};