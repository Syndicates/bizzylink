// Simple script to create forum categories
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink');
    console.log('Connected to MongoDB');
    
    // Define default categories
    const categories = [
      {
        name: 'Announcements',
        description: 'Important announcements from the server staff',
        order: 1
      },
      {
        name: 'General Discussion',
        description: 'Talk about anything Minecraft related here',
        order: 2
      },
      {
        name: 'Server Discussion',
        description: 'Discuss our Minecraft server, suggestions, feedback',
        order: 3
      },
      {
        name: 'Help & Support',
        description: 'Ask for help with any issues you might have',
        order: 4
      },
      {
        name: 'Showcase',
        description: 'Show off your builds, redstone contraptions, and creations',
        order: 5
      }
    ];

    // Check if we already have categories
    const count = await Category.countDocuments();
    console.log(`Found ${count} existing categories`);
    
    if (count > 0) {
      console.log('Categories already exist. Skipping creation.');
    } else {
      console.log('Creating forum categories...');
      
      for (const categoryData of categories) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`Created category: ${category.name}`);
      }
      
      console.log('All categories created successfully!');
    }
    
    // List all categories
    const allCategories = await Category.find().sort({order: 1});
    console.log('\nCurrent Forum Categories:');
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id}): ${cat.description}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

main();