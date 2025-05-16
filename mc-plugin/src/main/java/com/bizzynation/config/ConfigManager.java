package com.bizzynation.config;

import com.bizzynation.LinkPlugin;
import org.bukkit.Bukkit;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Manages plugin configuration and player data
 */
public class ConfigManager {
    private final LinkPlugin plugin;
    private File dataFile;
    private FileConfiguration dataConfig;
    private final Map<UUID, Boolean> linkedPlayers = new HashMap<>();
    private final Map<UUID, Long> lastSyncTimes = new HashMap<>();
    
    public ConfigManager(LinkPlugin plugin) {
        this.plugin = plugin;
        
        // Load configuration immediately on initialization
        loadConfig();
        
        // Add missing defaults to config
        addMissingConfigDefaults();
    }
    
    /**
     * Adds missing default values to the config.yml file
     */
    private void addMissingConfigDefaults() {
        FileConfiguration config = plugin.getConfig();
        boolean changed = false;
        
        // API settings
        if (!config.contains("api.url")) {
            config.set("api.url", "http://localhost:8090");
            changed = true;
        }
        
        if (!config.contains("api.debug")) {
            config.set("api.debug", false);
            changed = true;
        }
        
        // Data collection and sync settings
        if (!config.contains("data.sync_interval")) {
            config.set("data.sync_interval", 120); // 2 minutes default
            changed = true;
        }
        
        if (!config.contains("data.debug_sync")) {
            config.set("data.debug_sync", false);
            changed = true;
        }
        
        if (!config.contains("data.track_economy")) {
            config.set("data.track_economy", true);
            changed = true;
        }
        
        if (!config.contains("data.track_permissions")) {
            config.set("data.track_permissions", true);
            changed = true;
        }
        
        if (!config.contains("data.track_luckperms")) {
            config.set("data.track_luckperms", true);
            changed = true;
        }
        
        if (!config.contains("data.track_essentials")) {
            config.set("data.track_essentials", true);
            changed = true;
        }
        
        if (!config.contains("data.track_mcmmo")) {
            config.set("data.track_mcmmo", true);
            changed = true;
        }
        
        // mcMMO integration settings
        if (!config.contains("mcmmo.debug")) {
            config.set("mcmmo.debug", false);
            changed = true;
        }
        
        // Only save if we made changes
        if (changed) {
            plugin.saveConfig();
            plugin.getLogger().info("Updated config.yml with missing default values");
        }
    }
    
    /**
     * Loads plugin configuration and player data
     */
    public void loadConfig() {
        // Ensure default config
        plugin.saveDefaultConfig();
        
        // Create data file if it doesn't exist
        dataFile = new File(plugin.getDataFolder(), "playerdata.yml");
        if (!dataFile.exists()) {
            try {
                // Create parent directory if it doesn't exist
                if (!plugin.getDataFolder().exists()) {
                    plugin.getDataFolder().mkdirs();
                }
                dataFile.createNewFile();
                plugin.getLogger().info("Created playerdata.yml");
            } catch (IOException e) {
                plugin.getLogger().severe("Could not create playerdata.yml: " + e.getMessage());
            }
        }
        
        // Load data file
        dataConfig = YamlConfiguration.loadConfiguration(dataFile);
        
        // Load linked players into memory
        if (dataConfig.contains("linked-players")) {
            for (String uuidString : dataConfig.getConfigurationSection("linked-players").getKeys(false)) {
                try {
                    UUID uuid = UUID.fromString(uuidString);
                    boolean linked = dataConfig.getBoolean("linked-players." + uuidString);
                    linkedPlayers.put(uuid, linked);
                    
                    // Load last sync time if available
                    if (dataConfig.contains("sync-times." + uuidString)) {
                        long lastSync = dataConfig.getLong("sync-times." + uuidString);
                        lastSyncTimes.put(uuid, lastSync);
                    }
                } catch (IllegalArgumentException e) {
                    plugin.getLogger().warning("Invalid UUID in playerdata.yml: " + uuidString);
                }
            }
            plugin.getLogger().info("Loaded " + linkedPlayers.size() + " linked players from data file");
        }
    }
    
