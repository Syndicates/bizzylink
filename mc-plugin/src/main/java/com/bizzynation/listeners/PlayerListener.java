package com.bizzynation.listeners;

import com.bizzynation.LinkPlugin;
import com.bizzynation.social.FriendManager;
import com.bizzynation.utils.ApiService;
import com.bizzynation.utils.MessageUtils;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerAdvancementDoneEvent;
import org.bukkit.event.player.PlayerChangedWorldEvent;
import org.bukkit.event.player.PlayerGameModeChangeEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerLevelChangeEvent;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerTeleportEvent;
import org.bukkit.scheduler.BukkitTask;

// Import Vault events if you're using them
import net.milkbowl.vault.economy.Economy;
import net.milkbowl.vault.economy.EconomyResponse;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Listener for player-related events with enhanced data collection
 */
public class PlayerListener implements Listener {
    private final LinkPlugin plugin;
    private int debugCount = 0;
    private final ApiService apiService;
    private final FriendManager friendManager;
    
    // Track sync tasks and player data
    private final Map<UUID, BukkitTask> dataSyncTasks = new HashMap<>();
    private final Map<UUID, Long> lastSyncTime = new HashMap<>();
    private final Map<UUID, Location> lastSyncLocation = new HashMap<>();
    
    public PlayerListener(LinkPlugin plugin) {
        this.plugin = plugin;
        this.apiService = plugin.getApiService();
        this.friendManager = plugin.getFriendManager();
    }
    
    /**
     * Handles player join events
     * @param event The player join event
     */
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Only notify players with permission
        if (!player.hasPermission("bizzylink.use")) {
            return;
        }
        
        // Start tracking playtime
        apiService.startPlaytimeTracking(player);
        
        // Check if player is linked
        boolean isLinked = plugin.getConfigManager().isPlayerLinked(playerUUID);
        
