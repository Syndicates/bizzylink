/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file achievements.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const { AdminActionLog } = require('../models/SecurityLog');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @route   GET /api/achievements
 * @desc    Get all achievements for current user
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    // Get user with achievements
    const user = await User.findById(req.user._id).select('achievements minecraftUUID');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Get minecraft advancements if user has linked account
    let minecraftAchievements = [];
    if (user.minecraftUUID) {
      // In a real implementation, this would fetch from Minecraft server
      // For now, use a mocked list
      minecraftAchievements = getMockMinecraftAchievements(user.minecraftUUID);
    }
    
    res.status(200).json({
      success: true,
      data: {
        achievements: user.achievements || [],
        minecraftAchievements
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/achievements/sync
 * @desc    Sync user achievements with minecraft data
 * @access  Private
 */
router.post('/sync', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user has linked Minecraft account
    if (!user.minecraftUUID) {
      return next(new ErrorResponse('No Minecraft account linked', 400));
    }
    
    // Get minecraft advancements
    const minecraftAchievements = getMockMinecraftAchievements(user.minecraftUUID);
    
    // Update user achievements based on Minecraft advancements
    await updateAchievements(user, minecraftAchievements);
    
    // Also check for unlockable titles
    await checkForUnlockedTitles(user);
    
    res.status(200).json({
      success: true,
      message: 'Achievements synced successfully',
      data: {
        achievements: user.achievements
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/achievements/:id/unlock
 * @desc    Manually unlock an achievement (admin only)
 * @access  Private (Admin only)
 */
router.post('/:id/unlock', protect, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return next(new ErrorResponse('User ID is required', 400));
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Find achievement
    const achievementIndex = user.achievements.findIndex(a => a.id === id);
    if (achievementIndex === -1) {
      return next(new ErrorResponse('Achievement not found', 404));
    }
    
    // Update achievement
    user.achievements[achievementIndex].unlocked = true;
    user.achievements[achievementIndex].unlockedDate = new Date();
    user.achievements[achievementIndex].progress = user.achievements[achievementIndex].maxProgress || 100;
    
    await user.save();
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'UNLOCK_ACHIEVEMENT',
      resource: 'User',
      details: {
        userId: user._id,
        username: user.username,
        achievementId: id,
        achievementName: user.achievements[achievementIndex].name
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Check if achievement unlocks a title
    await checkForUnlockedTitles(user);
    
    res.status(200).json({
      success: true,
      message: 'Achievement unlocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/achievements/add
 * @desc    Add a new achievement to a user (admin only)
 * @access  Private (Admin only)
 */
router.post('/add', protect, adminMiddleware, async (req, res, next) => {
  try {
    const { userId, achievement } = req.body;
    
    if (!userId || !achievement) {
      return next(new ErrorResponse('User ID and achievement details are required', 400));
    }
    
    if (!achievement.id || !achievement.name) {
      return next(new ErrorResponse('Achievement ID and name are required', 400));
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if achievement already exists
    const existingAchievement = user.achievements.find(a => a.id === achievement.id);
    if (existingAchievement) {
      return next(new ErrorResponse('Achievement already exists for this user', 400));
    }
    
    // Add achievement
    user.achievements.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description || '',
      category: achievement.category || 'custom',
      rarity: achievement.rarity || 'common',
      progress: achievement.progress || 0,
      maxProgress: achievement.maxProgress || 100,
      unlocked: achievement.unlocked || false,
      unlockedDate: achievement.unlocked ? new Date() : undefined,
      icon: achievement.icon || '/minecraft-assets/chest.svg'
    });
    
    await user.save();
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'ADD_ACHIEVEMENT',
      resource: 'User',
      details: {
        userId: user._id,
        username: user.username,
        achievement: {
          id: achievement.id,
          name: achievement.name
        }
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Achievement added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/achievements/user/:username
 * @desc    Get achievements for a specific user
 * @access  Public
 */
router.get('/user/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username }).select('achievements minecraftUUID');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Only return public achievement data
    const publicAchievements = user.achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      unlocked: achievement.unlocked,
      icon: achievement.icon
    }));
    
    res.status(200).json({
      success: true,
      data: {
        achievements: publicAchievements
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to get mock Minecraft advancements
 * In a real implementation, this would fetch from the Minecraft server
 */
function getMockMinecraftAchievements(uuid) {
  // This is just for testing/development
  // In production, this would be replaced with actual Minecraft server integration
  
  // Random UUID gives random advancements for testing
  const randomSeed = parseInt(uuid.replace(/[^0-9]/g, '').slice(0, 5)) || 0;
  const advancementCount = (randomSeed % 30) + 5; // 5-35 advancements
  
  const allAdvancements = [
    'minecraft:story/root',
    'minecraft:story/mine_stone',
    'minecraft:story/upgrade_tools',
    'minecraft:story/smelt_iron',
    'minecraft:story/obtain_armor',
    'minecraft:story/lava_bucket',
    'minecraft:story/iron_tools',
    'minecraft:story/deflect_arrow',
    'minecraft:story/enter_the_nether',
    'minecraft:story/follow_ender_eye',
    'minecraft:story/enter_the_end',
    'minecraft:nether/root',
    'minecraft:nether/fast_travel',
    'minecraft:nether/find_fortress',
    'minecraft:nether/return_to_sender',
    'minecraft:nether/obtain_blaze_rod',
    'minecraft:nether/obtain_ancient_debris',
    'minecraft:nether/find_bastion',
    'minecraft:nether/distract_piglin',
    'minecraft:adventure/root',
    'minecraft:adventure/kill_a_mob',
    'minecraft:adventure/trade',
    'minecraft:adventure/honey_block_slide',
    'minecraft:adventure/ol_betsy',
    'minecraft:adventure/sleep_in_bed',
    'minecraft:adventure/shoot_arrow',
    'minecraft:end/root',
    'minecraft:end/kill_dragon',
    'minecraft:end/enter_end_gateway',
    'minecraft:end/find_end_city',
    'minecraft:end/elytra',
    'minecraft:end/respawn_dragon',
    'minecraft:husbandry/root',
    'minecraft:husbandry/plant_seed',
    'minecraft:husbandry/breed_an_animal'
  ];
  
  // Select random advancements
  const selectedAdvancements = [];
  for (let i = 0; i < advancementCount; i++) {
    const index = (randomSeed + i) % allAdvancements.length;
    selectedAdvancements.push(allAdvancements[index]);
  }
  
  return selectedAdvancements;
}

/**
 * Helper function to update user achievements based on Minecraft advancements
 */
async function updateAchievements(user, minecraftAchievements) {
  // Map of advancement IDs to achievement details
  const advancementMap = {
    'minecraft:story/root': {
      id: 'minecraft_story_root',
      name: 'Minecraft',
      description: 'The beginning of your adventure',
      category: 'story',
      rarity: 'common',
      icon: '/minecraft-assets/grass_block.svg'
    },
    'minecraft:story/mine_stone': {
      id: 'minecraft_story_mine_stone',
      name: 'Stone Age',
      description: 'Mine stone with your new pickaxe',
      category: 'story',
      rarity: 'common',
      icon: '/minecraft-assets/pickaxe.svg'
    },
    'minecraft:story/enter_the_nether': {
      id: 'minecraft_story_enter_nether',
      name: 'We Need to Go Deeper',
      description: 'Build, light and enter a Nether Portal',
      category: 'story',
      rarity: 'uncommon',
      icon: '/minecraft-assets/gold-ingot.svg'
    },
    'minecraft:story/enter_the_end': {
      id: 'minecraft_story_enter_end',
      name: 'The End?',
      description: 'Enter the End dimension',
      category: 'story',
      rarity: 'rare',
      icon: '/minecraft-assets/xp-orb.svg'
    },
    'minecraft:end/kill_dragon': {
      id: 'minecraft_end_kill_dragon',
      name: 'Free the End',
      description: 'Good luck',
      category: 'end',
      rarity: 'epic',
      icon: '/minecraft-assets/xp-orb.svg'
    },
    'minecraft:end/elytra': {
      id: 'minecraft_end_elytra',
      name: 'Sky\'s the Limit',
      description: 'Find an Elytra',
      category: 'end',
      rarity: 'epic',
      icon: '/minecraft-assets/xp-orb.svg'
    }
  };
  
  // For each Minecraft advancement, update or add achievement
  for (const advancement of minecraftAchievements) {
    // Check if we have mapping for this advancement
    if (advancementMap[advancement]) {
      const achievementData = advancementMap[advancement];
      
      // Check if user already has this achievement
      const existingIndex = user.achievements.findIndex(a => a.id === achievementData.id);
      
      if (existingIndex >= 0) {
        // Update existing achievement
        user.achievements[existingIndex].unlocked = true;
        if (!user.achievements[existingIndex].unlockedDate) {
          user.achievements[existingIndex].unlockedDate = new Date();
        }
        user.achievements[existingIndex].progress = 100;
      } else {
        // Add new achievement
        user.achievements.push({
          ...achievementData,
          unlocked: true,
          unlockedDate: new Date(),
          progress: 100
        });
      }
    }
  }
  
  // Save user
  await user.save();
}

/**
 * Helper function to check if any achievements unlock titles
 */
async function checkForUnlockedTitles(user) {
  // Map of achievement IDs to unlockable titles
  const titleUnlocks = {
    'minecraft_end_kill_dragon': {
      id: 'dragon_slayer',
      name: 'Dragon Slayer',
      description: 'Defeated the Ender Dragon',
      rarity: 'epic',
      textColor: 'text-violet-400',
      category: 'achievement'
    },
    'minecraft_end_elytra': {
      id: 'aviator',
      name: 'Aviator',
      description: 'Found an Elytra',
      rarity: 'epic',
      textColor: 'text-sky-300',
      category: 'achievement'
    },
    'minecraft_story_enter_nether': {
      id: 'nether_explorer',
      name: 'Nether Explorer',
      description: 'Entered the Nether dimension',
      rarity: 'uncommon',
      textColor: 'text-red-400',
      category: 'achievement'
    },
    'minecraft_story_enter_end': {
      id: 'ender',
      name: 'Ender',
      description: 'Entered the End dimension',
      rarity: 'rare',
      textColor: 'text-purple-400',
      category: 'achievement'
    }
  };
  
  let titlesChanged = false;
  
  // Check for unlockable titles
  for (const achievement of user.achievements) {
    if (achievement.unlocked && titleUnlocks[achievement.id]) {
      const titleData = titleUnlocks[achievement.id];
      
      // Check if user already has this title
      const existingTitle = user.titles.find(t => t.id === titleData.id);
      
      if (!existingTitle) {
        // Add new title
        user.titles.push({
          ...titleData,
          unlocked: true,
          unlockedDate: new Date()
        });
        titlesChanged = true;
      }
    }
  }
  
  // If user has no active title, set the highest rarity unlocked title
  if (titlesChanged && (!user.activeTitle || user.activeTitle === 'default')) {
    // Get all unlocked titles
    const unlockedTitles = user.titles.filter(t => t.unlocked);
    
    if (unlockedTitles.length > 0) {
      // Define rarity order
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'godly', 'divine'];
      
      // Sort by rarity
      unlockedTitles.sort((a, b) => {
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      });
      
      // Set the highest rarity title as active
      user.activeTitle = unlockedTitles[0].id;
    }
  }
  
  // Save user if titles changed
  if (titlesChanged) {
    await user.save();
  }
  
  return titlesChanged;
}

module.exports = router;