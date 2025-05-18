/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file PlayerDataManager.java
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

package com.bizzynation.data;

import com.bizzynation.LinkPlugin;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import org.json.simple.JSONArray;
import com.bizzynation.listeners.EconomyListener;

/**
 * Manages player data and synchronization with the website
 */
public class PlayerDataManager {
    private final LinkPlugin plugin;
    private final JSONParser jsonParser;
    
    // Store previous top 3 for each leaderboard category
    private final Map<String, List<String>> previousTop3 = new HashMap<>(); // category -> list of UUID strings
    private final Map<String, Map<String, Double>> previousTop3Values = new HashMap<>(); // category -> (uuid -> value)

    // List of leaderboard categories and their stat keys
    private static final String[] LEADERBOARD_CATEGORIES = {"playtime", "economy", "mcmmo", "kills", "mining", "achievements"};
    private static final Map<String, String> CATEGORY_STAT_KEY = new HashMap<>();
    static {
        CATEGORY_STAT_KEY.put("playtime", "playtime_minutes");
        CATEGORY_STAT_KEY.put("economy", "balance");
        CATEGORY_STAT_KEY.put("mcmmo", "mcmmo_power_level");
        CATEGORY_STAT_KEY.put("kills", "mobs_killed");
        CATEGORY_STAT_KEY.put("mining", "blocks_mined");
        CATEGORY_STAT_KEY.put("achievements", "achievements");
    }

    public PlayerDataManager(LinkPlugin plugin) {
        this.plugin = plugin;
        this.jsonParser = new JSONParser();
    }
    
