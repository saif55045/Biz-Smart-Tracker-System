const User=require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const SignUp = async (req, res) => {
  try {
      const { username, password, email, company_name, address, phone_number, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(409).json({ error: 'User with this email already exists.' });
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
      res.status(200).json({ message: 'Registration Successful!', user: newUser });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server Internal Error', details: error.message });
  }
};

const SignIn=async (req,res)=>{
    try{
        const {company_name,email,password}=req.body;
        const user=await User.findOne({email,company_name});
        if(!user){
            return res.status(404).json({message:'User Not Found'});
        }
        if(!bcrypt.compareSync(password,user.password)){
            return res.status(401).json({ message: 'Invalid Password' });
        }
        console.log('Creating token with user data:', { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            company_name: user.company_name 
        });
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                company_name: user.company_name // Explicitly include company_name
            }, 
            process.env.JWT_SECRET_KEY, 
            { expiresIn: '1h' }
        );
        res.status(200).json({message:'Login Successful',token});
    }
    catch(error){
        console.error('SignIn error:', error);
        res.status(500).json({ error: 'Server Internal Error', details: error });
    }
}

const GoogleAuth=(req, res) => {
    console.log('Google Auth user data:', req.user);
    const token = jwt.sign(
      { 
        id: req.user._id, 
        email: req.user.email, 
        role: req.user.role,
        company_name: req.user.company_name // Explicitly include company_name
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    if (req.user.address === 'N/A' || req.user.phone_number === '0000000000') {
        res.redirect(`http://localhost:3000/complete-signup?token=${token}`);
    } else {
        res.redirect(`http://localhost:3000/inventory/products?token=${token}`);
    }
};

const completeSignUp=async (req, res) => {
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
        { expiresIn: '1h' }
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

module.exports={SignUp,SignIn,GoogleAuth,completeSignUp,resetPassword};