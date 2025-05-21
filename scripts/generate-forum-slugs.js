/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file generate-forum-slugs.js
 * @description Adds slugs to all legacy forum threads missing a slug
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');
const { ForumThread, generateSlug } = require('../backend/src/models/Forum');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bizzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  const threads = await ForumThread.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
  console.log(`Found ${threads.length} threads missing slugs.`);

  for (const thread of threads) {
    if (!thread.title) {
      thread.slug = generateSlug(String(thread._id));
    } else {
      thread.slug = generateSlug(thread.title);
    }
    await thread.save();
    console.log(`Updated thread ${thread._id} with slug: ${thread.slug}`);
  }

  console.log('All missing slugs generated.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error generating slugs:', err);
  process.exit(1);
}); 