    /**
     * Collects all relevant player data to be sent to the website
     * @param player The player to collect data for
     * @return A Map of player data
     */
    public Map<String, Object> collectPlayerData(Player player) {
        Map<String, Object> data = new HashMap<>();
        
        // Basic player data
        data.put("username", player.getName());
        data.put("uuid", player.getUniqueId().toString());
        data.put("online", true);
        data.put("ip", player.getAddress() != null ? player.getAddress().getHostString() : "unknown");
        data.put("world", player.getWorld().getName());
        data.put("level", player.getLevel());
        data.put("health", player.getHealth());
        data.put("food", player.getFoodLevel());
        data.put("gamemode", player.getGameMode().toString());
        data.put("op", player.isOp());
        
        // Always add detailed inventory data with enhanced details for dashboard
        Map<String, Object> inventoryData = collectEnhancedInventoryData(player);
        data.put("inventory", inventoryData);
        
        // Add timestamps for dashboard animations
        long currentTimestamp = System.currentTimeMillis();
        data.put("sync_timestamp", currentTimestamp);
        
        // Add last_updated timestamps for each data category to help the dashboard detect changes
        Map<String, Long> lastUpdated = new HashMap<>();
        lastUpdated.put("inventory", currentTimestamp);
        lastUpdated.put("location", currentTimestamp);
        lastUpdated.put("experience", currentTimestamp);
        lastUpdated.put("health", currentTimestamp);
        lastUpdated.put("economy", currentTimestamp);
        lastUpdated.put("statistics", currentTimestamp);
        lastUpdated.put("advancements", currentTimestamp);
        
        // Add individual timestamps for each statistic to match the pattern used for XP and balance
        // Make these stand out more by adding a random offset to ensure the dashboard sees them as changed
        long statsTimestamp = currentTimestamp + (long)(Math.random() * 100);
        lastUpdated.put("blocks_mined", statsTimestamp);
        lastUpdated.put("deaths", statsTimestamp);
        lastUpdated.put("mobs_killed", statsTimestamp);
        lastUpdated.put("player_kills", statsTimestamp);
        lastUpdated.put("jumps", statsTimestamp);
        lastUpdated.put("items_crafted", statsTimestamp);
        lastUpdated.put("fish_caught", statsTimestamp);
        lastUpdated.put("animals_bred", statsTimestamp);
        lastUpdated.put("distance_traveled", statsTimestamp);
        lastUpdated.put("time_played", statsTimestamp);
        
        data.put("last_updated", lastUpdated);
        
        // Add change_ids for each data category so the dashboard can detect when something has changed
        Map<String, String> changeIds = new HashMap<>();
        changeIds.put("inventory", generateChangeId(player.getInventory()));
        changeIds.put("location", generateChangeId(player.getLocation()));
        changeIds.put("experience", generateChangeId(player.getLevel() + ":" + player.getExp()));
        changeIds.put("health", generateChangeId(player.getHealth() + ":" + player.getFoodLevel()));
        
        // Use the same format for stat change_ids as is used for experience and health
        int blocksMined = calculateTotalBlocksMined(player);
        int deaths = getSafeStatistic(player, org.bukkit.Statistic.DEATHS);
        int mobsKilled = getSafeStatistic(player, org.bukkit.Statistic.MOB_KILLS);
        int playerKills = getSafeStatistic(player, org.bukkit.Statistic.PLAYER_KILLS);
        int jumps = getSafeStatistic(player, org.bukkit.Statistic.JUMP);
        int damageDealt = getSafeStatistic(player, org.bukkit.Statistic.DAMAGE_DEALT);
        int damageTaken = getSafeStatistic(player, org.bukkit.Statistic.DAMAGE_TAKEN);
        int itemsCrafted = calculateTotalItemsCrafted(player);
        int fishCaught = getSafeStatistic(player, org.bukkit.Statistic.FISH_CAUGHT);
        int animalsBred = getSafeStatistic(player, org.bukkit.Statistic.ANIMALS_BRED);
        int timePlayed = getSafeStatistic(player, org.bukkit.Statistic.PLAY_ONE_MINUTE);
        
        // Add player statistics to change_ids for real-time updates with EXACT SAME FORMAT as experience/health
        // Note that experience uses "level:exp" format, so we'll make statistics use "value:randomValue" format
        long randomValue = System.currentTimeMillis() % 1000; // Use current time mod 1000 as the random value
        changeIds.put("blocks_mined", generateChangeId(blocksMined + ":" + randomValue));
        changeIds.put("deaths", generateChangeId(deaths + ":" + randomValue));
        changeIds.put("mobs_killed", generateChangeId(mobsKilled + ":" + randomValue));
        changeIds.put("player_kills", generateChangeId(playerKills + ":" + randomValue));
        changeIds.put("jumps", generateChangeId(jumps + ":" + randomValue));
        changeIds.put("damage_dealt", generateChangeId(damageDealt + ":" + randomValue));
        changeIds.put("damage_taken", generateChangeId(damageTaken + ":" + randomValue));
        changeIds.put("items_crafted", generateChangeId(itemsCrafted + ":" + randomValue));
        changeIds.put("fish_caught", generateChangeId(fishCaught + ":" + randomValue));
        changeIds.put("animals_bred", generateChangeId(animalsBred + ":" + randomValue));
        changeIds.put("time_played", generateChangeId(timePlayed + ":" + randomValue));
        
        // Add distance-related statistics for real-time updates
        // Use different variable names to avoid redefinition
        int walkDist = getSafeStatistic(player, org.bukkit.Statistic.WALK_ONE_CM) / 100;
        int sprintDist = getSafeStatistic(player, org.bukkit.Statistic.SPRINT_ONE_CM) / 100;
        int flyDist = getSafeStatistic(player, org.bukkit.Statistic.FLY_ONE_CM) / 100;
        int swimDist = getSafeStatistic(player, org.bukkit.Statistic.SWIM_ONE_CM) / 100;
        int boatDist = getSafeStatistic(player, org.bukkit.Statistic.BOAT_ONE_CM) / 100;
        int minecartDist = getSafeStatistic(player, org.bukkit.Statistic.MINECART_ONE_CM) / 100;
        int horseDist = getSafeStatistic(player, org.bukkit.Statistic.HORSE_ONE_CM) / 100;
        int elytraDist = getSafeStatistic(player, org.bukkit.Statistic.AVIATE_ONE_CM) / 100;
        
        int totalDist = walkDist + sprintDist + flyDist + swimDist + 
                        boatDist + minecartDist + horseDist + elytraDist;
        
        changeIds.put("distance_traveled", generateChangeId("dist_" + totalDist));
        changeIds.put("walk_distance", generateChangeId("walk_" + walkDist));
        changeIds.put("sprint_distance", generateChangeId("sprint_" + sprintDist));
        changeIds.put("fly_distance", generateChangeId("fly_" + flyDist));
        changeIds.put("swim_distance", generateChangeId("swim_" + swimDist));
        
        data.put("change_ids", changeIds);
        
        // Add enhanced location data with more details for the dashboard
        Map<String, Object> locationData = new HashMap<>();
        locationData.put("x", player.getLocation().getX());
        locationData.put("y", player.getLocation().getY());
        locationData.put("z", player.getLocation().getZ());
        locationData.put("world", player.getWorld().getName());
        locationData.put("dimension", getDimensionType(player.getWorld()));
        locationData.put("biome", player.getLocation().getBlock().getBiome().toString());
        locationData.put("light_level", player.getLocation().getBlock().getLightLevel());
        locationData.put("block_type", player.getLocation().getBlock().getType().toString());
        
        // Add player orientation for the dashboard
        locationData.put("pitch", player.getLocation().getPitch());
        locationData.put("yaw", player.getLocation().getYaw());
        locationData.put("direction", getCardinalDirection(player.getLocation().getYaw()));
        
        data.put("location", locationData);
        
        // Add activity data to detect what the player is currently doing
        Map<String, Object> activityData = new HashMap<>();
        
        // Check if swimming
        activityData.put("swimming", player.isSwimming());
        // Check if flying 
        activityData.put("flying", player.isFlying());
        // Check if gliding (using elytra)
        activityData.put("gliding", player.isGliding());
        // Check if sneaking
        activityData.put("sneaking", player.isSneaking());
        // Check if sprinting
        activityData.put("sprinting", player.isSprinting());
        // Check if blocking
        activityData.put("blocking", player.isBlocking());
        
        // Enhanced movement statistics for visualization
        long ticksLived = player.getTicksLived();
        int walkDistance = player.getStatistic(org.bukkit.Statistic.WALK_ONE_CM);
        int flyDistance = player.getStatistic(org.bukkit.Statistic.FLY_ONE_CM);
        int swimDistance = player.getStatistic(org.bukkit.Statistic.SWIM_ONE_CM);
        
        // Calculate average speeds
        double avgWalkSpeed = (double)walkDistance / (ticksLived / 20.0 / 60.0); // blocks per minute
        double avgFlySpeed = (double)flyDistance / (ticksLived / 20.0 / 60.0); // blocks per minute
        double avgSwimSpeed = (double)swimDistance / (ticksLived / 20.0 / 60.0); // blocks per minute
        
        activityData.put("avg_walk_speed", avgWalkSpeed);
        activityData.put("avg_fly_speed", avgFlySpeed);
        activityData.put("avg_swim_speed", avgSwimSpeed);
        
        // Add last activity data to help the dashboard show what the player is currently doing
        long now = System.currentTimeMillis();
        Map<String, Object> lastActivity = new HashMap<>();
        lastActivity.put("timestamp", now);
        
        // Determine current activity based on various factors
        String currentActivity = "idle";
        
        if (player.isFlying()) {
            currentActivity = "flying";
        } else if (player.isGliding()) {
            currentActivity = "gliding";
        } else if (player.isSwimming()) {
            currentActivity = "swimming";
        } else if (player.isSprinting()) {
            currentActivity = "running";
        } else if (player.isSneaking()) {
            currentActivity = "sneaking";
        } else if (player.isBlocking()) {
            currentActivity = "blocking";
        } else if (player.isInsideVehicle()) {
            if (player.getVehicle() instanceof org.bukkit.entity.Boat) {
                currentActivity = "boating";
            } else if (player.getVehicle() instanceof org.bukkit.entity.Minecart) {
                currentActivity = "minecart";
            } else if (player.getVehicle() instanceof org.bukkit.entity.AbstractHorse) {
                currentActivity = "horse_riding";
            } else {
                currentActivity = "vehicle";
            }
        } else if (Math.abs(player.getVelocity().getY()) > 0.1) {
            if (player.getVelocity().getY() > 0) {
                currentActivity = "jumping";
            } else {
                currentActivity = "falling";
            }
        } else if (Math.abs(player.getVelocity().getX()) > 0.05 || Math.abs(player.getVelocity().getZ()) > 0.05) {
            currentActivity = "walking";
        }
        
        lastActivity.put("activity", currentActivity);
        lastActivity.put("location", player.getLocation().getWorld().getName() + " at " + 
                         (int)player.getLocation().getX() + ", " + 
                         (int)player.getLocation().getY() + ", " + 
                         (int)player.getLocation().getZ());
                         
        activityData.put("last_activity", lastActivity);
        data.put("activity", activityData);
        
        // Add XP points and total
        data.put("experience", calculateExperiencePercentage(player));
        data.put("exp_to_level", player.getExpToLevel());
        data.put("exp_level", player.getLevel());
        
        // Add additional stats for frontend display
        try {
            // Enhanced statistics collection
            Map<String, Object> stats = collectDetailedStatistics(player);
            
            // Add all stats directly to the main data object to ensure they're updated in real-time
            // Also add the _updated suffix version of each stat with current timestamp
            // This helps the dashboard detect changes immediately
            long updateTime = System.currentTimeMillis();
            
            // Create _updated fields for each stat to force the dashboard to notice changes
            data.put("blocks_mined", stats.get("blocks_mined"));
            data.put("blocks_mined_updated", updateTime);
            
            data.put("deaths", stats.get("deaths"));
            data.put("deaths_updated", updateTime);
            
            data.put("mobs_killed", stats.get("mobs_killed"));
            data.put("mobs_killed_updated", updateTime);
            
            // Add additional collected statistics with update timestamps
            data.put("player_kills", stats.get("player_kills"));
            data.put("player_kills_updated", updateTime);
            
            data.put("damage_dealt", stats.get("damage_dealt"));
            data.put("damage_dealt_updated", updateTime);
            
            data.put("damage_taken", stats.get("damage_taken"));
            data.put("damage_taken_updated", updateTime);
            
            data.put("jumps", stats.get("jumps"));
            data.put("jumps_updated", updateTime);
            
            data.put("items_crafted", stats.get("items_crafted"));
            data.put("items_crafted_updated", updateTime);
            
            data.put("fish_caught", stats.get("fish_caught"));
            data.put("fish_caught_updated", updateTime);
            
            data.put("animals_bred", stats.get("animals_bred"));
            data.put("animals_bred_updated", updateTime);
            
            data.put("distance_traveled", stats.get("distance_traveled"));
            data.put("distance_traveled_updated", updateTime);
            
            data.put("raids_won", stats.get("raids_won"));
            data.put("raids_won_updated", updateTime);
            
            data.put("time_played", stats.get("time_played"));
            data.put("time_played_updated", updateTime);
            
            System.out.println("Collected player stats - Level: " + player.getLevel() + 
                               ", XP: " + player.getTotalExperience() +
                               ", Blocks: " + stats.get("blocks_mined") +
                               ", Deaths: " + stats.get("deaths") +
                               ", Mobs: " + stats.get("mobs_killed"));
        } catch (Exception e) {
            System.out.println("Error collecting stats: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Add economy data if Vault is enabled
        if (plugin.getVaultIntegration().isEconomyEnabled() && 
                plugin.getConfig().getBoolean("data.track_economy", true)) {
            try {
                double balance = plugin.getVaultIntegration().getBalance(player);
                plugin.getLogger().info("Syncing balance for " + player.getName() + ": " + balance);
                data.put("balance", balance);
                // Add daily earnings if available
                EconomyListener ecoListener = plugin.getEconomyListener();
                if (ecoListener != null) {
                    double earnedToday = ecoListener.getMoneyEarnedToday().getOrDefault(player.getUniqueId(), 0.0);
                    data.put("money_earned_today", earnedToday);
                    double spentToday = ecoListener.getMoneySpentToday().getOrDefault(player.getUniqueId(), 0.0);
                    data.put("money_spent_today", spentToday);
                } else {
                    data.put("money_earned_today", 0.0);
                    data.put("money_spent_today", 0.0);
                }
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to get player balance: " + e.getMessage());
                data.put("balance", 0.0);
                data.put("money_earned_today", 0.0);
                data.put("money_spent_today", 0.0);
            }
        }
        
        // Add permissions data if Vault is enabled
        if (plugin.getVaultIntegration().isPermissionEnabled() && 
                plugin.getConfig().getBoolean("data.track_permissions", true)) {
            try {
                String primaryGroup = plugin.getVaultIntegration().getPrimaryGroup(player);
                plugin.getLogger().info("Syncing primary group for " + player.getName() + ": " + primaryGroup);
                data.put("group", primaryGroup);
                
                // Convert array to List to ensure proper JSON serialization
                String[] groupsArray = plugin.getVaultIntegration().getPlayerGroups(player);
                List<String> groupsList = new ArrayList<>(Arrays.asList(groupsArray));
                data.put("groups", groupsList);
                
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to get player permissions: " + e.getMessage());
                data.put("group", "default");
                data.put("groups", new ArrayList<String>());
            }
        }
        
        // Add LuckPerms data if available - prioritize this over Vault permissions
        if (plugin.getLuckPermsIntegration().isEnabled() && 
                plugin.getConfig().getBoolean("data.track_luckperms", true)) {
            try {
                Map<String, String> lpGroups = plugin.getLuckPermsIntegration().getPlayerGroupsWithMeta(player);
                plugin.getLogger().info("Syncing LuckPerms groups for " + player.getName() + ": " + lpGroups);
                data.put("luckperms_groups", lpGroups);
                
                // If we have LuckPerms data, use it to override the Vault primary group
                if (!lpGroups.isEmpty()) {
                    // Try to determine the "primary" group from LuckPerms
                    // This could be more sophisticated by checking priority metadata
                    data.put("group", lpGroups.keySet().iterator().next());
                }
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to get LuckPerms data: " + e.getMessage());
            }
        }
        
        // Add Essentials data if available
        if (plugin.getEssentialsIntegration().isEnabled() && 
                plugin.getConfig().getBoolean("data.track_essentials", true)) {
            data.put("essentials", plugin.getEssentialsIntegration().getPlayerData(player));
        }
        
        // Check for plugin integrations
        collectPluginIntegrationData(player, data);
        
        // Add playtime tracking with improved accuracy
        long playtimeMinutes = calculatePlaytimeMinutes(player);
        data.put("playtime_minutes", playtimeMinutes);
        
        // Format playtime as hours for display
        int hours = (int) (playtimeMinutes / 60);
        int mins = (int) (playtimeMinutes % 60);
        data.put("playtime", hours + "h " + mins + "m");
        
        if (plugin.getConfig().getBoolean("data.debug_sync", false)) {
            System.out.println("DEBUG SYNC: Playtime calculated as " + playtimeMinutes + " minutes");
            player.sendMessage("§e[Debug] Playtime: " + hours + "h " + mins + "m");
        }
        
        // Add achievements data
        try {
            if (plugin.getConfig().getBoolean("data.track_advancements", true)) {
                Map<String, Object> advancements = collectAdvancementData(player);
                data.put("advancements", advancements.get("list"));
                data.put("achievements", advancements.get("count")); // Total count for progress bar
                data.put("achievement_percentage", advancements.get("percentage"));
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to collect advancement data: " + e.getMessage());
        }
        
        return data;
    }
    
    /**
     * Calculates a player's experience as a percentage of progress to the next level
     * This gives a smooth progression that's better for the frontend display
     * @param player The player
     * @return Experience percentage (0-100)
     */
    private int calculateExperiencePercentage(Player player) {
        try {
            int level = player.getLevel();
            int expToLevel = player.getExpToLevel();
            float exp = player.getExp();
            
            // Calculate percentage to next level
            if (expToLevel > 0) {
                return (int) (exp * 100);
            } else {
                return 0;
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error calculating experience percentage: " + e.getMessage());
            return 0;
        }
    }
    
    /**
     * Collects detailed statistics for a player
     * @param player The player
     * @return Map of statistics
     */
    private Map<String, Object> collectDetailedStatistics(Player player) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // General statistics
            // Instead of direct call for MINE_BLOCK which requires a material, calculate total blocks mined
            stats.put("blocks_mined", calculateTotalBlocksMined(player));
            stats.put("deaths", getSafeStatistic(player, org.bukkit.Statistic.DEATHS));
            stats.put("mobs_killed", getSafeStatistic(player, org.bukkit.Statistic.MOB_KILLS));
            stats.put("player_kills", getSafeStatistic(player, org.bukkit.Statistic.PLAYER_KILLS));
            stats.put("damage_dealt", getSafeStatistic(player, org.bukkit.Statistic.DAMAGE_DEALT) / 10); // Convert to hearts
            stats.put("damage_taken", getSafeStatistic(player, org.bukkit.Statistic.DAMAGE_TAKEN) / 10); // Convert to hearts
            stats.put("jumps", getSafeStatistic(player, org.bukkit.Statistic.JUMP));
            stats.put("items_crafted", calculateTotalItemsCrafted(player));
            stats.put("fish_caught", getSafeStatistic(player, org.bukkit.Statistic.FISH_CAUGHT));
            stats.put("animals_bred", getSafeStatistic(player, org.bukkit.Statistic.ANIMALS_BRED));
            stats.put("raids_won", getSafeStatistic(player, org.bukkit.Statistic.RAID_WIN));
            
            // Convert play time from ticks to minutes (20 ticks per second, 60 seconds per minute)
            long playTimeTicks = getSafeStatistic(player, org.bukkit.Statistic.PLAY_ONE_MINUTE);
            long playTimeMinutes = playTimeTicks / (20 * 60);
            stats.put("time_played", playTimeMinutes);
            
            // Combined distance traveled (blocks)
            int walkDistance = getSafeStatistic(player, org.bukkit.Statistic.WALK_ONE_CM) / 100;
            int sprintDistance = getSafeStatistic(player, org.bukkit.Statistic.SPRINT_ONE_CM) / 100;
            int flyDistance = getSafeStatistic(player, org.bukkit.Statistic.FLY_ONE_CM) / 100;
            int swimDistance = getSafeStatistic(player, org.bukkit.Statistic.SWIM_ONE_CM) / 100;
            int boatDistance = getSafeStatistic(player, org.bukkit.Statistic.BOAT_ONE_CM) / 100;
            int minecartDistance = getSafeStatistic(player, org.bukkit.Statistic.MINECART_ONE_CM) / 100;
            int horseDistance = getSafeStatistic(player, org.bukkit.Statistic.HORSE_ONE_CM) / 100;
            int elytraDistance = getSafeStatistic(player, org.bukkit.Statistic.AVIATE_ONE_CM) / 100;
            
            int totalDistance = walkDistance + sprintDistance + flyDistance + swimDistance + 
                                boatDistance + minecartDistance + horseDistance + elytraDistance;
            stats.put("distance_traveled", totalDistance);
            
            // Store individual distance types for detailed stats
            Map<String, Integer> distanceStats = new HashMap<>();
            distanceStats.put("walk", walkDistance);
            distanceStats.put("sprint", sprintDistance);
            distanceStats.put("fly", flyDistance);
            distanceStats.put("swim", swimDistance);
            distanceStats.put("boat", boatDistance);
            distanceStats.put("minecart", minecartDistance);
            distanceStats.put("horse", horseDistance);
            distanceStats.put("elytra", elytraDistance);
            stats.put("distance_breakdown", distanceStats);
            
            // Calculate efficiency/skill metrics
            if (stats.get("deaths") != null && (int)stats.get("deaths") > 0) {
                int killDeathRatio = (int)stats.get("mobs_killed") / (int)stats.get("deaths");
                stats.put("kill_death_ratio", killDeathRatio);
            } else {
                stats.put("kill_death_ratio", (int)stats.get("mobs_killed"));
            }
            
            plugin.getLogger().info("Successfully collected player statistics");
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting detailed statistics: " + e.getMessage());
            e.printStackTrace();
        }
        
        return stats;
    }
    
    /**
     * Calculates the total number of blocks mined by a player
     * by iterating through all materials
     * @param player The player
     * @return The total number of blocks mined
     */
    private int calculateTotalBlocksMined(Player player) {
        int total = 0;
        try {
            // Iterate through all material types
            for (org.bukkit.Material material : org.bukkit.Material.values()) {
                // Only count blocks, not items
                if (material.isBlock()) {
                    try {
                        total += player.getStatistic(org.bukkit.Statistic.MINE_BLOCK, material);
                    } catch (Exception e) {
                        // Skip materials that cause errors
                    }
                }
            }
            return total;
        } catch (Exception e) {
            plugin.getLogger().warning("Error calculating total blocks mined: " + e.getMessage());
            return 0;
        }
    }
    
    /**
     * Calculates the total number of items crafted by a player
     * @param player The player
     * @return The total number of items crafted
     */
    private int calculateTotalItemsCrafted(Player player) {
        int total = 0;
        try {
            // Iterate through all material types
            for (org.bukkit.Material material : org.bukkit.Material.values()) {
                try {
                    total += player.getStatistic(org.bukkit.Statistic.CRAFT_ITEM, material);
                } catch (Exception e) {
                    // Skip materials that cause errors
                }
            }
            return total;
        } catch (Exception e) {
            plugin.getLogger().warning("Error calculating total items crafted: " + e.getMessage());
            return 0;
        }
    }
    
    /**
     * Safely gets a statistic value, handling errors
     * @param player The player
     * @param statistic The statistic to get
     * @return The statistic value, or 0 if there was an error
     */
    private int getSafeStatistic(Player player, org.bukkit.Statistic statistic) {
        try {
            return player.getStatistic(statistic);
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting statistic " + statistic.name() + ": " + e.getMessage());
            return 0;
        }
    }
    
    /**
     * Collects inventory data from a player
     * @param player The player
     * @return Map of inventory data
     */
    /**
     * Collects enhanced inventory data from a player with more details for the dashboard
     * @param player The player
     * @return Map of detailed inventory data
     */
    private Map<String, Object> collectEnhancedInventoryData(Player player) {
        Map<String, Object> inventoryData = new HashMap<>();
        
        try {
            org.bukkit.inventory.PlayerInventory inventory = player.getInventory();
            
            // Get main hand item with enhanced details for animations
            org.bukkit.inventory.ItemStack mainHand = inventory.getItemInMainHand();
            if (mainHand != null && mainHand.getType() != org.bukkit.Material.AIR) {
                Map<String, Object> mainHandData = new HashMap<>();
                mainHandData.put("type", mainHand.getType().toString());
                mainHandData.put("material_key", mainHand.getType().getKey().toString());
                mainHandData.put("amount", mainHand.getAmount());
                mainHandData.put("name", mainHand.hasItemMeta() && mainHand.getItemMeta().hasDisplayName() ? 
                                mainHand.getItemMeta().getDisplayName() : mainHand.getType().toString());
                
                // Add enchantment details
                if (mainHand.hasItemMeta() && mainHand.getItemMeta().hasEnchants()) {
                    Map<String, Integer> enchants = new HashMap<>();
                    mainHand.getEnchantments().forEach((enchant, level) -> {
                        enchants.put(enchant.getKey().toString(), level);
                    });
                    mainHandData.put("enchantments", enchants);
                    mainHandData.put("glowing", true);
                }
                
                // Add durability if applicable
                if (mainHand.getType().getMaxDurability() > 0) {
                    mainHandData.put("durability_max", mainHand.getType().getMaxDurability());
                    mainHandData.put("durability", mainHand.getType().getMaxDurability() - mainHand.getDurability());
                    double durabilityPercent = (double)(mainHand.getType().getMaxDurability() - mainHand.getDurability()) / mainHand.getType().getMaxDurability() * 100;
                    mainHandData.put("durability_percent", durabilityPercent);
                }
                
                inventoryData.put("main_hand", mainHandData);
            }
            
            // Get off hand item
            org.bukkit.inventory.ItemStack offHand = inventory.getItemInOffHand();
            if (offHand != null && offHand.getType() != org.bukkit.Material.AIR) {
                Map<String, Object> offHandData = new HashMap<>();
                offHandData.put("type", offHand.getType().toString());
                offHandData.put("material_key", offHand.getType().getKey().toString());
                offHandData.put("amount", offHand.getAmount());
                offHandData.put("name", offHand.hasItemMeta() && offHand.getItemMeta().hasDisplayName() ? 
                              offHand.getItemMeta().getDisplayName() : offHand.getType().toString());
                
                if (offHand.hasItemMeta() && offHand.getItemMeta().hasEnchants()) {
                    Map<String, Integer> enchants = new HashMap<>();
                    offHand.getEnchantments().forEach((enchant, level) -> {
                        enchants.put(enchant.getKey().toString(), level);
                    });
                    offHandData.put("enchantments", enchants);
                    offHandData.put("glowing", true);
                }
                
                inventoryData.put("off_hand", offHandData);
            }
            
            // Get armor contents with enhanced details
            Map<String, Object> armorData = new HashMap<>();
            org.bukkit.inventory.ItemStack[] armorContents = inventory.getArmorContents();
            
            String[] armorSlots = {"boots", "leggings", "chestplate", "helmet"};
            
            if (armorContents != null) {
                for (int i = 0; i < armorContents.length && i < armorSlots.length; i++) {
                    if (armorContents[i] != null && armorContents[i].getType() != org.bukkit.Material.AIR) {
                        Map<String, Object> armorPiece = new HashMap<>();
                        armorPiece.put("type", armorContents[i].getType().toString());
                        armorPiece.put("material_key", armorContents[i].getType().getKey().toString());
                        
                        // Add enchantment details
                        if (armorContents[i].hasItemMeta() && armorContents[i].getItemMeta().hasEnchants()) {
                            Map<String, Integer> enchants = new HashMap<>();
                            armorContents[i].getEnchantments().forEach((enchant, level) -> {
                                enchants.put(enchant.getKey().toString(), level);
                            });
                            armorPiece.put("enchantments", enchants);
                            armorPiece.put("glowing", true);
                        }
                        
                        // Add durability if applicable
                        if (armorContents[i].getType().getMaxDurability() > 0) {
                            armorPiece.put("durability_max", armorContents[i].getType().getMaxDurability());
                            armorPiece.put("durability", armorContents[i].getType().getMaxDurability() - 
                                           armorContents[i].getDurability());
                            double durabilityPercent = (double)(armorContents[i].getType().getMaxDurability() - 
                                                      armorContents[i].getDurability()) / 
                                                      armorContents[i].getType().getMaxDurability() * 100;
                            armorPiece.put("durability_percent", durabilityPercent);
                        }
                        
                        armorData.put(armorSlots[i], armorPiece);
                    }
                }
            }
            inventoryData.put("armor", armorData);
            
            // Get all inventory slots for visualization
            List<Map<String, Object>> hotbar = new ArrayList<>();
            List<Map<String, Object>> mainInventory = new ArrayList<>();
            
            for (int i = 0; i < 9; i++) {
                org.bukkit.inventory.ItemStack item = inventory.getItem(i);
                Map<String, Object> slotData = new HashMap<>();
                slotData.put("slot", i);
                
                if (item != null && item.getType() != org.bukkit.Material.AIR) {
                    slotData.put("type", item.getType().toString());
                    slotData.put("material_key", item.getType().getKey().toString());
                    slotData.put("amount", item.getAmount());
                    slotData.put("empty", false);
                    
                    if (item.hasItemMeta() && item.getItemMeta().hasEnchants()) {
                        slotData.put("glowing", true);
                    }
                } else {
                    slotData.put("empty", true);
                }
                
                hotbar.add(slotData);
            }
            
            for (int i = 9; i < 36; i++) {
                org.bukkit.inventory.ItemStack item = inventory.getItem(i);
                Map<String, Object> slotData = new HashMap<>();
                slotData.put("slot", i);
                
                if (item != null && item.getType() != org.bukkit.Material.AIR) {
                    slotData.put("type", item.getType().toString());
                    slotData.put("material_key", item.getType().getKey().toString());
                    slotData.put("amount", item.getAmount());
                    slotData.put("empty", false);
                    
                    if (item.hasItemMeta() && item.getItemMeta().hasEnchants()) {
                        slotData.put("glowing", true);
                    }
                } else {
                    slotData.put("empty", true);
                }
                
                mainInventory.add(slotData);
            }
            
            inventoryData.put("hotbar", hotbar);
            inventoryData.put("main_inventory", mainInventory);
            
            // Get valuable items count (diamond, netherite, etc.)
            int diamondCount = 0;
            int netheriteCount = 0;
            int emeraldCount = 0;
            int goldCount = 0;
            int ironCount = 0;
            int redstoneCount = 0;
            int lapisCount = 0;
            int coalCount = 0;
            int enchantedItemCount = 0;
            int foodItemCount = 0;
            int toolCount = 0;
            int weaponCount = 0;
            int totalItems = 0;
            
            for (org.bukkit.inventory.ItemStack item : inventory.getContents()) {
                if (item != null && item.getType() != org.bukkit.Material.AIR) {
                    totalItems += item.getAmount();
                    String materialName = item.getType().toString();
                    
                    // Count valuables
                    if (materialName.contains("DIAMOND")) {
                        diamondCount += item.getAmount();
                    } else if (materialName.contains("NETHERITE")) {
                        netheriteCount += item.getAmount();
                    } else if (materialName.contains("EMERALD")) {
                        emeraldCount += item.getAmount();
                    } else if (materialName.contains("GOLD")) {
                        goldCount += item.getAmount();
                    } else if (materialName.contains("IRON")) {
                        ironCount += item.getAmount();
                    } else if (materialName.contains("REDSTONE")) {
                        redstoneCount += item.getAmount();
                    } else if (materialName.contains("LAPIS")) {
                        lapisCount += item.getAmount();
                    } else if (materialName.contains("COAL")) {
                        coalCount += item.getAmount();
                    }
                    
                    // Count item types
                    if (item.hasItemMeta() && item.getItemMeta().hasEnchants()) {
                        enchantedItemCount++;
                    }
                    
                    // Count tools, weapons and food
                    if (materialName.contains("PICKAXE") || materialName.contains("AXE") || 
                        materialName.contains("SHOVEL") || materialName.contains("HOE")) {
                        toolCount++;
                    } else if (materialName.contains("SWORD") || materialName.contains("BOW") || 
                               materialName.contains("TRIDENT") || materialName.contains("CROSSBOW")) {
                        weaponCount++;
                    } else if (item.getType().isEdible()) {
                        foodItemCount += item.getAmount();
                    }
                }
            }
            
            Map<String, Integer> valuables = new HashMap<>();
            valuables.put("diamond", diamondCount);
            valuables.put("netherite", netheriteCount);
            valuables.put("emerald", emeraldCount);
            valuables.put("gold", goldCount);
            valuables.put("iron", ironCount);
            valuables.put("redstone", redstoneCount);
            valuables.put("lapis", lapisCount);
            valuables.put("coal", coalCount);
            valuables.put("enchanted_items", enchantedItemCount);
            valuables.put("tools", toolCount);
            valuables.put("weapons", weaponCount);
            valuables.put("food", foodItemCount);
            valuables.put("total_items", totalItems);
            
            inventoryData.put("valuables", valuables);
            
            // Calculate estimated value in emeralds for dashboard display
            int emeraldValue = diamondCount * 8 + netheriteCount * 16 + emeraldCount + 
                              goldCount / 2 + ironCount / 8 + enchantedItemCount * 3;
            inventoryData.put("estimated_value", emeraldValue);
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting enhanced inventory data: " + e.getMessage());
        }
        
        return inventoryData;
    }
    
    /**
     * Original inventory data collection method kept for compatibility
     * @param player The player
     * @return Map of inventory data
     */
    private Map<String, Object> collectInventoryData(Player player) {
        // Call the enhanced version now
        return collectEnhancedInventoryData(player);
    }
    
    /**
     * Collects advancement data from a player
     * @param player The player
     * @return Map containing advancements list and count
     */
    private Map<String, Object> collectAdvancementData(Player player) {
        Map<String, Object> advancementData = new HashMap<>();
        List<String> completedAdvancements = new ArrayList<>();
        int count = 0;
        int total = 0;
        
        try {
            // Get advancement iterator and convert to proper iterable format
            Iterator<org.bukkit.advancement.Advancement> advIterator = Bukkit.getServer().advancementIterator();
            while (advIterator.hasNext()) {
                org.bukkit.advancement.Advancement advancement = advIterator.next();
                total++;
                String key = advancement.getKey().toString();
                org.bukkit.advancement.AdvancementProgress progress = player.getAdvancementProgress(advancement);
                
                // Only include completed advancements
                if (progress.isDone()) {
                    completedAdvancements.add(key);
                    count++;
                }
            }
            
            // Calculate percentage
            double percentage = total > 0 ? (count * 100.0 / total) : 0;
            
            advancementData.put("list", completedAdvancements);
            advancementData.put("count", count);
            advancementData.put("total", total);
            advancementData.put("percentage", (int)percentage);
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting advancement data: " + e.getMessage());
        }
        
        return advancementData;
    }
    
    /**
     * Calculate playtime minutes for a player using a more accurate method
     * @param player The player
     * @return Playtime in minutes
     */
    private long calculatePlaytimeMinutes(Player player) {
        try {
            // Try to get playtime from statistics first
            long playTimeTicks = 0;
            try {
                playTimeTicks = player.getStatistic(org.bukkit.Statistic.PLAY_ONE_MINUTE);
            } catch (Exception e) {
                // Use a fallback value if statistics aren't available
                return 60; // Default 60 minutes
            }
            
            // Convert ticks to minutes (20 ticks per second, 60 seconds per minute)
            return playTimeTicks / (20 * 60);
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error calculating playtime: " + e.getMessage());
            return 60; // Default fallback
        }
    }
    
    /**
     * Collects data from other plugins if they're available
     * @param player The player
     * @param data The data map to add to
     */
    private void collectPluginIntegrationData(Player player, Map<String, Object> data) {
        // Check for common plugins and add their data
        
        // Example: McMMO integration
        if (Bukkit.getPluginManager().getPlugin("mcMMO") != null && 
                plugin.getConfig().getBoolean("integrations.mcmmo", true)) {
            try {
                data.put("mcmmo_data", collectMcMMOData(player));
            } catch (Exception e) {
                plugin.getLogger().warning("Error collecting McMMO data: " + e.getMessage());
            }
        }
        
        // Example: Jobs integration
        if (Bukkit.getPluginManager().getPlugin("Jobs") != null && 
                plugin.getConfig().getBoolean("integrations.jobs", true)) {
            try {
                data.put("jobs_data", collectJobsData(player));
            } catch (Exception e) {
                plugin.getLogger().warning("Error collecting Jobs data: " + e.getMessage());
            }
        }
        
        // Example: Towny integration
        if (Bukkit.getPluginManager().getPlugin("Towny") != null && 
                plugin.getConfig().getBoolean("integrations.towny", true)) {
            try {
                data.put("towny_data", collectTownyData(player));
            } catch (Exception e) {
                plugin.getLogger().warning("Error collecting Towny data: " + e.getMessage());
            }
        }
        
        // Example: PlaceholderAPI for even more data
        if (Bukkit.getPluginManager().getPlugin("PlaceholderAPI") != null && 
                plugin.getConfig().getBoolean("integrations.placeholderapi", true)) {
            try {
                data.put("placeholders", collectPlaceholderData(player));
            } catch (Exception e) {
                plugin.getLogger().warning("Error collecting PlaceholderAPI data: " + e.getMessage());
            }
        }
    }
    
    /**
     * Collects McMMO data if available
     * @param player The player
     * @return Map of McMMO data or empty map if unavailable
     */
    private Map<String, Object> collectMcMMOData(Player player) {
        Map<String, Object> mcmmoData = new HashMap<>();
        
        // Log that we're trying to collect mcMMO data
        // Check if debug mode is enabled
        boolean debugMode = plugin.getConfig().getBoolean("mcmmo.debug", false);
        
        if (debugMode) {
            plugin.getLogger().info("Attempting to collect mcMMO data for " + player.getName());
        }
        
        // First check if mcMMO is even loaded
        if (Bukkit.getPluginManager().getPlugin("mcMMO") == null) {
            if (debugMode) {
                plugin.getLogger().fine("mcMMO plugin is not loaded or not found");
            }
            return mcmmoData; // Return empty map if mcMMO isn't installed
        }
        
        // We'll try multiple approaches to handle different mcMMO versions
        try {
            // Simplified direct access approach - less brittle and works with most versions
            if (debugMode) {
                plugin.getLogger().fine("Trying simplified mcMMO data collection approach");
            }
            
            // First try the most reliable modern API - directly invoke static methods from ExperienceAPI
            try {
                Class<?> experienceAPIClass = Class.forName("com.gmail.nossr50.api.ExperienceAPI");
                if (debugMode) {
                    plugin.getLogger().fine("Found ExperienceAPI class");
                }
                
                // Get the power level
                Method powerLevelMethod = experienceAPIClass.getMethod("getPowerLevel", Player.class);
                int powerLevel = (int) powerLevelMethod.invoke(null, player);
                mcmmoData.put("power_level", powerLevel);
                if (debugMode) {
                    plugin.getLogger().fine("Got power level: " + powerLevel);
                }
                
                // Predefined list of skill names that are common across mcMMO versions
                String[] commonSkills = {
                    "mining", "woodcutting", "herbalism", "excavation", "fishing", 
                    "repair", "unarmed", "archery", "swords", "axes", "acrobatics",
                    "taming", "alchemy"
                };
                
                // Try to get skill levels for common skills
                Map<String, Integer> skillLevels = new HashMap<>();
                Method getLevelMethod = experienceAPIClass.getMethod("getLevel", Player.class, String.class);
                
                for (String skill : commonSkills) {
                    try {
                        int level = (int) getLevelMethod.invoke(null, player, skill);
                        skillLevels.put(skill, level);
                        // Only log in debug mode
                        if (debugMode) {
                            plugin.getLogger().fine("Got skill level for " + skill + ": " + level);
                        }
                    } catch (Exception e) {
                        if (debugMode) {
                            plugin.getLogger().fine("Skill " + skill + " might not exist in this mcMMO version: " + e.getMessage());
                        }
                    }
                }
                
                // If we have skill data, add it
                if (!skillLevels.isEmpty()) {
                    mcmmoData.put("skills", skillLevels);
                    if (debugMode) {
                        plugin.getLogger().fine("Successfully collected skill levels for " + skillLevels.size() + " skills");
                    }
                    
                    // This is our most reliable approach - if it succeeds, return the data
                    return mcmmoData;
                }
            } catch (ClassNotFoundException e) {
                plugin.getLogger().warning("ExperienceAPI class not found: " + e.getMessage());
            } catch (Exception e) {
                plugin.getLogger().warning("Error using ExperienceAPI: " + e.getMessage());
            }
            
            // First alternative approach - try using PrimarySkillType enum (newer mcMMO)
            try {
                plugin.getLogger().info("Trying newer mcMMO API with PrimarySkillType");
                
                // Check if we have the newer API classes
                Class<?> skillTypeClass = Class.forName("com.gmail.nossr50.datatypes.skills.PrimarySkillType");
                Class<?> experienceAPIClass = Class.forName("com.gmail.nossr50.api.ExperienceAPI");
                
                // Get all skill types using the enum values
                Object[] skillTypes = skillTypeClass.getEnumConstants();
                plugin.getLogger().info("Found " + skillTypes.length + " skill types in PrimarySkillType enum");
                
                // Get power level 
                Method powerLevelMethod = experienceAPIClass.getMethod("getPowerLevel", Player.class);
                int powerLevel = (int) powerLevelMethod.invoke(null, player);
                mcmmoData.put("power_level", powerLevel);
                plugin.getLogger().info("Got power level: " + powerLevel);
                
                // Get skill levels
                Map<String, Integer> skillLevels = new HashMap<>();
                
                // See if we can use the version of getLevel that takes PrimarySkillType
                try {
                    Method getLevelMethod = experienceAPIClass.getMethod("getLevel", Player.class, skillTypeClass);
                    
                    for (Object skillType : skillTypes) {
                        try {
                            String skillName = skillType.toString();
                            int level = (int) getLevelMethod.invoke(null, player, skillType);
                            skillLevels.put(skillName.toLowerCase(), level);
                            plugin.getLogger().info("Got skill level for " + skillName + ": " + level);
                        } catch (Exception e) {
                            plugin.getLogger().fine("Failed to get level for skill " + skillType + ": " + e.getMessage());
                        }
                    }
                } catch (NoSuchMethodException e) {
                    plugin.getLogger().warning("getLevel method not found with PrimarySkillType parameter: " + e.getMessage());
                }
                
                // Add skill levels if we found any
                if (!skillLevels.isEmpty()) {
                    mcmmoData.put("skills", skillLevels);
                    plugin.getLogger().info("Successfully collected skill levels for " + skillLevels.size() + " skills");
                    return mcmmoData;
                }
            } catch (ClassNotFoundException e) {
                plugin.getLogger().info("PrimarySkillType not found, might be older mcMMO version: " + e.getMessage());
            } catch (Exception e) {
                plugin.getLogger().warning("Error trying newer mcMMO API: " + e.getMessage());
            }
            
            // Last resort approach - try the older mcMMO API structure
            try {
                plugin.getLogger().info("Trying oldest mcMMO API approach");
                
                Class<?> mcMMOPlayerClass = Class.forName("com.gmail.nossr50.datatypes.player.McMMOPlayer");
                Class<?> mcMMOClass = Class.forName("com.gmail.nossr50.mcMMO");
                
                Object mcMMOInstance = mcMMOClass.getMethod("p").invoke(null);
                Object playerManager = mcMMOClass.getMethod("getPlayerManager").invoke(mcMMOInstance);
                Object mcMMOPlayer = playerManager.getClass().getMethod("getPlayer", String.class).invoke(playerManager, player.getName());
                
                if (mcMMOPlayer != null) {
                    plugin.getLogger().info("Found mcMMOPlayer using older API");
                    
                    // Get power level
                    int powerLevel = (int) mcMMOPlayerClass.getMethod("getPowerLevel").invoke(mcMMOPlayer);
                    mcmmoData.put("power_level", powerLevel);
                    plugin.getLogger().info("Power level: " + powerLevel);
                    
                    // Get skill levels
                    String[] skills = {"MINING", "WOODCUTTING", "HERBALISM", "EXCAVATION", "FISHING", 
                                       "REPAIR", "UNARMED", "ARCHERY", "SWORDS", "AXES", "ACROBATICS",
                                       "TAMING", "ALCHEMY"};
                    
                    Map<String, Integer> skillLevels = new HashMap<>();
                    for (String skill : skills) {
                        try {
                            // Try different methods to get skill level
                            try {
                                // First try the direct getSkillLevel method
                                int level = (int) mcMMOPlayerClass.getMethod("getSkillLevel", String.class).invoke(mcMMOPlayer, skill);
                                skillLevels.put(skill.toLowerCase(), level);
                                plugin.getLogger().info("Got skill level for " + skill + ": " + level);
                            } catch (Exception e) {
                                // If that fails, try to get the skill object and then its level
                                Object skillObj = mcMMOPlayerClass.getMethod("getSkill", String.class).invoke(mcMMOPlayer, skill);
                                if (skillObj != null) {
                                    int level = (int) skillObj.getClass().getMethod("getLevel").invoke(skillObj);
                                    skillLevels.put(skill.toLowerCase(), level);
                                    plugin.getLogger().info("Got skill level via skill object for " + skill + ": " + level);
                                }
                            }
                        } catch (Exception e) {
                            plugin.getLogger().fine("Failed to get skill " + skill + ": " + e.getMessage());
                        }
                    }
                    
                    // Add skill levels if we found any
                    if (!skillLevels.isEmpty()) {
                        mcmmoData.put("skills", skillLevels);
                        plugin.getLogger().info("Successfully collected skill levels for " + skillLevels.size() + " skills");
                    }
                }
            } catch (Exception e) {
                plugin.getLogger().warning("Error trying older mcMMO API: " + e.getMessage());
            }
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting McMMO data: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Add a status message for debugging
        if (mcmmoData.isEmpty()) {
            mcmmoData.put("error", "Failed to collect mcMMO data despite mcMMO being installed");
            if (debugMode) {
                plugin.getLogger().fine("Failed to collect any mcMMO data despite mcMMO being installed");
            }
        } else {
            mcmmoData.put("status", "success");
        }
        
        if (debugMode) {
            plugin.getLogger().fine("Final mcMMO data: " + mcmmoData);
        }
        return mcmmoData;
    }
    
    /**
     * Collects Jobs data if available
     * @param player The player
     * @return Map of Jobs data or empty map if unavailable
     */
    private Map<String, Object> collectJobsData(Player player) {
        Map<String, Object> jobsData = new HashMap<>();
        
        // Simplified Jobs integration
        try {
            Class<?> jobsClass = Class.forName("com.gamingmesh.jobs.Jobs");
            Class<?> jobsPlayerClass = Class.forName("com.gamingmesh.jobs.container.JobsPlayer");
            
            Object jobsPlayer = jobsClass.getMethod("getPlayerManager").invoke(null).getClass()
                    .getMethod("getJobsPlayer", UUID.class).invoke(jobsClass.getMethod("getPlayerManager").invoke(null), player.getUniqueId());
            
            if (jobsPlayer != null) {
                double money = (double) jobsPlayerClass.getMethod("getTotalPoints").invoke(jobsPlayer);
                jobsData.put("points", money);
                
                // Try to get jobs list
                List<Map<String, Object>> jobsList = new ArrayList<>();
                Object jobs = jobsPlayerClass.getMethod("getJobProgression").invoke(jobsPlayer);
                
                if (jobs instanceof List) {
                    for (Object job : (List<?>) jobs) {
                        Map<String, Object> jobInfo = new HashMap<>();
                        jobInfo.put("name", job.getClass().getMethod("getJob").invoke(job).getClass().getMethod("getName").invoke(job.getClass().getMethod("getJob").invoke(job)));
                        jobInfo.put("level", job.getClass().getMethod("getLevel").invoke(job));
                        jobInfo.put("exp", job.getClass().getMethod("getExperience").invoke(job));
                        jobsList.add(jobInfo);
                    }
                }
                jobsData.put("jobs", jobsList);
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting Jobs data: " + e.getMessage());
        }
        
        return jobsData;
    }
    
    /**
     * Collects Towny data if available
     * @param player The player
     * @return Map of Towny data or empty map if unavailable
     */
    private Map<String, Object> collectTownyData(Player player) {
        Map<String, Object> townyData = new HashMap<>();
        
        try {
            Class<?> townyClass = Class.forName("com.palmergames.bukkit.towny.TownyUniverse");
            Object townyUniverse = townyClass.getMethod("getInstance").invoke(null);
            Object resident = townyUniverse.getClass().getMethod("getResident", String.class).invoke(townyUniverse, player.getName());
            
            if (resident != null) {
                // Get resident info
                townyData.put("name", resident.getClass().getMethod("getName").invoke(resident));
                
                // Check if resident has a town
                boolean hasTown = (boolean) resident.getClass().getMethod("hasTown").invoke(resident);
                townyData.put("has_town", hasTown);
                
                if (hasTown) {
                    Object town = resident.getClass().getMethod("getTown").invoke(resident);
                    townyData.put("town_name", town.getClass().getMethod("getName").invoke(town));
                    
                    // Check if town has a nation
                    boolean hasNation = (boolean) town.getClass().getMethod("hasNation").invoke(town);
                    townyData.put("has_nation", hasNation);
                    
                    if (hasNation) {
                        Object nation = town.getClass().getMethod("getNation").invoke(town);
                        townyData.put("nation_name", nation.getClass().getMethod("getName").invoke(nation));
                    }
                }
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting Towny data: " + e.getMessage());
        }
        
        return townyData;
    }
    
    /**
     * Collects PlaceholderAPI data if available
     * @param player The player
     * @return Map of placeholder data
     */
    private Map<String, Object> collectPlaceholderData(Player player) {
        Map<String, Object> placeholderData = new HashMap<>();
        
        try {
            Class<?> papiClass = Class.forName("me.clip.placeholderapi.PlaceholderAPI");
            
            // Define placeholders to collect
            String[] placeholders = {
                "%player_name%",
                "%player_displayname%",
                "%player_health%",
                "%player_health_rounded%",
                "%player_food_level%",
                "%player_gamemode%",
                "%player_world%",
                "%player_ping%",
                "%server_uptime%",
                "%server_tps%",
                "%server_online%",
                "%server_max_players%"
            };
            
            // Add more specific placeholders based on installed plugins
            if (Bukkit.getPluginManager().getPlugin("EssentialsX") != null) {
                String[] essentialsPlaceholders = {
                    "%essentials_balance%",
                    "%essentials_nickname%",
                    "%essentials_afk%",
                    "%essentials_kit_last_use_kit1%",
                    "%essentials_home_count%"
                };
                placeholders = concat(placeholders, essentialsPlaceholders);
            }
            
            // Add more for other plugins
            // [Additional placeholders would be added here]
            
            // Collect all placeholder values
            for (String placeholder : placeholders) {
                try {
                    String value = (String) papiClass.getMethod("setPlaceholders", org.bukkit.entity.Player.class, String.class)
                            .invoke(null, player, placeholder);
                    
                    if (value != null && !value.equals(placeholder)) {
                        // Remove the % symbols and use as key
                        String key = placeholder.replace("%", "");
                        placeholderData.put(key, value);
                    }
                } catch (Exception e) {
                    // Skip this placeholder if it causes an error
                }
            }
            
        } catch (Exception e) {
            plugin.getLogger().warning("Error collecting PlaceholderAPI data: " + e.getMessage());
        }
        
        return placeholderData;
    }
    
    /**
     * Utility method to concatenate two string arrays
     * @param first First array
     * @param second Second array
     * @return Combined array
     */
    private String[] concat(String[] first, String[] second) {
        String[] result = new String[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, 0, second.length);
        return result;
    }
    
    /**
     * Converts a yaw value to a cardinal direction
     * @param yaw Player's yaw value
     * @return Cardinal direction (N, NE, E, SE, S, SW, W, NW)
     */
    private String getCardinalDirection(float yaw) {
        // Convert to positive degrees
        yaw = (yaw % 360 + 360) % 360;
        
        // Return cardinal direction
        if (yaw >= 337.5 || yaw < 22.5) {
            return "S";
        } else if (yaw >= 22.5 && yaw < 67.5) {
            return "SW";
        } else if (yaw >= 67.5 && yaw < 112.5) {
            return "W";
        } else if (yaw >= 112.5 && yaw < 157.5) {
            return "NW";
        } else if (yaw >= 157.5 && yaw < 202.5) {
            return "N";
        } else if (yaw >= 202.5 && yaw < 247.5) {
            return "NE";
        } else if (yaw >= 247.5 && yaw < 292.5) {
            return "E";
        } else {
            return "SE";
        }
    }
    
    /**
     * Gets the dimension type for the given world
     * @param world The world to get the dimension for
     * @return The dimension type (OVERWORLD, NETHER, THE_END, CUSTOM)
     */
    private String getDimensionType(org.bukkit.World world) {
        if (world == null) {
            return "UNKNOWN";
        }
        
        org.bukkit.World.Environment environment = world.getEnvironment();
        
        switch (environment) {
            case NORMAL:
                return "OVERWORLD";
            case NETHER:
                return "NETHER";
            case THE_END:
                return "THE_END";
            default:
                return "CUSTOM";
        }
    }
    
    /**
     * Generates a unique change ID for any object to help the dashboard detect changes
     * @param object The object to generate a change ID for
     * @return A string hash ID that changes when the object changes
     */
    private String generateChangeId(Object object) {
        if (object == null) {
            return "null";
        }
        
        // For inventory, create a simple hash of the main contents
        if (object instanceof org.bukkit.inventory.PlayerInventory) {
            org.bukkit.inventory.PlayerInventory inventory = (org.bukkit.inventory.PlayerInventory) object;
            StringBuilder sb = new StringBuilder();
            
            // Add main items to the hash
            for (org.bukkit.inventory.ItemStack item : inventory.getContents()) {
                if (item != null && item.getType() != org.bukkit.Material.AIR) {
                    sb.append(item.getType().toString())
                      .append(":")
                      .append(item.getAmount())
                      .append("|");
                }
            }
            
            // Add armor to the hash
            for (org.bukkit.inventory.ItemStack item : inventory.getArmorContents()) {
                if (item != null && item.getType() != org.bukkit.Material.AIR) {
                    sb.append(item.getType().toString())
                      .append(":")
                      .append(item.getAmount())
                      .append("|");
                }
            }
            
            return String.valueOf(sb.toString().hashCode());
        }
        
        // For location, create a hash of the coords
        if (object instanceof org.bukkit.Location) {
            org.bukkit.Location loc = (org.bukkit.Location) object;
            String locString = loc.getWorld().getName() + ":" + 
                               (int)loc.getX() + ":" + 
                               (int)loc.getY() + ":" + 
                               (int)loc.getZ();
            return String.valueOf(locString.hashCode());
        }
        
        // For anything else, just use its hash code
        return String.valueOf(object.hashCode());
    }
    
    /**
     * Syncs player data to the website
     * Optimized for speed and reliability
     * @param player The player to sync data for
     * @return true if successful
     */
    public boolean syncPlayerData(Player player) {
        // Check if we should show detailed debug messages
        boolean debugSync = plugin.getConfig().getBoolean("data.debug_sync", false);
        
        // Use shorter connection timeouts for faster response
        int connectTimeout = plugin.getConfig().getInt("api.connect_timeout", 3000); // 3 seconds default
        int readTimeout = plugin.getConfig().getInt("api.read_timeout", 5000);       // 5 seconds default
        
        // Check if player is linked
        if (!plugin.getConfigManager().isPlayerLinked(player.getUniqueId())) {
            if (debugSync) {
                plugin.getLogger().info("Player " + player.getName() + " is not linked, aborting sync");
            }
            return false;
        }
        
        try {
            // Collect player data - this is the most time-consuming part
            long startTime = System.currentTimeMillis();
            Map<String, Object> playerData = collectPlayerData(player);
            long dataCollectionTime = System.currentTimeMillis() - startTime;
            
            if (debugSync) {
                plugin.getLogger().info("Collected data for " + player.getName() + " in " + dataCollectionTime + "ms");
            }
            
            // Ensure groups is properly formatted
            Object groups = playerData.get("groups");
            if (groups != null && groups.getClass().isArray()) {
                // Convert array to List
                String[] groupsArray = (String[]) groups;
                List<String> groupsList = new ArrayList<>(Arrays.asList(groupsArray));
                playerData.put("groups", groupsList);
            }
            
            // Convert to JSON - use the built-in JSON converter
            JSONObject jsonData = new JSONObject(playerData);
            String jsonString = jsonData.toJSONString();
            
            // Format API URL correctly
            String apiUrl = plugin.getApiUrl();
            String endpoint = plugin.getPlayerUpdateEndpoint();
            
            String fullUrl;
            if (apiUrl.endsWith("/") && endpoint.startsWith("/")) {
                fullUrl = apiUrl + endpoint.substring(1);
            } else if (!apiUrl.endsWith("/") && !endpoint.startsWith("/")) {
                fullUrl = apiUrl + "/" + endpoint;
            } else {
                fullUrl = apiUrl + endpoint;
            }
            
            if (debugSync) {
                plugin.getLogger().info("Sending data to: " + fullUrl);
            }
            
            // Create connection with shorter timeouts
            long connectionStartTime = System.currentTimeMillis();
            URL url = new URL(fullUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin/1.0");
            conn.setRequestProperty("X-API-KEY", plugin.getConfig().getString("api.key", ""));
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(connectTimeout); 
            conn.setReadTimeout(readTimeout);
            conn.setDoOutput(true);
            
            // Set cache control to force fresh data
            conn.setUseCaches(false);
            conn.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate");
            conn.setRequestProperty("Pragma", "no-cache");
            
            // Send JSON data
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonString.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Read response code - we really just need the response code, not the full content
            int responseCode = conn.getResponseCode();
            long apiCallTime = System.currentTimeMillis() - connectionStartTime;
            
            if (debugSync) {
                plugin.getLogger().info("API response code: " + responseCode + " (took " + apiCallTime + "ms)");
                
                // Read the full response content only in debug mode
                StringBuilder responseContent = new StringBuilder();
                BufferedReader br = null;
                try {
                    // First try the input stream
                    try {
                        br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    } catch (Exception e) {
                        // If that fails, try the error stream
                        br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                    }
                    
                    if (br != null) {
                        String responseLine;
                        while ((responseLine = br.readLine()) != null) {
                            responseContent.append(responseLine.trim());
                        }
                        br.close();
                    }
                    
                    plugin.getLogger().info("API response: " + responseContent.toString());
                } catch (Exception e) {
                    plugin.getLogger().warning("Error reading API response: " + e.getMessage());
                }
            }
            
            // Check if the sync was successful based on response code
            boolean success = responseCode >= 200 && responseCode < 300;
            
            if (success) {
                if (debugSync) {
                    long totalTime = System.currentTimeMillis() - startTime;
                    plugin.getLogger().info("Successfully synced player data for " + player.getName() + 
                                           " in " + totalTime + "ms (Collection: " + dataCollectionTime + 
                                           "ms, API: " + apiCallTime + "ms)");
                }
            } else {
                plugin.getLogger().warning("Error syncing player data for " + player.getName() +
                                          ": Response code " + responseCode);
            }
            
            return success;
        } catch (Exception e) {
            plugin.getLogger().warning("Exception syncing player data for " + player.getName() + ": " + e.getMessage());
            
            if (debugSync) {
                e.printStackTrace();
            }
            return false;
        }
    }
    
    /**
     * Gets player data from the website
     * @param uuid The player UUID
     * @return JSONObject with player data or null if error
     */
    public JSONObject getPlayerDataFromWebsite(UUID uuid) {
        try {
            // Build API URL
            String apiUrl = plugin.getApiUrl();
            String endpoint = plugin.getPlayerDataEndpoint().replace("%uuid%", uuid.toString());
            
            // Handle URL formatting
            boolean urlHasTrailingSlash = apiUrl.endsWith("/");
            boolean endpointHasLeadingSlash = endpoint.startsWith("/");
            
            String fullUrl;
            if (urlHasTrailingSlash && endpointHasLeadingSlash) {
                fullUrl = apiUrl + endpoint.substring(1);
            } else if (!urlHasTrailingSlash && !endpointHasLeadingSlash) {
                fullUrl = apiUrl + "/" + endpoint;
            } else {
                fullUrl = apiUrl + endpoint;
            }
            
            if (plugin.getConfig().getBoolean("api.debug", false)) {
                plugin.getLogger().info("Getting player data for " + uuid + " from " + fullUrl);
            }
            
            // Create connection
            URL url = new URL(fullUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
            
            // Read response
            int responseCode = conn.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 300) {
                // Read response content
                StringBuilder responseContent = new StringBuilder();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        responseContent.append(responseLine.trim());
                    }
                }
                
                // Parse JSON response
                return (JSONObject) jsonParser.parse(responseContent.toString());
            } else {
                plugin.getLogger().warning("Error getting player data for " + uuid +
                        ": " + responseCode);
                return null;
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting player data for " + uuid + ": " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Gets a player's website data by username
     * @param username The player username
     * @return JSONObject with player data or null if error
     */
    public JSONObject getPlayerDataFromWebsiteByUsername(String username) {
        try {
            // Build API URL - use a different endpoint for username lookups
            String apiUrl = plugin.getApiUrl();
            String endpoint = "/api/player/name/" + username; // Adjust this to match your API
            
            // Handle URL formatting
            boolean urlHasTrailingSlash = apiUrl.endsWith("/");
            boolean endpointHasLeadingSlash = endpoint.startsWith("/");
            
            String fullUrl;
            if (urlHasTrailingSlash && endpointHasLeadingSlash) {
                fullUrl = apiUrl + endpoint.substring(1);
            } else if (!urlHasTrailingSlash && !endpointHasLeadingSlash) {
                fullUrl = apiUrl + "/" + endpoint;
            } else {
                fullUrl = apiUrl + endpoint;
            }
            
            if (plugin.getConfig().getBoolean("api.debug", false)) {
                plugin.getLogger().info("Getting player data for " + username + " from " + fullUrl);
            }
            
            // Create connection
            URL url = new URL(fullUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "BizzyLink-Plugin");
            
            // Read response
            int responseCode = conn.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 300) {
                // Read response content
                StringBuilder responseContent = new StringBuilder();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        responseContent.append(responseLine.trim());
                    }
                }
                
                // Parse JSON response
                return (JSONObject) jsonParser.parse(responseContent.toString());
            } else {
                plugin.getLogger().warning("Error getting player data for " + username +
                        ": " + responseCode);
                return null;
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Error getting player data for " + username + ": " + e.getMessage());
            return null;
        }
    }

    // Call this after syncing all player data (e.g., after a batch update or on a timer)
    public void checkAndAnnounceTop3(List<Map<String, Object>> allPlayerData) {
        for (String category : LEADERBOARD_CATEGORIES) {
            String statKey = CATEGORY_STAT_KEY.get(category);
            // Sort all players by this stat descending
            List<Map<String, Object>> sorted = new ArrayList<>(allPlayerData);
            sorted.sort((a, b) -> Double.compare(
                ((Number) b.getOrDefault(statKey, 0)).doubleValue(),
                ((Number) a.getOrDefault(statKey, 0)).doubleValue()
            ));
            // Get top 3 UUIDs and values
            List<String> newTop3 = new ArrayList<>();
            Map<String, Double> newTop3Values = new HashMap<>();
            for (int i = 0; i < Math.min(3, sorted.size()); i++) {
                String uuid = (String) sorted.get(i).get("uuid");
                newTop3.add(uuid);
                newTop3Values.put(uuid, ((Number) sorted.get(i).getOrDefault(statKey, 0)).doubleValue());
            }
            List<String> prevTop3 = previousTop3.getOrDefault(category, new ArrayList<>());
            Map<String, Double> prevValues = previousTop3Values.getOrDefault(category, new HashMap<>());
            // Check for new entries or overtakes
            for (int i = 0; i < newTop3.size(); i++) {
                String uuid = newTop3.get(i);
                String playerName = getPlayerNameByUUID(uuid);
                double value = newTop3Values.get(uuid);
                if (!prevTop3.contains(uuid)) {
                    // New entry in top 3
                    String msg = "§b[Leaderboards] §e" + playerName + " §7has reached §6Top " + (i+1) + " §7in " + capitalize(category) + "!";
                    if (i > 0 && newTop3.get(i-1) != null) {
                        // Show how much they overtook
                        double prevValue = newTop3Values.get(newTop3.get(i-1));
                        double diff = Math.abs(value - prevValue);
                        msg += " (Overtook by " + formatStatDiff(category, diff) + ")";
                    }
                    Bukkit.broadcastMessage(msg);
                } else if (prevTop3.indexOf(uuid) > i) {
                    // Player moved up (e.g., from #3 to #2)
                    String msg = "§b[Leaderboards] §e" + playerName + " §7has overtaken and is now §6Top " + (i+1) + " §7in " + capitalize(category) + "!";
                    double prevValue = prevValues.getOrDefault(uuid, value);
                    double diff = Math.abs(value - prevValue);
                    msg += " (Gained " + formatStatDiff(category, diff) + ")";
                    Bukkit.broadcastMessage(msg);
                }
            }
            // Update previous top 3
            previousTop3.put(category, newTop3);
            previousTop3Values.put(category, newTop3Values);
        }
    }

    // Helper to get player name by UUID (implement as needed)
    private String getPlayerNameByUUID(String uuid) {
        Player player = Bukkit.getPlayer(UUID.fromString(uuid));
        if (player != null) return player.getName();
        // Optionally look up from database or cache
        return uuid.substring(0, 8); // fallback
    }

    // Helper to format stat difference for each category
    private String formatStatDiff(String category, double diff) {
        switch (category) {
            case "playtime":
                int mins = (int) diff;
                int hours = mins / 60;
                mins = mins % 60;
                return (hours > 0 ? hours + "h " : "") + mins + "m";
            case "economy":
                return "$" + String.format("%,.0f", diff);
            case "mcmmo":
                return String.format("%.0f PL", diff);
            case "kills":
                return String.format("%.0f kills", diff);
            case "mining":
                return String.format("%.0f blocks", diff);
            case "achievements":
                return String.format("%.0f achievements", diff);
            default:
                return String.format("%.0f", diff);
        }
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0,1).toUpperCase() + s.substring(1);
    }

    // Schedule regular leaderboard checks (every 5 minutes)
    private void scheduleTop3Check() {
        Bukkit.getScheduler().runTaskTimerAsynchronously(plugin, () -> {
            List<Map<String, Object>> allPlayerData = collectAllOnlinePlayerData();
            checkAndAnnounceTop3(allPlayerData);
            saveTop3ToDisk();
        }, 20L * 60 * 5, 20L * 60 * 5); // 5 minutes in ticks
    }

    // Collect all online player data for leaderboard checks
    private List<Map<String, Object>> collectAllOnlinePlayerData() {
        List<Map<String, Object>> allData = new ArrayList<>();
        for (Player player : Bukkit.getOnlinePlayers()) {
            allData.add(collectPlayerData(player));
        }
        return allData;
    }

    // Save previousTop3 and previousTop3Values to disk
    private void saveTop3ToDisk() {
        try {
            File file = new File(plugin.getDataFolder(), "top3_leaderboards.json");
            JSONObject root = new JSONObject();
            for (String category : previousTop3.keySet()) {
                JSONArray arr = new JSONArray();
                arr.addAll(previousTop3.get(category));
                root.put(category + "_uuids", arr);
                JSONObject values = new JSONObject();
                Map<String, Double> valMap = previousTop3Values.getOrDefault(category, new HashMap<>());
                for (String uuid : valMap.keySet()) {
                    values.put(uuid, valMap.get(uuid));
                }
                root.put(category + "_values", values);
            }
            try (FileWriter fw = new FileWriter(file)) {
                fw.write(root.toJSONString());
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to save top 3 leaderboard data: " + e.getMessage());
        }
    }

    // Load previousTop3 and previousTop3Values from disk
    private void loadTop3FromDisk() {
        try {
            File file = new File(plugin.getDataFolder(), "top3_leaderboards.json");
            if (!file.exists()) return;
            try (FileReader fr = new FileReader(file)) {
                JSONObject root = (JSONObject) jsonParser.parse(fr);
                for (String category : LEADERBOARD_CATEGORIES) {
                    JSONArray arr = (JSONArray) root.get(category + "_uuids");
                    List<String> uuids = new ArrayList<>();
                    if (arr != null) for (Object o : arr) uuids.add((String) o);
                    previousTop3.put(category, uuids);
                    JSONObject values = (JSONObject) root.get(category + "_values");
                    Map<String, Double> valMap = new HashMap<>();
                    if (values != null) for (Object k : values.keySet()) valMap.put((String) k, ((Number) values.get(k)).doubleValue());
                    previousTop3Values.put(category, valMap);
                }
            }
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to load top 3 leaderboard data: " + e.getMessage());
        }
    }

    // Call this after any batch/manual sync
    public void onBatchSyncComplete(List<Map<String, Object>> allPlayerData) {
        checkAndAnnounceTop3(allPlayerData);
        saveTop3ToDisk();
    }

    // Call this in plugin enable/init
    public void initializeTop3Tracking() {
        loadTop3FromDisk();
        scheduleTop3Check();
    }
}