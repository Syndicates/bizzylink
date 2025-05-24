/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file RightSidebar.jsx
 * @description Right sidebar component with quick stats, progress, and activity (matching legacy Profile.js)
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';

const RightSidebar = ({ 
  profileUser, 
  playerStats, 
  achievements, 
  isOwnProfile 
}) => {
  if (!profileUser) return null;

  // Achievement data matching legacy Profile.js logic
  const ADVANCEMENT_DATA = {
    // Same advancement data structure as AchievementsTab for consistency
    "minecraft:story/root": { name: "Minecraft", category: "story" },
    "minecraft:story/mine_stone": { name: "Stone Age", category: "story" },
    "minecraft:story/upgrade_tools": { name: "Getting an Upgrade", category: "story" },
    "minecraft:story/smelt_iron": { name: "Acquire Hardware", category: "story" },
    "minecraft:story/obtain_armor": { name: "Suit Up", category: "story" },
    "minecraft:story/lava_bucket": { name: "Hot Stuff", category: "story" },
    "minecraft:story/iron_tools": { name: "Isn't It Iron Pick", category: "story" },
    "minecraft:story/deflect_arrow": { name: "Not Today, Thank You", category: "story" },
    "minecraft:story/form_obsidian": { name: "Ice Bucket Challenge", category: "story" },
    "minecraft:story/mine_diamond": { name: "Diamonds!", category: "story" },
    "minecraft:story/enter_the_nether": { name: "We Need to Go Deeper", category: "story" },
    "minecraft:story/shiny_gear": { name: "Cover Me with Diamonds", category: "story" },
    "minecraft:story/enchant_item": { name: "Enchanter", category: "story" },
    "minecraft:story/cure_zombie_villager": { name: "Zombie Doctor", category: "story" },
    "minecraft:story/follow_ender_eye": { name: "Eye Spy", category: "story" },
    "minecraft:story/enter_the_end": { name: "The End?", category: "story" },
    "minecraft:nether/root": { name: "Nether", category: "nether" },
    "minecraft:nether/return_to_sender": { name: "Return to Sender", category: "nether" },
    "minecraft:nether/find_bastion": { name: "Those Were the Days", category: "nether" },
    "minecraft:nether/obtain_ancient_debris": { name: "Hidden in the Depths", category: "nether" },
    "minecraft:nether/fast_travel": { name: "Subspace Bubble", category: "nether" },
    "minecraft:nether/find_fortress": { name: "A Terrible Fortress", category: "nether" },
    "minecraft:nether/obtain_crying_obsidian": { name: "Who is Cutting Onions?", category: "nether" },
    "minecraft:nether/distract_piglin": { name: "Oh Shiny", category: "nether" },
    "minecraft:nether/ride_strider": { name: "This Boat Has Legs", category: "nether" },
    "minecraft:nether/uneasy_alliance": { name: "Uneasy Alliance", category: "nether" },
    "minecraft:nether/loot_bastion": { name: "War Pigs", category: "nether" },
    "minecraft:nether/use_lodestone": { name: "Country Lode, Take Me Home", category: "nether" },
    "minecraft:nether/netherite_armor": { name: "Cover me in Debris", category: "nether" },
    "minecraft:nether/get_wither_skull": { name: "Spooky Scary Skeleton", category: "nether" },
    "minecraft:nether/obtain_blaze_rod": { name: "Into Fire", category: "nether" },
    "minecraft:nether/charge_respawn_anchor": { name: 'Not Quite "Nine" Lives', category: "nether" },
    "minecraft:nether/ride_strider_in_overworld_lava": { name: "Feels like Home", category: "nether" },
    "minecraft:nether/explore_nether": { name: "Hot Tourist Destinations", category: "nether" },
    "minecraft:nether/summon_wither": { name: "Withering Heights", category: "nether" },
    "minecraft:nether/brew_potion": { name: "Local Brewery", category: "nether" },
    "minecraft:nether/create_beacon": { name: "Bring Home the Beacon", category: "nether" },
    "minecraft:nether/all_potions": { name: "A Furious Cocktail", category: "nether" },
    "minecraft:nether/create_full_beacon": { name: "Beaconator", category: "nether" },
    "minecraft:nether/all_effects": { name: "How Did We Get Here?", category: "nether" },
    "minecraft:end/root": { name: "The End", category: "end" },
    "minecraft:end/kill_dragon": { name: "Free the End", category: "end" },
    "minecraft:end/dragon_egg": { name: "The Next Generation", category: "end" },
    "minecraft:end/enter_end_gateway": { name: "Remote Getaway", category: "end" },
    "minecraft:end/respawn_dragon": { name: "The End... Again...", category: "end" },
    "minecraft:end/dragon_breath": { name: "You Need a Mint", category: "end" },
    "minecraft:end/find_end_city": { name: "The City at the End of the Game", category: "end" },
    "minecraft:end/elytra": { name: "Sky's the Limit", category: "end" },
    "minecraft:end/levitate": { name: "Great View From Up Here", category: "end" },
    "minecraft:adventure/root": { name: "Adventure", category: "adventure" },
    "minecraft:adventure/voluntary_exile": { name: "Voluntary Exile", category: "adventure" },
    "minecraft:adventure/spyglass_at_parrot": { name: "Is It a Bird?", category: "adventure" },
    "minecraft:adventure/kill_a_mob": { name: "Monster Hunter", category: "adventure" },
    "minecraft:husbandry/root": { name: "Husbandry", category: "husbandry" },
    "minecraft:husbandry/safely_harvest_honey": { name: "Bee Our Guest", category: "husbandry" },
    "minecraft:husbandry/breed_an_animal": { name: "The Parrots and the Bats", category: "husbandry" },
    "minecraft:husbandry/fishy_business": { name: "Fishy Business", category: "husbandry" },
    "minecraft:husbandry/tame_an_animal": { name: "Best Friends Forever", category: "husbandry" },
  };

  return (
    <div className="space-y-6">
      
      {/* Quick Stats Panel - Exactly matching legacy Profile.js */}
      <div className="habbo-card p-5 rounded-md">
        <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
          📊 Quick Stats
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Achievements</span>
            <span className="text-minecraft-habbo-yellow font-bold">
              {
                (playerStats?.advancements || []).filter(
                  (advancement) =>
                    !advancement.includes("recipes/") &&
                    ADVANCEMENT_DATA[advancement],
                ).length
              }
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Recipes</span>
            <span className="text-minecraft-habbo-green font-bold">
              {
                (playerStats?.advancements || []).filter(
                  (advancement) => advancement.includes("recipes/"),
                ).length
              }
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Level</span>
            <span className="text-minecraft-habbo-blue font-bold">
              {playerStats?.level || 1}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Deaths</span>
            <span className="text-red-400 font-bold">
              {playerStats?.deaths || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Panel - Exactly matching legacy Profile.js */}
      <div className="habbo-card p-5 rounded-md">
        <h2 className="text-lg font-minecraft text-minecraft-habbo-yellow mb-4 border-b border-white/10 pb-2">
          📈 Progress
        </h2>

        <div className="space-y-4">
          {/* Achievement Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Achievements</span>
              <span className="text-minecraft-habbo-yellow">
                {Math.round(
                  ((playerStats?.advancements || []).filter(
                    (advancement) =>
                      !advancement.includes("recipes/") &&
                      ADVANCEMENT_DATA[advancement],
                  ).length /
                    Object.keys(ADVANCEMENT_DATA).length) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
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

          {/* Recipe Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Recipes</span>
              <span className="text-minecraft-habbo-green">
                {
                  (playerStats?.advancements || []).filter(
                    (advancement) => advancement.includes("recipes/"),
                  ).length
                }
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    ((playerStats?.advancements || []).filter(
                      (advancement) => advancement.includes("recipes/"),
                    ).length /
                      600) *
                      100,
                    100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Panel - Exactly matching legacy Profile.js */}
      <div className="habbo-card p-5 rounded-md">
        <h2 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 border-b border-white/10 pb-2">
          🎮 Activity
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-gray-300">
                Currently {playerStats?.gamemode || "SURVIVAL"}
              </p>
              <p className="text-gray-500 text-xs">Game mode</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-gray-300">
                {playerStats?.playtime || "0h"}
              </p>
              <p className="text-gray-500 text-xs">Total playtime</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-gray-300">
                {(playerStats?.blocks_mined || playerStats?.blocksMined || 0).toLocaleString()} blocks
              </p>
              <p className="text-gray-500 text-xs">Blocks mined</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-gray-300">
                {playerStats?.mobs_killed || playerStats?.mobsKilled || 0} mobs
              </p>
              <p className="text-gray-500 text-xs">Mobs defeated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Server Info Panel - Optional, matching legacy Profile.js */}
      {playerStats?.minecraft?.stats?.placeholders && (
        <div className="habbo-card p-5 rounded-md">
          <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
            🖥️ Server Info
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Online Players</span>
              <span className="text-green-400">
                {playerStats.minecraft.stats.placeholders.server_online || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Server TPS</span>
              <span className="text-blue-400">20.0</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Your Ping</span>
              <span className="text-yellow-400">
                {playerStats.minecraft.stats.placeholders.player_ping || 0}ms
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RightSidebar; 