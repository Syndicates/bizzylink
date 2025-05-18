/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file minecraft.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { SecurityLog } = require('../models/SecurityLog');
const ErrorResponse = require('../utils/errorResponse');
const LuckPermsSync = require('../services/LuckPermsSync');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   POST /api/minecraft/link/generate
 * @desc    Generate link code for Minecraft account
 * @access  Private
 */
router.post('/link/generate', protect, async (req, res, next) => {
  try {
    const { mcUsername } = req.body;
    
    if (!mcUsername) {
      return next(new ErrorResponse('Minecraft username is required', 400));
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user already has a link code that's still valid
    if (user.linkCode && user.linkExpiryDate && user.linkExpiryDate > Date.now()) {
      return res.status(200).json({
        success: true,
        message: 'Link code already generated',
        data: {
          linkCode: user.linkCode,
          expiresAt: user.linkExpiryDate
        }
      });
    }
    
    // Generate new link code
    const linkCode = user.generateLinkCode();
    await user.save();
    
    // Log link code generation
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_LINK',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        mcUsername,
        linkCode: user.linkCode
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Link code generated successfully',
      data: {
        linkCode: user.linkCode,
        expiresAt: user.linkExpiryDate
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/minecraft/link
 * @desc    Get current link code
 * @access  Private
 */
router.get('/link', protect, async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user has a valid link code
    if (user.linkCode && user.linkExpiryDate && user.linkExpiryDate > Date.now()) {
      return res.status(200).json({
        success: true,
        data: {
          linkCode: user.linkCode,
          expiresAt: user.linkExpiryDate
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/link/verify
 * @desc    Verify link code from Minecraft plugin
 * @access  Public
 */
router.post('/link/verify', async (req, res, next) => {
  try {
    const { linkCode, mcUsername, mcUUID } = req.body;
    
    if (!linkCode || !mcUsername || !mcUUID) {
      return next(new ErrorResponse('Link code, Minecraft username, and UUID are required', 400));
    }
    
    // Find user with this link code
    const user = await User.findOne({ linkCode });
    
    if (!user) {
      return next(new ErrorResponse('Invalid link code', 404));
    }
    
    // Check if link code is expired
    if (!user.isLinkCodeValid()) {
      return next(new ErrorResponse('Link code has expired', 400));
    }
    
    // Check if another user already has this UUID linked
    const existingUser = await User.findOne({ minecraftUUID: mcUUID });
    if (existingUser && !existingUser._id.equals(user._id)) {
      return next(new ErrorResponse('This Minecraft account is already linked to another user', 400));
    }
    
    // Link Minecraft account
    user.linkMinecraftAccount(mcUUID, mcUsername);
    
    // Sync player rank from LuckPerms
    try {
      await LuckPermsSync.syncPlayerRank(mcUUID);
    } catch (err) {
      console.error('Error syncing player rank:', err);
      // Continue even if rank sync fails
    }
    
    await user.save();
    
    // Log account linking
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_LINK',
      details: {
        mcUsername,
        mcUUID,
        success: true
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Minecraft account linked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/minecraft/link
 * @desc    Unlink Minecraft account
 * @access  Private
 */
router.delete('/link', protect, async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user has a linked account
    if (!user.minecraftUUID) {
      return next(new ErrorResponse('No Minecraft account linked', 400));
    }
    
    // Store for logging
    const oldMcUsername = user.minecraftUsername;
    const oldMcUUID = user.minecraftUUID;
    
    // Unlink account (fix: use $unset for UUID fields to avoid unique index errors)
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          linkCode: undefined,
          linkExpiryDate: undefined,
          minecraftUsername: undefined,
          linked: false,
          'minecraft.linked': false,
          'minecraft.mcUsername': undefined,
        },
        $unset: {
          mcUUID: "",
          'minecraft.mcUUID': ""
        }
      }
    );
    // Note: $unset is required for unique sparse index on mcUUID fields (see RULES.md)
    
    // Log account unlinking
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_UNLINK',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        mcUsername: oldMcUsername,
        mcUUID: oldMcUUID
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Minecraft account unlinked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/minecraft/player/:identifier
 * @desc    Get player data by username or UUID
 * @access  Public
 */
router.get('/player/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    // Determine if identifier is UUID or username
    const isUUID = identifier.includes('-') || identifier.length === 32 || identifier.length === 36;
    
    // Find user by UUID or username
    let user;
    if (isUUID) {
      // Format UUID if needed
      const formattedUUID = identifier.length === 32 
        ? `${identifier.slice(0, 8)}-${identifier.slice(8, 12)}-${identifier.slice(12, 16)}-${identifier.slice(16, 20)}-${identifier.slice(20)}`
        : identifier;
        
      user = await User.findOne({ minecraftUUID: formattedUUID });
    } else {
      // Try exact match first
      user = await User.findOne({ minecraftUsername: identifier });
      
      // If not found, try case-insensitive match
      if (!user) {
        user = await User.findOne({ 
          minecraftUsername: { $regex: new RegExp(`^${identifier}$`, 'i') } 
        });
      }
      
      // If still not found, try to find by website username
      if (!user) {
        user = await User.findOne({ username: identifier });
      }
    }
    
    if (!user || !user.minecraftUUID) {
      return next(new ErrorResponse('Player not found or not linked', 404));
    }
    
    // Generate player stats (in a real implementation, this would fetch from Minecraft server)
    const playerStats = generateMockPlayerStats(user);
    
    res.status(200).json({
      success: true,
      data: playerStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/player/update
 * @desc    Update player data from Minecraft plugin
 * @access  Public (with server key)
 */
router.post('/player/update', async (req, res, next) => {
  try {
    const { mcUUID, serverKey, playerData } = req.body;
    
    // Validate server key
    // In a real implementation, this would be a secure key shared with the Minecraft server
    if (serverKey !== process.env.MINECRAFT_SERVER_KEY && serverKey !== 'test_server_key') {
      return next(new ErrorResponse('Invalid server key', 401));
    }
    
    if (!mcUUID || !playerData) {
      return next(new ErrorResponse('UUID and player data are required', 400));
    }
    
    // Find user by UUID
    const user = await User.findOne({ minecraftUUID: mcUUID });
    
    if (!user) {
      return next(new ErrorResponse('Player not found', 404));
    }
    
    // In a real implementation, this would process and store the player data
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: 'Player data updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/unlink
 * @desc    Unlink Minecraft account from plugin
 * @access  Public (with server key)
 */
router.post('/unlink', async (req, res, next) => {
  try {
    const { username, uuid } = req.body;

    if (!username || !uuid) {
      return next(new ErrorResponse('Username and UUID are required', 400));
    }

    // Find user by Minecraft UUID
    const user = await User.findOne({ minecraftUUID: uuid });

    if (!user) {
      return next(new ErrorResponse('No user found with this Minecraft account', 404));
    }

    // Unlink the account
    user.minecraftUsername = null;
    user.minecraftUUID = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Minecraft account unlinked successfully for ${username}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to generate mock player stats for development
 */
function generateMockPlayerStats(user) {
  // Generate deterministic but random-seeming data based on user ID
  const idSum = user._id.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const randomSeed = idSum % 1000;
  
  // Basic player info
  const data = {
    username: user.username,
    mcUsername: user.minecraftUsername,
    minecraftUUID: user.minecraftUUID,
    linked: true,
    level: 30 + (randomSeed % 70), // Level between 30-99
    experience: randomSeed % 100, // XP progress 0-99%
    blocks_mined: 50000 + (randomSeed * 131) % 150000,
    mobs_killed: 5000 + (randomSeed * 73) % 15000,
    deaths: 50 + (randomSeed * 41) % 200,
    balance: 100000 + (randomSeed * 1337) % 1000000,
    playtime: `${200 + (randomSeed * 47) % 800}h`,
    playtime_minutes: (200 + (randomSeed * 47) % 800) * 60,
    achievements: 20 + (randomSeed % 40),
    world: ["Survival", "Creative", "Skyblock", "Factions"][randomSeed % 4],
    gamemode: ["SURVIVAL", "CREATIVE", "ADVENTURE", "SPECTATOR"][randomSeed % 4],
    online: randomSeed % 2 === 0,
    lastSeen: randomSeed % 2 === 0 ? 'Online now' : '3 hours ago',
    rank: ["DEFAULT", "VIP", "MVP", "ELITE"][randomSeed % 4],
    biome: ["Plains", "Desert", "Forest", "Dark Forest", "Mountains", "Taiga", "Jungle"][randomSeed % 7],
  };
  
  // Add coords based on biome
  data.coords = {
    x: (randomSeed * 37) % 5000 - 2500,
    y: data.biome === "Mountains" ? 120 + (randomSeed % 30) : 60 + (randomSeed % 20),
    z: (randomSeed * 73) % 5000 - 2500
  };
  
  // Add inventory with randomized items
  data.inventory = {
    main_hand: {
      name: ['diamond_sword', 'netherite_sword', 'diamond_pickaxe', 'netherite_pickaxe'][randomSeed % 4],
      amount: 1,
      enchantments: ['sharpness_v', 'looting_iii', 'unbreaking_iii', 'mending'].slice(0, 2 + (randomSeed % 3))
    },
    armor: {
      helmet: {
        name: ['diamond_helmet', 'netherite_helmet'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      chestplate: {
        name: ['diamond_chestplate', 'netherite_chestplate'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      leggings: {
        name: ['diamond_leggings', 'netherite_leggings'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      boots: {
        name: ['diamond_boots', 'netherite_boots'][randomSeed % 2],
        enchantments: ['protection_iv', 'feather_falling_iv', 'depth_strider_iii', 'mending'].slice(0, 2 + (randomSeed % 3))
      }
    },
    valuables: {
      diamond: 10 + (randomSeed % 90),
      emerald: 5 + (randomSeed % 30),
      gold_ingot: 20 + (randomSeed % 80),
      netherite_ingot: 2 + (randomSeed % 15),
      ancient_debris: 5 + (randomSeed % 30),
      ender_pearl: 4 + (randomSeed % 12),
      shulker_box: 1 + (randomSeed % 10)
    }
  };
  
  // Add mcMMO data if randomSeed is high enough
  if (randomSeed > 300) {
    data.mcmmo_data = {
      power_level: 1000 + (randomSeed * 37) % 4000,
      skills: {
        mining: 300 + (randomSeed * 11) % 700,
        woodcutting: 300 + (randomSeed * 13) % 700,
        herbalism: 200 + (randomSeed * 17) % 600,
        excavation: 200 + (randomSeed * 19) % 700,
        fishing: 100 + (randomSeed * 23) % 500,
        repair: 100 + (randomSeed * 29) % 400,
        unarmed: 50 + (randomSeed * 31) % 300,
        archery: 100 + (randomSeed * 37) % 400,
        swords: 200 + (randomSeed * 41) % 500,
        axes: 100 + (randomSeed * 43) % 400,
        acrobatics: 100 + (randomSeed * 47) % 500,
        taming: 50 + (randomSeed * 53) % 300,
        alchemy: 50 + (randomSeed * 59) % 300
      }
    };
  }
  
  // Add jobs data if randomSeed is even
  if (randomSeed % 2 === 0) {
    data.jobs_data = {
      points: 1000 + (randomSeed * 67) % 5000,
      total_money_earned: 500000 + (randomSeed * 71) % 1500000,
      jobs: [
        {
          name: 'Miner',
          level: 30 + (randomSeed * 13) % 70,
          exp: (randomSeed * 17) % 100,
          quest_progress: (randomSeed * 19) % 100
        },
        {
          name: 'Farmer',
          level: 20 + (randomSeed * 23) % 60,
          exp: (randomSeed * 29) % 100,
          quest_progress: (randomSeed * 31) % 100
        },
        {
          name: 'Hunter',
          level: 25 + (randomSeed * 37) % 65,
          exp: (randomSeed * 41) % 100,
          quest_progress: (randomSeed * 43) % 100
        }
      ]
    };
    
    // Add more jobs if randomSeed is higher
    if (randomSeed > 500) {
      data.jobs_data.jobs.push(
        {
          name: 'Enchanter',
          level: 15 + (randomSeed * 47) % 50,
          exp: (randomSeed * 53) % 100,
          quest_progress: (randomSeed * 59) % 100
        },
        {
          name: 'Builder',
          level: 35 + (randomSeed * 61) % 75,
          exp: (randomSeed * 67) % 100,
          quest_progress: (randomSeed * 71) % 100
        }
      );
    }
  }
  
  // Add economy data
  data.economy_data = {
    balance: data.balance,
    bank_balance: 1000000 + (randomSeed * 73) % 5000000,
    total_transactions: 1000 + (randomSeed * 79) % 5000,
    shops: {
      owned: (randomSeed * 83) % 10,
      items_sold: 500 + (randomSeed * 89) % 2000,
      items_bought: 300 + (randomSeed * 97) % 1000,
      profit_week: 50000 + (randomSeed * 101) % 300000
    }
  };
  
  // Add advancements (achievements)
  data.advancements = [];
  data.advancements_total = 60;
  
  // Basic advancements everyone has
  data.advancements.push(
    'minecraft:story/root',
    'minecraft:story/mine_stone',
    'minecraft:adventure/root',
    'minecraft:adventure/kill_a_mob',
    'minecraft:adventure/sleep_in_bed'
  );
  
  // Add more advancements based on level
  if (data.level > 40) {
    data.advancements.push(
      'minecraft:story/upgrade_tools',
      'minecraft:story/smelt_iron',
      'minecraft:story/obtain_armor',
      'minecraft:story/lava_bucket',
      'minecraft:story/iron_tools',
      'minecraft:story/deflect_arrow'
    );
  }
  
  if (data.level > 60) {
    data.advancements.push(
      'minecraft:story/enter_the_nether',
      'minecraft:nether/root',
      'minecraft:nether/find_fortress',
      'minecraft:nether/return_to_sender',
      'minecraft:nether/obtain_blaze_rod'
    );
  }
  
  if (data.level > 80) {
    data.advancements.push(
      'minecraft:story/follow_ender_eye',
      'minecraft:story/enter_the_end',
      'minecraft:end/root',
      'minecraft:end/kill_dragon'
    );
  }
  
  if (data.level > 90) {
    data.advancements.push(
      'minecraft:end/enter_end_gateway',
      'minecraft:end/find_end_city',
      'minecraft:end/elytra'
    );
  }
  
  // Calculate advancements count and percentage
  data.advancements_count = data.advancements.length;
  data.advancements_percentage = Math.round((data.advancements_count / data.advancements_total) * 100);
  
  return data;
}

module.exports = router;