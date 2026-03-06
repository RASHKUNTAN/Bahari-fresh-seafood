const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists:', adminExists.username);
      process.exit();
    }

    const admin = new User({
      name: 'Bahari Admin',
      username: 'admin',
      email: 'admin@bahari.com',
      password: 'AdminPass123', // will be hashed automatically
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    process.exit();
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();

