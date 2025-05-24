/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 */

import React from 'react';
import { 
  TrophyIcon as HeroTrophyIcon, 
  GiftIcon as HeroGiftIcon, 
  CheckIcon as HeroCheckIcon 
} from '@heroicons/react/24/outline';

const AchievementsTab = ({ playerStats, profileUser, isOwnProfile }) => {
  // Comprehensive advancement mapping based on Minecraft 1.21 (exactly matching legacy Profile.js)
  const ADVANCEMENT_DATA = {
    // Minecraft/Story Tab
    "minecraft:story/root": {
      name: "Minecraft",
      description: "The heart and story of the game",
      requirement: "Make a Crafting Table",
      category: "story",
      icon: "📖",
    },
    "minecraft:story/mine_stone": {
      name: "Stone Age",
      description: "Mine stone with your new pickaxe",
      requirement: "Get Cobblestone",
      category: "story",
      icon: "⛏️",
    },
    "minecraft:story/upgrade_tools": {
      name: "Getting an Upgrade",
      description: "Construct a better pickaxe",
      requirement: "Make Stone Pickaxe",
      category: "story",
      icon: "🔧",
    },
    "minecraft:story/smelt_iron": {
      name: "Acquire Hardware",
      description: "Smelt an iron ingot",
      requirement: "Get Iron Ingot",
      category: "story",
      icon: "🔥",
    },
    "minecraft:story/obtain_armor": {
      name: "Suit Up",
      description: "Protect yourself with a piece of iron armor",
      requirement: "Get Iron Armor",
      category: "story",
      icon: "🛡️",
    },
    "minecraft:story/lava_bucket": {
      name: "Hot Stuff",
      description: "Fill a bucket with lava",
      requirement: "Get Lava Bucket",
      category: "story",
      icon: "🪣",
    },
    "minecraft:story/iron_tools": {
      name: "Isn't It Iron Pick",
      description: "Upgrade your pickaxe",
      requirement: "Make Iron Pickaxe",
      category: "story",
      icon: "⛏️",
    },
    "minecraft:story/deflect_arrow": {
      name: "Not Today, Thank You",
      description: "Deflect a projectile with a shield",
      requirement: "Deflect Arrow with Shield",
      category: "story",
      icon: "🛡️",
    },
    "minecraft:story/form_obsidian": {
      name: "Ice Bucket Challenge",
      description: "Form and mine a block of Obsidian",
      requirement: "Get Obsidian",
      category: "story",
      icon: "🧊",
    },
    "minecraft:story/mine_diamond": {
      name: "Diamonds!",
      description: "Acquire diamonds",
      requirement: "Get Diamond",
      category: "story",
      icon: "💎",
    },
    "minecraft:story/enter_the_nether": {
      name: "We Need to Go Deeper",
      description: "Build, light and enter a Nether Portal",
      requirement: "Enter Nether",
      category: "story",
      icon: "🌋",
    },
    "minecraft:story/shiny_gear": {
      name: "Cover Me with Diamonds",
      description: "Diamond armor saves lives",
      requirement: "Get Diamond Armor",
      category: "story",
      icon: "💎",
    },
    "minecraft:story/enchant_item": {
      name: "Enchanter",
      description: "Enchant an item at an Enchanting Table",
      requirement: "Enchant an Item",
      category: "story",
      icon: "✨",
    },
    "minecraft:story/cure_zombie_villager": {
      name: "Zombie Doctor",
      description: "Weaken and then cure a Zombie Villager",
      requirement: "Cure Zombie Villager",
      category: "story",
      icon: "🧟",
    },
    "minecraft:story/follow_ender_eye": {
      name: "Eye Spy",
      description: "Follow an Ender Eye",
      requirement: "Enter a Stronghold",
      category: "story",
      icon: "👁️",
    },
    "minecraft:story/enter_the_end": {
      name: "The End?",
      description: "Enter the End Portal",
      requirement: "Enter the End",
      category: "story",
      icon: "🌟",
    },

    // Nether Tab
    "minecraft:nether/root": {
      name: "Nether",
      description: "Bring summer clothes",
      requirement: "Enter the Nether",
      category: "nether",
      icon: "🔥",
    },
    "minecraft:nether/return_to_sender": {
      name: "Return to Sender",
      description: "Destroy a Ghast with a fireball",
      requirement: "Kill a Ghast By Deflecting its Fireball",
      category: "nether",
      icon: "👻",
    },
    "minecraft:nether/find_bastion": {
      name: "Those Were the Days",
      description: "Enter a Bastion Remnant",
      requirement: "Enter a Bastion",
      category: "nether",
      icon: "🏰",
    },
    "minecraft:nether/obtain_ancient_debris": {
      name: "Hidden in the Depths",
      description: "Obtain Ancient Debris",
      requirement: "Obtain Ancient Debris",
      category: "nether",
      icon: "⚫",
    },
    "minecraft:nether/fast_travel": {
      name: "Subspace Bubble",
      description: "Use the Nether to travel 7 km in the Overworld",
      requirement: "Travel 7km in the Overworld using the Nether",
      category: "nether",
      icon: "🚀",
    },
    "minecraft:nether/find_fortress": {
      name: "A Terrible Fortress",
      description: "Break your way into a Nether Fortress",
      requirement: "Enter a Nether Fortress",
      category: "nether",
      icon: "🏛️",
    },
    "minecraft:nether/obtain_crying_obsidian": {
      name: "Who is Cutting Onions?",
      description: "Obtain Crying Obsidian",
      requirement: "Obtain Crying Obsidian",
      category: "nether",
      icon: "😢",
    },
    "minecraft:nether/distract_piglin": {
      name: "Oh Shiny",
      description: "Distract Piglins with gold",
      requirement: "Distract a aggravated Piglin with Gold",
      category: "nether",
      icon: "🏆",
    },
    "minecraft:nether/ride_strider": {
      name: "This Boat Has Legs",
      description: "Ride a Strider with a Warped Fungus on a Stick",
      requirement: "Ride a Strider with a warped Fungus on a stick",
      category: "nether",
      icon: "🦵",
    },
    "minecraft:nether/uneasy_alliance": {
      name: "Uneasy Alliance",
      description:
        "Rescue a Ghast from the Nether, bring it safely home to the Overworld... and then kill it",
      requirement: "Kill a Ghast in the Overworld",
      category: "nether",
      icon: "🤝",
    },
    "minecraft:nether/loot_bastion": {
      name: "War Pigs",
      description: "Loot a chest in a Bastion Remnant",
      requirement: "Loot a Chest in a Bastion",
      category: "nether",
      icon: "💰",
    },
    "minecraft:nether/use_lodestone": {
      name: "Country Lode, Take Me Home",
      description: "Use a Compass on a Lodestone",
      requirement: "Use a Compass on a Lodestone",
      category: "nether",
      icon: "🧭",
    },
    "minecraft:nether/netherite_armor": {
      name: "Cover me in Debris",
      description: "Get a full suit of Netherite armor",
      requirement: "Get a Full Suit of Netherite Armor",
      category: "nether",
      icon: "⚫",
    },
    "minecraft:nether/get_wither_skull": {
      name: "Spooky Scary Skeleton",
      description: "Obtain a Wither Skeleton Skull",
      requirement: "Obtain a Wither Skeleton Skull",
      category: "nether",
      icon: "💀",
    },
    "minecraft:nether/obtain_blaze_rod": {
      name: "Into Fire",
      description: "Relieve a Blaze of its rod",
      requirement: "Obtain a Blaze Rod",
      category: "nether",
      icon: "🔥",
    },
    "minecraft:nether/charge_respawn_anchor": {
      name: 'Not Quite "Nine" Lives',
      description: "Charge a Respawn Anchor to the maximum",
      requirement: "Charge a Respawn Anchor to Max using Glowstone",
      category: "nether",
      icon: "⚡",
    },
    "minecraft:nether/ride_strider_in_overworld_lava": {
      name: "Feels like Home",
      description:
        "Take a Strider for a loooong ride on a lava lake in the Overworld",
      requirement: "Ride a Strider 50 Blocks in the Overworld on Lava",
      category: "nether",
      icon: "🏠",
    },
    "minecraft:nether/explore_nether": {
      name: "Hot Tourist Destinations",
      description: "Explore all Nether biomes",
      requirement: "Visit all 5 Nether Biomes",
      category: "nether",
      icon: "🗺️",
    },
    "minecraft:nether/summon_wither": {
      name: "Withering Heights",
      description: "Summon the Wither",
      requirement: "Summon The Wither",
      category: "nether",
      icon: "💀",
    },
    "minecraft:nether/brew_potion": {
      name: "Local Brewery",
      description: "Brew a potion",
      requirement: "Brew a Potion",
      category: "nether",
      icon: "🧪",
    },
    "minecraft:nether/create_beacon": {
      name: "Bring Home the Beacon",
      description: "Construct and place a Beacon",
      requirement: "Construct and Activate a Beacon",
      category: "nether",
      icon: "🔆",
    },
    "minecraft:nether/all_potions": {
      name: "A Furious Cocktail",
      description: "Have every potion effect applied at the same time",
      requirement: "Have all Potion Status Effects at once",
      category: "nether",
      icon: "🍸",
    },
    "minecraft:nether/create_full_beacon": {
      name: "Beaconator",
      description: "Bring a beacon to full power",
      requirement: "Construct a Full Power Beacon",
      category: "nether",
      icon: "🔆",
    },
    "minecraft:nether/all_effects": {
      name: "How Did We Get Here?",
      description: "Have every effect applied at the same time",
      requirement: "Have fun and see other sheet",
      category: "nether",
      icon: "🤯",
    },

    // End Tab
    "minecraft:end/root": {
      name: "The End",
      description: "Or the beginning?",
      requirement: "Enter The End",
      category: "end",
      icon: "🌟",
    },
    "minecraft:end/kill_dragon": {
      name: "Free the End",
      description: "Good luck",
      requirement: "Get the Last Hit on the Ender Dragon",
      category: "end",
      icon: "🐉",
    },
    "minecraft:end/dragon_egg": {
      name: "The Next Generation",
      description: "Hold the Dragon Egg",
      requirement: "Obtain the Dragon Egg",
      category: "end",
      icon: "🥚",
    },
    "minecraft:end/enter_end_gateway": {
      name: "Remote Getaway",
      description: "Escape the island",
      requirement: "Travel Through a End gateway",
      category: "end",
      icon: "🌀",
    },
    "minecraft:end/respawn_dragon": {
      name: "The End... Again...",
      description: "Respawn the Ender Dragon",
      requirement: "Respawn the Ender Dragon",
      category: "end",
      icon: "🔄",
    },
    "minecraft:end/dragon_breath": {
      name: "You Need a Mint",
      description: "Collect dragon breath in a glass bottle",
      requirement: "Collect Dragons Breath in a Glass Bottle",
      category: "end",
      icon: "💨",
    },
    "minecraft:end/find_end_city": {
      name: "The City at the End of the Game",
      description: "Go on in, what could happen?",
      requirement: "Enter an End City",
      category: "end",
      icon: "🏙️",
    },
    "minecraft:end/elytra": {
      name: "Sky's the Limit",
      description: "Find Elytra",
      requirement: "Obtain an Elytra",
      category: "end",
      icon: "🪶",
    },
    "minecraft:end/levitate": {
      name: "Great View From Up Here",
      description: "Levitate up 50 blocks from the attacks of a Shulker",
      requirement: "Move 50 Blocks Vertically From Shulker Levitation",
      category: "end",
      icon: "📈",
    },

    // Adventure Tab
    "minecraft:adventure/root": {
      name: "Adventure",
      description: "Adventure, exploration and combat",
      requirement: "Kill any Hostile Mob",
      category: "adventure",
      icon: "⚔️",
    },
    "minecraft:adventure/voluntary_exile": {
      name: "Voluntary Exile",
      description:
        "Kill a raid captain. Maybe consider staying away from villages for the time being...",
      requirement: "Kill a Raid Captain",
      category: "adventure",
      icon: "🏴‍☠️",
    },
    "minecraft:adventure/spyglass_at_parrot": {
      name: "Is It a Bird?",
      description: "Look at a Parrot through a Spyglass",
      requirement: "Look at a Parrot Through a Spyglass",
      category: "adventure",
      icon: "🔭",
    },
    "minecraft:adventure/kill_a_mob": {
      name: "Monster Hunter",
      description: "Kill any hostile monster",
      requirement: "Kill any Hostile Monster",
      category: "adventure",
      icon: "🗡️",
    },

    // Husbandry Tab
    "minecraft:husbandry/root": {
      name: "Husbandry",
      description: "The world is full of friends and food",
      requirement: "Eat Something",
      category: "husbandry",
      icon: "🌾",
    },
    "minecraft:husbandry/safely_harvest_honey": {
      name: "Bee Our Guest",
      description:
        "Use a Campfire to collect Honey from a Beehive using a Bottle without aggravating the bees",
      requirement: "Use a Glass Bottle on a beehive with a campfire underneath",
      category: "husbandry",
      icon: "🐝",
    },
    "minecraft:husbandry/breed_an_animal": {
      name: "The Parrots and the Bats",
      description: "Breed two animals together",
      requirement: "Breed any two Animals",
      category: "husbandry",
      icon: "💕",
    },
    "minecraft:husbandry/fishy_business": {
      name: "Fishy Business",
      description: "Catch a fish",
      requirement: "Get Fish with a Coat",
      category: "husbandry",
      icon: "🐟",
    },
    "minecraft:husbandry/tame_an_animal": {
      name: "Best Friends Forever",
      description: "Tame an animal",
      requirement: "Tame an Animal",
      category: "husbandry",
      icon: "❤️",
    },
  };

  // Categories for organizing achievements in the UI (exactly matching legacy Profile.js)
  const ADVANCEMENT_CATEGORIES = {
    story: {
      name: "Story",
      description: "Main progression through the game",
      icon: "📖",
      color: "bg-gradient-to-r from-green-500 to-green-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "story",
      ),
    },
    nether: {
      name: "Nether",
      description: "Adventures in the fiery dimension",
      icon: "🔥",
      color: "bg-gradient-to-r from-red-500 to-orange-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "nether",
      ),
    },
    end: {
      name: "The End",
      description: "Endgame challenges and dragon slaying",
      icon: "🌟",
      color: "bg-gradient-to-r from-purple-500 to-purple-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "end",
      ),
    },
    adventure: {
      name: "Adventure",
      description: "Exploration, combat, and discoveries",
      icon: "⚔️",
      color: "bg-gradient-to-r from-blue-500 to-blue-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "adventure",
      ),
    },
    husbandry: {
      name: "Husbandry",
      description: "Farming, animals, and food",
      icon: "🌾",
      color: "bg-gradient-to-r from-yellow-500 to-yellow-400",
      advancements: Object.values(ADVANCEMENT_DATA).filter(
        (adv) => adv.category === "husbandry",
      ),
    },
  };

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <div className="habbo-card p-5 rounded-md">
        <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
          <span>Minecraft Advancements</span>
          <span className="text-minecraft-habbo-yellow">
            {playerStats?.advancements?.length || 0} Total Unlocked
          </span>
        </h2>

        {/* Achievement vs Recipe Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 p-4 rounded border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">
                  🏆 Achievement Milestones
                </p>
                <p className="text-2xl font-bold text-white">
                  {
                    (playerStats?.advancements || []).filter(
                      (advancement) =>
                        !advancement.includes("recipes/") &&
                        ADVANCEMENT_DATA[advancement],
                    ).length
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(
                    ((playerStats?.advancements || []).filter(
                      (advancement) =>
                        !advancement.includes("recipes/") &&
                        ADVANCEMENT_DATA[advancement],
                    ).length /
                      Object.keys(ADVANCEMENT_DATA).length) *
                      100,
                  )}
                  % of tracked achievements
                </p>
              </div>
              <HeroTrophyIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 p-4 rounded border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm">
                  📋 Recipe Discoveries
                </p>
                <p className="text-2xl font-bold text-white">
                  {
                    (playerStats?.advancements || []).filter(
                      (advancement) =>
                        advancement.includes("recipes/"),
                    ).length
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Crafting recipes unlocked
                </p>
              </div>
              <HeroGiftIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Achievement Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>🏆 Achievement Progress</span>
              <span>
                {
                  (playerStats?.advancements || []).filter(
                    (advancement) =>
                      !advancement.includes("recipes/") &&
                      ADVANCEMENT_DATA[advancement],
                  ).length
                }{" "}
                / {Object.keys(ADVANCEMENT_DATA).length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((playerStats?.advancements || []).filter(
                      (advancement) =>
                        !advancement.includes("recipes/") &&
                        ADVANCEMENT_DATA[advancement],
                    ).length /
                      Object.keys(ADVANCEMENT_DATA).length) *
                      100,
                    100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Total Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>📊 Total Advancement Progress</span>
              <span>
                {playerStats?.advancements?.length || 0} unlocked
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-minecraft-habbo-blue to-minecraft-habbo-green h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(((playerStats?.advancements?.length || 0) / 1000) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Includes both achievements and recipe discoveries
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-minecraft-navy-light/30 border border-minecraft-habbo-blue/30 p-4 rounded mt-6">
          <div className="flex items-start space-x-3">
            <div className="text-minecraft-habbo-blue text-lg">
              ℹ️
            </div>
            <div className="text-sm">
              <p className="text-gray-300 mb-2">
                <strong className="text-minecraft-habbo-blue">
                  What are Advancements?
                </strong>
              </p>
              <p className="text-gray-400 mb-2">
                Minecraft tracks two types of advancements:
              </p>
              <ul className="text-gray-400 text-xs space-y-1 ml-4">
                <li>
                  •{" "}
                  <strong className="text-blue-400">
                    Achievement Milestones
                  </strong>{" "}
                  - Gameplay challenges you complete
                </li>
                <li>
                  •{" "}
                  <strong className="text-green-400">
                    Recipe Discoveries
                  </strong>{" "}
                  - Crafting recipes automatically unlocked
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-4">
        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-4">
          🏆 Achievement Milestones
        </h3>
        {Object.entries(ADVANCEMENT_CATEGORIES).map(
          ([categoryKey, categoryData]) => {
            // Filter earned advancements for this category (exclude recipes)
            const earnedInCategory = (
              playerStats?.advancements || []
            ).filter(
              (advancement) =>
                !advancement.includes("recipes/") &&
                ADVANCEMENT_DATA[advancement] &&
                ADVANCEMENT_DATA[advancement].category ===
                  categoryKey,
            );

            const totalInCategory =
              categoryData.advancements.length;
            const completionPercentage =
              totalInCategory > 0
                ? Math.round(
                    (earnedInCategory.length / totalInCategory) *
                      100,
                  )
                : 0;

            return (
              <div
                key={categoryKey}
                className="habbo-card p-5 rounded-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {categoryData.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-minecraft text-minecraft-habbo-blue">
                        {categoryData.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {categoryData.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-minecraft-habbo-yellow font-bold">
                      {earnedInCategory.length}/{totalInCategory}
                    </p>
                    <p className="text-sm text-gray-400">
                      {completionPercentage}% Complete
                    </p>
                  </div>
                </div>

                {/* Category Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${categoryData.color}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Show earned advancements in this category */}
                {earnedInCategory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Earned Achievements:
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {earnedInCategory.map((advancementId) => {
                        const advancementData =
                          ADVANCEMENT_DATA[advancementId];
                        if (!advancementData) return null;

                        return (
                          <div
                            key={advancementId}
                            className="bg-gray-800/50 p-3 rounded border border-gray-600/30 hover:border-minecraft-habbo-blue/50 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">
                                {advancementData.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-white text-sm">
                                  {advancementData.name}
                                </h5>
                                <p className="text-xs text-gray-400 mb-1">
                                  {advancementData.description}
                                </p>
                                <p className="text-xs text-minecraft-habbo-yellow">
                                  <span className="font-medium">
                                    Requirement:
                                  </span>{" "}
                                  {advancementData.requirement}
                                </p>
                              </div>
                              <HeroCheckIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {earnedInCategory.length === 0 && (
                  <p className="text-gray-500 text-sm italic">
                    No achievements earned in this category yet.
                  </p>
                )}
              </div>
            );
          },
        )}
      </div>

      {/* Recipe Discoveries Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-minecraft text-minecraft-habbo-green mb-4">
          📋 Recipe Discoveries
        </h3>

        {/* Recipe Overview */}
        <div className="habbo-card p-5 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-minecraft text-minecraft-habbo-green">
              Unlocked Recipes
            </h4>
            <span className="text-minecraft-habbo-yellow font-bold">
              {
                (playerStats?.advancements || []).filter(
                  (advancement) => advancement.includes("recipes/"),
                ).length
              }{" "}
              Total
            </span>
          </div>

          {(playerStats?.advancements || []).filter((advancement) =>
            advancement.includes("recipes/"),
          ).length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Recipes are automatically unlocked as you discover new items and materials in your adventures.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {(playerStats?.advancements || []).filter((advancement) =>
                  advancement.includes("recipes/"),
                ).slice(0, 12).map((recipe) => {
                  const recipeName = recipe
                    .split("/")
                    .pop()
                    .replace(/_/g, " ")
                    .replace(/^\w/, (c) => c.toUpperCase());
                  return (
                    <div
                      key={recipe}
                      className="bg-gray-800/30 p-2 rounded text-gray-300"
                    >
                      {recipeName}
                    </div>
                  );
                })}
                {(playerStats?.advancements || []).filter((advancement) =>
                  advancement.includes("recipes/"),
                ).length > 12 && (
                  <div className="bg-gray-800/30 p-2 rounded text-gray-400 italic">
                    +{(playerStats?.advancements || []).filter((advancement) =>
                      advancement.includes("recipes/"),
                    ).length - 12} more...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No recipes discovered yet. Craft items to unlock recipes!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsTab; 