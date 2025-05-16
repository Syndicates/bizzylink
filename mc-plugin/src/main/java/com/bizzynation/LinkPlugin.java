package com.bizzynation;

import com.bizzynation.commands.FriendCommand;
import com.bizzynation.commands.FriendCommandTabCompleter;
import com.bizzynation.commands.LinkCommand;
import com.bizzynation.commands.LinkCommandTabCompleter;
import com.bizzynation.config.ConfigManager;
import com.bizzynation.data.PlayerDataManager;
import com.bizzynation.integrations.EssentialsIntegration;
import com.bizzynation.integrations.LuckPermsIntegration;
import com.bizzynation.integrations.VaultIntegration;
import com.bizzynation.listeners.PlayerListener;
import com.bizzynation.notification.ForumNotificationHandler;
import com.bizzynation.social.FriendManager;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.util.logging.Level;

public class LinkPlugin extends JavaPlugin {
    private static LinkPlugin instance;
    private ConfigManager configManager;
    private PlayerDataManager playerDataManager;
    private VaultIntegration vaultIntegration;
    private LuckPermsIntegration luckPermsIntegration;
    private EssentialsIntegration essentialsIntegration;
    private FriendManager friendManager;
    private ApiService apiService;
    private ForumNotificationHandler forumNotificationHandler;
    private BukkitTask reminderTask;
    private BukkitTask dataSyncTask;
    
    @Override
    public void onEnable() {
        // Set instance
        instance = this;
        
        // Initialize config
        saveDefaultConfig();
        configManager = new ConfigManager(this);
        configManager.loadConfig();
        
        // Initialize integrations
        setupIntegrations();
        
        // Initialize API service
        apiService = new ApiService(this);
        
        // Initialize data manager
        playerDataManager = new PlayerDataManager(this);
        
        // Initialize friend manager
        friendManager = new FriendManager(this);
        
        // Initialize forum notification handler
        forumNotificationHandler = new ForumNotificationHandler(this);
        
        // Test the configuration values and show them in console
        String apiUrl = getApiUrl();
        String verifyEndpoint = getVerifyEndpoint();
        boolean debugMode = getConfig().getBoolean("api.debug", false);
        
        // Pretty console output for easy visibility
        getLogger().info("========================================");
        getLogger().info("        BizzyLink Plugin Enabled        ");
        getLogger().info("========================================");
        getLogger().info("API URL: " + apiUrl);
        getLogger().info("Verify Endpoint: " + verifyEndpoint);
        getLogger().info("Full Verify URL: " + apiUrl + verifyEndpoint);
        getLogger().info("Debug Mode: " + (debugMode ? "ENABLED" : "DISABLED"));
        getLogger().info("Social System: ENABLED");
        getLogger().info("Forum Notifications: ENABLED");
        getLogger().info("----------------------------------------");
        
        // Display verification test command for server admins
        Bukkit.getConsoleSender().sendMessage("§e[BizzyLink] §fTest verification by running: §b/link <code>");
        
        // Register commands
        this.getCommand("link").setExecutor(new LinkCommand(this));
        this.getCommand("link").setTabCompleter(new LinkCommandTabCompleter(this));
        
        // Register friend commands
        FriendCommand friendCommand = new FriendCommand(this, friendManager);
        FriendCommandTabCompleter friendTabCompleter = new FriendCommandTabCompleter(friendManager);
        this.getCommand("friend").setExecutor(friendCommand);
        this.getCommand("friend").setTabCompleter(friendTabCompleter);
        
        // Register event listeners
        getServer().getPluginManager().registerEvents(new PlayerListener(this), this);
        
        // Start tasks
        startTasks();
        
        // Log startup message to console
        MessageUtils.log(Level.INFO, "BizzyLink Plugin Enabled!");
        
        // Final console message
        getLogger().info("========================================");
    }
    
    @Override
    public void onDisable() {
        // Cancel any active tasks
        stopTasks();
        
        // Log shutdown message
        MessageUtils.log(Level.INFO, "BizzyLink Plugin Disabled!");
        
        // Clear instance
        instance = null;
    }
    
    /**
     * Sets up all integrations
     */
    private void setupIntegrations() {
        // Initialize Vault integration
        vaultIntegration = new VaultIntegration(this);
        if (vaultIntegration.isEconomyEnabled()) {
            getLogger().info("Vault Economy integration enabled!");
        }
        
        if (vaultIntegration.isPermissionEnabled()) {
            getLogger().info("Vault Permission integration enabled!");
        }
        
        // Initialize LuckPerms integration
        luckPermsIntegration = new LuckPermsIntegration(this);
        if (luckPermsIntegration.isEnabled()) {
            getLogger().info("LuckPerms integration enabled!");
        }
        
        // Initialize Essentials integration
        essentialsIntegration = new EssentialsIntegration(this);
        if (essentialsIntegration.isEnabled()) {
            getLogger().info("Essentials integration enabled!");
        }
    }
    