        if (!isLinked) {
            // Check for pending link codes with slight delay to allow server to fully load player
            plugin.getServer().getScheduler().runTaskLaterAsynchronously(plugin, () -> {
                // Try to check for any pending link codes for this player
                boolean foundPendingCode = apiService.checkForPendingLinkCodes(player);
                
                // If no pending codes were found, show the default reminder
                if (!foundPendingCode && plugin.getConfig().getBoolean("join-notification", true)) {
                    // Show reminder on the main thread
                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                        MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.join-reminder", 
                                "&6[BizzyLink] &eYour account is not linked! Visit our website to link your account."));
                        
                        if (plugin.getConfig().getBoolean("show-website-on-join", true)) {
                            MessageUtils.sendMessage(player, plugin.getConfig().getString("messages.website-url", 
                                    "&6Website: &b" + plugin.getConfig().getString("website-url", "https://example.com")));
                        }
                    });
                }
            }, 40L); // 2 seconds delay
        } else if (isLinked) {
            // For linked players, start data sync task
            startDataSyncTask(player);
            
            // Send initial data update
            plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                apiService.sendPlayerData(player);
                // Record sync time and location
                updateSyncTracking(player);
            });
            
            // Load friends list for online notification
            if (player.hasPermission("bizzylink.friends.use")) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    friendManager.loadFriends(player).thenAccept(friends -> {
                        // Notify online friends that this player has joined
                        for (FriendManager.FriendData friend : friends) {
                            Player friendPlayer = plugin.getServer().getPlayer(friend.getUuid());
                            if (friendPlayer != null && friendPlayer.isOnline()) {
                                // Mark friend as online in both players' caches
                                friend.setOnline(true);
                                
                                // Send notification if enabled
                                if (plugin.getConfig().getBoolean("friends.notify_friend_join", true)) {
                                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                                        MessageUtils.sendInfo(friendPlayer, "§d" + player.getName() + " §fhas joined the server");
                                    });
                                }
                            }
                        }
                    });
                });
            }
        }
    }
    
    /**
     * Handles player quit events
     * @param event The player quit event
     */
    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Stop playtime tracking and log the final session time
        apiService.stopPlaytimeTracking(player);
        
        // Cancel any active sync task for this player
        if (dataSyncTasks.containsKey(playerUUID)) {
            dataSyncTasks.get(playerUUID).cancel();
            dataSyncTasks.remove(playerUUID);
        }
        
        // For linked players, update their data on logout
        if (plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                apiService.sendPlayerData(player);
                
                // Clean up tracking maps
                lastSyncTime.remove(playerUUID);
                lastSyncLocation.remove(playerUUID);
            });
            
            // Notify online friends about logout
            if (player.hasPermission("bizzylink.friends.use")) {
                // Get this player's friends and notify them if they're online
                for (Player onlinePlayer : plugin.getServer().getOnlinePlayers()) {
                    if (player == onlinePlayer) continue; // Skip the player who's leaving
                    
                    // Check if this online player is a friend
                    if (friendManager.areFriends(player, onlinePlayer) && 
                            plugin.getConfig().getBoolean("friends.notify_friend_leave", true)) {
                        MessageUtils.sendInfo(onlinePlayer, "§d" + player.getName() + " §fhas left the server");
                    }
                }
            }
        }
        
        // Clear friend cache
        friendManager.clearCache(player);
    }
    
    /**
     * Handles player world change events
     * @param event The world change event
     */
    @EventHandler
    public void onPlayerChangeWorld(PlayerChangedWorldEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Sync player data on world change if enabled
        if (plugin.getConfig().getBoolean("data.sync_on_world_change", true) && 
                plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            // Only sync if enough time has passed since last sync (rate limiting)
            if (shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player gamemode change events
     * @param event The gamemode change event
     */
    @EventHandler
    public void onPlayerGameModeChange(PlayerGameModeChangeEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Sync player data on gamemode change if enabled
        if (plugin.getConfig().getBoolean("data.sync_on_gamemode_change", true) && 
                plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            // Only sync if enough time has passed since last sync (rate limiting)
            if (shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player level change events
     * @param event The level change event
     */
    @EventHandler
    public void onPlayerLevelChange(PlayerLevelChangeEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Sync player data on level change if enabled
        if (plugin.getConfig().getBoolean("data.sync_on_level_up", true) && 
                plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            // Check if the level difference meets the threshold
            int oldLevel = event.getOldLevel();
            int newLevel = event.getNewLevel();
            int levelThreshold = plugin.getConfig().getInt("data.sync_threshold_level", 1);
            
            if (newLevel > oldLevel && (newLevel - oldLevel) >= levelThreshold && shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player death events
     * @param event The death event
     */
    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player player = event.getEntity();
        UUID playerUUID = player.getUniqueId();
        
        // Sync player data on death if enabled
        if (plugin.getConfig().getBoolean("data.sync_on_death", true) && 
                plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            // Only sync if enough time has passed since last sync (rate limiting)
            if (shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player advancement completion events
     * @param event The advancement event
     */
    @EventHandler
    public void onPlayerAdvancement(PlayerAdvancementDoneEvent event) {
        Player player = event.getPlayer();
        UUID playerUUID = player.getUniqueId();
        
        // Sync player data on advancement completion if enabled
        if (plugin.getConfig().getBoolean("data.sync_on_achievement", true) && 
                plugin.getConfigManager().isPlayerLinked(playerUUID)) {
            
            // Only sync if enough time has passed since last sync (rate limiting)
            if (shouldSync(playerUUID)) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player movement events for distance-based syncing
     * @param event The move event
     */
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerMove(PlayerMoveEvent event) {
        // Only process this event if distance-based syncing is enabled
        if (!plugin.getConfig().getBoolean("data.track_locations", true)) {
            return;
        }
        
        // Only check every 10 block movements to reduce CPU usage
        Location fromLocation = event.getFrom();
        Location toLocation = event.getTo();
        
        if (fromLocation.getBlockX() == toLocation.getBlockX() && 
            fromLocation.getBlockY() == toLocation.getBlockY() && 
            fromLocation.getBlockZ() == toLocation.getBlockZ()) {
            return; // Skip if the player hasn't moved to a new block
        }
        
        // Only check every certain number of ticks
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();
        
        // Skip if not linked
        if (!plugin.getConfigManager().isPlayerLinked(playerId)) {
            return;
        }
        
        // Check if we should sync based on distance moved
        if (lastSyncLocation.containsKey(playerId) && shouldSync(playerId)) {
            Location lastLocation = lastSyncLocation.get(playerId);
            double distance = toLocation.distance(lastLocation);
            
            // Sync if player has moved more than sync_distance_moved blocks
            int syncDistance = plugin.getConfig().getInt("data.sync_distance_moved", 1000);
            if (distance >= syncDistance) {
                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    apiService.sendPlayerData(player);
                    updateSyncTracking(player);
                });
            }
        }
    }
    
    /**
     * Handles player teleport events
     * @param event The teleport event
     */
    @EventHandler
    public void onPlayerTeleport(PlayerTeleportEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();
        
        // Skip if not linked
        if (!plugin.getConfigManager().isPlayerLinked(playerId)) {
            return;
        }
        
        // Always update the last location after teleport to avoid triggering
        // a distance-based sync immediately after teleport
        if (event.getCause() != PlayerTeleportEvent.TeleportCause.UNKNOWN) {
            lastSyncLocation.put(playerId, event.getTo().clone());
        }
    }
    
    /**
     * Starts the data synchronization task for a player
     * @param player The player to sync data for
     */
    private void startDataSyncTask(Player player) {
        UUID playerUUID = player.getUniqueId();
        
        // Cancel any existing task
        if (dataSyncTasks.containsKey(playerUUID)) {
            dataSyncTasks.get(playerUUID).cancel();
        }
        
        // Create new task - prioritize real-time updates if enabled
        int intervalSeconds = 0;
        
        // First check for real-time sync interval (fastest)
        if (plugin.getConfig().getBoolean("api.realtime_updates", true)) {
            intervalSeconds = plugin.getConfig().getInt("api.realtime_sync_interval", 3);
        }
        
        // If real-time sync is not configured, use standard sync interval
        if (intervalSeconds <= 0) {
            intervalSeconds = plugin.getConfig().getInt("data.sync_interval_seconds", 0);
        }
        
        // If still no valid interval, fall back to minutes-based interval
        int intervalTicks;
        if (intervalSeconds > 0) {
            // Convert seconds to ticks (20 ticks/sec)
            intervalTicks = intervalSeconds * 20;
        } else {
            // Fall back to minutes-based interval
            int intervalMinutes = plugin.getConfig().getInt("data.sync_interval", 5);
            intervalTicks = intervalMinutes * 1200; // Convert minutes to ticks (20 ticks/sec * 60 sec/min)
        }
        
        // Ensure a minimum interval of 1 second (20 ticks) to prevent server issues
        if (intervalTicks < 20) {
            intervalTicks = 20;
        }
        
        BukkitTask task = plugin.getServer().getScheduler().runTaskTimerAsynchronously(plugin, () -> {
            if (player.isOnline() && plugin.getConfigManager().isPlayerLinked(playerUUID)) {
                apiService.sendPlayerData(player);
                updateSyncTracking(player);
            }
        }, intervalTicks, intervalTicks);
        
        // Store task
        dataSyncTasks.put(playerUUID, task);
    }
    
    /**
     * Determines if enough time has passed since the last sync to sync again
     * @param playerId The player's UUID
     * @return true if we should sync, false otherwise
     */
    private boolean shouldSync(UUID playerId) {
        // Remove the DEBUG OVERRIDE and implement proper rate limiting
        if (!lastSyncTime.containsKey(playerId)) {
            return true; // No record, so yes sync
        }
        
        long now = System.currentTimeMillis();
        long lastSync = lastSyncTime.get(playerId);
        
        // Check if real-time updates are enabled for faster syncing
        if (plugin.getConfig().getBoolean("api.realtime_updates", true)) {
            // For real-time updates, use seconds instead of minutes for more responsiveness
            long elapsedSeconds = TimeUnit.MILLISECONDS.toSeconds(now - lastSync);
            
            // Get the cooldown in seconds - DEFAULT TO 60 SECONDS to be much more conservative
            int realtimeCooldownSeconds = plugin.getConfig().getInt("api.realtime_sync_interval", 60);
            
            // Ensure minimum 60-second cooldown to strongly prevent rate limiting
            if (realtimeCooldownSeconds < 60) {
                realtimeCooldownSeconds = 60;
                if (debugCount % 10 == 0) {
                    plugin.getLogger().info("Rate-limit protection: Enforcing minimum 60-second cooldown");
                }
            }
            
            debugCount++;
            if (debugCount % 50 == 0) {
                plugin.getLogger().info("Sync cooldown: " + elapsedSeconds + "/" + realtimeCooldownSeconds + 
                                       " seconds elapsed for player ID " + playerId);
            }
            
            // If real-time mode enabled, use seconds-based cooldown
            return elapsedSeconds >= realtimeCooldownSeconds;
        } else {
            // Standard cooldown mode
            long elapsedMinutes = TimeUnit.MILLISECONDS.toMinutes(now - lastSync);
            
            // Get the cooldown from config (how many minutes to wait between syncs)
            int cooldownMinutes = plugin.getConfig().getInt("data.max_sync_cooldown", 5);
            
            // Ensure minimum 1-minute cooldown 
            if (cooldownMinutes < 1) {
                cooldownMinutes = 1;
            }
            
            return elapsedMinutes >= cooldownMinutes;
        }
    }
    
    /**
     * Updates the sync tracking information for a player
     * @param player The player
     */
    private void updateSyncTracking(Player player) {
        UUID playerId = player.getUniqueId();
        lastSyncTime.put(playerId, System.currentTimeMillis());
        lastSyncLocation.put(playerId, player.getLocation().clone());
    }
    
    /**
     * Handles player chat events for friend chat highlighting
     * @param event The chat event
     */
    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        // Check if friend chat highlighting is enabled
        if (!plugin.getConfig().getBoolean("friends.highlight_chat", true)) {
            return;
        }
        
        Player sender = event.getPlayer();
        
        // Check if player has permissions to use friend system
        if (!sender.hasPermission("bizzylink.friends.use") || 
            !plugin.getConfigManager().isPlayerLinked(sender.getUniqueId())) {
            return;
        }
        
        // Get the original format
        String originalFormat = event.getFormat();
        
        // For each recipient, custom format the message if they're friends
        for (Player recipient : event.getRecipients()) {
            if (sender != recipient && 
                friendManager.areFriends(sender, recipient) &&
                plugin.getConfigManager().isPlayerLinked(recipient.getUniqueId())) {
                
                // Instead of modifying the event format (which affects everyone),
                // send a custom message just to this recipient and cancel their receipt of the normal message
                final String message = event.getMessage();
                final String friendFormat = plugin.getConfig().getString(
                    "friends.chat_format", 
                    "§d[Friend] §r%1$s: %2$s"
                );
                
                // Remove this recipient from the main recipients set
                event.getRecipients().remove(recipient);
                
                // Send the custom formatted message to just this friend
                plugin.getServer().getScheduler().runTask(plugin, () -> {
                    recipient.sendMessage(String.format(friendFormat, sender.getDisplayName(), message));
                });
            }
        }
    }
}