    /**
     * Saves player data to file
     */
    public void saveData() {
        if (dataConfig == null || dataFile == null) {
            return;
        }
        
        try {
            dataConfig.save(dataFile);
            if (plugin.getConfig().getBoolean("api.debug", false)) {
                plugin.getLogger().info("Saved player data to file");
            }
        } catch (IOException e) {
            plugin.getLogger().severe("Could not save playerdata.yml: " + e.getMessage());
        }
    }
    
    /**
     * Checks if a player is linked
     * @param uuid Player UUID
     * @return True if the player is linked
     */
    public boolean isPlayerLinked(UUID uuid) {
        // First check the in-memory cache
        Boolean cachedStatus = linkedPlayers.get(uuid);
        
        // If we have a cached true status, return it
        if (cachedStatus != null && cachedStatus) {
            return true;
        }
        
        // If we don't have a cached status or it's false, check the data file
        if (dataConfig.contains("linked-players." + uuid.toString())) {
            boolean fileStatus = dataConfig.getBoolean("linked-players." + uuid.toString());
            
            // Update the cache with the file status
            linkedPlayers.put(uuid, fileStatus);
            
            // If the file status is true, return it
            if (fileStatus) {
                return true;
            }
        }
        
        // If we still don't have a true status, return false
        return false;
    }
    
    /**
     * Sets a player's linked status
     * @param uuid Player UUID
     * @param linked Linked status
     */
    public void setPlayerLinked(UUID uuid, boolean linked) {
        linkedPlayers.put(uuid, linked);
        dataConfig.set("linked-players." + uuid.toString(), linked);
        
        // Record the link time if becoming linked
        if (linked) {
            dataConfig.set("link-times." + uuid.toString(), System.currentTimeMillis());
        }
        
        saveData();
        
        // Log the action
        plugin.getLogger().log(Level.INFO, "Player {0} is now {1}linked", 
                new Object[] { uuid.toString(), linked ? "" : "un" });
    }
    
    /**
     * Clear all pending link data (for the /link unlink or when requested by backend)
     * @param uuid Player UUID
     */
    public void clearLinkData(UUID uuid) {
        linkedPlayers.put(uuid, false);
        dataConfig.set("linked-players." + uuid.toString(), false);
        saveData();
        
        plugin.getLogger().info("Cleared link data for player " + uuid);
    }
    
    /**
     * Updates the last sync time for a player
     * @param uuid Player UUID
     */
    public void updateLastSyncTime(UUID uuid) {
        long now = System.currentTimeMillis();
        lastSyncTimes.put(uuid, now);
        dataConfig.set("sync-times." + uuid.toString(), now);
        saveData();
    }
    
    /**
     * Gets the last sync time for a player
     * @param uuid Player UUID
     * @return The last sync time in milliseconds, or 0 if never synced
     */
    public long getLastSyncTime(UUID uuid) {
        return lastSyncTimes.getOrDefault(uuid, 0L);
    }
    
    /**
     * Gets the time when a player was linked
     * @param uuid Player UUID
     * @return The link time in milliseconds, or 0 if not found
     */
    public long getLinkTime(UUID uuid) {
        return dataConfig.getLong("link-times." + uuid.toString(), 0);
    }
    
    /**
     * Clears any cached data for a player to ensure fresh data on next sync
     * @param uuid Player UUID
     */
    public void clearCache(UUID uuid) {
        // Remove from in-memory caches
        lastSyncTimes.remove(uuid);
        
        // Only log if the player was linked
        if (!linkedPlayers.getOrDefault(uuid, false)) {
            plugin.getLogger().fine("Attempted to clear cache for player " + uuid + " who is not linked");
        } else {
            plugin.getLogger().info("Cleared cache for player " + uuid);
        }
    }
    
    /**
     * Reloads the configuration and player data
     */
    public void reload() {
        // Reload main config
        plugin.reloadConfig();
        
        // Add any missing defaults
        addMissingConfigDefaults();
        
        // Reload player data
        loadConfig();
        
        plugin.getLogger().info("Configuration and player data reloaded");
    }
}