    /**
     * Starts all periodic tasks
     */
    private void startTasks() {
        // Start reminder task for unlinked players if enabled
        if (getConfig().getBoolean("reminder.enabled")) {
            startReminderTask();
        }
        
        // Start data sync task if enabled
        if (getConfig().getBoolean("data.sync_enabled", true)) {
            startDataSyncTask();
        }
    }
    
    /**
     * Stops all periodic tasks
     */
    private void stopTasks() {
        if (reminderTask != null) {
            reminderTask.cancel();
            reminderTask = null;
        }
        
        if (dataSyncTask != null) {
            dataSyncTask.cancel();
            dataSyncTask = null;
        }
    }
    
    /**
     * Gets the API URL from config with validation
     * @return The API URL
     */
    public String getApiUrl() {
        String url = getConfig().getString("api.url", "http://localhost:3000");
        
        // Validate URL format
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            getLogger().warning("API URL in config is missing http:// or https:// prefix, adding http://");
            url = "http://" + url;
        }
        
        // Remove trailing slash if present for consistency
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        
        return url;
    }
    
    /**
     * Gets the API verification endpoint with validation
     * @return The verification endpoint
     */
    public String getVerifyEndpoint() {
        String endpoint = getConfig().getString("api.endpoints.verify", "/api/verify");
        
        // Ensure endpoint starts with a forward slash
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        
        return endpoint;
    }
    
    /**
     * Gets the API unlink endpoint with validation
     * @return The unlink endpoint
     */
    public String getUnlinkEndpoint() {
        // Try both possible config paths for backward compatibility
        String endpoint = getConfig().getString("api.endpoints.unlink", null);
        if (endpoint == null) {
            endpoint = getConfig().getString("endpoints.unlink", "/api/minecraft/unlink");
            getLogger().info("Using endpoints.unlink config path: " + endpoint);
        } else {
            getLogger().info("Using api.endpoints.unlink config path: " + endpoint);
        }

        // Ensure endpoint starts with a forward slash
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        
        getLogger().info("Final unlink endpoint: " + endpoint);
        return endpoint;
    }
    
    /**
     * Gets the API player data endpoint with validation
     * @return The player data endpoint
     */
    public String getPlayerDataEndpoint() {
        String endpoint = getConfig().getString("api.endpoints.player_data", "/api/player/%uuid%");
        
        // Ensure endpoint starts with a forward slash
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        
        // Ensure it contains the placeholder
        if (!endpoint.contains("%uuid%") && !endpoint.contains("%username%")) {
            getLogger().warning("Player data endpoint is missing %uuid% or %username% placeholder, adding %uuid%");
            endpoint = endpoint + "/%uuid%";
        }
        
        return endpoint;
    }
    
    /**
     * Gets the API player update endpoint with validation
     * @return The player update endpoint
     */
    public String getPlayerUpdateEndpoint() {
        String endpoint = getConfig().getString("api.endpoints.update_player", "/api/player/update");
        
        // Ensure endpoint starts with a forward slash
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        
        return endpoint;
    }
    
    /**
     * Gets the complete API URL for an endpoint
     * @param endpoint The endpoint to get the URL for
     * @return The complete URL
     */
    public String getFullApiUrl(String endpoint) {
        return getApiUrl() + endpoint;
    }
    
    /**
     * Gets the connection timeout in milliseconds from config
     * @return The connection timeout
     */
    public int getConnectionTimeout() {
        return getConfig().getInt("api.connection_timeout", 10000);
    }
    
    /**
     * Gets whether debug mode is enabled
     * @return True if debug mode is enabled, false otherwise
     */
    public boolean isDebugMode() {
        return getConfig().getBoolean("api.debug", false);
    }
    
    /**
     * Gets the plugin instance
     * @return The plugin instance
     */
    public static LinkPlugin getInstance() {
        return instance;
    }
    
    /**
     * Gets the config manager
     * @return The config manager
     */
    public ConfigManager getConfigManager() {
        return configManager;
    }
    
    /**
     * Gets the player data manager
     * @return The player data manager
     */
    public PlayerDataManager getPlayerDataManager() {
        return playerDataManager;
    }
    
    /**
     * Gets the Vault integration
     * @return The Vault integration
     */
    public VaultIntegration getVaultIntegration() {
        return vaultIntegration;
    }
    
    /**
     * Gets the LuckPerms integration
     * @return The LuckPerms integration
     */
    public LuckPermsIntegration getLuckPermsIntegration() {
        return luckPermsIntegration;
    }
    
    /**
     * Gets the Essentials integration
     * @return The Essentials integration
     */
    public EssentialsIntegration getEssentialsIntegration() {
        return essentialsIntegration;
    }
    
    /**
     * Gets the Friend Manager
     * @return The Friend Manager
     */
    public FriendManager getFriendManager() {
        return friendManager;
    }
    
    /**
     * Gets the API Service
     * @return The API Service
     */
    public ApiService getApiService() {
        return apiService;
    }
    
    /**
     * Gets the Forum Notification Handler
     * @return The Forum Notification Handler
     */
    public ForumNotificationHandler getForumNotificationHandler() {
        return forumNotificationHandler;
    }
    
    /**
     * Reloads the plugin configuration
     */
    public void reloadPluginConfig() {
        reloadConfig();
        configManager.loadConfig();
        
        // Restart tasks
        stopTasks();
        startTasks();
    }
    
    /**
     * Starts the reminder task for unlinked players
     */
    private void startReminderTask() {
        int interval = getConfig().getInt("reminder.interval", 15) * 20 * 60; // Convert minutes to ticks
        
        reminderTask = getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            getServer().getOnlinePlayers().forEach(player -> {
                // Check if player has permission and isn't linked
                if (player.hasPermission("bizzylink.use") && !configManager.isPlayerLinked(player.getUniqueId())) {
                    MessageUtils.sendMessage(player, getConfig().getString("messages.reminder", 
                            "&6[BizzyLink] &eYour account is not linked! Use &6/link &eto connect your account."));
                }
            });
        }, interval, interval);
    }
    
    /**
     * Starts the task to periodically sync player data with the website
     */
    private void startDataSyncTask() {
        // First try to use seconds-based interval for more frequent updates
        int intervalSeconds = getConfig().getInt("data.sync_interval_seconds", 0);
        int intervalTicks;
        
        if (intervalSeconds > 0) {
            // If seconds interval is set, use that (convert to ticks: 20 ticks = 1 second)
            // But enforce a minimum to prevent rate limiting
            if (intervalSeconds < 10) {
                getLogger().warning("Configured sync interval of " + intervalSeconds + " seconds is too low, increasing to 10 seconds to prevent rate limiting");
                intervalSeconds = 10;
            }
            intervalTicks = intervalSeconds * 20;
            getLogger().info("Using rapid sync interval of " + intervalSeconds + " seconds");
        } else {
            // Fall back to minutes-based interval
            int intervalMinutes = getConfig().getInt("data.sync_interval", 5);
            intervalTicks = intervalMinutes * 20 * 60; // Convert minutes to ticks
            getLogger().info("Using standard sync interval of " + intervalMinutes + " minutes");
        }
        
        // Ensure a higher minimum interval of 60 seconds (1200 ticks) to avoid rate limiting
        if (intervalTicks < 1200) {
            getLogger().warning("Enforcing minimum sync interval of 60 seconds to prevent rate limiting");
            intervalTicks = 1200;
        }
        
        dataSyncTask = getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            // Only sync if connected players exist
            if (!getServer().getOnlinePlayers().isEmpty()) {
                if (getConfig().getBoolean("data.debug_sync", false)) {
                    getLogger().info("Running periodic player data sync to website...");
                }
                
                // To prevent rate limiting, add a larger delay between player syncs
                // and process each player individually with an increased interval
                final int[] playerIndex = {0};
                getServer().getScheduler().runTaskTimerAsynchronously(this, new Runnable() {
                    @Override
                    public void run() {
                        // Get all online players as an array
                        org.bukkit.entity.Player[] players = getServer().getOnlinePlayers().toArray(new org.bukkit.entity.Player[0]);
                        
                        // If we've processed all players, cancel this task
                        if (playerIndex[0] >= players.length) {
                            try {
                                // Try to cancel this task - but don't crash if it fails
                                // This is a workaround for a Bukkit scheduler issue
                                getServer().getScheduler().cancelTask(((org.bukkit.scheduler.BukkitTask)this).getTaskId());
                            } catch (Exception e) {
                                // Ignore - the task will expire naturally
                            }
                            return;
                        }
                        
                        // Process the current player
                        org.bukkit.entity.Player player = players[playerIndex[0]];
                        if (player != null && player.isOnline() && configManager.isPlayerLinked(player.getUniqueId())) {
                            boolean syncResult = playerDataManager.syncPlayerData(player);
                            
                            if (getConfig().getBoolean("data.debug_sync", false)) {
                                getLogger().info("Auto-sync for " + player.getName() + " (" + (playerIndex[0] + 1) + 
                                               "/" + players.length + "): " + (syncResult ? "Success" : "Failed"));
                            }
                        }
                        
                        // Move to the next player
                        playerIndex[0]++;
                    }
                }, 0L, 1200L); // Process one player every 60 seconds (1200 ticks) to avoid rate limiting
            }
        }, 20 * 20, intervalTicks); // Start after 20 seconds, then use configured interval
    }
}