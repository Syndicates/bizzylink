/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file initialize-forum.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// Script to initialize the forum with default categories
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Load Category model
      const Category = require('../models/Category');
      
      // Check if categories already exist
      const existingCategories = await Category.find();
      if (existingCategories.length > 0) {
        console.log(`Forum already has ${existingCategories.length} categories:`);
        existingCategories.forEach(cat => {
          console.log(`- ${cat.name}`);
        });
        
        // Ask if user wants to reset
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('Do you want to delete existing categories and create new ones? (yes/no): ', async (answer) => {
          if (answer.toLowerCase() === 'yes') {
            // Delete existing categories
            await Category.deleteMany({});
            console.log('Existing categories deleted.');
            await createDefaultCategories();
          } else {
            console.log('Keeping existing categories. Exiting.');
          }
          readline.close();
          mongoose.connection.close();
        });
        
        return;
      }
      
      // No categories exist, create default ones
      await createDefaultCategories();
      mongoose.connection.close();
      
    } catch (error) {
      console.error('Error:', error);
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
  
// Function to create default categories
async function createDefaultCategories() {
  const Category = require('../models/Category');
  
  // Define default categories
  const defaultCategories = [
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
      description: 'Show off your builds, redstone contraptions, and other creations',
      order: 5
    },
    {
      name: 'Trading & Economy',
      description: 'Buy, sell, and trade items with other players',
      order: 6
    },
    {
      name: 'Off-Topic',
      description: 'Discuss anything not related to Minecraft',
      order: 7
    }
  ];
  
  console.log('Creating default forum categories...');
  
  // Create each category
  for (const category of defaultCategories) {
    const newCategory = new Category(category);
    await newCategory.save();
    console.log(`Created category: ${category.name}`);
  }
  
  console.log('Default forum categories have been created successfully!');
}