const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // adjust path if needed

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
      password: 'AdminPass123', // change to a secure password
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

