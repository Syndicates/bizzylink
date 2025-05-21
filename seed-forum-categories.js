/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file seed-forum-categories.js
 * @description Script to seed forum categories in MongoDB
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');
const path = require('path');
const ForumModels = require(path.join(__dirname, 'backend', 'src', 'models', 'Forum.js'));
const ForumCategory = ForumModels.ForumCategory;

const categories = [
  {
    name: 'Announcements',
    description: 'Important server announcements',
    order: 1,
    isActive: true,
    slug: 'announcements'
  },
  {
    name: 'General Discussion',
    description: 'Talk about anything Minecraft related',
    order: 2,
    isActive: true,
    slug: 'general-discussion'
  },
  {
    name: 'Help & Support',
    description: 'Ask for help with any issues',
    order: 3,
    isActive: true,
    slug: 'help-support'
  }
];

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/bizzylink', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await ForumCategory.deleteMany({});
  await ForumCategory.insertMany(categories);

  console.log('Forum categories seeded!');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
}); 