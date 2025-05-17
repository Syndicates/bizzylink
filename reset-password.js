const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// User credentials to set
const USERNAME = 'bizzy';
const PASSWORD = 'password';

async function resetPassword() {
  console.log(`Resetting password for user: ${USERNAME}`);
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bizzylink');
    const users = db.collection('users');
    
    // Find the user
    const user = await users.findOne({ username: USERNAME });
    if (!user) {
      console.error(`User '${USERNAME}' not found in the database!`);
      return;
    }
    
    console.log(`User found: ${user.username}, ID: ${user._id}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSWORD, salt);
    
    console.log('Generated new password hash');
    
    // Update the user with new password
    const result = await users.updateOne(
      { username: USERNAME },
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Password for user '${USERNAME}' has been updated successfully!`);
      console.log(`New password is: '${PASSWORD}'`);
    } else {
      console.log(`⚠️ User found but password was not updated. May already have same password.`);
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute the function
resetPassword().catch(console.error); 